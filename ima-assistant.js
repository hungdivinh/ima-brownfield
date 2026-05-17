/**
 * IMA Brownfield Website — Virtual Assistant (Robot)
 *
 * Trợ lí ảo dạng floating widget, vanilla JS thuần, không phụ thuộc.
 * - Hình robot SVG chuyên nghiệp, animation mắt nháy + antenna pulse
 * - Knowledge base nội bộ về dự án IMA Brownfield
 * - Tự inject CSS vào <style> (không tạo file CSS mới)
 * - Tôn trọng prefers-reduced-motion
 * - Không can thiệp Gantt chart hay các phần tử nhạy cảm
 */
(function () {
  'use strict';

  if (window.__imaAssistantLoaded) return;
  window.__imaAssistantLoaded = true;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ═══════════════════════════════════════════════════════════════
     0. WORKER ENDPOINT (Claude API proxy)
     Đặt rỗng "" để dùng rule-based offline (KB bên dưới).
  ═══════════════════════════════════════════════════════════════ */
  const WORKER_URL = 'https://ima-bot.trungminhphan97.workers.dev';
  const USE_WORKER = !!WORKER_URL;
  const HISTORY_MAX = 10;

  /* ═══════════════════════════════════════════════════════════════
     1. KNOWLEDGE BASE (fallback offline khi Worker lỗi)
  ═══════════════════════════════════════════════════════════════ */
  const KB = [
    {
      keys: ['dự án', 'ima', 'brownfield', 'là gì', 'tổng quan', 'overview', 'giới thiệu'],
      a: '<b>IMA Brownfield Project</b> là dự án phát triển mỏ khí thượng nguồn (Gas Processing Facility upstream) tại Việt Nam, do <b>PTSC Offshore Services</b> thực hiện. Bao gồm nâng cấp giàn hiện hữu, lắp đặt thiết bị xử lý khí, và tích hợp hệ thống mới với cơ sở hạ tầng đang vận hành.',
      link: { href: '01. Overview.html', text: 'Mở trang Tổng quan →' }
    },
    {
      keys: ['ptsc', 'chủ đầu tư', 'nhà thầu', 'ai làm', 'đơn vị'],
      a: '<b>PTSC Offshore Services</b> là đơn vị thực hiện dự án IMA Brownfield, chịu trách nhiệm EPCIC (Engineering, Procurement, Construction, Installation & Commissioning).'
    },
    {
      keys: ['hợp đồng', 'contract', 'chiến lược', 'strategy'],
      a: '<b>Chiến lược hợp đồng</b> phân chia theo các gói EPC/EPCIC, kèm phụ lục (Exhibit), bản tin kỹ thuật (Bulletin) và yêu cầu làm rõ (Clarification). Xem chi tiết tại trang Contract Strategies.',
      link: { href: '02. Contract Strategies.html', text: 'Mở Contract Strategies →' }
    },
    {
      keys: ['scope', 'phạm vi', 'công việc', 'sow', 'làm những gì'],
      a: '<b>Scope of Work</b> bao gồm: Engineering, Procurement, Fabrication, Installation, Hook-up & Commissioning. Các work-package được tổ chức theo gói thầu với HSE, Logistics, và yêu cầu kỹ thuật riêng.',
      link: { href: '03. Scope of Work.html', text: 'Mở Scope of Work →' }
    },
    {
      keys: ['execution', 'plan', 'kế hoạch', 'thực thi', 'pep', 'thực hiện'],
      a: '<b>Project Execution Plan (PEP)</b> mô tả phương pháp triển khai, tổ chức nhân sự, quản lý chất lượng, HSE, interface, risk management và communication plan.',
      link: { href: '04. Project Execution Plan.html', text: 'Mở Execution Plan →' }
    },
    {
      keys: ['manhour', 'nhân công', 'tiến độ', 'schedule', 'gantt', 'thời gian', 'khi nào'],
      a: '<b>Manhours & Schedule</b> hiển thị tổng số giờ công theo work-package và Gantt chart tiến độ tổng. Mở trang để xem timeline chi tiết.',
      link: { href: '05. Manhours & Schedule.html', text: 'Mở Manhours & Schedule →' }
    },
    {
      keys: ['team', 'đội', 'nhân sự', 'thành viên', 'ai trong', 'cán bộ'],
      a: '<b>Đội ngũ dự án</b> gồm Project Manager, Engineering Manager, các Lead chuyên môn (Structural, Process, Piping, E&I, HSE) và đội thi công ngoài khơi.',
      link: { href: '06. IMA Brownfield Project Team.html', text: 'Mở Project Team →' }
    },
    {
      keys: ['hình', 'ảnh', 'image', 'tài liệu', 'document', 'photo', 'tải'],
      a: '<b>Images & Documents</b> chứa thư viện hình ảnh hiện trường, sơ đồ kỹ thuật và các tài liệu tham chiếu chính của dự án.',
      link: { href: '07. Images & Documents.html', text: 'Mở Images & Documents →' }
    },
    {
      keys: ['tender', 'brain', 'search', 'tìm kiếm', 'knowledge', 'graph', 'neural'],
      a: '<b>Tender Brain Search</b> là knowledge-graph trực quan (Canvas 2D) gồm 51 node theo phong cách Obsidian — gõ từ khóa hoặc click node để khám phá các tài liệu liên quan.',
      link: { href: '08. Tender Brain Search.html', text: 'Mở Tender Brain →' }
    },
    {
      keys: ['hse', 'an toàn', 'safety', 'môi trường'],
      a: '<b>HSE</b> (Health, Safety, Environment) là yêu cầu xuyên suốt mọi work-package — tuân thủ tiêu chuẩn PTSC và yêu cầu của chủ đầu tư cho hoạt động offshore.'
    },
    {
      keys: ['logistics', 'vận chuyển', 'tàu', 'marine', 'cảng'],
      a: '<b>Logistics</b> bao gồm vận chuyển vật tư từ bãi chế tạo ra giàn, marine spread, helicopter, vật tư consumable và quản lý kho.'
    },
    {
      keys: ['mật khẩu', 'password', 'đăng nhập', 'login', 'session'],
      a: 'Hệ thống đăng nhập dùng SHA-256 (Web Crypto API), session lưu ở <code>sessionStorage</code> với key <code>ima_auth_v1</code>. Khi đóng tab session sẽ hết — đây là cơ chế cho mục đích nội bộ/demo.'
    },
    {
      keys: ['liên hệ', 'contact', 'email', 'điện thoại', 'phone'],
      a: 'Để liên hệ về dự án, vui lòng tham khảo trang <b>Project Team</b> để xem thông tin các đầu mối phụ trách từng lĩnh vực.',
      link: { href: '06. IMA Brownfield Project Team.html', text: 'Mở Project Team →' }
    },
    {
      keys: ['bạn là ai', 'tên gì', 'who are you', 'trợ lí', 'trợ lý', 'assistant', 'bot'],
      a: 'Tôi là <b>IMA Bot</b> — trợ lí ảo của cổng tài liệu dự án IMA Brownfield. Tôi có thể giải đáp về tổng quan dự án, scope, hợp đồng, đội ngũ, tiến độ và điều hướng bạn đến đúng trang cần xem.'
    },
    {
      keys: ['cảm ơn', 'thanks', 'thank', 'tks', 'cám ơn'],
      a: 'Rất hân hạnh được hỗ trợ! Nếu có thêm câu hỏi về dự án IMA Brownfield, cứ gõ vào đây nhé. 🤖'
    },
    {
      keys: ['xin chào', 'chào', 'hello', 'hi', 'hey'],
      a: 'Xin chào! Tôi là <b>IMA Bot</b>. Bạn muốn hỏi về phần nào của dự án — Overview, Contract, Scope, Tiến độ, hay Đội ngũ?'
    }
  ];

  const SUGGESTIONS = [
    'Tổng quan dự án IMA?',
    'Scope of Work gồm những gì?',
    'Đội ngũ dự án',
    'Tiến độ & manhours',
    'Tender Brain là gì?'
  ];

  /* ═══════════════════════════════════════════════════════════════
     2. SEARCH / MATCH
  ═══════════════════════════════════════════════════════════════ */
  function normalize(s) {
    return (s || '').toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '') // bỏ dấu tiếng Việt
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function findAnswer(q) {
    const nq = normalize(q);
    if (!nq) return null;
    let best = null;
    let bestScore = 0;
    KB.forEach(function (item) {
      let score = 0;
      item.keys.forEach(function (k) {
        const nk = normalize(k);
        if (nq.includes(nk)) score += nk.length;
      });
      if (score > bestScore) { bestScore = score; best = item; }
    });
    return best;
  }

  /* ═══════════════════════════════════════════════════════════════
     3. CSS (inject vào <style>)
  ═══════════════════════════════════════════════════════════════ */
  const CSS = `
  .ima-bot-fab {
    position: fixed; right: 22px; bottom: 22px; z-index: 9998;
    width: 64px; height: 64px; border-radius: 50%;
    background: linear-gradient(135deg, #24397A 0%, #1a2a5e 60%, #0f1e48 100%);
    box-shadow: 0 8px 24px rgba(36,57,122,0.4), 0 0 0 2px rgba(202,238,251,0.15);
    cursor: pointer; border: none;
    display: flex; align-items: center; justify-content: center;
    transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s;
  }
  .ima-bot-fab:hover { transform: scale(1.08) translateY(-2px); box-shadow: 0 12px 32px rgba(36,57,122,0.55), 0 0 0 3px rgba(202,238,251,0.3); }
  .ima-bot-fab:active { transform: scale(0.96); }
  .ima-bot-fab svg { width: 38px; height: 38px; }
  .ima-bot-fab .ima-bot-pulse {
    position: absolute; inset: -4px; border-radius: 50%;
    border: 2px solid rgba(202,238,251,0.55);
    animation: imaBotPulse 2.2s ease-out infinite;
    pointer-events: none;
  }
  @keyframes imaBotPulse {
    0%   { transform: scale(0.95); opacity: 0.8; }
    100% { transform: scale(1.35); opacity: 0;   }
  }
  .ima-bot-badge {
    position: absolute; top: -2px; right: -2px;
    width: 14px; height: 14px; border-radius: 50%;
    background: #4ade80; border: 2px solid #fff;
    box-shadow: 0 0 8px rgba(74,222,128,0.7);
  }

  .ima-bot-panel {
    position: fixed; right: 22px; bottom: 100px; z-index: 9999;
    width: 360px; max-width: calc(100vw - 32px);
    height: 520px; max-height: calc(100vh - 140px);
    background: #ffffff;
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(15,30,72,0.25), 0 0 0 1px rgba(36,57,122,0.08);
    display: flex; flex-direction: column;
    overflow: hidden;
    transform-origin: bottom right;
    transform: scale(0.85) translateY(20px); opacity: 0;
    pointer-events: none;
    transition: transform 0.32s cubic-bezier(0.16,1,0.3,1), opacity 0.24s ease;
    font-family: 'Times New Roman', Times, serif;
  }
  .ima-bot-panel.open { transform: scale(1) translateY(0); opacity: 1; pointer-events: auto; }

  .ima-bot-header {
    background: linear-gradient(135deg, #24397A 0%, #1a2a5e 100%);
    color: #fff; padding: 14px 16px;
    display: flex; align-items: center; gap: 12px;
    border-bottom: 1px solid rgba(202,238,251,0.2);
  }
  .ima-bot-avatar {
    width: 40px; height: 40px; border-radius: 50%;
    background: linear-gradient(135deg, #CAEEFB 0%, #5B8FE8 100%);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 0 0 2px rgba(255,255,255,0.15);
  }
  .ima-bot-avatar svg { width: 26px; height: 26px; }
  .ima-bot-title { font-family: Georgia, serif; font-size: 15px; font-weight: 700; letter-spacing: 0.3px; }
  .ima-bot-status { font-size: 11px; opacity: 0.85; display: flex; align-items: center; gap: 5px; margin-top: 2px; }
  .ima-bot-status::before {
    content: ''; width: 7px; height: 7px; border-radius: 50%;
    background: #4ade80; box-shadow: 0 0 6px #4ade80;
  }
  .ima-bot-close {
    margin-left: auto; background: transparent; border: none; color: #fff;
    width: 30px; height: 30px; border-radius: 50%; cursor: pointer;
    font-size: 20px; line-height: 1;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.2s;
  }
  .ima-bot-close:hover { background: rgba(255,255,255,0.15); }

  .ima-bot-messages {
    flex: 1; overflow-y: auto; padding: 16px;
    background: #eef2f8;
    display: flex; flex-direction: column; gap: 10px;
    scrollbar-width: thin; scrollbar-color: #24397A33 transparent;
  }
  .ima-bot-messages::-webkit-scrollbar { width: 6px; }
  .ima-bot-messages::-webkit-scrollbar-thumb { background: #24397A33; border-radius: 3px; }

  .ima-bot-msg {
    max-width: 86%; padding: 9px 13px; border-radius: 14px;
    font-size: 13.5px; line-height: 1.5; word-wrap: break-word;
    animation: imaBotMsgIn 0.32s cubic-bezier(0.16,1,0.3,1);
  }
  @keyframes imaBotMsgIn {
    from { transform: translateY(8px); opacity: 0; }
    to   { transform: translateY(0);   opacity: 1; }
  }
  .ima-bot-msg.bot {
    align-self: flex-start; background: #fff;
    border: 1px solid rgba(36,57,122,0.1);
    border-bottom-left-radius: 4px;
    color: #1a2a5e;
  }
  .ima-bot-msg.user {
    align-self: flex-end;
    background: linear-gradient(135deg, #24397A 0%, #1a2a5e 100%);
    color: #fff;
    border-bottom-right-radius: 4px;
  }
  .ima-bot-msg a {
    display: inline-block; margin-top: 6px; padding: 5px 10px;
    background: linear-gradient(135deg, #CAEEFB 0%, #5B8FE8 100%);
    color: #0f1e48; font-weight: 600; font-size: 12px;
    border-radius: 8px; text-decoration: none;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .ima-bot-msg a:hover { transform: translateY(-1px); box-shadow: 0 4px 10px rgba(36,57,122,0.25); }
  .ima-bot-msg code {
    background: rgba(36,57,122,0.08); padding: 1px 5px; border-radius: 4px;
    font-family: 'Share Tech Mono', monospace; font-size: 12px;
  }

  .ima-bot-typing { display: inline-flex; gap: 4px; padding: 4px 0; }
  .ima-bot-typing span {
    width: 7px; height: 7px; border-radius: 50%;
    background: #24397A; opacity: 0.4;
    animation: imaBotDot 1.2s ease-in-out infinite;
  }
  .ima-bot-typing span:nth-child(2) { animation-delay: 0.15s; }
  .ima-bot-typing span:nth-child(3) { animation-delay: 0.3s; }
  @keyframes imaBotDot {
    0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
    30%           { opacity: 1;   transform: translateY(-4px); }
  }

  .ima-bot-suggest {
    display: flex; flex-wrap: wrap; gap: 6px;
    padding: 0 16px 10px;
    background: #eef2f8;
  }
  .ima-bot-chip {
    background: #fff; border: 1px solid rgba(36,57,122,0.18);
    color: #24397A; font-size: 12px; padding: 5px 10px;
    border-radius: 14px; cursor: pointer;
    transition: all 0.2s;
    font-family: inherit;
  }
  .ima-bot-chip:hover {
    background: #24397A; color: #fff; border-color: #24397A;
    transform: translateY(-1px);
  }

  .ima-bot-input {
    padding: 12px; background: #fff;
    border-top: 1px solid rgba(36,57,122,0.1);
    display: flex; gap: 8px;
  }
  .ima-bot-input input {
    flex: 1; padding: 9px 12px;
    border: 1px solid rgba(36,57,122,0.2);
    border-radius: 10px; outline: none;
    font-size: 13.5px; font-family: inherit;
    color: #1a2a5e; background: #f7f9fc;
    transition: border-color 0.2s, background 0.2s;
  }
  .ima-bot-input input:focus { border-color: #24397A; background: #fff; }
  .ima-bot-input button {
    background: linear-gradient(135deg, #24397A 0%, #1a2a5e 100%);
    color: #fff; border: none; padding: 0 14px;
    border-radius: 10px; cursor: pointer;
    font-weight: 600; font-size: 14px;
    transition: transform 0.2s, box-shadow 0.2s;
    display: flex; align-items: center; justify-content: center;
  }
  .ima-bot-input button:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(36,57,122,0.35); }
  .ima-bot-input button svg { width: 18px; height: 18px; }

  /* Robot eye blink animation */
  @keyframes imaBotBlink {
    0%, 92%, 100% { transform: scaleY(1); }
    95%, 97%      { transform: scaleY(0.1); }
  }
  .ima-bot-eye { transform-origin: center; animation: imaBotBlink 4s infinite; }

  /* Antenna pulse */
  @keyframes imaBotAntenna {
    0%, 100% { fill: #CAEEFB; }
    50%      { fill: #ffffff; filter: drop-shadow(0 0 3px #CAEEFB); }
  }
  .ima-bot-antenna { animation: imaBotAntenna 1.6s ease-in-out infinite; }

  @media print {
    .ima-bot-fab, .ima-bot-panel { display: none !important; }
  }
  @media (prefers-reduced-motion: reduce) {
    .ima-bot-fab .ima-bot-pulse,
    .ima-bot-eye, .ima-bot-antenna { animation: none !important; }
  }
  @media (max-width: 480px) {
    .ima-bot-panel { right: 12px; left: 12px; width: auto; bottom: 92px; }
    .ima-bot-fab { right: 14px; bottom: 14px; width: 56px; height: 56px; }
    .ima-bot-fab svg { width: 32px; height: 32px; }
  }
  `;

  /* ═══════════════════════════════════════════════════════════════
     4. ROBOT SVG (chuyên nghiệp, hai mắt, antenna)
  ═══════════════════════════════════════════════════════════════ */
  const ROBOT_SVG_FAB = `
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <!-- antenna -->
      <line x1="32" y1="6" x2="32" y2="13" stroke="#CAEEFB" stroke-width="2" stroke-linecap="round"/>
      <circle class="ima-bot-antenna" cx="32" cy="5" r="3" fill="#CAEEFB"/>
      <!-- head -->
      <rect x="14" y="14" width="36" height="30" rx="9"
            fill="url(#imaBotHead)" stroke="#CAEEFB" stroke-width="1.2"/>
      <defs>
        <linearGradient id="imaBotHead" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#eaf6ff"/>
          <stop offset="1" stop-color="#a8d8f5"/>
        </linearGradient>
      </defs>
      <!-- visor -->
      <rect x="18" y="20" width="28" height="13" rx="5" fill="#0f1e48"/>
      <!-- eyes -->
      <circle class="ima-bot-eye" cx="26" cy="26.5" r="2.6" fill="#CAEEFB"/>
      <circle class="ima-bot-eye" cx="38" cy="26.5" r="2.6" fill="#CAEEFB"/>
      <!-- mouth grille -->
      <rect x="24" y="37" width="16" height="2.4" rx="1.2" fill="#24397A"/>
      <!-- ears -->
      <rect x="11" y="24" width="3" height="10" rx="1.5" fill="#CAEEFB"/>
      <rect x="50" y="24" width="3" height="10" rx="1.5" fill="#CAEEFB"/>
      <!-- neck/body hint -->
      <rect x="22" y="44" width="20" height="6" rx="2" fill="#24397A" opacity="0.7"/>
      <rect x="18" y="50" width="28" height="6" rx="3" fill="url(#imaBotHead)" stroke="#CAEEFB" stroke-width="1"/>
    </svg>
  `;

  const ROBOT_SVG_AVATAR = `
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <line x1="32" y1="8" x2="32" y2="14" stroke="#0f1e48" stroke-width="2" stroke-linecap="round"/>
      <circle class="ima-bot-antenna" cx="32" cy="7" r="2.5" fill="#0f1e48"/>
      <rect x="16" y="14" width="32" height="28" rx="8" fill="#fff" stroke="#0f1e48" stroke-width="1.5"/>
      <rect x="20" y="20" width="24" height="12" rx="4" fill="#0f1e48"/>
      <circle class="ima-bot-eye" cx="27" cy="26" r="2.4" fill="#CAEEFB"/>
      <circle class="ima-bot-eye" cx="37" cy="26" r="2.4" fill="#CAEEFB"/>
      <rect x="25" y="36" width="14" height="2" rx="1" fill="#0f1e48"/>
    </svg>
  `;

  const SEND_ICON = `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 11.5L21 3l-8.5 18-2-8L3 11.5z" stroke="#fff" stroke-width="1.8" stroke-linejoin="round" fill="rgba(255,255,255,0.15)"/>
    </svg>
  `;

  /* ═══════════════════════════════════════════════════════════════
     5. BUILD UI
  ═══════════════════════════════════════════════════════════════ */
  function injectStyle() {
    if (document.getElementById('ima-bot-style')) return;
    const style = document.createElement('style');
    style.id = 'ima-bot-style';
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  function build() {
    injectStyle();

    // FAB
    const fab = document.createElement('button');
    fab.className = 'ima-bot-fab';
    fab.setAttribute('aria-label', 'Mở trợ lí ảo IMA');
    fab.innerHTML = `
      ${prefersReduced ? '' : '<span class="ima-bot-pulse"></span>'}
      ${ROBOT_SVG_FAB}
      <span class="ima-bot-badge" aria-hidden="true"></span>
    `;

    // Panel
    const panel = document.createElement('div');
    panel.className = 'ima-bot-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Trợ lí ảo IMA Bot');
    panel.innerHTML = `
      <div class="ima-bot-header">
        <div class="ima-bot-avatar">${ROBOT_SVG_AVATAR}</div>
        <div>
          <div class="ima-bot-title">IMA Bot</div>
          <div class="ima-bot-status">Đang trực tuyến</div>
        </div>
        <button class="ima-bot-close" aria-label="Đóng">×</button>
      </div>
      <div class="ima-bot-messages" id="imaBotMessages"></div>
      <div class="ima-bot-suggest" id="imaBotSuggest"></div>
      <form class="ima-bot-input" id="imaBotForm">
        <input type="text" id="imaBotInput" placeholder="Hỏi về dự án IMA Brownfield..." autocomplete="off" />
        <button type="submit" aria-label="Gửi">${SEND_ICON}</button>
      </form>
    `;

    document.body.appendChild(fab);
    document.body.appendChild(panel);

    const messages = panel.querySelector('#imaBotMessages');
    const suggest = panel.querySelector('#imaBotSuggest');
    const form = panel.querySelector('#imaBotForm');
    const input = panel.querySelector('#imaBotInput');
    const closeBtn = panel.querySelector('.ima-bot-close');

    /* Suggested chips */
    SUGGESTIONS.forEach(function (s) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'ima-bot-chip';
      chip.textContent = s;
      chip.addEventListener('click', function () {
        ask(s);
      });
      suggest.appendChild(chip);
    });

    function addMsg(html, who) {
      const div = document.createElement('div');
      div.className = 'ima-bot-msg ' + (who || 'bot');
      div.innerHTML = html;
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
      return div;
    }

    function addTyping() {
      const div = document.createElement('div');
      div.className = 'ima-bot-msg bot';
      div.innerHTML = '<div class="ima-bot-typing"><span></span><span></span><span></span></div>';
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
      return div;
    }

    /* Lịch sử hội thoại cho multi-turn */
    const history = [];

    function answerOffline(q) {
      const found = findAnswer(q);
      if (found) {
        let html = found.a;
        if (found.link) {
          html += '<br><a href="' + found.link.href + '">' + found.link.text + '</a>';
        }
        return html;
      }
      return 'Tôi chưa rõ câu hỏi này. Bạn thử hỏi theo từ khóa như: <b>tổng quan</b>, <b>scope</b>, <b>hợp đồng</b>, <b>tiến độ</b>, <b>đội ngũ</b>, hoặc <b>tender brain</b>. Bạn cũng có thể mở <a href="08. Tender Brain Search.html">Tender Brain Search</a> để tra cứu trực quan.';
    }

    /* Chuyển markdown đơn giản → HTML (cho output từ Claude) */
    function mdToHtml(s) {
      const esc = escapeHtml(s);
      return esc
        .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
        .replace(/\*(.+?)\*/g, '<i>$1</i>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
        .replace(/^\s*-\s+(.+)$/gm, '• $1')
        .replace(/\n/g, '<br>');
    }

    async function askWorker(q) {
      const res = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: q,
          history: history.slice(-HISTORY_MAX),
        }),
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      if (!data.reply) throw new Error('Empty reply');
      return data.reply;
    }

    async function ask(q) {
      addMsg(escapeHtml(q), 'user');
      input.value = '';
      const typing = addTyping();

      if (USE_WORKER) {
        try {
          const reply = await askWorker(q);
          typing.remove();
          addMsg(mdToHtml(reply), 'bot');
          history.push({ role: 'user', content: q });
          history.push({ role: 'assistant', content: reply });
          return;
        } catch (err) {
          console.warn('[IMA Bot] Worker failed, fallback to offline:', err);
          // rơi xuống offline mode bên dưới
        }
      }

      // Offline / fallback
      const delay = prefersReduced ? 100 : 400;
      setTimeout(function () {
        typing.remove();
        addMsg(answerOffline(q), 'bot');
      }, delay);
    }

    /* Welcome */
    addMsg(
      'Xin chào! Tôi là <b>IMA Bot</b> 🤖 — trợ lí ảo của cổng tài liệu dự án <b>IMA Brownfield</b>. Bạn cần tôi giúp gì hôm nay?',
      'bot'
    );

    /* Events */
    function open() {
      panel.classList.add('open');
      setTimeout(function () { input.focus(); }, 200);
    }
    function close() { panel.classList.remove('open'); }
    function toggle() { panel.classList.contains('open') ? close() : open(); }

    fab.addEventListener('click', toggle);
    closeBtn.addEventListener('click', close);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const q = input.value.trim();
      if (q) ask(q);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) close();
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
