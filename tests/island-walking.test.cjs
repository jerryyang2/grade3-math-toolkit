const test=require('node:test'),assert=require('node:assert/strict');
const N=require('../islands/navigation.js'),V=require('../islands/visitors.js');
const memory=(initial={})=>{const items={...initial};return {getItem:k=>items[k]??null,setItem:(k,v)=>{items[k]=v;}};};
test('twelve inter-island bridges and the new landing bridge share continuous walkable decks',()=>{
 const n=N.create(),reached=new Set([0]);for(let i=0;i<9;i++)for(const [a,b]of N.links){if(reached.has(a))reached.add(b);if(reached.has(b))reached.add(a);}assert.equal(reached.size,9);assert.equal(N.links.length,12);assert.equal(n.bridges.length,13);
 for(const b of n.bridges)for(let i=0;i<=50;i++)assert.ok(n.walkable({x:b.a.x+(b.b.x-b.a.x)*i/50,z:b.a.z+(b.b.z-b.a.z)*i/50}),b.id);
});
test('walking routes reach every island through continuous land and bridges without crossing the sea',()=>{
 const n=N.create();for(let i=1;i<9;i++){const route=n.route(n.plazas[0],n.plazas[i]);assert.ok(route.length,`u1 to u${i+1}`);let p=n.plazas[0];for(const q of route){assert.ok(n.clear(p,q));p=q;}assert.deepEqual(p,n.plazas[i]);}
 assert.equal(n.walkable({x:38,z:38}),false);assert.deepEqual(n.route(n.plazas[0],{x:38,z:38}),[]);
});
test('collision steps cannot tunnel through buildings and preserve the walking boundary',()=>{
 const n=N.create([{x:-23,z:-21,width:3,depth:3}]);assert.equal(n.walkable({x:-23,z:-21}),false);
 const p={x:-23,z:-17.4},q=n.move(p,0,-12);assert.ok(n.walkable(q));assert.ok(q.z>-19.22);
 const r=n.route(p,{x:-23,z:-24.5});assert.ok(r.length);let prev=p;for(const next of r){assert.ok(n.clear(prev,next));prev=next;}
});
test('visitor progress and saved positions remain isolated after switching and reloading',()=>{
 const storage=memory(),s=V.create(storage),first=s.active().id;
 s.rename('探險甲');s.record({u1:{0:{result:'independent',attempts:1}}});s.locate({x:-19,z:-17.4},'u1');
 const second=s.add('探險乙',V.colors[1]).id;assert.deepEqual(s.active().progress,{});assert.equal(s.active().position,null);
 s.record({u2:{1:{result:'supported',attempts:2}}});s.switchTo(first);assert.ok(s.active().progress.u1);assert.equal(s.active().progress.u2,undefined);assert.equal(s.active().position.x,-19);
 const restored=V.create(storage);assert.equal(restored.active().name,'探險甲');restored.switchTo(second);assert.equal(restored.active().name,'探險乙');assert.ok(restored.active().progress.u2);assert.equal(restored.active().progress.u1,undefined);
});
test('legacy anonymous progress migrates once to the first visitor without giving it to new visitors',()=>{
 const storage=memory({'slow-math-islands-v1':JSON.stringify({u3:{2:{result:'supported',attempts:3}}})}),s=V.create(storage);assert.ok(s.active().progress.u3);s.add('新旅人');assert.deepEqual(s.active().progress,{});assert.equal(V.create(storage).list().length,2);
});
test('visitor validation handles blank, duplicate, long and malformed data without HTML interpretation',()=>{
 const s=V.create(memory());assert.throws(()=>s.add('   '));s.add('測試旅人');assert.throws(()=>s.add('測試旅人'));assert.throws(()=>s.rename('甲'.repeat(17)));
 const literal='<b>旅人</b>';s.rename(literal);assert.equal(s.active().name,literal);
 const restored=V.create(memory({[V.key]:JSON.stringify({version:2,activeId:'x',visitors:[{id:'x',name:'旅人',color:'bad',progress:{u9:{9:{result:'independent',attempts:1}}},position:{x:Infinity,z:0}}]})}));assert.equal(restored.active().position,null);assert.equal(restored.active().progress.u9?.[9],undefined);
});
test('unavailable browser storage still permits visitor creation and separate in-memory passports',()=>{
 const s=V.create({getItem(){throw Error();},setItem(){throw Error();}}),first=s.active().id;s.add('暫存旅人');s.record({u1:{0:{result:'supported',attempts:2}}});assert.equal(s.saved(),false);s.switchTo(first);assert.deepEqual(s.active().progress,{});
});
test('long manual walks stay on land or bridge decks, including repeated edge collisions',()=>{
 const n=N.create();let seed=42;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
 for(const plaza of n.plazas){let p={...plaza};for(let i=0;i<600;i++){const angle=rnd()*2*Math.PI,dx=Math.cos(angle)*1.7,dz=Math.sin(angle)*1.7,q=n.move(p,dx,dz);assert.ok(n.walkable(q));assert.ok(Math.hypot(q.x-p.x,q.z-p.z)<=1.700001);p=q;}}
});

test('the separate arrival dock reaches every teaching island without crossing open water',()=>{
 const n=N.create(),start={...N.landing.position};assert.equal(n.islandAt(start),null);assert.ok(n.atLanding(start));assert.ok(n.walkable(start));assert.ok(n.surface(start).landing);
 for(const destination of n.plazas){const route=n.route(start,destination);assert.ok(route.length);let position={...start},steps=0;for(const waypoint of route){assert.ok(n.clear(position,waypoint));while(Math.hypot(waypoint.x-position.x,waypoint.z-position.z)>.035){const dx=waypoint.x-position.x,dz=waypoint.z-position.z,distance=Math.hypot(dx,dz),step=Math.min(distance,3.6/30);position=n.move(position,dx/distance*step,dz/distance*step);assert.ok(n.walkable(position));assert.ok(++steps<5000,'walking must finish rather than stop at a bridge corner');}}assert.ok(Math.hypot(position.x-destination.x,position.z-destination.z)<.04);const back=n.route(position,start);assert.ok(back.length);let previous=position;for(const p of back){assert.ok(n.clear(previous,p));previous=p;}}
 assert.equal(n.walkable({x:start.x-4,z:start.z}),false);assert.equal(n.walkable({x:start.x,z:start.z+4}),false);
});
