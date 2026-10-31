/* 固定按下時的攝影機，把滑鼠位移投影到海平面，讓拖曳像抓著地圖移動。 */
(function(root){
'use strict';
function panTarget(T,camera,origin,start,current){
 const plane=new T.Plane(new T.Vector3(0,1,0),0),ray=new T.Raycaster();
 function hit(point){ray.setFromCamera(new T.Vector2(point.x,point.y),camera);return ray.ray.intersectPlane(plane,new T.Vector3());}
 const a=hit(start),b=hit(current);if(!a||!b)return {x:origin.x,y:origin.y,z:origin.z};
 return {x:Math.max(-70,Math.min(70,origin.x+a.x-b.x)),y:origin.y,z:Math.max(-70,Math.min(70,origin.z+a.z-b.z))};
}
const api={panTarget};if(typeof module!=='undefined')module.exports=api;else root.MathIslandMapCamera=api;
})(typeof window!=='undefined'?window:globalThis);
