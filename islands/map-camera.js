/* 以按下時的攝影機投影拖曳位移；平視時使用垂直平面，避免地平線射線失效。 */
(function(root){
'use strict';
function panTarget(T,camera,origin,start,current){
 const direction=camera.getWorldDirection(new T.Vector3()),level=Math.abs(direction.y)<.2;
 const plane=level?new T.Plane().setFromNormalAndCoplanarPoint(direction,new T.Vector3(origin.x,origin.y,origin.z)):new T.Plane(new T.Vector3(0,1,0),0),ray=new T.Raycaster();
 function hit(point){ray.setFromCamera(new T.Vector2(point.x,point.y),camera);return ray.ray.intersectPlane(plane,new T.Vector3());}
 const a=hit(start),b=hit(current);if(!a||!b)return {x:origin.x,y:origin.y,z:origin.z};
 return {x:Math.max(-70,Math.min(70,origin.x+a.x-b.x)),y:level?Math.max(1.8,Math.min(12,origin.y+a.y-b.y)):origin.y,z:Math.max(-70,Math.min(70,origin.z+a.z-b.z))};
}
function preset(mode,following=false,aspect=1.3){
 if(!['bird','top','eye'].includes(mode))return null;
 return {phi:mode==='top'?.025:mode==='eye'?Math.PI/2:.52,theta:mode==='eye'?.45:.28,y:mode==='eye'?2.8:following?1:0,distance:mode==='eye'?(following?16:18):following?(mode==='top'?45:39):mode==='top'?(aspect<1.15?180:150):(aspect<1.15?155:135)};
}
function zoomDistance(distance,factor,mode){return Math.max(mode==='eye'?10:22,Math.min(mode==='eye'?60:180,distance*factor));}
const api={panTarget,preset,zoomDistance};if(typeof module!=='undefined')module.exports=api;else root.MathIslandMapCamera=api;
})(typeof window!=='undefined'?window:globalThis);
