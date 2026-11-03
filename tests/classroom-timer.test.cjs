const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {parseHTML} = require('linkedom');
const {create} = require('../js/classroom-timer.js');

test('timer starts only on request and catches up after background throttling', () => {
  let now = 0, finishes = 0;
  const timer = create({now: () => now, onFinish: () => finishes++});
  now = 1000000;
  assert.equal(timer.read().seconds, 300);
  timer.configure(1); timer.start();
  now += 17000;
  assert.equal(timer.tick().seconds, 43);
  now += 90000;
  assert.equal(timer.tick().phase, 'finished');
  assert.equal(timer.read().seconds, 0);
  timer.tick(); timer.pause();
  assert.equal(finishes, 1);
  timer.start();
  assert.equal(timer.read().seconds, 60);
});

test('pause preserves partial seconds, resume and extensions keep the remaining time', () => {
  let now = 0;
  const timer = create({now: () => now});
  timer.configure(1); timer.start(); now = 1250; timer.pause();
  now = 900000;
  assert.equal(timer.read().seconds, 59);
  timer.extend(1); timer.start(); now += 750;
  assert.equal(timer.tick().seconds, 118);
  timer.extend(5);
  assert.equal(timer.read().seconds, 418);
  timer.reset();
  assert.equal(timer.read().phase, 'ready');
  assert.equal(timer.read().seconds, 420);
});

test('duration validation and upper limit also apply to repeated extensions', () => {
  const timer = create();
  for (const n of [0, -1, 181, 1.5, NaN]) assert.throws(() => timer.configure(n), RangeError);
  timer.configure(179); timer.extend(5); timer.extend(5);
  assert.equal(timer.read().totalSeconds, 10800);
  assert.equal(timer.read().seconds, 10800);
  assert.throws(() => timer.extend(0), RangeError);
});

test('completed timer can receive more time without immediately starting again', () => {
  let now = 0;
  const timer = create({now: () => now});
  timer.configure(1); timer.start(); now = 60000; timer.tick(); timer.extend(1);
  assert.equal(timer.read().phase, 'paused');
  assert.equal(timer.read().seconds, 60);
  now += 500000;
  assert.equal(timer.read().seconds, 60);
});

test('closing pauses while minimizing keeps counting and reopening preserves the session', () => {
  const {window, document, HTMLElement} = parseHTML('<html><body><button id="btn-classroom-timer">Timer</button><div class="lesson-focus-bar"></div><input id="answer" value="unfinished"></body></html>');
  HTMLElement.prototype.focus = function () {};
  let now = 0, callback, intervals = 0;
  Object.assign(window, {setInterval: fn => { callback = fn; intervals++; return 1; }, clearInterval: () => { intervals--; }});
  vm.runInNewContext(fs.readFileSync(require.resolve('../js/classroom-timer.js'), 'utf8'), {window, Date: {now: () => now}, console});
  const click = selector => document.querySelector(selector).click();
  // linkedom does not implement the browser's checked property from HTML attributes.
  document.querySelector('#classroom-clock-seconds').checked = true;
  assert.equal(document.querySelector('#classroom-clock-panel').hidden, true);
  assert.equal(intervals, 0);
  click('#btn-classroom-timer'); click('[data-clock="toggle"]');
  assert.equal(intervals, 1);
  click('[data-clock="minimize"]'); now = 10000; callback();
  assert.equal(document.querySelector('#classroom-clock-chip').hidden, false);
  assert.equal(document.querySelector('#classroom-clock-chip-time').textContent, '04:50');
  click('#classroom-clock-chip'); click('[data-clock="close"]');
  assert.equal(window.classroomClock.read().phase, 'paused');
  assert.equal(intervals, 0);
  now += 90000; click('.classroom-clock-focus-open');
  assert.equal(document.querySelector('#classroom-clock-digits').textContent, '04:50');
  assert.equal(document.querySelector('#answer').value, 'unfinished');
  assert.equal(document.querySelector('#classroom-clock-sound').hasAttribute('checked'), false);
  let sounds = 0;
  window.AudioContext = class {
    currentTime = 0;
    resume() { return Promise.resolve(); }
    createOscillator() { return {frequency: {setValueAtTime() {}}, connect() {}, start() { sounds++; }, stop() {}}; }
    createGain() { return {gain: {setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}}, connect() {}}; }
  };
  click('[data-clock="toggle"]');
  const sound = document.querySelector('#classroom-clock-sound');
  sound.checked = true; sound.dispatchEvent(new window.Event('change'));
  now += 300000; callback(); callback();
  assert.equal(sounds, 1, 'enabling sound during a running session works and chimes once');
});
