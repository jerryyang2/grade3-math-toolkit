/* 名稱跟隨投影後的岸線下緣，旋轉或縮放後也不覆蓋島上地標。 */
(function(root){
'use strict';
function belowIsland(project,center,width,height,labelWidth){
 const points=[];
 for(let i=0;i<32;i++){const a=i*Math.PI/16;points.push(project(center[0]+Math.cos(a)*8.1,0,center[1]+Math.sin(a)*6.9));}
 points.push(project(center[0]-1,0,center[1]+9.3),project(center[0]+1,0,center[1]+9.3));
 const anchor=project(center[0],0,center[1]),bottom=Math.max(...points.map(p=>p.y)),half=labelWidth/2+5;
 return {x:Math.max(half,Math.min(width-half,anchor.x)),y:bottom+7,visible:anchor.z<1&&anchor.x>-labelWidth/2&&anchor.x<width+labelWidth/2&&bottom>-50&&bottom<height-12};
}
function belowDock(project,landing,width,labelWidth){
 const p=landing.position,corners=[];for(const dx of [-1,1])for(const dz of [-1,1])corners.push(project(p.x+dx*landing.width/2,0,p.z+dz*landing.depth/2));
 const anchor=project(p.x,0,p.z),half=labelWidth/2+5;
 return {x:Math.max(half,Math.min(width-half,anchor.x)),y:Math.max(...corners.map(p=>p.y))+7,visible:anchor.z<1};
}
const api={belowIsland,belowDock};if(typeof module!=='undefined')module.exports=api;else root.MathIslandMapLabels=api;
})(typeof window!=='undefined'?window:globalThis);
