const test=require('node:test');
const assert=require('node:assert/strict');
const C=require('../islands/curriculum.js');
const data=require('../js/data.js');
function correctState(t){return {coins:[Math.floor(t.target/1000),Math.floor(t.target/100)%10,Math.floor(t.target/10)%10,t.target%10],answer:String(t.target),groups:t.groups,value:t.target,choice:t.target,baskets:Array(t.groups||0).fill(t.target),slices:Array.from({length:t.d||0},(_,i)=>i<t.target)};}
test('nine islands align with the existing curriculum and provide 27 playable missions',()=>{
 assert.deepEqual(C.islands.map(i=>i.id),data.units.map(u=>u.id));
 for(const i of C.islands){assert.equal(i.missions.length,3);for(let m=0;m<3;m++){const t=C.task(i.id,m);assert.ok(C.evaluate(t,correctState(t)),`${i.id}/${m}`);assert.ok(C.solution(t));}}
 assert.throws(()=>C.task('u0'));assert.throws(()=>C.task('u1',3));
});
test('generated missions remain solvable and conserve quantities across 2700 cases',()=>{
 let seed=123456;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
 for(const i of C.islands)for(let m=0;m<3;m++)for(let j=0;j<100;j++){
  const t=C.task(i.id,m,random),s=correctState(t);assert.ok(C.evaluate(t,s),`${i.id}/${m}/${j}`);
  if(t.kind==='coins')assert.ok(s.coins.every(n=>n>=0&&n<=10));
  if(t.kind==='calculate')assert.ok(t.a>=1000&&t.target>=0&&t.target<=10000);
  if(t.kind==='array')assert.equal(t.per*t.groups,t.target);
  if(t.kind==='divide'){assert.equal(t.target*t.groups+t.remainder,t.total);assert.ok(t.remainder<t.groups);}
  if(t.kind==='pour')assert.ok(t.target<=3000&&t.target%50===0);
  if(t.kind==='fraction')assert.ok(t.target>0&&t.target<t.d);
  if(t.kind==='compass')assert.ok(t.target>=1&&t.target<=7);
 }
});
test('incomplete, unequal and off-by-one responses cannot earn a mission stamp',()=>{
 for(const i of C.islands)for(let m=0;m<3;m++){
  const t=C.task(i.id,m),s=correctState(t);
  switch(t.kind){case 'coins':s.coins[3]++;break;case 'calculate':s.answer='';break;case 'array':s.groups--;break;case 'ruler':case 'pour':case 'compass':s.value++;break;case 'shape':s.choice='';break;case 'divide':s.baskets[0]--;break;case 'fraction':s.slices[0]=false;break;}
  assert.equal(C.evaluate(t,s),false,`${i.id}/${m}`);
 }
 const t=C.task('u6',1);assert.equal(C.evaluate(t,{baskets:[5,5,5,4]}),false,'using all the snacks is not equal sharing');
});
test('zero placeholding, borrowing across zero, millimeters and fraction complements are correct',()=>{
 assert.equal(C.task('u1',1).target,3050);assert.equal(C.task('u1',2).target,10000);
 assert.equal(C.task('u2',1).target,1535);assert.equal(C.task('u2',2).target,1914);
 assert.equal(C.task('u4',1).target,43);assert.equal(C.task('u7',1).target,1250);
 const f=C.task('u8',1);assert.equal(f.d-f.target,2);
 const circle=C.task('u9',1);assert.equal(circle.target,4);assert.match(circle.prompt,/8 公分/);
});
test('passport parsing excludes unknown units, malformed records and arbitrary properties',()=>{
 assert.deepEqual(C.readProgress('broken'),{});assert.deepEqual(C.readProgress('null'),{});
 assert.deepEqual(C.readProgress(JSON.stringify({u1:{0:{result:'independent',attempts:1,privateName:'unused'},1:{result:'forged',attempts:2},2:{result:'supported',attempts:-1}},unknown:{0:{result:'independent',attempts:1}}})),{u1:{0:{result:'independent',attempts:1}}});
});
test('an unavailable WebGL engine falls back to all nine accessible island selectors',()=>{
 const vm=require('node:vm'),fs=require('node:fs');
 const nodes={};const get=id=>nodes[id]??={classList:{add(v){this.value=v;}},setAttribute(k,v){this[k]=v;},textContent:'',disabled:false};
 const labels=Array.from({length:9},()=>({hidden:true}));const context={window:{},document:{getElementById:get,querySelectorAll:()=>labels},matchMedia:()=>({matches:false})};
 vm.createContext(context);vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../islands/world.js'),'utf8'),context);
 const world=context.window.createMathWorld(()=>{});world.select('u1');world.complete('u1',0);world.overview();
 assert.equal(nodes.world.classList.value,'flat');assert.ok(labels.every(l=>!l.hidden));assert.equal(nodes['map-mode'].disabled,true);assert.match(nodes['world-status'].textContent,/所有數學任務皆可使用/);
});
