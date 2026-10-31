/* 接上既有單元選擇，保留主平台的教具與教學流程。 */
document.addEventListener('DOMContentLoaded',()=>{
  const select=document.getElementById('lesson-unit-quick-select');
  const refresh=()=>{document.querySelectorAll('[data-math-islands-link]').forEach(link=>{link.href=`islands/index.html#${/^u[1-9]$/.test(select?.value)?select.value:'u1'}`;});};
  document.addEventListener('change',refresh);
  document.getElementById('unit-nav-list')?.addEventListener('click',()=>queueMicrotask(refresh));
  const requested=new URLSearchParams(location.search).get('unit');
  if(select&&/^u[1-9]$/.test(requested)){select.value=requested;select.dispatchEvent(new Event('change',{bubbles:true}));}
  refresh();
});
