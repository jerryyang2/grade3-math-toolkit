const test=require('node:test'),assert=require('node:assert/strict');
const T=require('../islands/vendor/three.min.js'),Labels=require('../islands/map-labels.js'),N=require('../islands/navigation.js');
test('island names remain below the shoreline and pier when the camera rotates and zooms',()=>{
 for(const distance of [25,39,110,145])for(const angle of [-1,.28,1.8]){
  const camera=new T.PerspectiveCamera(38,900/695,.1,500);camera.position.set(Math.sin(angle)*distance*.7,distance*.71,Math.cos(angle)*distance*.7);camera.lookAt(0,0,0);camera.updateMatrixWorld();
  const project=(x,y,z)=>{const p=new T.Vector3(x,y,z).project(camera);return {x:(p.x+1)*450,y:(1-p.y)*347.5,z:p.z};};
  const dock=Labels.belowDock(project,N.landing,900,160);assert.ok(dock.x>=85&&dock.x<=815);
  for(const dx of [-1,1])for(const dz of [-1,1])assert.ok(dock.y>project(N.landing.position.x+dx*N.landing.width/2,0,N.landing.position.z+dz*N.landing.depth/2).y);
  for(const center of N.coordinates){
   const label=Labels.belowIsland(project,center,900,695,150);assert.ok(Number.isFinite(label.x)&&Number.isFinite(label.y));
   if(!label.visible)continue;
   assert.ok(label.x>=80&&label.x<=820);
   for(let i=0;i<64;i++){const a=i*Math.PI/32;assert.ok(label.y>project(center[0]+Math.cos(a)*8,0,center[1]+Math.sin(a)*6.8).y);}
   assert.ok(label.y>project(center[0],0,center[1]+9.3).y);
  }
 }
});
