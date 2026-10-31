const test=require('node:test');
const assert=require('node:assert/strict');
const tools=require('../js/hands-on-tools.js');
const placeValues=[1000,100,10,1];

test('carry marks appear immediately after their source column and not before that step',()=>{
  const trace=tools.verticalTrace(1485,2378,'+');
  assert.deepEqual(trace[0].carries,[0,0,0,0]);
  assert.deepEqual(trace[1].carries,[0,0,1,0]);
  assert.deepEqual(trace[2].carries,[0,1,1,0]);
  assert.equal(trace[2].incoming,1);
  assert.equal(trace[2].combined,16);
  assert.equal(trace.slice(1).reduce((sum,s)=>sum+s.written*s.value,0),3863);
});
test('cross-zero borrowing preserves value and shows all affected places at the moment of exchange',()=>{
  const trace=tools.verticalTrace(3000,1465,'-');
  assert.deepEqual(trace[1].working,[2,9,9,10]);
  assert.deepEqual(trace[1].trades,[{from:1000,to:100},{from:100,to:10},{from:10,to:1}]);
  for(const step of trace)assert.equal(step.working.reduce((sum,n,i)=>sum+n*placeValues[i],0),3000);
  assert.equal(trace.slice(1).reduce((sum,s)=>sum+s.written*s.value,0),1535);
  const later=tools.verticalTrace(3380,1295,'-');
  assert.equal(later[1].working[1],3,'future borrowing must not leak into the first step');
  assert.equal(later[2].working[1],2);
});
test('column results reconstruct addition and subtraction across varied four-digit examples',()=>{
  const samples=[[9999,0],[4000,3999],[1010,999],[1000,1],[2050,1050],[8384,6389],[1200,1200],[4999,5000]];
  for(const [a,b] of samples)for(const op of ['+','-']){
    if(op==='-'&&a<b)continue;
    const trace=tools.verticalTrace(a,b,op);
    assert.equal(trace.slice(1).reduce((sum,s)=>sum+s.written*s.value,0),op==='+'?a+b:a-b);
    assert.ok(trace.slice(1).every(s=>s.written>=0));
  }
});
test('every intermediate distribution conserves apples and keeps plate counts at most one apart',()=>{
  for(let total=3;total<=30;total++)for(let baskets=2;baskets<=6;baskets++){
    const limit=Math.floor(total/baskets)*baskets;
    for(let given=0;given<=limit;given++){
      const s=tools.divisionState(total,baskets,given);
      assert.equal(s.counts.reduce((a,b)=>a+b,0)+s.left,total);
      assert.ok(Math.max(...s.counts)-Math.min(...s.counts)<=1);
      if(given<limit)assert.equal(s.counts[given%baskets],Math.min(...s.counts));
      else{assert.ok(s.remainder<baskets);assert.ok(s.counts.every(n=>n===s.quotient));}
    }
  }
  assert.throws(()=>tools.divisionState(14,3,13));
});
test('measuring objects and zero ticks use the same coordinates, including exact centimeters',()=>{
  for(const mm of [28,40,42,75,115]){
    const aligned=tools.rulerGeometry(mm,true),before=tools.rulerGeometry(mm,false);
    assert.equal(aligned.start,aligned.zero);
    assert.equal(aligned.end-aligned.zero,mm*4);
    assert.notEqual(before.start,before.zero);
    assert.equal(aligned.cm*10+aligned.rest,mm);
  }
});
test('water levels agree exactly with the labeled 0, 500, 1000 and 1500 mL ticks',()=>{
  assert.equal(tools.capacityY(0),280);
  assert.equal(tools.capacityY(500),200);
  assert.equal(tools.capacityY(1000),120);
  assert.equal(tools.capacityY(1500),40);
});
test('fraction slice geometry closes each equal sector without invalid coordinates',()=>{
  for(const d of [2,3,4,6,8])for(let i=0;i<d;i++){
    const path=tools.fractionPath(i,d);
    assert.ok(path.startsWith('M120 120 L'));
    assert.ok(path.endsWith('Z'));
    assert.ok(!/NaN|undefined|Infinity/.test(path));
  }
});
