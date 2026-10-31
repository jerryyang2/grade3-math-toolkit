/* 手繪視覺層：只處理圖示、插畫互動與選單，不改變教學或作答資料。 */
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
  outlines.print = '<path d="M18 24V9h28v15M18 47H9V25h46v22h-9M18 38h28v17H18zM43 31h5M24 44h16M24 49h16"/>';
  function icon(name) {
    return `<svg class="sketch-icon" viewBox="0 0 64 64" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${outlines[name] || outlines.book}</svg>`;
  }
  function character(id) {
    const type = { lele: 'rabbit', foxie: 'fox', bobo: 'bear', tuzi: 'cat' }[id] || 'rabbit';
    return window.AnimalGarden?.character(type) || '';
  }
  window.StorybookTheme = { icon, character };
  document.addEventListener('DOMContentLoaded', () => {
    const map = { prep:'pencil', units:'book', sandbox:'case', practice:'pencil', battle:'flag', arcade:'star', guide:'leaf', iep:'chart' };
    document.querySelectorAll('.nav-tab').forEach(button => {
      const label = button.textContent.trim();
      const title = label.replace(/^\S+\s+/, '');
      button.setAttribute('aria-label', label);
      button.innerHTML = `${icon(button.id === 'btn-nav-worksheet' ? 'print' : map[button.dataset.tab])}<span>${title}</span>`;
    });
    const settings = document.getElementById('display-settings');
    document.addEventListener('click', event => {
      if (settings?.open && !settings.contains(event.target)) settings.open = false;
    });
    settings?.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        settings.open = false;
        settings.querySelector('summary').focus();
      }
    });
  });
})();
