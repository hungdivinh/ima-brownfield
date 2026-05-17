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
      keys: ['who are you', 'your name', 'what are you', 'assistant', 'bạn là ai', 'tên gì', 'trợ lí', 'trợ lý'],
      a: 'I am the <b>IMA Project Assistant</b> — the digital assistant for the IMA Brownfield Project document portal. I can help with project overview, contract strategy, scope, schedule, team, and navigation across the portal.'
    },
    {
      keys: ['cảm ơn', 'thanks', 'thank', 'tks', 'cám ơn'],
      a: 'Rất hân hạnh được hỗ trợ! Nếu có thêm câu hỏi về dự án IMA Brownfield, cứ gõ vào đây nhé. 🤖'
    },
    {
      keys: ['xin chào', 'chào', 'hello', 'hi', 'hey'],
      a: 'Hello! I am the <b>IMA Project Assistant</b>. Which area would you like to ask about — Overview, Contract, Scope, Schedule, or Team?'
    }
  ];

  const SUGGESTIONS = [
    'Project overview?',
    'What is the Scope of Work?',
    'Project team & key personnel',
    'Schedule & key dates',
    'Performance guarantees'
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
  /* ── Rich markdown content inside bot messages ── */
  .ima-bot-msg.bot { padding: 11px 14px; }
  .ima-bot-msg.bot > *:first-child { margin-top: 0; }
  .ima-bot-msg.bot > *:last-child  { margin-bottom: 0; }

  .ima-bot-msg.bot p {
    margin: 6px 0;
    line-height: 1.55;
  }

  .ima-bot-msg.bot h3, .ima-bot-msg.bot h4, .ima-bot-msg.bot h5, .ima-bot-msg.bot h6 {
    margin: 12px 0 5px 0;
    color: #0f1e48;
    font-family: Georgia, 'Times New Roman', serif;
    font-weight: 700;
    line-height: 1.3;
    letter-spacing: 0.1px;
  }
  .ima-bot-msg.bot h3 {
    font-size: 15px;
    padding-bottom: 4px;
    border-bottom: 1px solid rgba(36,57,122,0.18);
  }
  .ima-bot-msg.bot h4 { font-size: 14px; color: #24397A; }
  .ima-bot-msg.bot h5,
  .ima-bot-msg.bot h6 { font-size: 13px; color: #24397A; }

  .ima-bot-msg.bot ul, .ima-bot-msg.bot ol {
    margin: 6px 0 6px 4px;
    padding-left: 18px;
  }
  .ima-bot-msg.bot li {
    margin: 3px 0;
    line-height: 1.5;
  }
  .ima-bot-msg.bot li::marker { color: #24397A; }

  .ima-bot-msg.bot strong, .ima-bot-msg.bot b {
    color: #0f1e48;
    font-weight: 700;
  }
  .ima-bot-msg.bot em, .ima-bot-msg.bot i { color: #24397A; }

  /* Inline link (markdown) — clean underline */
  .ima-bot-msg.bot a {
    color: #24397A;
    text-decoration: underline;
    text-underline-offset: 2px;
    font-weight: 600;
  }
  .ima-bot-msg.bot a:hover { color: #0f1e48; text-decoration-thickness: 2px; }

  /* Legacy "nav button" link (offline fallback adds these) */
  .ima-bot-msg.bot a.nav-btn,
  .ima-bot-msg.bot p > a:only-child {
    display: inline-block; margin-top: 6px; padding: 5px 11px;
    background: linear-gradient(135deg, #CAEEFB 0%, #5B8FE8 100%);
    color: #0f1e48 !important; font-weight: 600; font-size: 12px;
    border-radius: 8px; text-decoration: none;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .ima-bot-msg.bot a.nav-btn:hover,
  .ima-bot-msg.bot p > a:only-child:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 10px rgba(36,57,122,0.25);
    text-decoration: none;
  }

  .ima-bot-msg.bot code {
    background: rgba(36,57,122,0.09);
    padding: 1px 5px;
    border-radius: 4px;
    font-family: 'Share Tech Mono', Consolas, 'Courier New', monospace;
    font-size: 12px;
    color: #1a2a5e;
    word-break: break-word;
  }
  .ima-bot-msg.bot pre {
    background: #0f1e48; color: #CAEEFB;
    padding: 9px 11px; border-radius: 7px;
    overflow-x: auto;
    margin: 8px 0;
    font-size: 11.5px; line-height: 1.5;
  }
  .ima-bot-msg.bot pre code {
    background: transparent; padding: 0;
    color: inherit; font-size: 11.5px;
  }

  /* Tables — compact, readable, scrollable on overflow */
  .ima-bot-msg.bot table {
    border-collapse: collapse;
    margin: 8px 0;
    width: 100%;
    font-size: 12.5px;
    background: #fff;
    box-shadow: 0 1px 3px rgba(36,57,122,0.08);
    border-radius: 6px;
    overflow: hidden;
  }
  .ima-bot-msg.bot th, .ima-bot-msg.bot td {
    border: 1px solid rgba(36,57,122,0.15);
    padding: 6px 9px;
    text-align: left;
    vertical-align: top;
    line-height: 1.45;
  }
  .ima-bot-msg.bot th {
    background: linear-gradient(180deg, #24397A 0%, #1a2a5e 100%);
    color: #fff;
    font-weight: 700;
    font-size: 12px;
    letter-spacing: 0.2px;
    border-color: #0f1e48;
  }
  .ima-bot-msg.bot tbody tr:nth-child(even) td { background: #f5f8fc; }
  .ima-bot-msg.bot td:first-child { font-weight: 600; color: #1a2a5e; }

  .ima-bot-msg.bot blockquote {
    margin: 8px 0;
    padding: 6px 11px;
    border-left: 3px solid #24397A;
    background: rgba(36,57,122,0.05);
    color: #1a2a5e;
    border-radius: 0 6px 6px 0;
    font-style: italic;
  }

  .ima-bot-msg.bot hr {
    border: none;
    border-top: 1px solid rgba(36,57,122,0.18);
    margin: 10px 0;
  }

  /* Streaming cursor — nhấp nháy như terminal */
  .ima-bot-cursor {
    display: inline-block;
    width: 7px; height: 1em;
    margin-left: 2px;
    background: #24397A;
    vertical-align: -2px;
    animation: imaBotCursorBlink 0.95s steps(2) infinite;
    border-radius: 1px;
  }
  @keyframes imaBotCursorBlink {
    0%, 49%   { opacity: 1; }
    50%, 100% { opacity: 0; }
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

  /* ── Robot expressions & animations ── */

  /* SVG transform-origin helpers (so CSS transforms reference element bbox, not page coords) */
  .ima-bot-eyes, .ima-bot-pupils, .ima-bot-head,
  .ima-bot-chest, .ima-bot-mouth, .ima-bot-antenna-tip {
    transform-box: fill-box;
    transform-origin: center;
  }

  /* Synchronized eye blink */
  @keyframes imaBotBlink {
    0%, 46%, 54%, 92%, 96%, 100% { transform: scaleY(1); }
    49%, 51%, 94%                { transform: scaleY(0.08); }
  }
  .ima-bot-eyes { animation: imaBotBlink 5.5s infinite; }

  /* Eyes dart left/right occasionally — "looking around" */
  @keyframes imaBotEyeDart {
    0%, 27%, 33%, 63%, 69%, 100% { transform: translateX(0); }
    30%   { transform: translateX(-1.4px); }
    66%   { transform: translateX(1.4px); }
  }
  .ima-bot-pupils { animation: imaBotEyeDart 7s ease-in-out infinite; }

  /* Head subtle breathe / bob */
  @keyframes imaBotBreathe {
    0%, 100% { transform: translateY(0) scale(1); }
    50%      { transform: translateY(-0.7px) scale(1.012); }
  }
  .ima-bot-head { animation: imaBotBreathe 3.6s ease-in-out infinite; }

  /* Antenna tip glow */
  @keyframes imaBotAntenna {
    0%, 100% { fill: #CAEEFB; filter: drop-shadow(0 0 1px #CAEEFB); }
    50%      { fill: #ffffff; filter: drop-shadow(0 0 4px #CAEEFB); }
  }
  .ima-bot-antenna-tip { animation: imaBotAntenna 1.6s ease-in-out infinite; }

  /* Chest LED soft pulse */
  @keyframes imaBotChest {
    0%, 100% { opacity: 0.55; transform: scale(1); }
    50%      { opacity: 1;    transform: scale(1.3); }
  }
  .ima-bot-chest { animation: imaBotChest 2.2s ease-in-out infinite; }

  /* Mouth subtle smile breathe */
  @keyframes imaBotMouthBreathe {
    0%, 100% { opacity: 0.85; }
    50%      { opacity: 1; }
  }
  .ima-bot-mouth { animation: imaBotMouthBreathe 3.6s ease-in-out infinite; }

  /* FAB gentle float (whole inner SVG bobs up/down) */
  @keyframes imaBotFloat {
    0%, 100% { transform: translateY(0); }
    50%      { transform: translateY(-3px); }
  }
  .ima-bot-fab-inner { animation: imaBotFloat 3.4s ease-in-out infinite; }

  /* "Thinking" expression — head shakes lightly, eyes blink faster, chest glows quicker */
  .ima-bot-fab.thinking .ima-bot-head    { animation: imaBotThinkHead 0.9s ease-in-out infinite; }
  .ima-bot-fab.thinking .ima-bot-eyes    { animation-duration: 1.4s; }
  .ima-bot-fab.thinking .ima-bot-chest   { animation-duration: 0.7s; }
  .ima-bot-fab.thinking .ima-bot-mouth   { animation: imaBotThinkMouth 0.7s ease-in-out infinite; }
  @keyframes imaBotThinkHead {
    0%, 100% { transform: translateY(0) rotate(0); }
    25%      { transform: translateY(-0.5px) rotate(-1.5deg); }
    75%      { transform: translateY(-0.5px) rotate(1.5deg); }
  }
  @keyframes imaBotThinkMouth {
    0%, 100% { opacity: 0.4; transform: scaleX(0.7); }
    50%      { opacity: 1;   transform: scaleX(1); }
  }

  @media print {
    .ima-bot-fab, .ima-bot-panel { display: none !important; }
  }
  @media (prefers-reduced-motion: reduce) {
    .ima-bot-fab .ima-bot-pulse,
    .ima-bot-eyes, .ima-bot-pupils, .ima-bot-head,
    .ima-bot-antenna-tip, .ima-bot-chest, .ima-bot-mouth,
    .ima-bot-fab-inner { animation: none !important; }
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
    <svg class="ima-bot-fab-inner" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="imaBotHeadG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#f4faff"/>
          <stop offset="1" stop-color="#a3d2ef"/>
        </linearGradient>
        <linearGradient id="imaBotVisorG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#0a1230"/>
          <stop offset="1" stop-color="#1f3268"/>
        </linearGradient>
        <radialGradient id="imaBotEyeG" cx="0.35" cy="0.35" r="0.7">
          <stop offset="0" stop-color="#ffffff"/>
          <stop offset="0.4" stop-color="#CAEEFB"/>
          <stop offset="1" stop-color="#5BB0E0"/>
        </radialGradient>
      </defs>

      <!-- Antenna -->
      <line x1="32" y1="3" x2="32" y2="11" stroke="#CAEEFB" stroke-width="1.8" stroke-linecap="round" opacity="0.9"/>
      <circle class="ima-bot-antenna-tip" cx="32" cy="3" r="2.4" fill="#CAEEFB"/>

      <!-- Side ears / antennae -->
      <rect x="9" y="23" width="3" height="13" rx="1.5" fill="#CAEEFB" opacity="0.85"/>
      <rect x="52" y="23" width="3" height="13" rx="1.5" fill="#CAEEFB" opacity="0.85"/>

      <!-- Head (animated as a group: breathe) -->
      <g class="ima-bot-head">
        <!-- Head shell -->
        <rect x="12" y="12" width="40" height="34" rx="13"
              fill="url(#imaBotHeadG)" stroke="#7ec4e8" stroke-width="0.9"/>
        <!-- Top highlight -->
        <rect x="16" y="14" width="32" height="3" rx="1.5" fill="rgba(255,255,255,0.45)"/>

        <!-- Visor -->
        <rect x="16.5" y="19" width="31" height="17" rx="7.5"
              fill="url(#imaBotVisorG)" stroke="#050a1f" stroke-width="0.6"/>
        <!-- Visor reflection -->
        <rect x="19" y="20.5" width="26" height="2" rx="1" fill="rgba(202,238,251,0.15)"/>

        <!-- Eyes (synchronized blink wraps both, dart wraps pupils) -->
        <g class="ima-bot-eyes">
          <g class="ima-bot-pupils">
            <circle cx="25" cy="27" r="3.1" fill="url(#imaBotEyeG)"/>
            <circle cx="25.9" cy="26.2" r="0.9" fill="#ffffff"/>
            <circle cx="39" cy="27" r="3.1" fill="url(#imaBotEyeG)"/>
            <circle cx="39.9" cy="26.2" r="0.9" fill="#ffffff"/>
          </g>
        </g>

        <!-- Mouth: subtle smile curve -->
        <path class="ima-bot-mouth" d="M 26 41 Q 32 44 38 41"
              stroke="#CAEEFB" stroke-width="1.6" stroke-linecap="round" fill="none"/>

        <!-- Cheek indicator lights -->
        <circle cx="15" cy="32" r="1.1" fill="#7dd6f0" opacity="0.55"/>
        <circle cx="49" cy="32" r="1.1" fill="#7dd6f0" opacity="0.55"/>
      </g>

      <!-- Neck -->
      <rect x="25" y="46" width="14" height="4" rx="1.8" fill="#24397A" opacity="0.55"/>

      <!-- Shoulders / chest -->
      <rect x="14" y="50" width="36" height="10" rx="5"
            fill="url(#imaBotHeadG)" stroke="#7ec4e8" stroke-width="0.6"/>
      <!-- Chest LED -->
      <circle class="ima-bot-chest" cx="32" cy="55" r="1.7" fill="#4ade80"/>
    </svg>
  `;

  const ROBOT_SVG_AVATAR = `
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="imaBotAvHeadG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ffffff"/>
          <stop offset="1" stop-color="#e1f0fb"/>
        </linearGradient>
        <radialGradient id="imaBotAvEyeG" cx="0.35" cy="0.35" r="0.7">
          <stop offset="0" stop-color="#ffffff"/>
          <stop offset="0.5" stop-color="#5B8FE8"/>
          <stop offset="1" stop-color="#24397A"/>
        </radialGradient>
      </defs>

      <!-- Antenna -->
      <line x1="32" y1="5" x2="32" y2="13" stroke="#0f1e48" stroke-width="1.7" stroke-linecap="round"/>
      <circle class="ima-bot-antenna-tip" cx="32" cy="5" r="2.2" fill="#0f1e48"/>

      <!-- Side ears -->
      <rect x="11" y="24" width="2.5" height="11" rx="1.2" fill="#0f1e48" opacity="0.75"/>
      <rect x="50.5" y="24" width="2.5" height="11" rx="1.2" fill="#0f1e48" opacity="0.75"/>

      <!-- Head group (breathe) -->
      <g class="ima-bot-head">
        <rect x="14" y="14" width="36" height="32" rx="11"
              fill="url(#imaBotAvHeadG)" stroke="#0f1e48" stroke-width="1.3"/>
        <rect x="18" y="16" width="28" height="2.5" rx="1.2" fill="rgba(255,255,255,0.7)"/>

        <!-- Visor -->
        <rect x="18" y="21" width="28" height="15" rx="6.5" fill="#0f1e48"/>
        <rect x="20" y="22.5" width="24" height="1.6" rx="0.8" fill="rgba(202,238,251,0.18)"/>

        <!-- Eyes -->
        <g class="ima-bot-eyes">
          <g class="ima-bot-pupils">
            <circle cx="26" cy="28" r="2.7" fill="url(#imaBotAvEyeG)"/>
            <circle cx="26.7" cy="27.3" r="0.7" fill="#ffffff"/>
            <circle cx="38" cy="28" r="2.7" fill="url(#imaBotAvEyeG)"/>
            <circle cx="38.7" cy="27.3" r="0.7" fill="#ffffff"/>
          </g>
        </g>

        <!-- Smile -->
        <path class="ima-bot-mouth" d="M 27 40.5 Q 32 43 37 40.5"
              stroke="#0f1e48" stroke-width="1.5" stroke-linecap="round" fill="none"/>
      </g>
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
    fab.setAttribute('aria-label', 'Open IMA Project Assistant');
    fab.innerHTML = `
      ${prefersReduced ? '' : '<span class="ima-bot-pulse"></span>'}
      ${ROBOT_SVG_FAB}
      <span class="ima-bot-badge" aria-hidden="true"></span>
    `;

    // Panel
    const panel = document.createElement('div');
    panel.className = 'ima-bot-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'IMA Project Assistant');
    panel.innerHTML = `
      <div class="ima-bot-header">
        <div class="ima-bot-avatar">${ROBOT_SVG_AVATAR}</div>
        <div>
          <div class="ima-bot-title">IMA Project Assistant</div>
          <div class="ima-bot-status">Online</div>
        </div>
        <button class="ima-bot-close" aria-label="Close">×</button>
      </div>
      <div class="ima-bot-messages" id="imaBotMessages"></div>
      <div class="ima-bot-suggest" id="imaBotSuggest"></div>
      <form class="ima-bot-input" id="imaBotForm">
        <input type="text" id="imaBotInput" placeholder="Ask about the IMA Brownfield Project..." autocomplete="off" />
        <button type="submit" aria-label="Send">${SEND_ICON}</button>
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

    /* Đảm bảo phần ĐẦU của message mới hiện trong view (không phải đáy) */
    function revealMsgTop(div) {
      requestAnimationFrame(function () {
        const msgTop = div.offsetTop;
        const viewTop = messages.scrollTop;
        const viewBottom = viewTop + messages.clientHeight;
        // Nếu top của message nằm ngoài view (dưới hoặc trên), kéo về cách trên 12px
        if (msgTop < viewTop || msgTop > viewBottom - 40) {
          messages.scrollTo({ top: Math.max(0, msgTop - 12), behavior: 'smooth' });
        }
      });
    }

    function addMsg(html, who) {
      const div = document.createElement('div');
      div.className = 'ima-bot-msg ' + (who || 'bot');
      div.innerHTML = html;
      messages.appendChild(div);
      // User messages → snap xuống đáy như cũ (vì user vừa gõ, muốn thấy mình gõ gì)
      // Bot messages dùng addBotStream — không gọi addMsg
      if (who === 'user') {
        messages.scrollTop = messages.scrollHeight;
      } else {
        revealMsgTop(div);
      }
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

    /* Stream bot reply: type out plain text gradually, then swap to formatted HTML.
       Quan trọng: KHÔNG auto-scroll xuống đáy khi xong — để user đọc từ trên xuống. */
    function addBotStream(finalHtml) {
      const div = document.createElement('div');
      div.className = 'ima-bot-msg bot';
      messages.appendChild(div);
      revealMsgTop(div);

      // Plain text dùng để type ra dần (không hiện link/bold trong khi đang type)
      const tmp = document.createElement('div');
      tmp.innerHTML = finalHtml;
      const plain = (tmp.textContent || tmp.innerText || '').trim();

      // Reduced motion hoặc câu rất ngắn → render ngay
      if (prefersReduced || plain.length < 40) {
        div.innerHTML = finalHtml;
        revealMsgTop(div);
        return div;
      }

      // Cấu hình tốc độ: ~280 chars/sec, tổng cap 6s
      const targetCps = 280;
      const totalDuration = Math.min((plain.length / targetCps) * 1000, 6000);
      const tickMs = 24;
      const totalTicks = Math.max(1, Math.round(totalDuration / tickMs));
      const charsPerTick = Math.max(1, Math.ceil(plain.length / totalTicks));
      let i = 0;
      let cancelled = false;

      function tick() {
        if (cancelled) return;
        i = Math.min(i + charsPerTick, plain.length);
        if (i >= plain.length) {
          div.innerHTML = finalHtml; // swap sang HTML có format
          return;
        }
        // Hiện partial text + cursor nhấp nháy
        div.innerHTML = escapeHtml(plain.substring(0, i)) + '<span class="ima-bot-cursor"></span>';
        setTimeout(tick, tickMs);
      }
      setTimeout(tick, 60);

      // Cho phép user bấm vào message để skip animation và hiện ngay
      div.addEventListener('click', function () {
        if (i < plain.length) {
          cancelled = true;
          i = plain.length;
          div.innerHTML = finalHtml;
        }
      }, { once: true });

      return div;
    }

    /* Lịch sử hội thoại cho multi-turn */
    const history = [];

    function answerOffline(q) {
      const found = findAnswer(q);
      if (found) {
        let html = found.a;
        if (found.link) {
          html += '<br><a class="nav-btn" href="' + found.link.href + '">' + found.link.text + '</a>';
        }
        return html;
      }
      return 'I am temporarily unable to access the project knowledge base. For specific enquiries, please contact the <b>IMA Brownfield Management Team</b>, or browse the document portal: <a class="nav-btn" href="08. Tender Brain Search.html">Tender Brain Search</a>.';
    }

    /* Chuyển markdown → HTML (output từ Claude).
       Hỗ trợ: headings, tables, ul/ol, paragraphs, blockquote, hr, code block,
                inline bold/italic/code/link. */
    function mdToHtml(src) {
      if (!src) return '';
      src = String(src).replace(/\r\n?/g, '\n');

      // 1. Tách code blocks (```...```) trước, giữ nguyên nội dung bên trong
      const codeBlocks = [];
      src = src.replace(/```([a-z]*)\n?([\s\S]*?)```/gi, function (_, lang, body) {
        codeBlocks.push(body.replace(/\n+$/, ''));
        return ' CODE' + (codeBlocks.length - 1) + ' ';
      });

      function inline(text) {
        // Escape HTML trước
        let t = escapeHtml(text);
        // Inline code (backtick)
        t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
        // Bold ** ** (làm trước italic vì *...* sẽ match phần trong ** **)
        t = t.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');
        // Italic * * (single)
        t = t.replace(/(^|[^\*])\*([^\*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
        // Markdown link [text](url) — chỉ cho phép http/https/relative
        t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, function (_, label, url) {
          const safe = /^(https?:|\.|\/|[A-Za-z0-9._\-%]+\.html)/.test(url);
          if (!safe) return label;
          const ext = /^https?:/.test(url) ? ' target="_blank" rel="noopener"' : '';
          return '<a href="' + url + '"' + ext + '>' + label + '</a>';
        });
        return t;
      }

      function parseRow(line) {
        return line.trim().replace(/^\||\|$/g, '').split('|').map(function (c) { return c.trim(); });
      }

      const lines = src.split('\n');
      const out = [];
      let i = 0;

      while (i < lines.length) {
        const line = lines[i];

        // Code block placeholder
        const cm = line.match(/^ CODE(\d+) $/);
        if (cm) {
          out.push('<pre><code>' + escapeHtml(codeBlocks[+cm[1]]) + '</code></pre>');
          i++; continue;
        }

        // Empty line — ngắt block
        if (!line.trim()) { i++; continue; }

        // Horizontal rule
        if (/^\s*-{3,}\s*$/.test(line) || /^\s*\*{3,}\s*$/.test(line)) {
          out.push('<hr>');
          i++; continue;
        }

        // Heading
        const h = line.match(/^\s*(#{1,6})\s+(.+?)\s*#*\s*$/);
        if (h) {
          const lvl = Math.min(6, h[1].length + 2); // H1 → h3, H2 → h4, H3 → h5
          out.push('<h' + lvl + '>' + inline(h[2]) + '</h' + lvl + '>');
          i++; continue;
        }

        // Table: header row | + separator row |---|
        if (/^\s*\|.+\|\s*$/.test(line) && i + 1 < lines.length && /^\s*\|?\s*[-:]+[-:|\s]*\|?\s*$/.test(lines[i + 1])) {
          const headers = parseRow(line);
          i += 2;
          const rows = [];
          while (i < lines.length && /^\s*\|.+\|\s*$/.test(lines[i])) {
            rows.push(parseRow(lines[i]));
            i++;
          }
          let tbl = '<table><thead><tr>';
          headers.forEach(function (h) { tbl += '<th>' + inline(h) + '</th>'; });
          tbl += '</tr></thead><tbody>';
          rows.forEach(function (r) {
            tbl += '<tr>';
            r.forEach(function (c) { tbl += '<td>' + inline(c) + '</td>'; });
            tbl += '</tr>';
          });
          tbl += '</tbody></table>';
          out.push(tbl);
          continue;
        }

        // Blockquote
        if (/^\s*>\s?/.test(line)) {
          const buf = [];
          while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
            buf.push(lines[i].replace(/^\s*>\s?/, ''));
            i++;
          }
          out.push('<blockquote>' + inline(buf.join(' ')) + '</blockquote>');
          continue;
        }

        // Unordered list
        if (/^\s*[-*+]\s+/.test(line)) {
          const items = [];
          while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
            items.push(lines[i].replace(/^\s*[-*+]\s+/, ''));
            i++;
          }
          out.push('<ul>' + items.map(function (t) { return '<li>' + inline(t) + '</li>'; }).join('') + '</ul>');
          continue;
        }

        // Ordered list
        if (/^\s*\d+\.\s+/.test(line)) {
          const items = [];
          while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
            items.push(lines[i].replace(/^\s*\d+\.\s+/, ''));
            i++;
          }
          out.push('<ol>' + items.map(function (t) { return '<li>' + inline(t) + '</li>'; }).join('') + '</ol>');
          continue;
        }

        // Paragraph — gom các dòng liền nhau (không phải block khác) thành 1 <p>
        const pBuf = [line];
        i++;
        while (i < lines.length && lines[i].trim() &&
               !/^\s*(#{1,6}\s|>\s?|[-*+]\s|\d+\.\s|\|.+\||-{3,}|\*{3,}| CODE)/.test(lines[i])) {
          pBuf.push(lines[i]);
          i++;
        }
        out.push('<p>' + inline(pBuf.join(' ')) + '</p>');
      }

      return out.join('');
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
      fab.classList.add('thinking');

      if (USE_WORKER) {
        try {
          const reply = await askWorker(q);
          typing.remove();
          fab.classList.remove('thinking');
          addBotStream(mdToHtml(reply));
          history.push({ role: 'user', content: q });
          history.push({ role: 'assistant', content: reply });
          return;
        } catch (err) {
          console.warn('[IMA Project Assistant] Worker failed, fallback to offline:', err);
          // rơi xuống offline mode bên dưới
        }
      }

      // Offline / fallback
      const delay = prefersReduced ? 100 : 400;
      setTimeout(function () {
        typing.remove();
        fab.classList.remove('thinking');
        addBotStream(answerOffline(q));
      }, delay);
    }

    /* Welcome */
    addMsg(
      'Hello! I am the <b>IMA Project Assistant</b> 🤖 — your guide to the <b>IMA Gas Field Development — Brownfield Modification & Integration Works</b> document portal. How may I assist you today?',
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
