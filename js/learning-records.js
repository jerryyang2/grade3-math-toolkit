/* 實際作答證據與虛構示範資料分開；僅儲存在此瀏覽器。 */
(function () {
  'use strict';
  const SUPPORTS = { independent: '獨立作答', prompted: '看過提示／解題', verbal: '口語引導', physical: '肢體協助' };
  const rank = value => Object.keys(SUPPORTS).indexOf(value);
  function recordAttempt(entries, attempt) {
    if (!attempt.studentId || !attempt.questionId || !attempt.sessionId || !SUPPORTS[attempt.support]) throw new Error('Invalid attempt');
    const index = entries.findIndex(e => e.sessionId === attempt.sessionId && e.studentId === attempt.studentId && e.questionId === attempt.questionId);
    const previous = entries[index];
    const item = previous ? {
      ...previous, attempts: previous.attempts + 1, finalCorrect: previous.finalCorrect || attempt.correct,
      support: rank(attempt.support) > rank(previous.support) ? attempt.support : previous.support
    } : {
      studentId: String(attempt.studentId), questionId: attempt.questionId, unitId: attempt.unitId,
      sessionId: attempt.sessionId, firstCorrect: !!attempt.correct, finalCorrect: !!attempt.correct,
      firstSupport: attempt.support, support: attempt.support, attempts: 1, time: attempt.time || new Date().toISOString()
    };
    const next = entries.slice();
    if (previous) next[index] = item; else next.push(item);
    return { entries: next, first: !previous, reward: !!attempt.correct && !previous?.finalCorrect };
  }
  function summarize(entries, studentId, unitId) {
    const rows = entries.filter(e => e.studentId === String(studentId) && (!unitId || e.unitId === unitId));
    const total = rows.length;
    const first = rows.filter(e => e.firstCorrect).length;
    const independent = rows.filter(e => e.firstCorrect && e.firstSupport === 'independent').length;
    return { total, first, independent, final: rows.filter(e => e.finalCorrect).length,
      firstRate: total ? Math.round(first / total * 100) : null,
      independentRate: total ? Math.round(independent / total * 100) : null, rows };
  }
  const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  if (typeof module !== 'undefined' && module.exports) module.exports = { recordAttempt, summarize, SUPPORTS };
  if (typeof document === 'undefined') return;
  const key = 'math_learning_evidence_v1';
  let entries = [], writable = true, studentId = '', sessionId = String(Date.now()), support = 'independent';
  const demoAttempts = new Map();
  const questionSupports = new Map();
  let activeQuestion = '';
  const supportKey = () => `${sessionId}:${studentId}:${activeQuestion}`;
  try {
    const saved = JSON.parse(localStorage.getItem(key) || '[]');
    if (!Array.isArray(saved) || saved.some(e => !e || typeof e.studentId !== 'string' || typeof e.questionId !== 'string' || typeof e.sessionId !== 'string' || typeof e.unitId !== 'string' || typeof e.time !== 'string' || !SUPPORTS[e.firstSupport] || !SUPPORTS[e.support] || typeof e.firstCorrect !== 'boolean' || typeof e.finalCorrect !== 'boolean' || !Number.isInteger(e.attempts) || e.attempts < 1)) throw new Error('Invalid records');
    entries = saved;
  } catch (_) { writable = false; }
  function save() {
    if (!writable) return;
    try { localStorage.setItem(key, JSON.stringify(entries)); } catch (_) { writable = false; }
  }
  function students() { return window.StudentBank?.getStudents() || []; }
  function status() {
    const slot = document.getElementById('practice-record-status');
    if (!slot) return;
    const summary = document.getElementById('practice-settings-summary');
    if (summary) summary.textContent = `練習設定與紀錄：${studentId ? (students().find(s => String(s.id) === studentId)?.name || studentId) : '示範模式（不記錄）'}`;
    const stats = summarize(entries.filter(e => e.sessionId === sessionId), studentId);
    slot.textContent = studentId ? `本回合 ${stats.total} 題觀察 · 首次答對 ${stats.first} · 獨立首次答對 ${stats.independent}。同題重練不重複計次。` : '示範模式：不寫入學生紀錄。選擇代號後才開始記錄首次作答與提示程度。';
    if (!writable) slot.textContent += ' 瀏覽器無法安全儲存，目前僅暫存，請先匯出紀錄。';
  }
  function renderDashboard(preferred) {
    const root = document.getElementById('learning-records-dashboard');
    if (!root) return;
    const selected = (typeof preferred === 'string' && preferred) || root.querySelector('select')?.value || studentId || String(students()[0]?.id || '');
    const unitFilter=root.querySelector('#records-unit-select')?.value || '';
    const stats = summarize(entries, selected, unitFilter);
    const bank=window.NANI_G3S1_DATA?.practiceBank || [],units=window.NANI_G3S1_DATA?.units || [];
    const sections=window.MathPracticeSession.sectionSummary(entries,selected,bank).filter(row=>!unitFilter||row.unitId===unitFilter);
    root.innerHTML = `<section class="card evidence-card"><h2>實際學習觀察</h2><p>只計入本瀏覽器的練習作答；首次答對、獨立答對與提示後完成分開呈現，不推斷障礙類型。${!writable ? '目前無法安全儲存，請匯出備份。' : ''}</p>
      <div class="evidence-toolbar"><label>學生代號 <select id="records-student-select">${students().map(s => `<option translate="no" value="${s.id}" ${String(s.id) === selected ? 'selected' : ''}>${escapeHtml(s.name)}</option>`).join('')}</select></label><label>觀察單元<select id="records-unit-select"><option value="">全部單元</option>${units.map(u=>`<option value="${u.id}" ${u.id===unitFilter?'selected':''}>${escapeHtml(u.title)}</option>`).join('')}</select></label><button type="button" id="export-learning-records">匯出此生紀錄</button><button type="button" id="clear-learning-records">清除此生紀錄</button></div>
      <div class="evidence-metrics"><span>題目觀察<strong>${stats.total}</strong></span><span>首次答對<strong>${stats.firstRate === null ? '尚無資料' : stats.firstRate + '%'}</strong></span><span>獨立首次答對<strong>${stats.independentRate === null ? '尚無資料' : stats.independentRate + '%'}</strong></span><span>最終完成<strong>${stats.final} / ${stats.total}</strong></span></div>
      <p>累計包含不同回合，不能直接當成精熟率或教學介入成效。請搭配學生口述、實物操作與不同題型觀察。</p>
      ${sections.length?`<section class="reteaching-summary" aria-labelledby="reteaching-title"><h3 id="reteaching-title">下一步教什麼？</h3><p>每題只取最近回合的觀察。同一題反覆練習只算一題；沒有作答的小節不推定已會或不會。</p><div class="reteaching-list">${sections.map(section=>`<article><h4>${escapeHtml(section.title)}</h4><p>已觀察 ${section.total} 題：首次獨立 ${section.independent}、支持後完成 ${section.supported}、待再教 ${section.pending}。</p><p>${section.pending?'先回教具操作，再換一題確認。':section.supported?'先減少提示，再用不同題目確認。':'可換情境或隔天再確認，不以少量題目判定精熟。'}</p><div><button type="button" data-review-section="${section.id}" data-unit="${section.unitId}" data-target="teach">回本單元教具再教</button><button type="button" data-review-section="${section.id}" data-unit="${section.unitId}" data-target="practice">練習這個小節</button></div></article>`).join('')}</div></section>`:''}
      ${stats.total ? `<div class="evidence-table"><table><caption>最近 20 筆題目觀察（最新在前）</caption><thead><tr><th>日期／題目</th><th>首次作答</th><th>所需支持</th><th>最終結果</th></tr></thead><tbody>${stats.rows.slice(-20).reverse().map(e => `<tr><td>${escapeHtml(new Date(e.time).toLocaleDateString('zh-TW'))}／${escapeHtml(bank.find(p=>p.id===e.questionId)?.sectionTitle || e.unitId)}<br>${escapeHtml(bank.find(p=>p.id===e.questionId)?.question || e.questionId)}</td><td>${e.firstCorrect ? '答對' : '尚未答對'}</td><td>${SUPPORTS[e.support]}</td><td>${e.finalCorrect ? '完成' : '待再教'}（${e.attempts} 次嘗試）</td></tr>`).join('')}</tbody></table></div>` : '<div class="evidence-empty">尚無實際作答資料。請到「隨堂練習」選擇學生代號，再進行練習。</div>'}</section>`;
    root.querySelector('#records-student-select').addEventListener('change', event=>renderDashboard(event.target.value));
    root.querySelector('#records-unit-select').addEventListener('change',()=>renderDashboard(selected));
    root.querySelectorAll('[data-review-section]').forEach(button=>button.addEventListener('click',()=>document.dispatchEvent(new CustomEvent('math-review-section',{detail:{unitId:button.dataset.unit,sectionId:button.dataset.reviewSection,target:button.dataset.target,studentId:selected}}))));
    root.querySelector('#export-learning-records').addEventListener('click', () => {
      const data = { schema: 1, studentId: selected, exportedAt: new Date().toISOString(), records: entries.filter(e=>e.studentId===selected) };
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      const a = document.createElement('a'); a.href = url; a.download = 'math-learning-records.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 3000);
    });
    root.querySelector('#clear-learning-records').addEventListener('click', () => {
      if (!confirm('確定清除此學生代號的本機作答紀錄？建議先匯出備份。')) return;
      entries = entries.filter(e => e.studentId !== selected); save(); renderDashboard(); status();
    });
  }
  function beginQuestion(p) {
    activeQuestion = p.id;
    support = questionSupports.get(supportKey()) || 'independent';
    const select = document.getElementById('practice-support');
    if (select) select.value = support;
    status();
  }
  function markSupport() {
    if (support === 'independent') support = 'prompted';
    questionSupports.set(supportKey(), support);
    const select = document.getElementById('practice-support');
    if (select) select.value = support;
  }
  function record(p, correct) {
    const payload = { studentId: studentId || 'demo', questionId: p.id, unitId: p.unitId, sessionId, support, correct };
    if (!studentId) {
      const result = recordAttempt(demoAttempts.get('records') || [], payload);
      demoAttempts.set('records', result.entries);
      return result;
    }
    const result = recordAttempt(entries, payload); entries = result.entries; save(); status(); renderDashboard(studentId);
    return { ...result, studentId };
  }
  function report(unitId) {
    if (!studentId) return '尚未指定練習學生；無可引用的實際作答證據。';
    const data = summarize(entries.filter(e => e.sessionId === sessionId), studentId, unitId);
    const name = students().find(s => String(s.id) === studentId)?.name || studentId;
    const label = window.MathI18n?.protect(name) ?? name;
    return `本回合練習代號：${label}；本單元 ${data.total} 題觀察，首次答對 ${data.first} 題、獨立首次答對 ${data.independent} 題、最終完成 ${data.final} 題。請確認此代號與報告學生一致；不是概念精熟或診斷結論。`;
  }
function currentRows(){return studentId?entries.filter(e=>e.sessionId===sessionId&&e.studentId===studentId):(demoAttempts.get('records')||[]);}
  function roundSummary(ids){return window.MathPracticeSession.roundSummary(currentRows(),ids);}
  function firstUnanswered(ids){const answered=new Set(currentRows().map(e=>e.questionId));return Math.max(0,ids.findIndex(id=>!answered.has(id)));}
  function strategyPrompt(p) {
    return {
      u1: '先找千、百、十、個的位置。想一想：數量改變的是哪一位？',
      u2: '先把位值對齊，從個位開始；不足或滿十時，停下來檢查換位。',
      u3: '先說出有幾組、每組有幾個，可以畫出等量的組或用積木排一排。',
      u4: '先確認單位，再對準尺的 0 刻度；1 公分有 10 小格毫米。',
      u5: '先找角的頂點，再比較張開的程度，不能只看邊的長短。',
      u6: '先確認是平均分給幾份，還是每份幾個；可以用盤子一輪一輪分。',
      u7: '先確認公升與毫升，換成同一單位再比較或計算。',
      u8: '先確認每份一樣大；分母表示全部分幾份，分子表示取幾份。',
      u9: '先找圓心；半徑從圓心到圓周，直徑要穿過圓心。'
    }[p.unitId] || '先說出題目已知什麼、要找什麼，再用教具或畫圖試試看。';
  }
    window.LearningRecords = { roundSummary, firstUnanswered, beginQuestion, markSupport, record, report, renderDashboard, escapeHtml, strategyPrompt };
  document.addEventListener('DOMContentLoaded', () => {
    const slot = document.getElementById('practice-session-controls');
    slot.innerHTML = `<details class="practice-settings-wrap" ${window.matchMedia('(min-width: 601px)').matches ? 'open' : ''}><summary id="practice-settings-summary">練習設定與紀錄</summary><section class="card practice-settings"><div class="practice-settings-grid">
      <label>練習對象<select id="practice-student-select"><option value="">示範模式（不記錄）</option>${students().map(s => `<option translate="no" value="${s.id}">${escapeHtml(s.name)}</option>`).join('')}</select></label>
      <label>題目難度<select id="practice-difficulty"><option value="all">混合程度</option><option value="1">基礎觀念</option><option value="2">熟練運算</option><option value="3">生活應用</option></select></label>
      <label>練習份量<select id="practice-length"><option value="3">3 題先試試</option><option value="5" selected>5 題小回合</option><option value="10">10 題</option><option value="all">全部題目</option></select></label>
      <label>本題支持程度<select id="practice-support">${Object.entries(SUPPORTS).map(([v,label]) => `<option value="${v}">${label}</option>`).join('')}</select></label>
      <button type="button" id="new-practice-session">開始新回合</button></div><p id="practice-record-status" role="status"></p><p class="practice-privacy">使用學生代號即可。紀錄僅在此瀏覽器；匯出檔請存於本機，不要放入公開網站。</p></section></details>`;
    slot.querySelector('#practice-student-select').addEventListener('change', event => {
      studentId = event.target.value;
      document.dispatchEvent(new CustomEvent('practice-student-change'));
      renderDashboard(studentId); status();
    });
    slot.querySelector('#practice-support').addEventListener('change', event => {
      support = event.target.value;
      if (questionSupports.has(supportKey()) && support === 'independent') support = questionSupports.get(supportKey());
      event.target.value = support;
      questionSupports.set(supportKey(), support);
    });
    slot.querySelector('#new-practice-session').addEventListener('click', () => {
      sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      demoAttempts.clear(); questionSupports.clear(); document.dispatchEvent(new CustomEvent('practice-new-session')); status();
    });
    ['practice-difficulty', 'practice-length'].forEach(id => slot.querySelector('#' + id).addEventListener('change', () => document.dispatchEvent(new CustomEvent('practice-filter-change'))));
    document.addEventListener('student-bank-renamed', () => {
      const picker = slot.querySelector('#practice-student-select');
      picker.innerHTML = '<option value="">示範模式（不記錄）</option>' + students().map(s => `<option translate="no" value="${s.id}">${escapeHtml(s.name)}</option>`).join('');
      picker.value = studentId;
      renderDashboard();
    });
    status(); renderDashboard();
    // 解題音檔、完整鷹架與提示會影響「獨立」判定，於作答前即標記。
    document.addEventListener('click', event => {
      if (event.target.closest('#btn-practice-hint, #btn-practice-ladder, #btn-practice-solution-speech, #btn-feedback-speak-solution')) markSupport();
    }, true);
  });
})();
