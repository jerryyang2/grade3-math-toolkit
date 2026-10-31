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
