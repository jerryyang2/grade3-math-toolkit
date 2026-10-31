(function () {
  'use strict';

  const definitions = {
    ruler: { name: '直尺', width: 440, height: 66, paper: '#d9edfac9', edge: '#37698d' },
    triangle45: { name: '45° 三角板', width: 260, height: 260, paper: '#d7f0e3b8', edge: '#377961' },
    triangle30: { name: '30°／60° 三角板', width: 180 * Math.sqrt(3), height: 180, paper: '#d7f0e3b8', edge: '#377961' },
    protractor: { name: '量角器', width: 320, height: 180, paper: '#fff0bfc9', edge: '#8d712a' },
    compass: { name: '圓規', width: 300, height: 300, paper: '#ffe0d3bd', edge: '#a45e43' }
  };
  const unit = 40;
  function transformPoint(instrument, point) {
    const definition = definitions[instrument.type];
    const radians = instrument.angle * Math.PI / 180;
    const offsetX = (point.x - definition.width / 2) * instrument.scale;
    const offsetY = (point.y - definition.height / 2) * instrument.scale;
    return { x: instrument.x + offsetX * Math.cos(radians) - offsetY * Math.sin(radians), y: instrument.y + offsetX * Math.sin(radians) + offsetY * Math.cos(radians) };
  }
  function fitInstrument(instrument, width, height) {
    const definition = definitions[instrument.type];
    const radians = instrument.angle * Math.PI / 180;
    const boundWidth = Math.abs(definition.width * Math.cos(radians)) + Math.abs(definition.height * Math.sin(radians));
    const boundHeight = Math.abs(definition.width * Math.sin(radians)) + Math.abs(definition.height * Math.cos(radians));
    instrument.scale = Math.max(.1, Math.min(instrument.scale, (width - 24) / boundWidth, (height - 80) / boundHeight));
    const halfWidth = boundWidth * instrument.scale / 2;
    const halfHeight = boundHeight * instrument.scale / 2;
    instrument.x = Math.max(halfWidth + 12, Math.min(instrument.x, width - halfWidth - 12));
    instrument.y = Math.max(halfHeight + 46, Math.min(instrument.y, height - halfHeight - 12));
    return instrument;
  }
  function markFor(instrument) {
    if (instrument.type === 'compass') {
      const center = transformPoint(instrument, { x: 150, y: 150 });
      return { type: 'circle', ...center, radius: instrument.radius * unit * instrument.scale };
    }
    const definition = definitions[instrument.type];
    const start = transformPoint(instrument, { x: instrument.type === 'ruler' ? 20 : 0, y: instrument.type === 'ruler' ? 0 : definition.height });
    const end = transformPoint(instrument, { x: instrument.type === 'ruler' ? 420 : definition.width, y: instrument.type === 'ruler' ? 0 : definition.height });
    return { type: 'line', start, end };
  }
  function svgContent(type, radius = 2.5) {
    const definition = definitions[type];
    const surface = `fill="${definition.paper}" stroke="${definition.edge}" stroke-width="2"`;
    if (type === 'ruler') {
      const ticks = Array.from({ length: 101 }, (_, index) => `<path d="M${20 + index * 4} 0v${index % 10 === 0 ? 27 : index % 5 === 0 ? 19 : 12}" stroke="${definition.edge}" stroke-width="${index % 10 === 0 ? 1.8 : 1}"/>${index % 10 === 0 ? `<text x="${20 + index * 4}" y="49" text-anchor="middle" font-size="16" fill="#254b69">${index / 10}</text>` : ''}`).join('');
      return `<rect width="440" height="66" rx="4" ${surface}/>${ticks}<text x="425" y="61" text-anchor="end" font-size="10" fill="#254b69">cm</text>`;
    }
    if (type.startsWith('triangle')) {
      const { width, height } = definition;
      return `<path d="M0 0V${height}H${width}Z M30 78V${height - 30}H${width - 78}Z" fill-rule="evenodd" ${surface}/><path d="M0 ${height - 20}h20v20" fill="none" stroke="${definition.edge}" stroke-width="2"/><text x="12" y="54" font-size="17" fill="${definition.edge}">${type === 'triangle45' ? '45°' : '60°'}</text><text x="${width - 58}" y="${height - 9}" font-size="17" fill="${definition.edge}">${type === 'triangle45' ? '45°' : '30°'}</text>`;
    }
    if (type === 'protractor') {
      const ticks = Array.from({ length: 37 }, (_, index) => {
        const angle = index * 5 * Math.PI / 180;
        const innerRadius = index % 2 ? 137 : 130;
        const outer = { x: 160 + 150 * Math.cos(angle), y: 160 - 150 * Math.sin(angle) };
        const inner = { x: 160 + innerRadius * Math.cos(angle), y: 160 - innerRadius * Math.sin(angle) };
        return `<path d="M${outer.x} ${outer.y}L${inner.x} ${inner.y}" stroke="#806121"/>${index % 2 === 0 ? `<text x="${160 + 116 * Math.cos(angle)}" y="${164 - 116 * Math.sin(angle)}" text-anchor="middle" font-size="12" fill="#594417">${index * 5}</text><text x="${160 + 91 * Math.cos(angle)}" y="${164 - 91 * Math.sin(angle)}" text-anchor="middle" font-size="10" fill="#795887">${180 - index * 5}</text>` : ''}`;
      }).join('');
      return `<path d="M10 160a150 150 0 0 1 300 0v15H10Z" ${surface}/>${ticks}<path d="M10 160h300M160 150v20" stroke="#b55042" stroke-width="2"/><circle cx="160" cy="160" r="4" fill="#b55042"/>`;
    }
    const distance = radius * unit;
    return `<circle cx="150" cy="150" r="${distance}" fill="none" stroke="#a45e43" stroke-dasharray="5 5" opacity=".6"/><path d="M150 150H${150 + distance}" stroke="#37698d" stroke-width="2"/><path d="M150 150L${150 + distance / 2} 45L${150 + distance} 150" fill="none" stroke="#a45e43" stroke-width="10" stroke-linejoin="round"/><circle cx="${150 + distance / 2}" cy="45" r="9" fill="#ffcf70" stroke="#744c34" stroke-width="2"/><path d="M150 138v24m-12-12h24" stroke="#bd4040" stroke-width="3"/><circle cx="${150 + distance}" cy="150" r="6" fill="#315d9b"/><text x="150" y="182" text-anchor="end" font-size="15" fill="#9f3b3b">圓心</text><text x="${150 + distance / 2}" y="140" text-anchor="middle" font-size="16" fill="#254b69">${radius} cm</text>`;
  }
  function toolIcon(type) {
    const shapes = {
      whiteboard: '<rect x="2" y="3" width="44" height="29" rx="3" fill="white" stroke="#5d6a87" stroke-width="2.5"/><path d="M9 25h17m4-5 8-8 3 3-8 8-5 2Z" fill="#f7d17b" stroke="#5d6a87" stroke-width="2"/><path d="M15 33v3m18-3v3" stroke="#5d6a87" stroke-width="2"/>',
      ruler: '<rect x="2" y="8" width="44" height="22" rx="3" fill="#a9d5ed" stroke="#37698d" stroke-width="2"/><path d="M8 8v13m6-13v8m6-8v13m6-13v8m6-8v13m6-13v8" stroke="#37698d" stroke-width="2"/>',
      triangle45: '<path d="M7 3v30h30ZM14 20v6h6Z" fill="#a8d6be" fill-rule="evenodd" stroke="#377961" stroke-width="2"/><path d="M7 26h7v7" fill="none" stroke="#377961" stroke-width="1.5"/>',
      triangle30: '<path d="M3 9v24h42ZM10 22v5h10Z" fill="#a8d6be" fill-rule="evenodd" stroke="#377961" stroke-width="2"/><path d="M3 26h7v7" fill="none" stroke="#377961" stroke-width="1.5"/>',
      protractor: '<path d="M2 29a22 22 0 0 1 44 0v4H2Z" fill="#f5d57c" stroke="#8d712a" stroke-width="2"/><path d="M24 7v6m-15 1 4 5m26-5-4 5M2 29h44M24 25v8" fill="none" stroke="#8d712a" stroke-width="2"/>',
      compass: '<path d="m10 33 14-26 14 26" fill="none" stroke="#a45e43" stroke-width="5" stroke-linejoin="round"/><path d="M10 33v2m28-2v2" stroke="#343654" stroke-width="2"/><circle cx="24" cy="7" r="5" fill="#f7cf6e" stroke="#744c34" stroke-width="2"/><path d="M24 2V0" stroke="#744c34" stroke-width="3"/>'
    };
    return `<svg viewBox="0 0 48 36" aria-hidden="true">${shapes[type]}</svg>`;
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { definitions, transformPoint, fitInstrument, markFor, svgContent };
  if (typeof document === 'undefined') return;

  function init() {
    const icon = '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 14h32v27H8Z" fill="#ffe4a4" stroke="#514b75" stroke-width="2.5"/><path d="M17 14V9h14v5M8 24h32" fill="none" stroke="#514b75" stroke-width="3"/><path d="m17 34 12-14 6 17Z" fill="#b9dbdc" stroke="#514b75" stroke-width="2"/><path d="M13 18v17m0-12h4m-4 6h4" stroke="#9d6e31" stroke-width="2"/></svg>';
    const host = document.createElement('aside');
    host.className = 'math-kit';
    host.setAttribute('aria-label', '數學小工具箱');
    host.innerHTML = `
      <button type="button" class="math-kit-launcher" aria-expanded="false" aria-controls="math-kit-panel">${icon}<span>數學工具箱</span></button>
      <section class="math-kit-panel" id="math-kit-panel" aria-label="數學教具工具列" hidden>
        <header class="math-kit-header">
          <span class="math-kit-brand" aria-hidden="true">${icon}<span>數學</span></span>
          <button type="button" class="math-kit-drag" aria-label="移動數學工具箱" title="拖曳移動；方向鍵微調">✥</button>
          <button type="button" data-action="orientation" aria-label="切換為直向數學工具列"><span aria-hidden="true">▥</span><span>直向</span></button>
        </header>
        <div class="math-kit-body">
          <div class="math-kit-choices">${Object.entries(definitions).map(([type, definition]) => `<button type="button" data-add="${type}" aria-label="加入${definition.name}" title="加入${definition.name}，可用設定調整">${toolIcon(type)}<span>${type === 'triangle45' ? '45°板' : type === 'triangle30' ? '30°板' : definition.name}</span></button>`).join('')}
            <button type="button" data-add="whiteboard" aria-label="開啟計算白板">${toolIcon('whiteboard')}<span>白板</span></button>
          </div>
          <button type="button" data-action="settings" aria-label="調整選取教具" aria-controls="math-kit-settings" aria-expanded="false" disabled><span aria-hidden="true">⚙</span><span>設定</span></button>
          <footer class="math-kit-footer">
            <button type="button" data-action="visibility" aria-pressed="true"><span aria-hidden="true">◉</span><span>隱藏</span></button>
            <button type="button" data-action="undo" disabled><span aria-hidden="true">↶</span><span>復原</span></button>
            <button type="button" data-action="clear" title="清空幾何教具與作圖；仍可復原" disabled><span aria-hidden="true">⌫</span><span>清空</span></button>
          </footer>
        </div>
        <button type="button" class="math-kit-collapse" data-action="collapse" aria-label="收合數學工具箱">⌄</button>
      </section>
      <section class="math-kit-selection" id="math-kit-settings" aria-label="選取教具的設定" hidden>
        <h3></h3>
        <label>旋轉角度 <span><input type="number" data-setting="angle" aria-label="教具旋轉角度" min="-360" max="360" step="5"> °</span></label>
        <label>教具大小 <input type="range" data-setting="scale" aria-label="教具大小" min="20" max="140" step="5"></label>
        <label class="math-kit-radius">半徑 <span><input type="number" data-setting="radius" aria-label="圓規半徑" min=".5" max="3.5" step=".5"> cm</span></label>
        <div class="math-kit-row"><button type="button" data-action="rotate">轉 45°</button><button type="button" data-action="draw" class="math-kit-draw"></button><button type="button" data-action="remove">移除</button></div>
        <p class="math-kit-note">拖曳移動・方向鍵微調<br>螢幕刻度為教學示意，非實物尺寸。</p>
      </section>
      <p class="math-kit-status" role="status" aria-live="polite">選一件教具，拖到想示範的位置。</p>`;
    const layer = document.createElement('div');
    layer.className = 'math-kit-layer';
    const marksSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    marksSvg.classList.add('math-kit-marks');
    marksSvg.setAttribute('aria-label', '數學作圖');
    layer.append(marksSvg);
    document.body.append(layer, host);
    const panel = host.querySelector('.math-kit-panel');
    const launcher = host.querySelector('.math-kit-launcher');
    const selection = host.querySelector('.math-kit-selection');
    const status = host.querySelector('.math-kit-status');
    const settingsToggle = host.querySelector('[data-action=settings]');
    const orientationToggle = host.querySelector('[data-action=orientation]');
    let settingsOpen = false;
    let orientation = 'horizontal';
    try { orientation = localStorage.getItem('math-toolbox-orientation') === 'vertical' ? 'vertical' : 'horizontal'; } catch {}
    host.dataset.orientation = orientation;
    let instruments = [];
    let marks = [];
    let selectedId = null;
    let nextId = 0;
    let visible = true;
    const history = [];
    let gesture = null;
    function selected() { return instruments.find(instrument => instrument.id === selectedId); }
    function save() {
      history.push(JSON.stringify({ instruments, marks, selectedId }));
      if (history.length > 30) history.shift();
    }
    function announce(message) { status.textContent = message; }
    function positionOptions() {
      if (selection.hidden) return;
      const bar = panel.getBoundingClientRect();
      const popup = selection.getBoundingClientRect();
      let left = bar.left;
      let top = bar.top - popup.height - 8;
      if (orientation === 'vertical') {
        left = bar.right + popup.width + 8 <= innerWidth ? bar.right + 8 : bar.left - popup.width - 8;
        top = bar.top;
      } else if (top < 8) top = bar.bottom + 8;
      selection.style.left = `${Math.max(8, Math.min(left, innerWidth - popup.width - 8))}px`;
      selection.style.top = `${Math.max(8, Math.min(top, innerHeight - popup.height - 8))}px`;
    }
    function setOrientation(next, persist = true) {
      orientation = next;
      host.dataset.orientation = orientation;
      const target = orientation === 'horizontal' ? '直向' : '橫向';
      orientationToggle.setAttribute('aria-label', `切換為${target}數學工具列`);
      orientationToggle.innerHTML = `<span aria-hidden="true">${orientation === 'horizontal' ? '▥' : '▤'}</span><span>${target}</span>`;
      if (persist) {
        try { localStorage.setItem('math-toolbox-orientation', orientation); } catch {}
      }
      clampHost();
    }
    function clampHost() {
      const focusBar = document.querySelector('.lesson-focus-bar:not([hidden])');
      const safeTop = Math.max(8, Math.min(focusBar?.getBoundingClientRect().bottom + 8 || 8, innerHeight - 100));
      host.style.setProperty('--math-kit-safe-top', `${safeTop}px`);
      const bounds = host.getBoundingClientRect();
      host.style.left = `${Math.max(8, Math.min(bounds.left, innerWidth - bounds.width - 8))}px`;
      host.style.top = `${Math.max(safeTop, Math.min(bounds.top, innerHeight - bounds.height - 8))}px`;
      host.style.bottom = 'auto';
      positionOptions();
    }
    function toggle(open) {
      panel.hidden = !open;
      launcher.hidden = open;
      launcher.setAttribute('aria-expanded', String(open));
      settingsOpen = false;
      controls();
    }
    function controls() {
      const instrument = selected();
      selection.hidden = panel.hidden || !instrument || !settingsOpen;
      settingsToggle.disabled = !instrument;
      settingsToggle.setAttribute('aria-expanded', String(!selection.hidden));
      if (instrument) {
        selection.querySelector('h3').textContent = definitions[instrument.type].name;
        const values = { angle: Math.round(instrument.angle), scale: Math.round(instrument.scale * 100), radius: instrument.radius };
        Object.entries(values).forEach(([setting, value]) => {
          const input = selection.querySelector(`[data-setting=${setting}]`);
          if (document.activeElement !== input) input.value = value;
        });
        selection.querySelector('.math-kit-radius').hidden = instrument.type !== 'compass';
        const draw = selection.querySelector('[data-action=draw]');
        draw.hidden = instrument.type === 'protractor';
        draw.textContent = instrument.type === 'compass' ? '畫圓' : '沿尺畫線';
      }
      host.querySelector('[data-action=undo]').disabled = !history.length;
      host.querySelector('[data-action=clear]').disabled = !instruments.length && !marks.length;
      host.querySelector('[data-action=visibility]').setAttribute('aria-pressed', String(visible));
      host.querySelector('[data-action=visibility]').innerHTML = `<span aria-hidden="true">${visible ? '◉' : '◌'}</span><span>${visible ? '隱藏' : '顯示'}</span>`;
      host.querySelector('[data-action=visibility]').setAttribute('aria-label', visible ? '隱藏幾何教具' : '顯示幾何教具');
      clampHost();
    }
    function position(instrument, element) {
      const definition = definitions[instrument.type];
      element.style.width = `${definition.width * instrument.scale}px`;
      element.style.height = `${definition.height * instrument.scale}px`;
      element.style.left = `${instrument.x - definition.width * instrument.scale / 2}px`;
      element.style.top = `${instrument.y - definition.height * instrument.scale / 2}px`;
      element.style.transform = `rotate(${instrument.angle}deg)`;
      element.dataset.selected = String(instrument.id === selectedId);
    }
    function render() {
      layer.querySelectorAll('.math-instrument').forEach(element => element.remove());
      marksSvg.setAttribute('viewBox', `0 0 ${innerWidth} ${innerHeight}`);
      marksSvg.innerHTML = marks.map(mark => mark.type === 'circle' ? `<circle cx="${mark.x}" cy="${mark.y}" r="${mark.radius}" fill="none" stroke="#315d9b" stroke-width="3"/>` : `<path d="M${mark.start.x} ${mark.start.y}L${mark.end.x} ${mark.end.y}" fill="none" stroke="#315d9b" stroke-width="3"/>`).join('');
      instruments.forEach(instrument => {
        fitInstrument(instrument, innerWidth, innerHeight);
        const definition = definitions[instrument.type];
        const element = document.createElement('div');
        element.className = 'math-instrument';
        element.tabIndex = 0;
        element.dataset.id = instrument.id;
        element.setAttribute('role', 'group');
        element.setAttribute('aria-label', `${definition.name}，可拖曳或用方向鍵移動`);
        element.innerHTML = `<span class="math-instrument-label">${definition.name}<button type="button" data-remove="${instrument.id}" aria-label="移除${definition.name}">×</button></span><svg viewBox="0 0 ${definition.width} ${definition.height}" aria-hidden="true">${svgContent(instrument.type, instrument.radius)}</svg>`;
        position(instrument, element);
        layer.append(element);
      });
      layer.hidden = !visible;
      controls();
    }
    function choose(instrument) {
      selectedId = instrument.id;
      layer.querySelectorAll('.math-instrument').forEach(element => element.dataset.selected = String(+element.dataset.id === selectedId));
      controls();
    }
    host.addEventListener('click', event => {
      if (gesture?.moved) return;
      if (event.target.closest('.math-kit-launcher')) { toggle(true); return; }
      const add = event.target.closest('[data-add]');
      if (add) {
        if (add.dataset.add === 'whiteboard') {
          settingsOpen = false;
          controls();
          window.MathWhiteboard.open();
          return;
        }
        if (instruments.length >= 8) { announce('先收回一件教具，再加入新的。'); return; }
        save();
        const offset = instruments.length % 4 * 30;
        const instrument = { id: ++nextId, type: add.dataset.add, x: innerWidth * .62 + offset, y: innerHeight * .38 + offset, angle: 0, scale: .8, radius: 2.5 };
        instruments.push(instrument);
        selectedId = instrument.id;
        visible = true;
        settingsOpen = false;
        render();
        announce(`已加入${definitions[instrument.type].name}，可拖曳、旋轉或調整大小。`);
        return;
      }
      const action = event.target.closest('[data-action]')?.dataset.action;
      const instrument = selected();
      if (action === 'collapse') { toggle(false); launcher.focus(); return; }
      if (action === 'orientation') { setOrientation(orientation === 'horizontal' ? 'vertical' : 'horizontal'); return; }
      if (action === 'settings') { settingsOpen = !settingsOpen; controls(); return; }
      if (action === 'visibility') { visible = !visible; render(); return; }
      if (action === 'undo' && history.length) {
        const snapshot = JSON.parse(history.pop());
        instruments = snapshot.instruments; marks = snapshot.marks; selectedId = snapshot.selectedId;
        render(); return;
      }
      if (action === 'clear') { save(); instruments = []; marks = []; selectedId = null; render(); announce('已收回全部教具，按復原可還原。'); return; }
      if (!instrument) return;
      if (action === 'rotate') { save(); instrument.angle = (instrument.angle + 45) % 360; render(); }
      if (action === 'draw') {
        const mark = markFor(instrument);
        if (window.MathWhiteboard?.drawGeometry(mark)) {
          announce(instrument.type === 'compass' ? '已在白板畫好圓，可用白板復原或擦除。' : '已沿尺邊畫在白板上，可用白板復原或擦除。');
          return;
        }
        save(); marks.push(mark);
        if (marks.length > 100) marks.shift();
        render(); announce(instrument.type === 'compass' ? '已畫好圓。移開圓規看看。' : '已沿著尺邊畫好線。');
      }
      if (action === 'remove') { save(); instruments = instruments.filter(item => item.id !== selectedId); selectedId = null; render(); }
    });
    host.addEventListener('input', event => {
      const setting = event.target.dataset.setting;
      const instrument = selected();
      const value = event.target.valueAsNumber;
      if (!setting || !instrument || !Number.isFinite(value)) return;
      save();
      if (setting === 'angle') instrument.angle = Math.max(-360, Math.min(360, value));
      if (setting === 'scale') instrument.scale = Math.max(.2, Math.min(1.4, value / 100));
      if (setting === 'radius') instrument.radius = Math.max(.5, Math.min(3.5, value));
      render();
    });
    layer.addEventListener('click', event => {
      const remove = event.target.closest('[data-remove]');
      if (!remove) return;
      save();
      instruments = instruments.filter(instrument => instrument.id !== +remove.dataset.remove);
      selectedId = null;
      render();
    });
    function pointerStart(event) {
      if (event.button !== 0) return;
      const element = event.target.closest('.math-instrument');
      if (event.target.closest('[data-remove]')) return;
      const handle = event.target.closest('.math-kit-drag, .math-kit-launcher');
      if (!element && !handle) return;
      const target = element || handle;
      event.preventDefault();
      const instrument = element ? instruments.find(item => item.id === +element.dataset.id) : null;
      if (instrument) { choose(instrument); element.focus(); }
      const bounds = host.getBoundingClientRect();
      gesture = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, x: instrument?.x ?? bounds.left, y: instrument?.y ?? bounds.top, instrument, element, target, moved: false };
      target.setPointerCapture(event.pointerId);
    }
    function pointerMove(event) {
      if (!gesture || event.pointerId !== gesture.pointerId) return;
      const deltaX = event.clientX - gesture.startX;
      const deltaY = event.clientY - gesture.startY;
      if (!gesture.moved && Math.hypot(deltaX, deltaY) < 5) return;
      if (!gesture.moved && gesture.instrument) save();
      gesture.moved = true;
      if (gesture.instrument) {
        gesture.instrument.x = gesture.x + deltaX;
        gesture.instrument.y = gesture.y + deltaY;
        fitInstrument(gesture.instrument, innerWidth, innerHeight);
        position(gesture.instrument, gesture.element);
      } else {
        host.style.left = `${gesture.x + deltaX}px`;
        host.style.top = `${gesture.y + deltaY}px`;
        host.style.bottom = 'auto';
        clampHost();
      }
    }
    function pointerEnd(event) {
      if (!gesture || event.pointerId !== gesture.pointerId) return;
      const wasMoved = gesture.moved;
      gesture.target.releasePointerCapture(event.pointerId);
      gesture = null;
      if (wasMoved) {
        event.preventDefault();
        controls();
        const suppressClick = click => { click.preventDefault(); click.stopPropagation(); };
        document.addEventListener('click', suppressClick, { capture: true, once: true });
        setTimeout(() => document.removeEventListener('click', suppressClick, true), 0);
      }
    }
    [host, layer].forEach(target => {
      target.addEventListener('pointerdown', pointerStart);
      target.addEventListener('pointermove', pointerMove);
      target.addEventListener('pointerup', pointerEnd);
      target.addEventListener('pointercancel', pointerEnd);
      target.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
          if (settingsOpen) { settingsOpen = false; controls(); settingsToggle.focus(); }
          else { selectedId = null; render(); if (!panel.hidden) toggle(false); launcher.focus(); }
        }
        const element = event.target.closest('.math-instrument');
        const instrument = element && instruments.find(item => item.id === +element.dataset.id);
        if (instrument && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
          event.preventDefault(); save(); choose(instrument);
          const distance = event.shiftKey ? 20 : 5;
          instrument.x += event.key === 'ArrowRight' ? distance : event.key === 'ArrowLeft' ? -distance : 0;
          instrument.y += event.key === 'ArrowDown' ? distance : event.key === 'ArrowUp' ? -distance : 0;
          fitInstrument(instrument, innerWidth, innerHeight); position(instrument, element); controls();
        }
        if (event.target.closest('.math-kit-drag') && event.key.startsWith('Arrow')) {
          event.preventDefault(); const bounds = host.getBoundingClientRect();
          host.style.left = `${bounds.left + (event.key === 'ArrowRight' ? 10 : event.key === 'ArrowLeft' ? -10 : 0)}px`;
          host.style.top = `${bounds.top + (event.key === 'ArrowDown' ? 10 : event.key === 'ArrowUp' ? -10 : 0)}px`;
          host.style.bottom = 'auto'; clampHost();
        }
        event.stopPropagation();
      });
    });
    function fullscreen() {
      const full = document.fullscreenElement;
      const unavailable = full?.tagName === 'IFRAME' || (window.self !== window.top && !full);
      (full && !unavailable ? full : document.body).append(layer, host);
      host.classList.toggle('math-kit-unavailable', unavailable);
      layer.classList.toggle('math-kit-unavailable', unavailable);
      render();
    }
    document.addEventListener('fullscreenchange', fullscreen);
    document.addEventListener('click', event => {
      if (!host.contains(event.target) && settingsOpen) { settingsOpen = false; controls(); }
    });
    window.addEventListener('resize', () => { render(); clampHost(); });
    setOrientation(orientation, false);
    fullscreen();
    toggle(true);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
