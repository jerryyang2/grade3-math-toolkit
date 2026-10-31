const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const data = require('../js/data.js');
const figures = require('../js/worksheet-diagrams.js');
const layout = require('../js/worksheet-layout.js');
const payloadOf=html=>JSON.parse(html.match(/<script id="worksheet-payload"[^>]*>([\s\S]*?)<\/script>/)[1]);
function fixture() {
  let html='',opens=0,blocked=false;
  const alerts=[];
  const context={window:{NANI_G3S1_DATA:data,WorksheetDiagrams:figures,location:{href:'https://example.invalid/math/index.html'},addEventListener(){},LearningRecords:{escapeHtml:value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c])},open(){opens++;return blocked?null:{document:{write(value){html=value;},close(){}}};}},URL,alert:message=>alerts.push(message)};
  vm.runInNewContext(fs.readFileSync(require.resolve('../js/contest-features.js'),'utf8'),context);
  return {generator:context.window.WorksheetGenerator,html:()=>html,opens:()=>opens,alerts,block:()=>{blocked=true;}};
}

test('27 subsection worksheets contain exactly their own ten questions, in curriculum order',()=>{
  const {generator}=fixture();
  let sheets=0;
  for(const unit of data.units) for(const section of unit.sections) {
    const sheet=generator.getWorksheet(unit.id,section.id);
    assert.equal(sheet.unit.id,unit.id);
    assert.equal(sheet.section.id,section.id);
    assert.deepEqual(Array.from(sheet.problems,p=>p.id),data.practiceBank.filter(p=>p.unitId===unit.id&&p.sectionId===section.id).map(p=>p.id));
    assert.equal(sheet.problems.length,10,section.id);
    sheets++;
  }
  assert.equal(sheets,27);
});

test('nine review sheets balance every subsection and include different difficulty levels',()=>{
  const {generator}=fixture();
  for(const unit of data.units) {
    const {problems,section}=generator.getWorksheet(unit.id);
    assert.equal(section,null);
    assert.equal(problems.length,10);
    assert.equal(new Set(problems.map(p=>p.id)).size,10);
    const counts=unit.sections.map(s=>problems.filter(p=>p.sectionId===s.id).length);
    assert.ok(Math.min(...counts)>0,unit.id);
    assert.ok(Math.max(...counts)-Math.min(...counts)<=1,unit.id);
    assert.equal(new Set(problems.map(p=>p.level)).size,3,unit.id);
    assert.ok(problems.every(p=>p.unitId===unit.id&&!/^(接續上題|承上題)/.test(p.question)),unit.id);
  }
});

test('all 36 print views preserve their scope, ten questions, calculation space and favicon',()=>{
  const f=fixture();
  for(const unit of data.units) for(const section of [null,...unit.sections]) {
    const result=f.generator.generateAndPrint(unit.id,'空白',true,true,'',true,true,section?.id||'');
    assert.equal(result,true);
    const html=f.html();
    const payload=payloadOf(html),plan=layout.plan(payload.sheet,payload.settings);
    const ids=plan.pages.flatMap(page=>page.questions.map(q=>q.id));
    assert.equal(ids.length,10);
    assert.equal(plan.pages.length,2);
    assert.ok(plan.pages.every(page=>page.questions.every(q=>q.bottom>=layout.constants.H-layout.constants.BOTTOM)));
    assert.equal(plan.pages.flatMap(page=>page.ops.filter(op=>op.type==='group')).length,10);
    assert.ok(html.includes('rel="icon"'));
    assert.ok(html.includes('四邊各 1 公分'));
    assert.ok(html.includes(section?.title||'單元總複習'));
    if(section) assert.ok(ids.every(id=>data.practiceBank.find(p=>p.id===id).sectionId===section.id));
    else assert.equal(payload.sheet.review,true);
  }
  assert.equal(f.opens(),36);
});

test('invalid or cross-unit subsection choices never open a wrong or incomplete worksheet',()=>{
  const f=fixture();
  for(const [unit,section] of [['unknown',''],['u1','s9_2'],['u9','s9_3']]) {
    assert.equal(f.generator.getWorksheet(unit,section),null);
    assert.equal(f.generator.generateAndPrint(unit,'空白',true,false,'',false,true,section),false);
  }
  assert.equal(f.opens(),0);
  assert.equal(f.alerts.length,3);
});

test('personal fields are escaped and blocked popups report failure without producing a sheet',()=>{
  const f=fixture();
  f.generator.generateAndPrint('u9','<img src=x>',false,false,'<script>date</script>',false,false,'s9_2');
  assert.ok(!f.html().includes('<img src=x>'));
  assert.equal(payloadOf(f.html()).settings.studentName,'<img src=x>');
  assert.ok(!f.html().includes('<script>date</script>'));
  assert.equal(payloadOf(f.html()).settings.date,'<script>date</script>');
  assert.ok(!f.html().includes('data-ws-figure='));
  assert.equal(payloadOf(f.html()).settings.withGrid,false);
  f.block();
  assert.equal(f.generator.generateAndPrint('u1','空白',true,false),false);
  assert.equal(f.alerts.length,1);
});
