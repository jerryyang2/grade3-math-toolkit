const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../js/audio.js'), 'utf8');

function audioFixture() {
  const voice = { lang: 'zh-TW' };
  const synth = {
    speaking: false, pending: false, queue: [],
    getVoices: () => [voice],
    speak(utterance) { this.queue.push(utterance); this.pending = true; },
    cancel() { this.queue = []; this.pending = false; this.speaking = false; }
  };
  const context = vm.createContext({
    window: { speechSynthesis: synth },
    SpeechSynthesisUtterance: class { constructor(text) { this.text = text; } }
  });
  vm.runInContext(source, context);
  return { audio: context.window.spEdAudio, synth, voice };
}

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
