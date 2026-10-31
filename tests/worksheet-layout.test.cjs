const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const data=require('../js/data.js');
const diagrams=require('../js/worksheet-diagrams.js');
const supports=require('../js/worksheet-visual-supports.js');
const specs=require('../js/worksheet-visual-data.js');
const layout=require('../js/worksheet-layout.js');
const {create}=require('../js/i18n.js');
const context={window:{NANI_G3S1_DATA:data,addEventListener(){}}};
vm.runInNewContext(fs.readFileSync('js/contest-features.js','utf8'),context);
function sheet(unit,section){
 const {problems}=context.window.WorksheetGenerator.getWorksheet(unit.id,section?.id||'');
 return {id:section?.id||unit.id+'_review',unitNumber:unit.number,unitTitle:unit.title,title:section?.title||'單元總複習',review:!section,
 problems:Array.from(problems,p=>({...p,svg:diagrams.render(p).match(/<svg[\s\S]*?<\/svg>/)?.[0]||''}))};
}
test('all 36 worksheets in both languages keep ten complete questions within two A4 pages',()=>{
 const i18n=create(require('../js/i18n-en.js'));
 for(const language of ['zh-Hant','en']){
  i18n.setLanguage(language);
  for(const unit of data.units)for(const section of [...unit.sections,null]){
   const s=sheet(unit,section),translated={...s,problems:s.problems.map(p=>({...p,question:i18n.t(p.question),options:p.options.map(o=>i18n.t(o))}))};
   for(const options of [{},{withGrid:false},{withIllustrations:false,withStamp:false}]){
    const plan=layout.plan(translated,{...options,language,t:x=>i18n.t(x)});
    assert.equal(plan.pages.length,2,language+' '+s.id);
    assert.deepEqual(plan.pages.flatMap(p=>p.questions.map(q=>q.id)),s.problems.map(p=>p.id));
    for(const page of plan.pages)for(const q of page.questions)assert.ok(q.bottom>=layout.constants.H-layout.constants.BOTTOM-.01,s.id);
    const text=plan.pages.flatMap(p=>p.ops.filter(op=>op.type==='group').flatMap(g=>g.ops.filter(o=>o.type==='text').map(o=>o.text))).join('');
    for(const p of translated.problems){assert.ok(text.replace(/\s/g,'').includes(p.question.replace(/[\s➔]/g,c=>c==='➔'?'→':'')),p.id);for(const o of p.options)assert.ok(text.replace(/\s/g,'').includes(o.replace(/\s/g,'')),p.id+' option');}
   }
  }
 }
});
test('capacity comparisons use identical graduated containers and preserve exact tick / water geometry',()=>{
 for(const p of data.practiceBank.filter(p=>p.sectionId==='s7_2')){
  assert.equal(specs[p.id].kind,'capacityMeasures');assert.match(diagrams.render(p),/data-capacity-measures/);
 }
 for(const max of [1000,2000,4000,6000])for(const value of [0,5,20,500,max]){
  const g=supports.capacityScale(max,value,max/500);
  assert.equal(g.water,g.at(value));
  for(let i=1;i<g.ticks.length;i++)assert.ok(Math.abs((g.ticks[i-1].y-g.ticks[i].y)-96/(max/500))<1e-8);
 }
 const p=data.practiceBank.find(p=>p.id==='p7_2_6');
 assert.deepEqual(specs[p.id].items.map(i=>i.value),[3020,3200]);
 assert.doesNotMatch(diagrams.render(p),/各圖形使用同一比例/);
 assert.throws(()=>supports.capacityScale(1000,1001));
});
test('place value, chronological changes, and circular fractions use matching representations',()=>{
 for(const id of ['p1_2_4','p1_2_8'])assert.equal(specs[id].kind,'baseTen');
 assert.equal(specs.p2_3_8.kind,'sequence');assert.equal(specs.p8_2_3.kind,'fractionCircle');
 assert.equal(specs.p5_3_7.ratio[0]/specs.p5_3_7.ratio[1],8/3);
 assert.ok(diagrams.audit(data.practiceBank).every(p=>p.reviewed));
});

test('English figures use math vocabulary and repeated unit fractions cannot look like mixed numbers',()=>{
 const i18n=create(require('../js/i18n-en.js'));i18n.setLanguage('en');
 for(const p of data.practiceBank)for(const label of diagrams.render(p).matchAll(/<text[^>]*>([^<]*)<\/text>/g))assert.doesNotMatch(i18n.t(label[1]),/[\u3400-\u9fff]/u,p.id);
 assert.equal(i18n.t('商：？'),'Quotient: ?');assert.equal(i18n.t('商'),'Quotient');assert.equal(i18n.t('3個1/5'),'3 × 1/5');
 const lines=layout.wrap('水桶裡有6公升的水，倒出600毫升後，還有多少？',80,14);
 assert.ok(lines.every(line=>!/[（「【『(]$/.test(line)&&!(/^[，。？！）』」】]/.test(line))));
});
