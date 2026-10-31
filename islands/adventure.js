(function(){
'use strict';
const $=id=>document.getElementById(id),C=MathIslands;
let storage;try{storage=localStorage;}catch{storage={getItem(){throw Error();},setItem(){throw Error();}};}
const visitors=MathIslandVisitors.create(storage);
let progress=visitors.active().progress,saveOK=visitors.saved();
const evidence=new Map();
let unit=C.islands[0],mission=0,current,state,attempts=0,hinted=false,solved=false,practice=false,world;
const coinValues=[1000,100,10,1];
const coinTotal=()=>state.coins.reduce((sum,n,i)=>sum+n*coinValues[i],0);
const button=(action,label,extra='')=>`<button type="button" data-action="${action}" ${extra}>${label}</button>`;
const svg=(content,label,view='0 0 320 190')=>`<svg viewBox="${view}" role="img" aria-label="${label}">${content}</svg>`;
function numericAnswer(label='一共多少元？'){return `<label class="number-answer">${label}<input id="number-answer" type="number" min="0" max="10000" step="1" inputmode="numeric" value="${state.answer}" autocomplete="off"></label>`;}
function initState(){return {coins:[0,0,0,0],answer:'',groups:0,value:current.kind==='compass'?1:0,choice:'',baskets:Array(current.groups||0).fill(0),slices:Array(current.d||0).fill(false)};}
function stamp(id,m){const r=progress[id]?.[m];return r?.result==='independent'?'●':r?'◐':'○';}
function renderDirectory(){
 $('island-list').innerHTML=C.islands.map((i,n)=>`<button class="island-card ${i.id===unit.id?'selected':''}" data-island="${i.id}" aria-pressed="${i.id===unit.id}" style="--island-color:${i.color}"><span class="directory-icon" aria-hidden="true">${i.icon}</span><span class="directory-copy"><small>第 ${n+1} 單元 · ${i.unit}</small><strong>${i.name}</strong><span class="mini-stamps" aria-label="三個任務進度">${[0,1,2].map(m=>stamp(i.id,m)).join(' ')}</span></span><span aria-hidden="true">↗</span></button>`).join('');
 const completed=Object.values(progress).reduce((n,v)=>n+Object.keys(v).length,0);$('stamp-count').textContent=`${completed} / 27`;
}
function renderTabs(){ $('mission-tabs').innerHTML=unit.missions.map((name,m)=>`<button data-mission="${m}" aria-pressed="${m===mission}" class="${m===mission?'active':''}" aria-label="任務 ${m+1} ${name} ${stamp(unit.id,m)==='○'?'尚未完成':'已完成'}"><span>${stamp(unit.id,m)}</span> ${m+1}. ${name}</button>`).join('');}
function loadTask(random=false){
 if(current)evidence.set(JSON.stringify(current),{attempts,hinted:hinted||solved});
 practice=random;const oldTask=JSON.stringify(current);current=C.task(unit.id,mission,random?Math.random:null);if(random)for(let tries=0;tries<20&&JSON.stringify(current)===oldTask;tries++)current=C.task(unit.id,mission,Math.random);state=initState();const previous=evidence.get(JSON.stringify(current));attempts=previous?.attempts||0;hinted=!!previous?.hinted||(!random&&!!progress[unit.id]?.[mission]);solved=false;
 $('island-kicker').textContent=`ISLAND ${String(C.islands.indexOf(unit)+1).padStart(2,'0')} / 09`;$('island-name').textContent=unit.name;$('island-unit').textContent=`第 ${C.islands.indexOf(unit)+1} 單元｜${unit.unit}`;$('buddy-icon').textContent=unit.icon;$('buddy-name').textContent=unit.buddy;
 $('mission-number').textContent=random?'換題練習':`任務 ${mission+1} / 3`;$('mission-title').textContent=unit.missions[mission];$('question').textContent=current.prompt;$('hint').textContent=current.hint;$('hint').hidden=true;$('hint-button').setAttribute('aria-expanded','false');$('hint-button').disabled=$('independent').checked;
 $('feedback').textContent='';$('feedback').className='feedback';$('check').disabled=false;$('check').textContent='完成了，檢查一下 ↗';$('next').hidden=true;
 $('learning-goal').textContent=unit.goal;$('teacher-say').textContent=unit.say;$('unit-link').href=`../index.html?unit=${unit.id}`;
 $('mission-panel').style.setProperty('--accent',unit.color);renderTabs();renderDirectory();renderManipulative();
}
function selectIsland(id,focus=true,missionIndex=0){const selected=C.islands.find(i=>i.id===id);if(!selected)return;unit=selected;mission=[0,1,2].includes(missionIndex)?missionIndex:0;loadTask();world?.select(id,focus);document.querySelectorAll('.island-label').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.island===id)));history.replaceState(null,'',`#${id}`);}
function fractionSvg(){const d=current.d;let content='<circle cx="100" cy="100" r="91" fill="#d7a15c"/>';for(let i=0;i<d;i++){const a=i/d*Math.PI*2-Math.PI/2,b=(i+1)/d*Math.PI*2-Math.PI/2,x=100+84*Math.cos(a),y=100+84*Math.sin(a),x2=100+84*Math.cos(b),y2=100+84*Math.sin(b);content+=`<path tabindex="0" role="button" aria-label="第 ${i+1} 片，${state.slices[i]?'已選取':'未選取'}" aria-pressed="${!!state.slices[i]}" data-action="slice" data-index="${i}" d="M100 100 L${x} ${y} A84 84 0 ${d===2?0:0} 1 ${x2} ${y2} Z" fill="${state.slices[i]?'#d68356':'#f8e6bd'}" stroke="#fff8e9" stroke-width="3"/>`;if(state.slices[i]){const mid=(a+b)/2;content+=`<circle pointer-events="none" cx="${100+49*Math.cos(mid)}" cy="${100+49*Math.sin(mid)}" r="7" fill="#a84e3c"/>`;}}return `<svg viewBox="0 0 200 200" class="pizza" role="group" aria-label="等分披薩，點選或以 Tab 和空白鍵選取每片">${content}</svg>`;}
function rulerSvg(){const mm=current.target;let marks='';for(let i=0;i<=80;i++){const x=20+i*3.5;marks+=`<path d="M${x} 92 v${i%10===0?30:i%5===0?22:13}" stroke="#687b74" stroke-width="${i%10===0?1.4:.7}"/>`;if(i%10===0)marks+=`<text x="${x}" y="140" text-anchor="middle">${i/10}</text>`;}return svg(`<rect x="20" y="43" width="${mm*3.5}" height="29" rx="4" fill="#b48b61"/><path d="M20 35V150" stroke="#d18456" stroke-dasharray="3 3"/><path d="M${20+mm*3.5} 35V124" stroke="#558d94" stroke-dasharray="3 3"/><rect x="12" y="88" width="296" height="62" rx="5" fill="#f4e1b7"/>${marks}<text x="290" y="166">公分</text>`,`橋板從 0 到尺上第 ${mm} 個毫米刻度，請讀出長度`);}
function pourSvg(){let marks='';for(let i=0;i<=6;i++){const y=157-i*21;marks+=`<path d="M177 ${y} h18" stroke="#6b9397"/><text x="204" y="${y+4}">${i*500}</text>`;}return svg(`<defs><clipPath id="jug-clip"><rect x="78" y="30" width="114" height="127" rx="7"/></clipPath></defs><rect x="78" y="${157-state.value/3000*126}" width="114" height="${state.value/3000*126}" fill="#91c4cc" clip-path="url(#jug-clip)"/><path d="M78 27V157Q78 165 86 165H184Q192 165 192 157V27" fill="none" stroke="#537e88" stroke-width="3"/>${marks}<text x="203" y="17">毫升</text>`,`量杯中有 ${state.value} 毫升果汁`);}
function compassSvg(){const r=state.value*11;return svg(`<circle cx="150" cy="90" r="${r}" fill="#e3eee3" stroke="#6b9c8b" stroke-width="3"/><path d="M${150-r} 90 H${150+r}" stroke="#b98a51" stroke-width="2" stroke-dasharray="5 4"/><path d="M150 90 H${150+r}" stroke="#377d79" stroke-width="4"/><circle cx="150" cy="90" r="4" fill="#314f56"/><path d="M150 90 L${150+r/2} 15 L${150+r} 90" fill="none" stroke="#6b7886" stroke-width="3"/><circle cx="${150+r/2}" cy="15" r="5" fill="#d8b266"/><text x="148" y="112">圓心</text><text x="${150+r/2}" y="83" text-anchor="middle">${state.value} cm</text><text x="150" y="183" text-anchor="middle">半徑 ${state.value} 公分　｜　直徑 ${state.value*2} 公分</text>`,`圓規半徑 ${state.value} 公分，直徑 ${state.value*2} 公分`);}
function shapeOptions(){
 const options=current.mission===0?[['small','銳角','<path d="M35 105H125M35 105L110 55"/>'],['right','直角','<path d="M35 105H125M35 105V25M35 89H51V105"/>'],['wide','鈍角','<path d="M65 105H135M65 105L20 25"/>']]:[['diamond','斜四邊形','<path d="M20 105L50 35H130L100 105Z"/><text x="53" y="26">6 cm</text><text x="104" y="85">3 cm</text>'],['square','旋轉的正方形',`<g transform="rotate(${current.rotation} 75 70)"><rect x="43" y="38" width="64" height="64"/><text x="75" y="29" text-anchor="middle">4 cm</text><text x="112" y="76">4</text></g>`],['rectangle','長方形','<rect x="20" y="45" width="110" height="55"/><text x="75" y="35" text-anchor="middle">6 cm</text><text x="132" y="80">3</text>']];
 if(current.optionOffset)options.push(...options.splice(0,current.optionOffset));
 return `<div class="shape-options">${options.map(([value,label,paths],i)=>`<button data-action="shape" data-choice="${value}" aria-pressed="${state.choice===value}">${svg(`<g fill="none" stroke="#687d83" stroke-width="3"${current.mission===0?` transform="rotate(${current.rotation-25} 75 70)"`:''}>${paths}</g>`,label,'0 0 155 140')}<span>圖 ${i+1}${state.choice===value?' ✓':''}</span></button>`).join('')}</div>`;
}
function renderManipulative(){
 const focus=document.activeElement;const action=focus?.dataset?.action,index=focus?.dataset?.index,val=focus?.dataset?.value;
 let html='';
 switch(current.kind){
 case 'coins':html=`<div class="coin-columns">${[1000,100,10,1].map((v,i)=>`<div class="coin-column"><span>${['千','百','十','個'][i]}</span><b class="money-token token-${i}">${v}</b>${button('coin','＋',`data-index="${i}" data-value="1" aria-label="增加一個 ${v} 元" ${state.coins[i]>=10||coinTotal()+v>10000?'disabled':''}`)}<output>${state.coins[i]}</output>${button('coin','−',`data-index="${i}" data-value="-1" aria-label="拿回一個 ${v} 元" ${!state.coins[i]?'disabled':''}`)}</div>`).join('')}</div><div class="operation-total">皮夾裡有 <strong>${state.coins.reduce((a,b,i)=>a+b*[1000,100,10,1][i],0).toLocaleString()}</strong> 元</div>`;break;
 case 'calculate':html=`<div class="cash-receipt"><span>慢慢島補給收據</span><div class="vertical-equation"><div>　${String(current.a).padStart(4,' ')}</div><div>${current.op}${String(current.b).padStart(4,' ')}</div><div class="receipt-line">　????</div></div><small>千　百　十　個</small></div>${numericAnswer(current.op==='+'?'一共付多少元？':'應該找回多少元？')}`;break;
 case 'array':{const tens=Math.floor(current.per/10),ones=current.per%10;html=`<div class="tray-controls">${button('tray','＋ 加一盤','data-value="1" '+(state.groups>=6?'disabled':''))}<output>${state.groups} 盤</output>${button('tray','− 拿回一盤','data-value="-1" '+(!state.groups?'disabled':''))}</div><div class="baking-trays">${Array.from({length:state.groups},(_,i)=>`<div class="baking-tray" aria-label="第 ${i+1} 盤 ${current.per} 個麵包">${'<span class="ten-bun">10</span>'.repeat(tens)}${'<i class="bun" aria-label="1 個"></i>'.repeat(ones)}</div>`).join('')||'<p>先放一盤，再看看每盤的十與一。</p>'}</div><p class="visual-key">一包「10」代表十個，圓麵包代表一個。</p>${numericAnswer('這些烤盤一共有幾個麵包？')}`;break;}
 case 'ruler':html=`<div id="visual">${rulerSvg()}</div><label class="range-label" for="measure">橋板長 <output id="range-value">${state.value}</output> 毫米</label><input id="measure" type="range" min="0" max="80" step="1" value="${state.value}" aria-label="讀出橋板長幾毫米"><div class="range-adjust">${button('adjust','− 1 毫米','data-value="-1"')}${button('adjust','＋ 1 毫米','data-value="1"')}</div>`;break;
 case 'shape':html=shapeOptions();break;
 case 'divide':{const left=current.total-state.baskets.reduce((a,b)=>a+b,0);html=`<div class="picnic-left">桌上剩 <strong>${left}</strong> 個點心<span>${'● '.repeat(left)}</span></div><div class="baskets">${state.baskets.map((n,i)=>`<div class="basket"><span>籃子 ${i+1}</span><div class="basket-food" aria-label="${n} 個點心">${'● '.repeat(n)||'空空的'}</div><strong>${n} 個</strong><div>${button('basket','−',`data-index="${i}" data-value="-1" aria-label="從籃子 ${i+1} 拿回一個" ${!n?'disabled':''}`)}${button('basket','＋',`data-index="${i}" data-value="1" aria-label="分一個到籃子 ${i+1}" ${!left?'disabled':''}`)}</div></div>`).join('')}</div>`;break;}
 case 'pour':html=`<div id="visual">${pourSvg()}</div><div class="pour-cups">${[1000,100,50].map(v=>`<div><span>${v===1000?'1 公升':v+' mL'}</span>${button('pour','＋',`data-value="${v}" aria-label="倒入 ${v} 毫升" ${state.value+v>3000?'disabled':''}`)}${button('pour','−',`data-value="${-v}" aria-label="倒回 ${v} 毫升" ${state.value<v?'disabled':''}`)}</div>`).join('')}</div><div class="operation-total">已倒入 <strong>${state.value}</strong> 毫升</div>`;break;
 case 'fraction':html=fractionSvg()+`<div class="operation-total">選了 <strong>${state.slices.filter(Boolean).length} / ${current.d}</strong> 個披薩</div>`;break;
 case 'compass':html=`<div id="visual">${compassSvg()}</div><label class="range-label" for="radius">圓規半徑 <output id="range-value">${state.value}</output> 公分</label><input id="radius" type="range" min="1" max="7" step="1" value="${state.value}" aria-label="調整圓規半徑幾公分"><div class="range-adjust">${button('adjust','− 1 公分','data-value="-1"')}${button('adjust','＋ 1 公分','data-value="1"')}</div>`;break;
 }
 $('manipulative').innerHTML=html;
 if(action){const candidates=[...$('manipulative').querySelectorAll('[data-action]')];candidates.find(el=>el.dataset.action===action&&el.dataset.index===index&&el.dataset.value===val)?.focus({preventScroll:true});}
}
function interact(target){if(solved)return;const a=target.dataset.action,n=Number(target.dataset.value),i=Number(target.dataset.index);
 if(a==='coin'){if(n>0&&coinTotal()+coinValues[i]>10000)return;state.coins[i]=Math.max(0,Math.min(10,state.coins[i]+n));}
 if(a==='tray')state.groups=Math.max(0,Math.min(6,state.groups+n));
 if(a==='shape')state.choice=target.dataset.choice;
 if(a==='basket'){const left=current.total-state.baskets.reduce((a,b)=>a+b,0);if(n>0&&left<=0)return;state.baskets[i]=Math.max(0,state.baskets[i]+n);}
 if(a==='slice')state.slices[i]=!state.slices[i];
 if(a==='pour')state.value=Math.max(0,Math.min(3000,state.value+n));
 if(a==='adjust')state.value=Math.max(current.kind==='compass'?1:0,Math.min(current.kind==='compass'?7:80,state.value+n));
 renderManipulative();
}
$('manipulative').addEventListener('click',e=>{const target=e.target.closest('[data-action]');if(target)interact(target);});
$('manipulative').addEventListener('keydown',e=>{if(e.target.dataset.action==='slice'&&[' ','Enter'].includes(e.key)){e.preventDefault();interact(e.target);}if(e.key==='Enter'&&e.target.id==='number-answer'){e.preventDefault();$('check').click();}});
$('manipulative').addEventListener('input',e=>{if(solved)return;if(e.target.id==='number-answer')state.answer=e.target.value;if(['measure','radius'].includes(e.target.id)){state.value=Number(e.target.value);$('range-value').textContent=state.value;if(current.kind==='compass')$('visual').innerHTML=compassSvg();}});
$('check').addEventListener('click',()=>{
 if(solved)return;attempts++;const correct=C.evaluate(current,state);$('feedback').className=`feedback ${correct?'correct':'retry'}`;
 if(!correct){let message='再看看，還差一小步。可以調整後再檢查，也可以打開提示。';if(current.kind==='divide'){const left=current.total-state.baskets.reduce((a,b)=>a+b,0);message=new Set(state.baskets).size>1?'每個籃子還不一樣多。試著輪流分，讓大家公平。':left>=current.groups?'大家一樣多了，但桌上的點心還能再分一輪喔！':message;}if(current.kind==='array'&&state.groups!==current.groups)message=`先確認烤盤數：訂單需要 ${current.groups} 盤。`;$('feedback').textContent=message;return;}
 solved=true;world?.complete(unit.id,mission);const result=attempts===1&&!hinted?'independent':'supported';progress[unit.id]??={};if(progress[unit.id][mission]?.result!=='independent')progress[unit.id][mission]={attempts,result};
 saveOK=visitors.record(progress);
 $('feedback').textContent=`靠岸成功！${C.solution(current)} ${result==='independent'?'● 獨立首次完成':'◐ 支持後完成'}${saveOK?'':'（目前無法儲存；進度保留到關閉頁面前。）'}`;$('check').disabled=true;$('check').textContent='✓ 這一步，做到了';$('next').hidden=false;$('next').textContent=mission<2?'下一個任務 →':'前往下一座島 →';
 $('manipulative').querySelectorAll('button,input').forEach(e=>{e.disabled=true;});$('manipulative').querySelectorAll('[data-action="slice"]').forEach(e=>{e.setAttribute('aria-disabled','true');e.tabIndex=-1;});renderTabs();renderDirectory();
});
$('hint-button').onclick=()=>{hinted=true;$('hint').hidden=!$('hint').hidden;$('hint-button').setAttribute('aria-expanded',String(!$('hint').hidden));};
$('independent').onchange=()=>{const independent=$('independent').checked;$('hint-button').disabled=independent;if(independent){$('hint').hidden=true;$('hint-button').setAttribute('aria-expanded','false');}};
$('reset').onclick=()=>{const wasSupported=hinted||attempts>0||solved;state=initState();solved=false;hinted=wasSupported;$('feedback').textContent='已清空操作，可以重新試試。';$('feedback').className='feedback';$('check').disabled=false;$('check').textContent='完成了，檢查一下 ↗';$('next').hidden=true;renderManipulative();};
$('random').onclick=()=>loadTask(true);$('next').onclick=()=>{if(mission<2){mission++;loadTask();}else world.travelTo(C.islands[(C.islands.indexOf(unit)+1)%9].id,0);};
$('mission-tabs').onclick=e=>{const b=e.target.closest('[data-mission]');if(b){mission=Number(b.dataset.mission);loadTask();}};
$('island-list').onclick=e=>{const b=e.target.closest('[data-island]');if(b)world.travelTo(b.dataset.island,0);};
$('island-labels').innerHTML=C.islands.map((i,n)=>`<button class="island-label" data-island="${i.id}" aria-label="第 ${n+1} 單元 ${i.name}" aria-pressed="${n===0}"><span aria-hidden="true">${i.icon}</span><small>${String(n+1).padStart(2,'0')}</small><b>${i.name}</b></button>`).join('');
$('island-labels').onclick=e=>{const b=e.target.closest('[data-island]');if(b)world.travelTo(b.dataset.island,0);};
function openPassport(){ world.stop();$('passport-owner').textContent=visitors.active().name; $('passport-grid').innerHTML=C.islands.map(i=>`<div class="passport-row"><span aria-hidden="true">${i.icon}</span><div><strong>${i.name}</strong><small>${i.missions.map((m,j)=>`${stamp(i.id,j)} ${m}`).join('　')}</small></div></div>`).join('');$('save-status').textContent=saveOK?'目前訪客的進度自動保留在這台瀏覽器。':'瀏覽器暫時不允許儲存；目前紀錄會保留到關閉頁面前。';$('passport').showModal();}
$('passport-open').onclick=openPassport;$('passport-close').onclick=()=>$('passport').close();$('passport').onclick=e=>{if(e.target===$('passport')){const r=$('passport').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('passport').close();}};
let visitorEdit=false;
function visitorBadge(){const v=visitors.active();$('active-visitor-name').textContent=v.name;$('visitor-color').style.background=v.color;}
function visitorList(){
 $('visitors-list').replaceChildren();
 for(const v of visitors.list()){
  const row=document.createElement('div');row.className='visitor-row';
  const avatar=document.createElement('span');avatar.className='visitor-avatar';avatar.style.background=v.color;avatar.textContent='♟';
  const copy=document.createElement('div'),name=document.createElement('strong'),detail=document.createElement('small');name.textContent=v.name;detail.textContent=`${Object.values(v.progress).reduce((n,p)=>n+Object.keys(p).length,0)} / 27 個任務`;copy.append(name,detail);
  const button=document.createElement('button');button.dataset.visitor=v.id;button.textContent=v.id===visitors.active().id?'目前訪客':'切換';button.disabled=v.id===visitors.active().id;row.append(avatar,copy,button);$('visitors-list').append(row);
 }
}
function visitorForm(edit){visitorEdit=edit;$('visitor-name').value=edit?visitors.active().name:'';$('visitor-look').value=edit?visitors.active().color:MathIslandVisitors.colors[0];$('visitor-form-title').textContent=edit?'自訂目前訪客':'新增訪客';$('visitor-submit').textContent=edit?'儲存姓名與造型':'新增並出發 →';$('visitor-add-mode').hidden=!edit;$('visitor-error').textContent='';}
function openVisitors(edit=false){world.stop();visitorList();visitorForm(edit);$('visitors-dialog').showModal();if(edit)$('visitor-name').focus();}
function applyVisitor(){const v=visitors.active();progress=v.progress;saveOK=visitors.saved();current=null;evidence.clear();world.setVisitor(v);world.setProgress(progress);visitorBadge();selectIsland(v.islandId,false);}
$('visitors-open').onclick=()=>openVisitors(false);$('visitor-switch').onclick=()=>openVisitors(false);$('visitor-edit').onclick=()=>openVisitors(true);$('visitors-close').onclick=()=>$('visitors-dialog').close();$('visitor-add-mode').onclick=()=>visitorForm(false);
$('visitor-form').onsubmit=e=>{e.preventDefault();try{world.stop();if(visitorEdit){visitors.rename($('visitor-name').value,$('visitor-look').value);world.setVisitor(visitors.active());visitorBadge();}else{visitors.add($('visitor-name').value,$('visitor-look').value);applyVisitor();}saveOK=visitors.saved();$('visitors-dialog').close();}catch(error){$('visitor-error').textContent=error.message;}};
$('visitors-list').onclick=e=>{const button=e.target.closest('[data-visitor]');if(!button)return;world.stop();if(visitors.switchTo(button.dataset.visitor)){applyVisitor();$('visitors-dialog').close();}};
world=createMathWorld(selectIsland,{onPosition(p,id){saveOK=visitors.locate(p,id);}});world.setProgress(progress);world.setVisitor(visitors.active());visitorBadge();
$('overview').onclick=()=>world.overview();$('follow-visitor').onclick=()=>world.follow();$('zoom-in').onclick=()=>world.zoom(.82);$('zoom-out').onclick=()=>world.zoom(1.22);$('map-mode').onclick=()=>{$('map-mode').setAttribute('aria-pressed',String(world.toggleFlat()));};$('motion-toggle').onclick=()=>{const paused=world.toggleMotion();$('motion-toggle').setAttribute('aria-pressed',String(paused));$('motion-toggle').textContent=paused?'恢復動態':'暫停動態';};
const requested=location.hash.slice(1)||new URLSearchParams(location.search).get('unit');selectIsland(visitors.active().islandId,false);if(C.islands.some(i=>i.id===requested)&&requested!==visitors.active().islandId)world.travelTo(requested,0);

})();
