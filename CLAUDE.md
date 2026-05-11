# CLAUDE.md — IMA Brownfield Project

## Tổng quan dự án

Cổng tài liệu web bảo mật cho dự án phát triển mỏ khí IMA (Gas Processing Facility upstream) tại Việt Nam, do **PTSC Offshore Services** thực hiện. Ứng dụng static HTML/CSS/JavaScript thuần, không framework, không build tool.

---

## Cấu trúc file

```
index.html                           # Trang đăng nhập (entry point)
01. Overview.html                    # Tổng quan dự án
02. Contract Strategies.html         # Chiến lược hợp đồng
03. Scope of Work.html               # Phạm vi công việc
04. Project Execution Plan.html      # Kế hoạch thực thi (2.1MB)
05. Manhours & Schedule.html         # Nhân công & tiến độ (Gantt chart)
06. IMA Brownfield Project Team.html # Đội ngũ dự án
07. Images & Documents.html          # Hình ảnh & tài liệu
08. Tender Brain Search.html         # Knowledge graph / neural brain (Canvas 2D)
ima-animations.js                    # Engine animation (load vào mọi trang nội dung)
ima-animations.css                   # CSS animation layer (inject tự động bởi JS)
assets/                              # Ảnh, logo, sơ đồ
```

---

## Quy tắc kiến trúc

### Zero dependencies
- Không dùng npm, không framework (React/Vue/Angular), không CDN runtime.
- Mọi thứ là vanilla HTML/CSS/JS thuần.
- Không có build step — deploy thẳng file tĩnh lên web server.

### Tách biệt trang đăng nhập và trang nội dung
- `index.html` là trang login duy nhất với giao diện cyberpunk HUD.
- Mỗi trang nội dung (01–07) kiểm tra session **ngay dòng đầu tiên** trong `<head>`:
  ```html
  <script>if(sessionStorage.getItem("ima_auth_v1")!=="1"){location.replace("index.html");};</script>
  ```
- Không được xóa hoặc di chuyển đoạn script này.

### CSS không được tách file riêng
- Styles toàn cục (navbar, footer, reset) được inline trong mỗi trang nội dung.
- `ima-animations.css` được **inject tự động** bởi `ima-animations.js` — không cần `<link>` thủ công.
- Không tạo thêm file CSS ngoài `ima-animations.css`.

---

## Quy tắc Authentication

### Session key
- Key: `sessionStorage.ima_auth_v1`
- Giá trị hợp lệ: `"1"`
- Dùng `sessionStorage` (không phải `localStorage`) — session hết khi đóng tab.

### Password hash
- Thuật toán: SHA-256 (Web Crypto API)
- Hash hiện tại: `2137ef137d82ffebb7f62d520f573ef33f8385d107e3e80618b723e395b34a7b`
- Hash được hardcode trong `index.html` — nếu đổi mật khẩu, chỉ cần thay giá trị hash này.

### Bảo mật
- Authentication chỉ ở phía client — không phù hợp để bảo vệ dữ liệu thực sự nhạy cảm.
- Dành cho mục đích nội bộ/demo.

---

## Quy tắc Animation (`ima-animations.js` + `ima-animations.css`)

### Nguyên tắc cốt lõi
- Animation layer chỉ thêm **hiệu ứng visual** — không được thay đổi content.
- Luôn kiểm tra `prefers-reduced-motion` trước khi áp dụng bất kỳ animation nào:
  ```js
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;
  ```
- Dùng `requestAnimationFrame` cho mọi DOM update liên quan animation.
- Scroll event phải dùng `{ passive: true }`.

### CRITICAL — Bảo vệ Gantt chart (`#lv1-gantt`)
**Không bao giờ** áp dụng scroll-reveal, animation class, hay bất kỳ DOM mutation nào lên:
- `#lv1-gantt`
- `.lv1-gantt-wrapper`
- `.lv1-gantt-chart`
- `.lv1-bar`, `.lv1-row`, `.lv1-left-panel`, `.lv1-timeline`
- Bất kỳ phần tử nào là con của các selector trên

CSS đã có rule bảo vệ:
```css
#lv1-gantt *, .lv1-gantt-wrapper *, .lv1-gantt-chart * {
  animation: none !important;
}
```
JS kiểm tra bằng `isExcluded(el)` trước khi observe.

### Scroll Reveal
Các class được JS áp dụng (không viết tay vào HTML):
- `.sr-init` — trạng thái ẩn ban đầu (opacity 0, translateY 28px)
- `.sr-visible` — trạng thái hiện sau khi scroll đến
- `.sr-left` / `.sr-right` — hướng xuất hiện từ trái/phải
- `.sr-scale` — xuất hiện với scale
- `data-delay="1"` đến `data-delay="8"` — stagger delay 60ms–480ms

Các selector được scroll reveal (định nghĩa trong `initScrollReveal`):
```
.section, .kf-card, .pinfo-card, .info-card, .summary-card,
.section-label, .map-outer, .flow-bar,
[class*="member-card"], [class*="team-card"], [class*="img-card"]
```

### Gantt/Progress bars trong trang Manhours
- Chỉ animate các `div[style*="height:7px"]` trong `table.wp-tbl` — không phải Gantt JS.
- Animation: `width: 0% → targetWidth` với `transition: 1.2s cubic-bezier(0.19,1,0.22,1)`.

### Table row stagger
- Chỉ áp dụng cho `table.wp-tbl` và `table.gt`.
- Delay tăng dần: `i * 40ms` cho mỗi `<tr>`.

---

## Design tokens (CSS custom properties)

```css
/* Animation durations */
--anim-fast:   200ms
--anim-std:    350ms
--anim-slow:   550ms
--anim-xslow:  900ms

/* Easings */
--ease-spring:    cubic-bezier(0.16, 1, 0.3, 1)
--ease-out-expo:  cubic-bezier(0.19, 1, 0.22, 1)
--ease-in-out:    cubic-bezier(0.4, 0, 0.2, 1)
--ease-bounce:    cubic-bezier(0.34, 1.56, 0.64, 1)

/* Scroll reveal defaults */
--reveal-translate-y: 28px
--reveal-translate-x: 20px
--reveal-scale: 0.97
```

---

## Color palette

| Token | Giá trị | Dùng cho |
|-------|---------|----------|
| `--ima-blue` / `#24397A` | Màu chính | Navbar, tiêu đề, border |
| `#CAEEFB` | Cyan accent | Highlight, gradient, glow |
| `#5B8FE8` | Blue sáng | Gradient thứ cấp |
| `#eef2f8` | Background | Body background các trang nội dung |
| `#0f1e48` | Dark navy | Footer gradient |

### Trang login (`index.html`) — dùng palette riêng
```
--bg:   #03060f   (dark background)
--cyan: #00d4ff   (accent chính)
--blue: #1a3a8f
--red:  #e8162e
```

---

## Typography

### Trang nội dung (01–07)
- Font chính: `'Times New Roman', Times, serif` — override toàn bộ bằng `!important`
- Font navbar brand: `Georgia, serif`
- Kích thước navbar brand: 10.5px / 8.5px (subtitle)

### Trang login (`index.html`)
- Font UI: `'Rajdhani', sans-serif`
- Font mono/code: `'Share Tech Mono', monospace`
- Font title: `'Orbitron', sans-serif`
- Tất cả load từ Google Fonts (duy nhất nơi dùng CDN)

---

## Layout & Responsive

### Navbar (`.g-nav`)
- `position: sticky; top: 0; z-index: 1000`
- Height: 50px
- Background: `#24397A`
- Khi scroll > 80px: thêm `box-shadow` (xử lý bởi `initNavbarScroll`)

### Trang login layout
- Desktop: CSS Grid 3 cột (`1fr 480px 1fr`)
- Mobile: single column, hide side panels

### `home-wrap` overflow
- Trang có `#lv1-schedule-section` hoặc `.lv1-gantt-wrapper`: buộc `overflow: visible !important` để gantt sticky panel không bị clip.

---

## Quy tắc CSS

### Specificity và `!important`
- Animation layer (`ima-animations.css`) dùng `!important` nhiều — đây là cố ý để override page-specific styles.
- Gantt protection rules dùng `!important` — không được ghi đè.
- Khi thêm style cho trang cụ thể, viết trong `<style>` của trang đó (không sửa `ima-animations.css`).

### GPU acceleration
- Dùng `will-change: transform` cho các phần tử có animation.
- Ưu tiên `transform` và `opacity` — tránh animate `width`, `height`, `top`, `left` (gây layout reflow), trừ khi cần thiết (như progress bar).

### Print
- Tất cả animation và transition bị tắt khi in:
  ```css
  @media print {
    *, *::before, *::after { animation: none !important; transition: none !important; }
  }
  ```

### Focus/Accessibility
```css
*:focus-visible {
  outline: 2px solid rgba(202,238,251,0.7) !important;
  outline-offset: 3px !important;
}
```

---

## Quy tắc JavaScript

### Module pattern
- Mọi JS trong `ima-animations.js` được bọc trong IIFE: `(function(){ 'use strict'; ... })();`
- Không pollute global scope.

### Boot sequence
Thứ tự khởi tạo (quan trọng — không đảo):
1. `injectCSS()` — inject `ima-animations.css` vào `<head>`
2. `initPageFade()` — fade overlay
3. `initScrollProgress()` — thanh tiến trình scroll
4. `initScrollReveal()` — scroll reveal với Intersection Observer
5. `initKfBars()` — animate kf-bar width
6. `initCounters()` — đếm số
7. `initHeroParallax()` — parallax orbs theo chuột
8. `initGanttBars()` — animate progress bars trong wp-tbl
9. `initSectionLabels()` — border trái section-label
10. `initTableRows()` — stagger table rows
11. `initNavbarScroll()` — navbar shadow khi scroll
12. `attachNavFade()` — fade khi chuyển trang

### Intersection Observer thresholds
| Function | Threshold | rootMargin |
|----------|-----------|------------|
| `initScrollReveal` | 0.1 | `0px 0px -40px 0px` |
| `initKfBars` | 0.3 | - |
| `initCounters` | 0.5 | - |
| `initGanttBars` | 0.1 | - |
| `initSectionLabels` | 0.2 | - |
| `initTableRows` | 0.05 | - |

### Number counter (`initCounters`)
- Chỉ animate nếu số < 100,000.
- Parse prefix/suffix (ví dụ: `≈2,500+` → prefix `≈`, number `2500`, suffix `+`).
- Duration: 1200ms với easing expo out.

### Hero parallax
- Desktop only — inject `.hero-orb-1` và `.hero-orb-2` vào `.hero` nếu chưa có.
- Orb 1 di chuyển cùng chiều chuột (`28px, 18px`); Orb 2 di chuyển ngược (`-18px, -12px`).

### Page transition
- Fade overlay 320ms khi click link nội bộ (không phải `#`, `javascript:`, hoặc `http`).
- `page-fade-overlay` background: `#eef2f8`.

---

## Tooltip convention
- Dùng attribute `data-tip="..."` trên element để hiện tooltip.
- CSS tự xử lý với `::before` pseudo-element.
- **Không áp dụng cho** `.lv1-bar`, `.lv1-diamond`, `[class*="lv1"]`.

---

## Thêm trang mới

Khi tạo trang nội dung mới, phải:
1. Bắt đầu bằng auth check (dòng đầu trong `<head>`):
   ```html
   <script>if(sessionStorage.getItem("ima_auth_v1")!=="1"){location.replace("index.html");};</script>
   ```
2. Include `ima-animations.js` ở cuối `<body>` (tự inject CSS):
   ```html
   <script src="ima-animations.js"></script>
   ```
3. Dùng đúng class conventions cho scroll reveal:
   - `.section` — mỗi section lớn
   - `.kf-card` — key figure cards
   - `.pinfo-card` — project info cards
   - `.section-label` — tiêu đề section
   - `[class*="member-card"]`, `[class*="team-card"]`, `[class*="img-card"]` — card lưới
4. Dùng `table.wp-tbl` cho bảng manhours/WP để được stagger animation.
5. Dùng `table.gt` cho bảng general với stagger.
6. Thêm link vào navbar `.g-nav__links` của tất cả các trang khác.

---

## Trang 08 — Tender Brain Search (Canvas Knowledge Graph)

### Kiến trúc

Trang `08. Tender Brain Search.html` dùng **Canvas 2D API** hoàn toàn tự viết (không thư viện đồ thị), render trong `requestAnimationFrame` loop. Không có backend — toàn bộ data là JS object tĩnh.

### Visual style — Obsidian Graph

Đồ thị theo phong cách **Obsidian graph view**:
- Nền: `#252b37` (xám tối)
- Node màu theo **số kết nối (degree)**:
  - degree ≥ 10 → vàng `#f0c040`, r=13 (hub node)
  - degree ≥ 6  → vàng nhạt `#e8b830`, r=9
  - degree ≥ 3  → teal `#4aabcc`, r=6
  - degree < 3  → teal tối `#2e8090`, r=4
- Đường kết nối: thẳng mảnh (`rgba(74,171,204,0.18)`), không bezier, không glow
- Node được highlight: `#7dd6f0` (teal sáng)
- Label màu vàng `#f0c040` khi selected, `#9de8ff` khi hover, `rgba(202,238,251,0.78)` mặc định

### Cấu trúc dữ liệu

```js
// 51 nodes tổng cộng
const RING0 = [/* 1 center node */];
const RING1 = [/* 16 document nodes — Ring 1, rx=CW*0.24 */];
const RING2 = [/* 12 WP nodes     — Ring 2, rx=CW*0.38 */];
const RING3 = [/* 22 topic nodes  — Ring 3, rx=CW*0.47 */];
const ALL_NODES = [...RING0, ...RING1, ...RING2, ...RING3];
```

Mỗi node có: `id, label, type, title, desc, tags[], documentPath, reference, action`

`type` values: `center | contract | exhibit | wp | technical | bulletin | clarification | nigerian | services | hse | logistics | topic`

### Layout bố cục (quan trọng — không scroll khi click)

```
┌─────────────────────────────────────────────────┐
│  Search bar + Filter chips (full width)          │
├─────────────────┬───────────────────────────────┤
│  .tb-left       │  .tb-right (flex column)       │
│  320px fixed    │  ┌─────────────────────────┐  │
│  height:560px   │  │  Canvas 560px           │  │
│  overflow-y:auto│  ├─────────────────────────┤  │
│  (results list) │  │  Detail panel (below    │  │
│                 │  │  canvas, same column)   │  │
└─────────────────┴──┴─────────────────────────┴──┘
```

**Quy tắc quan trọng:** Detail panel (`#tbDetail`) phải nằm **bên trong** `.tb-right`, không phải sau `.tb-main`. Nếu đặt ngoài sẽ gây trang tự scroll khi panel mở.

### Canvas engine — các hàm chính

| Hàm | Mô tả |
|-----|-------|
| `computePositions()` | Tính toán vị trí elliptical orbit cho từng ring |
| `nodeVis(id)` | Trả về `{fill, r}` dựa trên degree |
| `drawLinks()` | Vẽ đường thẳng mảnh giữa các node |
| `drawNodes()` | Vẽ node + halo khi hover/select + label bên ngoài node |
| `hitTest(ex,ey)` | Tìm node dưới con trỏ chuột |
| `selectNode(id)` | Set `selNode`, tính `hlNodes` (neighbors) |

### 11 filter chips

`all | contract | exhibit | wp | technical | bulletin | clarification | nigerian | services | hse | logistics`

### Search ranking

`title (+30) > id (+20) > label (+18) > tags (+12) > reference (+8) > desc (+5) > documentPath (+4)`

### Không được làm với trang 08

- Không dùng thư viện đồ thị (D3, Cytoscape, vis.js) — Canvas thuần.
- Không đặt detail panel ngoài `.tb-right` — sẽ gây scroll cả trang.
- Không đặt `scrollIntoView` trên detail panel — đã xóa cố ý.
- Không thêm particle hoặc glow gradient — giữ style Obsidian đơn giản.
- Không dùng bezier curves cho link — dùng `lineTo` thẳng.

---

## Không được làm

- Không thêm CDN runtime (React, Vue, jQuery, etc.) vào trang nội dung.
- Không sửa `#lv1-gantt` hay bất kỳ phần tử con nào của nó từ `ima-animations.js`.
- Không ghi `ima-animations.css` vào HTML bằng `<link>` thủ công — JS tự inject.
- Không dùng `localStorage` cho auth — phải dùng `sessionStorage`.
- Không commit file chứa mật khẩu plaintext.
- Không thêm external font mới vào trang nội dung (Times New Roman đã được quy định).
- Không dùng `overflow: hidden` trên `.home-wrap` khi trang có Gantt chart.
