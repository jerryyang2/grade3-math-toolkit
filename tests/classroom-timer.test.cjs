const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {parseHTML} = require('linkedom');
const {create, fitFrame, resizeFrame} = require('../js/classroom-timer.js');

test('resizing from all corners preserves the opposite corner and stays inside the viewport', () => {
  const view = {width: 1200, height: 900}, frame = {left: 400, top: 200, width: 390, height: 640};
  assert.deepEqual(resizeFrame(frame, 'nw', -200, -100, view), {left: 200, top: 100, width: 590, height: 740});
  assert.deepEqual(resizeFrame(frame, 'se', 200, -100, view), {left: 400, top: 200, width: 590, height: 540});
  for (const edge of ['n','e','s','w','nw','ne','sw','se']) {
    for (const distance of [-10000, 10000]) {
      const r = resizeFrame(frame, edge, distance, distance, view);
      assert.ok(r.left >= 8 && r.top >= 8 && r.width >= 280 && r.height >= 260);
      assert.ok(r.left + r.width <= view.width - 8 && r.top + r.height <= view.height - 8);
    }
  }
  const phone = fitFrame(frame, {width: 320, height: 540});
  assert.ok(phone.width <= 304 && phone.height <= 524 && phone.left >= 8 && phone.top >= 8);
});

test('full-screen and keyboard resizing keep the running countdown and lesson state', async () => {
  const {window, document, HTMLElement} = parseHTML('<html><body class="lesson-focus"><button id="btn-classroom-timer">Timer</button></body></html>');
  HTMLElement.prototype.focus = function () {};
  delete window.classroomClock;
  let now = 0, callback;
  Object.assign(window, {innerWidth: 1440, innerHeight: 900, setInterval: fn => { callback = fn; return 1; }, clearInterval() {}});
  vm.runInNewContext(fs.readFileSync(require.resolve('../js/classroom-timer.js'), 'utf8'), {window, Date: {now: () => now}, console});
  const $ = selector => document.querySelector(selector), click = selector => $(selector).click();
  click('#btn-classroom-timer'); click('[data-clock="toggle"]');
  const panel = $('#classroom-clock-panel');
  const before = parseFloat(panel.style.width);
  const key = new window.Event('keydown', {bubbles: true, cancelable: true}); key.key = 'ArrowLeft';
  $('[data-clock-edge="se"]').dispatchEvent(key);
  assert.equal(parseFloat(panel.style.width), before - 10);
  document.fullscreenElement = document.documentElement;
  let requests = 0;
  panel.requestFullscreen = async () => { requests++; document.fullscreenElement = panel; };
  click('[data-clock="fullscreen"]');
  assert.equal(requests, 0, 'uses a viewport overlay inside an existing full-screen lesson');
  assert.ok(panel.classList.contains('is-fullscreen'));
  now = 10000; callback();
  click('[data-clock="settings"]');
  assert.ok(panel.classList.contains('show-settings'));
  click('[data-clock="fullscreen"]');
  assert.equal(document.fullscreenElement, document.documentElement);
  assert.ok(document.body.classList.contains('lesson-focus'));
  assert.equal(window.classroomClock.read().seconds, 290);
  document.fullscreenElement = null;
  document.exitFullscreen = async () => { document.fullscreenElement = null; document.dispatchEvent(new window.Event('fullscreenchange')); };
  click('[data-clock="fullscreen"]'); await new Promise(setImmediate);
  assert.equal(requests, 1); assert.equal(document.fullscreenElement, panel);
  // The browser's Escape key can exit native fullscreen without clicking a website button.
  document.fullscreenElement = null; document.dispatchEvent(new window.Event('fullscreenchange'));
  assert.ok(!panel.classList.contains('is-fullscreen'));
  assert.equal(window.classroomClock.read().phase, 'running');
  click('[data-clock="fullscreen"]'); await new Promise(setImmediate);
  click('[data-clock="minimize"]');
  assert.equal(document.fullscreenElement, null);
  assert.equal($('#classroom-clock-chip').hidden, false);
  assert.equal(window.classroomClock.read().phase, 'running');
});

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
  delete window.classroomClock;
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
