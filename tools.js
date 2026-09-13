/* ==========================================================================
   AIMVAULT — tools.js
   Real, working calculators for tools.html. All math runs client-side —
   no network calls, no hidden dependencies.
   ========================================================================== */

(function () {
  'use strict';

  // Approximate, commonly-used community yaw constants (degrees turned per
  // mouse count at sensitivity 1). These vary slightly with in-game FOV and
  // are provided for comparison only — always confirm in your target game.
  const GAME_YAW = {
    cs2: 0.022,
    valorant: 0.07,
    apex: 0.022,
    fortnite: 0.05555
  };

  function fmt(n, digits) {
    if (!isFinite(n)) return '—';
    return n.toLocaleString(undefined, { maximumFractionDigits: digits != null ? digits : 2, minimumFractionDigits: 0 });
  }

  /* ---------------- eDPI calculator ---------------- */
  function initEdpi() {
    const sens = document.getElementById('edpi-sens');
    const dpi = document.getElementById('edpi-dpi');
    const out = document.getElementById('edpi-result');
    if (!sens || !dpi || !out) return;

    function update() {
      const s = parseFloat(sens.value);
      const d = parseFloat(dpi.value);
      if (!s || !d) { out.textContent = '—'; return; }
      out.textContent = fmt(s * d, 0);
    }
    [sens, dpi].forEach((i) => i.addEventListener('input', update));
    update();
  }

  /* ---------------- Sensitivity converter ---------------- */
  function initSensConverter() {
    const fromGame = document.getElementById('conv-from-game');
    const fromSens = document.getElementById('conv-from-sens');
    const dpi = document.getElementById('conv-dpi');
    const toGame = document.getElementById('conv-to-game');
    const out = document.getElementById('conv-result');
    const outCm = document.getElementById('conv-result-cm');
    if (!fromGame || !fromSens || !dpi || !toGame || !out) return;

    function update() {
      const yawFrom = GAME_YAW[fromGame.value];
      const yawTo = GAME_YAW[toGame.value];
      const s = parseFloat(fromSens.value);
      const d = parseFloat(dpi.value);
      if (!s || !d || !yawFrom || !yawTo) { out.textContent = '—'; if (outCm) outCm.textContent = '—'; return; }

      const targetSens = s * yawFrom / yawTo;
      out.textContent = fmt(targetSens, 3);

      if (outCm) {
        const countsPer360 = 360 / (s * yawFrom);
        const cm360 = (countsPer360 / d) * 2.54;
        outCm.textContent = `${fmt(cm360, 1)} cm/360`;
      }
    }
    [fromGame, fromSens, dpi, toGame].forEach((i) => i.addEventListener('input', update));
    update();
  }

  /* ---------------- FOV calculator ---------------- */
  function initFov() {
    const hfov = document.getElementById('fov-hfov');
    const fromAr = document.getElementById('fov-from-ar');
    const toAr = document.getElementById('fov-to-ar');
    const out = document.getElementById('fov-result');
    if (!hfov || !fromAr || !toAr || !out) return;

    function aspectValue(select) {
      const [w, h] = select.value.split(':').map(Number);
      return w / h;
    }

    function update() {
      const oldHfov = parseFloat(hfov.value);
      if (!oldHfov) { out.textContent = '—'; return; }
      const oldAspect = aspectValue(fromAr);
      const newAspect = aspectValue(toAr);
      const rad = (oldHfov * Math.PI) / 180 / 2;
      const newRad = Math.atan(Math.tan(rad) * (newAspect / oldAspect));
      const newHfov = (newRad * 2 * 180) / Math.PI;
      out.textContent = `${fmt(newHfov, 1)}°`;
    }
    [hfov, fromAr, toAr].forEach((i) => i.addEventListener('input', update));
    update();
  }

  /* ---------------- Mouse sensitivity (cm/360) calculator ---------------- */
  function initCm360() {
    const sens = document.getElementById('cm360-sens');
    const dpi = document.getElementById('cm360-dpi');
    const game = document.getElementById('cm360-game');
    const outCm = document.getElementById('cm360-result-cm');
    const outIn = document.getElementById('cm360-result-in');
    if (!sens || !dpi || !game || !outCm) return;

    function update() {
      const s = parseFloat(sens.value);
      const d = parseFloat(dpi.value);
      const yaw = GAME_YAW[game.value];
      if (!s || !d || !yaw) { outCm.textContent = '—'; if (outIn) outIn.textContent = '—'; return; }
      const countsPer360 = 360 / (s * yaw);
      const inches360 = countsPer360 / d;
      outCm.textContent = `${fmt(inches360 * 2.54, 1)} cm`;
      if (outIn) outIn.textContent = `${fmt(inches360, 1)} in`;
    }
    [sens, dpi, game].forEach((i) => i.addEventListener('input', update));
    update();
  }

  document.addEventListener('DOMContentLoaded', () => {
    initEdpi();
    initSensConverter();
    initFov();
    initCm360();
  });
})();
