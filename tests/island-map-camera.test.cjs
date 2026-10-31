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
function worldHarness(){
 const fs=require('node:fs'),vm=require('node:vm'),{parseHTML}=require('linkedom'),{document}=parseHTML(fs.readFileSync(require('node:path').join(__dirname,'../islands/index.html'),'utf8'));
 const host=document.getElementById('world');Object.defineProperties(host,{clientWidth:{value:880},clientHeight:{value:695}});
 const create=document.createElement.bind(document);document.createElement=tag=>{const node=create(tag);if(tag==='canvas')node.getContext=()=>new Proxy({canvas:node},{get:(o,key)=>key in o?o[key]:()=>{}});return node;};
 let frame,renderedCamera,time=0;const listeners={};
 const canvas=document.getElementById('ocean');canvas.focus=()=>{};canvas.setPointerCapture=()=>{};canvas.getBoundingClientRect=()=>({left:0,top:0,width:880,height:695});
 const Three={...T,WebGLRenderer:class{constructor(){this.shadowMap={};}setPixelRatio(){}setSize(){}render(scene,camera){renderedCamera=camera;camera.updateMatrixWorld();}}};
 const context={document,THREE:Three,window:{THREE:Three,addEventListener(name,fn){(listeners[name]??=[]).push(fn);}},devicePixelRatio:1,matchMedia:()=>({matches:false}),ResizeObserver:class{observe(){}},requestAnimationFrame:fn=>{frame=fn;return 0;},cancelAnimationFrame(){}};
 for(const [name,file]of Object.entries({MathIslands:'curriculum',MathIslandNavigation:'navigation',MathIslandTeaching:'teaching',MathIslandRewards:'rewards',MathIslandSeaLife:'sea-life',MathIslandPedestrians:'pedestrians',MathIslandMarineAnimals:'marine-animals',MathIslandMapLabels:'map-labels',MathIslandMapCamera:'map-camera'})){context[name]=require('../islands/'+file+'.js');context.window[name]=context[name];}
 vm.createContext(context);vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../islands/world.js'),'utf8'),context);
 const world=context.window.createMathWorld(()=>{});world.setVisitor({name:'測試旅人',color:'#508c7a'},{atLanding:true});
 function settle(){for(let i=0;i<120;i++)frame(time+=40);}
 function event(type,props={}){const e=new document.defaultView.Event(type,{cancelable:true});Object.assign(e,{button:0,pointerId:1,clientX:400,clientY:350,...props});canvas.dispatchEvent(e);return e;}
 settle();return {world,document,host,canvas,event,settle,camera:()=>renderedCamera,blur:()=>listeners.blur.forEach(fn=>fn())};
}
test('world presets keep the player in place and disable only the three camera controls in flat mode',()=>{
 const {world,document,host}=worldHarness();
 const tag=document.getElementById('traveler-tag'),position={x:tag.dataset.x,z:tag.dataset.z},buttons=[...document.querySelectorAll('button[data-camera-view]')];
 for(const mode of ['top','eye','bird']){assert.equal(world.setCamera(mode),true);assert.equal(host.dataset.cameraView,mode);assert.equal(buttons.filter(b=>b.getAttribute('aria-pressed')==='true').length,1);assert.deepEqual({x:tag.dataset.x,z:tag.dataset.z},position);}
 assert.equal(host.getAttribute('aria-pressed'),null);world.toggleFlat();assert.ok(buttons.every(b=>b.disabled));assert.equal(world.setCamera('eye'),false);
 world.toggleFlat();assert.ok(buttons.every(b=>!b.disabled));world.follow(true);world.setCamera('eye');assert.equal(document.getElementById('follow-visitor').getAttribute('aria-pressed'),'true');
 world.overview();assert.equal(host.dataset.cameraView,'bird');assert.equal(document.getElementById('follow-visitor').getAttribute('aria-pressed'),'false');
});

test('two-finger spread zooms in and pinch zooms out without walking or changing view angle',()=>{
 const h=worldHarness(),tag=h.document.getElementById('traveler-tag'),position={...tag.dataset},origin=new T.Vector3(0,0,1),before=h.camera().position.distanceTo(origin);
 const facing=h.camera().getWorldDirection(new T.Vector3());
 h.event('pointerdown',{pointerId:1,clientX:300});h.event('pointerdown',{pointerId:2,clientX:500});
 assert.ok(h.event('pointermove',{pointerId:2,clientX:700}).defaultPrevented);h.settle();
 assert.ok(Math.abs(h.camera().position.distanceTo(origin)-before/2)<.02);
 assert.ok(h.camera().getWorldDirection(new T.Vector3()).distanceTo(facing)<1e-6);
 h.event('pointermove',{pointerId:2,clientX:500});h.settle();assert.ok(Math.abs(h.camera().position.distanceTo(origin)-before)<.02);
 h.event('pointerup',{pointerId:2});h.event('pointermove',{pointerId:1,clientX:650});h.event('pointerup',{pointerId:1});h.settle();
 assert.deepEqual({...tag.dataset},position);assert.equal(h.document.getElementById('follow-visitor').getAttribute('aria-pressed'),'false');
 assert.equal(h.document.getElementById('world-status').textContent,'');
});
test('pinch clamps at both limits, handles a third finger and recovers after cancellation',()=>{
 const h=worldHarness(),origin=new T.Vector3(0,0,1);
 h.event('pointerdown',{pointerId:1,clientX:300});h.event('pointerdown',{pointerId:2,clientX:500});
 h.event('pointermove',{pointerId:2,clientX:30000});h.settle();assert.ok(Math.abs(h.camera().position.distanceTo(origin)-22)<.02);
 h.event('pointerdown',{pointerId:3,clientX:310});h.event('pointercancel',{pointerId:2});h.event('pointermove',{pointerId:3,clientX:301});h.settle();assert.ok(Math.abs(h.camera().position.distanceTo(origin)-180)<.02);
 h.event('pointerup',{pointerId:1});h.event('lostpointercapture',{pointerId:3});
 // A new single-finger drag can pan again after the pinch ends.
 const before=h.camera().position.clone();h.event('pointerdown',{clientX:400});h.event('pointermove',{clientX:450});h.event('pointerup',{clientX:450});h.settle();assert.ok(h.camera().position.distanceTo(before)>1);
 h.event('pointerdown');h.blur();h.event('pointerup');assert.equal(h.document.getElementById('world-status').textContent,'');
});
test('trackpad pinch zooms without intercepting ordinary wheel scrolling and respects eye-level bounds',()=>{
 const h=worldHarness(),origin=new T.Vector3(0,0,1),before=h.camera().position.distanceTo(origin);
 assert.equal(h.event('wheel',{deltaY:-25,deltaMode:0,ctrlKey:false}).defaultPrevented,false);h.settle();assert.ok(Math.abs(h.camera().position.distanceTo(origin)-before)<.02);
 assert.ok(h.event('wheel',{deltaY:-25,deltaMode:0,ctrlKey:true}).defaultPrevented);h.settle();assert.ok(h.camera().position.distanceTo(origin)<before);
 h.world.setCamera('eye');h.settle();const eye=h.camera().position.clone(),direction=h.camera().getWorldDirection(new T.Vector3());
 for(let i=0;i<10;i++)h.event('wheel',{deltaY:-100,deltaMode:0,ctrlKey:true});h.settle();assert.ok(Math.abs(h.camera().position.clone().sub(eye).dot(direction)-8)<.02);assert.ok(Math.abs(h.camera().position.y-2.8)<.01);
 h.world.toggleFlat();assert.equal(h.event('wheel',{deltaY:-25,ctrlKey:true}).defaultPrevented,false);
});
