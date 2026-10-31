const fs=require('node:fs');
const path=require('node:path');
const {inventory}=require('./extract.cjs');
const root=path.resolve(__dirname,'../..');
const published=path.join(root,'js/i18n-en.js');
const cache={...(fs.existsSync(published)?require(published):{}),...(fs.existsSync(path.join(root,'Codex/i18n-translation-cache.json'))?JSON.parse(fs.readFileSync(path.join(root,'Codex/i18n-translation-cache.json'),'utf8')):{})};
const overrides=JSON.parse(fs.readFileSync(path.join(__dirname,'overrides.json'),'utf8'));
const entries=inventory();
const catalog={};
const missing=[];
for(const {source} of entries){
  let target=overrides[source]??cache[source];
  const label=source.replace(/^[^\p{L}\p{N}]+/u,'').trim();
  if(overrides[label] && label!==source)target=source.slice(0,source.indexOf(label))+overrides[label];
  if(typeof target==='string')target=target.replace(/\byuan\b/gi,'NT$').replace(/\babdicat(?:ion|ing)\b/gi,'regrouping').replace(/\bMing Dynasty\b/g,'Ming');
  if(target===undefined)missing.push(source);else catalog[source]=target;
}
Object.assign(catalog,overrides);
if(missing.length){console.error(JSON.stringify({missing:missing.length,samples:missing.slice(0,10)}));process.exit(1);}
// Read-aloud follows exactly the English question and reviewed steps shown on screen.
const i18n=require('../../js/i18n.js').create(catalog);i18n.setLanguage('en');
for(const problem of require('../../js/data.js').practiceBank){
  if(problem.speechText)catalog[problem.speechText]=i18n.t(problem.question);
  if(problem.solutionSpeech)catalog[problem.solutionSpeech]=[
    "Let's work it out.",i18n.t(problem.hint),...(problem.stepScaffolds || []).map(s=>i18n.t(s)),
    'The correct answer is '+i18n.t(problem.options[problem.answerIndex])+'.'
  ].join(' ');
}
fs.writeFileSync(path.join(root,'js/i18n-en.js'),'/* Local English display catalog. Update with scripts/i18n; canonical IDs/data are unchanged. */\n(function(root){\nconst catalog='+JSON.stringify(catalog,null,2)+';\nif(typeof module!=="undefined"&&module.exports)module.exports=catalog;else root.MathEnglishCatalog=Object.freeze(catalog);\n})(typeof window!=="undefined"?window:globalThis);\n');
console.log(JSON.stringify({entries:Object.keys(catalog).length}));
