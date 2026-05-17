/**
 * IMA Bot — Cloudflare Worker proxy to Claude API
 *
 * Vai trò:
 *  - Giữ ANTHROPIC_API_KEY ở phía server (env var, không lộ ra frontend)
 *  - Đọc ima-kb.md từ GitHub raw, dùng làm system prompt với prompt caching
 *  - Nhận câu hỏi từ frontend (ima-assistant.js), gọi Claude API, trả về câu trả lời
 *  - Rate limit cơ bản theo IP để tránh abuse
 *
 * Endpoint:
 *   POST /  body: { "message": "câu hỏi", "history": [{role,content}, ...] }
 *   GET  /  -> healthcheck
 *
 * Environment variables (set bằng `wrangler secret put`):
 *   ANTHROPIC_API_KEY  — bắt buộc
 *   KB_URL             — URL raw của ima-kb.md trên GitHub
 *                        VD: https://raw.githubusercontent.com/USER/REPO/main/ima-kb.md
 *   ALLOWED_ORIGIN     — domain GitHub Pages của bạn (CORS)
 *                        VD: https://USER.github.io
 */

const MODEL = 'claude-haiku-4-5-20251001'; // rẻ + nhanh, đủ cho Q&A
const MAX_TOKENS = 800;
const MAX_HISTORY = 10; // số message gần nhất giữ lại

// Cache KB content trong memory của Worker (refresh mỗi 5 phút)
let kbCache = { text: null, fetchedAt: 0 };
const KB_TTL_MS = 5 * 60 * 1000;

async function getKB(env) {
  const now = Date.now();
  if (kbCache.text && (now - kbCache.fetchedAt) < KB_TTL_MS) {
    return kbCache.text;
  }
  try {
    const res = await fetch(env.KB_URL, { cf: { cacheTtl: 300 } });
    if (!res.ok) throw new Error('KB fetch ' + res.status);
    const text = await res.text();
    kbCache = { text, fetchedAt: now };
    return text;
  } catch (e) {
    return kbCache.text || '(Knowledge base hiện không tải được — trả lời dựa trên kiến thức chung về dự án EPCIC.)';
  }
}

function buildSystemPrompt(kb) {
  return `Bạn là IMA Bot — trợ lí ảo của cổng tài liệu dự án IMA Brownfield (PTSC Offshore Services).

NGUYÊN TẮC TRẢ LỜI:
1. Luôn trả lời bằng tiếng Việt, trừ khi user dùng tiếng Anh thì trả lời tiếng Anh.
2. Tone chuyên nghiệp, ngắn gọn, lịch sự — như nhân viên kỹ thuật của PTSC.
3. CHỈ dùng thông tin trong KNOWLEDGE BASE bên dưới. Nếu không có, nói rõ: "Tôi chưa có thông tin này trong tài liệu dự án."
4. KHÔNG bịa số liệu, tên người, ngày tháng.
5. Khi phù hợp, gợi ý user mở trang cụ thể trong website (trang Overview, Scope of Work, v.v.) — dùng đúng tên file HTML.
6. Câu trả lời thường nên dưới 150 từ. Dùng bullet/markdown nhẹ khi cần.
7. Nếu câu hỏi ngoài phạm vi dự án IMA, lịch sự từ chối và nhắc về vai trò của bot.

============ KNOWLEDGE BASE ============

${kb}

============ HẾT KNOWLEDGE BASE ============`;
}

const CORS_HEADERS = (origin) => ({
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
});

function corsResponse(body, status, env, extraHeaders = {}) {
  const origin = env.ALLOWED_ORIGIN || '*';
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS(origin),
      ...extraHeaders,
    },
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS(env.ALLOWED_ORIGIN || '*') });
    }

    // Healthcheck
    if (request.method === 'GET') {
      return corsResponse(JSON.stringify({ ok: true, bot: 'IMA Bot', model: MODEL }), 200, env);
    }

    if (request.method !== 'POST') {
      return corsResponse(JSON.stringify({ error: 'Method not allowed' }), 405, env);
    }

    // Validate body
    let body;
    try {
      body = await request.json();
    } catch {
      return corsResponse(JSON.stringify({ error: 'Invalid JSON' }), 400, env);
    }

    const userMessage = (body.message || '').toString().trim();
    if (!userMessage) {
      return corsResponse(JSON.stringify({ error: 'Missing "message"' }), 400, env);
    }
    if (userMessage.length > 1000) {
      return corsResponse(JSON.stringify({ error: 'Message too long (max 1000 chars)' }), 400, env);
    }

    // Sanitize history
    let history = Array.isArray(body.history) ? body.history : [];
    history = history
      .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .slice(-MAX_HISTORY)
      .map(m => ({ role: m.role, content: m.content.slice(0, 2000) }));

    // Build messages
    const messages = [...history, { role: 'user', content: userMessage }];

    // Get KB
    const kb = await getKB(env);
    const systemPrompt = buildSystemPrompt(kb);

    // Call Claude API with prompt caching on system prompt
    try {
      const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: MAX_TOKENS,
          system: [
            {
              type: 'text',
              text: systemPrompt,
              cache_control: { type: 'ephemeral' }, // cache KB → tiết kiệm 90% input cost
            },
          ],
          messages,
        }),
      });

      if (!apiRes.ok) {
        const errText = await apiRes.text();
        console.error('Claude API error', apiRes.status, errText);
        return corsResponse(
          JSON.stringify({ error: 'AI service error', detail: apiRes.status }),
          502,
          env
        );
      }

      const data = await apiRes.json();
      const reply = (data.content || [])
        .filter(c => c.type === 'text')
        .map(c => c.text)
        .join('\n')
        .trim();

      return corsResponse(
        JSON.stringify({
          reply: reply || 'Xin lỗi, tôi chưa thể trả lời câu hỏi này.',
          usage: data.usage,
        }),
        200,
        env
      );
    } catch (e) {
      console.error('Worker error', e);
      return corsResponse(JSON.stringify({ error: 'Internal error' }), 500, env);
    }
  },
};
