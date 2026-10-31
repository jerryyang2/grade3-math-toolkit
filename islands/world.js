/* 以幾何積木施工的九座原創島嶼。沒有外部模型或執行期 CDN。 */
(function(){
'use strict';
window.createMathWorld=function(onSelect){
 const host=document.getElementById('world'),canvas=document.getElementById('ocean'),status=document.getElementById('world-status');
 const labels=[...document.querySelectorAll('.island-label')];
 const markers=[];
 let flat=false,paused=matchMedia('(prefers-reduced-motion: reduce)').matches,active=null;
 const fallback=message=>{flat=true;host.classList.add('flat');document.getElementById('map-mode').setAttribute('aria-pressed','true');status.textContent=message;for(const id of ['zoom-in','zoom-out','map-mode','motion-toggle'])document.getElementById(id).disabled=true;labels.forEach(l=>{l.hidden=false;});document.getElementById('view-caption').textContent='點選島嶼，數學任務照常進行';};
 let renderer;
 try{if(!window.THREE)throw Error('3D 引擎未載入');renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'low-power'});}catch{fallback('目前使用平面地圖，所有數學任務皆可使用。');document.getElementById('zoom-in').disabled=true;document.getElementById('zoom-out').disabled=true;document.getElementById('map-mode').disabled=true;document.getElementById('motion-toggle').disabled=true;return {select(){},complete(){},overview(){},zoom(){},toggleFlat(){return true;},toggleMotion(){return true;}};}
 const T=THREE,scene=new T.Scene();scene.background=new T.Color('#c2e2df');scene.fog=new T.Fog('#c2e2df',180,310);
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.outputColorSpace=T.SRGBColorSpace;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
 const camera=new T.PerspectiveCamera(38,1,.1,500);scene.add(new T.HemisphereLight('#fffae9','#709a9c',2.5));const sun=new T.DirectionalLight('#fff1ce',3);sun.position.set(-30,65,35);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-55,right:55,top:55,bottom:-55,near:1,far:160});sun.shadow.bias=-.0008;scene.add(sun);scene.add(sun.target);
 const mats=new Map(),geo={box:new T.BoxGeometry(1,1,1),cylinder:new T.CylinderGeometry(1,1,1,12),cone:new T.ConeGeometry(1,1,6),sphere:new T.IcosahedronGeometry(1,1)};
 function mat(color){if(!mats.has(color))mats.set(color,new T.MeshStandardMaterial({color,roughness:.86}));return mats.get(color);}
 function mesh(g,color,parent,x=0,y=0,z=0,sx=1,sy=1,sz=1){const o=new T.Mesh(g,mat(color));o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
 const box=(p,c,x,y,z,a,b,d)=>mesh(geo.box,c,p,x,y,z,a,b,d);
 const cyl=(p,c,x,y,z,r,h)=>mesh(geo.cylinder,c,p,x,y,z,r,h,r);
 const sphere=(p,c,x,y,z,r)=>mesh(geo.sphere,c,p,x,y,z,r,r,r);
 function tree(p,x,z,size=1,color='#528868'){cyl(p,'#967755',x,1.8*size,z,.17*size,2*size);const a=sphere(p,color,x,3.1*size,z,1.25*size);a.scale.y=1.25;sphere(p,'#76a174',x+.55*size,2.85*size,z+.3*size,.85*size);}
 function pine(p,x,z,size=1){cyl(p,'#8c7154',x,1.7*size,z,.16*size,2*size);mesh(geo.cone,'#537e69',p,x,2.7*size,z,1.15*size,2.5*size,1.15*size);mesh(geo.cone,'#759c77',p,x,3.65*size,z,.8*size,1.9*size,.8*size);}
 function roofHouse(p,x,z,color='#d5a483',width=3){box(p,'#fff0ce',x,2.1,z,width,2.5,2.7);const roof=mesh(new T.CylinderGeometry(0,1,1,4),color,p,x,3.95,z,width*.87,1.7,2.4);roof.rotation.y=Math.PI/4;box(p,'#6a7f78',x,1.65,z+1.36,.65,1.55,.08);for(const side of [-1,1]){box(p,'#729ca6',x+side*width*.3,2.35,z+1.38,.48,.62,.1);box(p,'#f7e0ae',x+side*width*.3,2.35,z+1.45,.06,.65,.06);}box(p,'#f5dfb9',x,3.25,z+1.5,width*.8,.35,.2);}
 function flag(p,x,z,c){cyl(p,'#fff8db',x,3,z,.055,4.7);const f=box(p,c,x+.45,4.85,z,.9,.65,.05);f.rotation.z=.1;}
 function npc(p,x,z,color){cyl(p,color,x,1.5,z,.34,.8);sphere(p,'#f6d4ad',x,2.17,z,.35);mesh(geo.cone,color,p,x,2.57,z,.48,.35,.48);for(const dx of [-.14,.14])sphere(p,'#233e46',x+dx,2.23,z+.31,.045);}
 const sea=mesh(new T.PlaneGeometry(800,800),'#76b7bb',scene,0,-1.15,0);sea.rotation.x=-Math.PI/2;sea.castShadow=false;
 const coordinates=[[-23,-21],[0,-22],[23,-21],[-25,1],[0,0],[25,1],[-23,23],[0,24],[23,23]],groups=[],hits=[],spinners=[],floaters=[];
 function terrain(i){const group=new T.Group();group.position.set(coordinates[i][0],0,coordinates[i][1]);scene.add(group);groups.push(group);
 const shape=new T.Shape();for(let k=0;k<13;k++){const angle=k/12*Math.PI*2,r=7.3+Math.sin(k*2.7+i)*.65,x=Math.cos(angle)*r,y=Math.sin(angle)*r*.82;if(!k)shape.moveTo(x,y);else shape.lineTo(x,y);}const g=new T.ExtrudeGeometry(shape,{depth:1.5,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.6,bevelThickness:.5});g.rotateX(Math.PI/2);
 const cliff=mesh(g,'#d8bc8f',group,0,.25,0);cliff.userData.island=i;hits.push(cliff);const top=mesh(g,MathIslands.islands[i].land,group,0,.73,0,.92,.34,.92);top.userData.island=i;hits.push(top);
 const coast=mesh(new T.RingGeometry(7.7,8.05,48),'#c6e3d5',group,0,-.99,0,1,1,.84);coast.rotation.x=-Math.PI/2;coast.castShadow=false;
 // 主步道、碼頭、路燈與任務旗。
 box(group,'#ecdbb5',0,.86,2.3,1.1,.08,7.1);box(group,'#b88d63',0,.08,7.4,1.9,.2,3.7);for(let j=0;j<7;j++)box(group,'#e2c69a',0,.22,5.8+j*.48,2,.1,.22);for(const x of [-.85,.85])cyl(group,'#947953',x,-.1,8.5,.12,1.6);
 flag(group,-3.7,3.8,MathIslands.islands[i].color);npc(group,1.5,3.9,MathIslands.islands[i].color);
 for(let m=0;m<3;m++){const x=-2+m*2;const orb=sphere(group,'#fff1bd',x,2.05,4.8,.3);orb.userData={island:i,mission:m};hits.push(orb);markers.push({orb,id:MathIslands.islands[i].id,mission:m});cyl(group,'#9c855b',x,1.35,4.8,.045,1);const signCanvas=document.createElement('canvas');signCanvas.width=64;signCanvas.height=64;const ctx=signCanvas.getContext('2d');ctx.fillStyle='#fcf7e7';ctx.beginPath();ctx.arc(32,32,27,0,Math.PI*2);ctx.fill();ctx.fillStyle='#47665f';ctx.font='bold 34px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(m+1),32,34);const texture=new T.CanvasTexture(signCanvas);texture.colorSpace=T.SRGBColorSpace;const sign=new T.Sprite(new T.SpriteMaterial({map:texture,depthTest:false}));sign.position.set(x,2.8,4.8);sign.scale.set(.65,.65,.65);sign.userData={island:i,mission:m};group.add(sign);hits.push(sign);}

 for(let k=0;k<5;k++){const angle=2.2+k*.7,x=Math.cos(angle)*5.2,z=Math.sin(angle)*4.6;(i===5?pine:tree)(group,x,z,.6+(k%3)*.15);}
 for(let k=0;k<4;k++)sphere(group,'#9aa48d',5-k*.4,.65,-2+k*.65,.4+(k%2)*.2);
 return group;}
 for(let i=0;i<9;i++){const p=terrain(i);
 switch(i){
 case 0: // 港口倉庫、燈塔、位值金幣。
 roofHouse(p,-2,-1,'#c39450',3.3);cyl(p,'#f5eed6',2,3,-1.5,.85,4.7);cyl(p,'#b85f49',2,3.2,-1.5,.88,.8);cyl(p,'#526e78',2,5.5,-1.5,1,.65);mesh(geo.cone,'#d09c40',p,2,6.2,-1.5,1.3,.9,1.3);sphere(p,'#ffe0a1',2,5.55,-1.5,.5);for(let j=0;j<4;j++)for(let k=0;k<=j;k++)cyl(p,'#e4b64e',-3+j*1.25,1.05+k*.22,2.2,.4,.2);break;
 case 1: // 市集遮棚、貨箱。
 for(const [x,z,c]of[[-2,-1,'#bb7560'],[2,-1.8,'#6b9d88']]){roofHouse(p,x,z,c,2.8);box(p,'#fff2d1',x,2.65,z+2,3.2,.12,1.6);for(let k=0;k<4;k++)box(p,c,x-1.2+k*.8,2.73,z+2,.38,.1,1.6);for(const dx of [-1.4,1.4])cyl(p,'#8b7152',x+dx,1.7,z+2.7,.05,2);for(let k=0;k<3;k++){box(p,'#b38a5b',x-1+k,1.1,z+2.3,.65,.55,.65);sphere(p,['#cc7160','#dfb953','#8caa60'][k],x-1+k,1.52,z+2.3,.23);}}break;
 case 2: // 烘焙山、磨坊、烤盤。
 const hill=sphere(p,'#bba18c',-.8,1.4,-1.5,3);hill.scale.set(1,.6,1);roofHouse(p,0,-1,'#9b6f70',3.4);cyl(p,'#eddfbd',-3.2,2.8,-1,.65,3.9);mesh(geo.cone,'#9a6c68',p,-3.2,5,-1,1,.9,1);const mill=new T.Group();mill.position.set(-3.2,3.7,-.22);p.add(mill);for(let k=0;k<4;k++){const b=box(mill,'#f4dfac',0,0,0,.28,3.4,.1);b.rotation.z=k*Math.PI/2;}spinners.push({obj:mill,speed:.15});for(let j=0;j<3;j++){box(p,'#9b7961',1+j*1.1,1.05,2,.9,.15,1.7);for(let k=0;k<3;k++)sphere(p,'#d9ad69',1+j*1.1,1.35,1.4+k*.5,.24);}break;
 case 3: // 曲流與拱橋。
 box(p,'#73b3b9',0,.91,0,2.5,.1,10);for(let j=0;j<9;j++){box(p,'#c5986c',-3+j*.75,1.3+Math.sin(j/8*Math.PI)*.5,0,.68,.22,2);for(const z of [-1,1]){cyl(p,'#9e7654',-3+j*.75,1.9+Math.sin(j/8*Math.PI)*.5,z,.06,1);}}roofHouse(p,-3.3,-2.8,'#548a8e',2.5);box(p,'#f5deac',3,1.05,3.1,4,.15,.7);for(let j=0;j<9;j++)box(p,'#687d73',1.2+j*.45,1.14,3.2,.04,.04,j%2?.25:.55);break;
 case 4: // 有塔樓、雉堞、城門的幾何城。
 box(p,'#e5d6b6',0,2.2,-1,5.4,2.8,3);for(const x of [-2.7,2.7]){cyl(p,'#dccfb7',x,3,-.6,.85,4.3);mesh(geo.cone,'#88789e',p,x,5.8,-.6,1.2,1.7,1.2);box(p,'#617b8a',x,3.5,.2,.35,.7,.08);}for(let j=0;j<6;j++)box(p,'#f4e7cd',-2.5+j,3.9,-1,.5,.65,3.2);box(p,'#7c6b60',0,1.8,.57,1.3,2,.12);for(const x of [-.5,0,.5])box(p,'#c0a77a',x,1.9,.65,.05,1.8,.06);flag(p,0,-1,'#b49bd2');break;
 case 5: // 野餐地毯、籃子、松林。
 box(p,'#e3be9b',0,.95,0,4,.06,3.5);for(let j=0;j<5;j++)box(p,'#f9e5c3',-1.8+j*.9,1,0,.35,.04,3.5);for(let j=0;j<3;j++){cyl(p,'#b28b61',-1.7+j*1.7,1.3,1,.5,.6);for(let k=0;k<3;k++)sphere(p,'#e4b563',-1.95+j*1.7+k*.23,1.7,1,.16);}roofHouse(p,2.3,-2.8,'#839263',2.4);for(let j=0;j<3;j++)pine(p,-4+j*2,-3.8,1);break;
 case 6: // 玻璃感調飲室、水塔、量杯。
 roofHouse(p,-1,-1,'#649caa',3.7);cyl(p,'#b4d3d5',3,2.6,-1,.95,3.4);cyl(p,'#73b4c4',3,2.2,-1,.97,1.8);mesh(geo.cone,'#688e91',p,3,4.7,-1,1.2,1,1.2);for(let j=0;j<3;j++){cyl(p,'#f6e0af',-2+j*1.6,1.6,2.2,.5,1.35);cyl(p,['#e6ad68','#d89a85','#a7b96e'][j],-2+j*1.6,1.7,2.2,.51,.8);for(let k=0;k<4;k++)box(p,'#68858a',-1.75+j*1.6,1.2+k*.23,2.65,.3,.035,.05);}break;
 case 7: // 披薩餐館、圓形戶外餐桌。
 roofHouse(p,0,-1.5,'#c67f58',4);cyl(p,'#9f815f',0,1.4,1.8,1.8,.3);cyl(p,'#e7b86c',0,1.61,1.8,1.52,.12);cyl(p,'#cf7953',0,1.7,1.8,1.32,.05);for(let k=0;k<8;k++){const a=k*Math.PI/4;box(p,'#f6ddaa',0,1.75,1.8,.025,.025,2.6).rotation.y=a;sphere(p,'#c5af67',Math.cos(a)*.85,1.8,1.8+Math.sin(a)*.85,.15);}for(const x of [-3,3]){cyl(p,'#9b7d5c',x,1.1,2,.65,.45);cyl(p,'#edc49b',x,1.4,2,.8,.15);}break;
 case 8: // 可轉動摩天輪、支架、車廂。
 roofHouse(p,-3.1,1,'#66a48a',2);for(const x of [-1,1]){const leg=box(p,'#f3ddac',x,3,-1,.28,5,.35);leg.rotation.z=x*.25;}const wheel=new T.Group();wheel.position.set(0,4.4,-1);p.add(wheel);mesh(new T.TorusGeometry(3,.12,8,48),'#e0bc6c',wheel);for(let k=0;k<8;k++){const a=k*Math.PI/4;const spoke=box(wheel,'#f7e4b6',0,0,0,.06,6,.06);spoke.rotation.z=a;const cabin=new T.Group();cabin.position.set(Math.sin(a)*3,Math.cos(a)*3,0);wheel.add(cabin);box(cabin,['#d68d76','#79aaa0','#dfb96e','#a396bb'][k%4],0,-.35,0,.65,.65,.65);sphere(cabin,'#f3dfb4',0,.05,0,.4);}spinners.push({obj:wheel,speed:.08});sphere(p,'#dcb76f',0,4.4,-.7,.35);break;
 }
 }
 // 海上航線以離散浮標標示，避免遮住島嶼。
 const route=new T.CatmullRomCurve3(coordinates.map(([x,z])=>new T.Vector3(x,-.9,z+8)));const dots=route.getPoints(120);for(let i=0;i<dots.length;i+=3){const d=dots[i];const o=sphere(scene,'#d5e9d8',d.x,-.94,d.z,.14);o.castShadow=false;}
 function boat(x,z){const g=new T.Group();scene.add(g);g.position.set(x,-.7,z);const hull=box(g,'#aa7955',0,0,0,1.5,.45,3);hull.rotation.z=.05;cyl(g,'#f2dbad',0,1.3,0,.07,2.7);const sail=new T.Shape();sail.moveTo(0,0);sail.lineTo(0,2);sail.lineTo(1.2,.2);sail.closePath();const m=mesh(new T.ShapeGeometry(sail),'#fff0cc',g,0,.3,0);m.material=new T.MeshStandardMaterial({color:'#fff0cc',side:T.DoubleSide});floaters.push(g);return g;}
 boat(-12,10);boat(15,-13).rotation.y=1.1;
 let distance=137,targetDistance=137,theta=.28,phi=.78;const look=new T.Vector3(0,0,1),goal=new T.Vector3(0,0,1);let dirty=true,last=0,animationFrame=0;
 function resize(){const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();dirty=true;}
 new ResizeObserver(resize).observe(host);resize();
 function positionLabels(){labels.forEach((label,i)=>{if(flat)return;const v=new T.Vector3(coordinates[i][0],2,coordinates[i][1]+7).project(camera);const visible=(active===null||i===active)&&v.z<1&&Math.abs(v.x)<1.1&&Math.abs(v.y)<1.1;label.hidden=!visible;if(visible){label.style.left=`${(v.x+1)*50}%`;label.style.top=`${(-v.y+1)*50}%`;}});}
 function animate(time){animationFrame=requestAnimationFrame(animate);if(document.hidden||flat||time-last<33)return;last=time;const moving=look.distanceTo(goal)>.01||Math.abs(distance-targetDistance)>.01;if(paused&&!moving&&!dirty)return;look.lerp(goal,.1);distance+=(targetDistance-distance)*.1;camera.position.set(look.x+Math.sin(theta)*Math.sin(phi)*distance,look.y+Math.cos(phi)*distance,look.z+Math.cos(theta)*Math.sin(phi)*distance);camera.lookAt(look);if(!paused){spinners.forEach(({obj,speed})=>{obj.rotation.z=time*.001*speed;});floaters.forEach((g,i)=>{g.position.y=-.65+Math.sin(time*.001+i)*.12;g.rotation.z=Math.sin(time*.0008+i)*.035;});}renderer.render(scene,camera);positionLabels();dirty=false;}
 animationFrame=requestAnimationFrame(animate);
 let start=null,dragged=false;canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;start={x:e.clientX,y:e.clientY,theta,phi};dragged=false;canvas.setPointerCapture(e.pointerId);});canvas.addEventListener('pointermove',e=>{if(!start)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;if(Math.hypot(dx,dy)>7)dragged=true;theta=start.theta-dx*.005;phi=Math.max(.35,Math.min(1.15,start.phi+dy*.003));dirty=true;});
 const ray=new T.Raycaster();canvas.addEventListener('pointerup',e=>{if(!start)return;if(!dragged){const r=canvas.getBoundingClientRect();ray.setFromCamera(new T.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),camera);const hit=ray.intersectObjects(hits)[0];if(hit)onSelect(MathIslands.islands[hit.object.userData.island].id,true,hit.object.userData.mission??0);}start=null;});canvas.addEventListener('pointercancel',()=>{start=null;});canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();fallback('3D 顯示已暫停，改用平面選島，數學任務仍可使用。');cancelAnimationFrame(animationFrame);});
 document.getElementById('motion-toggle').setAttribute('aria-pressed',String(paused));document.getElementById('motion-toggle').textContent=paused?'恢復動態':'暫停動態';
 return {complete(id,m){const marker=markers.find(v=>v.id===id&&v.mission===m);if(marker){marker.orb.material=mat('#dba443');dirty=true;}},select(id,focus=true){active=focus?MathIslands.islands.findIndex(i=>i.id===id):null;document.getElementById('view-caption').textContent=flat?'點選島嶼，數學任務照常進行':focus?'點 1・2・3 任務燈 · 拖曳轉動':'拖曳轉動 · 點島靠岸';if(focus){goal.set(...[coordinates[active][0],1,coordinates[active][1]]);targetDistance=29;}else{goal.set(0,0,1);targetDistance=137;}dirty=true;},overview(){document.getElementById('view-caption').textContent=flat?'點選島嶼，數學任務照常進行':'拖曳轉動 · 點島靠岸';active=null;goal.set(0,0,1);targetDistance=137;theta=.28;phi=.78;dirty=true;},zoom(factor){targetDistance=Math.max(22,Math.min(180,targetDistance*factor));dirty=true;},toggleFlat(){flat=!flat;host.classList.toggle('flat',flat);labels.forEach(l=>{l.hidden=false;});document.getElementById('view-caption').textContent=flat?'點選島嶼，數學任務照常進行':'拖曳轉動 · 點島靠岸';dirty=true;return flat;},toggleMotion(){paused=!paused;dirty=true;return paused;}};
};
})();
