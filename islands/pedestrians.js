/* 島內散步的人群：共用步行碰撞，使用批次幾何降低繪圖負擔。 */
(function(root){
'use strict';
const clothes=['#d78358','#548e86','#6f8fba','#a183ad','#dfb858','#a9b877'];
const displays={0:[[-1.1,2.2,2.6,.7]],1:[[-2,1.3,3.5,1.6],[2,.5,3.5,1.6]],2:[[2.1,2,3.5,2]],5:[[0,1,4.8,1.7]],6:[[-.4,2.2,4.8,1.5]],7:[[-3,1.1,2,2],[3,1.1,2,2]]};
const skins=['#efc49b','#d9a577','#ba855f','#f6d8b3'];
function create(navigation,random=Math.random){
 const walkers=[];
 function safe(p,island){
  const center=navigation.plazas[island],x=p.x-center.x,z=p.z-(center.z-3.6);
  if((x/5.25)**2+(z/4.15)**2>1||!navigation.walkable(p)||navigation.islandAt(p)!==`u${island+1}`)return false;
  if(Math.hypot(x-1.5,z-3.9)<.8)return false; // 保留店主對話空間。
  if(island===3&&Math.abs(x)<1.55)return false; // 河岸居民留在各自的岸上。
  return !(displays[island]||[]).some(([cx,cz,w,d])=>Math.abs(x-cx)<w/2+.25&&Math.abs(z-cz)<d/2+.25);
 }
 function clear(a,b,island){const steps=Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.1);for(let j=0;j<=steps;j++){const t=steps?j/steps:0;if(!safe({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t},island))return false;}return true;}
 function pick(island,from=null){
  const center=navigation.plazas[island];
  for(let attempt=0;attempt<100;attempt++){
   const p={x:center.x+(random()-.5)*10.3,z:center.z-3.6+(random()-.5)*8};
   if(!safe(p,island))continue;
   if(from){const d=Math.hypot(p.x-from.x,p.z-from.z);if(d<.8||d>4.8||!clear(from,p,island))continue;}
   else if(walkers.some(w=>Math.hypot(w.x-p.x,w.z-p.z)<.9))continue;
   return p;
  }
  return null;
 }
 for(let island=0;island<9;island++)for(let j=0;j<4;j++){
  const p=pick(island);if(!p)continue;
  walkers.push({...p,island,kind:j%2?'traveler':'resident',color:clothes[(island+j)%clothes.length],skin:skins[(island+j)%skins.length],scale:.82+random()*.18,speed:.65+random()*.4,heading:random()*Math.PI*2,gait:random()*Math.PI*2,wait:j*.6+random(),walking:false,target:null});
 }
 function step(dt,player){
  if(!(dt>0))return;dt=Math.min(dt,.08);
  for(const w of walkers){
   w.walking=false;
   if(w.wait>0){w.wait=Math.max(0,w.wait-dt);continue;}
   if(!w.target){w.target=pick(w.island,w);if(!w.target){w.wait=.5+random();continue;}}
   const dx=w.target.x-w.x,dz=w.target.z-w.z,d=Math.hypot(dx,dz),amount=Math.min(d,w.speed*dt);
   if(d<.04){w.target=null;w.wait=1+random()*3;continue;}
   const next={x:w.x+dx/d*amount,z:w.z+dz/d*amount};
   if(player&&Math.hypot(next.x-player.x,next.z-player.z)<.8){w.target=null;w.wait=.5+random();continue;}
   // 相向的人留出距離，放棄目標後改走別的方向。
   if(walkers.some(other=>other!==w&&other.island===w.island&&Math.hypot(next.x-other.x,next.z-other.z)<.55)){w.target=null;w.wait=.3+random();continue;}
   if(!clear(w,next,w.island)){w.target=null;w.wait=.5;continue;}
   w.x=next.x;w.z=next.z;w.heading=Math.atan2(dx,dz);w.gait+=amount*9;w.walking=true;
  }
 }
 return {walkers,step};
}
function mount(T,scene,navigation,geometry){
 const crowd=create(navigation),count=crowd.walkers.length,group=new T.Group();group.name='island-pedestrians';scene.add(group);
 const material=new T.MeshStandardMaterial({color:'#ffffff',roughness:.86}),batches={};
 for(const [name,shape,n]of [['body','cylinder',count],['head','sphere',count],['hat','cone',count],['brim','cylinder',count],['bag','box',count],['legs','box',count*2],['arms','box',count*2],['shoes','box',count*2]]){
  const mesh=new T.InstancedMesh(geometry[shape],material,n);mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.frustumCulled=false;mesh.castShadow=false;mesh.receiveShadow=true;group.add(mesh);batches[name]=mesh;
 }
 const tint=new T.Color(),rig=new T.Object3D(),part=new T.Object3D();
 function color(name,i,value){batches[name].setColorAt(i,tint.set(value));}
 crowd.walkers.forEach((w,i)=>{
  color('body',i,w.color);color('head',i,w.skin);color('hat',i,w.kind==='traveler'?'#dcb978':'#6c5747');color('brim',i,'#e6c987');color('bag',i,'#c78f54');
  for(let side=0;side<2;side++){color('legs',i*2+side,'#526b72');color('arms',i*2+side,w.skin);color('shoes',i*2+side,'#fcf1da');}
 });
 function stamp(name,index,x,y,z,sx,sy,sz,rx=0){part.position.set(x,y,z);part.rotation.set(rx,0,0);part.scale.set(sx,sy,sz);part.updateMatrix();part.matrix.premultiply(rig.matrix);batches[name].setMatrixAt(index,part.matrix);}
 function paint(){
  crowd.walkers.forEach((w,i)=>{
   rig.position.set(w.x,1.02,w.z);rig.rotation.set(0,w.heading,0);rig.scale.setScalar(w.scale);rig.updateMatrix();
   stamp('body',i,0,.9,0,.31,.75,.31);stamp('head',i,0,1.53,.02,.31,.31,.31);
   const traveler=w.kind==='traveler';stamp('hat',i,0,1.85,0,traveler ? .43:.32,traveler ? .25:.16,traveler ? .43:.32);stamp('brim',i,0,1.75,0,traveler ? .43: 0,.06,traveler ? .43:0);stamp('bag',i,0,.96,-.31,traveler ? .42: 0,.48,.2);
   for(let j=0;j<2;j++){const side=j?1:-1,swing=w.walking?Math.sin(w.gait+j*Math.PI)*.45:0;
    stamp('legs',i*2+j,side*.15,.31,-Math.sin(swing)*.22,.17,.48,.2,swing);stamp('shoes',i*2+j,side*.15,.06,.08-Math.sin(swing)*.44,.22,.12,.32,swing);
    stamp('arms',i*2+j,side*.38,1.01,Math.sin(swing)*.2,.14,.46,.16,-swing);
   }
  });
  Object.values(batches).forEach(mesh=>{mesh.instanceMatrix.needsUpdate=true;});
 }
 paint();return {step(dt,player){crowd.step(dt,player);paint();}};
}
const api={create,mount};if(typeof module!=='undefined')module.exports=api;else root.MathIslandPedestrians=api;
})(typeof window!=='undefined'?window:globalThis);
