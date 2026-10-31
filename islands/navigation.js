/* 共用的連島路網、步行碰撞與尋路；世界顯示與角色移動使用同一份幾何。 */
(function(root){
'use strict';
const coordinates=[[-23,-21],[0,-22],[23,-21],[-25,1],[0,0],[25,1],[-23,23],[0,24],[23,23]];
const links=[[0,1],[1,2],[3,4],[4,5],[6,7],[7,8],[0,3],[1,4],[2,5],[3,6],[4,7],[5,8]];
const point=(x,z)=>({x,z});
const landing={id:'landing',name:'登島碼頭',position:point(-32,-9),width:6,depth:5};
function distanceToSegment(p,a,b){const dx=b.x-a.x,dz=b.z-a.z,length=dx*dx+dz*dz;const t=length?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/length)):0;return Math.hypot(p.x-a.x-t*dx,p.z-a.z-t*dz);}
function layout(){
 const plazas=coordinates.map(([x,z])=>point(x,z+3.6));
 const east=coordinates.map(([x,z])=>point(x+4.4,z+2.7));
 const west=coordinates.map(([x,z])=>point(x-4.4,z+2.7));
 const north=coordinates.map(([x,z])=>point(x+4.4,z-2.7));
 const roads=coordinates.flatMap((_,i)=>[{a:plazas[i],b:east[i],width:1.9},{a:plazas[i],b:west[i],width:1.9},{a:east[i],b:north[i],width:1.9}]);
 const bridges=links.map(([a,b],i)=>({id:`bridge-${i+1}`,from:`u${a+1}`,to:`u${b+1}`,a:east[a],b:b-a===1?west[b]:north[b],width:2.1}));
 roads.push({a:{...landing.position},b:point(-30,-10.5),width:2.4});
 bridges.push({id:'landing-bridge',from:'landing',to:'u1',a:point(-30,-10.5),b:west[0],width:2.6});
 return {plazas,roads,bridges,landing};
}
function create(obstacles=[]){
 const map=layout(),segments=[...map.roads,...map.bridges],step=.5;
 function islandAt(p){const i=coordinates.findIndex(([x,z])=>((p.x-x)/5.95)**2+((p.z-z)/4.95)**2<=1);return i<0?null:`u${i+1}`;}
 function blocked(p){return obstacles.some(o=>o.radius?Math.hypot(p.x-o.x,p.z-o.z)<o.radius+.28:Math.abs(p.x-o.x)<o.width/2+.28&&Math.abs(p.z-o.z)<o.depth/2+.28);}
 function atLanding(p){return Number.isFinite(p?.x)&&Number.isFinite(p?.z)&&Math.abs(p.x-landing.position.x)<=landing.width/2-.23&&Math.abs(p.z-landing.position.z)<=landing.depth/2-.23;}
 function walkable(p){return Number.isFinite(p?.x)&&Number.isFinite(p?.z)&&!blocked(p)&&(atLanding(p)||!!islandAt(p)||segments.some(s=>distanceToSegment(p,s.a,s.b)<=s.width/2-.23));}
 function clear(a,b){const n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.12));for(let j=0;j<=n;j++)if(!walkable(point(a.x+(b.x-a.x)*j/n,a.z+(b.z-a.z)*j/n)))return false;return true;}
 function move(p,dx,dz){let next={...p};const n=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.12));for(let i=0;i<n;i++){const both=point(next.x+dx/n,next.z+dz/n);if(walkable(both))next=both;else{const x=point(next.x+dx/n,next.z),z=point(next.x,next.z+dz/n);if(walkable(x))next=x;if(walkable(point(next.x,z.z)))next.z=z.z;}}return next;}
 function near(p){let best=null,distance=Infinity;const cx=Math.round(p.x/step),cz=Math.round(p.z/step);for(let x=cx-4;x<=cx+4;x++)for(let z=cz-4;z<=cz+4;z++){const q=point(x*step,z*step),d=Math.hypot(q.x-p.x,q.z-p.z);if(d<distance&&walkable(q)&&(!walkable(p)||clear(p,q))){distance=d;best=q;}}return distance<=2?best:null;}
 function route(start,end){
  if(!walkable(start))return [];const a=near(start),b=near(end);if(!a||!b||!walkable(end))return [];
  if(clear(start,end))return [{...end}];
  const key=p=>`${Math.round(p.x/step)},${Math.round(p.z/step)}`,queue=[a],previous=new Map([[key(a),null]]),points=new Map([[key(a),a]]);let head=0,found=false;
  while(head<queue.length&&head<25000){const p=queue[head++],k=key(p);if(k===key(b)){found=true;break;}for(const [dx,dz]of [[step,0],[-step,0],[0,step],[0,-step]]){const q=point(p.x+dx,p.z+dz),qk=key(q);if(previous.has(qk)||!walkable(q)||!clear(p,q))continue;previous.set(qk,k);points.set(qk,q);queue.push(q);}}
  if(!found)return [];const path=[end];let k=key(b);while(k!==null){path.push(points.get(k));k=previous.get(k);}path.push(start);path.reverse();
  const smooth=[];let i=0;while(i<path.length-1){let j=path.length-1;while(j>i+1&&!clear(path[i],path[j]))j--;smooth.push(path[j]);i=j;}return smooth;
 }
 function surface(p){const island=islandAt(p);if(island)return {islandId:island,bridgeId:null};return {islandId:null,landing:atLanding(p),bridgeId:map.bridges.find(b=>distanceToSegment(p,b.a,b.b)<b.width/2)?.id||null};}
 return {...map,walkable,clear,move,route,islandAt,surface,blocked,atLanding};
}
const api={coordinates,links,landing,layout,create,distanceToSegment};if(typeof module!=='undefined')module.exports=api;else root.MathIslandNavigation=api;
})(typeof window!=='undefined'?window:globalThis);
