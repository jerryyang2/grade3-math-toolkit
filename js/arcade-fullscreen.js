/* 平台內的六款遊戲共用全螢幕舞台；不重新載入正在遊玩的 iframe。 */
(() => {
  'use strict';
  function initialize(){
    const stage=document.getElementById('arcade-player-modal'),frame=document.getElementById('arcade-game-frame');
    if(!stage||!frame)return;
    let active=false,pending=false,ownsNative=false,overflow='';
    const toggleButton=document.getElementById('arcade-fullscreen-toggle');
    const notify=()=>frame.contentWindow?.postMessage({type:'math-game-fullscreen-state',active},location.origin);
    function ui(value){
      if(value&&!active){overflow=document.body.style.overflow;document.body.style.overflow='hidden';}
      if(!value&&active)document.body.style.overflow=overflow;
      active=value;stage.classList.toggle('arcade-stage-full',active);
      toggleButton.textContent=active?'⤡ 離開遊戲全螢幕':'⛶ 全螢幕遊玩';toggleButton.setAttribute('aria-pressed',String(active));notify();
    }
    async function enter(){
      if(active||pending)return;pending=true;ui(true);
      // 已在全螢幕上課時，於原文件鋪滿舞台，避免退出教師原來的課堂模式。
      if(!document.fullscreenElement){try{if(!stage.requestFullscreen)throw Error('Unavailable');await stage.requestFullscreen();if(active)ownsNative=true;else if(document.fullscreenElement===stage)await document.exitFullscreen();}catch(_){}}
      pending=false;
    }
    async function exit(){
      if(!active)return;ui(false);
      if(ownsNative&&document.fullscreenElement===stage){ownsNative=false;try{await document.exitFullscreen();}catch(_){}}
      ownsNative=false;
    }
    toggleButton.addEventListener('click',()=>active?exit():enter());
    document.addEventListener('fullscreenchange',()=>{if(ownsNative&&document.fullscreenElement!==stage){ownsNative=false;ui(false);}});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&active&&!document.querySelector('dialog[open]')){e.stopImmediatePropagation();exit();}},true);
    stage.querySelector('[onclick*="closeArcadePlayer"]')?.addEventListener('click',exit,true);
    window.addEventListener('message',e=>{
      if(e.origin!==location.origin||e.source!==frame.contentWindow)return;
      if(e.data?.type==='math-game-fullscreen')active?exit():enter();
      if(e.data==='close-game-modal')exit();
    });
    const currentUnit=()=>document.getElementById('lesson-unit-quick-select')?.value||'u1';
    const grade3URL=()=>`games/game6-grade3-tug/index.html?unit=${/^u[1-9]$/.test(currentUnit())?currentUnit():'u1'}`;
    document.querySelector('[data-grade3-tug]')?.addEventListener('click',()=>window.launchArcadeGame(grade3URL(),'森林拔河運動會｜三上九單元','🪢'));
    const newLink=document.getElementById('grade3-tug-external');
    const updateLink=()=>{if(newLink)newLink.href=grade3URL();};updateLink();document.getElementById('lesson-unit-quick-select')?.addEventListener('change',updateLink);
    for(const event of ['pointerdown','focus','click'])newLink?.addEventListener(event,updateLink);
    document.querySelectorAll('.arcade-card-actions').forEach(actions=>{
      const link=actions.querySelector('a[href^="games/"]');if(!link)return;
      const button=document.createElement('button');button.type='button';button.className='kid-btn arcade-fullscreen-entry';button.textContent='⛶ 全螢幕遊玩';
      button.addEventListener('click',()=>{
        const url=actions.querySelector('[data-grade3-tug]')?grade3URL():link.getAttribute('href');
        if(frame.getAttribute('src')!==url||stage.style.display==='none')window.launchArcadeGame(url,actions.closest('.arcade-card').querySelector('.arcade-card-title').textContent,'🎮');
        enter();
      });actions.append(button);
    });
    frame.addEventListener('load',notify);
    document.addEventListener('math-tab-change',()=>frame.contentWindow?.postMessage({type:'math-arcade-visibility',visible:document.getElementById('tab-arcade')?.classList.contains('active')},location.origin));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize);else initialize();
})();
