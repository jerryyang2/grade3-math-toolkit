/* 可選用的課堂計時器；以截止時間計算，背景分頁恢復後不累積秒差。 */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.ClassroomTimer = api; api.mount(root); }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  const MAX = 180 * 60000;
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
        <header class="classroom-clock-header"><div><span class="classroom-clock-eyebrow">照自己的步調，掌握時間</span><h2 id="classroom-clock-title">課堂計時器</h2></div><div class="classroom-clock-window-buttons">
          <button type="button" data-clock="expand" aria-pressed="false" title="放大顯示" aria-label="放大顯示">⤢</button>
          <button type="button" data-clock="minimize" title="縮成小卡，繼續計時" aria-label="縮成小卡，繼續計時">−</button>
          <button type="button" data-clock="close" title="關閉並暫停" aria-label="關閉並暫停">×</button></div></header>
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
        </div></section>
        <button type="button" id="classroom-clock-chip" class="classroom-clock-chip" aria-controls="classroom-clock-panel" aria-expanded="false" hidden><span aria-hidden="true">◷</span><span id="classroom-clock-chip-purpose">練習時間</span><strong id="classroom-clock-chip-time">05:00</strong><span id="classroom-clock-chip-state"></span></button>`;
      doc.body.append(host);
      const panel = host.querySelector('#classroom-clock-panel'), chip = host.querySelector('#classroom-clock-chip');
      const $ = selector => host.querySelector(selector);
      const t = text => win.MathI18n?.t(text) ?? text;
      let interval = null, lastPhase = '', lastTotal = 0, lastFocus = null, audio = null, minimized = false;
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
        chip.setAttribute('aria-expanded', 'true'); render(clock.read()); $('[data-clock="toggle"]').focus();
      }
      function close() {
        clock.pause(); panel.hidden = chip.hidden = true; minimized = false;
        panel.classList.remove('is-large'); $('[data-clock="expand"]').setAttribute('aria-pressed','false');
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
        if (button.dataset.clock === 'minimize') { minimized = true; panel.hidden = true; chip.hidden = false; chip.setAttribute('aria-expanded','false'); chip.focus(); }
        if (button.dataset.clock === 'expand') { const expanded = panel.classList.toggle('is-large'); button.setAttribute('aria-pressed',String(expanded)); }
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
      panel.addEventListener('keydown', event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); } });
      doc.addEventListener('visibilitychange', () => clock.tick());
      doc.addEventListener('math-language-change', () => { lastPhase = ''; render(clock.read()); });
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
  return {create, mount};
});
