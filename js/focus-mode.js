/* 課堂專注模式：以整個文件進入全螢幕，讓畫記、聚光燈與對話框仍可操作。 */
(() => {
  'use strict';
  function initialize() {
    const panes = [...document.querySelectorAll('.tab-pane')];
    const labels = {prep:'備課指引', units:'課堂教學', sandbox:'數位教具操作箱', practice:'隨堂練習', battle:'分組搶答', arcade:'互動遊戲', guide:'課程調整', iep:'隨堂診斷', islands:'對應數學島'};
    const expandIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/></svg>';
    const buttons = panes.map(pane => {
      const row = pane.querySelector(':scope > .lesson-focus-entry') || document.createElement('div');
      row.className = 'lesson-focus-entry';
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'lesson-focus-button';
      button.innerHTML = `${expandIcon}<span>全螢幕上課</span>`;
      button.setAttribute('aria-label', `${labels[pane.id.slice(4)]}：全螢幕上課`);
      button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', toggleFocus);
      row.appendChild(button);
      pane.prepend(row);
      return button;
    });
    // 保留入口原本的空間；捲過上緣後，讓教師仍能進入全螢幕。
    const entryObserver = new IntersectionObserver(entries => {
      entries.forEach(({target, boundingClientRect}) => {
        const pinned = target.closest('.tab-pane')?.classList.contains('active') && boundingClientRect.top < 12;
        if (pinned && !target.classList.contains('is-pinned')) {
          target.style.minHeight = `${target.getBoundingClientRect().height}px`;
        }
        target.classList.toggle('is-pinned', !!pinned);
      });
    }, {rootMargin:'-12px 0px 0px 0px', threshold:1});
    buttons.forEach(button => entryObserver.observe(button.parentElement));
    const bar = document.createElement('div');
    bar.className = 'lesson-focus-bar';
    bar.hidden = true;
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', '全螢幕課堂控制');
    bar.innerHTML = '<strong class="lesson-focus-label"></strong><label class="lesson-focus-unit">教學單元<select aria-label="全螢幕教學單元"></select></label><div class="lesson-focus-font" role="group" aria-label="課堂字級"><button type="button" data-font="smaller" aria-label="縮小課堂字級">A−</button><button type="button" data-font="reset" aria-label="還原課堂字級">100%</button><button type="button" data-font="larger" aria-label="放大課堂字級">A＋</button></div><button type="button" class="lesson-focus-exit">⤡ 離開全螢幕</button>';
    document.body.appendChild(bar);
    if (typeof ResizeObserver === 'function') new ResizeObserver(() => {
      document.documentElement.style.setProperty('--lesson-controls-height', `${bar.hidden ? 0 : bar.getBoundingClientRect().height}px`);
    }).observe(bar);
    const select = bar.querySelector('select');
    const sourceSelect = document.getElementById('lesson-unit-quick-select');
    if (sourceSelect) select.innerHTML = sourceSelect.innerHTML;
    select.addEventListener('change', () => {
      if (!sourceSelect) return;
      sourceSelect.value = select.value;
      sourceSelect.dispatchEvent(new Event('change', {bubbles:true}));
    });
    sourceSelect?.addEventListener('change', () => { select.value = sourceSelect.value; });
    const smaller = bar.querySelector('[data-font="smaller"]');
    const larger = bar.querySelector('[data-font="larger"]');
    const reset = bar.querySelector('[data-font="reset"]');
    let fallback = false, pending = false, active = false;
    let previousFocus = null, previousScroll = null;
    let baseFontSize = null, previousFontSize = '', scale = 100;
    const fullscreen = () => document.fullscreenElement || document.webkitFullscreenElement;
    function resizeText(nextScale) {
      scale = Math.max(80, Math.min(180, nextScale));
      if (baseFontSize !== null) document.documentElement.style.fontSize = `${baseFontSize * scale / 100}px`;
      reset.textContent = `${scale}%`;
      reset.setAttribute('aria-label', `還原課堂字級，目前 ${scale}%`);
      smaller.disabled = scale <= 80;
      larger.disabled = scale >= 180;
      window.dispatchEvent(new Event('resize'));
    }
    smaller.addEventListener('click', () => resizeText(scale - 10));
    larger.addEventListener('click', () => resizeText(scale + 10));
    reset.addEventListener('click', () => resizeText(100));
    function synchronize() {
      const wasActive = active;
      active = fallback || fullscreen() === document.documentElement;
      if (active && !wasActive) {
        previousFontSize = document.documentElement.style.fontSize;
        baseFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
        resizeText(scale);
      } else if (!active && wasActive) {
        document.documentElement.style.fontSize = previousFontSize;
        baseFontSize = null;
      }
      document.body.classList.toggle('lesson-focus', active);
      document.documentElement.classList.toggle('lesson-focus-fallback', fallback);
      bar.hidden = !active;
      buttons.forEach(button => button.setAttribute('aria-pressed', String(active)));
      const current = document.querySelector('.tab-pane.active');
      bar.querySelector('.lesson-focus-label').textContent = labels[current?.id.slice(4)] || '專心上課';
      bar.querySelector('.lesson-focus-unit').hidden = current?.id !== 'tab-units';
      window.MathLessonFlow?.setFocus(active, bar);
      if (sourceSelect) select.value = sourceSelect.value;
      if (!active && wasActive) {
        if (previousScroll) window.scrollTo(previousScroll.x, previousScroll.y);
        previousScroll = null;
        if (previousFocus?.isConnected) previousFocus.focus({preventScroll:true});
        previousFocus = null;
      }
      window.dispatchEvent(new Event('resize'));
    }
    async function toggleFocus() {
      if (pending) return;
      pending = true;
      const entering = !fullscreen() && !fallback;
      try {
        if (fullscreen()) {
          const exit = document.exitFullscreen || document.webkitExitFullscreen;
          await exit.call(document);
        } else if (fallback) {
          fallback = false;
        } else {
          previousFocus = document.activeElement;
          previousScroll = {x:window.scrollX, y:window.scrollY};
          const root = document.documentElement;
          const request = root.requestFullscreen || root.webkitRequestFullscreen;
          try {
            if (!request) throw new Error('Fullscreen unavailable');
            await request.call(root);
          } catch {
            fallback = true;
          }
          window.scrollTo(0, 0);
        }
      } finally {
        synchronize();
        if (entering && active) bar.querySelector('.lesson-focus-exit').focus({preventScroll:true});
        pending = false;
      }
    }
    bar.querySelector('.lesson-focus-exit').addEventListener('click', toggleFocus);
    bar.addEventListener('keydown', event => { if (event.key !== 'Escape') event.stopPropagation(); });
    document.addEventListener('fullscreenchange', synchronize);
    document.addEventListener('webkitfullscreenchange', synchronize);
    document.addEventListener('math-tab-change', synchronize);
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && fallback) { fallback = false; synchronize(); }
    });
    window.MathLessonFocus = {toggle:toggleFocus};
    synchronize();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize);
  else initialize();
})();
