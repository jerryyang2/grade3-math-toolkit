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
  for (const question of [lab.questionAt('zero-hundreds', 11), lab.questionAt('zero-hundreds-ones', 13), lab.questionAt('ten-thousands', 3)]) {
    let state = lab.reduce(lab.createState(), 'question', question);
    for (const value of [1000, 100, 10, 1]) {
      state = add(state, value, lab.goal(state, value) - state.counts[value]);
      assert.ok(lab.canNext(state));
      state = lab.reduce(state, 'next');
    }
    assert.equal(state.step, 4);
    assert.equal(lab.total(state.counts), question.target);
    assert.equal(state.counts[100], 0);
    if (question.target === 10000) assert.equal(state.counts[1000], 10);
  }
});

test('all four question pools preserve their teaching constraints and offer distinct questions', () => {
  for (const [category, size] of [['all', 6561], ['zero-hundreds', 729], ['zero-hundreds-ones', 81], ['ten-thousands', 9]]) {
    const seen = new Set();
    for (let i = 0; i < size; i++) {
      const question = lab.questionAt(category, i);
      const digits = String(question.target).split('').map(Number);
      if (category === 'ten-thousands') {
        assert.equal(question.target, 10000);
        assert.ok(question.startThousands >= 1 && question.startThousands <= 9);
      } else {
        assert.equal(digits.length, 4);
        assert.ok(digits[0] > 0 && digits[2] > 0);
        assert.equal(digits[1] === 0, category !== 'all');
        assert.equal(digits[3] === 0, category === 'zero-hundreds-ones');
        assert.equal(question.startThousands, 0);
      }
      seen.add(`${question.target}:${question.startThousands}`);
    }
    assert.equal(seen.size, size);
    assert.equal(lab.questionAt(category, size), null);
  }
});

test('random questions never immediately repeat, including the first and last pool entries', () => {
  for (const [category, size] of [['all', 6561], ['zero-hundreds', 729], ['zero-hundreds-ones', 81], ['ten-thousands', 9]]) {
    for (const variant of [0, Math.floor(size / 2), size - 1]) {
      const previous = lab.questionAt(category, variant);
      for (const fraction of [0, 0.5, 1 - Number.EPSILON]) {
        const next = lab.generateQuestion(category, previous, () => fraction);
        assert.notEqual(next.variant, previous.variant);
        assert.deepEqual(next, lab.questionAt(category, next.variant));
      }
    }
    const other = lab.generateQuestion(category, { category: 'another', variant: 0 }, () => 0);
    assert.equal(other.variant, 0, 'switching categories can draw the first question');
  }
  assert.equal(lab.generateQuestion('unknown'), null);
});

test('new questions restart all steps, while replay and material changes preserve the selected question', () => {
  let state = lab.reduce(lab.createState(), 'mode', 'blocks');
  state = add(state, 1000, 1);
  state = lab.reduce(state, 'next');
  const question = lab.questionAt('zero-hundreds-ones', 70);
  state = lab.reduce(state, 'question', question);
  assert.equal(state.step, 0);
  assert.equal(state.mode, 'blocks');
  assert.equal(lab.total(state.counts), 0);
  assert.equal(state.target, question.target);
  state = add(state, 1000, 2);
  const reset = lab.reduce(state, 'reset');
  assert.equal(reset.variant, state.variant);
  assert.equal(reset.target, state.target);
  assert.equal(lab.total(reset.counts), 0);
  const money = lab.reduce(state, 'mode', 'money');
  assert.equal(money.target, state.target);
  assert.deepEqual(money.counts, state.counts);
});

test('ten-thousand questions keep the given pieces and replay the same starting quantity', () => {
  for (let variant = 0; variant < 9; variant++) {
    let state = lab.reduce(lab.createState(), 'question', lab.questionAt('ten-thousands', variant));
    const start = state.counts[1000];
    assert.equal(lab.reduce(state, 'remove', 1000), state, 'given pieces stay on the table');
    state = add(state, 1000, 1);
    state = lab.reduce(state, 'remove', 1000);
    assert.equal(state.counts[1000], start, 'student-added pieces can be removed');
    state = add(state, 1000, 10 - start);
    assert.equal(lab.total(state.counts), 10000);
    state = lab.reduce(state, 'reset');
    assert.equal(state.counts[1000], start);
    state = lab.reduce(state, 'activity', 'free');
    assert.equal(lab.total(state.counts), 0);
    state = lab.reduce(state, 'activity', 'build');
    assert.equal(state.counts[1000], start);
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
