const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {inventory,sources}=require('./extract.cjs');
const catalog=require('../../js/i18n-en.js');
const {create}=require('../../js/i18n.js');
const data=require('../../js/data.js');
const root=path.resolve(__dirname,'../..');
const missing=inventory().filter(({source})=>!(source in catalog));
assert.equal(missing.length,0,`Missing display translations: ${missing.slice(0,8).map(x=>x.source).join(' | ')}`);
for(const [source,target]of Object.entries(catalog)) {
  assert.equal(typeof target,'string');
  assert.deepEqual((target.match(/⟦[^⟧]*⟧/g)||[]).sort(),(source.match(/⟦[^⟧]*⟧/g)||[]).sort(),`Damaged template: ${source}`);
}
const i18n=create(catalog);i18n.setLanguage('en');
for(const problem of data.practiceBank) {
  for(const source of [problem.question,...problem.options,problem.hint,problem.speechText,problem.solutionSpeech,...(problem.stepScaffolds||[])].filter(Boolean))assert.doesNotMatch(i18n.t(source),/[\u3400-\u9fff]/u,problem.id);
  assert.equal(new Set(problem.options.map(v=>i18n.t(v))).size,problem.options.length,`Duplicate English choices: ${problem.id}`);
}
const pages=sources().filter(p=>p.endsWith('.html'));
for(const page of pages){const html=fs.readFileSync(path.join(root,page),'utf8');assert.match(html,/src="[^\"]*js\/i18n-en\.js/);assert.match(html,/src="[^\"]*js\/i18n\.js/);assert.match(html,/href="[^\"]*css\/i18n\.css/);}
console.log(JSON.stringify({translations:Object.keys(catalog).length,questions:data.practiceBank.length,pages:pages.length,coverage:'PASS'}));
