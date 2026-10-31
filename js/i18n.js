/* Shared, offline localization. Canonical Chinese teaching data and saved answers stay unchanged. */
(function (root) {
  'use strict';
  const KEY = 'grade3-math-language';
  const normalize = text => String(text ?? '').replace(/\s+/g, ' ').trim();
  const han = /[\u3400-\u9fff]/u;
  const marker = /⟦[^⟧]*⟧/g;
  const escapeRegExp = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  function numberWords(n) {
    const small=['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
    if(n<20)return small[n];
    if(n<100)return ['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'][Math.floor(n/10)]+(n%10?'-'+small[n%10]:'');
    if(n<1000)return small[Math.floor(n/100)]+' hundred'+(n%100?' '+numberWords(n%100):'');
    return numberWords(Math.floor(n/1000))+' thousand'+(n%1000?' '+numberWords(n%1000):'');
  }
  function readChineseNumber(text) {
    if(!/^[零〇一二三四五六七八九十百千萬兩]+$/.test(text))return null;
    const digits={'零':0,'〇':0,'一':1,'二':2,'兩':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9};
    const units={'十':10,'百':100,'千':1000,'萬':10000};
    if(!/[十百千萬]/.test(text))return numberWords(Number([...text].map(c=>digits[c]).join('')));
    let sum=0,section=0,digit=0;
    for(const c of text)if(c in digits)digit=digits[c];else if(c==='萬'){sum+=(section+digit || 1)*10000;section=0;digit=0;}else{section+=(digit || 1)*units[c];digit=0;}
    return numberWords(sum+section+digit);
  }
  function create(catalog = {}, options = {}) {
    let language = 'en';
    try { if (options.storage?.getItem(KEY) === 'zh-Hant') language = 'zh-Hant'; } catch (_) {}
    const dictionary = new Map(Object.entries(catalog).map(([a,b]) => [normalize(a), b]));
    const patterns = [];
    const phrases = new Map();
    const cache = new Map();
    const protectedText = new Map();
    const restore = text => text.replace(/⟪USER\d+⟫/g,token=>protectedText.get(token) ?? token);
    for (const [source, target] of dictionary) {
      if (source.includes('⟦')) {
        const tokens = source.match(marker) || [];
        const literals = source.split(marker);
        if (!literals.some(s => han.test(s)) || new Set(tokens).size !== tokens.length) continue;
        const weight = literals.join('').length + literals[0].length*3;
        const expression=literals.map((literal,index)=>escapeRegExp(literal)+(index<tokens.length?
          ((index<tokens.length-1 && !literals[index+1]) || /^\s*(?:張|枚|個|份|盤|公分|毫米|毫升|公升|元|塊|片|條)(?:\b|[^a-zA-Z]|$)/.test(literals[index+1])?'([-−]?[0-9][0-9,./]*)':'([\\s\\S]*?)'):'' )).join('');
        patterns.push({ source, target, tokens, weight,
          regex: new RegExp('^' + expression + '$') });
      } else if (han.test(source)) {
        const first = source[0];
        if (!phrases.has(first)) phrases.set(first, []);
        phrases.get(first).push([source, target]);
      }
    }
    patterns.sort((a,b) => b.weight-a.weight);
    for (const list of phrases.values()) list.sort((a,b) => b[0].length-a[0].length);
    function english(input, depth = 0) {
      const text = normalize(input);
      if (!han.test(text)) return text;
      if (dictionary.has(text) && !text.includes('⟦')) return dictionary.get(text);
      const number=readChineseNumber(text);
      if(number)return number;
      if (depth < 5) for (const pattern of patterns) {
        const match = text.match(pattern.regex);
        if (!match || match.slice(1).some(s => normalize(s) === text)) continue;
        let result = pattern.target;
        const values = new Map();
        pattern.tokens.forEach((token, i) => { if (!values.has(token)) values.set(token, english(match[i+1], depth+1)); });
        result = result.replace(marker, token => values.get(token) ?? token);
        if (!han.test(result)) return result.replace(/\b(\d+) × (NT\$[\d,]+) (bill|coin)\(s\)/g,(_,n,value,unit)=>`${n} × ${value} ${unit}${Number(n)===1?'':'s'}`);
      }
      const prefix=phrases.get(text[0])?.find(([source])=>source.length>2 && /[。！？；]$/.test(source) && text.startsWith(source));
      if(depth<7 && prefix && prefix[0].length<text.length) return prefix[1]+' '+english(text.slice(prefix[0].length),depth+1);
      const sentences=text.match(/[^\u3002\uff01\uff1f\uff1b]+[\u3002\uff01\uff1f\uff1b]?|[\u3002\uff01\uff1f\uff1b]/g) || [];
      if (depth < 5 && sentences.length>1) {
        return sentences.map(part=>({'\u3002':'. ','\uff01':'! ','\uff1f':'? ','\uff1b':'; '}[part] ?? english(part,depth+1))).join(' ').trim();
      }
      // Generated paragraphs and adjacent labels use the same complete-phrase catalog.
      let result = '';
      for (let i=0; i<text.length;) {
        const item = phrases.get(text[i])?.find(([source]) => text.startsWith(source, i));
        if (item) { result += ' ' + item[1] + ' '; i += item[0].length; }
        else { result += text[i++]; }
      }
      return result.replace(/\s+/g,' ').replace(/\s+([,.;:!?])/g,'$1').trim();
    }
    function t(input, preserve = []) {
      const original = String(input ?? '');
      if (language !== 'en' || !han.test(original)) return restore(original);
      let text = original;
      const protectedValues = [];
      for (const value of preserve.filter(Boolean).sort((a,b) => String(b).length-String(a).length)) {
        const token = `⟪VALUE${protectedValues.length}⟫`;
        if (text.includes(value)) { text = text.split(value).join(token); protectedValues.push([token,value]); }
      }
      if (!cache.has(text)) {
        if (cache.size > 12000) cache.clear();
        // Preserve paragraph breaks in generated reports and copyable lesson prompts.
        cache.set(text, text.split(/(\n+)/).map(part => /^\n+$/.test(part) ? part : english(part)).join(''));
      }
      let result = cache.get(text);
      for (const [token,value] of protectedValues) result = result.split(token).join(value);
      const before = original.match(/^\s*/)[0], after = original.match(/\s*$/)[0];
      return restore(before + result.trim() + after);
    }
    function setLanguage(value, persist = true) {
      if (value !== 'en' && value !== 'zh-Hant') return false;
      language = value;
      if (persist) try { options.storage?.setItem(KEY,value); } catch (_) {}
      options.onChange?.(value);
      return true;
    }
    return {t, setLanguage, protect(value) {const token=`⟪USER${protectedText.size}⟫`;protectedText.set(token,String(value ?? ''));return token;}, get language() {return language;}, key:KEY};
  }
  if (typeof module !== 'undefined' && module.exports) { module.exports = {create, normalize, key:KEY}; return; }
  const doc = root.document;
  let storage;try {storage=root.localStorage;} catch (_) {}
  const api = create(root.MathEnglishCatalog, {storage, onChange:change});
  root.MathI18n = api;
  const sources = new WeakMap(), attributes = new WeakMap(), richSources = new WeakMap(), generated = new Map();
  const translatableAttributes = ['title','aria-label','aria-description','aria-valuetext','placeholder','alt','label'];
  const skipSelector = '[translate="no"], [data-i18n-skip], [contenteditable], .st-name, [data-sname], #active-visitor-name, #traveler-name, #passport-owner, .visitor-row strong, #certificate-art [data-user-name], .mft-overlay text, .math-board-surface text, [id^="glarity"], [class*="glarity"]';
  let observer;
  function skipped(node) {
    const el = node.nodeType === 1 ? node : node.parentElement;
    return !el || /^(SCRIPT|STYLE|NOSCRIPT|CODE)$/.test(el.tagName) || (node.nodeType===3 && /^(TEXTAREA|INPUT)$/.test(el.tagName)) || !!el.closest(skipSelector);
  }
  function translateNode(node) {
    if (skipped(node)) return;
    if (node.nodeType === 3) {
      const current = node.nodeValue;
      let record = sources.get(node);
      if (!record || current !== record.output) record = {source:current};
      record.output = api.t(record.source);
      sources.set(node,record);
      if (current !== record.output) node.nodeValue = record.output;
      const text=node.parentElement;
      if(text?.tagName?.toLowerCase()==='text' && text.closest('svg')?.getAttribute('viewBox')==='0 0 1200 850') {
        if(api.language==='en') {
          if(!text.hasAttribute('data-i18n-spacing'))text.setAttribute('data-i18n-spacing',text.getAttribute('letter-spacing') ?? '');
          text.setAttribute('letter-spacing','0');
          if(text.textContent.length*Number(text.getAttribute('font-size'))*.58>1080){text.setAttribute('textLength','1080');text.setAttribute('lengthAdjust','spacingAndGlyphs');text.setAttribute('data-i18n-fit','');}
        } else {
          if(text.hasAttribute('data-i18n-spacing')){const spacing=text.getAttribute('data-i18n-spacing');if(spacing)text.setAttribute('letter-spacing',spacing);else text.removeAttribute('letter-spacing');text.removeAttribute('data-i18n-spacing');}
          if(text.hasAttribute('data-i18n-fit')) {text.removeAttribute('textLength');text.removeAttribute('lengthAdjust');text.removeAttribute('data-i18n-fit');}
        }
      }
    } else if (node.nodeType === 1) {
      // An option without an explicit value otherwise changes its application value with its label.
      if (node.tagName === 'OPTION' && !node.hasAttribute('value')) node.setAttribute('value',node.textContent);
      let record = attributes.get(node);
      if (!record) {record={};attributes.set(node,record);}
      for (const name of translatableAttributes) {
        const current = node.getAttribute(name);
        if (current === null) continue;
        if (!record[name] || current !== record[name].output) record[name] = {source:current};
        const output = api.t(record[name].source);
        record[name].output = output;
        if (current !== output) node.setAttribute(name,output);
      }
      if (node.tagName === 'META' && node.name === 'description') {
        const current=node.content;
        if(!record.content || current!==record.content.output)record.content={source:current};
        record.content.output=api.t(record.content.source);node.content=record.content.output;
      }
    }
  }
  function translateTree(node) {
    if (!node || skipped(node)) return;
    translateNode(node);
    if(node.nodeType===1 && /^(TEXTAREA|INPUT)$/.test(node.tagName))return;
    // Translate explicitly marked, non-interactive question copy before ruby or
    // number highlighting splits a sentence into separate characters.
    if(node.nodeType===1 && node.hasAttribute('data-i18n-rich')) {
      let record=richSources.get(node);
      if(!record || node.innerHTML!==record.output)record={source:node.innerHTML};
      if(api.language==='en') {
        const copy=doc.createElement('div');copy.innerHTML=record.source;
        copy.querySelectorAll('rt,rp').forEach(el=>el.remove());
        node.textContent=api.t(copy.textContent);
      } else if(node.innerHTML!==record.source) node.innerHTML=record.source;
      record.output=node.innerHTML;richSources.set(node,record);return;
    }
    for (const child of node.childNodes || []) translateTree(child);
  }
  api.translate = translateTree;
  api.canonicalHTML = function(element) {
    const copy=element.cloneNode(true);
    function restore(original,clone) {
      const rich=richSources.get(original);
      if(rich && original.innerHTML===rich.output){clone.innerHTML=rich.source;return;}
      const text=sources.get(original);
      if(text && original.nodeValue===text.output) clone.nodeValue=text.source;
      const attrs=attributes.get(original);
      if(attrs)for(const [name,record] of Object.entries(attrs))if(original.getAttribute(name)===record.output)clone.setAttribute(name,record.source);
      Array.from(original.childNodes).forEach((node,index)=>restore(node,clone.childNodes[index]));
    }
    restore(element,copy);return copy.innerHTML;
  };
  api.markup = function(source) {
    const holder=doc.createElement('div');holder.innerHTML=source;
    translateTree(holder);return holder.innerHTML;
  };
  api.generated = function(element, source, property = 'value', preserve = []) {
    if (!element) return;
    element.setAttribute('data-i18n-skip','');
    const record = {source, property, preserve, output:api.t(typeof source==='function'?source(api.language):source,preserve)};
    generated.set(element,record);element[property]=record.output;
  };
  // Popups share the origin preference and local assets, including on GitHub Pages subpaths.
  api.popupHead = function() {
    const base = new URL('../', new URL('i18n.js', scriptUrl));
    return `<link rel="stylesheet" href="${new URL('css/i18n.css',base)}"><script src="${new URL('js/i18n-en.js',base)}"><\/script><script src="${new URL('js/i18n.js',base)}"><\/script>`;
  };
  const scriptUrl = doc.currentScript?.src || new URL('js/i18n.js',root.location.href).href;
  function watch() {
    observer.observe(doc.documentElement,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:translatableAttributes});
  }
  function refresh() {
    observer?.disconnect();
    translateTree(doc.documentElement);
    for(const [element,record] of generated) {
      if(!element.isConnected) {generated.delete(element);continue;}
      // A teacher's edits to an editable draft remain their own text.
      if(element[record.property]!==record.output) continue;
      record.output=api.t(typeof record.source==='function'?record.source(api.language):record.source,record.preserve);element[record.property]=record.output;
    }
    updateControls();
    if(observer) watch();
  }
  function change() {
    doc.documentElement.lang = api.language;
    root.spEdAudio?.stopSpeech();
    refresh();
    doc.dispatchEvent(new CustomEvent('math-language-change',{detail:{language:api.language}}));
  }
  function updateControls() {
    for(const control of doc.querySelectorAll('[data-language-select]')) control.value = api.language;
    for(const status of doc.querySelectorAll('[data-language-status]')) status.textContent=api.language==='en'?'Language: English':'語言：繁體中文';
  }
  function mountControl() {
    if(doc.querySelector('[data-language-select]') || doc.querySelector('.print-preview-controls, .print-controls')) return;
    // Embedded games use the parent toolbar, keeping the game canvas unobstructed.
    try {if(root.parent!==root && root.parent.MathI18n) return;} catch (_) {}
    const control = doc.createElement('label');control.className='language-switch';control.setAttribute('translate','no');
    control.innerHTML='<span aria-hidden="true">◎</span><select data-language-select aria-label="Language / 語言"><option value="en">English</option><option value="zh-Hant">繁體中文</option></select><span class="language-status" data-language-status role="status" aria-live="polite"></span>';
    const host=doc.querySelector('.header-tools') || doc.querySelector('.topbar nav') || doc.querySelector('.sp-ed-game-navbar > div:last-child');
    if(host) host.prepend(control);else {control.classList.add('language-switch-floating');doc.body.append(control);}
    control.querySelector('select').addEventListener('change', event=>api.setLanguage(event.target.value));
    const focusBar=doc.querySelector('.lesson-focus-bar');
    if(focusBar) {
      const focusedControl=control.cloneNode(true);focusedControl.classList.remove('language-switch-floating');
      focusBar.append(focusedControl);focusedControl.querySelector('select').addEventListener('change',event=>api.setLanguage(event.target.value));
    }
  }
  // Browser dialogs receive localized prompts; typed answers/default names are never translated.
  for(const name of ['alert','confirm','prompt']) if(typeof root[name]==='function') {
    const original=root[name].bind(root);root[name]=(message,...args)=>original(api.t(message),...args);
  }
  doc.documentElement.lang = api.language;
  function ready() {
    try {if(root.parent!==root && root.parent.MathI18n) api.setLanguage(root.parent.MathI18n.language,false);} catch (_) {}
    mountControl();
    observer=new MutationObserver(records=>{
      observer.disconnect();
      const branches=new Set();
      for(const mutation of records) {
        if(mutation.type==='childList') for(const child of mutation.addedNodes)branches.add(child);
        else branches.add(mutation.target);
      }
      for(const branch of branches)translateTree(branch);
      watch();
    });
    refresh();
  }
  // Let existing renderers finish their DOMContentLoaded setup before translating labels
  // which they may read and wrap in icons. This preserves the Chinese source on reversal.
  if(doc.readyState==='loading') doc.addEventListener('DOMContentLoaded',()=>{
    const printView=doc.querySelector('.print-preview-controls, .print-controls') || /window\.print/.test(doc.body?.getAttribute('onload') || '');
    if(printView)ready();else setTimeout(ready,0);
  });else ready();
  root.addEventListener('storage',event=>{
    if(event.key===KEY)api.setLanguage(event.newValue==='zh-Hant'?'zh-Hant':'en',false);
  });
  // A same-origin iframe may not receive storage in its own window when its parent toggles.
  doc.addEventListener('math-language-change',()=>{
    for(const frame of doc.querySelectorAll('iframe'))try {frame.contentWindow.MathI18n?.setLanguage(api.language,false);} catch (_) {}
  });
})(typeof window !== 'undefined' ? window : globalThis);
