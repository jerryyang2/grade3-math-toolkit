const test = require('node:test');
const assert = require('node:assert/strict');
const bank = require('../js/data.js').practiceBank;
const diagrams = require('../js/worksheet-diagrams.js');
const problem = id => bank.find(p => p.id === id);

test('digit-swap choices have exactly one increasing result and the answer points to it', () => {
  const p = problem('p1_3_8');
  const increasing = p.options.filter(value => {
    const [a,b,c,d] = value;
    return Number(b+a+c+d) > Number(value);
  });
  assert.deepEqual(increasing, [p.options[p.answerIndex]]);
});

test('minimum-press and route-endpoint problems distinguish reaching a target from exact payment', () => {
  const presses = problem('p1_2_10');
  const n = Number.parseInt(presses.options[presses.answerIndex]);
  assert.ok(1000 + (n-1)*100 < 1240);
  assert.ok(1000 + n*100 >= 1240);
  const route = problem('p6_1_6');
  assert.equal(Number.parseInt(route.options[route.answerIndex]), 42/7);
  assert.match(diagrams.render(route), /全程42步/);
  assert.doesNotMatch(diagrams.render(route), /公分/);
});

test('stacked spacers and energy changes keep diagrams consistent with the new physical quantities', () => {
  const spacers = problem('p4_1_6');
  assert.equal(new Set(spacers.options).size, 4);
  assert.equal(Number.parseInt(spacers.options[spacers.answerIndex]), 3*2);
  assert.match(diagrams.render(spacers), /每片 2 毫米/);
  assert.doesNotMatch(diagrams.render(spacers), /硬幣|課本/);
  const energy = problem('p2_3_6');
  assert.equal(Number.parseInt(energy.options[energy.answerIndex]), 100-30-24);
  assert.match(diagrams.render(energy), /現在亮著：？格/);
  assert.doesNotMatch(diagrams.render(energy), /元|花/);
});
