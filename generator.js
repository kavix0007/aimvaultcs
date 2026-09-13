/* ==========================================================================
   AIMVAULT — generator.js
   Drives generator.html: live preview, all controls, reset/randomize,
   copy-to-clipboard, and a shareable URL that encodes the full config.
   ========================================================================== */

(function () {
  'use strict';
  const A = window.AIMVAULT;

  const DEFAULT_CFG = {
    color: 'green', size: 2, gap: -3, thickness: 1,
    outline: true, outlineThickness: 1, dot: false, style: 4
  };

  let cfg = { ...DEFAULT_CFG };
  let background = 'grid';

  const canvas = document.getElementById('gen-canvas');
  const stage = document.getElementById('gen-stage');

  const els = {
    sizeInput: document.getElementById('ctl-size'),
    sizeValue: document.getElementById('val-size'),
    gapInput: document.getElementById('ctl-gap'),
    gapValue: document.getElementById('val-gap'),
    thicknessInput: document.getElementById('ctl-thickness'),
    thicknessValue: document.getElementById('val-thickness'),
    outlineThicknessInput: document.getElementById('ctl-outline-thickness'),
    outlineThicknessValue: document.getElementById('val-outline-thickness'),
    outlineToggle: document.getElementById('ctl-outline'),
    dotToggle: document.getElementById('ctl-dot'),
    styleSelect: document.getElementById('ctl-style'),
    colorSwatches: Array.from(document.querySelectorAll('.color-swatch')),
    bgSwatches: Array.from(document.querySelectorAll('.bg-swatch')),
    resetBtn: document.getElementById('btn-reset'),
    randomBtn: document.getElementById('btn-randomize'),
    copyBtn: document.getElementById('btn-copy-settings'),
    shareBtn: document.getElementById('btn-share-url'),
    commandBlock: document.getElementById('gen-command-block')
  };

  function redraw() {
    A.drawCrosshair(canvas, cfg);
    if (els.commandBlock) els.commandBlock.textContent = A.generateCommandText(cfg);
  }

  function syncControlsFromCfg() {
    if (els.sizeInput) { els.sizeInput.value = cfg.size; els.sizeValue.textContent = cfg.size; }
    if (els.gapInput) { els.gapInput.value = cfg.gap; els.gapValue.textContent = cfg.gap; }
    if (els.thicknessInput) { els.thicknessInput.value = cfg.thickness; els.thicknessValue.textContent = cfg.thickness; }
    if (els.outlineThicknessInput) { els.outlineThicknessInput.value = cfg.outlineThickness; els.outlineThicknessValue.textContent = cfg.outlineThickness; }
    if (els.outlineToggle) els.outlineToggle.classList.toggle('is-on', !!cfg.outline);
    if (els.dotToggle) els.dotToggle.classList.toggle('is-on', !!cfg.dot);
    if (els.styleSelect) els.styleSelect.value = String(cfg.style);
    els.colorSwatches.forEach((sw) => sw.classList.toggle('is-active', sw.getAttribute('data-color') === cfg.color));
    els.bgSwatches.forEach((sw) => sw.classList.toggle('is-active', sw.getAttribute('data-bg') === background));
    if (stage) stage.setAttribute('data-bg', background);
    document.querySelectorAll('.outline-thickness-group').forEach((g) => {
      g.style.display = cfg.outline ? '' : 'none';
    });
    redraw();
  }

  function bindRange(input, valueEl, key, isFloat) {
    if (!input) return;
    input.addEventListener('input', () => {
      cfg[key] = isFloat ? parseFloat(input.value) : parseInt(input.value, 10);
      if (valueEl) valueEl.textContent = input.value;
      redraw();
    });
  }

  bindRange(els.sizeInput, els.sizeValue, 'size', true);
  bindRange(els.gapInput, els.gapValue, 'gap', true);
  bindRange(els.thicknessInput, els.thicknessValue, 'thickness', true);
  bindRange(els.outlineThicknessInput, els.outlineThicknessValue, 'outlineThickness', true);

  if (els.outlineToggle) {
    els.outlineToggle.addEventListener('click', () => {
      cfg.outline = !cfg.outline;
      syncControlsFromCfg();
    });
  }
  if (els.dotToggle) {
    els.dotToggle.addEventListener('click', () => {
      cfg.dot = !cfg.dot;
      syncControlsFromCfg();
    });
  }
  if (els.styleSelect) {
    els.styleSelect.addEventListener('change', () => {
      cfg.style = parseInt(els.styleSelect.value, 10);
      redraw();
    });
  }

  els.colorSwatches.forEach((sw) => {
    sw.addEventListener('click', () => {
      cfg.color = sw.getAttribute('data-color');
      syncControlsFromCfg();
    });
  });

  els.bgSwatches.forEach((sw) => {
    sw.addEventListener('click', () => {
      background = sw.getAttribute('data-bg');
      syncControlsFromCfg();
    });
  });

  if (els.resetBtn) {
    els.resetBtn.addEventListener('click', () => {
      cfg = { ...DEFAULT_CFG };
      background = 'grid';
      syncControlsFromCfg();
      A.showToast('Reset to default crosshair');
    });
  }

  if (els.randomBtn) {
    els.randomBtn.addEventListener('click', () => {
      const colors = Object.keys(A.CROSSHAIR_COLORS);
      cfg = {
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.round(Math.random() * 6 * 2) / 2,
        gap: Math.round((Math.random() * 8 - 5) * 2) / 2,
        thickness: Math.round((Math.random() * 2.5 + 0.5) * 10) / 10,
        outline: Math.random() > 0.25,
        outlineThickness: Math.round(Math.random() * 2 * 2) / 2,
        dot: Math.random() > 0.7,
        style: [2, 4, 4, 4, 5][Math.floor(Math.random() * 5)]
      };
      syncControlsFromCfg();
      A.showToast('Randomized crosshair');
    });
  }

  if (els.copyBtn) {
    els.copyBtn.addEventListener('click', async () => {
      const ok = await A.copyText(A.generateCommandText(cfg));
      A.showToast(ok ? 'Console commands copied to clipboard' : 'Could not copy — select the text manually');
    });
  }

  if (els.shareBtn) {
    els.shareBtn.addEventListener('click', async () => {
      const params = new URLSearchParams({
        color: cfg.color, size: cfg.size, gap: cfg.gap, thickness: cfg.thickness,
        outline: cfg.outline ? 1 : 0, ot: cfg.outlineThickness, dot: cfg.dot ? 1 : 0, style: cfg.style, bg: background
      });
      const url = `${location.origin}${location.pathname}?${params.toString()}`;
      history.replaceState(null, '', `?${params.toString()}`);
      const ok = await A.copyText(url);
      A.showToast(ok ? 'Shareable link copied to clipboard' : url);
    });
  }

  function loadFromURL() {
    const params = new URLSearchParams(location.search);
    if (![...params.keys()].length) return;
    cfg = {
      color: params.get('color') || DEFAULT_CFG.color,
      size: parseFloat(params.get('size')) || DEFAULT_CFG.size,
      gap: params.has('gap') ? parseFloat(params.get('gap')) : DEFAULT_CFG.gap,
      thickness: parseFloat(params.get('thickness')) || DEFAULT_CFG.thickness,
      outline: params.get('outline') !== '0',
      outlineThickness: params.has('ot') ? parseFloat(params.get('ot')) : DEFAULT_CFG.outlineThickness,
      dot: params.get('dot') === '1',
      style: parseInt(params.get('style'), 10) || DEFAULT_CFG.style
    };
    background = params.get('bg') || 'grid';
  }

  document.addEventListener('DOMContentLoaded', () => {
    loadFromURL();
    syncControlsFromCfg();
  });
})();
