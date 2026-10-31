const test=require('node:test'),assert=require('node:assert/strict');
const N=require('../islands/navigation.js'),M=require('../islands/marine-animals.js');
const random=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
test('nine marine animals include dolphins, whales and sharks with varied safe starting positions',()=>{
 const nav=N.create();for(let seed=0;seed<30;seed++){
  const sea=M.create(nav,random(seed));assert.equal(sea.animals.length,9);
  for(const [kind,count]of [['dolphin',4],['whale',2],['shark',3]])assert.equal(sea.animals.filter(a=>a.kind===kind).length,count);
  for(const a of sea.animals){assert.ok(sea.water(a,a.radius));assert.equal(nav.walkable(a),false);}
 }
 assert.notDeepEqual(M.create(nav,random(1)).animals,M.create(nav,random(2)).animals);
});
test('random swimming keeps the full animal away from island shores, bridges and the landing dock',()=>{
 const nav=N.create(),sea=M.create(nav,random(2026)),distance=sea.animals.map(()=>0),surfaces=new Set(),dives=new Set();
 for(let frame=0;frame<6000;frame++){
  const before=sea.animals.map(a=>({x:a.x,z:a.z}));sea.step(1/30);
  sea.animals.forEach((a,i)=>{
   assert.ok(sea.water(a,a.radius));assert.ok(sea.clear(before[i],a,a.radius));assert.equal(nav.walkable(a),false);
   distance[i]+=Math.hypot(a.x-before[i].x,a.z-before[i].z);const pose=sea.pose(a);
   assert.ok(Object.values(pose).every(v=>typeof v==='boolean'||Number.isFinite(v)));
   if(pose.y> -1.4)surfaces.add(a.kind);if(pose.y< -1.7)dives.add(a.kind);
  });
 }
 assert.ok(distance.every(d=>d>8));assert.ok(surfaces.has('dolphin')&&surfaces.has('whale'));assert.equal(dives.size,3);
});
test('pause freezes swimming and whales have a surface breathing cycle',()=>{
 const sea=M.create(N.create(),random(42)),before=structuredClone(sea.animals);sea.step(0);assert.deepEqual(sea.animals,before);
 const whale=sea.animals.find(a=>a.kind==='whale');whale.age=(Math.PI/2-whale.phase+2*Math.PI)/.26;assert.equal(sea.pose(whale).spout,true);
});
test('3D species have distinct tail motions and all animated transforms stay finite',()=>{
 const T=require('../islands/vendor/three.min.js'),scene=new T.Scene(),sea=M.mount(T,scene,N.create());
 const animals=scene.getObjectByName('marine-animals').children.filter(o=>['dolphin','whale','shark'].includes(o.name));assert.equal(animals.length,9);
 const before=animals.map(o=>o.position.clone());for(let frame=0;frame<90;frame++)sea.step(1/30);
 assert.ok(animals.every((o,i)=>o.position.distanceTo(before[i])>0));
 scene.traverse(o=>{o.updateMatrix();assert.ok(o.matrix.elements.every(Number.isFinite));});
 const frozen=animals.map(o=>o.position.toArray());sea.step(0);assert.deepEqual(animals.map(o=>o.position.toArray()),frozen);
});
