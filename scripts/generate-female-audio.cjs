/* 與社交技巧課同樣使用 Edge TTS 曉臻臺灣女聲；僅在備課建置時連線產製。
 * npm ci && npm run audio:build；既有相同聲線、語速和文字的音檔會直接沿用。
 * 音檔、索引一起提交；npm run audio:check 檢查資料源與音檔同步。
 */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const data = require('../js/data.js');
const AudioSystem = require('../js/audio.js');
const normalizer = new AudioSystem();
const config = { voice: 'zh-TW-HsiaoChenNeural', lang: 'zh-TW', outputFormat: 'audio-24khz-48kbitrate-mono-mp3', rate: '-4%', pitch: '+0Hz' };
const clips = new Map();
const recipes = new Map();
const clean = text => normalizer.cleanMathTextForTTS(text);
const filename = text => `${crypto.createHash('sha256').update(JSON.stringify(config) + text).digest('hex').slice(0, 24)}.mp3`;
// 保守重作的新題採裝置女聲；保留仍可共用的預製數學步驟，不重新公開退役情境。
const deviceVoiceIds = new Set(['p3_1_8','p6_1_1','p6_1_7','p8_1_1','p1_1_8']);
const deviceVoiceTexts = new Set(data.practiceBank.filter(p=>deviceVoiceIds.has(p.id))
  .flatMap(p=>[p.question,p.speechText,p.solutionSpeech,p.hint,...p.stepScaffolds]).map(clean));
const deviceVoiceOnly = new Set();
function add(text) {
  const normalized = clean(text);
  if (deviceVoiceTexts.has(normalized) && !valid(`audio/female/${filename(normalized)}`)) {
    deviceVoiceOnly.add(normalized); return;
  }
  if (normalized) clips.set(normalized, `audio/female/${filename(normalized)}`);
}
function compose(text, parts) {
  parts.forEach(add);
  const normalizedParts = parts.map(clean).filter(Boolean);
  if (normalizedParts.every(part=>clips.has(part))) recipes.set(clean(text), normalizedParts);
}
function objectFromSource(file, name) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const match = source.match(new RegExp(`const ${name} = ([\\s\\S]*?);\\n`));
  if (!match) throw new Error(`Missing speech source: ${name}`);
  return vm.runInNewContext(`(${match[1]})`);
}
for (const unit of data.units) {
  add(unit.misconception.audioMnemonic);
  for (const step of unit.scaffoldingSteps) add(step.audioCue || step.instruction);
}
for (const p of data.practiceBank) {
  [p.question, p.speechText, p.solutionSpeech, p.hint, ...p.stepScaffolds].forEach(add);
  compose(p.stepScaffolds.join('。'), p.stepScaffolds);
}
const friends = objectFromSource('js/animal-garden.js', 'friends');
Object.values(friends).forEach(friend => add(friend.message));
const mascots = Object.values(objectFromSource('js/confetti-effects.js', 'MASCOTS'));
mascots.forEach(mascot => [...mascot.cheers, ...mascot.comforts].forEach(add));
const recordsSource = fs.readFileSync(path.join(root, 'js/learning-records.js'), 'utf8');
const strategySource = recordsSource.slice(recordsSource.indexOf('function strategyPrompt('), recordsSource.indexOf('window.LearningRecords ='));
const strategyPrompt = vm.runInNewContext(`(${strategySource.trim()})`);
// 教具引導沿用同一份資料源；數字與材料變化也預製成女聲。
const placeValue = require('../js/place-value-lab.js');
for (const mode of ['money', 'blocks']) {
  for (const activity of ['free', 'build', 'exchange']) {
    for (let step = 0; step <= 4; step++) {
      for (let n = 0; n <= 10; n++) {
        const state = {...placeValue.createState(), mode, activity, step, target:n===10?10000:n*1111};
        if (activity === 'exchange') {
          if (step > 2) continue;
          for (const base of [1,10,100]) add(placeValue.instruction({...state, base}));
        } else add(placeValue.instruction(state));
        if (activity === 'build' && step === 0 && n < 10) add(placeValue.instruction({...state,category:'ten-thousands',startThousands:n,target:10000}));
      }
    }
  }
}
const handsOn = require('../js/hands-on-tools.js');
const handsSource = fs.readFileSync(path.join(root, 'js/hands-on-tools.js'), 'utf8');
const stepArrays = [...handsSource.matchAll(/const steps\s*=\s*\(\)\s*=>\s*(\[\[.*?\]\]);/g)].map(match => match[1]);
if (stepArrays.length !== 6) throw new Error('Hands-on speech sources changed; review step extraction.');
function addToolSteps(state) {
  const context = {state, info:()=>handsOn.divisionState(state.total, state.baskets, state.distributed)};
  stepArrays.forEach(source => vm.runInNewContext(source, context).forEach(step => add(step[1])));
}
for (let total = 3; total <= 30; total++) for (let baskets = 2; baskets <= 6; baskets++) {
  const limit = Math.floor(total / baskets) * baskets;
  for (const distributed of new Set([0,1,2,3,4,5,limit].filter(n=>n<=limit))) addToolSteps({total,baskets,distributed,target:1,den:4,selected:new Set()});
}
for (const den of [2,3,4,6,8]) for (let n = 0; n <= den; n++) addToolSteps({total:14,baskets:3,distributed:0,target:n,den,selected:new Set(Array.from({length:n},(_,i)=>i))});
for (let n = 1; n <= 9; n++) add(`${n}的乘法：${Array.from({length:9},(_,i)=>`${n}×${i+1}=${n*(i+1)}`).join('、')}`);
for (const unit of data.units) {
  const prompt = strategyPrompt({unitId: unit.id});
  add(prompt);
  add(`解題提示：${prompt}`);
  for (const mascot of mascots) for (const comfort of mascot.comforts) compose(`${comfort}。${prompt}`, [comfort, prompt]);
}
[
  '照著提示，先完成一個步驟再試試看。', '答對了！太棒了！', '沒關係，我們深呼吸再試一次！',
  '單鍵開關掃描模式已啟動，請按空白鍵或點擊螢幕選取。', '已關閉單鍵掃描模式。',
  ...['A','B','C','D'].map(letter => `沒關係，正確答案是第 ${letter} 項。我們一起說說怎麼想，再換下一題。`)
].forEach(add);

const manifest = {
  voice: config.voice, rate: config.rate,
  deviceVoiceOnly: [...deviceVoiceOnly].sort(),
  clips: Object.fromEntries([...clips.entries()].sort(([a], [b]) => a.localeCompare(b, 'zh-TW'))),
  sequences: Object.fromEntries(recipes)
};
const manifestFile = path.join(root, 'js/female-audio-manifest.js');
const manifestSource = `/* 自動產製，請用 npm run audio:build 更新。 */\nwindow.MathFemaleAudio = ${JSON.stringify(manifest)};\n`;
function valid(relative) {
  try { return fs.statSync(path.join(root, relative)).size > 1000; } catch { return false; }
}
async function main() {
  const missing = [...clips.entries()].filter(([, relative]) => !valid(relative));
  if (process.argv.includes('--catalog-only')) {
    fs.writeFileSync(manifestFile, manifestSource);
    console.log(`Preview catalog: ${clips.size} clips (${missing.length} still need generation).`);
    return;
  }
  if (process.argv.includes('--check')) {
    if (missing.length || !fs.existsSync(manifestFile) || fs.readFileSync(manifestFile, 'utf8') !== manifestSource) {
      throw new Error(`Speech assets out of sync: ${missing.length} missing clips; rebuild required.`);
    }
    console.log(`PASS: ${clips.size} female clips and ${recipes.size} sequences match teaching sources.`);
    return;
  }
  fs.mkdirSync(path.join(root, 'audio/female'), {recursive:true});
  const { EdgeTTS } = require('node-edge-tts');
  let cursor = 0, completed = 0;
  const failures = [];
  console.log(`Female voice: ${config.voice}; ${missing.length}/${clips.size} clips to generate.`);
  async function worker() {
    while (cursor < missing.length) {
      const [text, relative] = missing[cursor++];
      const dest = path.join(root, relative), temporary = `${dest}.tmp`;
      let succeeded = false;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          await new EdgeTTS({...config, timeout:45000}).ttsPromise(text, temporary);
          if (fs.statSync(temporary).size <= 1000) throw new Error('Empty audio');
          fs.renameSync(temporary, dest);
          succeeded = true;
          break;
        } catch {
          fs.rmSync(temporary, {force:true});
          await new Promise(resolve => setTimeout(resolve, 700 * (attempt + 1)));
        }
      }
      if (!succeeded) failures.push(relative);
      completed++;
      if (completed % 25 === 0 || completed === missing.length) console.log(`Generated/checked ${completed}/${missing.length}; failures ${failures.length}.`);
      if (failures.length >= 8) throw new Error('Speech service unavailable; valid existing clips retained.');
    }
  }
  await Promise.all(Array.from({length:4}, worker));
  if (failures.length) throw new Error(`${failures.length} speech clips need retry.`);
  fs.writeFileSync(manifestFile, manifestSource);
  const expected = new Set([...clips.values()].map(relative => path.basename(relative)));
  for (const file of fs.readdirSync(path.join(root, 'audio/female'))) {
    if (/^[a-f0-9]{24}\.mp3$/.test(file) && !expected.has(file)) fs.unlinkSync(path.join(root, 'audio/female', file));
  }
  console.log(`Complete: ${clips.size} female clips, ${recipes.size} sequences.`);
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
