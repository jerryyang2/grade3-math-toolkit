/* 只傳送原創教材片語與數字到語音服務；不讀取訪客姓名或瀏覽器資料。 */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),C=require('../islands/curriculum.js'),T=require('../islands/teaching.js'),N=require('../islands/narration.js');
const config={voice:'zh-TW-HsiaoChenNeural',lang:'zh-TW',outputFormat:'audio-24khz-48kbitrate-mono-mp3',rate:'-4%',pitch:'+0Hz'};
const texts=new Set();const add=text=>N.parts(text).forEach(p=>texts.add(p));
for(let n=0;n<=100;n++)N.numberParts(n).forEach(p=>texts.add(p));for(let n=100;n<=10000;n+=100)N.numberParts(n).forEach(p=>texts.add(p));for(let n=10;n<20;n++)N.numberParts(1000+n).forEach(p=>texts.add(p));texts.add('分之');
for(const resident of T.residents){add(resident.name);add(resident.line);}Object.values(T.narration).forEach(add);
let seed=20261031;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
for(const island of C.islands){add(T.method(island.id).route);for(let m=0;m<3;m++)for(let j=0;j<180;j++){const t=C.task(island.id,m,j?random:null);if(!j)texts.add(N.whole(t.prompt));[t.prompt,t.hint,C.solution(t),...T.steps(t).flatMap(s=>[s.title,s.text,s.formula])].forEach(add);}}
const clips=Object.fromEntries([...texts].sort().map(t=>[t,`audio/islands/${crypto.createHash('sha256').update(JSON.stringify(config)+t).digest('hex').slice(0,24)}.mp3`]));
const manifest=path.join(root,'islands/audio-manifest.js'),source=`/* 自動產製：node scripts/generate-island-audio.cjs */\nwindow.MathIslandAudioClips=${JSON.stringify(clips)};\n`;
const valid=f=>{try{return fs.statSync(path.join(root,f)).size>1000;}catch{return false;}};
async function main(){const missing=Object.entries(clips).filter(([,f])=>!valid(f));if(process.argv.includes('--check')){if(missing.length||!fs.existsSync(manifest)||fs.readFileSync(manifest,'utf8')!==source)throw Error(`Island narration out of sync: ${missing.length} missing clips`);console.log(`PASS: ${texts.size} island narration clips`);return;}
 fs.mkdirSync(path.join(root,'audio/islands'),{recursive:true});const {EdgeTTS}=require('node-edge-tts');let cursor=0,done=0;console.log(`Island female narration: ${missing.length}/${texts.size} clips to build`);
 async function worker(){while(cursor<missing.length){const [text,relative]=missing[cursor++],dest=path.join(root,relative),tmp=dest+'.tmp';let ok=false;for(let attempt=0;attempt<3;attempt++){try{await new EdgeTTS({...config,timeout:45000}).ttsPromise(text,tmp);if(fs.statSync(tmp).size<=1000)throw Error();fs.renameSync(tmp,dest);ok=true;break;}catch{fs.rmSync(tmp,{force:true});}}if(!ok)throw Error(`Unable to build an island narration clip`);if(++done%30===0)console.log(`Built ${done}/${missing.length}`);}}
 await Promise.all(Array.from({length:4},worker));fs.writeFileSync(manifest,source);console.log(`Complete: ${texts.size} island narration clips`);
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
