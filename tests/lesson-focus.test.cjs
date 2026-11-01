const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {parseHTML} = require('linkedom');

function classroom() {
  const {document, HTMLSelectElement, HTMLElement, Event, CustomEvent} = parseHTML('<html><body><select id="lesson-unit-quick-select"><option value="u3" selected>乘法</option></select><section id="tab-units" class="tab-pane active"></section><section id="tab-battle" class="tab-pane"></section><section id="tab-arcade" class="tab-pane"></section><section id="tab-practice" class="tab-pane"></section></body></html>');
  Object.defineProperty(HTMLSelectElement.prototype, 'value', {configurable:true, get(){return this.querySelector('option[selected]')?.getAttribute('value') || '';}, set(value){this.querySelectorAll('option').forEach(o=>o.toggleAttribute('selected',o.getAttribute('value')===value));}});
  HTMLElement.prototype.getBoundingClientRect = () => ({height:44});
  let observeEntries;
  const window = {addEventListener(){}, dispatchEvent(){}, scrollTo(){}, scrollX:0, scrollY:600};
  window.switchSpEdTab = target => {
    document.querySelectorAll('.tab-pane').forEach(p=>p.classList.toggle('active',p.id==='tab-'+target));
    document.dispatchEvent(new CustomEvent('math-tab-change'));
  };
  document.documentElement.requestFullscreen = async () => {document.fullscreenElement=document.documentElement;};
  document.exitFullscreen = async () => {document.fullscreenElement=null;};
  const context={window, document, Event, getComputedStyle:()=>({fontSize:'18px'}), IntersectionObserver:class {constructor(callback){observeEntries=callback;} observe(){} }};
  vm.runInNewContext(fs.readFileSync(require.resolve('../js/focus-mode.js'),'utf8'),context);
  document.dispatchEvent(new Event('DOMContentLoaded'));
  return {window, document, observeEntries:(row,top)=>observeEntries([{target:row,boundingClientRect:{top}}])};
}

test('a scrolled classroom entry remains pinned and returns to normal when its row is visible',()=>{
  const h=classroom(),row=h.document.querySelector('#tab-units .lesson-focus-entry');
  h.observeEntries(row,-100);assert.ok(row.classList.contains('is-pinned'));assert.equal(row.style.minHeight,'44px');
  h.observeEntries(row,100);assert.ok(!row.classList.contains('is-pinned'));
});

test('teachers can return from each activity to the same lesson without leaving fullscreen',async()=>{
  const h=classroom();await h.window.MathLessonFocus.toggle();
  const back=h.document.querySelector('.lesson-focus-return');assert.equal(back.hidden,true);
  for(const tab of ['battle','arcade','practice']){
    h.window.switchSpEdTab(tab);assert.equal(back.hidden,false);back.click();
    assert.ok(h.document.querySelector('#tab-units').classList.contains('active'));
    assert.equal(h.document.fullscreenElement,h.document.documentElement);
    assert.equal(h.document.querySelector('#lesson-unit-quick-select').value,'u3');
    assert.equal(back.hidden,true);
  }
});
