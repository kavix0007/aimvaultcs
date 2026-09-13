/* ==========================================================================
   AIMVAULT — app.js
   Shared utilities used across every page: crosshair rendering, CS2 command
   generation, the local copy counter, card rendering, the search/filter/sort
   browser, and common header/toast behavior.

   Everything here is written as small, reusable functions on purpose —
   generator.js and tools.js both import from this file
   instead of duplicating logic.
   ========================================================================== */

(function (global) {
  'use strict';

  /* ------------------------------------------------------------------ *
   * Color palette
   * ------------------------------------------------------------------ */
  const CROSSHAIR_COLORS = {
    green:  '#39ff6a',
    cyan:   '#39e0ff',
    blue:   '#4b8cff',
    yellow: '#fff23b',
    red:    '#ff4b4b',
    white:  '#ffffff',
    pink:   '#ff5cc9',
    orange: '#e5a400',
    purple: '#b26bff'
  };

  // CS2's native cl_crosshaircolor cvar only maps presets 0-4; anything
  // outside that range requires cl_crosshaircolor 5 (custom) plus RGB.
  const NATIVE_COLOR_INDEX = { red: 0, green: 1, yellow: 2, blue: 3, cyan: 4 };

  function hexToRgb(hex) {
    const v = hex.replace('#', '');
    return {
      r: parseInt(v.substring(0, 2), 16),
      g: parseInt(v.substring(2, 4), 16),
      b: parseInt(v.substring(4, 6), 16)
    };
  }

  /* ------------------------------------------------------------------ *
   * CS2 console command generation
   * A single source of truth so cards, the detail page and the generator
   * all produce an identical, copy-pasteable command block.
   * ------------------------------------------------------------------ */
  function generateCommandLines(cfg) {
    const color = CROSSHAIR_COLORS[cfg.color] ? cfg.color : 'green';
    const rgb = hexToRgb(CROSSHAIR_COLORS[color]);
    const isNative = NATIVE_COLOR_INDEX.hasOwnProperty(color);
    const lines = [];

    lines.push(`cl_crosshairstyle ${cfg.style != null ? cfg.style : 4}`);
    lines.push(`cl_crosshaircolor ${isNative ? NATIVE_COLOR_INDEX[color] : 5}`);
    lines.push(`cl_crosshaircolor_r ${rgb.r}`);
    lines.push(`cl_crosshaircolor_g ${rgb.g}`);
    lines.push(`cl_crosshaircolor_b ${rgb.b}`);
    lines.push(`cl_crosshairsize ${cfg.size}`);
    lines.push(`cl_crosshairgap ${cfg.gap}`);
    lines.push(`cl_crosshairthickness ${cfg.thickness}`);
    lines.push(`cl_crosshairdot ${cfg.dot ? 1 : 0}`);
    lines.push(`cl_crosshair_outlinethickness ${cfg.outline ? (cfg.outlineThickness != null ? cfg.outlineThickness : 1) : 0}`);
    lines.push(`cl_crosshairusealpha 1`);
    lines.push(`cl_crosshairalpha 255`);
    return lines;
  }

  function generateCommandText(cfg) {
    return generateCommandLines(cfg).join('\n');
  }

  /* ------------------------------------------------------------------ *
   * Canvas crosshair rendering
   * Purely generated on <canvas> — no screenshots or external art assets.
   * ------------------------------------------------------------------ */
  function setupHiDPICanvas(canvas) {
    const dpr = global.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width || canvas.clientWidth || 200;
    const h = rect.height || canvas.clientHeight || 200;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w, h };
  }

  function drawCrosshair(canvas, cfg) {
    if (!canvas) return;
    const { ctx, w, h } = setupHiDPICanvas(canvas);
    ctx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const unit = Math.min(w, h) / 42;

    const size = Math.max(0, Number(cfg.size) || 0);
    const gap = Number(cfg.gap) || 0;
    const thickness = Math.max(0.5, Number(cfg.thickness) || 1);
    const color = CROSSHAIR_COLORS[cfg.color] || CROSSHAIR_COLORS.green;

    const gapPx = gap * unit * 0.75;
    const lenPx = Math.max(2, size * unit * 0.9 + unit * 1.3);
    const thickPx = Math.max(1.4, thickness * unit * 0.6);
    const outlineExtra = cfg.outline ? Math.max(1, (cfg.outlineThickness != null ? cfg.outlineThickness : 1) * unit * 0.35) : 0;

    function drawLine(dx, dy) {
      const startX = cx + dx * gapPx;
      const startY = cy + dy * gapPx;
      const endX = cx + dx * (gapPx + lenPx);
      const endY = cy + dy * (gapPx + lenPx);

      if (cfg.outline) {
        ctx.strokeStyle = 'rgba(0,0,0,0.85)';
        ctx.lineWidth = thickPx + outlineExtra * 2;
        ctx.lineCap = 'butt';
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }

      ctx.strokeStyle = color;
      ctx.lineWidth = thickPx;
      ctx.lineCap = 'butt';
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }

    // four directions: up, down, left, right
    drawLine(0, -1);
    drawLine(0, 1);
    drawLine(-1, 0);
    drawLine(1, 0);

    if (cfg.dot) {
      const dotSize = thickPx + unit * 0.5;
      if (cfg.outline) {
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(cx - dotSize / 2 - outlineExtra, cy - dotSize / 2 - outlineExtra, dotSize + outlineExtra * 2, dotSize + outlineExtra * 2);
      }
      ctx.fillStyle = color;
      ctx.fillRect(cx - dotSize / 2, cy - dotSize / 2, dotSize, dotSize);
    }
  }

  function redrawAllCanvases(root) {
    (root || document).querySelectorAll('canvas[data-crosshair]').forEach((canvas) => {
      try {
        const cfg = JSON.parse(canvas.getAttribute('data-crosshair'));
        drawCrosshair(canvas, cfg);
      } catch (e) { /* ignore malformed data */ }
    });
  }

  let resizeTimer = null;
  global.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => redrawAllCanvases(document), 120);
  });

  /* ------------------------------------------------------------------ *
   * Copy counter
   * Static-site friendly counter backed by localStorage. The adapter
   * shape (async get/increment) is deliberate: swap LocalCopyCounter for
   * a fetch()-based adapter hitting Supabase (or any REST endpoint) later
   * without touching any calling code.
   * ------------------------------------------------------------------ */
  const COPY_COUNTER_KEY = 'aimvault_copy_counts_v1';

  function readCounterStore() {
    try {
      return JSON.parse(localStorage.getItem(COPY_COUNTER_KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  function writeCounterStore(store) {
    try {
      localStorage.setItem(COPY_COUNTER_KEY, JSON.stringify(store));
    } catch (e) { /* storage unavailable — fail silently, base count still shows */ }
  }

  const LocalCopyCounter = {
    // baseCount = the seed value shipped in crosshairs.json (data.copies)
    async get(id, baseCount) {
      const store = readCounterStore();
      const local = store[id] || 0;
      return (baseCount || 0) + local;
    },
    async increment(id, baseCount) {
      const store = readCounterStore();
      store[id] = (store[id] || 0) + 1;
      writeCounterStore(store);
      return (baseCount || 0) + store[id];
    }
  };

  /*
   * To connect a real backend later, implement the same two methods and
   * swap the export below, e.g.:
   *
   *   const SupabaseCopyCounter = {
   *     async get(id) { const { data } = await supabase.from('copies').select('count').eq('id', id).single(); return data?.count ?? 0; },
   *     async increment(id) { const { data } = await supabase.rpc('increment_copy', { crosshair_id: id }); return data; }
   *   };
   *   AIMVAULT.CopyCounter = SupabaseCopyCounter;
   */
  const CopyCounter = LocalCopyCounter;

  /* ------------------------------------------------------------------ *
   * Data fetching
   * ------------------------------------------------------------------ */
  async function fetchJSON(path) {
    try {
      const res = await fetch(path, { cache: 'no-store' });
      if (!res.ok) throw new Error('Network response was not ok: ' + res.status);
      return await res.json();
    } catch (err) {
      console.error('AIMVAULT: failed to load', path, err);
      return null;
    }
  }

  /* ------------------------------------------------------------------ *
   * Small DOM helpers
   * ------------------------------------------------------------------ */
  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach((k) => {
        if (k === 'class') node.className = attrs[k];
        else if (k === 'html') node.innerHTML = attrs[k];
        else if (k.startsWith('on') && typeof attrs[k] === 'function') node.addEventListener(k.slice(2), attrs[k]);
        else node.setAttribute(k, attrs[k]);
      });
    }
    (children || []).forEach((c) => {
      if (c == null) return;
      node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return node;
  }

  function escapeHTML(str) {
    return String(str).replace(/[&<>"']/g, (m) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
  }

  function slugToLabel(str) {
    return String(str).replace(/-/g, ' ');
  }

  function timeAgo(dateString) {
    const then = new Date(dateString).getTime();
    if (isNaN(then)) return '';
    const diffDays = Math.floor((Date.now() - then) / 86400000);
    if (diffDays <= 0) return 'today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 30) return `${diffDays} days ago`;
    const months = Math.floor(diffDays / 30);
    if (months < 12) return `${months} mo ago`;
    return `${Math.floor(months / 12)} yr ago`;
  }

  /* ------------------------------------------------------------------ *
   * Toast notifications
   * ------------------------------------------------------------------ */
  function ensureToastRegion() {
    let region = document.querySelector('.toast-region');
    if (!region) {
      region = el('div', { class: 'toast-region', role: 'status', 'aria-live': 'polite' });
      document.body.appendChild(region);
    }
    return region;
  }

  function showToast(message) {
    const region = ensureToastRegion();
    const toast = el('div', { class: 'toast' }, [
      el('span', { html: '<svg viewBox="0 0 20 20" fill="none"><path d="M4 10.5l4 4 8-9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' }),
      document.createTextNode(message)
    ]);
    region.appendChild(toast);
    setTimeout(() => {
      toast.style.transition = 'opacity 0.2s ease';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 220);
    }, 2200);
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      // Fallback for older/blocked-clipboard contexts
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (e2) { ok = false; }
      document.body.removeChild(ta);
      return ok;
    }
  }

  /* ------------------------------------------------------------------ *
   * Crosshair card component
   * ------------------------------------------------------------------ */
  function createCrosshairCard(entry) {
    const card = el('article', { class: 'xh-card', 'data-id': entry.id });

    const stage = el('div', { class: 'xh-card-stage' }, [
      el('span', { class: 'xh-card-badge' }, [entry.category === 'pro' ? 'Pro' : 'Community']),
      el('span', { class: 'xh-card-copies', id: `copies-${entry.id}` }, ['—'])
    ]);
    const canvas = el('canvas', {
      'data-crosshair': JSON.stringify({
        color: entry.color, size: entry.size, gap: entry.gap, thickness: entry.thickness,
        outline: entry.outline, outlineThickness: entry.outlineThickness, dot: entry.dot, style: entry.style
      })
    });
    stage.appendChild(canvas);

    const body = el('div', { class: 'xh-card-body' }, [
      el('div', { class: 'xh-card-name' }, [entry.name]),
      el('div', { class: 'xh-card-meta' }, [
        el('span', {}, [entry.team]),
        el('span', { class: 'dot' }),
        el('span', { class: 'xh-role-tag' }, [entry.role])
      ]),
      el('div', { class: 'xh-card-actions' }, [
        el('button', {
          class: 'btn btn-ghost btn-sm', type: 'button',
          onclick: async () => {
            const cfg = { color: entry.color, size: entry.size, gap: entry.gap, thickness: entry.thickness, outline: entry.outline, outlineThickness: entry.outlineThickness, dot: entry.dot, style: entry.style };
            const ok = await copyText(generateCommandText(cfg));
            if (ok) {
              const newCount = await CopyCounter.increment(entry.id, entry.copies);
              const el2 = card.querySelector(`#copies-${entry.id}`);
              if (el2) el2.textContent = formatCount(newCount);
              showToast(`${entry.name}'s crosshair copied to clipboard`);
            } else {
              showToast('Could not copy — copy manually from the crosshair page');
            }
          }
        }, ['Copy']),
        el('a', { class: 'btn btn-secondary btn-sm', href: `crosshair.html?id=${encodeURIComponent(entry.id)}` }, ['View'])
      ])
    ]);

    card.appendChild(stage);
    card.appendChild(body);

    CopyCounter.get(entry.id, entry.copies).then((count) => {
      const countEl = card.querySelector(`#copies-${entry.id}`);
      if (countEl) countEl.textContent = formatCount(count);
    });

    requestAnimationFrame(() => drawCrosshair(canvas, entry));

    return card;
  }

  function formatCount(n) {
    if (n >= 1000) return (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + 'k';
    return String(n);
  }

  /* ------------------------------------------------------------------ *
   * Search / filter / sort browser
   * Reused by the homepage (small slice) and crosshairs.html (full db).
   * ------------------------------------------------------------------ */
  function initCrosshairBrowser(options) {
    const {
      gridEl, emptyEl, resultsMetaEl,
      searchInput, filterPills, sortSelect,
      loadMoreBtn,
      data, pageSize = 12,
      filterFn // optional extra base filter, e.g. category === 'pro'
    } = options;

    let state = { query: '', filter: 'all', sort: 'recent', visible: pageSize };

    function applyFilters() {
      let list = data.slice();
      if (filterFn) list = list.filter(filterFn);

      if (state.filter === 'riflers') list = list.filter((c) => c.role === 'Rifler');
      else if (state.filter === 'awpers') list = list.filter((c) => c.role === 'AWPer');
      else if (state.filter === 'pros') list = list.filter((c) => c.category === 'pro');
      else if (state.filter === 'popular') list = list.slice().sort((a, b) => b.copies - a.copies).slice(0, Math.max(10, list.length));
      else if (state.filter === 'recent') list = list.slice().sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded)).slice(0, Math.max(10, list.length));

      if (state.query.trim()) {
        const q = state.query.trim().toLowerCase();
        list = list.filter((c) =>
          c.name.toLowerCase().includes(q) ||
          (c.team || '').toLowerCase().includes(q) ||
          (c.role || '').toLowerCase().includes(q)
        );
      }

      if (state.sort === 'recent') list.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
      else if (state.sort === 'copied') list.sort((a, b) => b.copies - a.copies);
      else if (state.sort === 'alpha') list.sort((a, b) => a.name.localeCompare(b.name));

      return list;
    }

    function render() {
      const list = applyFilters();
      const visibleList = list.slice(0, state.visible);
      gridEl.innerHTML = '';

      if (list.length === 0) {
        if (emptyEl) emptyEl.hidden = false;
        gridEl.hidden = true;
      } else {
        if (emptyEl) emptyEl.hidden = true;
        gridEl.hidden = false;
        visibleList.forEach((entry) => gridEl.appendChild(createCrosshairCard(entry)));
      }

      if (resultsMetaEl) {
        resultsMetaEl.textContent = `Showing ${visibleList.length} of ${list.length} crosshair${list.length === 1 ? '' : 's'}`;
      }

      if (loadMoreBtn) {
        loadMoreBtn.style.display = state.visible < list.length ? 'inline-flex' : 'none';
      }
    }

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.query = e.target.value;
        state.visible = pageSize;
        render();
      });
    }

    if (filterPills && filterPills.length) {
      filterPills.forEach((pill) => {
        pill.addEventListener('click', () => {
          filterPills.forEach((p) => p.classList.remove('is-active'));
          pill.classList.add('is-active');
          state.filter = pill.getAttribute('data-filter');
          state.visible = pageSize;
          render();
        });
      });
    }

    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        state.sort = e.target.value;
        render();
      });
    }

    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', () => {
        state.visible += pageSize;
        render();
      });
    }

    render();
    return { render, setState: (patch) => { state = { ...state, ...patch }; render(); } };
  }

  /* ------------------------------------------------------------------ *
   * Header: sticky shadow + mobile nav
   * ------------------------------------------------------------------ */
  function initHeader() {
    const header = document.querySelector('.site-header');
    const toggle = document.querySelector('.nav-toggle');
    const nav = document.querySelector('.main-nav');

    if (header) {
      const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 4);
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    if (toggle && nav) {
      toggle.addEventListener('click', () => {
        const isOpen = nav.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', String(isOpen));
      });
      nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }));
    }

    // Mark the active nav link based on the current page filename
    const currentPage = (location.pathname.split('/').pop() || 'index.html');
    document.querySelectorAll('.main-nav a[data-page]').forEach((a) => {
      if (a.getAttribute('data-page') === currentPage) a.classList.add('active');
    });

    // Footer year
    const yearEl = document.getElementById('footer-year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }

  document.addEventListener('DOMContentLoaded', () => {
    initHeader();
    redrawAllCanvases(document);
  });

  /* ------------------------------------------------------------------ *
   * Public namespace
   * ------------------------------------------------------------------ */
  global.AIMVAULT = {
    CROSSHAIR_COLORS,
    generateCommandLines,
    generateCommandText,
    drawCrosshair,
    redrawAllCanvases,
    CopyCounter,
    fetchJSON,
    el,
    escapeHTML,
    slugToLabel,
    timeAgo,
    showToast,
    copyText,
    createCrosshairCard,
    formatCount,
    initCrosshairBrowser
  };
})(window);
