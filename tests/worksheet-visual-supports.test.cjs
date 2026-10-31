const test=require('node:test');
const assert=require('node:assert/strict');
const data=require('../js/data');
const figures=require('../js/worksheet-diagrams');
const support=require('../js/worksheet-visual-supports');
const specs=require('../js/worksheet-visual-data');
const problem=id=>data.practiceBank.find(p=>p.id===id);
const visibleText=svg=>[...svg.matchAll(/<text\b[^>]*>(.*?)<\/text>/g)].map(m=>m[1]).join(' ');
test('all 270 questions have a current visual review and every subsection has relevant figures',()=>{
  const audit=figures.audit(data.practiceBank);
  assert.equal(audit.length,270);assert.ok(audit.every(row=>row.reviewed));
  for(const unit of data.units)for(const section of unit.sections)assert.ok(data.practiceBank.filter(p=>p.sectionId===section.id).some(p=>figures.render(p)),section.id);
  for(const item of audit)assert.ok(item.reason);
});
test('all ten number-line questions include a number line with uniform numeric spacing',()=>{
  for(let i=1;i<=10;i++){
    const p=problem('p1_4_'+i),entry=specs[p.id];
    assert.equal(entry.kind,'numberLine');assert.ok(figures.render(p).includes('<svg'));
    const g=support.numberLineGeometry(entry.min,entry.max,entry.step);
    const step=(g.at(entry.max)-g.at(entry.min))/((entry.max-entry.min)/entry.step);
    for(let j=1;j<g.ticks.length;j++)assert.ok(Math.abs(g.ticks[j].x-g.ticks[j-1].x-step)<1e-8);
  }
  for(const [id,answer] of [['p1_4_4','500'],['p1_4_5','131'],['p1_4_6','124'],['p1_4_8','4863'],['p1_4_9','110'],['p1_4_10','200']]){
    assert.ok(!visibleText(figures.render(problem(id))).includes(answer),id);
  }
  assert.throws(()=>support.numberLineGeometry(0,100,0));
  assert.throws(()=>support.numberLineGeometry(0,10,3));
});
test('spatial and measurement subsections retain all ten figures and preserve given values',()=>{
  for(const section of ['s1_2','s1_4','s4_2','s4_3','s5_2','s5_3','s6_2','s7_2','s7_3','s8_2']){
    const questions=data.practiceBank.filter(p=>p.sectionId===section);assert.equal(questions.length,10);
    assert.ok(questions.every(p=>figures.render(p).includes('<svg')),section);
  }
  assert.equal(specs.p5_2_4.clock,3);assert.equal(specs.p5_2_5.clock,1);assert.equal(specs.p5_2_6.clock,5);
  for(let i=1;i<=10;i++){
    const svg=figures.render(problem('p5_2_'+i));
    for(const match of svg.matchAll(/[ML](-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g)){
      assert.ok(Number(match[1])>=0&&Number(match[1])<=300);
      assert.ok(Number(match[2])>=0&&Number(match[2])<=140);
    }
  }
  for(const p of data.practiceBank){
    const config=specs[p.id];
    if(config.kind==='fractionBars')for(const row of config.rows)assert.ok(row.selected+(row.other||0)<=row.denominator);
  }
});
test('changed quantities, changed options, and unknown new questions cannot silently reuse an approved diagram',()=>{
  for(const id of ['p1_4_4','p4_2_8','p5_2_4','p6_2_7','p8_2_5','p9_2_8']){
    const p=problem(id);assert.ok(figures.render(p));
    assert.equal(figures.render({...p,question:p.question+'（條件已變更）'}),'');
    assert.equal(figures.render({...p,options:['修改後的選項',...p.options.slice(1)]}),'');
  }
  assert.equal(support.audit([{id:'new-question',question:'新題目',options:[]}])[0].reviewed,false);
});
