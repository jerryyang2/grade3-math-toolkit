// Inventory display copy without translating IDs, saved data, or executable code.
const fs = require('node:fs');
const path = require('node:path');
const acorn = require('acorn');
const {parseHTML} = require('linkedom');
const root = path.resolve(__dirname, '../..');
const han = /[\u3400-\u9fff]/u;
const ignored = /(?:-manifest|visual-data|game-answer-validation|i18n-en|i18n\.js|vendor)/;
function sources() {
  const walk = dir => fs.readdirSync(path.join(root, dir), {withFileTypes:true}).flatMap(e => e.isDirectory() ? (e.name==='vendor' ? [] : walk(path.join(dir,e.name))) : [path.join(dir,e.name)]);
  return ['index.html', ...walk('js'), ...walk('games'), ...walk('islands')].filter(f => /\.(?:js|html)$/.test(f) && !ignored.test(f));
}
function inventory() {
  const entries = new Map();
  function add(value, file) {
    const key = String(value).replace(/\s+/g,' ').trim();
    if (!han.test(key) || key.length > 6000 || /^(?:data:|https?:|#[\w-]+\s*\{)/.test(key)) return;
    if (!entries.has(key)) entries.set(key,new Set());
    entries.get(key).add(file);
  }
  function text(value,file) {
    if (!han.test(value)) return;
    if (/<[a-z][\s\S]*>/i.test(value)) {
      const {document} = parseHTML('<html><body>'+value+'</body></html>');
      function visit(node) {
        if (node.nodeType===3 && !/^(SCRIPT|STYLE|TEXTAREA)$/.test(node.parentNode?.tagName || '')) add(node.nodeValue,file);
        if (node.nodeType===1) for(const attr of ['title','aria-label','aria-description','aria-valuetext','placeholder','alt','label']) if(node.hasAttribute(attr)) add(node.getAttribute(attr),file);
        for(const child of node.childNodes || []) visit(child);
      }
      visit(document.body);
    } else {
      add(value,file);
      // Report/prompt paragraphs can also be rendered as separate text nodes.
      if(value.includes('\n')) value.split(/\n+/).forEach(line=>add(line,file));
    }
  }
  function js(source,file) {
    let tree;try {tree=acorn.parse(source,{ecmaVersion:'latest',sourceType:'script',allowReturnOutsideFunction:true});} catch {tree=acorn.parse(source,{ecmaVersion:'latest',sourceType:'module'});}
    function sketch(node) {
      if(node.type==='Literal' && typeof node.value==='string') return node.value;
      if(node.type==='TemplateLiteral') return node.quasis.map((q,i)=>q.value.cooked+(i<node.expressions.length?`⟦${i}⟧`:'')).join('');
      if(node.type==='BinaryExpression' && node.operator==='+') return sketch(node.left)+sketch(node.right);
      return '⟦X⟧';
    }
    function visit(node,parent) {
      if(!node || typeof node!=='object')return;
      if(node.type==='Literal' && typeof node.value==='string' && !(parent?.type==='Property' && parent.key===node && !parent.computed)) text(node.value,file);
      if(node.type==='TemplateLiteral') {
        text(sketch(node),file);
        node.quasis.forEach(q=>text(q.value.cooked || '',file));
      }
      if(node.type==='BinaryExpression' && node.operator==='+' && !(parent?.type==='BinaryExpression' && parent.operator==='+')) text(sketch(node),file);
      for(const [key,value] of Object.entries(node)) if(key!=='start'&&key!=='end') {
        if(Array.isArray(value)) value.forEach(v=>visit(v,node));else if(value && typeof value==='object')visit(value,node);
      }
    }
    visit(tree);
  }
  for(const file of sources()) {
    const source=fs.readFileSync(path.join(root,file),'utf8');
    if(file.endsWith('.js')) js(source,file);
    else {
      text(source,file);
      for(const match of source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) if(match[1].trim()) js(match[1],file);
    }
  }
  // 圖示資料保留原始語意設定，只收集實際畫出的文字，避免漏掉動態 SVG 標籤。
  const diagrams=require('../../js/worksheet-diagrams.js');
  for(const problem of require('../../js/data.js').practiceBank)text(diagrams.render(problem),'worksheet-figures');
  return [...entries].sort(([a],[b])=>a.localeCompare(b,'zh-Hant')).map(([source,files])=>({source,files:[...files].sort()}));
}
if(require.main===module) {
  const output=path.join(root,'Codex/i18n-inventory.json');fs.mkdirSync(path.dirname(output),{recursive:true});
  const list=inventory();fs.writeFileSync(output,JSON.stringify(list,null,2));console.log(JSON.stringify({entries:list.length,output:'Codex/i18n-inventory.json'}));
}
module.exports={inventory,sources};
