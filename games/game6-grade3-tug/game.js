(function(){
  'use strict';
  const data=window.NANI_G3S1_DATA,engine=window.Grade3Tug;
  const $=s=>document.querySelector(s),esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icons=['🪙','🛒','🥐','📏','🏰','🧺','🧃','🍕','🎡'];
  const requested=new URLSearchParams(location.search).get('unit');
  let selected=new Set([/^u[1-9]$/.test(requested)?requested:'u1']),model=null,pool=[],names={},lastTick=0,aiWait=0,shownResult=false;
  const music=window.ForestTugMusic.create();
  const header=document.querySelector('.game-header');
  const measureHeader=()=>document.documentElement.style.setProperty('--game-header-height',`${header.getBoundingClientRect().height}px`);
  new ResizeObserver(measureHeader).observe(header);measureHeader();
  const t=text=>window.MathI18n?.t(text)??text;
  function animal(x,kind,color,flip=false){
    const ears=kind==='rabbit'?'<ellipse cx="-12" cy="-52" rx="7" ry="24" fill="#fff2d8"/><ellipse cx="10" cy="-51" rx="7" ry="24" fill="#fff2d8"/>':kind==='fox'?'<path d="M-26-17-27-50-6-31M9-31 29-50 25-15" fill="#d89b55"/>':'<circle cx="-22" cy="-29" r="11" fill="#bb976e"/><circle cx="22" cy="-29" r="11" fill="#bb976e"/>';
    const fur=kind==='fox'?'#dfaa69':kind==='rabbit'?'#fff2d8':'#bb976e';
    return `<g transform="translate(${x} 122) ${flip?'scale(-1 1)':''}"><ellipse cy="84" rx="43" ry="6" fill="#b3c5b3" opacity=".4"/><path d="M-13 48-33 79M13 48 35 79" stroke="#354857" stroke-width="14" stroke-linecap="round"/><path d="M-39 83h22M27 83h20" stroke="${color}" stroke-width="10" stroke-linecap="round"/><path d="M-25-1 23 3 17 51-20 48Z" fill="${color}" stroke="#ffffff" stroke-width="2"/><path d="M9 12 59 32M-6 22 43 31" stroke="${color}" stroke-width="13" stroke-linecap="round"/><circle cx="59" cy="32" r="7" fill="${fur}"/><g class="animal-head">${ears}<circle cy="-20" r="29" fill="${fur}"/><ellipse cx="5" cy="-10" rx="19" ry="15" fill="#fff7e6"/><circle cx="-7" cy="-24" r="3" fill="#283e42"/><circle cx="13" cy="-24" r="3" fill="#283e42"/><ellipse cx="4" cy="-13" rx="4" ry="3" fill="#5e493c"/><path d="M0-5q5 6 10-1" fill="none" stroke="#6c4d3f" stroke-width="2" stroke-linecap="round"/><circle cx="-17" cy="-12" r="4" fill="#efaa8e" opacity=".7"/></g><rect x="-11" y="14" width="18" height="15" rx="4" fill="white" opacity=".9"/></g>`;
  }
  function arenaSVG(){
    return `<svg viewBox="0 0 1000 225" role="img" aria-label="藍紅兩隊各三位動物隊員，一起拉繩子"><path d="M0 203q200-40 400-8t600-5v35H0Z" fill="#d5e8c8"/><path d="M88 35l4-12 4 12 13 1-10 8 3 12-10-7-11 7 4-12-10-8Z" fill="#f3d48b"/><circle cx="903" cy="40" r="17" fill="#f4df9b"/><path d="M500 8v200" stroke="#7b9487" stroke-dasharray="5 5"/><g class="arena-movers"><path d="M75 155q425-18 850 0" fill="none" stroke="#b88b51" stroke-width="9" stroke-linecap="round"/><path d="M75 155q425-18 850 0" fill="none" stroke="#f2d89a" stroke-width="3" stroke-dasharray="8 8"/>${[160,280,400].map((x,i)=>animal(x,['bear','rabbit','fox'][i],'#3e8cb5')).join('')}${[600,720,840].map((x,i)=>animal(x,['fox','bear','rabbit'][i],'#d46b57',true)).join('')}<path d="M495 130v57l13-9 10 5-13-45Z" fill="#e0714f" stroke="#fff7df" stroke-width="2"/></g></svg>`;
  }
  $('#welcome-art').innerHTML=arenaSVG();$('#arena-art').innerHTML=arenaSVG();
  function updateSettings(){
    $('#unit-picker').innerHTML=data.units.map((u,i)=>`<button type="button" data-unit="${u.id}" aria-pressed="${selected.has(u.id)}"><span class="unit-icon" aria-hidden="true">${icons[i]}</span><span>${u.number}. ${esc(u.title)}</span><small>${data.practiceBank.filter(q=>q.unitId===u.id).length} 題</small></button>`).join('');
    const select=$('#section'),old=select.value,unit=data.units.find(u=>u.id===[...selected][0]);
    select.innerHTML='<option value="all">整個單元</option>'+(selected.size===1?unit.sections.map(s=>`<option value="${s.id}">${esc(s.title)}</option>`).join(''):'');
    if(selected.size===1&&unit.sections.some(s=>s.id===old))select.value=old;
    select.disabled=selected.size!==1;
    updatePool();
  }
  function updatePool(){
    pool=engine.selectPool(data,{units:[...selected],section:$('#section').value,level:$('#level').value});
    $('#pool-note').textContent=`已選 ${selected.size} 個單元 · 本次題庫 ${pool.length} 題`;
    $('#start').disabled=!pool.length;
    $('#ai-setting').hidden=document.querySelector('[name=mode]:checked').value!=='ai';
  }
  $('#unit-picker').addEventListener('click',e=>{const b=e.target.closest('[data-unit]');if(!b)return;const id=b.dataset.unit;if(selected.has(id)){if(selected.size===1)return;selected.delete(id);}else selected.add(id);$('#section').value='all';updateSettings();});
  $('#select-all').addEventListener('click',()=>{selected=new Set(selected.size===9?[requested&&/^u[1-9]$/.test(requested)?requested:'u1']:data.units.map(u=>u.id));$('#section').value='all';updateSettings();});
  for(const s of ['#section','#level','[name=mode]'])document.querySelectorAll(s).forEach(el=>el.addEventListener('change',updatePool));
  function stopVoice(){window.spEdAudio?.stopSpeech();music.unduck();}
  function speak(text){music.duck();window.spEdAudio?.speak(text);}
  function stopMusic(){music.stop();}
  function startMusic(){
    stopMusic();if($('#music').getAttribute('aria-pressed')==='true'&&model?.state.phase==='playing')music.start();
  }
  function sound(correct){if($('#sound').getAttribute('aria-pressed')==='true')window.spEdAudio?.playTone(correct?[523.25,659.25,783.99]:[440,349.23], 'triangle',.22,.10);}
  $('#sound').addEventListener('click',()=>$('#sound').setAttribute('aria-pressed',String($('#sound').getAttribute('aria-pressed')!=='true')));
  $('#music').addEventListener('click',()=>{const on=$('#music').getAttribute('aria-pressed')!=='true';$('#music').setAttribute('aria-pressed',String(on));startMusic();});
  $('#calm').addEventListener('click',()=>{const on=!document.body.classList.contains('calm');document.body.classList.toggle('calm',on);$('#calm').setAttribute('aria-pressed',String(on));});
  $('#rules-open').addEventListener('click',()=>{pause();$('#rules-dialog').showModal();});
  const teamName=team=>names[team]||(team==='blue'?t('藍隊'):t('紅隊'));
  function current(team){return model.state[team].current;}
  function renderTeam(team){
    const player=model.state[team],q=current(team),p=q.question,unit=data.units.find(u=>u.id===p.unitId),computer=team==='red'&&model.state.mode==='ai';
    let host=$(`#team-${team}`);
    if(!host){host=document.createElement('article');host.id=`team-${team}`;host.className=`team-card ${team}`;$('#question-teams').append(host);}
    host.setAttribute('aria-label',team==='blue'?'藍隊題目區':'紅隊題目區');
    host.innerHTML=`<header class="team-card-header"><h2 translate="no" data-team-name="${team}">${esc(teamName(team))}</h2><span class="streak">🔥 連對 ${player.streak}</span></header><section class="team-task"><span class="question-meta">${esc(unit.title)} · ${esc(p.sectionTitle)}</span><h3 class="question-text" tabindex="-1">${esc(p.question)}</h3><div class="question-figure">${window.WorksheetDiagrams.render(p).replace(/\bid="([^"]+)"/g,`id="${team}-$1"`).replace(/url\(#([^)]+)\)/g,`url(#${team}-$1)`)}</div><div class="question-tools"><button data-action="read" data-team="${team}">🔊 朗讀題目</button><button data-action="choices" data-team="${team}">聽選項</button><button data-action="hint" data-team="${team}" ${computer?'disabled':''}>💡 看提示</button><button data-action="stop">停止朗讀</button></div></section><div class="answers">${q.options.map((o,i)=>`<button data-action="answer" data-team="${team}" data-choice="${i}" ${computer||q.locked||q.wrong.has(i)?'disabled':''} class="${q.wrong.has(i)?'wrong':''}"><b aria-hidden="true">${i+1}</b><span>${esc(o.text)}</span></button>`).join('')}</div><p class="team-feedback" role="status" aria-live="polite"></p><div class="team-hint" hidden></div><div class="team-next"><span class="turn-indicator">${computer?'電腦陪練中':`這題輪到隊員 ${((player.turn-1)%3)+1}`}</span><button data-action="next" data-team="${team}" ${computer?'disabled':''}>先跳過 →</button></div>`;
    if(model.state.phase==='paused')host.querySelectorAll('button').forEach(b=>{b.disabled=true;});
  }
  function status(){
    const s=model.state;
    $('#blue-score').textContent=s.blue.completed;$('#red-score').textContent=s.red.completed;
    const second=Math.ceil((s.remaining||0)/1000);
    $('#clock').textContent=s.remaining===null?'不限時':`${String(Math.floor(second/60)).padStart(2,'0')}:${String(second%60).padStart(2,'0')}`;
    $('#rope-marker').style.left=`${50+s.rope*.47}%`;
    $('.rope-progress').setAttribute('aria-valuenow',s.rope);
    $('#arena-art .arena-movers').setAttribute('transform',`translate(${s.rope*1.1} 0)`);
    if(s.phase==='finished'&&!shownResult)results();
  }
  function start(){
    stopVoice();shownResult=false;names={blue:$('#blue-name').value.trim().slice(0,16),red:$('#red-name').value.trim().slice(0,16)};
    model=engine.create({pool,mode:document.querySelector('[name=mode]:checked').value,seconds:Number($('#duration').value)});
    $('#blue-label').textContent=teamName('blue');$('#red-label').textContent=teamName('red');
    $('#setup').hidden=$('#results').hidden=true;$('#match').hidden=false;document.body.classList.remove('paused');$('#paused-message').hidden=true;$('#pause').textContent='暫停比賽';
    $('#question-teams').innerHTML='';renderTeam('blue');renderTeam('red');status();lastTick=Date.now();aiWait=Number($('#ai-speed').value)*1000;
    $('#cheer').textContent='準備好了，就從第一題開始！';$('#arena').hidden=false;$('#arena-toggle').setAttribute('aria-expanded','true');$('#arena-toggle').textContent='收合賽場';startMusic();window.scrollTo({top:0,behavior:'auto'});$('#team-blue .question-text').focus({preventScroll:true});
  }
  function pause(){
    if(!model||model.state.phase!=='playing')return;
    model.pause();document.body.classList.add('paused');$('#paused-message').hidden=false;$('#pause').textContent='繼續比賽';stopVoice();stopMusic();
    $('#question-teams').querySelectorAll('button').forEach(b=>{b.dataset.beforePause=String(b.disabled);b.disabled=true;});
  }
  function resume(){
    if(!model||model.state.phase!=='paused')return;
    model.resume();lastTick=Date.now();document.body.classList.remove('paused');$('#paused-message').hidden=true;$('#pause').textContent='暫停比賽';
    $('#question-teams').querySelectorAll('button').forEach(b=>{b.disabled=b.dataset.beforePause==='true';delete b.dataset.beforePause;});startMusic();
  }
  function answer(team,index){
    const outcome=model.answer(team,index);if(!outcome)return;
    const host=$(`#team-${team}`),q=current(team);
    host.querySelector('.streak').textContent=`🔥 連對 ${model.state[team].streak}`;
    host.querySelectorAll('[data-choice]').forEach(b=>{const i=Number(b.dataset.choice);b.disabled=q.locked||q.wrong.has(i)||(team==='red'&&model.state.mode==='ai');b.classList.toggle('wrong',q.wrong.has(i));if(q.locked)b.classList.toggle('correct',q.options[i].index===q.question.answerIndex);});
    if(outcome.correct){
      host.querySelector('.team-feedback').textContent=outcome.independent?'答對了！把想法說出來，再前進。':'有提示也能前進！再說一次你的方法。';
      host.querySelector('[data-action=next]').textContent='下一題 →';$('#cheer').textContent=outcome.power>8?'三人齊心，連對加力！':'好想法！小隊一起往前拉。';
      $('#arena-art').classList.remove('cheering');requestAnimationFrame(()=>$('#arena-art').classList.add('cheering'));
    }else{
      host.querySelector('.team-feedback').textContent='再想一想，繩子不倒退。可以看提示後再試。';
    }
    sound(outcome.correct);status();
  }
  function showHint(team){
    if(!model.help(team))return;const hint=$(`#team-${team} .team-hint`);hint.hidden=false;hint.textContent=current(team).question.hint;
    $(`#team-${team} .streak`).textContent='🔥 連對 0';
  }
  $('#question-teams').addEventListener('click',e=>{
    const b=e.target.closest('[data-action]');if(!b||b.disabled||model.state.phase!=='playing')return;const team=b.dataset.team,action=b.dataset.action;
    if(action==='stop')return stopVoice();
    if(action==='read')speak(current(team).question.speechText||current(team).question.question);
    if(action==='choices')speak(current(team).options.map((o,i)=>`${i+1}，${o.text}`).join('。'));
    if(action==='hint')showHint(team);
    if(action==='answer')answer(team,Number(b.dataset.choice));
    if(action==='next'){stopVoice();model.next(team);renderTeam(team);$(`#team-${team} .question-text`).focus({preventScroll:true});status();}
  });
  function results(){
    shownResult=true;stopVoice();stopMusic();$('#match').hidden=true;$('#results').hidden=false;document.body.classList.remove('paused');
    const s=model.state;$('#result-message').textContent=s.winner?(s.winner==='blue'?'藍隊獲勝，謝謝兩隊一起努力！':'紅隊獲勝，謝謝兩隊一起努力！'):'平手！兩隊都完成了很棒的練習。';
    $('#result-stats').innerHTML=`<table class="result-stats"><thead><tr><th>這回合的努力</th><th translate="no" data-team-name="blue">${esc(teamName('blue'))}</th><th translate="no" data-team-name="red">${esc(teamName('red'))}</th></tr></thead><tbody>${[['完成題數','completed'],['首次獨立答對','firstCorrect'],['提示或重試後完成','supported'],['先跳過','skipped'],['最高連對','maxStreak']].map(([label,key])=>`<tr><th>${label}</th><td>${s.blue[key]}</td><td>${s.red[key]}</td></tr>`).join('')}</tbody></table>`;
    const review=[...new Set(s.history.filter(r=>(r.supported||r.skipped)&&(s.mode!=='ai'||r.team==='blue')).map(r=>r.id))].slice(-8);
    $('#review-list').innerHTML=review.length?review.map(id=>{const q=data.practiceBank.find(p=>p.id===id);return `<article class="review-item"><span class="question-meta">${esc(q.sectionTitle)}</span><h3>${esc(q.question)}</h3><details><summary>看看解題方法</summary><p>${esc(q.hint)}</p><p><strong>參考答案：</strong> ${esc(q.options[q.answerIndex])}</p></details></article>`;}).join(''):'<p>這回合沒有提示後完成或跳過的題目；也可以換個情境，說說剛才的方法。</p>';
    $('#result-title').focus();window.scrollTo({top:0,behavior:'auto'});
  }
  $('#start').addEventListener('click',start);$('#rematch').addEventListener('click',start);
  $('#settings-back').addEventListener('click',()=>{stopVoice();stopMusic();$('#results').hidden=$('#match').hidden=true;$('#setup').hidden=false;model=null;window.scrollTo({top:0,behavior:'auto'});});
  $('#pause').addEventListener('click',()=>model.state.phase==='playing'?pause():resume());
  $('#finish').addEventListener('click',()=>{model.finish();status();});
  $('#arena-toggle').addEventListener('click',()=>{const hidden=!$('#arena').hidden;$('#arena').hidden=hidden;$('#arena-toggle').setAttribute('aria-expanded',String(!hidden));$('#arena-toggle').textContent=hidden?'展開賽場':'收合賽場';});
  document.addEventListener('keydown',e=>{
    if(e.repeat||e.ctrlKey||e.metaKey||e.altKey||e.target.closest('input,select,textarea,dialog')||!model||model.state.phase!=='playing'||$('#rules-dialog').open)return;
    const keys={'1':['blue',0],'2':['blue',1],'3':['blue',2],'4':['blue',3],'7':['red',0],'8':['red',1],'9':['red',2],'0':['red',3]},choice=keys[e.key];
    if(!choice||(choice[0]==='red'&&model.state.mode==='ai'))return;e.preventDefault();answer(...choice);
  });
  setInterval(()=>{
    const now=Date.now(),dt=Math.max(0,now-lastTick);lastTick=now;if(!model||model.state.phase!=='playing')return;
    model.tick(dt);if(model.state.phase==='playing'&&model.state.mode==='ai'){
      aiWait-=dt;if(aiWait<=0){if(current('red').locked){model.next('red');renderTeam('red');aiWait=Number($('#ai-speed').value)*1000;}
        else {const q=current('red'),available=q.options.map((_,i)=>i).filter(i=>!q.wrong.has(i));const right=available.find(i=>q.options[i].index===q.question.answerIndex);answer('red',Math.random()<.82?right:available[Math.floor(Math.random()*available.length)]);aiWait=q.locked?1800:Number($('#ai-speed').value)*1000;}}
    }status();
  },200);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
  window.addEventListener('pagehide',()=>{pause();stopVoice();stopMusic();});
  window.addEventListener('message',e=>{if(e.origin===location.origin&&e.source===parent&&e.data?.type==='math-arcade-visibility'&&!e.data.visible)pause();});
  document.addEventListener('math-language-change',()=>{stopVoice();if(!model)return;$('#blue-label').textContent=teamName('blue');$('#red-label').textContent=teamName('red');document.querySelectorAll('[data-team-name]').forEach(n=>{n.textContent=teamName(n.dataset.teamName);});});
  updateSettings();
})();
