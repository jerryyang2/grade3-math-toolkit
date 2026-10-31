/* 看得見數量、跟得上操作的教學圖像；各工具以自己的狀態運作。 */
const HandsOnTools = (() => {
  'use strict';
  const positions = ['千位', '百位', '十位', '個位'];
  const powers = [1000, 100, 10, 1];
  function verticalTrace(a, b, op) {
    if (![a, b].every(n => Number.isInteger(n) && n >= 0 && n <= 9999) || !['+', '-'].includes(op) || (op === '-' && a < b)) throw new Error('請使用範圍內的非負整數算式');
    const left = String(a).padStart(4, '0').split('').map(Number);
    const right = String(b).padStart(4, '0').split('').map(Number);
    const work = [...left], carries = [0, 0, 0, 0];
    const trace = [{ working: [...work], carries: [...carries], trades: [] }];
    for (let i = 3; i >= 0; i--) {
      const trades = [];
      const incoming = carries[i];
      if (op === '-' && work[i] < right[i]) {
        let donor = i - 1;
        while (donor >= 0 && work[donor] === 0) donor--;
        for (let j = donor; j < i; j++) {
          work[j]--; work[j + 1] += 10;
          trades.push({ from: powers[j], to: powers[j + 1] });
        }
      }
      const combined = op === '+' ? left[i] + right[i] + incoming : work[i] - right[i];
      const outgoing = op === '+' && i > 0 ? Math.floor(combined / 10) : 0;
      if (i > 0) carries[i - 1] = outgoing;
      trace.push({ index: i, value: powers[i], left: op === '+' ? left[i] : work[i], right: right[i], incoming, combined, written: op === '+' && i > 0 ? combined % 10 : combined, outgoing, working: [...work], carries: [...carries], trades });
    }
    return trace;
  }
  function divisionState(total, baskets, distributed) {
    if (![total, baskets, distributed].every(Number.isInteger) || total < 0 || total > 30 || baskets < 2 || baskets > 6 || distributed < 0 || distributed > Math.floor(total / baskets) * baskets) throw new Error('分物數量超出範圍');
    return { counts: Array.from({ length: baskets }, (_, i) => Math.floor(distributed / baskets) + (i < distributed % baskets ? 1 : 0)), left: total - distributed, limit: Math.floor(total / baskets) * baskets, quotient: Math.floor(total / baskets), remainder: total % baskets };
  }
  const rulerGeometry = (mm, aligned = true) => ({ zero: 40, start: aligned ? 40 : 64, end: (aligned ? 40 : 64) + mm * 4, cm: Math.floor(mm / 10), rest: mm % 10 });
  const capacityY = ml => 280 - ml / 1500 * 240;
  const fractionPath = (i, denominator) => {
    const start = i * 2 * Math.PI / denominator - Math.PI / 2, end = (i + 1) * 2 * Math.PI / denominator - Math.PI / 2;
    return `M120 120 L${120+100*Math.cos(start)} ${120+100*Math.sin(start)} A100 100 0 0 1 ${120+100*Math.cos(end)} ${120+100*Math.sin(end)} Z`;
  };
  const block = value => window.PlaceValueLab.icon('blocks', value);
  const apple = () => '<svg viewBox="0 0 40 42" aria-hidden="true" focusable="false"><path d="M20 11q-11-9-16 4-5 18 12 23l4-2 4 2q17-5 12-23-5-13-16-4Z" fill="#db554b" stroke="#87352e" stroke-width="2"/><path d="M20 12V4m0 4q9-11 14-4-6 7-14 4" stroke="#3e7245" fill="#79a563" stroke-width="2"/><path d="M10 18q-3 6 0 9" stroke="#ffe1d6" stroke-width="3" fill="none"/></svg>';
  const cup = (ml = 100) => `<svg viewBox="0 0 70 75" aria-hidden="true" focusable="false"><path d="M8 10h43l-5 56H14Z" fill="#e9f8ff" stroke="#246581" stroke-width="3"/><path d="M12 30h35l-3 32H16Z" fill="#77c6e6"/><path d="M51 18q22-2 14 25l-16 7" fill="none" stroke="#246581" stroke-width="3"/><text x="30" y="48" text-anchor="middle" font-size="16" font-family="sans-serif" font-weight="bold" fill="#183f53">${ml}</text></svg>`;
  const pieces = (value, count, removed = 0) => count ? Array.from({ length: count }, (_, i) => `<span class="ho-piece ${i < removed ? 'is-removed' : ''}">${block(value)}${i < removed ? '<b aria-hidden="true">×</b>' : ''}</span>`).join('') : '<span class="ho-empty">沒有（0）</span>';
  function arithmeticPicture(a, b, op, step) {
    const trace = verticalTrace(a, b, op), s = trace[step];
    if (step === 0) return `<section class="ho-visual ho-align"><h5>先認材料，再對齊同一位</h5><div>${powers.map((value, i) => `<article>${block(value)}<strong>${positions[i]}</strong></article>`).join('')}</div><p>同樣的材料放同一欄，從右邊的個位開始。</p></section>`;
    const trades = s.trades.map(t => `<div class="ho-trade-picture" role="img" aria-label="把1份${t.from}換成10份${t.to}"><div>${pieces(t.from, 1)}</div><b>→</b><div class="ho-ten">${pieces(t.to, 10)}</div></div>`).join('');
    return `<section class="ho-visual ho-arithmetic"><h5>${positions[s.index]}：看材料怎麼變</h5>${trades ? `<p>不夠拿，先把較大的一份換開；總量沒有變。</p>${trades}` : ''}
      <div class="ho-material-equation"><div><span>${op === '+' ? '原有' : '換開後有'} ${s.left} 份</span><div class="ho-piece-group">${pieces(s.value, s.left, op === '-' ? s.right : 0)}</div></div>${op === '+' ? `<b>＋</b><div><span>再合進 ${s.right} 份${s.incoming ? `，還有前一步進來的 ${s.incoming} 份` : ''}</span><div class="ho-piece-group">${pieces(s.value, s.right + s.incoming)}</div></div>` : `<div><span>畫叉拿走 ${s.right} 份，留下 ${s.written} 份</span><div class="ho-piece-group">${pieces(s.value, s.written)}</div></div>`}</div>
      ${s.outgoing ? `<div class="ho-trade-picture" role="img" aria-label="把10份${s.value}換成1份${s.value * 10}"><div class="ho-ten">${pieces(s.value, 10)}</div><b>→</b><div>${pieces(s.value * 10, 1)}<span>進到左邊一位</span></div></div>` : ''}
      ${op === '+' ? `<div class="ho-piece-group" role="img" aria-label="這一位留下${s.written}份">${pieces(s.value, s.written)}<strong>這一位留下 ${s.written} 份</strong></div>` : ''}
      <p>${op === '+' ? `合起來 ${s.combined} 份；${s.outgoing ? `換走十份後，這一位留下 ${s.written} 份。` : `這一位寫 ${s.written}。`}` : `這一位寫 ${s.written}，再看左邊一位。`}</p></section>`;
  }
  function multiplicationArray(tens, ones, groups, step) {
    const cols = tens * 10 + ones, u = 12, x = 54, y = 36, h = groups * u;
    const cells = cols * groups;
    return `<section class="ho-visual ho-array"><h5>每一橫排是一組，每小格代表1</h5><div class="ho-scroll"><svg viewBox="0 0 ${Math.max(420,cols*u+90)} ${h+92}" role="img" aria-label="${groups}組，每組${cols}個；左邊${tens * 10}個，右邊${ones}個"><rect x="${x}" y="${y}" width="${tens*10*u}" height="${h}" fill="#dbeafe"/>${ones ? `<rect x="${x+tens*10*u}" y="${y}" width="${ones*u}" height="${h}" fill="#ffdfa1"/>` : ''}${Array.from({ length: cols+1 }, (_, c) => `<path d="M${x+c*u} ${y}v${h}" stroke="${c%10===0 ? '#315c81' : '#93a7ad'}" stroke-width="${c%10===0 ? 2 : 1}"/>`).join('')}${Array.from({ length: groups+1 }, (_, r) => `<path d="M${x} ${y+r*u}h${cols*u}" stroke="#456479"/>`).join('')}${Array.from({ length: groups }, (_, r) => `<text x="${x-9}" y="${y+r*u+10}" text-anchor="end" font-size="11" fill="#233f39">第${r+1}組</text>`).join('')}<text x="${x+tens*10*u/2}" y="22" text-anchor="middle" font-size="15" fill="#234f79">${tens*10}個</text>${ones ? `<text x="${x+(tens*10+ones/2)*u}" y="22" text-anchor="middle" font-size="15" fill="#784810">${ones}個</text>` : ''}${step===1 || (step===2 && ones) ? `<rect x="${step===1 ? x : x+tens*10*u}" y="${y}" width="${(step===1 ? tens*10 : ones)*u}" height="${h}" fill="none" stroke="#ab3b2f" stroke-width="3"/>` : ''}<text x="${x}" y="${y+h+30}" font-size="16" fill="#203d32">${groups}排，每排${tens*10}＋${ones}格${step>=3 ? `，共有${cells}格。` : '，先數圖，再算。'}</text></svg></div>${ones===0 ? '<p>個位是0，右邊沒有小格，不另外畫出一塊面積。</p>' : ''}</section>`;
  }
  const speak = text => window.spEdAudio?.speak(text);
  function replace(el, html) {
    const active = el.contains(document.activeElement) ? document.activeElement.dataset.hoFocus : null;
    if (!el.querySelector('[data-ho-content]')) el.innerHTML = '<div data-ho-content></div><p class="ho-announcement" role="status" aria-live="polite" aria-atomic="true"></p>';
    const content = el.querySelector('[data-ho-content]');
    content.innerHTML = html;
    const status = el.querySelector('.ho-announcement');
    status.textContent = [content.querySelector('.ho-guide > p')?.textContent,content.querySelector('.ho-capacity-stage svg')?.getAttribute('aria-label'),content.querySelector('.ho-options [role="status"]')?.textContent].filter(Boolean).join('。');
    if (active) Array.from(el.querySelectorAll('[data-ho-focus]')).find(node => node.dataset.hoFocus === active && !node.disabled)?.focus({ preventScroll: true });
  }
  function button(action, text, disabled = false, extra = '', focus = action) {
    return `<button type="button" data-ho-action="${action}" data-ho-focus="${focus}" ${disabled ? 'disabled' : ''} ${extra}>${text}</button>`;
  }
  function guide(state, steps, ready = true) {
    const current = steps[state.step];
    return `<section class="ho-guide" aria-label="操作步驟"><ol>${steps.map((s, i) => `<li class="${i===state.step ? 'current' : i<state.step ? 'done' : ''}" ${i===state.step ? 'aria-current="step"' : ''}>${i<state.step ? '✓' : i+1} ${s[0]}</li>`).join('')}</ol><div><h5>${current[0]}</h5>${button('read', '🔊 聽這一步')}</div><p>${current[1]}</p><nav aria-label="步驟控制">${button('back', '← 上一步', state.step===0)}${state.step<steps.length-1 ? button('next', current[2] || '下一步 →', !ready) : button('restart', '↺ 從頭操作')}</nav></section>`;
  }
  function frame(id, title, content) {
    return `<section class="manipulative-card ho-tool" aria-labelledby="${id}-ho-title"><header class="ho-heading"><span>看圖・動手・說說看</span><h4 id="${id}-ho-title">${title}</h4></header>${content}</section>`;
  }
  function connect(el, state, getSteps, render, actions, ready = () => true, change) {
    el.onclick = event => {
      const btn = event.target.closest('[data-ho-action]');
      if (!btn || !el.contains(btn) || btn.disabled) return;
      const action = btn.dataset.hoAction, steps = getSteps();
      if (action === 'read') return speak(steps[state.step][1]);
      if (action === 'next') { if (!ready() || state.step>=steps.length-1) return; state.step++; }
      else if (action === 'back') { if (state.step===0) return; state.step--; }
      else if (action === 'restart') { state.step=0; actions('restart', btn); }
      else actions(action, btn);
      render();
      if (action === 'plate') {
        const nextPlate = el.querySelector('.ho-plate:not(:disabled)') || el.querySelector('[data-ho-action="next"]:not(:disabled)');
        nextPlate?.focus({preventScroll:true});
        nextPlate?.scrollIntoView({block:'nearest',behavior:'auto'});
      }
      if (['next', 'back', 'restart'].includes(action)) { el.querySelector('.ho-guide')?.scrollIntoView({block:'start',behavior:'auto'}); speak(getSteps()[state.step][1]); }
    };
    el.onchange = event => { if (change) { change(event.target); render(); } };
    el.oninput = null;
    el.onkeydown = null;
  }

  function mountRuler(id) {
    const el = document.getElementById(id); if (!el) return;
    const items = [{name:'鉛筆',mm:75},{name:'橡皮擦',mm:42},{name:'迴紋針',mm:28},{name:'彩色筆',mm:115}];
    const state = {step:0,item:0};
    const steps = () => [['對齊0刻度','先找尺上的0。按「把起點對齊0」，讓物品左端和0刻度在同一條線上。','把起點對齊0 →'],['數完整的公分','從0開始，一大格一大格數到物品右端前最後一個完整公分。','看剩下的小格 →'],['數剩下的毫米','看下面的放大圖；每小格是1毫米。從整公分刻度開始，數到物品右端。','合起來讀長度 →'],['讀出長度','先說幾公分，再說多出幾毫米；也可以把每1公分換成10毫米，合起來讀。']];
    function render() {
      const item=items[state.item], g=rulerGeometry(item.mm,state.step>0), end=g.end;
      const target = state.item===0 ? `<path d="M${g.start} 34h${item.mm*4-16}l16 10-16 10H${g.start}Z" fill="#f4cf6c" stroke="#765a26" stroke-width="2"/><path d="M${end-16} 34l16 10-16 10Z" fill="#ead8bf" stroke="#765a26"/>` : `<rect x="${g.start}" y="32" width="${item.mm*4}" height="25" rx="${state.item===2 ? 11 : 4}" fill="${state.item===1 ? '#f4b1a5' : state.item===2 ? '#e3eaf0' : '#a8d9c1'}" stroke="#3d6254" stroke-width="2"/>`;
      replace(el,frame(id,'毫米與公分：對齊、數格、讀長度',`<div class="ho-options" role="group" aria-label="選擇測量物品">${items.map((it,i)=>button('item',it.name,false,`data-item="${i}" aria-pressed="${state.item===i}"`, `item-${i}`)).join('')}</div>${guide(state,steps())}<div class="ho-visual ho-scroll"><svg class="ho-ruler" viewBox="0 0 650 165" role="img" aria-label="${item.name}與毫米直尺共用同一刻度，${state.step ? '起點已對齊0' : '起點尚未對齊0'}">${target}<text x="${g.start}" y="23" font-size="16" fill="#203d32">${item.name}</text><rect x="20" y="85" width="610" height="70" rx="6" fill="#fff8d8" stroke="#796c42"/>${Array.from({length:141},(_,i)=>`<path d="M${40+i*4} 85v${i%10===0 ? 30 : i%5===0 ? 22 : 13}" stroke="${i%10===0 ? '#263e32' : '#697868'}" stroke-width="${i%10===0 ? 2 : 1}"/>${i%10===0 ? `<text x="${40+i*4}" y="137" text-anchor="middle" font-size="15" fill="#263e32">${i/10}</text>` : ''}`).join('')}<text x="620" y="147" text-anchor="end" font-size="14" fill="#263e32">cm</text><path d="M40 60v48" stroke="#ab3631" stroke-width="3" stroke-dasharray="4"/><path d="M${end} 60v48" stroke="#245f92" stroke-width="3" stroke-dasharray="4"/>${state.step>=1 ? `<path d="M40 76h${g.cm*40}" stroke="#3b8a61" stroke-width="6"/>` : ''}</svg></div>${state.step>=2 ? `<section class="ho-visual"><h5>最後一公分的放大圖：每小格1毫米</h5><svg viewBox="0 0 340 100" role="img" aria-label="從${g.cm}公分開始，剩下${g.rest}毫米"><rect x="30" y="22" width="${g.rest*26}" height="24" fill="#ffc66a"/>${Array.from({length:11},(_,i)=>`<path d="M${30+i*26} 16v${i===0||i===10 ? 46 : 30}" stroke="#3b5446" stroke-width="2"/>`).join('')}<path d="M${30+g.rest*26} 5v59" stroke="#ab3631" stroke-width="3"/><text x="30" y="86" font-size="23" fill="#203d32">${g.cm} cm</text><text x="290" y="86" text-anchor="end" font-size="23" fill="#203d32">${g.cm+1} cm</text></svg></section>` : ''}${state.step===3 ? `<p class="ho-result">${g.cm} 公分又 ${g.rest} 毫米 ＝ ${item.mm} 毫米</p>` : ''}<p class="ho-note">這是放大示意圖，請勿用螢幕直接測量實物。</p>`));
    }
    connect(el,state,steps,render,(action,btn)=>{if(action==='item'){state.item=Number(btn.dataset.item);state.step=0;}});
    render();
  }

  function mountAngle(id) {
    const el=document.getElementById(id);if(!el)return;
    const state={step:0,angle:60,length:130,square:false};
    const steps=()=>[['固定頂點與一邊','紅點是頂點。藍邊固定，綠邊張開；先看看開口有多大。'],['蓋上三角板','讓三角板的直角頂點對準紅點，一邊貼齊藍邊。按「蓋上三角板」，再看另一邊。'],['比開口，不比邊長','比直角小是銳角，剛好重合是直角，比直角大是鈍角。改變邊長，開口不變，角的大小也不變。']];
    function scene(){const r=-state.angle*Math.PI/180,l=state.length;return `<svg viewBox="0 0 340 250" role="img" aria-label="張開${state.angle}度的角，${state.square?'已對齊直角三角板':'尚未蓋三角板'}"><path d="M190 180A40 40 0 0 0 ${150+40*Math.cos(r)} ${180+40*Math.sin(r)}" fill="none" stroke="#ad6517" stroke-width="5"/><path d="M150 180H${150+l}" stroke="#286398" stroke-width="8" stroke-linecap="round"/><path d="M150 180L${150+l*Math.cos(r)} ${180+l*Math.sin(r)}" stroke="#278565" stroke-width="8" stroke-linecap="round"/>${state.square?'<path d="M150 180H275L150 55Z" fill="#f6cb6966" stroke="#9f681c" stroke-width="3" stroke-dasharray="5"/><path d="M150 155h25v25" fill="none" stroke="#9f681c" stroke-width="3"/>':''}<circle cx="150" cy="180" r="8" fill="#b23e3c"/><text x="126" y="218" font-size="23" fill="#943533">頂點</text></svg>`;}
    const classification=()=>state.angle<90?'比直角小：銳角':state.angle===90?'剛好重合：直角':'比直角大：鈍角';
    function render(){replace(el,frame(id,'角的大小：用三角板比一比',`${guide(state,steps(),state.step!==1||state.square)}<div class="ho-angle-scene">${scene()}</div><div class="ho-options">${button('square',state.square?'移開三角板':'蓋上三角板',false,`aria-pressed="${state.square}"`)}${[45,90,135].map(angle=>button('preset',`${angle}°`,false,`data-angle="${angle}"`, `preset-${angle}`)).join('')}</div><div class="ho-inputs"><label>開口角度 <output data-angle-value>${state.angle}°</output><input data-angle data-ho-focus="angle" type="range" min="20" max="160" step="5" value="${state.angle}"></label><label>兩邊長度 <output data-length-value>${state.length}</output><input data-length data-ho-focus="length" type="range" min="70" max="140" step="10" value="${state.length}"></label></div><p class="ho-result" data-angle-result>${state.step===2?classification():'先比一比，下一步再說出角的種類。'}</p>`));}
    connect(el,state,steps,render,(action,btn)=>{if(action==='square')state.square=!state.square;if(action==='preset')state.angle=Number(btn.dataset.angle);if(action==='restart')state.square=false;},()=>state.step!==1||state.square);
    el.oninput=event=>{if(event.target.matches('[data-angle]'))state.angle=Number(event.target.value);else if(event.target.matches('[data-length]'))state.length=Number(event.target.value);else return;el.querySelector('.ho-angle-scene').innerHTML=scene();el.querySelector('[data-angle-value]').textContent=state.angle+'°';el.querySelector('[data-length-value]').textContent=state.length;if(state.step===2)el.querySelector('[data-angle-result]').textContent=classification();};
    render();
  }

  function mountDivision(id) {
    const el=document.getElementById(id);if(!el)return;
    const state={step:0,total:14,baskets:3,distributed:0};
    const info=()=>divisionState(state.total,state.baskets,state.distributed);
    const steps=()=>[['看看總數','先數托盤上的蘋果，再數空盤子。準備好後開始輪流分。','開始輪流分 →'],['每盤輪流分1顆',state.distributed<info().limit ? `現在輪到盤子${state.distributed%state.baskets+1}。點亮起來的盤子，放進1顆蘋果；每盤各拿1顆，才開始下一輪。` : `每盤都一樣多了。托盤剩下${info().left}顆，夠不夠每盤再各分1顆？`,'檢查剩下的蘋果 →'],['檢查餘數',`每盤${info().quotient}顆，剩下${info().remainder}顆。剩下的不足每盤再各分1顆，所以餘數比盤子數小。`]];
    const ready=()=>state.step!==1||state.distributed===info().limit;
    function render(){const s=info();replace(el,frame(id,'輪流分蘋果：看見商與餘數',`<div class="ho-inputs"><label>蘋果總數<select data-setting="total" data-ho-focus="total">${Array.from({length:28},(_,i)=>`<option ${state.total===i+3?'selected':''}>${i+3}</option>`).join('')}</select></label><label>盤子數<select data-setting="baskets" data-ho-focus="baskets">${[2,3,4,5,6].map(n=>`<option ${state.baskets===n?'selected':''}>${n}</option>`).join('')}</select></label></div>${guide(state,steps(),ready())}<section class="ho-visual"><h5>還在托盤：${s.left}顆</h5><div class="ho-apples" role="img" aria-label="托盤還有${s.left}顆蘋果">${Array.from({length:s.left},apple).join('')||'<span>托盤空了</span>'}</div></section><div class="ho-plates">${s.counts.map((count,i)=>`<button type="button" class="ho-plate ${state.step===1&&state.distributed<s.limit&&state.distributed%state.baskets===i?'is-next':''}" data-ho-action="plate" data-ho-focus="plate-${i}" data-plate="${i}" ${state.step===1&&state.distributed<s.limit&&state.distributed%state.baskets===i?'':'disabled'} aria-label="盤子${i+1}，已有${count}顆${state.step===1&&state.distributed<s.limit&&state.distributed%state.baskets===i?'，點這裡放1顆':''}"><strong>盤子${i+1}</strong><span class="ho-apples">${Array.from({length:count},apple).join('')||'空盤子'}</span><span>${state.step===1&&state.distributed<s.limit&&state.distributed%state.baskets===i?'＋ 放1顆':`已有${count}顆`}</span></button>`).join('')}</div>${state.step===2?`<section class="ho-result">${state.total} ÷ ${state.baskets} ＝ ${s.quotient} 餘 ${s.remainder}<p>${s.quotient} × ${state.baskets} ＋ ${s.remainder} ＝ ${state.total}</p><p>檢查：${s.remainder} ＜ ${state.baskets}</p></section>`:''}`));}
    connect(el,state,steps,render,(action,btn)=>{if(action==='plate'&&state.distributed<info().limit&&Number(btn.dataset.plate)===state.distributed%state.baskets){state.distributed++;window.spEdAudio?.playCoin();}if(action==='restart')state.distributed=0;},ready,input=>{if(input.dataset.setting){state[input.dataset.setting]=Number(input.value);state.distributed=0;state.step=0;}});
    render();
  }

  function mountCapacity(id) {
    const el=document.getElementById(id);if(!el)return;
    const state={step:0,ml:0,free:false};
    const steps=()=>[['找0與1公升','先找到量筒的0，再找到1000毫升刻度。1000毫升就是1公升。'],['用量杯裝到1公升','看量杯的100或500毫升圖示再倒水，讓水面剛好到1000毫升的紅線。','已到1公升，讀水量 →'],['看水面，讀出容量','10杯100毫升剛好是1000毫升，也就是1公升。水量不變，可以用不同單位表示。']];
    const ready=()=>state.free||state.step!==1||state.ml===1000;
    function render(){const enabled=state.free||state.step===1;replace(el,frame(id,'用量杯注水：1000毫升是1公升',`<div class="ho-options">${button('mode',state.free?'回到1公升任務':'自由注水',false,`aria-pressed="${state.free}"`)}</div>${state.free?'<p class="ho-note">選量杯注水，對照水面刻度；量筒最多裝1500毫升。</p>':guide(state,steps(),ready())}<div class="ho-capacity-stage"><svg viewBox="0 0 350 315" role="img" aria-label="量筒水位${state.ml}毫升，每小格50毫升"><rect x="30" y="35" width="120" height="245" rx="7" fill="#eaf7fc" stroke="#286b89" stroke-width="3"/><rect x="34" y="${capacityY(state.ml)}" width="112" height="${280-capacityY(state.ml)}" fill="#74c5e4"/>${Array.from({length:31},(_,i)=>{const ml=i*50,y=capacityY(ml);return `<path d="M30 ${y}h${ml%500===0?130:ml%100===0?28:16}" stroke="${ml===1000?'#aa3833':'#3f6678'}" stroke-width="${ml%500===0?2.5:1}"/>${ml%500===0?`<text x="170" y="${y+6}" font-size="24" fill="${ml===1000?'#a23430':'#264d60'}">${ml===1000?'1000 mL＝1 L':ml+' mL'}</text>`:''}`;}).join('')}<path d="M30 ${capacityY(state.ml)}h125" stroke="#174e75" stroke-width="3" stroke-dasharray="5"/><text x="30" y="307" font-size="22" fill="#203d32">每小格50毫升</text></svg><div class="ho-pour-controls">${[100,500].map(ml=>`<button type="button" data-ho-action="pour" data-ho-focus="pour-${ml}" data-ml="${ml}" ${enabled&&state.ml+ml<=1500?'':'disabled'}>${cup(ml)}<strong>倒進${ml} mL</strong></button>`).join('')}${button('out','倒出100 mL',!enabled||state.ml<100)}${button('empty','清空量筒',!enabled||state.ml===0)}</div></div>${state.free||state.step===2?`<p class="ho-result">${Math.floor(state.ml/1000)} 公升又 ${state.ml%1000} 毫升 ＝ ${state.ml} 毫升</p>`:state.step===1?'<p class="ho-note">看水面是否對準紅線；到1000毫升後就能進下一步。</p>':''}${state.ml>=1000?`<div class="ho-litre-equivalence" role="img" aria-label="10杯100毫升等於1公升"><div>${Array.from({length:10},()=>cup()).join('')}</div><strong>＝ 1公升</strong></div>`:''}`));}
    connect(el,state,steps,render,(action,btn)=>{if(action==='mode'){state.free=!state.free;state.step=0;state.ml=0;}if(action==='pour'&&(state.free||state.step===1)&&state.ml+Number(btn.dataset.ml)<=1500){state.ml+=Number(btn.dataset.ml);window.spEdAudio?.playWater();}if(action==='out'&&state.ml>=100)state.ml-=100;if(action==='empty'||action==='restart')state.ml=0;},ready);
    render();
  }

  function mountFraction(id,initial={}) {
    const el=document.getElementById(id);if(!el)return;
    const allowed=[2,3,4,6,8], initialDen=allowed.includes(initial.denominator)?initial.denominator:4;
    const state={step:0,den:initialDen,selected:new Set(),target:Math.max(0,Math.min(initialDen,initial.numerator??3))};
    const steps=()=>[['看清楚同一個整體','這一整個披薩代表1。比較分數時，先確認完整披薩一樣大。'],['平分成一樣大的份','每片都一樣大，才叫等分；數一數總共幾片。'],['點圖選取披薩',`請選${state.target}片。直接點披薩切片，或用下方按鈕；再點一次可以放回。`,'選好了，讀分數 →'],['連到分數符號',`平分成${state.den}份，取了${state.selected.size}份，讀作${state.den}分之${state.selected.size}。分母是等分的總份數，分子是取的份數。`]];
    const ready=()=>state.step!==2||state.selected.size===state.target;
    function render(){replace(el,frame(id,'披薩等分：看整體、選切片、讀分數',`<div class="ho-inputs"><label>平分成幾份<select data-fraction="den" data-ho-focus="den">${allowed.map(n=>`<option ${n===state.den?'selected':''}>${n}</option>`).join('')}</select></label><label>這次要選幾片<select data-fraction="target" data-ho-focus="target">${Array.from({length:state.den+1},(_,n)=>`<option ${n===state.target?'selected':''}>${n}</option>`).join('')}</select></label></div>${guide(state,steps(),ready())}<div class="ho-fraction-stage"><svg viewBox="0 0 240 240" role="group" aria-label="一個披薩${state.step?'平分成'+state.den+'份':'代表一個整體'}"><circle cx="120" cy="120" r="102" fill="#fff0b3" stroke="#875e2e" stroke-width="3"/>${state.step>=1?Array.from({length:state.den},(_,i)=>`<path d="${fractionPath(i,state.den)}" fill="${state.step>=2&&state.selected.has(i)?'#f39a47':'#fff0b3'}" stroke="#875e2e" stroke-width="2" ${state.step>=2?`role="button" tabindex="0" data-ho-action="slice" data-ho-focus="slice-${i}" data-slice="${i}" aria-label="第${i+1}片披薩" aria-pressed="${state.selected.has(i)}"`:''}/>${state.step>=2&&state.selected.has(i)?`<text x="${120+58*Math.cos((i+.5)*2*Math.PI/state.den-Math.PI/2)}" y="${128+58*Math.sin((i+.5)*2*Math.PI/state.den-Math.PI/2)}" font-size="25" font-weight="bold" text-anchor="middle" fill="#56391e" pointer-events="none" aria-hidden="true">✓</text>`:''}`).join(''):''}</svg>${state.step===3?`<div class="ho-fraction-symbol" role="img" aria-label="${state.den}分之${state.selected.size}"><strong>${state.selected.size}</strong><span></span><strong>${state.den}</strong><p>讀作 ${state.den} 分之 ${state.selected.size}</p></div>`:'<p>先指認整體和等份，操作完成再看符號。</p>'}</div>${state.step>=2?`<div class="ho-options">${button('take','＋ 選1片',state.selected.size===state.den)}${button('putback','－ 放回1片',state.selected.size===0)}${button('clear','全部放回',state.selected.size===0)}<strong role="status">${state.step===3 ? `目前選了 ${state.selected.size} 片` : `已選 ${state.selected.size} / ${state.target} 片`}</strong></div>`:''}`));}
    connect(el,state,steps,render,(action,btn)=>{if(action==='slice'){const n=Number(btn.dataset.slice);if(state.selected.has(n))state.selected.delete(n);else state.selected.add(n);}if(action==='take'){const n=Array.from({length:state.den},(_,i)=>i).find(i=>!state.selected.has(i));if(n!==undefined)state.selected.add(n);}if(action==='putback')state.selected.delete([...state.selected].at(-1));if(action==='clear'||action==='restart')state.selected.clear();},ready,input=>{if(input.dataset.fraction==='den'){state.den=Number(input.value);state.target=Math.min(state.target,state.den);state.selected.clear();state.step=0;}if(input.dataset.fraction==='target'){state.target=Number(input.value);state.selected.clear();state.step=0;}});
    el.onkeydown=event=>{const slice=event.target.closest('[data-slice]');if(slice&&['Enter',' '].includes(event.key)){event.preventDefault();slice.dispatchEvent(new MouseEvent('click',{bubbles:true}));}};
    render();
  }

  function mountCircle(id) {
    const el=document.getElementById(id);if(!el)return;
    const state={step:0,radius:4,turns:0};
    const steps=()=>[['固定圓心','紅色針腳固定在圓心；另一腳到圓周的距離就是半徑。'],['固定半徑，轉動圓規','每按一次「轉四分之一圈」，筆腳沿同樣距離畫出一段；四次才完成一個圓。','圓畫好了，看看直徑 →'],['用兩條半徑接成直徑','把兩條一樣長的半徑，在圓心接起來。直徑經過圓心，長度是半徑的2倍。']];
    const ready=()=>state.step!==1||state.turns===4;
    function render(){const r=state.radius*20;const a=state.turns*Math.PI/2;let drawn='';for(let i=0;i<state.turns;i++){const s=i*Math.PI/2,e=(i+1)*Math.PI/2;drawn+=`M${140+r*Math.cos(s)} ${140+r*Math.sin(s)} A${r} ${r} 0 0 1 ${140+r*Math.cos(e)} ${140+r*Math.sin(e)} `;}
      replace(el,frame(id,'圓規畫圓：固定圓心與半徑',`<label class="ho-radius-label">半徑設定<select data-radius data-ho-focus="radius">${[2,3,4,5,6].map(n=>`<option value="${n}" ${n===state.radius?'selected':''}>${n} 公分</option>`).join('')}</select></label>${guide(state,steps(),ready())}<div class="ho-circle-stage"><svg viewBox="0 0 300 300" role="img" aria-label="半徑${state.radius}公分，已轉${state.turns}個四分之一圈${state.step===2?'；直徑'+state.radius*2+'公分':''}"><circle cx="140" cy="140" r="${r}" fill="#edf5e8" stroke="#8d9d80" stroke-dasharray="5"/>${drawn&&state.step>=1?`<path d="${drawn}" fill="none" stroke="#2c7755" stroke-width="4"/>`:''}${state.step===2?`<path d="M${140-r} 140H140" stroke="#935bb0" stroke-width="5"/><text x="${140-r/2}" y="123" text-anchor="middle" font-size="20" fill="#6f408e">${state.radius} cm</text><text x="140" y="${140+r+25}" text-anchor="middle" font-size="21" fill="#244b37">直徑 ${state.radius*2} cm</text>`:''}<path d="M140 140H${140+r}" stroke="#2b659c" stroke-width="5"/><text x="${140+r/2}" y="123" text-anchor="middle" font-size="20" fill="#245c90">${state.radius} cm</text>${state.step===1?`<path d="M140 140L${140+r*Math.cos(a)} ${140+r*Math.sin(a)}" stroke="#a15f2b" stroke-width="3"/><circle cx="${140+r*Math.cos(a)}" cy="${140+r*Math.sin(a)}" r="6" fill="#8b582b"/>`:''}<circle cx="140" cy="140" r="7" fill="#b83c39"/><text x="110" y="163" text-anchor="end" font-size="20" fill="#9c3431">圓心</text></svg>${state.step===1?`<div>${button('turn',`轉四分之一圈（${state.turns}/4）`,state.turns===4)}<p>針腳不移動，張開的距離也不變。</p></div>`:state.step===2?`<p class="ho-result">${state.radius} ＋ ${state.radius} ＝ ${state.radius*2} 公分<br>直徑 ＝ 半徑 × 2</p>`:'<p>先找到固定的紅點，再看看藍色半徑。</p>'}</div>`));}
    connect(el,state,steps,render,action=>{if(action==='turn'&&state.step===1&&state.turns<4)state.turns++;if(action==='restart')state.turns=0;},ready,input=>{if(input.matches('[data-radius]')){state.radius=Number(input.value);state.turns=0;state.step=0;}});
    render();
  }
  return {verticalTrace,divisionState,rulerGeometry,capacityY,fractionPath,arithmeticPicture,multiplicationArray,mountRuler,mountAngle,mountDivision,mountCapacity,mountFraction,mountCircle};
})();
if(typeof window!=='undefined')window.HandsOnTools=HandsOnTools;
if(typeof module!=='undefined'&&module.exports)module.exports=HandsOnTools;
