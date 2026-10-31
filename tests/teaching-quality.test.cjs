const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const data = require('../js/data.js');
const root = path.join(__dirname,'..');
const games = fs.readdirSync(path.join(root,'games')).map(d=>path.join(root,'games',d,'index.html'));
test('all 270 practice questions have unique identities, valid choices and matching unit/level',()=>{
  assert.equal(data.practiceBank.length,270);
  assert.equal(new Set(data.practiceBank.map(p=>p.id)).size,270);
  for(const p of data.practiceBank){
    assert.ok(data.units.some(u=>u.id===p.unitId),p.id);
    assert.ok([1,2,3].includes(p.level),p.id);
    assert.equal(p.options.length,4,p.id);
    assert.equal(new Set(p.options).size,4,p.id);
    assert.ok(Number.isInteger(p.answerIndex)&&p.answerIndex>=0&&p.answerIndex<4,p.id);
  }
});
test('every page and inline script parses, has a favicon and has no corrupted text',()=>{
  for(const filename of [path.join(root,'index.html'),...games]){
    const html=fs.readFileSync(filename,'utf8');
    assert.ok(/rel="icon"[^>]*type="image\/svg\+xml"/.test(html),filename);
    assert.ok(!html.includes('\uFFFD'),filename);
    let number=0;
    for(const [,attrs,source] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
      if(!/\bsrc=|application\/ld\+json/.test(attrs))new vm.Script(source,{filename:filename+':inline'+(++number)});
    }
  }
});
test('main page has no duplicate static IDs that cause tools to mount in the wrong panel',()=>{
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(new Set(ids).size,ids.length);
});
test('unit alignment uses verified math codes and every special-needs reference has a definition',()=>{
  const expected = {u4:'N-3-12',u7:'N-3-15',u8:'N-3-9'};
  for(const [id,code] of Object.entries(expected))assert.equal(data.units.find(u=>u.id===id).curriculumCode,code);
  const library=[...data.specialNeedsIndicators.strategy,...data.specialNeedsIndicators.dailyLife];
  for(const u of data.units)for(const code of u.specialNeedsCodes)assert.ok(library.some(s=>s.code===code),`${u.id}: ${code}`);
  assert.equal(data.iepObjectives.length,9);
  for(const u of data.units)assert.ok(data.iepObjectives.some(g=>g.unitId===u.id&&g.goal&&g.criteria));
});

test('questions remain self-contained when sampled independently, and radius definitions do not confuse arc length',()=>{
 for(const p of data.practiceBank)assert.ok(!/承上題|接續上題/.test(p.question),p.id);
 const payment=data.practiceBank.find(p=>p.id==='p1_2_10');assert.ok(payment.question.includes('店家可以找零'));assert.ok(payment.hint.includes('60 元'));assert.equal(1000+3*100-1240,60);
 const radius=data.practiceBank.find(p=>p.id==='p9_1_3');assert.ok(radius.question.includes('線段'));assert.ok(!radius.hint.includes('圓周的一半'));
 const diameterStep=data.units.find(u=>u.id==='u9').scaffoldingSteps[2];assert.ok(diameterStep.instruction.includes('線段'));assert.ok(diameterStep.instruction.includes('兩端在圓周'));assert.ok(!diameterStep.instruction.includes('直線'));
 const volume=data.practiceBank.find(p=>p.id==='p7_1_7');assert.ok(volume.question.includes('1 公升'));assert.ok(volume.question.includes('10 大格'));assert.equal(volume.options[volume.answerIndex],'600 毫升');
});
