const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../js/audio.js'), 'utf8');

function audioFixture(options = {}) {
  const voice = { lang: 'zh-TW', name: 'Meijia' };
  const synth = {
    speaking: false, pending: false, queue: [],
    getVoices: () => options.voices || [voice],
    speak(utterance) { this.queue.push(utterance); this.pending = true; },
    cancel() { this.queue = []; this.pending = false; this.speaking = false; }
  };
  const recordings = [];
  class Recording {
    constructor(src) { this.src = src; recordings.push(this); }
    play() { return Promise.resolve(); }
    pause() { this.paused = true; }
    load() {}
    removeAttribute() {}
  }
  const context = vm.createContext({
    window: { speechSynthesis: synth, Audio:Recording, MathFemaleAudio:options.catalog, MathI18n:options.i18n },
    SpeechSynthesisUtterance: class { constructor(text) { this.text = text; } }
  });
  vm.runInContext(source, context);
  return { audio: context.window.spEdAudio, synth, voice, recordings };
}

test('English mode reads the English question with an English female voice and bypasses Chinese recordings',()=>{
  const i18n=require('../js/i18n.js').create(require('../js/i18n-en.js'));
  const {audio,synth,recordings}=audioFixture({i18n,voices:[{lang:'en-US',name:'Samantha'}],catalog:{clips:{'下一題':'chinese.mp3'}}});
  audio.speak('下一題');assert.equal(recordings.length,0);assert.equal(synth.queue[0].lang,'en-US');assert.doesNotMatch(synth.queue[0].text,/[\u3400-\u9fff]/);
});

test('a second animal reminder replaces speech that is still waiting to start', () => {
  const { audio, synth } = audioFixture();
  audio.speak('米米兔：先數清楚，再往前走！');
  assert.equal(synth.speaking, false);
  audio.speak('布布熊：一步一步，我陪你慢慢想。');
  assert.equal(synth.queue.length, 1);
  assert.equal(synth.queue[0].text, '布布熊，一步一步，我陪你慢慢想。');
});

test('muting cancels pending speech and prevents new reminders until unmuted', () => {
  const { audio, synth, voice } = audioFixture();
  audio.speak('先數清楚');
  audio.toggleMute();
  audio.speak('再往前走');
  assert.equal(synth.queue.length, 0);
  audio.toggleMute();
  audio.setSpeechRate(0.7);
  audio.speak('一步一步');
  assert.equal(synth.queue.length, 1);
  assert.equal(synth.queue[0].rate, 0.7);
  assert.equal(synth.queue[0].voice, voice);
  assert.equal(synth.queue[0].lang, 'zh-TW');
});

test('leaving a page stops speech both before and after it starts', () => {
  const { audio, synth } = audioFixture();
  for (const started of [false, true]) {
    audio.speak('慢慢想');
    synth.pending = !started;
    synth.speaking = started;
    audio.isSpeaking = started;
    audio.stopSpeech();
    assert.equal(synth.queue.length, 0);
    assert.equal(audio.isSpeaking, false);
  }
});

test('recorded female speech is preferred and preserves pitch when changing speed', () => {
  const {audio,synth,recordings} = audioFixture({catalog:{clips:{'慢慢想':'audio/female/example.mp3'}}});
  let starts = 0, ends = 0;
  audio.speak('慢慢想', () => starts++, () => ends++);
  assert.equal(synth.queue.length,0);
  assert.equal(recordings[0].src,'audio/female/example.mp3');
  recordings[0].onplaying();
  audio.setSpeechRate(.75);
  assert.equal(recordings[0].playbackRate,.75);
  assert.equal(recordings[0].preservesPitch,true);
  recordings[0].onended();
  assert.equal(starts,1);
  assert.equal(ends,1);
  assert.equal(audio.isSpeaking,false);
});

test('a cancelled recording cannot play another part or complete a newer question', () => {
  const {audio,recordings,synth} = audioFixture({catalog:{clips:{'第一步':'a.mp3','第二步':'b.mp3'},sequences:{'第一步。第二步':['第一步','第二步']}}});
  let ends = 0;
  audio.speak('第一步。第二步', null, () => ends++);
  const staleEnd = recordings[0].onended;
  const staleError = recordings[0].onerror;
  audio.speak('新的題目');
  staleEnd(); staleError();
  assert.equal(recordings.length,1);
  assert.equal(recordings[0].paused,true);
  assert.equal(ends,0);
  assert.equal(synth.queue.length,1);
  audio.stopSpeech();
  assert.equal(synth.queue.length,0);
});

test('recorded sequences complete once and muting stops subsequent segments', () => {
  const catalog = {clips:{'先想':'a.mp3','再說':'b.mp3'},sequences:{'先想。再說':['先想','再說']}};
  const {audio,recordings} = audioFixture({catalog});
  let starts = 0, ends = 0;
  audio.speak('先想。再說', () => starts++, () => ends++);
  recordings[0].onplaying(); recordings[0].onended();
  recordings[1].onplaying(); recordings[1].onended();
  assert.equal(starts,1); assert.equal(ends,1);
  audio.speak('先想。再說');
  const staleEnd = recordings[2].onended;
  audio.toggleMute(); staleEnd();
  assert.equal(recordings.length,3);
  assert.equal(recordings[2].paused,true);
});

test('a missing recording falls back once to a known female voice and never a male default', () => {
  const {audio,synth,recordings} = audioFixture({catalog:{clips:{'慢慢想':'missing.mp3'}}});
  const error = () => recordings[0].onerror();
  audio.speak('慢慢想'); error(); error();
  assert.equal(synth.queue.length,1);
  assert.equal(synth.queue[0].voice.name,'Meijia');
  const maleOnly = audioFixture({voices:[{lang:'zh-TW',name:'Microsoft YunJhe'}]});
  maleOnly.audio.speak('動態教具');
  assert.equal(maleOnly.synth.queue.length,0);
});
