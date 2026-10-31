const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {parseHTML}=require('linkedom');
const {create,key}=require('../js/i18n.js');
const catalog=require('../js/i18n-en.js');
const C=require('../islands/curriculum.js');
const T=require('../islands/teaching.js');

test('Traditional Chinese is the first-visit default; language persists independently of learner data',()=>{
  const values=new Map([['math-stars','17']]);
  const storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
  const app=create(catalog,{storage});assert.equal(app.language,'zh-Hant');
  app.setLanguage('zh-Hant');assert.equal(create(catalog,{storage}).language,'zh-Hant');
  assert.equal(values.get('math-stars'),'17');app.setLanguage('en');assert.equal(create(catalog,{storage}).language,'en');
  assert.equal(app.setLanguage('fr'),false);assert.equal(values.get(key),'en');
});
test('blocked/corrupt preference storage still permits English and Chinese switching',()=>{
  const app=create(catalog,{storage:{getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}}});
  assert.equal(app.language,'zh-Hant');app.setLanguage('en');assert.equal(app.t('課堂教學'),'Teach a Lesson');app.setLanguage('zh-Hant');assert.equal(app.t('課堂教學'),'課堂教學');
  assert.equal(create(catalog,{storage:{getItem:()=>'<invalid>'}}).language,'zh-Hant');
});
test('dynamic math text retains numbers, full sentence structure, and protected teacher text',()=>{
  const app=create(catalog);app.setLanguage('en');
  assert.equal(app.t('第 5 題'),'Question 5');
  assert.match(app.t('看圖，在千位放入3張1000元鈔票。'),/3.*1[,.]?000/);
  assert.equal(app.t('三千二百五十四'),'three thousand two hundred fifty-four');
  assert.doesNotMatch(app.t('先找到量筒的0，再找到1000毫升刻度。1000毫升就是1公升。量筒水位0毫升，每小格50毫升'),/[\u3400-\u9fff]/);
  assert.match(app.t('學生姓名／代號：小明',['小明']),/小明/);
  app.setLanguage('zh-Hant');assert.equal(app.t('看圖，在千位放入3張1000元鈔票。'),'看圖，在千位放入3張1000元鈔票。');
});
test('all island random task prompts, hints, explanations, and teaching steps have English copy',()=>{
  const app=create(catalog);app.setLanguage('en');
  for(const unit of C.islands)for(let mission=0;mission<3;mission++)for(const seed of [0,.13,.57,.99]){
    const task=C.task(unit.id,mission,()=>seed);
    for(const text of [task.prompt,task.hint,C.solution(task),...T.steps(task).flatMap(s=>[s.title,s.text,s.formula])].filter(Boolean))
      assert.doesNotMatch(app.t(text),/[\u3400-\u9fff]/u,`${unit.id}: ${text}`);
  }
});

function page(){
  const {window,document}=parseHTML('<!doctype html><html><head><title>課堂教學</title></head><body><div class="header-tools"></div><p id="copy">課堂教學</p><button id="next" title="下一題">下一題</button><select id="level"><option>基礎觀念</option></select><p translate="no" id="name">小明</p><textarea id="notes">我的觀察</textarea><div id="live"></div></body></html>');
  // Linkedom intentionally omits a writable select.value; real Chrome supplies it.
  for(const select of document.querySelectorAll('select'))Object.defineProperty(select,'value',{value:select.textContent,writable:true});
  const storage=new Map([[key,'en']]);const w={document,MathEnglishCatalog:catalog,localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},location:{href:'https://example.invalid/project/index.html'},addEventListener(){}};
  // The control is intentionally pre-mounted for a small DOM test without a browser engine.
  const label=document.createElement('label');label.setAttribute('translate','no');label.innerHTML='<select data-language-select><option value="en">English</option><option value="zh-Hant">繁體中文</option></select>';document.body.append(label);
  Object.defineProperty(label.querySelector('select'),'value',{value:'en',writable:true});
  vm.runInNewContext(fs.readFileSync('js/i18n.js','utf8'),{window:w,URL,MutationObserver:window.MutationObserver,CustomEvent:window.CustomEvent});
  return {document,api:w.MathI18n};
}
test('DOM switching is reversible and preserves option values, names, notes, handlers, and new content',async()=>{
  const {document,api}=page();const next=document.querySelector('#next');let clicks=0;next.onclick=()=>clicks++;
  assert.equal(document.documentElement.lang,'en');assert.equal(document.title,'Teach a Lesson');
  assert.equal(document.querySelector('#level option').getAttribute('value'),'基礎觀念');
  assert.equal(document.querySelector('#name').textContent,'小明');assert.equal(document.querySelector('#notes').textContent,'我的觀察');
  next.click();assert.equal(clicks,1);
  document.querySelector('#live').innerHTML='<button>第 7 題</button>';
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(document.querySelector('#live button').textContent,'Question 7');
  api.setLanguage('zh-Hant');assert.equal(document.querySelector('#copy').textContent,'課堂教學');assert.equal(document.querySelector('#live button').textContent,'第 7 題');
  api.setLanguage('en');assert.equal(document.querySelector('#copy').textContent,'Teach a Lesson');assert.equal(document.querySelector('#live button').textContent,'Question 7');
  assert.equal(document.querySelector('#level option').getAttribute('value'),'基礎觀念');
});

test('ruby questions translate as complete sentences and restore without resetting adjacent answers',async()=>{
  const {document,api}=page();
  document.querySelector('#live').innerHTML='<p data-i18n-rich>看<ruby>圖<rt>ㄊㄨˊ</rt></ruby>，在千位放入1張1000元鈔票。</p><input aria-label="被加數" placeholder="下一題" value="我的答案">';
  await new Promise(resolve=>setImmediate(resolve));
  const field=document.querySelector('#live input');
  assert.doesNotMatch(document.querySelector('[data-i18n-rich]').textContent,/[\u3400-\u9fff]/);
  assert.equal(field.value,'我的答案');assert.equal(field.placeholder,'Next Question');assert.notEqual(field.getAttribute('aria-label'),'被加數');
  api.setLanguage('zh-Hant');assert.equal(document.querySelector('ruby rt').textContent,'ㄊㄨˊ');assert.equal(field.value,'我的答案');
  api.setLanguage('en');assert.equal(document.querySelector('[data-i18n-rich] ruby'),null);assert.equal(field.value,'我的答案');
});
