(function () {
  'use strict';

  // Resolve from this script so the same icons work on the main page and nested games.
  const iconRoot = typeof document !== 'undefined' && document.currentScript?.src
    ? new URL('../assets/icons/', document.currentScript.src).href : 'assets/icons/';
  const stampIcons = { flower: `${iconRoot}counting-flower.svg`, coin: `${iconRoot}one-dollar-coin.svg` };
  function createStamp(kind, point) {
    if (!stampIcons[kind]) throw new RangeError('Unknown whiteboard stamp');
    return { type: 'stamp', kind, x: point.x, y: point.y, size: 44 };
  }

  class WhiteboardHistory {
    constructor() { this.marks = []; this.past = []; this.future = []; }
    save(marks) {
      this.past.push(this.marks);
      if (this.past.length > 40) this.past.shift();
      this.marks = marks.slice(-300);
      this.future = [];
    }
    undo() {
      if (!this.past.length) return false;
      this.future.push(this.marks);
      this.marks = this.past.pop();
      return true;
    }
    redo() {
      if (!this.future.length) return false;
      this.past.push(this.marks);
      this.marks = this.future.pop();
      return true;
    }
  }
  function clampBoard(box, viewportWidth, viewportHeight, insetTop = 8) {
    const maxWidth = Math.max(1, viewportWidth - 16);
    const maxHeight = Math.max(1, viewportHeight - insetTop - 8);
    const width = Math.max(Math.min(280, maxWidth), Math.min(box.width, maxWidth));
    const height = Math.max(Math.min(240, maxHeight), Math.min(box.height, maxHeight));
    return { width, height, x: Math.max(8, Math.min(box.x, viewportWidth - width - 8)), y: Math.max(insetTop, Math.min(box.y, viewportHeight - height - 8)) };
  }
  function hitsStroke(stroke, point, radius = 12) {
    if (stroke.type === 'stamp') return Math.hypot(point.x - stroke.x, point.y - stroke.y) <= stroke.size / 2 + radius;
    const tolerance = radius + stroke.width / 2;
    return stroke.points.some((end, index) => {
      const start = stroke.points[Math.max(0, index - 1)];
      const deltaX = end.x - start.x;
      const deltaY = end.y - start.y;
      const length = deltaX * deltaX + deltaY * deltaY;
      const ratio = length ? Math.max(0, Math.min(1, ((point.x - start.x) * deltaX + (point.y - start.y) * deltaY) / length)) : 0;
      return Math.hypot(point.x - start.x - ratio * deltaX, point.y - start.y - ratio * deltaY) <= tolerance;
    });
  }
  function strokeMarkup(stroke) {
    if (stroke.type === 'stamp') return `<image class="math-board-stamp" data-stamp="${stroke.kind}" href="${stampIcons[stroke.kind]}" x="${stroke.x - stroke.size / 2}" y="${stroke.y - stroke.size / 2}" width="${stroke.size}" height="${stroke.size}"/>`;
    const first = stroke.points[0];
    if (stroke.points.length === 1) return `<circle cx="${first.x}" cy="${first.y}" r="${stroke.width / 2}" fill="${stroke.color}"/>`;
    return `<path d="${stroke.points.map((point, index) => `${index ? 'L' : 'M'}${point.x} ${point.y}`).join(' ')}" stroke="${stroke.color}" stroke-width="${stroke.width}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  function geometryStroke(mark, bounds) {
    if (!bounds.width || !bounds.height) return null;
    const right = bounds.left + bounds.width;
    const bottom = bounds.top + bounds.height;
    let points;
    if (mark.type === 'circle') {
      const nearest = Math.hypot(Math.max(bounds.left - mark.x, 0, mark.x - right), Math.max(bounds.top - mark.y, 0, mark.y - bottom));
      const farthest = Math.hypot(Math.max(Math.abs(bounds.left - mark.x), Math.abs(right - mark.x)), Math.max(Math.abs(bounds.top - mark.y), Math.abs(bottom - mark.y)));
      if (nearest > mark.radius || farthest < mark.radius) return null;
      points = Array.from({ length: 129 }, (_, index) => ({ x: mark.x + mark.radius * Math.cos(index * Math.PI / 64), y: mark.y + mark.radius * Math.sin(index * Math.PI / 64) }));
    } else if (mark.type === 'line') {
      const deltaX = mark.end.x - mark.start.x;
      const deltaY = mark.end.y - mark.start.y;
      let startRatio = 0;
      let endRatio = 1;
      for (const [direction, distance] of [[-deltaX, mark.start.x - bounds.left], [deltaX, right - mark.start.x], [-deltaY, mark.start.y - bounds.top], [deltaY, bottom - mark.start.y]]) {
        if (direction === 0) { if (distance < 0) return null; }
        else if (direction < 0) startRatio = Math.max(startRatio, distance / direction);
        else endRatio = Math.min(endRatio, distance / direction);
        if (startRatio > endRatio) return null;
      }
      points = [startRatio, endRatio].map(ratio => ({ x: mark.start.x + deltaX * ratio, y: mark.start.y + deltaY * ratio }));
    } else return null;
    return { color: '#315d9b', width: 3, points: points.map(point => ({ x: point.x - bounds.left, y: point.y - bounds.top })) };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { WhiteboardHistory, clampBoard, hitsStroke, strokeMarkup, geometryStroke, createStamp };
  if (typeof document === 'undefined') return;

  let board = null;
  function createBoard() {
    const root = document.createElement('section');
    root.className = 'math-board';
    root.setAttribute('aria-label', '浮動計算白板');
    root.dataset.mode = 'pen';
    root.hidden = true;
    root.innerHTML = `
      <header class="math-board-header">
        <button type="button" class="math-board-move" aria-label="移動計算白板" title="拖曳移動；方向鍵微調"><span aria-hidden="true">✥</span>計算白板</button>
        <button type="button" data-board-action="dimensions" aria-expanded="false" aria-controls="math-board-dimensions">尺寸</button>
        <button type="button" data-board-action="close" aria-label="收起計算白板，保留筆跡">×</button>
      </header>
      <div class="math-board-toolbar" role="toolbar" aria-label="白板書寫工具">
        <button type="button" data-board-mode="pen" aria-pressed="true">畫筆</button>
        <button type="button" data-board-mode="eraser" aria-pressed="false" title="整筆擦除，可復原">橡皮擦</button>
        <button type="button" data-board-mode="flower" aria-pressed="false" title="在白板點一下放一片花片"><img src="${stampIcons.flower}" alt="" aria-hidden="true"><span>花片</span></button>
        <button type="button" data-board-mode="coin" aria-pressed="false" title="在白板點一下放一枚一元硬幣"><img src="${stampIcons.coin}" alt="" aria-hidden="true"><span>一元硬幣</span></button>
        <label>顏色<select aria-label="白板畫筆顏色"><option value="#273b5b">深藍</option><option value="#c4473d">紅色</option><option value="#287655">綠色</option><option value="#222222">黑色</option></select></label>
        <label>粗細<input type="number" data-board-pen-width aria-label="白板畫筆粗細" value="4" min="1" max="16" step="1"></label>
        <button type="button" data-board-action="undo" title="Ctrl／⌘ Z" disabled>復原</button>
        <button type="button" data-board-action="redo" title="Ctrl／⌘ Shift Z" disabled>重做</button>
        <button type="button" data-board-action="clear" title="清空白板；仍可復原" disabled>清空</button>
      </div>
      <div class="math-board-dimensions" id="math-board-dimensions" hidden>
        <label>寬度（px）<input type="number" data-dimension="width" aria-label="白板寬度" min="280" step="10"></label>
        <label>高度（px）<input type="number" data-dimension="height" aria-label="白板高度" min="240" step="10"></label>
        <span>寬高分開調整，不鎖定比例。</span>
      </div>
      <svg xmlns="http://www.w3.org/2000/svg" class="math-board-surface" tabindex="0" role="img" aria-label="計算白板書寫區"></svg>
      <div class="math-board-footer" aria-live="polite"></div>
      <button type="button" class="math-board-resize" aria-label="調整白板大小" aria-describedby="math-board-help" title="拖曳改變寬高；方向鍵可分別調整寬度與高度">◢</button>
      <span class="math-board-help" id="math-board-help">拖曳標題移動白板；拖曳右下角自由調整寬高。方向鍵微調，Shift 加大調整幅度。</span>`;
    document.body.append(root);
    const surface = root.querySelector('.math-board-surface');
    const dimensions = root.querySelector('.math-board-dimensions');
    const dimensionsToggle = root.querySelector('[data-board-action=dimensions]');
    const history = new WhiteboardHistory();
    let box = { width: Math.min(560, innerWidth * .5), height: Math.min(400, innerHeight * .62), x: innerWidth * .5 - 16, y: Math.min(180, innerHeight * .22) };
    let gesture = null;
    let mode = 'pen';
    let previousFocus = null;
    function updateSurface() {
      const bounds = surface.getBoundingClientRect();
      if (bounds.width && bounds.height) surface.setAttribute('viewBox', `0 0 ${bounds.width} ${bounds.height}`);
    }
    function applyBox() {
      const focusBar = document.querySelector('.lesson-focus-bar:not([hidden])');
      const safeTop = Math.max(8, Math.min(focusBar?.getBoundingClientRect().bottom + 8 || 8, innerHeight - 100));
      box = clampBoard(box, innerWidth, innerHeight, safeTop);
      Object.assign(root.style, { left: `${box.x}px`, top: `${box.y}px`, width: `${box.width}px`, height: `${box.height}px` });
      ['width', 'height'].forEach(dimension => {
        const input = root.querySelector(`[data-dimension=${dimension}]`);
        input.max = dimension === 'width' ? innerWidth - 16 : innerHeight - safeTop - 8;
        input.min = Math.min(dimension === 'width' ? 280 : 240, Number(input.max));
        if (document.activeElement !== input) input.value = Math.round(box[dimension]);
      });
      root.querySelector('.math-board-footer').textContent = `${Math.round(box.width)} × ${Math.round(box.height)} px · 自由比例`;
      updateSurface();
    }
    function render() {
      const marks = gesture?.kind === 'erase' ? gesture.marks : history.marks;
      surface.innerHTML = marks.map(strokeMarkup).join('') + (gesture?.kind === 'draw' ? strokeMarkup(gesture.stroke) : gesture?.kind === 'stamp' ? strokeMarkup(gesture.stamp) : '');
      root.querySelector('[data-board-action=undo]').disabled = !history.past.length;
      root.querySelector('[data-board-action=redo]').disabled = !history.future.length;
      root.querySelector('[data-board-action=clear]').disabled = !history.marks.length;
    }
    function cancelGesture() {
      if (!gesture) return;
      const current = gesture;
      gesture = null;
      if (current.target.hasPointerCapture(current.pointerId)) current.target.releasePointerCapture(current.pointerId);
      if (current.kind === 'move' || current.kind === 'resize') applyBox();
      render();
    }
    function showDimensions(open) {
      dimensions.hidden = !open;
      dimensionsToggle.setAttribute('aria-expanded', String(open));
    }
    function synchronize() {
      cancelGesture();
      const full = document.fullscreenElement || document.webkitFullscreenElement;
      const unavailable = full?.tagName === 'IFRAME' || (window.self !== window.top && !full);
      (full && !unavailable ? full : document.body).append(root);
      root.classList.toggle('math-board-unavailable', unavailable);
      const geometry = document.querySelector('.math-kit-layer');
      if (geometry && !root.hidden && !unavailable) root.append(geometry);
      applyBox();
    }
    function open() {
      if (!root.contains(document.activeElement)) previousFocus = document.activeElement;
      root.hidden = false;
      window.MathFloatingTools?.close();
      synchronize();
      surface.focus({ preventScroll: true });
    }
    function close() {
      cancelGesture();
      showDimensions(false);
      root.hidden = true;
      const geometry = root.querySelector('.math-kit-layer');
      const full = document.fullscreenElement || document.webkitFullscreenElement;
      if (geometry) (full && full.tagName !== 'IFRAME' ? full : document.body).append(geometry);
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    }
    function drawGeometry(mark) {
      if (root.hidden || root.classList.contains('math-board-unavailable')) return false;
      const stroke = geometryStroke(mark, surface.getBoundingClientRect());
      if (!stroke) return false;
      cancelGesture();
      history.save([...history.marks, stroke]);
      render();
      return true;
    }
    root.addEventListener('click', event => {
      const nextMode = event.target.closest('[data-board-mode]')?.dataset.boardMode;
      if (nextMode) {
        cancelGesture(); mode = nextMode; root.dataset.mode = mode;
        root.querySelectorAll('[data-board-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.boardMode === mode)));
      }
      const action = event.target.closest('[data-board-action]')?.dataset.boardAction;
      if (action === 'close') { close(); return; }
      if (action === 'dimensions') { showDimensions(dimensions.hidden); return; }
      if (action === 'undo') { cancelGesture(); history.undo(); }
      if (action === 'redo') { cancelGesture(); history.redo(); }
      if (action === 'clear' && history.marks.length) { cancelGesture(); history.save([]); }
      render();
    });
    root.addEventListener('input', event => {
      const dimension = event.target.dataset.dimension;
      if (!dimension || !Number.isFinite(event.target.valueAsNumber)) return;
      box[dimension] = event.target.valueAsNumber;
      applyBox();
    });
    root.addEventListener('focusout', event => {
      if (event.target.dataset.dimension) {
        event.target.value = Math.round(box[event.target.dataset.dimension]);
      }
    });
    function pointFrom(event) {
      const bounds = surface.getBoundingClientRect();
      return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
    }
    function writeAt(event) {
      const point = pointFrom(event);
      if (gesture.kind === 'erase') gesture.marks = gesture.marks.filter(stroke => !hitsStroke(stroke, point));
      else if (gesture.stroke.points.length < 1500) {
        const last = gesture.stroke.points[gesture.stroke.points.length - 1];
        if (Math.hypot(last.x - point.x, last.y - point.y) >= .8) gesture.stroke.points.push(point);
      }
      render();
    }
    root.addEventListener('pointerdown', event => {
      if (event.button !== 0 || gesture || event.isPrimary === false) return;
      const move = event.target.closest('.math-board-move');
      const resize = event.target.closest('.math-board-resize');
      const drawing = event.target.closest('.math-board-surface');
      const target = move || resize || drawing;
      if (!target) return;
      event.preventDefault(); event.stopPropagation();
      showDimensions(false);
      gesture = { kind: move ? 'move' : resize ? 'resize' : mode === 'pen' ? 'draw' : mode === 'eraser' ? 'erase' : 'stamp', pointerId: event.pointerId, target, box: { ...box }, startX: event.clientX, startY: event.clientY };
      if (gesture.kind === 'draw') gesture.stroke = { color: root.querySelector('select').value, width: Math.max(1, Math.min(16, Number(root.querySelector('[data-board-pen-width]').value) || 4)), points: [pointFrom(event)] };
      if (gesture.kind === 'stamp') gesture.stamp = createStamp(mode, pointFrom(event));
      if (gesture.kind === 'erase') { gesture.marks = history.marks.slice(); writeAt(event); }
      target.setPointerCapture(event.pointerId);
      target.focus({ preventScroll: true });
      render();
    });
    root.addEventListener('pointermove', event => {
      if (!gesture || gesture.pointerId !== event.pointerId) return;
      event.preventDefault();
      if (gesture.kind === 'move' || gesture.kind === 'resize') {
        const deltaX = event.clientX - gesture.startX;
        const deltaY = event.clientY - gesture.startY;
        box = gesture.kind === 'move' ? { ...gesture.box, x: gesture.box.x + deltaX, y: gesture.box.y + deltaY } : { ...gesture.box, width: gesture.box.width + deltaX, height: gesture.box.height + deltaY };
        applyBox();
      } else if (gesture.kind !== 'stamp') writeAt(event);
    });
    root.addEventListener('pointerup', event => {
      if (!gesture || gesture.pointerId !== event.pointerId) return;
      if (gesture.kind === 'draw' || gesture.kind === 'erase') writeAt(event);
      if (gesture.kind === 'draw') history.save([...history.marks, gesture.stroke]);
      if (gesture.kind === 'stamp') history.save([...history.marks, gesture.stamp]);
      if (gesture.kind === 'erase' && gesture.marks.length !== history.marks.length) history.save(gesture.marks);
      const target = gesture.target;
      gesture = null;
      if (target.hasPointerCapture(event.pointerId)) target.releasePointerCapture(event.pointerId);
      render();
    });
    function cancelPointer(event) {
      if (gesture?.pointerId === event.pointerId) cancelGesture();
    }
    root.addEventListener('pointercancel', cancelPointer);
    root.addEventListener('lostpointercapture', cancelPointer);
    root.addEventListener('keydown', event => {
      event.stopPropagation();
      if (event.target.matches('input,select,textarea')) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault(); cancelGesture();
        if (event.shiftKey) history.redo(); else history.undo();
        render(); return;
      }
      if (event.key === 'Escape') {
        cancelGesture();
        if (!dimensions.hidden) { showDimensions(false); dimensionsToggle.focus(); }
      }
      const move = event.target.closest('.math-board-move');
      const resize = event.target.closest('.math-board-resize');
      if ((!move && !resize) || !event.key.startsWith('Arrow')) return;
      event.preventDefault();
      const distance = event.shiftKey ? 40 : 10;
      const deltaX = event.key === 'ArrowRight' ? distance : event.key === 'ArrowLeft' ? -distance : 0;
      const deltaY = event.key === 'ArrowDown' ? distance : event.key === 'ArrowUp' ? -distance : 0;
      if (move) { box.x += deltaX; box.y += deltaY; }
      else { box.width += deltaX; box.height += deltaY; }
      applyBox();
    });
    new ResizeObserver(updateSurface).observe(surface);
    window.addEventListener('resize', () => {
      if (gesture && gesture.kind !== 'move' && gesture.kind !== 'resize') cancelGesture();
      applyBox();
    });
    document.addEventListener('fullscreenchange', synchronize);
    document.addEventListener('webkitfullscreenchange', synchronize);
    render();
    return { open, close, drawGeometry };
  }
  window.MathWhiteboard = { open() { if (!board) board = createBoard(); board.open(); }, close() { board?.close(); }, drawGeometry(mark) { return board?.drawGeometry(mark) || false; } };
})();
