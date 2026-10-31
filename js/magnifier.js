/* 本機 DOM 局部放大：不擷取螢幕、不上傳畫面，複本隔離在 Shadow DOM。 */
(function () {
  'use strict';
  let active = false;
  let lens, shadow, page, zoomLabel;
  let point = { x: 0, y: 0 };
  let frame = 0, refreshTimer = 0;
  let zoom = 2;
  let diameter = 200;
  const excluded = '.mft-ui,.mft-editor,.mft-toast,.mft-magnifier,.spotlight-layer,#effects-canvas,script,iframe,video,audio';
  function createLens() {
    if (lens) return;
    lens = document.createElement('div');
    lens.className = 'mft-magnifier';
    lens.setAttribute('aria-hidden', 'true');
    lens.hidden = true;
    shadow = lens.attachShadow({ mode: 'open' });
    zoomLabel = document.createElement('span');
    zoomLabel.className = 'mft-lens-label';
    zoomLabel.textContent = `${zoom}×`;
    shadow.appendChild(zoomLabel);
    document.body.appendChild(lens);
  }
  function refresh() {
    refreshTimer = 0;
    if (!active) return;
    const root = document.createElement('html');
    root.lang = document.documentElement.lang;
    root.className = document.documentElement.className;
    root.setAttribute('aria-hidden', 'true');
    root.inert = true;
    root.style.cssText = `position:absolute!important;display:block!important;width:${window.innerWidth}px!important;min-width:0!important;margin:0!important;padding:0!important;transform:scale(${zoom})!important;transform-origin:0 0!important;pointer-events:none!important;`;
    const head = document.createElement('head');
    document.head.querySelectorAll('link[rel="stylesheet"],style').forEach(style => head.appendChild(style.cloneNode(true)));
    const body = document.body.cloneNode(true);
    const originals = document.body.querySelectorAll('*');
    const copies = body.querySelectorAll('*');
    const scrollCopies = [];
    originals.forEach((original, index) => {
      const copy = copies[index];
      if (!copy || original.closest(excluded)) return;
      // cloneNode 不會保留表單當前值、捲動位置或 canvas 像素。
      if (original.matches('input,textarea,select')) {
        copy.value = original.value;
        if ('checked' in original) copy.checked = original.checked;
      }
      if (original.tagName === 'CANVAS') {
        try { copy.getContext('2d').drawImage(original, 0, 0); } catch (_) { /* 略過裝置無法複製的圖層。 */ }
      }
      if (original.scrollLeft || original.scrollTop) scrollCopies.push([copy, original.scrollLeft, original.scrollTop]);
      const position = getComputedStyle(original).position;
      if (position !== 'fixed' && position !== 'sticky') return;
      const rect = original.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      // 黏著頁首維持原本流動空間，再按目前的可見位置繪入放大畫面。
      if (position === 'sticky') {
        const spacer = document.createElement('div');
        spacer.style.cssText = `width:${rect.width}px;height:${rect.height}px;flex-shrink:0;`;
        copy.replaceWith(spacer);
      }
      copy.style.setProperty('position', 'absolute', 'important');
      copy.style.setProperty('left', `${rect.left + window.scrollX}px`, 'important');
      copy.style.setProperty('top', `${rect.top + window.scrollY}px`, 'important');
      copy.style.setProperty('right', 'auto', 'important');
      copy.style.setProperty('bottom', 'auto', 'important');
      copy.style.setProperty('width', `${rect.width}px`, 'important');
      copy.style.setProperty('height', `${rect.height}px`, 'important');
      copy.style.setProperty('margin', '0', 'important');
      body.appendChild(copy);
    });
    body.querySelectorAll(excluded).forEach(node => node.remove());
    root.append(head, body);
    if (page) page.replaceWith(root); else shadow.prepend(root);
    page = root;
    // 這份規則放最後，確保遊戲和首頁都只顯示靜止、不可操作的複本。
    const rules = document.createElement('style');
    rules.textContent = `:host{pointer-events:none}*,*::before,*::after{animation-play-state:paused!important;transition:none!important;caret-color:transparent!important} .mft-lens-label{position:absolute;left:50%;bottom:10px;transform:translateX(-50%);z-index:2147483647;background:#172f25;color:white;border:1px solid white;border-radius:7px;padding:1px 7px;font:700 14px/1.5 sans-serif} html::-webkit-scrollbar{display:none}`;
    head.appendChild(rules);
    scrollCopies.forEach(([copy, x, y]) => { copy.scrollLeft = x; copy.scrollTop = y; });
    positionLens();
  }
  function positionLens() {
    frame = 0;
    if (!active || !page) return;
    const size = Math.min(diameter, window.innerWidth - 24, window.innerHeight - 24);
    const gap = 24;
    let left = point.x + gap, top = point.y + gap;
    if (left + size > window.innerWidth - 8) left = point.x - size - gap;
    if (top + size > window.innerHeight - 8) top = point.y - size - gap;
    left = Math.max(8, Math.min(window.innerWidth - size - 8, left));
    top = Math.max(8, Math.min(window.innerHeight - size - 8, top));
    lens.style.width = `${size}px`;
    lens.style.height = `${size}px`;
    lens.style.left = `${left}px`;
    lens.style.top = `${top}px`;
    // 來源點放在鏡片中央；以文件座標補償頁面捲動。
    page.style.left = `${(size - 8) / 2 - (point.x + window.scrollX) * zoom}px`;
    page.style.top = `${(size - 8) / 2 - (point.y + window.scrollY) * zoom}px`;
  }
  function setSize(value) {
    const next = Number(value);
    if (!Number.isFinite(next)) return diameter;
    diameter = Math.min(400, Math.max(140, Math.round(next / 20) * 20));
    positionLens();
    return diameter;
  }
  function setZoom(value) {
    const next = Number(value);
    if (!Number.isFinite(next)) return zoom;
    zoom = Math.min(4, Math.max(1.5, Math.round(next * 2) / 2));
    if (page) page.style.setProperty('transform', `scale(${zoom})`, 'important');
    if (zoomLabel) zoomLabel.textContent = `${zoom}×`;
    positionLens();
    return zoom;
  }
  function scheduleRefresh(event) {
    if (event?.target?.closest?.('.mft-ui')) return;
    if (active && !refreshTimer) refreshTimer = window.setTimeout(refresh, 90);
  }
  function setActive(value) {
    active = value;
    if (!value) {
      if (lens) lens.hidden = true;
      clearTimeout(refreshTimer); refreshTimer = 0;
      return;
    }
    createLens();
    (document.fullscreenElement || document.body).appendChild(lens);
    lens.hidden = false;
    point = { x: window.innerWidth / 2, y: window.innerHeight * .45 };
    refresh();
  }
  function init() {
    window.addEventListener('pointermove', event => {
      if (!active || event.target.closest('.mft-ui')) return;
      point = { x: event.clientX, y: event.clientY };
      if (!frame) frame = requestAnimationFrame(positionLens);
    }, { passive: true });
    window.addEventListener('pointerdown', event => {
      if (!active || event.target.closest('.mft-ui')) return;
      point = { x: event.clientX, y: event.clientY }; positionLens();
    }, { passive: true });
    document.addEventListener('focusin', event => {
      if (!active || event.target.closest('.mft-ui')) return;
      const rect = event.target.getBoundingClientRect();
      point = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }; positionLens();
    });
    document.addEventListener('input', scheduleRefresh);
    document.addEventListener('change', scheduleRefresh);
    window.addEventListener('scroll', () => { positionLens(); scheduleRefresh(); }, { passive: true, capture: true });
    window.addEventListener('resize', scheduleRefresh);
    window.addEventListener('beforeprint', () => setActive(false));
    const observer = new MutationObserver(records => {
      if (records.some(record => !record.target.closest?.('.mft-ui,.mft-overlay,.mft-editor,.mft-toast,.mft-magnifier,.spotlight-layer'))) scheduleRefresh();
    });
    observer.observe(document.getElementById('main-content-area') || document.querySelector('main') || document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'src', 'style', 'open'] });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }
  window.MathMagnifier = { setActive, setZoom, setSize };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
