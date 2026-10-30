const test = require('node:test');
const assert = require('node:assert/strict');
const { DrawingHistory, hitsMark, segmentDistance } = require('../js/floating-tools.js');

test('clear can be undone and redone without losing the original drawing', () => {
  const page = new DrawingHistory();
  const pen = { tool: 'pen', points: [{ x: 10, y: 20 }], width: 4 };
  page.save([pen]);
  page.save([]);
  assert.deepEqual(page.marks, []);
  assert.equal(page.undo(), true);
  assert.deepEqual(page.marks, [pen]);
  assert.equal(page.redo(), true);
  assert.deepEqual(page.marks, []);
});

test('a new edit after undo discards the abandoned redo branch', () => {
  const page = new DrawingHistory();
  page.save([{ id: 'first' }]);
  page.save([{ id: 'second' }]);
  page.undo();
  page.save([{ id: 'replacement' }]);
  assert.equal(page.redo(), false);
  assert.equal(page.marks[0].id, 'replacement');
});

test('number stamps continue after the highest remaining step and follow undo', () => {
  const page = new DrawingHistory();
  page.save([{ tool: 'number', number: 1 }, { tool: 'number', number: 3 }]);
  assert.equal(page.nextNumber(), 4);
  page.save([{ tool: 'number', number: 1 }]);
  assert.equal(page.nextNumber(), 2);
  page.undo();
  assert.equal(page.nextNumber(), 4);
  page.save([]);
  assert.equal(page.nextNumber(), 1);
});

test('different lesson histories remain independent', () => {
  const first = new DrawingHistory();
  const second = new DrawingHistory();
  first.save([{ id: 'unit-one' }]);
  second.save([{ id: 'unit-two' }]);
  first.undo();
  assert.deepEqual(first.marks, []);
  assert.deepEqual(second.marks, [{ id: 'unit-two' }]);
  first.redo();
  assert.equal(first.marks[0].id, 'unit-one');
});

test('eraser detects nearby stroke segments and isolated pen dots', () => {
  const line = { tool: 'pen', width: 4, points: [{ x: 0, y: 0 }, { x: 100, y: 0 }] };
  assert.equal(hitsMark(line, { x: 50, y: 6 }), true);
  assert.equal(hitsMark(line, { x: 50, y: 30 }), false);
  assert.equal(hitsMark({ ...line, points: [{ x: 10, y: 10 }] }, { x: 15, y: 10 }), true);
  assert.equal(segmentDistance({ x: 4, y: 3 }, { x: 0, y: 0 }, { x: 0, y: 0 }), 5);
});

test('reverse-drawn shapes erase at their border rather than through empty centers', () => {
  const shape = { tool: 'rect', width: 4, start: { x: 200, y: 200 }, end: { x: 0, y: 0 } };
  assert.equal(hitsMark(shape, { x: 100, y: 4 }), true);
  assert.equal(hitsMark(shape, { x: 100, y: 100 }), false);
  const ellipse = { ...shape, tool: 'ellipse' };
  assert.equal(hitsMark(ellipse, { x: 100, y: 0 }), true);
  assert.equal(hitsMark(ellipse, { x: 100, y: 100 }), false);
});

test('text, arrow and number stamps can be erased in their visible area', () => {
  const text = { tool: 'text', x: 40, y: 60, text: '先算 10', fontSize: 30, width: 4 };
  assert.equal(hitsMark(text, { x: 80, y: 50 }), true);
  assert.equal(hitsMark(text, { x: 0, y: 50 }), false);
  const arrow = { tool: 'arrow', width: 4, start: { x: 0, y: 0 }, end: { x: 100, y: 100 } };
  assert.equal(hitsMark(arrow, { x: 45, y: 50 }), true);
  assert.equal(hitsMark(arrow, { x: 10, y: 80 }), false);
  assert.equal(hitsMark({ tool: 'number', width: 4, x: 100, y: 100, radius: 18 }, { x: 110, y: 100 }), true);
});

test('history is bounded for long classroom sessions', () => {
  const page = new DrawingHistory();
  for (let i = 0; i < 70; i++) page.save([{ id: i }]);
  let count = 0;
  while (page.undo()) count++;
  assert.equal(count, 40);
});
