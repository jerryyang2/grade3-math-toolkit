const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {parseHTML}=require('linkedom');
function setup(native=false,lesson=false){
 const {document,Event}=parseHTML('<html><body><select id="lesson-unit-quick-select"><option value="u8" selected>分數</option></select><section id="tab-arcade" class="active"><div id="arcade-player-modal" style="display:none"><div class="arcade-player-card"><div class="arcade-player-header"><button id="arcade-fullscreen-toggle"></button><button onclick="window.closeArcadePlayer()">close</button></div><iframe id="arcade-game-frame"></iframe></div></div><div class="arcade-card"><h3 class="arcade-card-title">森林拔河</h3><div class="arcade-card-actions"><button data-grade3-tug></button><a id="grade3-tug-external" href="games/game6-grade3-tug/index.html"></a></div></div></section></body></html>');
 const stage=document.querySelector('#arcade-player-modal'),frame=document.querySelector('iframe'),messages=[],handlers={};let launches=0;
 const child={postMessage:m=>messages.push(m)};Object.defineProperty(frame,'contentWindow',{value:child});
 if(lesson)document.fullscreenElement=document.documentElement;
 let requests=0;stage.requestFullscreen=async()=>{requests++;if(!native)throw Error('unsupported');document.fullscreenElement=stage;};document.exitFullscreen=async()=>{document.fullscreenElement=lesson?document.documentElement:null;document.dispatchEvent(new Event('fullscreenchange'));};
 const window={addEventListener:(key,fn)=>handlers[key]=fn,launchArcadeGame(url){launches++;frame.src=url;stage.style.display='block';}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../js/arcade-fullscreen.js'),'utf8'),{document,window,location:{origin:'https://example.invalid'}});document.dispatchEvent(new Event('DOMContentLoaded'));
 return {document,stage,frame,child,messages,handlers,requests:()=>requests,launches:()=>launches};
}
const settle=()=>new Promise(resolve=>setImmediate(resolve));
test('card launches fullscreen and exit/re-entry preserves the same iframe and game state',async()=>{
 const h=setup();h.document.body.style.overflow='auto';h.document.querySelector('.arcade-fullscreen-entry').click();await settle();
 assert.ok(h.stage.classList.contains('arcade-stage-full'));const url=h.frame.getAttribute('src');assert.ok(url.includes('unit=u8'));
 h.document.querySelector('#arcade-fullscreen-toggle').click();await settle();assert.ok(!h.stage.classList.contains('arcade-stage-full'));assert.equal(h.document.body.style.overflow,'auto');
 h.document.querySelector('.arcade-fullscreen-entry').click();await settle();assert.equal(h.launches(),1);assert.equal(h.frame.getAttribute('src'),url);
});
test('fullscreen inside a lesson preserves the teacher document fullscreen on exit',async()=>{
 const h=setup(true,true);h.document.querySelector('.arcade-fullscreen-entry').click();await settle();assert.equal(h.requests(),0);
 h.document.querySelector('#arcade-fullscreen-toggle').click();await settle();assert.equal(h.document.fullscreenElement,h.document.documentElement);assert.ok(!h.stage.classList.contains('arcade-stage-full'));
});
test('only the same-origin active game frame can request fullscreen',async()=>{
 const h=setup(true);h.handlers.message({origin:'https://else.invalid',source:h.child,data:{type:'math-game-fullscreen'}});assert.equal(h.requests(),0);
 h.handlers.message({origin:'https://example.invalid',source:{},data:{type:'math-game-fullscreen'}});assert.equal(h.requests(),0);
 h.handlers.message({origin:'https://example.invalid',source:h.child,data:{type:'math-game-fullscreen'}});await settle();assert.equal(h.document.fullscreenElement,h.stage);
 h.document.querySelector('#arcade-fullscreen-toggle').click();await settle();assert.equal(h.document.fullscreenElement,null);
});

test('standalone game entry follows a unit changed by another lesson selector',()=>{
 const h=setup(),select=h.document.querySelector('#lesson-unit-quick-select'),link=h.document.querySelector('#grade3-tug-external');
 select.innerHTML='<option value="u9" selected>circle</option>';link.click();
 assert.ok(link.getAttribute('href').includes('unit=u9'));
});
