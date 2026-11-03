#!/usr/bin/env node
// 僅產生本機 PDF；所有輸出均在 Git 排除的目錄中。
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const crypto=require('node:crypto');
const {spawnSync,execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const sources=require('./worksheets/sources.json');
const pdf=path.join(root,'output/pdf/一起把數學玩懂_三上學習單彙整_36份.pdf');
const reportFile=path.join(root,'Codex/worksheet-book-verification.json');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
function run(command,args){const r=spawnSync(command,args,{cwd:root,stdio:'inherit'});if(r.status!==0)throw Error('學習單 PDF 同步未通過，請修正後再推送。');}
function fresh(fromGit=false){
  if(!fs.existsSync(pdf)||!fs.existsSync(reportFile))return false;
  const r=JSON.parse(fs.readFileSync(reportFile,'utf8'));
  if(r.status!=='PASS'||r.pdf_sha256!==hash(fs.readFileSync(pdf)))return false;
  // The bilingual display catalog exceeds Node's default 1 MiB output buffer.
  return sources.every(file=>r.source_sha256?.[file]===hash(fromGit?execFileSync('git',['show','HEAD:'+file],{cwd:root,maxBuffer:32*1024*1024}):fs.readFileSync(path.join(root,file))));
}
try{
  if(process.argv.includes('--install-hook')){
    // 未設定時 git config 以 exit 1 回傳，視為使用預設 hooks 目錄。
    const configured=spawnSync('git',['config','--get','core.hooksPath'],{cwd:root,encoding:'utf8'}).stdout.trim();
    const hooks=configured?path.resolve(root,configured):path.resolve(root,git('rev-parse','--git-path','hooks'));
    const file=path.join(hooks,'pre-push');
    if(fs.existsSync(file)&&!fs.readFileSync(file,'utf8').includes('# worksheet-pdf-sync'))throw Error('已有其他 pre-push hook，未覆寫。');
    fs.mkdirSync(hooks,{recursive:true});fs.writeFileSync(file,'#!/bin/sh\n# worksheet-pdf-sync\nset -eu\ncd "$(git rev-parse --show-toplevel)"\nexec node scripts/pre-push-local-pdfs.cjs "$@"\n',{mode:0o755});
    if(fs.existsSync(path.join(root,'Codex/website-guide')))git('config','--local','localGuide.required','true');
    console.log('已安裝本機學習單與使用手冊 PDF 推送前同步檢查。');
    process.exit(0);
  }
  const prePush=process.argv.includes('--pre-push');
  if(prePush){
    const refs=fs.readFileSync(0,'utf8').trim().split('\n').filter(Boolean).map(line=>line.split(/\s+/));
    const publishing=refs.filter(ref=>ref[2]==='refs/heads/main'&&!/^0+$/.test(ref[1]));
    if(!publishing.length)process.exit(0);
    if(publishing.some(ref=>ref[1]!==git('rev-parse','HEAD')))throw Error('學習單同步只支援目前審查中的發布提交。');
    const changed=publishing.some(ref=>/^0+$/.test(ref[3])||git('diff',ref[3],ref[1],'--name-only','--',...sources));
    if(!changed)process.exit(0);
    if(git('diff','HEAD','--name-only','--',...sources))throw Error('學習單來源仍有未提交修改，請完成同步與提交後再推送。');
  }
  const data=require('../js/data.js'),figures=require('../js/worksheet-diagrams.js');
  const unreviewed=figures.audit(data.practiceBank).filter(item=>!item.reviewed);
  if(unreviewed.length)throw Error('下列題目變更後需重新檢查圖像：'+unreviewed.map(item=>item.id).join('、'));
  if((prePush||process.argv.includes('--check'))&&fresh(prePush)){
    console.log('學習單 PDF 已與目前來源同步；本機 PDF 維持 Git 排除。');process.exit(0);
  }
  const candidates=[process.env.WORKSHEET_PDF_PYTHON,path.join(root,'Codex/pdf-venv/bin/python'),path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3'),'python3'].filter(Boolean);
  const python=candidates.find(binary=>spawnSync(binary,['-c','import reportlab,pypdf'],{stdio:'ignore'}).status===0);
  if(!python)throw Error('本機 PDF 需要 Python 的 reportlab 與 pypdf，請設定 WORKSHEET_PDF_PYTHON。');
  run(python,['scripts/worksheets/build-book.py']);
  run(python,['scripts/worksheets/verify-book.py']);
  if(!fresh(prePush))throw Error('來源或 PDF 在製作後又被修改，請重新執行同步。');
  console.log('已更新並驗證本機學習單 PDF；未加入 Git 或網站下載。');
}catch(error){console.error(error.message);process.exitCode=1;}
