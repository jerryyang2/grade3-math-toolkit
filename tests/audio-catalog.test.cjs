const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const data = require('../js/data.js');
const AudioSystem = require('../js/audio.js');
const normalizer = new AudioSystem();
const context = {window:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../js/female-audio-manifest.js'),'utf8'),context);
const catalog = context.window.MathFemaleAudio;
const recorded = text => {
  const clean = normalizer.cleanMathTextForTTS(text);
  return Boolean(catalog.clips[clean] || catalog.sequences[clean]?.every(part => catalog.clips[part]));
};

test('all 270 questions, solutions, scaffolding steps and nine unit cues have recorded female audio', () => {
  assert.equal(catalog.voice,'zh-TW-HsiaoChenNeural');
  for (const p of data.practiceBank) {
    for (const text of [p.question,p.speechText,p.solutionSpeech,p.hint,...p.stepScaffolds]) assert.ok(recorded(text),p.id);
  }
  for (const unit of data.units) {
    assert.ok(recorded(unit.misconception.audioMnemonic),unit.id);
    for (const step of unit.scaffoldingSteps) assert.ok(recorded(step.audioCue || step.instruction),unit.id);
  }
});

test('place value instructions use recorded female audio for every material, quantity and exchange', () => {
  const lab = require('../js/place-value-lab.js');
  for (const mode of ['money','blocks']) {
    for (let required=0;required<=9;required++) for (let step=0;step<=4;step++) {
      const state = {...lab.createState(),mode,step,target:required*1111};
      assert.ok(recorded(lab.instruction(state)));
    }
    for (const base of [1,10,100]) for (let step=0;step<3;step++) assert.ok(recorded(lab.instruction({...lab.createState(),mode,activity:'exchange',base,step})));
  }
});

test('every catalog asset contains complete mono 24kHz MP3 frames without personal metadata', () => {
  const paths = Object.values(catalog.clips);
  assert.equal(new Set(paths).size,paths.length);
  for (const relative of paths) {
    assert.match(relative,/^audio\/female\/[a-f0-9]{24}\.mp3$/);
    const bytes = fs.readFileSync(path.join(__dirname,'..',relative));
    assert.ok(bytes.length>1000 && bytes.length<100*1024*1024,relative);
    let offset=0,frames=0;
    while(offset<bytes.length) {
      const header=bytes.readUInt32BE(offset);
      assert.equal((header>>>21)&0x7ff,0x7ff,relative);
      assert.equal((header>>>19)&3,2,relative); // MPEG 2
      assert.equal((header>>>17)&3,1,relative); // Layer III
      assert.equal((header>>>12)&15,6,relative); // 48 kbps
      assert.equal((header>>>10)&3,1,relative); // 24 kHz
      assert.equal((header>>>6)&3,3,relative); // mono
      offset+=144+((header>>>9)&1);
      frames++;
    }
    assert.equal(offset,bytes.length,relative);
    assert.ok(frames>6,relative);
  }
});

test('the four games with narration share the female speech system and correct relative asset paths', () => {
  for (const game of ['game1-addition-adventure','game2-vertical-addition','game4-math-park-board','game5-dual-math-battle']) {
    const html = fs.readFileSync(path.join(__dirname,'../games',game,'index.html'),'utf8');
    assert.equal((html.match(/src="\.\.\/\.\.\/js\/female-audio-manifest\.js/g)||[]).length,1,game);
    assert.equal((html.match(/src="\.\.\/\.\.\/js\/audio\.js/g)||[]).length,1,game);
    assert.doesNotMatch(html,/new SpeechSynthesisUtterance/,game);
  }
});
