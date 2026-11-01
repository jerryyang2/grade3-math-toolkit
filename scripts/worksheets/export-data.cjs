// 本機出版流程；PDF 與暫存資料由 Git 排除，製作工具可版控。
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const data = require(path.join(root, 'js/data.js'));
const diagrams = require(path.join(root, 'js/worksheet-diagrams.js'));
const layout = require(path.join(root, 'js/worksheet-layout.js'));
const unreviewed=diagrams.audit(data.practiceBank).filter(item=>!item.reviewed);
if(unreviewed.length)throw new Error('請先檢查題目更新後的圖像：'+unreviewed.map(item=>item.id).join('、'));
const context = { window: { NANI_G3S1_DATA: data, addEventListener() {} } };
vm.runInNewContext(fs.readFileSync(path.join(root, 'js/contest-features.js'), 'utf8'), context);
const sheets = [];
for (const unit of data.units) {
  for (const section of [...unit.sections, null]) {
    const sheet = context.window.WorksheetGenerator.getWorksheet(unit.id, section?.id || '');
    if (sheet.problems.length !== 10) throw new Error('Worksheet must contain ten questions');
    sheets.push({
      id: section?.id || `${unit.id}_review`, unitId: unit.id, unitNumber: unit.number,
      unitTitle: unit.title, title: section?.title || '單元總複習', review: !section,
      problems: sheet.problems.map(p => {
        const figure = diagrams.render(p);
        return { id:p.id, question:p.question, options:p.options, level:p.level,
          sectionTitle:p.sectionTitle || unit.sections.find(s=>s.id===p.sectionId)?.title || '',
          svg:figure.match(/<svg[\s\S]*?<\/svg>/)?.[0] || '',
          caption:figure.match(/<figcaption>([\s\S]*?)<\/figcaption>/)?.[1] || '' };
      })
    });
  }
}
for(const sheet of sheets) sheet.layout=layout.plan(sheet);
if (sheets.length !== 36) throw new Error('Expected 36 worksheets');
fs.mkdirSync(path.join(root, 'tmp/pdfs'), {recursive:true});
fs.writeFileSync(path.join(root, 'tmp/pdfs/worksheets.json'), JSON.stringify(sheets, null, 2));
const config=path.join(root,'tmp/pdfs/fonts.conf');
fs.writeFileSync(config,`<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd"><fontconfig><dir>/System/Library/Fonts</dir><dir>${path.join(root,'Codex/fonts')}</dir><cachedir>${path.join(root,'tmp/pdfs/font-cache')}</cachedir></fontconfig>`);
process.env.FONTCONFIG_FILE=config;
const os=require('node:os');
const sharp=require(require.resolve('sharp',{paths:[root,process.env.WORKSHEET_PDF_NODE_MODULES||path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules')]}));
(async()=>{
  const unique=new Map(sheets.flatMap(s=>s.problems).filter(p=>p.svg).map(p=>[p.id,p]));
  for(const p of unique.values()) {
    const svg=p.svg.replaceAll('−','－').replace(/font-family="[^"]*"/g,'font-family="BiauKaiTC"').replace(/font-family\s*:[^;"}]+/g,'font-family:BiauKaiTC');
    await sharp(Buffer.from(svg)).resize({width:1200}).flatten({background:'#ffffff'}).png().toFile(path.join(root,'tmp/pdfs',p.id+'.png'));
  }
  console.log(JSON.stringify({worksheets:sheets.length, questions:sheets.reduce((n,s)=>n+s.problems.length,0),diagrams:unique.size}));
})().catch(error=>{console.error(error.message);process.exitCode=1;});
