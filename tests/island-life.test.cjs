const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const C=require('../islands/curriculum.js'),T=require('../islands/teaching.js'),R=require('../islands/rewards.js'),N=require('../islands/narration.js'),Sea=require('../islands/sea-life.js'),Main=require('../js/data.js'),Audio=require('../js/audio.js');
const root=path.resolve(__dirname,'..'),context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'islands/audio-manifest.js'),'utf8'),context);const clips=context.window.MathIslandAudioClips;
const complete=()=>Object.fromEntries(C.islands.map(i=>[i.id,Object.fromEntries([0,1,2].map(m=>[m,{result:'supported',attempts:2}]))]));
test('island methods use the canonical classroom sequence, with task-specific carry and borrowing details',()=>{
 for(const i of C.islands){assert.deepEqual(T.method(i.id).sourceSteps,Main.units.find(u=>u.id===i.id).scaffoldingSteps.map(s=>s.title));for(let m=0;m<3;m++){const steps=T.steps(C.task(i.id,m));assert.ok(steps.length>=3);assert.ok(steps.every(s=>s.title&&s.text));}}
 assert.match(T.steps(C.task('u1'))[0].title,/個位/);assert.match(T.steps(C.task('u2',1))[1].text,/1000.*100.*100.*10.*10.*1/);assert.equal(T.steps(C.task('u2',1))[1].formula,'10 − 5 ＝ 5');
 assert.match(T.steps(C.task('u3'))[1].title,/個位/);assert.match(T.steps(C.task('u6')).map(s=>s.title).join(''),/商.*乘.*減.*比/);assert.match(T.steps(C.task('u8'))[0].title,/分母/);assert.match(T.steps(C.task('u9'))[0].title,/圓心/);
});
test('certificates and cruise require all three valid missions on each of the nine islands',()=>{
 const p=complete();delete p.u9[2];assert.equal(R.earned(p).units.length,8);assert.equal(R.earned(p).grand,false);assert.equal(R.earned(p).cruise,false);assert.equal(R.certificate(p,'grand','旅人','2026年10月31日'),null);assert.equal(R.certificate(p,'u9','旅人','date'),null);assert.ok(R.certificate(p,'u1','旅人','date'));
 p.u9[2]={result:'supported',attempts:1};assert.deepEqual(R.earned(p),{units:C.islands.map(i=>i.id),grand:true,cruise:true});assert.equal(R.earned({}).cruise,false);assert.equal(R.earned({u1:{0:{result:'fake',attempts:1},1:{result:'independent',attempts:1},2:{result:'supported',attempts:1}}}).units.length,0);
});
test('certificate exports escape visitor input, include the earned unit, and do not claim formal mastery',()=>{
 const c=R.certificate(complete(),'u8','<script>旅人</script>','2026年10月31日'),svg=R.svg(c);assert.match(svg,/分數披薩島/);assert.match(svg,/&lt;script&gt;/);assert.doesNotMatch(svg,/<script>/);assert.match(svg,/不代表正式學力認證/);assert.match(R.svg(R.certificate(complete(),'grand','旅人','date')),/環遊世界號/);
});
test('every fixed task, strategy, resident line and reward cue has complete female narration',()=>{
 const verify=text=>{for(const part of N.parts(text))assert.ok(clips[part],part);};
 for(const i of C.islands){verify(T.method(i.id).route);for(let m=0;m<3;m++){const t=C.task(i.id,m);assert.ok(clips[N.whole(t.prompt)],'fixed questions have continuous narration');[t.prompt,t.hint,C.solution(t)].forEach(verify);T.steps(t).forEach(s=>verify([s.title,s.text,s.formula]));}}
 T.residents.forEach(r=>verify([r.name,r.line]));Object.values(T.narration).forEach(verify);
 let seed=98765;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};for(let j=0;j<100;j++)for(const i of C.islands)for(let m=0;m<3;m++){const t=C.task(i.id,m,random);[t.prompt,t.hint,C.solution(t)].forEach(verify);T.steps(t).forEach(s=>verify([s.title,s.text,s.formula]));}
});
test('number narration reconstructs classroom pronunciation including zeros, fractions and subtraction',()=>{
 const a=new Audio();for(let n=0;n<=10000;n++)assert.equal(N.numberParts(n).join(''),a.numToChinese(n),String(n));assert.equal(N.parts('3/4').join(''),'四分之三');assert.equal(N.parts('3000 − 1465').join(''),'三千減去一千四百六十五');
});
test('all island audio assets are complete mono MP3 frames without private metadata',()=>{
 assert.ok(Object.keys(clips).length>200);for(const relative of Object.values(clips)){assert.match(relative,/^audio\/islands\/[a-f0-9]{24}\.mp3$/);const bytes=fs.readFileSync(path.join(root,relative));let offset=0,frames=0;while(offset<bytes.length){const h=bytes.readUInt32BE(offset);assert.equal((h>>>21)&0x7ff,0x7ff,relative);assert.equal((h>>>19)&3,2);assert.equal((h>>>17)&3,1);assert.equal((h>>>12)&15,6);assert.equal((h>>>10)&3,1);assert.equal((h>>>6)&3,3);offset+=144+((h>>>9)&1);frames++;}assert.equal(offset,bytes.length);assert.ok(frames>6);}
});
test('boats change positions and headings while staying outside every island and bridge',()=>{
 const Nav=require('../islands/navigation.js').create();for(const route of [...Sea.fleet,Sea.cruise]){const a=Sea.sample(route,0),b=Sea.sample(route,25);assert.ok(Math.hypot(a.x-b.x,a.z-b.z)>1);for(let s=0;s<300;s++){const p=Sea.sample(route,s*2);assert.equal(Nav.walkable(p),false);assert.equal(Nav.islandAt(p),null);assert.ok(Number.isFinite(p.heading));}}
});
test('residents greet only nearby visitors and each unit has its own resident',()=>{
 assert.deepEqual(T.residents.map(r=>r.unitId),C.islands.map(i=>i.id));const residents=[{id:'pizza',x:4,z:3},{id:'captain',x:10,z:2}];assert.equal(Sea.nearResident({x:4,z:4},residents).id,'pizza');assert.equal(Sea.nearResident({x:0,z:0},residents),null);
});
test('the top menu links to the island game without becoming an undefined application tab',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),nav=html.slice(html.indexOf('<nav class="main-nav"'),html.indexOf('</nav>',html.indexOf('<nav class="main-nav"')));assert.match(nav,/<a class="nav-island-link" href="islands\/index.html#u1" data-math-islands-link>/);assert.doesNotMatch(nav,/class="nav-tab[^\"]*"[^>]*href="islands/);
});
