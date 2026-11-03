/* 可選用的課堂計時器；以截止時間計算，背景分頁恢復後不累積秒差。 */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.ClassroomTimer = api; api.mount(root); }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  const MAX = 180 * 60000;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  function fitFrame(frame, view) {
    const width = clamp(frame.width, Math.min(280, view.width - 16), view.width - 16);
    const height = clamp(frame.height, Math.min(260, view.height - 16), view.height - 16);
    return {width, height, left: clamp(frame.left, 8, view.width - width - 8), top: clamp(frame.top, 8, view.height - height - 8)};
  }
  function resizeFrame(frame, edge, dx, dy, view) {
    let {left, top, width, height} = fitFrame(frame, view);
    let right = left + width, bottom = top + height;
    const minWidth = Math.min(280, view.width - 16), minHeight = Math.min(260, view.height - 16);
    if (edge.includes('w')) left = clamp(left + dx, 8, right - minWidth);
    if (edge.includes('e')) right = clamp(right + dx, left + minWidth, view.width - 8);
    if (edge.includes('n')) top = clamp(top + dy, 8, bottom - minHeight);
    if (edge.includes('s')) bottom = clamp(bottom + dy, top + minHeight, view.height - 8);
    return {left, top, width: right - left, height: bottom - top};
  }
  function create({now = () => Date.now(), onChange = () => {}, onFinish = () => {}} = {}) {
    let total = 5 * 60000, remaining = total, deadline = null, phase = 'ready';
    const read = () => ({phase, totalSeconds: total / 1000,
      seconds: Math.ceil(Math.max(0, phase === 'running' ? deadline - now() : remaining) / 1000)});
    const notify = () => { const state = read(); onChange(state); return state; };
    function tick() {
      if (phase === 'running' && deadline <= now()) {
        remaining = 0; deadline = null; phase = 'finished';
        notify(); onFinish();
      } else if (phase === 'running') notify();
      return read();
    }
    return {read, tick,
      configure(minutes) {
        if (!Number.isInteger(minutes) || minutes < 1 || minutes > 180) throw new RangeError('請輸入 1 到 180 的整數分鐘。');
        if (phase === 'running') return read();
        total = remaining = minutes * 60000; deadline = null; phase = 'ready'; return notify();
      },
      start() {
        if (phase === 'running') return read();
        if (phase === 'finished') remaining = total;
        deadline = now() + remaining; phase = 'running'; return notify();
      },
      pause() {
        tick();
        if (phase === 'running') { remaining = Math.max(0, deadline - now()); deadline = null; phase = 'paused'; }
        return notify();
      },
      extend(minutes) {
        if (!Number.isInteger(minutes) || minutes < 1 || minutes > 180) throw new RangeError('延長時間須為正整數分鐘。');
        tick();
        const extra = Math.min(minutes * 60000, MAX - total);
        if (!extra) return read();
        total += extra;
        if (phase === 'running') deadline += extra;
        else { remaining += extra; if (phase === 'finished') phase = 'paused'; }
        return notify();
      },
      reset() { remaining = total; deadline = null; phase = 'ready'; return notify(); }
    };
  }
  function mount(win) {
    const doc = win.document;
    if (!doc || win.classroomClock) return;
    function ready() {
      if (win.classroomClock) return;
      const host = doc.createElement('div');
      host.className = 'classroom-clock';
      host.innerHTML = `<section id="classroom-clock-panel" class="classroom-clock-panel" role="dialog" aria-modal="false" aria-labelledby="classroom-clock-title" hidden>
        <header class="classroom-clock-header"><div class="classroom-clock-heading" tabindex="0" role="group" aria-label="移動計時器：拖曳標題，或使用方向鍵"><span class="classroom-clock-eyebrow">照自己的步調，掌握時間</span><h2 id="classroom-clock-title">課堂計時器</h2></div><div class="classroom-clock-window-buttons">
          <button type="button" data-clock="settings" aria-expanded="false" title="顯示計時設定" aria-label="顯示計時設定" hidden>⚙</button>
          <button type="button" data-clock="fullscreen" aria-pressed="false" title="全螢幕計時" aria-label="全螢幕計時">⛶</button>
          <button type="button" data-clock="size-reset" title="還原視窗大小" aria-label="還原視窗大小">↺</button>
          <button type="button" data-clock="minimize" title="縮成小卡，繼續計時" aria-label="縮成小卡，繼續計時">−</button>
          <button type="button" data-clock="close" title="關閉並暫停" aria-label="關閉並暫停">×</button></div></header>
        <p class="classroom-clock-size-hint">拖曳標題可移動，拖曳邊框可縮放。</p>
        <div class="classroom-clock-body"><label class="classroom-clock-purpose">這段時間用來<select id="classroom-clock-purpose"><option>練習時間</option><option>考試時間</option><option>分組活動</option><option>收拾教具</option></select></label>
          <div class="classroom-clock-readout" role="timer" aria-live="off"><span id="classroom-clock-digits">05:00</span></div>
          <p id="classroom-clock-status" class="classroom-clock-status" role="status" aria-live="polite">準備好了再開始</p>
          <div class="classroom-clock-track" aria-hidden="true"><div id="classroom-clock-progress"></div></div>
          <fieldset class="classroom-clock-settings"><legend>設定時間</legend><div class="classroom-clock-presets">${[3,5,10,20,40].map(n => `<button type="button" data-clock-minutes="${n}">${n} 分鐘</button>`).join('')}</div>
            <form id="classroom-clock-form"><label for="classroom-clock-minutes">自訂分鐘</label><input id="classroom-clock-minutes" type="number" min="1" max="180" step="1" value="5" required><button type="submit">套用</button></form>
            <p id="classroom-clock-error" role="alert" hidden></p></fieldset>
          <div class="classroom-clock-actions"><button type="button" class="classroom-clock-primary" data-clock="toggle">開始計時</button><button type="button" data-clock="reset">重設</button></div>
          <div class="classroom-clock-extend"><span>需要多一點時間</span><button type="button" data-clock-add="1">＋1 分鐘</button><button type="button" data-clock-add="5">＋5 分鐘</button></div>
          <div class="classroom-clock-options"><label><input id="classroom-clock-seconds" type="checkbox" checked>顯示秒數</label><label><input id="classroom-clock-sound" type="checkbox">結束提示音</label></div>
          <p class="classroom-clock-note">計時可暫停或延長。縮成小卡會繼續計時，關閉則暫停。</p>
        </div>
        <div class="classroom-clock-grip" data-clock-edge="n" aria-hidden="true"></div><div class="classroom-clock-grip" data-clock-edge="e" aria-hidden="true"></div><div class="classroom-clock-grip" data-clock-edge="s" aria-hidden="true"></div><div class="classroom-clock-grip" data-clock-edge="w" aria-hidden="true"></div>
        <div class="classroom-clock-grip" data-clock-edge="nw" aria-hidden="true"></div><div class="classroom-clock-grip" data-clock-edge="ne" aria-hidden="true"></div><div class="classroom-clock-grip" data-clock-edge="sw" aria-hidden="true"></div><button type="button" class="classroom-clock-grip" data-clock-edge="se" aria-label="調整計時器大小：拖曳邊框，或使用方向鍵" title="調整計時器大小：拖曳邊框，或使用方向鍵">◢</button></section>
        <button type="button" id="classroom-clock-chip" class="classroom-clock-chip" aria-controls="classroom-clock-panel" aria-expanded="false" hidden><span aria-hidden="true">◷</span><span id="classroom-clock-chip-purpose">練習時間</span><strong id="classroom-clock-chip-time">05:00</strong><span id="classroom-clock-chip-state"></span></button>`;
      doc.body.append(host);
      const panel = host.querySelector('#classroom-clock-panel'), chip = host.querySelector('#classroom-clock-chip');
      const $ = selector => host.querySelector(selector);
      const t = text => win.MathI18n?.t(text) ?? text;
      let interval = null, lastPhase = '', lastTotal = 0, lastFocus = null, audio = null, minimized = false;
      let frame = null, gesture = null, full = false, ownedNative = false, fullWithin = null, fullscreenPending = false;
      const viewport = () => ({width: win.innerWidth || 1024, height: win.innerHeight || 768});
      function place(next) {
        const body = panel.querySelector('.classroom-clock-body'), scroll = body.scrollTop;
        frame = fitFrame(next, viewport());
        Object.assign(panel.style, {left: `${frame.left}px`, top: `${frame.top}px`, width: `${frame.width}px`, height: `${frame.height}px`, right: 'auto', bottom: 'auto'});
        panel.style.setProperty('--clock-font', `${Math.max(36, Math.min(frame.width * .19, frame.height * .25, 200))}px`);
        body.scrollTop = scroll;
      }
      function defaultSize() {
        const view = viewport();
        place({width: 390, height: 640, left: view.width - 414, top: view.height - 664});
      }
      function fullscreenUI(value) {
        full = value; panel.classList.toggle('is-fullscreen', value); panel.classList.remove('show-settings');
        $('[data-clock="fullscreen"]').setAttribute('aria-pressed', String(value));
        const label = t(value ? '離開計時器全螢幕' : '全螢幕計時');
        $('[data-clock="fullscreen"]').setAttribute('aria-label', label); $('[data-clock="fullscreen"]').title = label;
        $('[data-clock="settings"]').hidden = !value; $('[data-clock="settings"]').setAttribute('aria-expanded', 'false');
        $('[data-clock="size-reset"]').hidden = value;
        panel.querySelectorAll('[data-clock-edge]').forEach(el => { el.hidden = value; });
      }
      function exitFull() {
        const exitNative = ownedNative && doc.fullscreenElement === panel;
        ownedNative = false; fullWithin = null; fullscreenUI(false);
        if (exitNative) doc.exitFullscreen?.().catch(() => {});
        if (frame) place(frame);
      }
      async function toggleFull() {
        if (fullscreenPending) return;
        if (full) { exitFull(); return; }
        fullscreenUI(true); panel.querySelector('.classroom-clock-body').scrollTop = 0;
        fullWithin = doc.fullscreenElement || null;
        // 已在全螢幕上課時直接鋪滿畫面，保留原有課堂模式與教學步驟。
        if (!fullWithin && panel.requestFullscreen) {
          fullscreenPending = true;
          try { await panel.requestFullscreen(); ownedNative = true; if (!full) exitFull(); }
          catch (_) { /* 不支援或拒絕原生全螢幕時仍保留滿版顯示。 */ }
          finally { fullscreenPending = false; }
        }
      }
      panel.addEventListener('pointerdown', event => {
        if (full || (event.button !== undefined && event.button !== 0)) return;
        const edge = event.target.closest('[data-clock-edge]');
        const header = event.target.closest('.classroom-clock-header');
        if (!edge && (!header || event.target.closest('button'))) return;
        if (!frame) defaultSize();
        if (edge) panel.querySelector('.classroom-clock-body').scrollTop = 0;
        gesture = {id: event.pointerId, x: event.clientX, y: event.clientY, frame: {...frame}, edge: edge?.dataset.clockEdge};
        panel.setPointerCapture?.(event.pointerId); event.preventDefault();
      });
      panel.addEventListener('pointermove', event => {
        if (!gesture || gesture.id !== event.pointerId) return;
        const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y, start = gesture.frame;
        place(gesture.edge ? resizeFrame(start, gesture.edge, dx, dy, viewport()) : {...start, left: start.left + dx, top: start.top + dy});
      });
      const endGesture = () => { gesture = null; };
      ['pointerup','pointercancel','lostpointercapture'].forEach(name => panel.addEventListener(name, endGesture));
      panel.addEventListener('keydown', event => {
        const resize = event.target.matches('[data-clock-edge="se"]'), move = event.target.matches('.classroom-clock-heading');
        if (full || (!resize && !move) || !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) return;
        event.preventDefault(); event.stopPropagation();
        const amount = event.shiftKey ? 20 : 10, dx = event.key === 'ArrowLeft' ? -amount : event.key === 'ArrowRight' ? amount : 0, dy = event.key === 'ArrowUp' ? -amount : event.key === 'ArrowDown' ? amount : 0;
        if (!frame) defaultSize();
        if (resize) panel.querySelector('.classroom-clock-body').scrollTop = 0;
        place(resize ? resizeFrame(frame, 'se', dx, dy, viewport()) : {...frame, left: frame.left + dx, top: frame.top + dy});
      });
      win.addEventListener('resize', () => { if (frame && !full) place(frame); });
      doc.addEventListener('fullscreenchange', () => {
        if (full && ((ownedNative && doc.fullscreenElement !== panel) || (fullWithin && doc.fullscreenElement !== fullWithin))) exitFull();
      });
      function render(state) {
        const time = $('#classroom-clock-seconds').checked ? `${String(Math.floor(state.seconds / 60)).padStart(2,'0')}:${String(state.seconds % 60).padStart(2,'0')}` : t(`${Math.ceil(state.seconds / 60)} 分鐘`);
        $('#classroom-clock-digits').textContent = time;
        $('#classroom-clock-chip-time').textContent = time;
        const purpose = $('#classroom-clock-purpose');
        $('#classroom-clock-chip-purpose').textContent = (purpose.selectedOptions?.[0] || purpose.querySelector('option:checked') || purpose.querySelector('option')).textContent;
        const labels = {ready:'準備好了再開始',running:'照自己的步調，慢慢完成',paused:'已暫停，準備好再繼續',finished:'時間到了，慢慢完成這一步。'};
        if (lastPhase !== state.phase) { $('#classroom-clock-status').textContent = t(labels[state.phase]); lastPhase = state.phase; }
        $('#classroom-clock-chip-state').textContent = t(state.phase === 'finished' ? '時間到' : state.phase === 'paused' ? '已暫停' : '');
        $('[data-clock="toggle"]').textContent = t(state.phase === 'running' ? '暫停計時' : state.phase === 'paused' ? '繼續計時' : state.phase === 'finished' ? '重新開始' : '開始計時');
        $('#classroom-clock-progress').style.width = `${Math.min(100, state.seconds / state.totalSeconds * 100)}%`;
        $('.classroom-clock-settings').disabled = state.phase === 'running';
        host.querySelectorAll('[data-clock-minutes]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.clockMinutes) * 60 === state.totalSeconds)));
        host.querySelectorAll('[data-clock-add]').forEach(b => b.disabled = state.totalSeconds >= MAX / 1000);
        if (lastTotal !== state.totalSeconds) { $('#classroom-clock-minutes').value = state.totalSeconds / 60; lastTotal = state.totalSeconds; }
        host.dataset.phase = state.phase;
        if (state.phase === 'running' && interval === null) interval = win.setInterval(() => clock.tick(), 250);
        else if (state.phase !== 'running' && interval !== null) { win.clearInterval(interval); interval = null; }
      }
      function prepareAudio() {
        if (!$('#classroom-clock-sound').checked) return;
        try {
          const Ctx = win.AudioContext || win.webkitAudioContext;
          if (Ctx) { audio ||= new Ctx(); audio.resume().catch(() => {}); }
        } catch (_) {}
      }
      function chime() {
        if (!$('#classroom-clock-sound').checked || !audio) return;
        try {
          const osc = audio.createOscillator(), gain = audio.createGain(), at = audio.currentTime;
          osc.type = 'sine'; osc.frequency.setValueAtTime(523.25, at);
          gain.gain.setValueAtTime(0, at); gain.gain.linearRampToValueAtTime(0.08, at + 0.04); gain.gain.exponentialRampToValueAtTime(0.001, at + 0.7);
          osc.connect(gain); gain.connect(audio.destination); osc.start(at); osc.stop(at + 0.8);
          osc.onended = () => { osc.disconnect(); gain.disconnect(); };
        } catch (_) { /* 無音訊支援時仍顯示時間到，不中斷課堂。 */ }
      }
      const clock = create({onChange: render, onFinish: chime});
      function open() {
        if (panel.hidden && doc.activeElement !== chip) {
          lastFocus = doc.activeElement?.closest('#tools-dropdown-menu') ? doc.querySelector('#btn-tools-dropdown') : doc.activeElement;
        }
        panel.hidden = false; chip.hidden = true; minimized = false;
        if (!frame) defaultSize(); else if (!full) place(frame);
        chip.setAttribute('aria-expanded', 'true'); render(clock.read()); $('[data-clock="toggle"]').focus();
      }
      function close() {
        clock.pause(); panel.hidden = chip.hidden = true; minimized = false;
        exitFull();
        chip.setAttribute('aria-expanded','false'); lastFocus?.focus();
      }
      host.addEventListener('click', event => {
        const button = event.target.closest('button'); if (!button) return;
        if (button.dataset.clockMinutes) { clock.configure(Number(button.dataset.clockMinutes)); $('#classroom-clock-error').hidden = true; }
        if (button.dataset.clockAdd) clock.extend(Number(button.dataset.clockAdd));
        if (button.dataset.clock === 'toggle') {
          if (clock.read().phase === 'running') clock.pause();
          else {
            prepareAudio();
            clock.start();
          }
        }
        if (button.dataset.clock === 'reset') { clock.reset(); $('#classroom-clock-error').hidden = true; }
        if (button.dataset.clock === 'close') close();
        if (button.dataset.clock === 'minimize') { exitFull(); minimized = true; panel.hidden = true; chip.hidden = false; chip.setAttribute('aria-expanded','false'); chip.focus(); }
        if (button.dataset.clock === 'fullscreen') toggleFull();
        if (button.dataset.clock === 'size-reset') defaultSize();
        if (button.dataset.clock === 'settings') { const shown = panel.classList.toggle('show-settings'); button.setAttribute('aria-expanded', String(shown)); }
      });
      $('#classroom-clock-form').addEventListener('submit', event => {
        event.preventDefault();
        try { clock.configure(Number($('#classroom-clock-minutes').value)); $('#classroom-clock-error').hidden = true; }
        catch (error) { $('#classroom-clock-error').textContent = t(error.message); $('#classroom-clock-error').hidden = false; }
      });
      $('#classroom-clock-seconds').addEventListener('change', () => render(clock.read()));
      $('#classroom-clock-sound').addEventListener('change', prepareAudio);
      $('#classroom-clock-purpose').addEventListener('change', () => render(clock.read()));
      chip.addEventListener('click', open);
      panel.addEventListener('keydown', event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); if (full) exitFull(); else close(); } });
      doc.addEventListener('visibilitychange', () => clock.tick());
      doc.addEventListener('math-language-change', () => { lastPhase = ''; const wasSettings = panel.classList.contains('show-settings'); fullscreenUI(full); panel.classList.toggle('show-settings', wasSettings); $('[data-clock="settings"]').setAttribute('aria-expanded', String(wasSettings)); render(clock.read()); });
      doc.querySelector('#btn-classroom-timer')?.addEventListener('click', () => { win.ToolsDropdown?.close(); open(); });
      // 全螢幕也保留入口；計時不隨教學活動切換而重建。
      const focusBar = doc.querySelector('.lesson-focus-bar');
      if (focusBar) { const b = doc.createElement('button'); b.type = 'button'; b.className = 'classroom-clock-focus-open'; b.textContent = '◷ 課堂計時器'; b.addEventListener('click',open); focusBar.append(b); }
      win.classroomClock = {open, close, read: clock.read};
      render(clock.read());
      win.addEventListener('pagehide', () => { if (interval !== null) win.clearInterval(interval); interval = null; });
      win.addEventListener('pageshow', () => { clock.tick(); if (minimized) chip.hidden = false; });
    }
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', ready); else ready();
  }
  return {create, mount, fitFrame, resizeFrame};
});
