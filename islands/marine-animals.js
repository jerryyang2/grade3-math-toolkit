/* 幾何海洋動物與隨機游動；整個身體皆與岸線、碼頭及橋梁保持距離。 */
(function(root){
'use strict';
const species={dolphin:{scale:.8,radius:2.2,color:'#4c91a3',speed:1.1},whale:{scale:1.65,radius:4.3,color:'#3c617c',speed:.55},shark:{scale:1,radius:2.7,color:'#6c818c',speed:.8}};
const starts=[['dolphin',-12,-32],['dolphin',12,-11],['dolphin',-12,13],['dolphin',36,14],['whale',-18,-39],['whale',4,40],['shark',-37,7],['shark',12,35],['shark',37,-12]];
function create(navigation,random=Math.random){
 const animals=[];
 function water(p,radius){
  if(!Number.isFinite(p.x)||!Number.isFinite(p.z)||Math.abs(p.x)>48-radius||Math.abs(p.z)>46-radius)return false;
  if(navigation.plazas.some(c=>((p.x-c.x)/(9+radius))**2+((p.z-(c.z-3.6))/(7.6+radius))**2<1))return false;
  const dock=navigation.landing;
  if(Math.abs(p.x-dock.position.x)<dock.width/2+radius+1&&Math.abs(p.z-dock.position.z)<dock.depth/2+radius+1)return false;
  return navigation.bridges.every(b=>{
   const dx=b.b.x-b.a.x,dz=b.b.z-b.a.z,t=Math.max(0,Math.min(1,((p.x-b.a.x)*dx+(p.z-b.a.z)*dz)/(dx*dx+dz*dz)));
   return Math.hypot(p.x-b.a.x-dx*t,p.z-b.a.z-dz*t)>b.width/2+radius+1;
  });
 }
 function clear(a,b,radius){const n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.35));for(let i=0;i<=n;i++)if(!water({x:a.x+(b.x-a.x)*i/n,z:a.z+(b.z-a.z)*i/n},radius))return false;return true;}
 for(const [kind,x,z]of starts){
  const definition=species[kind];let p=null;
  for(let i=0;i<300;i++){const candidate=i<40?{x:x+(random()-.5)*3,z:z+(random()-.5)*3}:{x:(random()-.5)*84,z:(random()-.5)*80};if(water(candidate,definition.radius)&&animals.every(a=>Math.hypot(a.x-candidate.x,a.z-candidate.z)>a.radius+definition.radius)){p=candidate;break;}}
  if(p)animals.push({...definition,...p,kind,heading:random()*Math.PI*2,phase:random()*Math.PI*2,age:0,speed:definition.speed*(.8+random()*.4),target:null,wait:0});
 }
 function target(animal){
  for(let i=0;i<60;i++){
   const heading=animal.heading+(random()-.5)*(i<30?2.5:Math.PI*2),distance=3+random()*9;
   const p={x:animal.x+Math.sin(heading)*distance,z:animal.z+Math.cos(heading)*distance};
   if(clear(animal,p,animal.radius))return p;
  }
  return null;
 }
 function pose(a){
  const wave=Math.sin(a.age*(a.kind==='shark'?.7:1.1)+a.phase),surface=Math.max(0,Math.sin(a.age*.26+a.phase))**18;
  const y=a.kind==='whale'?-2.3+surface*1.5:a.kind==='dolphin'?-1.9+wave*.25+surface*1.25:-1.8+wave*.15;
  return {x:a.x,y,z:a.z,heading:a.heading,pitch:a.kind==='dolphin'?Math.cos(a.age*.26+a.phase)*surface*.4:wave*.035,tail:Math.sin(a.age*(a.kind==='whale'?2:4)+a.phase)*.3,spout:a.kind==='whale'&&surface>.7};
 }
 function step(dt){
  if(!(dt>0))return;dt=Math.min(dt,.08);
  for(const a of animals){
   a.age+=dt;if(a.wait>0){a.wait-=dt;continue;}
   if(!a.target)a.target=target(a);
   if(!a.target){a.heading+=.4;a.wait=.4;continue;}
   const dx=a.target.x-a.x,dz=a.target.z-a.z,d=Math.hypot(dx,dz),amount=Math.min(d,a.speed*dt);
   if(d<.04){a.target=null;continue;}
   const next={x:a.x+dx/d*amount,z:a.z+dz/d*amount};
   if(!clear(a,next,a.radius)){a.target=null;continue;}
   if(animals.some(other=>other!==a&&Math.hypot(next.x-other.x,next.z-other.z)<a.radius+other.radius)){a.target=null;a.heading+=.5;a.wait=.2;continue;}
   a.x=next.x;a.z=next.z;const heading=Math.atan2(dx,dz),angle=heading-a.heading;a.heading+=Math.atan2(Math.sin(angle),Math.cos(angle))*Math.min(1,dt*3);
  }
 }
 return {animals,step,pose,water,clear};
}
function mount(T,scene,navigation){
 const simulation=create(navigation),group=new T.Group();group.name='marine-animals';scene.add(group);
 const sphere=new T.SphereGeometry(1,12,8),cone=new T.ConeGeometry(1,1,10),fin=new T.BufferGeometry();
 fin.setAttribute('position',new T.Float32BufferAttribute([0,0,0,0,1,-.25,0,0,-.9],3));fin.computeVertexNormals();
 const materials=new Map();function material(color){if(!materials.has(color))materials.set(color,new T.MeshStandardMaterial({color,roughness:.7,side:T.DoubleSide}));return materials.get(color);}
 function mesh(parent,geometry,color,x,y,z,sx,sy,sz){const m=new T.Mesh(geometry,material(color));m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);return m;}
 const models=simulation.animals.map(a=>{
  const model=new T.Group();model.name=a.kind;model.scale.setScalar(a.scale);group.add(model);
  const whale=a.kind==='whale',shark=a.kind==='shark';
  mesh(model,sphere,a.color,0,0,0,whale?.7:.52,whale?.65:.46,1.45);
  mesh(model,sphere,'#c0d9dc',0,-.18,.2,whale?.57:.43,.32,1.15);
  mesh(model,sphere,a.color,0,.02,1.03,whale?.7:.43,whale?.58:.39,whale?.85:.65);
  if(!whale){const nose=mesh(model,cone,a.color,0,-.05,1.7,shark?.35:.2,.85,shark?.3:.17);nose.rotation.x=Math.PI/2;}
  const dorsal=mesh(model,fin,a.color,0,.28,whale?-.5:0,1,shark?1.1:whale?.35:.65,shark?1:.8);
  for(const side of [-1,1]){
   const flipper=mesh(model,fin,a.color,side*.35,-.15,.45,1,whale?1.2:.8,1);flipper.rotation.z=side*Math.PI/2;flipper.rotation.y=-side*.22;
   mesh(model,sphere,'#173641',side*(whale?.61:.36),.13,whale?1.35:1.4,.055,.055,.055);
   if(whale)for(let i=0;i<3;i++){const pleat=mesh(model,sphere,'#a0bdc6',side*.17,-.51,1.05-i*.2,.025,.025,.34);pleat.rotation.x=.1;}
  }
  const tail=new T.Group();tail.position.set(0,0,-1.4);model.add(tail);mesh(tail,sphere,a.color,0,0,-.3,.23,.23,.65);
  for(const side of [-1,1]){const fluke=mesh(tail,fin,a.color,0,0,-.65,1,whale?1:.8,.7);fluke.rotation.z=shark?(side===1?0:Math.PI):side*Math.PI/2;}
  const spray=new T.Group();spray.position.set(0,.62,.7);model.add(spray);spray.visible=false;
  if(whale){mesh(model,sphere,'#203e51',0,.59,.7,.12,.025,.16);for(let i=0;i<6;i++)mesh(spray,sphere,'#effcfa',Math.sin(i*2.4)*.2,.25+i*.13,Math.cos(i*2.4)*.15,.07,.13,.07);}
  const ripple=mesh(group,new T.RingGeometry(.85,1,24),'#c8e8e3',0,-1.12,0,1,1,1);ripple.rotation.x=-Math.PI/2;ripple.material=material('#c8e8e3').clone();ripple.material.transparent=true;ripple.material.opacity=.45;ripple.material.depthWrite=false;
  return {model,tail,spray,ripple};
 });
 function paint(){simulation.animals.forEach((a,i)=>{const p=simulation.pose(a),{model,tail,spray,ripple}=models[i];model.position.set(p.x,p.y,p.z);model.rotation.set(p.pitch,p.heading,0,'YXZ');tail.rotation[a.kind==='shark'?'y':'x']=p.tail;spray.visible=p.spout;const pulse=.9+Math.sin(a.age*1.7+a.phase)*.12;ripple.position.set(p.x,-1.12,p.z);ripple.scale.set(a.scale*pulse,a.scale*1.8*pulse,1);ripple.visible=p.y> -1.4||p.spout;});}
 paint();return {step(dt){simulation.step(dt);paint();}};
}
const api={species,create,mount};if(typeof module!=='undefined')module.exports=api;else root.MathIslandMarineAnimals=api;
})(typeof window!=='undefined'?window:globalThis);
