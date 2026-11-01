const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {parseHTML}=require('linkedom');
const data=require('../js/data.js'),curriculum=require('../islands/curriculum.js'),plans=require('../js/lesson-plans.js');
const steps=[['units','課堂教學','00–16 分',16],['practice','隨堂練習','16–24 分',8],['battle','分組搶答','24–30 分',6],['arcade','互動遊戲','30–35 分',5],['islands','對應數學島','35–40 分',5]];
test('nine units have complete five-stage plans with shared practice and island answers',()=>{
 for(const unit of data.units){
  const result=plans.build(unit,data,curriculum,steps);
  assert.deepEqual(result.map(p=>p.id),steps.map(s=>s[0]));
  assert.equal(result.reduce((sum,p)=>sum+p.minutes,0),40);
  for(const p of result){
   for(const key of ['focus','materials','student','question','expected','support','observe','assessment','pacing'])assert.ok(p[key]?.length>0,unit.id+' '+p.id+' '+key);
   assert.equal(p.teacher.length,3);
   assert.ok(p.teacher.every(s=>typeof s==='string'&&s.length>10));
  }
  const practice=result.find(p=>p.id==='practice'),q=data.practiceBank.find(q=>q.id===practice.practiceId);
  assert.equal(q.unitId,unit.id);assert.equal(practice.student,q.question);assert.equal(practice.expected,q.options[q.answerIndex]);
  const island=result.find(p=>p.id==='islands'),mission=curriculum.task(unit.id,island.mission);
  assert.equal(island.student,mission.prompt);assert.equal(island.expected,curriculum.solution(mission));
  assert.equal(result[0].prerequisite,unit.prerequisite.diagnosticCheck);
 }
 assert.throws(()=>plans.build({id:'u0'},data,curriculum,steps),RangeError);
});
test('plans distinguish speed and game progress from individual mathematical understanding',()=>{
 for(const u of data.units){
  const p=plans.build(u,data,curriculum,steps);
  assert.match(p[1].assessment,/首次作答/);assert.match(p[2].assessment,/不當作個人概念達成/);
  assert.match(p[4].assessment,/實際表現/);assert.match(p[4].teacher[2],/不要求五分鐘完成整座島/);
 }
 for(const id of ['u5','u8','u9'])assert.match(plans.build(data.units.find(u=>u.id===id),data,curriculum,steps)[3].teacher[0],/目前遊戲館沒有專門/);
 assert.match(plans.build(data.units[0],data,curriculum,steps)[0].activity,/照圖放一放.*十個換一個.*自由操作/);
});
function guide(){
 const {window,document,HTMLElement}=parseHTML('<html><body><nav id="prep-lesson-plan-steps"></nav><input id="student-answer" value="unfinished"></body></html>');
 HTMLElement.prototype.showModal=function(){this.open=true;this.setAttribute('open','');};
 HTMLElement.prototype.close=function(){this.open=false;this.removeAttribute('open');};
 Object.assign(window,{MathLessonPlans:plans,MathIslands:curriculum,NANI_G3S1_DATA:data,MathLessonFlow:{steps}});
 let prints=0;
 window.print=()=>{
  prints++;assert.ok(document.body.classList.contains('printing-lesson-guide'));
  assert.equal(document.querySelectorAll('.guide-answer').length,5);
  assert.ok([...document.querySelectorAll('.guide-answer')].every(d=>d.open));
 };
 const context={window,document,navigator:{},console};vm.createContext(context);
 vm.runInContext(fs.readFileSync(require.resolve('../js/forest-home.js'),'utf8'),context);
 return {window,document,prints:()=>prints};
}
test('opening and browsing plans keeps the teaching unit and unfinished student response',()=>{
 const h=guide();h.window.ForestHome.render(data.units[7]);h.window.ForestHome.openGuide('islands');
 assert.match(h.document.querySelector('#lesson-guide-title').textContent,/分數/);
 assert.equal(h.document.querySelector('.guide-stage-plan:not([hidden])').id,'guide-plan-islands');
 h.document.querySelector('[data-guide-stage="practice"]').click();
 assert.equal(h.document.querySelector('.guide-stage-plan:not([hidden])').id,'guide-plan-practice');
 assert.equal(h.document.querySelectorAll('[data-guide-stage][aria-pressed="true"]').length,1);
 assert.equal(h.document.querySelector('#student-answer').value,'unfinished');
 h.window.ForestHome.render(data.units[8]);h.window.ForestHome.openGuide('units');
 assert.match(h.document.querySelector('#lesson-guide-title').textContent,/圓/);
 assert.equal(h.document.querySelectorAll('#lesson-guide-dialog').length,1);
 assert.match(h.document.querySelector('#guide-plan-units').textContent,/圓心/);
});
test('preparation entries follow the selected unit and open the chosen step without changing student work',()=>{
 const h=guide();
 for(const unit of [data.units[0],data.units[7]]){
  h.window.ForestHome.render(unit);
  const buttons=[...h.document.querySelectorAll('[data-prep-plan]')];
  assert.deepEqual(buttons.map(b=>b.dataset.prepPlan),steps.map(s=>s[0]));
  buttons.at(-1).click();
  assert.match(h.document.querySelector('#lesson-guide-title').textContent,new RegExp(unit.title));
  assert.equal(h.document.querySelector('.guide-stage-plan:not([hidden])').id,'guide-plan-islands');
  assert.equal(h.document.querySelector('#student-answer').value,'unfinished');
 }
});
test('printing includes reference answers from all five steps and restores the reading state',()=>{
 const h=guide();h.window.ForestHome.render(data.units[2]);h.window.ForestHome.openGuide('battle');
 h.document.querySelector('[data-guide-print]').click();assert.equal(h.prints(),1);
 assert.ok(!h.document.body.classList.contains('printing-lesson-guide'));
 assert.ok([...h.document.querySelectorAll('.guide-answer')].every(d=>!d.open));
 assert.equal(h.document.querySelector('.guide-stage-plan:not([hidden])').id,'guide-plan-battle');
});
