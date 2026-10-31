const test = require('node:test');
const assert = require('node:assert/strict');
const lab = require('../js/place-value-lab.js');
const add = (state, value, count) => {
  for (let i = 0; i < count; i++) state = lab.reduce(state, 'add', value);
  return state;
};

test('guided placement waits for matching quantities and allows students to correct an extra piece', () => {
  let state = lab.createState();
  assert.equal(lab.canNext(state), false);
  assert.equal(lab.reduce(state, 'next'), state);
  assert.equal(lab.reduce(state, 'add', 1), state, 'only the current place is editable');
  state = add(state, 1000, 2);
  assert.equal(lab.canNext(state), false);
  state = lab.reduce(state, 'remove', 1000);
  assert.equal(lab.canNext(state), true);
  state = lab.reduce(state, 'next');
  for (const [value, count] of [[100, 2], [10, 3], [1, 4]]) {
    state = add(state, value, count);
    state = lab.reduce(state, 'next');
  }
  assert.equal(state.step, 4);
  assert.equal(lab.total(state.counts), 1234);
  assert.equal(lab.canAdd(state, 1), false);
  state = lab.reduce(state, 'back');
  assert.equal(state.step, 3);
  assert.equal(lab.total(state.counts), 1234);
});

test('zero places stay empty and ten thousands are represented correctly at the ten-thousand boundary', () => {
  for (const target of [1023, 2050, 10000]) {
    let state = lab.reduce(lab.createState(), 'target', target);
    for (const value of [1000, 100, 10, 1]) {
      state = add(state, value, lab.goal(state, value));
      assert.ok(lab.canNext(state));
      state = lab.reduce(state, 'next');
    }
    assert.equal(state.step, 4);
    assert.equal(lab.total(state.counts), target);
    assert.equal(state.counts[100], 0);
    if (target === 10000) assert.equal(state.counts[1000], 10);
  }
});

test('all three exchanges keep ten pieces visible until the student explicitly exchanges them', () => {
  for (const mode of ['money', 'blocks']) for (const base of [1, 10, 100]) {
    let state = lab.reduce(lab.createState(), 'mode', mode);
    state = lab.reduce(state, 'activity', 'exchange');
    state = lab.reduce(state, 'base', base);
    state = add(state, base, 9);
    assert.equal(lab.canNext(state), false);
    state = add(state, base, 1);
    assert.equal(state.counts[base], 10, 'no automatic regrouping');
    state = lab.reduce(state, 'next');
    assert.equal(state.step, 1);
    assert.equal(state.counts[base], 10, 'pre-exchange group is still present');
    state = lab.reduce(state, 'next');
    assert.equal(state.step, 2);
    assert.equal(state.counts[base], 0);
    assert.equal(state.counts[base * 10], 1);
    assert.equal(lab.total(state.counts), base * 10);
  }
});

test('free exchanges and splits preserve value and do not instantly undo a split', () => {
  for (const base of [1, 10, 100]) {
    let state = lab.reduce(lab.createState(), 'activity', 'free');
    state = add(state, base, 10);
    const amount = lab.total(state.counts);
    state = lab.reduce(state, 'trade', base);
    assert.equal(state.counts[base * 10], 1);
    assert.equal(lab.total(state.counts), amount);
    state = lab.reduce(state, 'split', base);
    assert.equal(state.counts[base], 10);
    assert.equal(state.counts[base * 10], 0);
    assert.equal(lab.total(state.counts), amount);
  }
});

test('the workspace prevents negative counts, excess pieces and totals above 10000', () => {
  let state = lab.reduce(lab.createState(), 'activity', 'free');
  assert.equal(lab.reduce(state, 'remove', 1), state);
  assert.equal(lab.reduce(state, 'trade', 1), state);
  state = add(state, 1, 20);
  assert.equal(lab.reduce(state, 'add', 1), state);
  state = add(state, 10, 1);
  assert.equal(lab.reduce(state, 'split', 1), state, 'split cannot exceed the piece limit');
  state = lab.reduce(state, 'reset');
  state = add(state, 100, 20);
  state = add(state, 10, 10);
  assert.equal(lab.reduce(state, 'trade', 10), state, 'exchange destination also has a piece limit');
  state = lab.reduce(state, 'reset');
  state = add(state, 1000, 10);
  assert.equal(lab.total(state.counts), 10000);
  for (const value of [1000, 100, 10, 1]) assert.equal(lab.reduce(state, 'add', value), state);
});

test('switching representations keeps quantities and progress; restarting clears the current task', () => {
  let state = add(lab.createState(), 1000, 1);
  state = lab.reduce(state, 'next');
  const blocks = lab.reduce(state, 'mode', 'blocks');
  assert.deepEqual(blocks.counts, state.counts);
  assert.equal(blocks.step, state.step);
  assert.equal(lab.reduce(blocks, 'activity', 'build'), blocks, 'clicking the selected activity does not erase work');
  const reset = lab.reduce(blocks, 'reset');
  assert.equal(reset.mode, 'blocks');
  assert.equal(reset.step, 0);
  assert.equal(lab.total(reset.counts), 0);
  assert.deepEqual(state.counts, { 1000: 1, 100: 0, 10: 0, 1: 0 }, 'actions do not mutate earlier snapshots');
});
