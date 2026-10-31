/* 第一單元：先操作圖像，再連結位值與數字符號。圖示為原創教學簡圖。 */
const PlaceValueLab = (() => {
  'use strict';
  const values = [1000, 100, 10, 1];
  const places = { 1000: '千位', 100: '百位', 10: '十位', 1: '個位' };
  const categories = [
    { id: 'all', label: '每一位都有', size: 6561 },
    { id: 'zero-hundreds', label: '百位留空', size: 729 },
    { id: 'zero-hundreds-ones', label: '百位、個位留空', size: 81 },
    { id: 'ten-thousands', label: '十個千是一萬', size: 9 }
  ];
  function questionAt(category, variant) {
    const type = categories.find(item => item.id === category);
    if (!type || !Number.isInteger(variant) || variant < 0 || variant >= type.size) return null;
    if (category === 'ten-thousands') return { category, variant, target: 10000, startThousands: variant + 1 };
    const positions = category === 'all' ? values : category === 'zero-hundreds' ? [1000, 10, 1] : [1000, 10];
    let target = 0, remaining = variant;
    for (let i = positions.length - 1; i >= 0; i--) {
      target += (remaining % 9 + 1) * positions[i];
      remaining = Math.floor(remaining / 9);
    }
    return { category, variant, target, startThousands: 0 };
  }
  function generateQuestion(category, previous, random = Math.random) {
    const type = categories.find(item => item.id === category);
    if (!type) return null;
    const skip = previous?.category === category && Number.isInteger(previous.variant) && previous.variant >= 0 && previous.variant < type.size;
    // 從其餘題目直接抽取，確保連按「換一題」不會抽到剛才那一題。
    let variant = Math.floor(Math.max(0, Math.min(1 - Number.EPSILON, random())) * (type.size - (skip ? 1 : 0)));
    if (skip && variant >= previous.variant) variant++;
    return questionAt(category, variant);
  }
  const materials = {
    money: { 1000: ['1000元鈔票', '張'], 100: ['100元鈔票', '張'], 10: ['10元硬幣', '枚'], 1: ['1元硬幣', '枚'] },
    blocks: { 1000: ['千位大方塊', '塊'], 100: ['百位板', '片'], 10: ['十位長條', '條'], 1: ['小方塊', '個'] }
  };
  const total = counts => values.reduce((sum, value) => sum + counts[value] * value, 0);
  const empty = () => ({ 1000: 0, 100: 0, 10: 0, 1: 0 });
  const createState = () => ({ mode: 'money', activity: 'build', ...questionAt('all', 102), base: 1, step: 0, counts: empty() });
  const initialCounts = state => ({ ...empty(), 1000: state.activity === 'build' ? state.startThousands : 0 });
  const minimumCount = (state, value) => state.activity === 'build' && value === 1000 ? state.startThousands : 0;
  const goal = (state, value) => value === 1000 ? Math.floor(state.target / 1000) : Math.floor(state.target / value) % 10;
  const name = (state, value) => materials[state.mode][value][0];
  const quantity = (state, value, count) => `${count}${materials[state.mode][value][1]}${name(state, value)}`;
  const finished = state => state.activity === 'build' ? state.step === 4 : state.activity === 'exchange' && state.step === 2;
  function editable(state, value) {
    return state.activity === 'free' || (state.activity === 'build' && values[state.step] === value) ||
      (state.activity === 'exchange' && state.step === 0 && state.base === value);
  }
  const canAdd = (state, value) => editable(state, value) && state.counts[value] < 20 && total(state.counts) + value <= 10000;
  function canNext(state) {
    if (state.activity === 'build') return state.step < 4 && state.counts[values[state.step]] === goal(state, values[state.step]);
    return state.activity === 'exchange' && state.step < 2 && state.counts[state.base] === 10;
  }
  function canTrade(state, base, split = false) {
    if (state.activity !== 'free' || ![1, 10, 100].includes(base)) return false;
    return split ? state.counts[base * 10] >= 1 && state.counts[base] + 10 <= 20 : state.counts[base] >= 10 && state.counts[base * 10] < 20;
  }
  function reduce(state, action, value) {
    const next = { ...state, counts: { ...state.counts } };
    if (action === 'mode' && materials[value]) next.mode = value;
    else if (action === 'activity' && ['build', 'exchange', 'free'].includes(value) && value !== state.activity) {
      next.activity = value; next.step = 0; next.counts = initialCounts(next);
    } else if (action === 'question' && state.activity === 'build' && value && questionAt(value.category, value.variant)) {
      Object.assign(next, questionAt(value.category, value.variant));
      next.step = 0; next.counts = initialCounts(next);
    } else if (action === 'base' && [1, 10, 100].includes(Number(value))) {
      next.base = Number(value); next.step = 0; next.counts = empty();
    } else if (action === 'reset') { next.step = 0; next.counts = initialCounts(next); }
    else if (action === 'add' && values.includes(value) && canAdd(state, value)) next.counts[value]++;
    else if (action === 'remove' && values.includes(value) && editable(state, value) && state.counts[value] > minimumCount(state, value)) next.counts[value]--;
    else if (action === 'back' && state.activity === 'build' && state.step > 0) next.step--;
    else if (action === 'next' && canNext(state)) {
      next.step++;
      if (state.activity === 'exchange' && state.step === 1) {
        next.counts[state.base] -= 10; next.counts[state.base * 10]++;
      }
    } else if (['trade', 'split'].includes(action) && canTrade(state, value, action === 'split')) {
      const direction = action === 'split' ? -1 : 1;
      next.counts[value] -= 10 * direction;
      next.counts[value * 10] += direction;
    } else return state;
    return next;
  }

  function icon(mode, value) {
    let drawing;
    if (mode === 'money' && value >= 100) {
      const blue = value === 1000;
      const ink = blue ? '#245889' : '#9c3037';
      drawing = `<rect x="4" y="16" width="112" height="56" rx="5" fill="${blue ? '#d9edff' : '#ffdddd'}" stroke="${ink}" stroke-width="3"/><rect x="10" y="22" width="100" height="44" rx="3" fill="none" stroke="${ink}"/><path d="M16 30v28m88-28v28M18 26h16m52 36h16" stroke="${ink}" stroke-width="3"/><circle cx="60" cy="44" r="21" fill="#fffaf0" opacity=".7"/><text x="60" y="51" font-family="Arial,sans-serif" font-size="${blue ? 23 : 28}" font-weight="800" text-anchor="middle" fill="${ink}">${value}</text>`;
    } else if (mode === 'money') {
      const bronze = value === 1;
      const ink = bronze ? '#795226' : '#465260';
      const radius = bronze ? 27 : 32;
      drawing = `<circle cx="60" cy="44" r="${radius}" fill="${bronze ? '#edc78c' : '#dce3e8'}" stroke="${ink}" stroke-width="3"/><circle cx="60" cy="44" r="${radius - 5}" fill="none" stroke="${ink}" stroke-dasharray="2 2"/><text x="60" y="54" font-family="Arial,sans-serif" font-size="30" font-weight="800" text-anchor="middle" fill="${ink}">${value}</text>`;
    } else if (value === 1) {
      drawing = '<path d="m42 35 13-10 25 0-13 10Z" fill="#ffe2a4"/><path d="m67 35 13-10v25L67 60Z" fill="#c77c22"/><path d="M42 35h25v25H42Z" fill="#ffd16b"/><path d="m42 35 13-10h25v25L67 60H42V35h25l13-10M67 35v25" fill="none" stroke="#805023" stroke-width="2"/>';
    } else if (value === 10) {
      drawing = '<path d="m7 39 7-7h100l-7 7Z" fill="#bbefd9"/><path d="m107 39 7-7v16l-7 7Z" fill="#258567"/><path d="M7 39h100v16H7Z" fill="#72d2ad" stroke="#205f4c" stroke-width="2"/>';
      for (let i = 1; i < 10; i++) drawing += `<path d="M${7+i*10} 39v16m0-16 7-7" stroke="#205f4c" stroke-width="1" fill="none"/>`;
    } else if (value === 100) {
      drawing = '<rect x="22" y="6" width="76" height="76" rx="1" fill="#b9dcfa" stroke="#275c8d" stroke-width="2"/>';
      for (let i = 1; i < 10; i++) drawing += `<path d="M${22+i*7.6} 6v76M22 ${6+i*7.6}h76" stroke="#3973a7" stroke-width=".8" fill="none"/>`;
    } else {
      drawing = '<path d="m16 28 25-18h66L82 28Z" fill="#f7c5c6"/><path d="m82 28 25-18v56L82 84Z" fill="#b95b66"/><path d="M16 28h66v56H16Z" fill="#efa0a8" stroke="#833541" stroke-width="2"/>';
      for (let i = 1; i < 10; i++) drawing += `<path d="M${16+i*6.6} 28v56m0-56 25-18M16 ${28+i*5.6}h66l25-18M${82+i*2.5} ${28-i*1.8}v56M${16+i*2.5} ${28-i*1.8}h66" stroke="#833541" stroke-width=".65" fill="none"/>`;
      drawing += '<path d="m16 28 25-18h66v56L82 84H16V28h66l25-18M82 28v56" stroke="#833541" stroke-width="2" fill="none"/>';
    }
    return `<svg class="pv-material pv-material-${mode}-${value}" viewBox="0 0 120 88" aria-hidden="true" focusable="false">${drawing}</svg>`;
  }
  const pictures = (state, value, count) => Array.from({ length: count }, () => `<span>${icon(state.mode, value)}</span>`).join('');
  function instruction(state) {
    if (state.activity === 'free') return '點材料放進桌面；點桌上材料的叉叉拿走。湊滿十個，再換成一個。';
    if (state.activity === 'exchange') {
      if (state.step === 0) return `一個一個放，湊滿${quantity(state, state.base, 10)}。`;
      if (state.step === 1) return `把這${quantity(state, state.base, 10)}圈成一組，換成${quantity(state, state.base * 10, 1)}。`;
      return `換好囉！${quantity(state, state.base, 10)}和${quantity(state, state.base * 10, 1)}代表的總${state.mode === 'money' ? '金額' : '量'}一樣。材料的份數變少，總${state.mode === 'money' ? '金額' : '量'}沒有變。`;
    }
    if (finished(state)) return state.target === 10000 ? '10個千就是1個萬，寫成10000。其餘四位沒有材料，各寫0。' : '從千位往個位看，每一位有幾份，就寫幾；沒有材料的位子寫0。';
    const value = values[state.step], required = goal(state, value);
    if (state.category === 'ten-thousands' && state.step === 0) return `桌上已經有${quantity(state, 1000, state.startThousands)}。再放一些，湊成圖中的${quantity(state, 1000, 10)}，就是一萬。`;
    return required === 0 ? `${places[value]}沒有材料。這格先留空，讀數時要寫0。` : `看圖，在${places[value]}放入${quantity(state, value, required)}。`;
  }
  function feedback(state) {
    if (state.activity === 'free' || finished(state) || (state.activity === 'exchange' && state.step === 1)) return instruction(state);
    const value = state.activity === 'build' ? values[state.step] : state.base;
    const required = state.activity === 'build' ? goal(state, value) : 10;
    const difference = required - state.counts[value];
    if (!difference) return required === 0 ? '這格留空就對了！按下一步，記得讀數時補0。' : '和上面的圖一樣多了！按下一步。';
    return difference > 0 ? `現在有${quantity(state, value, state.counts[value])}，再放${difference}${materials[state.mode][value][1]}。` : `多放了${-difference}${materials[state.mode][value][1]}，點桌上材料的「×」拿走。`;
  }
  function progress(state) {
    if (state.activity === 'free') return '';
    const labels = state.activity === 'build' ? ['放千', '放百', '放十', '放個', '讀數'] : ['湊滿十個', '圈起來換', '比一比'];
    return `<ol class="pv-progress" aria-label="操作步驟">${labels.map((label, i) => `<li class="${i === state.step ? 'is-current' : i < state.step ? 'is-done' : ''}" ${i === state.step ? 'aria-current="step"' : ''}><span>${i < state.step ? '✓' : i + 1}</span>${label}</li>`).join('')}</ol>`;
  }
  function exchangePicture(state, base) {
    return `<div class="pv-exchange-picture" role="img" aria-label="${quantity(state, base, 10)}等於${quantity(state, base * 10, 1)}"><div class="pv-ten-group">${pictures(state, base, 10)}</div><span class="pv-equals" aria-hidden="true">＝</span><div class="pv-one-group">${icon(state.mode, base * 10)}</div></div>`;
  }
  function result(state) {
    const amount = total(state.counts);
    const canonical = values.every(value => state.counts[value] < 10) || (state.counts[1000] === 10 && [100, 10, 1].every(value => state.counts[value] === 0));
    const digits = amount === 10000 ? ['萬位', '千位', '百位', '十位', '個位'] : values.map(value => places[value]);
    const text = String(amount).padStart(digits.length, '0');
    return `<section class="pv-result" aria-label="從圖像連到數字"><h5 tabindex="-1" data-pv-result>把剛才擺的，讀出來</h5>
      ${canonical ? `<div class="pv-digits" style="--pv-digits:${digits.length}">${digits.map((place, i) => `<div><span>${place}</span><strong>${text[i]}</strong>${text[i] === '0' ? '<small>空位寫0</small>' : ''}</div>`).join('')}</div>` : '<p>桌上還有滿十的材料，先換一換，再一格寫一個數字。</p>'}
      <p class="pv-equation">${values.filter(value => state.counts[value]).map(value => `${state.counts[value]} × ${value}`).join(' ＋ ') || '0'} ＝ <strong>${amount}</strong></p>
      <div class="pv-result-bottom"><strong>${state.mode === 'money' ? `合起來是 ${amount} 元` : `合起來代表 ${amount} 個小方塊`}</strong><button type="button" data-pv-action="read-total" data-pv-key="read-total">🔊 聽數字怎麼讀</button></div>
      ${amount === 10000 ? '<p>10個千就是1個萬：萬位寫1，其餘四位寫0。</p>' : ''}</section>`;
  }
  function renderView(state, prefix) {
    const build = state.activity === 'build';
    const exchange = state.activity === 'exchange';
    const done = finished(state);
    const current = build ? values[state.step] : state.base;
    const laneValues = exchange ? [state.base * 10, state.base] : values;
    const count = build && !done ? goal(state, current) : 10;
    const activePrompt = `${instruction(state)}`;
    return `<header class="pv-heading"><div><span class="pv-kicker">第一單元 · 看圖 → 動手 → 讀數</span><h4 id="${prefix}-pv-title">千百十個錢幣與積木操作台</h4></div><div class="pv-material-switch" role="group" aria-label="選擇操作材料">${['money', 'blocks'].map(mode => `<button type="button" data-pv-action="mode" data-value="${mode}" data-pv-key="mode-${mode}" aria-pressed="${state.mode === mode}">${icon(mode, 100)}<span>${mode === 'money' ? '錢幣' : '積木'}</span></button>`).join('')}</div></header>
      <div class="pv-activity-switch" role="group" aria-label="選擇教學活動">${[['build', '照圖放一放'], ['exchange', '十個換一個'], ['free', '自由操作']].map(([activity, label], i) => `<button type="button" data-pv-action="activity" data-value="${activity}" data-pv-key="activity-${activity}" aria-pressed="${state.activity === activity}"><span aria-hidden="true">${i + 1}</span>${label}</button>`).join('')}</div>
      <div class="pv-task-tools">${build ? `<label for="${prefix}-pv-task">練習目標<select id="${prefix}-pv-task" data-pv-select="category" data-pv-key="category">${categories.map(type => `<option value="${type.id}" ${state.category === type.id ? 'selected' : ''}>${type.label}</option>`).join('')}</select></label><button type="button" data-pv-action="new-question" data-pv-key="new-question" class="pv-new-question"><span aria-hidden="true">↻</span> 換一題</button>` : exchange ? `<label for="${prefix}-pv-exchange">這次換什麼？<select id="${prefix}-pv-exchange" data-pv-select="base" data-pv-key="base">${[1, 10, 100].map(base => `<option value="${base}" ${state.base === base ? 'selected' : ''}>${name(state, base)} → ${name(state, base * 10)}</option>`).join('')}</select></label>` : '<p>一個一個放，也可以把材料換開。</p>'}<button type="button" data-pv-action="reset" data-pv-key="reset" class="pv-secondary">↺ ${state.activity === 'free' ? '清空桌面' : '這題重來'}</button></div>
      ${build ? `<div class="pv-question" aria-label="目前練習題"><div><span>本題${state.category === 'ten-thousands' ? '湊成' : '目標'}</span><strong>${state.target}</strong>${state.mode === 'money' ? '<span>元</span>' : ''}</div><p>${state.category === 'ten-thousands' ? `桌上已有 ${state.startThousands} 個千，請補足到十個千。` : '照圖完成四個位子，再把數字讀出來。'}<small>「換一題」會更換題目；「這題重來」保留本題。</small></p></div>` : ''}
      ${progress(state)}
      <section class="pv-guide" aria-label="這一步怎麼做"><div class="pv-guide-title"><h5 tabindex="-1">${done ? '完成操作，看懂數量' : state.activity === 'free' ? '自己動手試一試' : `第 ${state.step + 1} 步`}</h5><button type="button" data-pv-action="read-step" data-pv-key="read-step">🔊 聽這一步</button></div><p class="pv-instruction">${activePrompt}</p>
      ${!done && build ? `<div class="pv-reference"><span>照這樣放 ↓</span>${count === 0 ? '<div class="pv-zero-example"><span>空</span>沒有材料，這一位要寫0</div>' : `<div class="pv-reference-pieces" style="--pv-picture-cols:${Math.min(count, 5)}" role="img" aria-label="目標：${quantity(state, current, count)}">${pictures(state, current, count)}</div>`}</div>` : exchange ? state.step === 0 ? `<div class="pv-reference"><span>數一數，湊成這一組 ↓</span><div class="pv-ten-group" role="img" aria-label="目標：${quantity(state, state.base, 10)}">${pictures(state, state.base, 10)}</div></div>` : exchangePicture(state, state.base) : ''}
      </section>
      <div class="pv-workspace ${exchange ? 'pv-exchange-workspace' : ''}" role="group" aria-label="${exchange ? '換十材料桌' : '千百十個材料桌'}">${laneValues.map(value => {
        const enabled = editable(state, value);
        const currentStep = state.activity !== 'free' && enabled;
        return `<section class="pv-lane pv-lane-${value} ${currentStep ? 'is-active' : ''}" aria-label="${places[value]}材料"><header><h5>${places[value]}</h5><span>${currentStep ? '↓ 現在放這格' : `每份 ${value}`}</span></header>
          ${done || (exchange && state.step === 1) ? `<p class="pv-material-name">${name(state, value)}</p>` : `<button type="button" class="pv-add" data-pv-action="add" data-value="${value}" data-pv-key="add-${value}" aria-label="在${places[value]}放入${quantity(state, value, 1)}" ${canAdd(state, value) ? '' : 'disabled'}>${icon(state.mode, value)}<strong>＋ 放1${materials[state.mode][value][1]}</strong><span>${name(state, value)}</span></button>`}
          <div class="pv-tray" role="group" aria-label="${places[value]}已放${quantity(state, value, state.counts[value])}">${state.counts[value] ? Array.from({ length: state.counts[value] }, (_, i) => `<button type="button" class="pv-placed" data-pv-action="remove" data-value="${value}" data-pv-key="remove-${value}-${i}" aria-label="${i < minimumCount(state, value) ? '題目給的第' : '拿走第'}${i + 1}${materials[state.mode][value][1]}${name(state, value)}" ${enabled && i >= minimumCount(state, value) ? '' : 'disabled'} ${i < minimumCount(state, value) ? 'data-pv-given="true"' : ''}>${icon(state.mode, value)}${i < minimumCount(state, value) ? '<small>題目給的</small>' : enabled ? '<span aria-hidden="true">×</span>' : ''}</button>`).join('') : '<span class="pv-empty">還沒有材料</span>'}</div>
          <p class="pv-count">已放 <strong>${state.counts[value]}</strong> ${materials[state.mode][value][1]}</p></section>`;
      }).join('')}</div>
      ${state.activity !== 'free' ? `<div class="pv-step-actions">${build && state.step > 0 ? '<button type="button" data-pv-action="back" data-pv-key="back" class="pv-secondary">← 上一步</button>' : ''}<p>${done ? '可以切換錢幣／積木，看看相同數量的不同樣子。' : feedback(state)}</p>${!done ? `<button type="button" class="pv-primary" data-pv-action="next" data-pv-key="next" ${canNext(state) ? '' : 'disabled'}>${exchange ? state.step === 0 ? '圈好十個，準備換 →' : `換成${quantity(state, state.base * 10, 1)} →` : count === 0 ? '這格留空，下一步 →' : state.step === 3 ? '放好了，讀出來 →' : '放好了，下一步 →'}</button>` : `<button type="button" class="pv-primary" data-pv-action="${build ? 'new-question' : 'reset'}" data-pv-key="continue">${build ? '同一目標，再換一題 →' : '再練一次 ↺'}</button>`}</div>` : `<section class="pv-free-exchanges"><h5>滿十換一個，或把一個拆開</h5><div>${[1, 10, 100].map(base => `<article><p>${name(state, base)} ⇄ ${name(state, base * 10)}</p>${exchangePicture(state, base)}<div class="pv-trade-buttons"><button type="button" data-pv-action="trade" data-value="${base}" data-pv-key="trade-${base}" aria-label="${quantity(state, base, 10)}換成${quantity(state, base * 10, 1)}" ${canTrade(state, base) ? '' : 'disabled'}>10${materials[state.mode][base][1]}換1${materials[state.mode][base * 10][1]} ↑</button><button type="button" class="pv-secondary" data-pv-action="split" data-value="${base}" data-pv-key="split-${base}" aria-label="${quantity(state, base * 10, 1)}拆成${quantity(state, base, 10)}" ${canTrade(state, base, true) ? '' : 'disabled'}>1${materials[state.mode][base * 10][1]}拆成10${materials[state.mode][base][1]} ↓</button></div></article>`).join('')}</div><p class="pv-limit">每種材料最多放20份，總量到10000；材料滿十時，先換成較大的材料再繼續。</p></section>`}
      ${(build && done) || state.activity === 'free' ? result(state) : exchange && done ? `<div class="pv-same-total"><strong>換之前 ${state.base * 10}　＝　換之後 ${total(state.counts)}</strong><span>${state.mode === 'money' ? '元，金額沒有變。' : '個一，總量沒有變。'}</span></div>` : ''}
      <details class="pv-teacher"><summary>給老師：引導方式與觀察重點</summary><ol><li>先指認鈔票、硬幣或積木，再請學生指向對應的千、百、十、個位。可切換材料，比對同一個數。</li><li>逐一點放並口數；讓學生對照上方目標圖。多放時，點材料上的「×」拿走，不必整題重來。</li><li>沒有材料的位子仍要保留；在「讀數」階段連結空位與0，避免把1023寫成123。</li><li>換十前後請學生再數一次：材料份數改變，總金額或總量不變。積木的小方塊、十位長條、百位板、千位大方塊分別代表1、10、100、1000個一。</li></ol><p>切換練習目標或按「換一題」會抽出不同題目，並重新開始操作；「這題重來」保留本題。十個千的題目會改變起始材料，標示「題目給的」材料會保留，請學生補足到一萬。切換活動會重新擺放；切換錢幣／積木會保留本題與擺放。此為操作練習，不會自動認定學生精熟或寫入評量。</p><p>圖示為非等比例的教學簡圖；錢幣面額可搭配<a href="https://gallery.cbc.gov.tw/child/" target="_blank" rel="noopener">中央銀行兒童版券幣資料</a>與實物辨識。</p></details>`;
  }

  function mount(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    let state = createState();
    el.innerHTML = `<section class="manipulative-card pv-lab" aria-labelledby="${containerId}-pv-title"><div data-pv-content></div><p class="pv-announcement sr-only" role="status" aria-live="polite" aria-atomic="true"></p></section>`;
    const content = el.querySelector('[data-pv-content]');
    const status = el.querySelector('[role="status"]');
    const audio = () => window.spEdAudio;
    const render = () => { content.innerHTML = renderView(state, containerId); };
    function focusKey(key) {
      const target = Array.from(content.querySelectorAll('[data-pv-key]')).find(node => node.dataset.pvKey === key && !node.disabled);
      target?.focus({ preventScroll: true });
      return !!target;
    }
    function act(action, value, focus) {
      const before = state;
      if (action === 'category' || action === 'new-question') {
        value = generateQuestion(action === 'category' ? value : state.category, state);
        action = 'question';
      }
      state = reduce(state, action, value);
      if (state === before) return;
      if (['activity', 'question', 'base', 'reset', 'mode'].includes(action)) audio()?.stopSpeech();
      render();
      status.textContent = action === 'question' ? `已換題。本題目標${state.target}。${instruction(state)}` : feedback(state);
      if (action === 'next') {
        if (finished(state)) {
          (content.querySelector('[data-pv-result]') || content.querySelector('.pv-guide h5'))?.focus({ preventScroll: true });
        } else if (state.activity === 'build' && goal(state, values[state.step]) === 0) focusKey('next');
        else if (!focusKey(`add-${state.activity === 'build' ? values[state.step] : state.base}`)) focusKey('next');
        audio()?.speak(instruction(state));
      } else if (!focusKey(focus)) {
        if (action === 'question') focusKey('new-question');
        else if (['add', 'remove'].includes(action)) focusKey(`add-${value}`) || focusKey('next');
      }
      if (['next', 'back'].includes(action) || focus === 'continue') {
        const anchor = finished(state) ? content.querySelector('[data-pv-result]') || content.querySelector('.pv-guide') : content.querySelector('.pv-guide');
        anchor?.scrollIntoView({ block: 'start', behavior: 'auto' });
      }
      if (['add', 'remove', 'trade', 'split'].includes(action)) audio()?.playCoin();
    }
    el.onclick = event => {
      const button = event.target.closest('[data-pv-action]');
      if (!button || !el.contains(button) || button.disabled) return;
      const { pvAction: action, value, pvKey } = button.dataset;
      if (action === 'read-step') return audio()?.speak(instruction(state));
      if (action === 'read-total') return audio()?.speak(`${state.mode === 'money' ? '合起來是' : '合起來代表'}${total(state.counts)}${state.mode === 'money' ? '元' : '個小方塊'}。${instruction(state)}`);
      act(action, ['add', 'remove', 'trade', 'split'].includes(action) ? Number(value) : value, pvKey);
    };
    el.onchange = event => {
      const input = event.target.closest('[data-pv-select]');
      if (input && el.contains(input)) act(input.dataset.pvSelect, input.value, input.dataset.pvKey);
    };
    render();
  }
  return { mount, icon, createState, generateQuestion, questionAt, reduce, total, goal, canNext, canAdd, canTrade, instruction };
})();
if (typeof window !== 'undefined') window.PlaceValueLab = PlaceValueLab;
if (typeof module !== 'undefined' && module.exports) module.exports = PlaceValueLab;
