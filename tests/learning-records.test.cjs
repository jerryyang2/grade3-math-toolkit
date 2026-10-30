const test = require('node:test');
const assert = require('node:assert/strict');
const {recordAttempt, summarize} = require('../js/learning-records.js');
const {makeHops} = require('../js/number-line.js');
const {describe} = require('../js/geometry-shapes.js');
const attempt = (extra = {}) => ({studentId:'1', questionId:'p1', unitId:'u1', sessionId:'s1', support:'independent', correct:false, ...extra});
test('wrong then corrected remains a failed first attempt and earns only one reward', () => {
  let result = recordAttempt([], attempt());
  assert.equal(result.reward, false);
  result = recordAttempt(result.entries, attempt({correct:true,support:'prompted'}));
  assert.equal(result.reward, true);
  result = recordAttempt(result.entries, attempt({correct:true}));
  assert.equal(result.reward, false);
  assert.equal(result.entries.length, 1);
  assert.equal(result.entries[0].attempts, 3);
  assert.equal(result.entries[0].support, 'prompted');
  assert.deepEqual([summarize(result.entries,'1').first, summarize(result.entries,'1').independent, summarize(result.entries,'1').final],[0,0,1]);
});
test('student and session isolation prevents misattribution', () => {
  let rows = recordAttempt([], attempt({correct:true})).entries;
  rows = recordAttempt(rows, attempt({studentId:'2'})).entries;
  rows = recordAttempt(rows, attempt({sessionId:'s2',support:'verbal',correct:true})).entries;
  assert.equal(rows.length,3);
  assert.equal(summarize(rows,'1').independent,1);
  assert.equal(summarize(rows,'2').first,0);
  assert.equal(summarize(rows,'1','u9').total,0);
});
test('hinted correct answers and missing evidence never produce independent mastery', () => {
  const rows = recordAttempt([],attempt({correct:true,support:'prompted'})).entries;
  assert.equal(summarize(rows,'1').firstRate,100);
  assert.equal(summarize(rows,'1').independentRate,0);
  assert.equal(summarize([],'1').firstRate,null);
  assert.throws(()=>recordAttempt([],attempt({studentId:''})));
});
test('number line supports addition, subtraction, zero and range boundaries', () => {
  assert.deepEqual(makeHops(20,10,3),[20,30,40,50]);
  assert.deepEqual(makeHops(30,-10,3),[30,20,10,0]);
  assert.deepEqual(makeHops(10000,0,1),[10000,10000]);
  assert.throws(()=>makeHops(0,-1,1));
  assert.throws(()=>makeHops(9999,2,1));
  assert.throws(()=>makeHops(0,1,11));
  assert.throws(()=>makeHops(0,0.5,2));
});
test('square classification retains four right angles and opposite equal sides', () => {
  assert.deepEqual(describe(6,3),{square:false,rightAngles:4,sides:[6,3,6,3]});
  assert.equal(describe(6,6).square,true);
  assert.throws(()=>describe(0,2));
});
