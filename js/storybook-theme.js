/* 手繪視覺層：只處理圖示、插畫互動與動態偏好，不改變教學或作答資料。 */
(function () {
  'use strict';
  const outlines = {
    book: '<path d="M10 16Q22 10 32 18Q44 10 54 16L52 49Q41 44 32 51Q21 44 11 49Z" fill="#f6dc91"/><path d="M32 18V51M17 24l9 1M17 32l9 1M39 24l8-1M39 32l8-1"/>',
    case: '<path d="M11 22l42-1 2 29-45 1Z" fill="#cbd9bc"/><path d="M23 22l1-10 17 1 1 9M11 32q21 7 43-1M29 32v9h8v-9"/>',
    pencil: '<path d="M14 43L40 12l11 10-27 31-14 3Z" fill="#edc86f"/><path d="M14 43l10 10M34 19l11 10M17 45l24-27M10 56l4-13"/>',
    flag: '<path d="M15 54l3-44M19 13q10-8 19 0t15-1l-1 22q-8 7-17 0t-17 1" fill="#e9b0a0"/><path d="M10 55h17"/>',
    star: '<path d="M32 7l8 15 17 3-13 13 2 19-16-9-17 8 4-19L5 23l19-2Z" fill="#f0d47e"/>',
    leaf: '<path d="M13 49C1 25 25 9 54 10c2 30-17 52-41 39Z" fill="#c2d2af"/><path d="M12 53l30-31M24 41l-2-14M31 33l14-2"/>',
    chart: '<path d="M11 10l-1 43 46 1M19 42l10-14 10 5 13-16"/><circle cx="29" cy="28" r="4" fill="#e7b196"/><circle cx="52" cy="17" r="4" fill="#bfd2b1"/>',
    u1: '<ellipse cx="29" cy="47" rx="22" ry="9" fill="#e7bd66"/><path d="M7 37v10m44-10v10"/><ellipse cx="29" cy="37" rx="22" ry="9" fill="#f5d88a"/><ellipse cx="36" cy="23" rx="21" ry="9" fill="#f5d88a"/><path d="M15 14v9m42-9v9"/><ellipse cx="36" cy="14" rx="21" ry="9" fill="#f5d88a"/>',
    u2: '<path d="M14 8l39 2-3 46-39-2Z" fill="#fff9e9"/><path d="M23 19h18M22 29h18M20 43h21M29 34v9"/><path d="M5 55l5-13 9 8Z" fill="#e5b76d"/>',
    u3: '<path d="M13 13l38 38M49 12L13 49" stroke-width="11" stroke="#e3b09e"/><path d="M13 13l38 38M49 12L13 49"/>',
    u4: '<path d="M7 23l44-12 9 29-44 13Z" fill="#f2d68e"/><path d="M15 22l3 11M24 19l2 7M33 17l3 11M43 14l2 7"/>',
    u5: '<path d="M8 48L30 9l24 40Z" fill="#c6d7df"/><path d="M31 48V35h12"/><path d="M40 16h17v17H40Z" fill="#e9c994"/>',
    u6: '<path d="M8 28h48v13H8Z" fill="#dfad95"/><circle cx="32" cy="12" r="6" fill="#dfad95"/><circle cx="32" cy="54" r="6" fill="#dfad95"/>',
    u7: '<path d="M22 8h20v11l7 9v27H16V28l6-9Z" fill="#c6dbd1"/><path d="M23 8V3h18v5M17 37q14-8 31-1M25 46h15"/>',
    u8: '<circle cx="32" cy="32" r="25" fill="#f1d493"/><path d="M32 7v25l23 9M32 32L11 46"/><circle cx="21" cy="22" r="3" fill="#d9987c"/><circle cx="40" cy="44" r="3" fill="#d9987c"/><circle cx="20" cy="39" r="3" fill="#8ba378"/>',
    u9: '<circle cx="32" cy="32" r="24" fill="#f7e5b7"/><path d="M8 32h48M32 32l16-18"/><circle cx="32" cy="32" r="4" fill="#d99278"/>'
  };
  function icon(name) {
    return `<svg class="sketch-icon" viewBox="0 0 64 64" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${outlines[name] || outlines.book}</svg>`;
  }
  function character(id) {
    const head = {
      lele: '<path d="M19 34l4-17 15 2L48 8l15 10 16-6 9 15 16 4-2 18 10 15-13 13-1 19-18 3-14 11-16-9-19 3-7-18L9 76l5-19Z" fill="#dca256"/><path d="M33 48q-6-21 8-20l10 14m26-2q12-20 20-6l-5 18" fill="#f3d496"/><path d="M31 51q33-25 62 0l-3 29q-28 28-56 0Z" fill="#f3d496"/>',
      foxie: '<path d="M19 70L18 16l32 21q15-6 29 0l31-23-4 56q-9 34-44 39Q28 99 19 70Z" fill="#d78d62"/><path d="M21 66l37 18 47-19q-7 33-43 42Q29 96 21 66Z" fill="#fff3d7"/>',
      bobo: '<circle cx="28" cy="33" r="18" fill="#b99572"/><circle cx="99" cy="32" r="18" fill="#b99572"/><path d="M19 65q1-39 45-38 44 2 45 40-1 40-45 42Q18 103 19 65Z" fill="#c5a582"/><ellipse cx="64" cy="82" rx="22" ry="17" fill="#f6e8ce"/>',
      tuzi: '<path d="M35 48Q8-1 31 5q14 1 23 40m19-1Q79-8 99 5q14 12-8 46" fill="#f7ebd7"/><path d="M19 75q0-38 45-36 45 0 45 37-3 32-45 33Q22 108 19 75Z" fill="#f7ebd7"/><path d="M31 17l12 23m44-24-6 25" stroke="#dca4a0" stroke-width="7"/>'
    };
    return `<svg class="storybook-character" viewBox="0 0 128 120" aria-hidden="true" focusable="false" stroke="#5d4938" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${head[id] || head.lele}<path d="M44 66l1 2m37-2-1 2" stroke-width="5"/><path d="M59 78q5-5 10 0l-5 5Zm5 5v5m-9-1q9 10 18 0" fill="#5d4938"/><path d="M31 79l9 2m47 0 10-2" stroke="#d69a88" stroke-width="5"/></svg>`;
  }
  window.StorybookTheme = { icon, character };
  document.addEventListener('DOMContentLoaded', () => {
    const map = { units:'book', sandbox:'case', practice:'pencil', battle:'flag', arcade:'star', guide:'leaf', iep:'chart' };
    document.querySelectorAll('.nav-tab').forEach(button => {
      const label = button.textContent.trim();
      const title = label.replace(/^\S+\s+/, '');
      button.setAttribute('aria-label', label);
      button.innerHTML = `${icon(map[button.dataset.tab])}<span>${title}</span>`;
    });
    const pause = document.getElementById('storybook-motion-toggle');
    let paused = false;
    try { paused = localStorage.getItem('math_storybook_motion') === 'paused'; } catch (_) {}
    function renderMotion() {
      document.body.classList.toggle('storybook-motion-paused', paused);
      if (pause) {
        pause.setAttribute('aria-pressed', String(paused));
        pause.textContent = paused ? '播放小動畫' : '暫停小動畫';
      }
    }
    pause?.addEventListener('click', () => {
      paused = !paused; renderMotion();
      try { localStorage.setItem('math_storybook_motion', paused ? 'paused' : 'playing'); } catch (_) {}
    });
    renderMotion();
    const greet = document.getElementById('storybook-greet');
    const speech = document.getElementById('storybook-speech');
    const art = document.querySelector('.storybook-art');
    const greetings = ['慢慢來，我們一起試試看。', '先動手，再說說你的發現！', '換個方法，也是一個好主意。'];
    let greeting = 0;
    greet?.addEventListener('click', () => {
      speech.textContent = greetings[greeting++ % greetings.length];
      art.classList.remove('is-waving');
      requestAnimationFrame(() => art.classList.add('is-waving'));
    });
    art?.addEventListener('animationend', () => art.classList.remove('is-waving'));
  });
})();
