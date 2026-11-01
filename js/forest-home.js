/* 把既有單元、教具、練習與觀察串成可使用的教學流程。 */
(function () {
  'use strict';
  const goals = {
    u1: '用錢幣和位值表，讀出並比較 10000 以內的數。',
    u2: '把位數對齊，練習四位數加減與進退位。',
    u3: '用積木和分配的想法，理解多位數乘法。',
    u4: '從 0 刻度出發，量一量毫米與公分。',
    u5: '找角、比直角，分辨正方形與長方形。',
    u6: '動手平分與分裝，看看商和餘數代表什麼。',
    u7: '倒一倒、比一比，理解公升和毫升。',
    u8: '從公平分享出發，認識分數與大小比較。',
    u9: '找圓心、量半徑，探索直徑與半徑的關係。'
  };
  let currentUnit;
  const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[c]);
  function render(unit) {
    currentUnit = unit;
    const title = document.getElementById('home-unit-name');
    if (!title) return;
    title.textContent = unit.title;
    document.getElementById('home-unit-number').textContent = `探索 ${String(unit.number).padStart(2, '0')}`;
    document.getElementById('home-unit-goal').textContent = goals[unit.id];
    document.getElementById('home-concrete-goal').textContent = unit.cra.concrete;
  }
  function aiPrompt(unit) {
    return `你是協助教師備課的數學教學夥伴。請根據下列公開教材資料，草擬一份可由教師檢核的 40 分鐘教案。\n\n年級：國小三年級上學期\n單元：${unit.title}\n學習重點：${goals[unit.id]}\n數學學習內容：${unit.curriculumCode}\n特殊需求指標：${unit.specialNeedsCodes.join('、')}\n先備檢核：${unit.prerequisite.diagnosticCheck}\n具體操作：${unit.cra.concrete}\n圖像連結：${unit.cra.representational}\n抽象符號：${unit.cra.abstract}\n常見迷思：${unit.misconception.name}\n\n請依序輸出：\n1. 可觀察的目標（條件、表現及達成標準）。\n2. 先備檢核與 40 分鐘流程，寫清楚教師引導及學生行動。\n3. 全提示、部分提示與獨立嘗試三種支持方式；支持依觀察調整，不能只用障礙標籤決定。\n4. 操作員、說明員、檢查員輪替的合作任務。\n5. 五題練習，附答案、逐步解釋與教師複核欄。\n6. 首次作答、提示程度、操作及口述的觀察表。\n\n學生需求由教師另行以不含身分資訊的方式補充。不得編造學生表現、試教成效、研究引文或障礙診斷。請將不確定處標示為需教師確認，計算與課綱代碼均須由教師複核。`;
  }
  function openGuide() {
    if (!currentUnit) return;
    const unit = currentUnit;
    let dialog = document.getElementById('lesson-guide-dialog');
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.id = 'lesson-guide-dialog';
      dialog.className = 'lesson-guide-dialog';
      dialog.setAttribute('aria-labelledby', 'lesson-guide-title');
      document.body.appendChild(dialog);
    }
    const tasks = [
      unit.cra.concrete,
      '先確認練習對象與支持程度，再開始作答。把首次答對、提示後完成與獨立作答分開觀察。',
      '輪流計算與說明解法；答錯不扣分，確認方法後再前進。',
      '選擇符合本課概念的遊戲，先示範玩法，再讓學生操作。',
      '前往目前單元的數學島，完成一個任務並說說怎麼想；最後回顧今天的方法。'
    ];
    const phases = window.MathLessonFlow.steps.map(([id,title,time],i)=>[time,title,tasks[i]]);
    dialog.innerHTML = `<header class="lesson-guide-header"><div><span>教學設計與使用說明</span><h2 id="lesson-guide-title">${escape(unit.title)} · 40 分鐘教學流程</h2></div><form method="dialog"><button class="guide-close" aria-label="關閉教學流程">✕</button></form></header>
      <div class="lesson-guide-body"><p class="guide-notice">這是一份可調整的教學示例。時間、題量及達成標準由教師依先備能力與 IEP 決定，不代表已完成試教。</p>
      <section><h3>這一課要學什麼？</h3><p>${escape(goals[unit.id])}</p><p><strong>目標草案：</strong>在選定的支持程度下，完成本單元 5 次操作或作答，至少 4 次符合目標，並至少一次口述或指認關鍵步驟。教師可依個別需要調整。</p><p class="guide-codes">數學：${escape(unit.curriculumCode)}｜特殊需求：${escape(unit.specialNeedsCodes.join('、'))}</p></section>
      <section><h3>教學流程</h3><ol class="guide-phases">${phases.map(([time,title,task])=>`<li><span>${time}</span><div><strong>${title}</strong><p>${escape(task)}</p></div></li>`).join('')}</ol></section>
      <section><h3>一起完成的合作小任務</h3><p>同一個學習目標，用三個角色輪流參與。可以操作、口述、指認或畫記回應，角色不依能力高低固定分配。</p><div class="guide-roles"><article><strong>操作員</strong><p>動手擺放、測量或分配，讓夥伴看見想法。</p></article><article><strong>說明員</strong><p>用自己的方式說出或指認每一步的意思。</p></article><article><strong>檢查員</strong><p>對照步驟，指出一個需要確認的地方。</p></article></div><p><strong>本課檢查線索：</strong>${escape(unit.scaffoldingSteps.at(-1).checkRule)}</p></section>
      <section><h3>支持與觀察怎麼做？</h3><ul><li>全提示：先示範並提供位值、圖像或步驟支持。</li><li>部分提示：保留必要線索，讓學生完成更多步驟。</li><li>自己試試：在確認準備度後減少提示，保留可求助的入口。</li><li>到「隨堂練習」設定學生代號及支持程度；紀錄只留在本瀏覽器。</li><li>到「隨堂診斷」檢視及匯出實際作答；再搭配口述、實物操作與不同情境觀察。</li></ul><p>累計答對率不能直接當作介入成效。試教時另記日期、題型與支持條件，使用相近但不同的題目觀察改變。</p></section>
      <section><h3>製作與維護方式</h3><ol><li>依九單元整理目標、先備能力、常見迷思、具體到抽象的教學步驟及題庫。</li><li>以 HTML、CSS、JavaScript 製作互動教具；動物為程式繪製的原創 SVG，動作由 CSS 呈現。</li><li>在電腦與手機瀏覽器檢查答案、操作、字級及鍵盤互動，再以 Git 版本控制保存修改。</li><li>透過 GitHub Pages 發布靜態網站。教師以網址操作；沒有學生帳號或跨裝置同步服務。</li></ol></section><section><h3>開始使用與保存</h3><ol><li>以可上網的電腦或平板開啟網站，選取單元；不必註冊。</li><li>從「顯示與朗讀」調整語速、高對比或低刺激模式；鍵盤 Tab 可移動焦點。</li><li>使用課堂教具、隨堂練習、分組活動及學習單，依教學需要切換。</li><li>實際紀錄儲存在本機瀏覽器；換裝置不會自動同步，請由教師匯出備份。</li></ol><p>語音可用聲線依裝置而異；部分遊戲及字型需要網路。未另提供完整離線版本。</p></section>
      <details class="ai-planning"><summary>AI 輔助備課：複製本單元提示詞</summary><p>複製後貼到你使用的 AI 工具，產出的教案與答案由教師檢核後使用。這裡提供提示詞草稿，不會自動產生教案。</p><label for="ai-lesson-prompt">本單元備課提示詞</label><textarea id="ai-lesson-prompt" readonly rows="10">${escape(aiPrompt(unit))}</textarea><button type="button" data-guide-copy>複製備課提示詞</button><p id="ai-copy-status" role="status"></p></details>
      </div><footer class="lesson-guide-footer"><button type="button" data-guide-records>前往學習觀察</button><button type="button" data-guide-print>列印教學流程</button><form method="dialog"><button>回到課堂</button></form></footer>`;
    if (window.MathI18n) window.MathI18n.generated(dialog.querySelector('#ai-lesson-prompt'), aiPrompt(unit));
    dialog.querySelector('[data-guide-copy]').addEventListener('click', async () => {
      const field = dialog.querySelector('#ai-lesson-prompt');
      try { await navigator.clipboard.writeText(field.value); dialog.querySelector('#ai-copy-status').textContent = '已複製，請貼到你使用的 AI 工具。'; }
      catch (_) { field.focus(); field.select(); dialog.querySelector('#ai-copy-status').textContent = '請使用複製快捷鍵複製已選取的文字。'; }
    });
    dialog.querySelector('[data-guide-print]').addEventListener('click', () => {
      document.body.classList.add('printing-lesson-guide');
      try { window.print(); } finally { document.body.classList.remove('printing-lesson-guide'); }
    });
    dialog.querySelector('[data-guide-records]').addEventListener('click', () => { dialog.close(); window.switchSpEdTab('iep'); });
    dialog.showModal();
  }
  window.ForestHome = { render, openGuide };
  document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('click', event => {
      const tab = event.target.closest('[data-home-tab]');
      if (tab) window.switchSpEdTab(tab.dataset.homeTab);
      const action = event.target.closest('[data-home-action]')?.dataset.homeAction;
      if (action === 'guide') openGuide();
      if (action === 'briefing') window.openQuickBriefingModal();
      if (action === 'worksheet') window.WorksheetGenerator.openWorksheetModal();
    });
  });
})();
