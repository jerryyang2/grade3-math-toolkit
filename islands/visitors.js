/* 訪客姓名、位置與護照只儲存在目前瀏覽器，不傳送至伺服器。 */
(function(root){
'use strict';
const C=typeof module!=='undefined'?require('./curriculum.js'):root.MathIslands;
const colors=['#508c7a','#de8a58','#5e83b0','#9f79a8'];
const key='slow-math-visitors-v2';
const nameOf=value=>Array.from(String(value??'').normalize('NFC').replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g,'').trim()).slice(0,16).join('');
const idOf=()=>root.crypto?.randomUUID?.()||`v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`;
function cleanVisitor(v){if(!v||typeof v.id!=='string'||!/^[-\w]{1,80}$/.test(v.id)||!nameOf(v.name))return null;return {id:v.id,name:nameOf(v.name),color:colors.includes(v.color)?v.color:colors[0],progress:C.readProgress(JSON.stringify(v.progress)),islandId:/^u[1-9]$/.test(v.islandId)?v.islandId:'u1',position:Number.isFinite(v.position?.x)&&Number.isFinite(v.position?.z)&&Math.abs(v.position.x)<40&&Math.abs(v.position.z)<40?{x:v.position.x,z:v.position.z}:null};}
function create(storage){
 let saved=true,data,raw;
 try{raw=storage.getItem(key);const parsed=JSON.parse(raw);if(parsed?.version===2&&Array.isArray(parsed.visitors)){const ids=new Set();const visitors=parsed.visitors.slice(0,60).map(cleanVisitor).filter(v=>v&&!ids.has(v.id)&&ids.add(v.id));if(visitors.length)data={version:2,activeId:visitors.some(v=>v.id===parsed.activeId)?parsed.activeId:visitors[0].id,visitors};}}catch{saved=false;}
 if(!data){let progress={};try{progress=C.readProgress(storage.getItem('slow-math-islands-v1'));}catch{saved=false;}const visitor={id:idOf(),name:root.MathI18n?.language==='en'?'Visitor 1':'訪客 1',color:colors[0],progress,islandId:'u1',position:null};data={version:2,activeId:visitor.id,visitors:[visitor]};}
 function save(){try{storage.setItem(key,JSON.stringify(data));saved=true;}catch{saved=false;}return saved;}
 const active=()=>data.visitors.find(v=>v.id===data.activeId);
 function unique(name,except){return !data.visitors.some(v=>v.id!==except&&v.name===name);}
 function validate(value,except){const name=nameOf(value);if(!name)throw new Error('請填寫訪客姓名。');if(Array.from(String(value).trim()).length>16)throw new Error('姓名最多 16 個字。');if(!unique(name,except))throw new Error('已有同名訪客，請切換該訪客，或使用不同稱呼。');return name;}
 save();
 return {list:()=>data.visitors,active,saved:()=>saved,save,
 add(value,color=colors[0]){if(data.visitors.length>=60)throw new Error('這台裝置已建立 60 位訪客。');const name=validate(value);const visitor={id:idOf(),name,color:colors.includes(color)?color:colors[0],progress:{},islandId:'u1',position:null};data.visitors.push(visitor);data.activeId=visitor.id;save();return visitor;},
 rename(value,color){const v=active();v.name=validate(value,v.id);if(colors.includes(color))v.color=color;save();return v;},
 switchTo(id){if(!data.visitors.some(v=>v.id===id))return null;data.activeId=id;save();return active();},
 record(progress){active().progress=C.readProgress(JSON.stringify(progress));return save();},
 locate(position,islandId){if(Number.isFinite(position?.x)&&Number.isFinite(position?.z))active().position={x:position.x,z:position.z};if(/^u[1-9]$/.test(islandId))active().islandId=islandId;return save();}
 };
}
const api={key,colors,nameOf,create};if(typeof module!=='undefined')module.exports=api;else root.MathIslandVisitors=api;
})(typeof window!=='undefined'?window:globalThis);
