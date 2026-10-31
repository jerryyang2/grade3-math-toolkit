/* 海上航線在所有島嶼及橋梁的外側，避免小船穿島或穿橋。 */
(function(root){
'use strict';
const fleet=[{rx:42,rz:40,speed:.035,phase:0,color:'#d18e65'},{rx:46,rz:43,speed:-.028,phase:2.2,color:'#6f9f99'},{rx:51,rz:46,speed:.024,phase:4.6,color:'#c3a35d'},{rx:39,rz:42,speed:-.031,phase:1.2,color:'#9b8aaf'}];
function sample(route,seconds){const a=route.phase+seconds*route.speed,x=Math.cos(a)*route.rx,z=Math.sin(a)*route.rz,dx=-Math.sin(a)*route.rx*route.speed,dz=Math.cos(a)*route.rz*route.speed;return {x,z,heading:Math.atan2(dx,dz)};}
const cruise={rx:47,rz:44,speed:.045,phase:Math.PI*.7};
function nearResident(position,residents,radius=1.9){let result=null,best=radius;for(const r of residents){const d=Math.hypot(position.x-r.x,position.z-r.z);if(d<best){result=r;best=d;}}return result;}
const api={fleet,sample,cruise,nearResident};if(typeof module!=='undefined')module.exports=api;else root.MathIslandSeaLife=api;
})(typeof window!=='undefined'?window:globalThis);
