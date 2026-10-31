const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { WhiteboardHistory, clampBoard, hitsStroke, strokeMarkup, geometryStroke } = require('../js/math-whiteboard.js');

const stroke = { color: '#273b5b', width: 4, points: [{ x: 20, y: 30 }, { x: 100, y: 30 }, { x: 100, y: 90 }] };

function draggableBoard() {
  const controls = new Map();
  const viewportEvents = new Map();
  const document = { activeElement: null, fullscreenElement: null, querySelector: () => null, addEventListener() {}, body: { append() {} } };
  function element(selector = '') {
    const listeners = new Map();
    const captures = new Set();
    const node = {
      style: {}, dataset: {}, hidden: false, value: '4', listeners,
      classList: { contains: () => false, toggle() {} },
      setAttribute() {}, append() {}, contains: () => false,
      closest: target => target === selector ? node : null,
      focus: () => { document.activeElement = node; },
      addEventListener: (event, handler) => listeners.set(event, handler),
      setPointerCapture: pointerId => captures.add(pointerId),
      hasPointerCapture: pointerId => captures.has(pointerId),
      releasePointerCapture: pointerId => { captures.delete(pointerId); root.listeners.get('lostpointercapture')?.({ pointerId }); },
      querySelector: target => {
        if (!controls.has(target)) controls.set(target, element(target));
        return controls.get(target);
      },
      querySelectorAll: () => [],
      getBoundingClientRect: () => ({ left: Number.parseFloat(root.style.left) + 2, top: Number.parseFloat(root.style.top) + 88, width: Number.parseFloat(root.style.width) - 4, height: Number.parseFloat(root.style.height) - 112 })
    };
    return node;
  }
  const root = element();
  document.createElement = () => root;
  const window = { addEventListener: (event, handler) => viewportEvents.set(event, handler) };
  window.self = window; window.top = window;
  const source = fs.readFileSync(path.join(__dirname, '../js/math-whiteboard.js'), 'utf8');
  vm.runInNewContext(source, { document, window, innerWidth: 1440, innerHeight: 900, ResizeObserver: class { observe() {} } });
  window.MathWhiteboard.open();
  const handle = element('.math-board-move');
  function pointer(type, clientX, clientY, pointerId = 1) {
    root.listeners.get(type)({ button: 0, isPrimary: true, pointerId, clientX, clientY, target: handle, preventDefault() {}, stopPropagation() {} });
  }
  return { root, pointer, resize: () => viewportEvents.get('resize')() };
}

test('an interrupted board drag retains its latest position instead of jumping to its start', () => {
  for (const interruption of ['pointercancel', 'lostpointercapture']) {
    const board = draggableBoard();
    board.pointer('pointerdown', 800, 200);
    board.pointer('pointermove', 900, 300);
    const moved = { ...board.root.style };
    board.pointer(interruption, 900, 300);
    assert.deepEqual(board.root.style, moved);
  }
});

test('viewport resize and another pointer do not cancel an active board drag', () => {
  const board = draggableBoard();
  board.pointer('pointerdown', 800, 200);
  board.pointer('pointermove', 850, 250);
  board.resize();
  board.pointer('pointercancel', 850, 250, 2);
  board.pointer('pointermove', 900, 300);
  assert.equal(board.root.style.left, '804px');
  assert.equal(board.root.style.top, '280px');
  board.pointer('pointerup', 900, 300);
  assert.equal(board.root.style.left, '804px');
  assert.equal(board.root.style.top, '280px');
});

test('whiteboard undo/redo restores erased and cleared writing and discards abandoned redo branches', () => {
  const history = new WhiteboardHistory();
  history.save([stroke]);
  history.save([]);
  assert.equal(history.undo(), true);
  assert.deepEqual(history.marks, [stroke]);
  assert.equal(history.redo(), true);
  assert.deepEqual(history.marks, []);
  history.undo();
  history.save([stroke, { ...stroke, color: '#c4473d' }]);
  assert.equal(history.redo(), false);
  assert.equal(history.marks.length, 2);
});

test('whiteboard history has bounded memory for a long lesson', () => {
  const history = new WhiteboardHistory();
  for (let index = 0; index < 80; index++) history.save(Array(320).fill(stroke));
  assert.equal(history.past.length, 40);
  assert.equal(history.marks.length, 300);
  assert.equal(new WhiteboardHistory().undo(), false);
  assert.equal(new WhiteboardHistory().redo(), false);
});

test('board width and height change independently instead of locking an aspect ratio', () => {
  const wide = clampBoard({ x: 20, y: 30, width: 900, height: 240 }, 1440, 1000);
  const tall = clampBoard({ ...wide, width: 300, height: 800 }, 1440, 1000);
  assert.equal(wide.width, 900); assert.equal(wide.height, 240);
  assert.equal(tall.width, 300); assert.equal(tall.height, 800);
  assert.notEqual(wide.width / wide.height, tall.width / tall.height);
});

test('moving and resizing always keep the board within desktop, phone and landscape viewports', () => {
  for (const [width, height] of [[1440, 900], [375, 812], [320, 568], [812, 375]]) {
    for (const box of [{ x: -900, y: 9000, width: 10000, height: 10000 }, { x: 9999, y: -800, width: 100, height: 90 }]) {
      const result = clampBoard(box, width, height);
      assert.ok(result.x >= 8 && result.y >= 8);
      assert.ok(result.x + result.width <= width - 8);
      assert.ok(result.y + result.height <= height - 8);
      assert.ok(result.width >= Math.min(280, width - 16));
      assert.ok(result.height >= Math.min(240, height - 16));
    }
  }
});

test('eraser hits whole strokes and isolated dots without erasing distant writing', () => {
  assert.equal(hitsStroke(stroke, { x: 60, y: 35 }), true);
  assert.equal(hitsStroke(stroke, { x: 100, y: 65 }), true);
  assert.equal(hitsStroke(stroke, { x: 60, y: 80 }), false);
  assert.equal(hitsStroke({ ...stroke, points: [{ x: 20, y: 20 }] }, { x: 20, y: 25 }), true);
  assert.equal(hitsStroke({ ...stroke, points: [{ x: 20, y: 20 }] }, { x: 60, y: 60 }), false);
});

test('fullscreen controls leave the board header reachable without clearing its writing', () => {
  const result = clampBoard({ x: 8, y: 8, width: 600, height: 1000 }, 812, 375, 90);
  assert.equal(result.y, 90);
  assert.equal(result.height, 277);
  assert.ok(result.y + result.height <= 367);
});

test('changing board size preserves writing coordinates and does not stretch calculations', () => {
  const original = JSON.stringify(stroke);
  const markup = strokeMarkup(stroke);
  clampBoard({ x: 10, y: 10, width: 800, height: 260 }, 1200, 900);
  clampBoard({ x: 10, y: 10, width: 300, height: 700 }, 1200, 900);
  assert.equal(JSON.stringify(stroke), original);
  assert.equal(strokeMarkup(stroke), markup);
  assert.match(markup, /M20 30 L100 30 L100 90/);
  assert.match(strokeMarkup({ ...stroke, points: [{ x: 20, y: 30 }] }), /<circle cx="20" cy="30" r="2"/);
});

test('all published toolbox pages load the whiteboard before the toolbox exactly once', () => {
  const root = path.join(__dirname, '..');
  const pages = ['index.html', ...fs.readdirSync(path.join(root, 'games')).map(folder => `games/${folder}/index.html`)];
  for (const page of pages) {
    const html = fs.readFileSync(path.join(root, page), 'utf8');
    assert.equal((html.match(/js\/math-whiteboard\.js/g) || []).length, 1);
    assert.ok(html.lastIndexOf('js/math-whiteboard.js') < html.lastIndexOf('js/math-toolbox.js'));
    assert.match(html, /js\/math-whiteboard\.js\?v=paired-tools-drag-20261031/);
    assert.match(html, /css\/math-toolbox\.css\?v=board-tools-20261031/);
  }
});

test('ruler and set-square lines are clipped to the board and stored in board-local coordinates', () => {
  const bounds = { left: 100, top: 200, width: 400, height: 300 };
  for (const [start, end, expected] of [
    [{ x: 50, y: 250 }, { x: 550, y: 250 }, [{ x: 0, y: 50 }, { x: 400, y: 50 }]],
    [{ x: 200, y: 150 }, { x: 200, y: 550 }, [{ x: 100, y: 0 }, { x: 100, y: 300 }]],
    [{ x: 550, y: 550 }, { x: 50, y: 50 }, [{ x: 400, y: 300 }, { x: 100, y: 0 }]],
    [{ x: 100, y: 200 }, { x: 100, y: 200 }, [{ x: 0, y: 0 }, { x: 0, y: 0 }]]
  ]) assert.deepEqual(geometryStroke({ type: 'line', start, end }, bounds).points, expected);
  assert.equal(geometryStroke({ type: 'line', start: { x: 10, y: 10 }, end: { x: 90, y: 90 } }, bounds), null);
  assert.equal(geometryStroke({ type: 'line', start: { x: 50, y: 250 }, end: { x: 50, y: 450 } }, bounds), null);
});

test('compass circles preserve their center and radius on the board and support erasing and undo', () => {
  const bounds = { left: 100, top: 200, width: 400, height: 300 };
  const circle = geometryStroke({ type: 'circle', x: 300, y: 350, radius: 80 }, bounds);
  for (const point of circle.points) assert.ok(Math.abs(Math.hypot(point.x - 200, point.y - 150) - 80) < .00001);
  assert.equal(hitsStroke(circle, { x: 280, y: 150 }), true);
  assert.equal(hitsStroke(circle, { x: 200, y: 150 }), false);
  const history = new WhiteboardHistory();
  history.save([circle]); history.save([]); history.undo();
  assert.deepEqual(history.marks, [circle]);
  assert.equal(geometryStroke({ type: 'circle', x: 10, y: 10, radius: 20 }, bounds), null);
  assert.equal(geometryStroke({ type: 'circle', x: 300, y: 350, radius: 500 }, bounds), null);
  assert.ok(geometryStroke({ type: 'circle', x: 90, y: 350, radius: 50 }, bounds));
});
