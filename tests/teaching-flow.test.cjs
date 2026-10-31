const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {parseHTML}=require('linkedom');
function lesson(){
 const {document,HTMLSelectElement,HTMLElement,Event,CustomEvent}=parseHTML(fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'));
 Object.defineProperty(HTMLSelectElement.prototype,'value',{configurable:true,get(){return this.querySelector('option[selected]')?.getAttribute('value')??this.querySelector('option')?.getAttribute('value')??'';},set(value){this.querySelectorAll('option').forEach(o=>{if(o.getAttribute('value')===String(value))o.setAttribute('selected','');else o.removeAttribute('selected');});}});
 let focus=null;Object.defineProperty(document,'activeElement',{get:()=>focus});HTMLElement.prototype.focus=function(){focus=this;};HTMLElement.prototype.scrollIntoView=function(){};
 const saved=new Map(),speech=[],pending=[];let stopped=0,closedTools=0;
 const audio=new Proxy({speak(text,voice,callback){speech.push(text);if(callback)pending.push(callback);},stopSpeech(){stopped++;}},{get:(o,k)=>o[k]||(()=>{})});
 const context={document,window:{addEventListener(){},scrollTo(){},spEdAudio:audio,MathToolbox:{close(){closedTools++;}},MathFloatingTools:{open(){},close(){closedTools++;}},matchMedia:()=>({matches:true}),StudentBank:{getStudents:()=>[{id:1,name:'示例甲',avatar:'●'}],addStar(){}}},localStorage:{getItem:k=>saved.get(k)??null,setItem:(k,v)=>saved.set(k,v)},CustomEvent,Event,setTimeout,clearTimeout,requestAnimationFrame:fn=>fn(),console};
 context.window.window=context.window;vm.createContext(context);
 for(const file of ['data','place-value-lab','hands-on-tools','manipulatives','geometry-shapes','worksheet-visual-data','worksheet-visual-supports','worksheet-diagrams','practice-session','learning-records','app'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/'+file+'.js'),'utf8'),context,{filename:file+'.js'});
 document.dispatchEvent(new Event('DOMContentLoaded'));
 function choose(id,value){const node=document.getElementById(id);node.value=value;node.dispatchEvent(new Event('change',{bubbles:true}));}
 function click(selector){const node=document.querySelector(selector);assert.ok(node,selector);assert.ok(!node.disabled,selector+' must be enabled');node.click();}
 return {document,choose,click,speech,pending,stopped:()=>stopped,closedTools:()=>closedTools,window:context.window};
}
test('switching between geometry, division, fractions and circle removes unrelated tools but retains intentional comparisons',()=>{
 const h=lesson();h.click('[data-tab="sandbox"]');
 for(const unit of ['u5','u6','u7','u8','u9','u5','u8','u4']){
  h.choose('sandbox-unit-select',unit);const host=h.document.getElementById('sandbox-stage');
  assert.equal(host.querySelectorAll('.shape-comparison-tool').length,unit==='u5'?1:0,unit);
  assert.equal(host.querySelectorAll('.fraction-compare-details').length,unit==='u8'?1:0,unit);
  assert.equal(host.querySelectorAll('.ho-tool').length,unit==='u8'?2:1,unit);
 }
});
test('practice images, speech, error feedback and solution playback work together without counting read-aloud as math support',()=>{
 const h=lesson();h.click('[data-tab="practice"]');h.choose('practice-student-select','1');
 assert.equal(h.document.querySelector('#practice-question-figure figure').dataset.wsFigure,'p1_1_1');
 h.click('#practice-read-options');assert.ok(h.speech.at(-1).includes('A，3001 個'));assert.equal(h.document.getElementById('practice-support').value,'independent');
 h.click('#practice-options [data-index="1"]');assert.equal(h.document.getElementById('practice-support').value,'prompted');
 h.click('#btn-feedback-solution-wrong');assert.ok(h.document.querySelector('#btn-ladder-auto-play'));
 h.click('#practice-read-options');const beforeRead=h.document.querySelector('#practice-ladder-box').textContent;h.pending.forEach(fn=>fn());assert.equal(h.document.querySelector('#practice-ladder-box').textContent,beforeRead,'reading choices cancels pending solution callbacks');
 h.click('#practice-stop-reading');const text=h.document.querySelector('#practice-ladder-box').textContent;
 h.pending.forEach(fn=>fn());assert.equal(h.document.querySelector('#practice-ladder-box').textContent,text,'stopped narration cannot reveal another step');
 h.click('#btn-practice-retry');h.click('#practice-options [data-index="0"]');h.click('#btn-feedback-solution-correct');assert.ok(h.speech.length>1);
});
test('round recap retains skipped questions and routes supported work into review without duplicate rewards',()=>{
 const h=lesson();h.click('[data-tab="practice"]');h.choose('practice-student-select','1');h.choose('practice-length','3');
 h.click('#practice-options [data-index="1"]');h.click('#btn-practice-retry');h.click('#practice-options [data-index="0"]');
 h.click('#btn-practice-next');h.click('#btn-practice-next');h.click('#btn-practice-next');
 assert.match(h.document.getElementById('practice-feedback').textContent,/已作答 1 \/ 3 題；還有 2 題尚未作答/);
 assert.equal(h.document.activeElement.id,'round-summary-title');h.click('#practice-return-unanswered');assert.ok(h.document.getElementById('practice-meta-badge').textContent.includes('第 2 / 3 題'));
 h.click('#btn-practice-next');h.click('#btn-practice-next');h.click('#practice-review');assert.ok(h.document.getElementById('practice-meta-badge').textContent.includes('第 1 / 1 題'));
 h.click('#practice-options [data-index="0"]');assert.match(h.document.getElementById('practice-feedback').textContent,/本題已領過星星/);
 h.click('#btn-practice-next');assert.match(h.document.getElementById('practice-feedback').textContent,/已作答 1 \/ 3 題；還有 2 題尚未作答/);
 h.click('[data-tab="iep"]');assert.match(h.document.getElementById('learning-records-dashboard').textContent,/支持後完成 1/);
 h.click('[data-review-section][data-target="teach"]');assert.ok(h.document.getElementById('tab-units').classList.contains('active'));
});

test('switching into practice closes both drawing palettes while keeping their launchers available',()=>{
 const h=lesson();const before=h.closedTools();h.click('[data-tab="practice"]');assert.equal(h.closedTools(),before+2);
 h.click('[data-tab="sandbox"]');assert.equal(h.closedTools(),before+2);
});
