const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { WhiteboardHistory, clampBoard, hitsStroke, strokeMarkup } = require('../js/math-whiteboard.js');

const stroke = { color: '#273b5b', width: 4, points: [{ x: 20, y: 30 }, { x: 100, y: 30 }, { x: 100, y: 90 }] };

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
  }
});
