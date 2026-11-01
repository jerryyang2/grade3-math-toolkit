const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {parseHTML}=require('linkedom');
function classroom(fallback=false){
 const {document,HTMLSelectElement,HTMLElement,Event,CustomEvent}=parseHTML('<html><body><select id="lesson-unit-quick-select"><option value="u1">位值</option><option value="u3" selected>乘法</option></select><main id="main-content-area"><section id="tab-units" class="tab-pane active"></section><section id="tab-practice" class="tab-pane"><select id="practice-unit-select"><option value="u1" selected>位值</option><option value="u3">乘法</option><option value="s3_1">乘法小節</option></select><input id="unfinished-answer" value="12"></section><section id="tab-battle" class="tab-pane"></section><section id="tab-arcade" class="tab-pane"></section><section id="tab-islands" class="tab-pane"><iframe id="lesson-island-frame"></iframe><a id="lesson-island-external"></a></section></main></body></html>');
 Object.defineProperty(HTMLSelectElement.prototype,'value',{configurable:true,get(){return this.querySelector('option[selected]')?.getAttribute('value')||'';},set(value){this.querySelectorAll('option').forEach(o=>o.toggleAttribute('selected',o.getAttribute('value')===value));}});
 HTMLElement.prototype.getBoundingClientRect=()=>({height:44});
 let observeEntries;const handlers={},messages=[];
 const frameWindow={postMessage(message){messages.push(message);}};Object.defineProperty(document.querySelector("#lesson-island-frame"),"contentWindow",{value:frameWindow});
 const window={NANI_G3S1_DATA:{units:[{id:'u3',sections:[{id:'s3_1'}]}]},addEventListener(type,fn){handlers[type]=fn;},dispatchEvent(){},scrollTo(){},scrollX:0,scrollY:600};
 window.switchSpEdTab=target=>{document.querySelectorAll('.tab-pane').forEach(p=>p.classList.toggle('active',p.id==='tab-'+target));document.dispatchEvent(new CustomEvent('math-tab-change'));};
 document.documentElement.requestFullscreen=async()=>{if(fallback)throw Error("Unavailable");document.fullscreenElement=document.documentElement;};document.exitFullscreen=async()=>{document.fullscreenElement=null;};
 const context={window,document,Event,location:{origin:'https://example.invalid'},getComputedStyle:()=>({fontSize:'18px'}),IntersectionObserver:class{constructor(callback){observeEntries=callback;}observe(){}}};
 vm.createContext(context);for(const file of ['lesson-flow','focus-mode'])vm.runInContext(fs.readFileSync(require.resolve('../js/'+file+'.js'),'utf8'),context);
 document.dispatchEvent(new Event('DOMContentLoaded'));
 return {window,document,Event,handlers,messages,frameWindow,observeEntries:(row,top)=>observeEntries([{target:row,boundingClientRect:{top}}])};
}
test('a scrolled classroom entry stays pinned and returns to its row',()=>{
 const h=classroom(),row=h.document.querySelector('#tab-units .lesson-focus-entry');h.observeEntries(row,-100);assert.ok(row.classList.contains('is-pinned'));assert.equal(row.style.minHeight,'44px');h.observeEntries(row,100);assert.ok(!row.classList.contains('is-pinned'));
});
test('five steps use the main-menu order and allocate exactly forty minutes',()=>{
 const h=classroom();assert.deepEqual(Array.from(h.document.querySelectorAll('[data-lesson-step]'),b=>b.dataset.lessonStep),['units','practice','battle','arcade','islands']);assert.equal(h.window.MathLessonFlow.steps.reduce((n,s)=>n+s[3],0),40);
});
test('all four activities return to the same unit without leaving fullscreen',async()=>{
 const h=classroom();await h.window.MathLessonFocus.toggle();
 for(const tab of ['practice','battle','arcade','islands']){
  h.window.MathLessonFlow.go(tab);assert.equal(h.document.querySelector('[aria-current="step"]').dataset.lessonStep,tab);
  h.document.querySelector('[data-lesson-step="units"]').click();assert.ok(h.document.querySelector('#tab-units').classList.contains('active'));assert.equal(h.document.fullscreenElement,h.document.documentElement);assert.equal(h.document.querySelector('#lesson-unit-quick-select').value,'u3');
 }
});
test('practice follows the teaching unit and preserves matching subsections and unfinished answers',()=>{
 const h=classroom(),select=h.document.querySelector('#practice-unit-select');let changes=0;select.addEventListener('change',()=>changes++);
 h.window.MathLessonFlow.go('practice');assert.equal(select.value,'u3');assert.equal(changes,1);select.value='s3_1';h.window.MathLessonFlow.go('units');h.window.MathLessonFlow.go('practice');assert.equal(select.value,'s3_1');assert.equal(changes,1);assert.equal(h.document.querySelector('#unfinished-answer').value,'12');
});
test('island is loaded only on demand and keeps its frame on same-unit round trips',()=>{
 const h=classroom(),frame=h.document.querySelector('#lesson-island-frame');assert.equal(frame.getAttribute('src'),null);h.window.MathLessonFlow.go('islands');assert.equal(frame.getAttribute('src'),'islands/index.html?lesson=u3');let loads=0;const original=frame.setAttribute.bind(frame);frame.setAttribute=(name,value)=>{if(name==='src')loads++;original(name,value);};h.window.MathLessonFlow.go('units');h.window.MathLessonFlow.go('islands');assert.equal(loads,0);h.document.querySelector('#lesson-unit-quick-select').value='u1';h.window.MathLessonFlow.go('islands');assert.equal(frame.getAttribute('src'),'islands/index.html?lesson=u1');
});

test('island messages require the embedded frame and same origin',()=>{
 const h=classroom();h.window.MathLessonFlow.go('islands');
 for(const event of [{origin:'https://other.invalid',source:h.frameWindow},{origin:'https://example.invalid',source:{}}]){
  h.handlers.message({...event,data:{type:'math-lesson-return',unit:'u1'}});assert.ok(h.document.querySelector('#tab-islands').classList.contains('active'));
 }
 h.handlers.message({origin:'https://example.invalid',source:h.frameWindow,data:{type:'math-lesson-return',unit:'u1'}});assert.ok(h.document.querySelector('#tab-units').classList.contains('active'));assert.equal(h.document.querySelector('#lesson-unit-quick-select').value,'u1');assert.equal(h.messages.at(-1).visible,false);
});
test('fullscreen fallback keeps five-step navigation and cleans it up on exit',async()=>{
 const h=classroom(true);await h.window.MathLessonFocus.toggle();assert.ok(h.document.documentElement.classList.contains('lesson-focus-fallback'));assert.equal(h.window.MathLessonFlow.panel.hidden,false);h.window.MathLessonFlow.go('practice');h.window.MathLessonFlow.go('units');assert.ok(h.document.body.classList.contains('lesson-focus'));await h.window.MathLessonFocus.toggle();assert.ok(!h.document.body.classList.contains('lesson-focus'));assert.equal(h.window.MathLessonFlow.panel.hidden,true);assert.equal(h.window.MathLessonFlow.panel.parentElement.id,'main-content-area');
});
