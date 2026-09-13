/* ==========================================================================
   AIMVAULT — pro-settings.js
   Loads data/players.json and renders the Pro Settings grid with a simple
   search + role filter. Rendering is generated entirely from JSON.
   ========================================================================== */

(function () {
  'use strict';
  const A = window.AIMVAULT;

  function avatarSvg(name, color) {
    const initials = name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 46 46"><rect width="46" height="46" rx="23" fill="${color}"/><text x="23" y="29" text-anchor="middle" font-family="Chakra Petch, sans-serif" font-size="17" font-weight="700" fill="#15181d">${initials}</text></svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }

  const AVATAR_COLORS = ['#e5a400', '#4b8cff', '#39e0ff', '#39ff6a', '#ff5cc9', '#b26bff'];

  function createProCard(p, index) {
    const color = AVATAR_COLORS[index % AVATAR_COLORS.length];
    const edpi = Math.round(p.sensitivity * p.dpi);

    const card = A.el('article', { class: 'pro-card' }, [
      A.el('div', { class: 'pro-card-head' }, [
        A.el('img', { class: 'pro-avatar', src: avatarSvg(p.name, color), alt: '', width: '46', height: '46' }),
        A.el('div', {}, [
          A.el('div', { class: 'pro-name' }, [p.name]),
          A.el('div', { class: 'pro-team' }, [`${p.team} · ${p.role}`])
        ])
      ]),
      A.el('div', { class: 'pro-specs' }, [
        A.el('div', { class: 'pro-spec' }, [A.el('span', {}, ['Sensitivity']), A.el('strong', {}, [String(p.sensitivity)])]),
        A.el('div', { class: 'pro-spec' }, [A.el('span', {}, ['DPI']), A.el('strong', {}, [String(p.dpi)])]),
        A.el('div', { class: 'pro-spec' }, [A.el('span', {}, ['eDPI']), A.el('strong', {}, [String(edpi)])]),
        A.el('div', { class: 'pro-spec' }, [A.el('span', {}, ['Resolution']), A.el('strong', {}, [p.resolution])]),
        A.el('div', { class: 'pro-spec' }, [A.el('span', {}, ['Aspect Ratio']), A.el('strong', {}, [p.aspectRatio])]),
        A.el('div', { class: 'pro-spec' }, [A.el('span', {}, ['Viewmodel']), A.el('strong', {}, [p.viewmodel])]),
        A.el('div', { class: 'pro-spec' }, [A.el('span', {}, ['Mouse']), A.el('strong', {}, [p.mouse])]),
        A.el('div', { class: 'pro-spec' }, [A.el('span', {}, ['Keyboard']), A.el('strong', {}, [p.keyboard])])
      ]),
      A.el('a', { class: 'btn btn-secondary btn-sm btn-block', href: `crosshair.html?id=${encodeURIComponent(p.id)}` }, ['View crosshair'])
    ]);
    return card;
  }

  async function init() {
    const grid = document.getElementById('pro-grid');
    const emptyEl = document.getElementById('pro-empty');
    const searchInput = document.getElementById('pro-search');
    const roleSelect = document.getElementById('pro-role-filter');
    if (!grid) return;

    const json = await A.fetchJSON('data/players.json');
    const players = (json && json.players) || [];

    function render() {
      const q = (searchInput && searchInput.value || '').trim().toLowerCase();
      const role = (roleSelect && roleSelect.value) || 'all';
      let list = players.filter((p) =>
        (role === 'all' || p.role === role) &&
        (q === '' || p.name.toLowerCase().includes(q) || p.team.toLowerCase().includes(q))
      );

      grid.innerHTML = '';
      if (list.length === 0) {
        grid.hidden = true;
        if (emptyEl) emptyEl.hidden = false;
        return;
      }
      grid.hidden = false;
      if (emptyEl) emptyEl.hidden = true;
      list.forEach((p, i) => grid.appendChild(createProCard(p, i)));
    }

    if (searchInput) searchInput.addEventListener('input', render);
    if (roleSelect) roleSelect.addEventListener('change', render);
    render();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
