const test=require('node:test'),assert=require('node:assert/strict');
const N=require('../islands/navigation.js'),P=require('../islands/pedestrians.js');
const random=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};

test('every island gains four varied pedestrians, with no changes to player navigation',()=>{
 const obstacles=N.coordinates.map(([x,z])=>({x,z,width:5.5,depth:3})),nav=N.create(obstacles);
 for(let seed=1;seed<=20;seed++){
  const crowd=P.create(nav,random(seed));assert.equal(crowd.walkers.length,36);
  for(let island=0;island<9;island++){
   const residents=crowd.walkers.filter(w=>w.island===island);assert.equal(residents.length,4);assert.equal(residents.filter(w=>w.kind==='traveler').length,2);
   assert.ok(new Set(residents.map(w=>w.color)).size>1);
   for(const w of residents){assert.ok(nav.walkable(w));assert.equal(nav.islandAt(w),`u${island+1}`);}
  }
  assert.ok(nav.walkable(nav.plazas[0]),'the crowds do not become player obstacles');
 }
});

test('wandering stays on its own island and avoids buildings and the unbridged river',()=>{
 const obstacles=N.coordinates.map(([x,z])=>({x,z,width:5.5,depth:3})),nav=N.create(obstacles),crowd=P.create(nav,random(234));
 const initial=crowd.walkers.map(w=>({x:w.x,z:w.z})),distance=initial.map(()=>0),resting=new Set(),walking=new Set();
 for(let frame=0;frame<3600;frame++){
  const before=crowd.walkers.map(w=>({x:w.x,z:w.z}));crowd.step(1/30);
  crowd.walkers.forEach((w,i)=>{
   assert.ok(nav.walkable(w));assert.equal(nav.islandAt(w),`u${w.island+1}`);assert.ok(nav.clear(before[i],w));
   distance[i]+=Math.hypot(w.x-before[i].x,w.z-before[i].z);
   (w.walking?walking:resting).add(i);
   if(w.island===3)assert.ok(Math.abs(w.x-N.coordinates[3][0])>=1.55);
  });
 }
 assert.equal(walking.size,36);assert.equal(resting.size,36);assert.ok(distance.every(d=>d>5));
});

test('zero elapsed time freezes the crowd, and pedestrians give the player space',()=>{
 const crowd=P.create(N.create(),random(42));const snapshot=structuredClone(crowd.walkers);crowd.step(0);assert.deepEqual(crowd.walkers,snapshot);
 const w=crowd.walkers[0];w.wait=0;w.target={x:w.x+.5,z:w.z};const before={x:w.x,z:w.z};
 crowd.step(1/30,{x:w.x+.3,z:w.z});assert.equal(w.x,before.x);assert.equal(w.z,before.z);assert.equal(w.walking,false);assert.equal(w.target,null);
});

test('all pedestrians render in eight shared batches with finite, animated transforms',()=>{
 const T=require('../islands/vendor/three.min.js'),scene=new T.Scene();
 const geometry={box:new T.BoxGeometry(),cylinder:new T.CylinderGeometry(),sphere:new T.IcosahedronGeometry(),cone:new T.ConeGeometry()};
 const crowd=P.mount(T,scene,N.create(),geometry),group=scene.getObjectByName('island-pedestrians');assert.equal(group.children.length,8);
 assert.deepEqual(group.children.map(b=>b.count),[36,36,36,36,36,72,72,72]);
 const bodies=group.children[0],before=Array.from(bodies.instanceMatrix.array);
 for(let frame=0;frame<180;frame++)crowd.step(1/30);
 assert.notDeepEqual(Array.from(bodies.instanceMatrix.array),before);
 for(const batch of group.children)assert.ok(batch.instanceMatrix.array.every(Number.isFinite));
 const frozen=Array.from(bodies.instanceMatrix.array);crowd.step(0);assert.deepEqual(Array.from(bodies.instanceMatrix.array),frozen);
});
