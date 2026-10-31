/* 列印視窗只處理顯示；分頁和 PDF 使用同一個 WorksheetLayout。 */
(function(){
  'use strict';
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const payload=JSON.parse(document.getElementById('worksheet-payload').textContent);
  function render(){
    const i18n=window.MathI18n,t=s=>i18n?.t(s)||s;
    const sheet={...payload.sheet,problems:payload.sheet.problems.map(p=>({...p,question:t(p.question),options:p.options.map(t),svg:p.svg?i18n?.markup(p.svg)||p.svg:''}))};
    const settings={...payload.settings,t,language:i18n?.language||'zh-Hant'};
    try{
      const plan=window.WorksheetLayout.plan(sheet,settings);
      document.getElementById('worksheet-pages').innerHTML=plan.pages.map((page,i)=>`<section class="ws-sheet" data-page="${i+1}" translate="no"><div class="ws-readable"><h2>${esc(t(`本份第 ${i+1} / ${plan.pages.length} 頁 得分：______`))}</h2>${page.questions.map(q=>{const p=sheet.problems.find(p=>p.id===q.id),description=p.svg?new DOMParser().parseFromString(p.svg,'image/svg+xml').documentElement.getAttribute('aria-label')||'':'';return `<article data-question-id="${esc(p.id)}"><h3>${esc(t(`第 ${sheet.problems.indexOf(p)+1} 題`))}</h3><p>${esc(p.question)}</p>${description?`<p>${esc(description)}</p>`:''}<ol type="A">${p.options.map(o=>`<li>${esc(o)}</li>`).join('')}</ol></article>`;}).join('')}</div><div aria-hidden="true">${window.WorksheetLayout.svgPage(page)}</div></section>`).join('');
      document.getElementById('worksheet-error').hidden=true;
    }catch(error){
      document.getElementById('worksheet-pages').replaceChildren();
      const status=document.getElementById('worksheet-error');status.hidden=false;status.textContent=t('無法完成學習單排版，請關閉視窗後重新選擇。');
    }
  }
  document.getElementById('worksheet-print').addEventListener('click',()=>{if(document.getElementById('worksheet-error').hidden)window.print();});
  document.querySelector('[data-language-select]').addEventListener('change',event=>window.MathI18n?.setLanguage(event.target.value));
  document.addEventListener('math-language-change',render);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render);else render();
})();
