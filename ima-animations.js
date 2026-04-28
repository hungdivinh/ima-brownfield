/**
 * IMA Brownfield Website — Animation Engine
 * Based on: UI/UX Pro Max (Motion-Driven style) + 1Code best practices
 *
 * Features:
 * - Scroll-reveal (Intersection Observer API) — GPU-accelerated
 * - Scroll-progress bar
 * - Custom cursor (desktop only)
 * - Page transition fades
 * - KF-bar animated width on reveal
 * - Counter number animation
 * - Parallax hero orbs on mouse move
 * - Schedule/Gantt bar animations
 * - prefers-reduced-motion respected
 */

(function () {
  'use strict';

  /* ── Motion preference guard ── */
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ═══════════════════════════════════════════════════════════════
     1. PAGE FADE-IN ON LOAD
  ═══════════════════════════════════════════════════════════════ */
  function initPageFade() {
    let overlay = document.getElementById('page-fade-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'page-fade-overlay';
      document.body.appendChild(overlay);
    }
    // Already visible = navigating away; fade out
    overlay.classList.remove('fade-out');
  }

  function attachNavFade() {
    document.querySelectorAll('a.g-nav__link, a[href]').forEach(function (link) {
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('javascript') || href.startsWith('http')) return;
      link.addEventListener('click', function (e) {
        if (prefersReduced) return;
        const overlay = document.getElementById('page-fade-overlay');
        if (!overlay) return;
        e.preventDefault();
        const target = href;
        overlay.classList.add('fade-out');
        setTimeout(function () { window.location.href = target; }, 320);
      });
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     2. SCROLL PROGRESS BAR
  ═══════════════════════════════════════════════════════════════ */
  function initScrollProgress() {
    if (prefersReduced) return;
    const bar = document.createElement('div');
    bar.id = 'scroll-progress-bar';
    document.body.appendChild(bar);

    let ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(function () {
          const scrollTop = window.scrollY || document.documentElement.scrollTop;
          const docHeight = document.documentElement.scrollHeight - window.innerHeight;
          const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
          bar.style.width = pct.toFixed(1) + '%';
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /* ═══════════════════════════════════════════════════════════════
     3. SCROLL REVEAL (Intersection Observer)
     SAFE GUARD: never touch #lv1-gantt or its children
  ═══════════════════════════════════════════════════════════════ */
  function initScrollReveal() {
    if (prefersReduced) return;

    var excludeContainers = [
      document.getElementById('lv1-gantt'),
      document.querySelector('.lv1-gantt-wrapper'),
      document.querySelector('.lv1-gantt-chart'),
    ].filter(Boolean);

    function isExcluded(el) {
      return excludeContainers.some(function(c){ return c && (c === el || c.contains(el)); });
    }

    var targets = [
      { sel: '.section',       cls: 'sr-init',          delay: false },
      { sel: '.kf-card',       cls: 'sr-init sr-scale', delay: true  },
      { sel: '.pinfo-card',    cls: 'sr-init sr-left',  delay: true  },
      { sel: '.info-card',     cls: 'sr-init',          delay: true  },
      { sel: '.summary-card',  cls: 'sr-init sr-left',  delay: false },
      { sel: '.section-label', cls: 'sr-init',          delay: false },
      { sel: '.map-outer',     cls: 'sr-init sr-scale', delay: false },
      { sel: '.flow-bar',      cls: 'sr-init',          delay: false },
      { sel: '[class*="member-card"]', cls: 'sr-init sr-scale', delay: true },
      { sel: '[class*="team-card"]',   cls: 'sr-init sr-scale', delay: true },
      { sel: '[class*="img-card"]',    cls: 'sr-init sr-scale', delay: true },
    ];

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('sr-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    targets.forEach(function(t) {
      document.querySelectorAll(t.sel).forEach(function(el, i) {
        if (isExcluded(el)) return;
        if (el.classList.contains('sr-init')) return;
        t.cls.split(' ').forEach(function(c){ if (c) el.classList.add(c); });
        if (t.delay) el.setAttribute('data-delay', (i % 8) + 1);
        observer.observe(el);
      });
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     4. KF-BAR WIDTH ANIMATION ON REVEAL
  ═══════════════════════════════════════════════════════════════ */
  function initKfBars() {
    if (prefersReduced) return;

    const obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('animated');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    document.querySelectorAll('.kf-bar').forEach(function (bar) {
      obs.observe(bar);
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     5. NUMBER COUNTER ANIMATION (kf-value)
  ═══════════════════════════════════════════════════════════════ */
  function animateCounter(el, target, duration, prefix, suffix) {
    if (prefersReduced) return;
    const start = performance.now();
    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out expo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.round(eased * target);
      el.textContent = prefix + current + suffix;
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = prefix + target + suffix;
    }
    requestAnimationFrame(tick);
  }

  function parseNumber(str) {
    // Extract numeric part and prefix/suffix
    const match = str.match(/^([~≈]?\s*)(\d[\d,.]*)(\s*.*)$/);
    if (!match) return null;
    const prefix = match[1] || '';
    const num = parseFloat(match[2].replace(/,/g, ''));
    const suffix = match[3] || '';
    return { prefix, num, suffix };
  }

  function initCounters() {
    if (prefersReduced) return;

    const obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          const el = entry.target;
          const raw = el.getAttribute('data-original') || el.textContent;
          if (!el.getAttribute('data-original')) {
            el.setAttribute('data-original', raw);
          }
          const parsed = parseNumber(raw);
          if (parsed && parsed.num > 0 && parsed.num < 100000) {
            animateCounter(el, parsed.num, 1200, parsed.prefix, parsed.suffix);
          }
          obs.unobserve(el);
        }
      });
    }, { threshold: 0.5 });

    document.querySelectorAll('.kf-value').forEach(function (el) {
      obs.observe(el);
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     6. HERO ORB — mouse-parallax (desktop only)
  ═══════════════════════════════════════════════════════════════ */
  function initHeroParallax() {
    if (prefersReduced) return;
    const hero = document.querySelector('.hero');
    if (!hero) return;

    // Inject orbs if not already there
    if (!hero.querySelector('.hero-orb-1')) {
      const o1 = document.createElement('div');
      o1.className = 'hero-orb-1';
      const o2 = document.createElement('div');
      o2.className = 'hero-orb-2';
      hero.appendChild(o1);
      hero.appendChild(o2);
    }

    const orb1 = hero.querySelector('.hero-orb-1');
    const orb2 = hero.querySelector('.hero-orb-2');

    let mouseX = 0, mouseY = 0;
    let ticking = false;

    hero.addEventListener('mousemove', function (e) {
      const rect = hero.getBoundingClientRect();
      mouseX = (e.clientX - rect.left) / rect.width - 0.5;
      mouseY = (e.clientY - rect.top)  / rect.height - 0.5;
      if (!ticking) {
        requestAnimationFrame(function () {
          if (orb1) orb1.style.transform = 'translate(' + (mouseX * 28) + 'px, ' + (mouseY * 18) + 'px)';
          if (orb2) orb2.style.transform = 'translate(' + (-mouseX * 18) + 'px, ' + (-mouseY * 12) + 'px)';
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /* ═══════════════════════════════════════════════════════════════
     7. CUSTOM CURSOR
  ═══════════════════════════════════════════════════════════════ */
  function initCursor() {
    if (prefersReduced) return;
    // Only desktop (pointer: fine)
    if (!window.matchMedia('(pointer: fine)').matches) return;

    const dot  = document.createElement('div'); dot.id  = 'cursor-dot';
    const ring = document.createElement('div'); ring.id = 'cursor-ring';
    document.body.appendChild(dot);
    document.body.appendChild(ring);

    let cx = -100, cy = -100;
    let rx = -100, ry = -100;
    let rafId;

    function render() {
      dot.style.left  = cx + 'px';
      dot.style.top   = cy + 'px';
      // Ring lerps towards dot for a trailing effect
      rx += (cx - rx) * 0.18;
      ry += (cy - ry) * 0.18;
      ring.style.left = rx + 'px';
      ring.style.top  = ry + 'px';
      rafId = requestAnimationFrame(render);
    }
    rafId = requestAnimationFrame(render);

    document.addEventListener('mousemove', function (e) {
      cx = e.clientX; cy = e.clientY;
    }, { passive: true });

    // Hover state
    const hoverSels = 'a, button, [class*="card"], [class*="link"], .g-nav__link, .kf-card, .pinfo-card, .flow-node, input, textarea, select';
    document.addEventListener('mouseover', function (e) {
      if (e.target.closest(hoverSels)) {
        document.body.classList.add('cursor-hover');
      }
    });
    document.addEventListener('mouseout', function (e) {
      if (e.target.closest(hoverSels)) {
        document.body.classList.remove('cursor-hover');
      }
    });

    // Click state
    document.addEventListener('mousedown', function () { document.body.classList.add('cursor-click'); });
    document.addEventListener('mouseup',   function () { document.body.classList.remove('cursor-click'); });

    // Cleanup on visibility
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) cancelAnimationFrame(rafId);
      else rafId = requestAnimationFrame(render);
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     8. SCHEDULE / PROGRESS BAR ANIMATIONS (WP table bars only)
     Targets ONLY simple progress bars inside .wp-tbl table,
     NOT the JS-rendered lv1-gantt chart (which manages its own DOM)
  ═══════════════════════════════════════════════════════════════ */
  function initGanttBars() {
    if (prefersReduced) return;

    // Only target static progress bars inside the WP manhours table
    // Explicitly exclude the lv1-gantt-wrapper and its children
    const ganttWrapper = document.getElementById('lv1-gantt');

    const obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.querySelectorAll('div[style*="height:7px"], div[style*="height: 7px"]').forEach(function (bar) {
            // Never touch anything inside the lv1-gantt wrapper
            if (ganttWrapper && ganttWrapper.contains(bar)) return;
            const match = (bar.getAttribute('style') || '').match(/width\s*:\s*([\d.]+%)/);
            if (!match) return;
            const targetW = match[1];
            bar.style.transition = 'width 1.2s cubic-bezier(0.19,1,0.22,1)';
            bar.style.width = '0%';
            requestAnimationFrame(function () {
              requestAnimationFrame(function () {
                bar.style.width = targetW;
              });
            });
          });
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    // Only observe the wp-tbl (manhours table), not the gantt wrapper
    document.querySelectorAll('table.wp-tbl, .wp-table, [class*="manhour"]').forEach(function (tbl) {
      if (ganttWrapper && ganttWrapper.contains(tbl)) return;
      obs.observe(tbl);
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     9. SECTION-LABEL LEFT BORDER ANIMATION
  ═══════════════════════════════════════════════════════════════ */
  function initSectionLabels() {
    if (prefersReduced) return;

    const obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('sr-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    document.querySelectorAll('.section-label').forEach(function (el) {
      obs.observe(el);
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     10. TABLE ROW STAGGER ON SCROLL (only wp-tbl, not gantt)
  ═══════════════════════════════════════════════════════════════ */
  function initTableRows() {
    if (prefersReduced) return;

    var ganttWrapper = document.getElementById('lv1-gantt') || document.querySelector('.lv1-gantt-wrapper');

    var obs = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          var rows = entry.target.querySelectorAll('tbody tr');
          rows.forEach(function(row, i) {
            if (ganttWrapper && ganttWrapper.contains(row)) return;
            row.style.transitionDelay = (i * 40) + 'ms';
            row.classList.add('sr-init', 'sr-visible');
          });
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05 });

    document.querySelectorAll('table.wp-tbl, table.gt').forEach(function(tbl) {
      if (ganttWrapper && ganttWrapper.contains(tbl)) return;
      obs.observe(tbl);
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     11. NAVBAR SCROLL-COMPACT
  ═══════════════════════════════════════════════════════════════ */
  function initNavbarScroll() {
    const nav = document.querySelector('.g-nav');
    if (!nav) return;
    let lastScroll = 0;
    window.addEventListener('scroll', function () {
      const y = window.scrollY;
      if (y > 80) {
        nav.style.boxShadow = '0 4px 24px rgba(0,0,0,0.32), 0 1px 0 rgba(202,238,251,0.14)';
      } else {
        nav.style.boxShadow = '';
      }
      lastScroll = y;
    }, { passive: true });
  }

  /* ═══════════════════════════════════════════════════════════════
     12. INJECT CSS LINKS into <head>
  ═══════════════════════════════════════════════════════════════ */
  function injectCSS() {
    // Animation CSS
    if (!document.querySelector('link[href*="ima-animations"]')) {
      const link = document.createElement('link');
      link.rel  = 'stylesheet';
      link.href = 'ima-animations.css';
      document.head.appendChild(link);
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     BOOT
  ═══════════════════════════════════════════════════════════════ */
  function boot() {
    injectCSS();
    initPageFade();
    initScrollProgress();
    initScrollReveal();
    initKfBars();
    initCounters();
    initHeroParallax();
    initCursor();
    initGanttBars();
    initSectionLabels();
    initTableRows();
    initNavbarScroll();
    attachNavFade();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
