const test=require('node:test'),assert=require('node:assert/strict');
const T=require('../islands/vendor/three.min.js'),M=require('../islands/map-camera.js');
test('free-map dragging keeps the grabbed sea point under the cursor at varied zooms and angles',()=>{
 for(const distance of [30,135,155])for(const theta of [-1,.28,1.5])for(const phi of [.4,.78,1.1]){
  const camera=new T.PerspectiveCamera(38,1.3,.1,500),origin=new T.Vector3(0,0,1);
  camera.position.set(Math.sin(theta)*Math.sin(phi)*distance,Math.cos(phi)*distance,1+Math.cos(theta)*Math.sin(phi)*distance);camera.lookAt(origin);camera.updateMatrixWorld();
  const start={x:.1,y:-.1},current={x:.25,y:.06},ray=new T.Raycaster();ray.setFromCamera(new T.Vector2(start.x,start.y),camera);
  const grabbed=ray.ray.intersectPlane(new T.Plane(new T.Vector3(0,1,0),0),new T.Vector3());
  const target=M.panTarget(T,camera,origin,start,current),moved=camera.clone(),delta=new T.Vector3(target.x-origin.x,0,target.z-origin.z);
  moved.position.add(delta);moved.lookAt(new T.Vector3(target.x,target.y,target.z));moved.updateMatrixWorld();const projected=grabbed.project(moved);
  assert.ok(Math.abs(projected.x-current.x)<1e-6);assert.ok(Math.abs(projected.y-current.y)<1e-6);
 }
});
test('free-map movement changes the viewed position without moving the player or rotating the view',()=>{
 const camera=new T.PerspectiveCamera(38,1.3,.1,500);camera.position.set(20,80,60);camera.lookAt(0,0,0);camera.updateMatrixWorld();
 const origin={x:0,y:0,z:0},matrix=camera.matrixWorld.toArray(),target=M.panTarget(T,camera,origin,{x:0,y:0},{x:.6,y:-.4});
 assert.ok(Math.hypot(target.x,target.z)>5);assert.deepEqual(origin,{x:0,y:0,z:0});assert.deepEqual(camera.matrixWorld.toArray(),matrix);
 const edge=M.panTarget(T,camera,{x:69,y:0,z:69},{x:0,y:0},{x:-100,y:100});assert.ok(Math.abs(edge.x)<=70&&Math.abs(edge.z)<=70);
});
test('bird, overhead and eye-level presets produce distinct usable camera elevations',()=>{
 for(const aspect of [.7,1,1.5,2])for(const following of [false,true]){
  const bird=M.preset('bird',following,aspect),top=M.preset('top',following,aspect),eye=M.preset('eye',following,aspect);
  assert.ok(top.phi<bird.phi&&bird.phi<eye.phi);assert.equal(eye.phi,Math.PI/2);assert.ok(eye.y>=2);
  for(const p of [bird,top,eye]){assert.ok(p.distance>0);assert.ok(p.distance*Math.cos(p.phi)+p.y>1.8);}
 }
 assert.equal(M.preset('unknown'),null);
 assert.ok(M.zoomDistance(18,.82,'eye')<18);assert.equal(M.zoomDistance(18,.01,'eye'),10);assert.equal(M.zoomDistance(18,.01,'bird'),22);
});
test('eye-level dragging stays finite even above the horizon, with a safe camera height',()=>{
 const camera=new T.PerspectiveCamera(38,1.3,.1,500),origin=new T.Vector3(0,2.8,0);camera.position.set(0,2.8,18);camera.lookAt(origin);camera.updateMatrixWorld();
 const target=M.panTarget(T,camera,{x:origin.x,y:origin.y,z:origin.z},{x:0,y:.1},{x:.25,y:.2});assert.ok(Math.abs(target.x)>1);assert.ok(Number.isFinite(target.y)&&target.y>=1.8);
 const raised=M.panTarget(T,camera,origin,{x:0,y:0},{x:0,y:-20});assert.equal(raised.y,12);
 const lowered=M.panTarget(T,camera,origin,{x:0,y:0},{x:0,y:20});assert.equal(lowered.y,1.8);
});
test('world presets keep the player in place and disable only the three camera controls in flat mode',()=>{
 const fs=require('node:fs'),vm=require('node:vm'),{parseHTML}=require('linkedom'),{document}=parseHTML(fs.readFileSync(require('node:path').join(__dirname,'../islands/index.html'),'utf8'));
 const host=document.getElementById('world');Object.defineProperties(host,{clientWidth:{value:880},clientHeight:{value:695}});
 const create=document.createElement.bind(document);document.createElement=tag=>{const node=create(tag);if(tag==='canvas')node.getContext=()=>new Proxy({canvas:node},{get:(o,key)=>key in o?o[key]:()=>{}});return node;};
 const Three={...T,WebGLRenderer:class{constructor(){this.shadowMap={};}setPixelRatio(){}setSize(){}}};
 const context={document,THREE:Three,window:{THREE:Three,addEventListener(){}},devicePixelRatio:1,matchMedia:()=>({matches:false}),ResizeObserver:class{observe(){}},requestAnimationFrame:()=>0,cancelAnimationFrame(){}};
 for(const [name,file]of Object.entries({MathIslands:'curriculum',MathIslandNavigation:'navigation',MathIslandTeaching:'teaching',MathIslandRewards:'rewards',MathIslandSeaLife:'sea-life',MathIslandPedestrians:'pedestrians',MathIslandMarineAnimals:'marine-animals',MathIslandMapLabels:'map-labels',MathIslandMapCamera:'map-camera'})){context[name]=require('../islands/'+file+'.js');context.window[name]=context[name];}
 vm.createContext(context);vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../islands/world.js'),'utf8'),context);
 const world=context.window.createMathWorld(()=>{});world.setVisitor({name:'測試旅人',color:'#508c7a'},{atLanding:true});
 const tag=document.getElementById('traveler-tag'),position={x:tag.dataset.x,z:tag.dataset.z},buttons=[...document.querySelectorAll('button[data-camera-view]')];
 for(const mode of ['top','eye','bird']){assert.equal(world.setCamera(mode),true);assert.equal(host.dataset.cameraView,mode);assert.equal(buttons.filter(b=>b.getAttribute('aria-pressed')==='true').length,1);assert.deepEqual({x:tag.dataset.x,z:tag.dataset.z},position);}
 assert.equal(host.getAttribute('aria-pressed'),null);world.toggleFlat();assert.ok(buttons.every(b=>b.disabled));assert.equal(world.setCamera('eye'),false);
 world.toggleFlat();assert.ok(buttons.every(b=>!b.disabled));world.follow(true);world.setCamera('eye');assert.equal(document.getElementById('follow-visitor').getAttribute('aria-pressed'),'true');
 world.overview();assert.equal(host.dataset.cameraView,'bird');assert.equal(document.getElementById('follow-visitor').getAttribute('aria-pressed'),'false');
});
