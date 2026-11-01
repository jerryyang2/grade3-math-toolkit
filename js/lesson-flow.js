/* 同一個教學單元的五步上課路線；切換活動不重建已開始的作答。 */
(() => {
  'use strict';
  function initialize() {
    const main = document.getElementById('main-content-area');
    const source = document.getElementById('lesson-unit-quick-select');
    if (!main || !source) return;
    const steps = [
      ['units', '課堂教學', '00–16 分', 16],
      ['practice', '隨堂練習', '16–24 分', 8],
      ['battle', '分組搶答', '24–30 分', 6],
      ['arcade', '互動遊戲', '30–35 分', 5],
      ['islands', '對應數學島', '35–40 分', 5]
    ];
    const panel = document.createElement('section');
    panel.className = 'lesson-flow-panel';
    panel.setAttribute('aria-label', '40 分鐘上課路線');
    panel.innerHTML = `<div class="lesson-flow-heading"><strong>40 分鐘上課路線</strong><span>點選步驟切換；時間可依學生步調調整，不必每堂完成全部活動。</span><button type="button" class="lesson-plan-open" data-lesson-plan>📋 本步教案</button></div><nav class="lesson-flow-steps" aria-label="上課五步驟">${steps.map(([id,label,time],i)=>`<button type="button" data-lesson-step="${id}"><span class="lesson-flow-number" aria-hidden="true">${i+1}</span><span class="lesson-flow-copy"><strong>${label}</strong><small>${time}</small></span><span class="lesson-flow-arrow" aria-hidden="true">›</span></button>`).join('')}</nav>`;
    main.prepend(panel);
    const frame = document.getElementById('lesson-island-frame');
    const islandLink = document.getElementById('lesson-island-external');
    let loadedUnit = null;
    const unitId = () => /^u[1-9]$/.test(source.value) ? source.value : 'u1';
    const tab = () => document.querySelector('.tab-pane.active')?.id.slice(4);
    function notifyIsland() {
      frame?.contentWindow?.postMessage({type:'math-lesson-visibility', visible:tab()==='islands'}, location.origin);
    }
    function loadIsland() {
      if (!frame) return;
      const uid = unitId();
      if (loadedUnit !== uid) {
        loadedUnit = uid;
        frame.src = `islands/index.html?lesson=${uid}`;
      }
      if (islandLink) islandLink.href = `islands/index.html?lesson=${uid}`;
    }
    function synchronize() {
      const current = tab();
      panel.hidden = !document.body.classList.contains('lesson-focus') || !steps.some(([id])=>id===current);
      panel.querySelectorAll('[data-lesson-step]').forEach(button => {
        const selected = button.dataset.lessonStep === current;
        button.classList.toggle('active', selected);
        if (selected) button.setAttribute('aria-current', 'step'); else button.removeAttribute('aria-current');
      });
      const nav=panel.querySelector('.lesson-flow-steps'), selected=nav.querySelector('[aria-current="step"]');
      if (!panel.hidden && selected && nav.scrollWidth>nav.clientWidth) {
        const item=selected.getBoundingClientRect(), bounds=nav.getBoundingClientRect();
        if (item.left<bounds.left) nav.scrollLeft-=bounds.left-item.left;
        else if (item.right>bounds.right) nav.scrollLeft+=item.right-bounds.right;
      }
      document.querySelectorAll('[data-math-islands-link]').forEach(link=>{
        link.classList.toggle('active', current==='islands');
        if (current==='islands') link.setAttribute('aria-current','page'); else link.removeAttribute('aria-current');
      });
      if (current==='islands') loadIsland();
      notifyIsland();
    }
    function go(target) {
      if (!steps.some(([id])=>id===target)) return;
      if (target==='practice') {
        const select = document.getElementById('practice-unit-select');
        const unit = window.NANI_G3S1_DATA?.units.find(u=>u.id===unitId());
        if (select && select.value!==unitId() && !unit?.sections?.some(s=>s.id===select.value)) {
          select.value=unitId(); select.dispatchEvent(new Event('change',{bubbles:true}));
        }
      }
      window.switchSpEdTab?.(target);
      synchronize();
      window.scrollTo({top:document.body.classList.contains('lesson-focus') ? 0 : main.offsetTop, behavior:'auto'});
    }
    panel.addEventListener('click',event=>{
      if (event.target.closest('[data-lesson-plan]')) window.ForestHome?.openGuide(tab());
      const button=event.target.closest('[data-lesson-step]');
      if (button) go(button.dataset.lessonStep);
    });
    frame?.addEventListener('load',()=>{
      frame.contentWindow?.MathI18n?.setLanguage(window.MathI18n?.language || 'zh-Hant',false);
      notifyIsland();
    });
    window.addEventListener('message',event=>{
      if (event.origin!==location.origin || event.source!==frame?.contentWindow || event.data?.type!=='math-lesson-return') return;
      if (/^u[1-9]$/.test(event.data.unit) && event.data.unit!==unitId()) {
        source.value=event.data.unit;source.dispatchEvent(new Event('change',{bubbles:true}));
      }
      go('units');
    });
    document.addEventListener('math-tab-change',synchronize);
    source.addEventListener('change',synchronize);
    document.addEventListener('click',event=>{
      const link=event.target.closest('[data-math-islands-link], .math-islands-entry');
      if (link && !event.defaultPrevented && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && event.button===0) {event.preventDefault();go('islands');}
    });
    window.MathLessonFlow = {go, steps, panel, setFocus(focused,bar){
      const parent=focused ? bar : main;
      if (panel.parentElement!==parent) parent.prepend(panel);
      synchronize();
    }};
    window.ForestHome?.renderPrepPlans();
    synchronize();
  }
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',initialize); else initialize();
})();
