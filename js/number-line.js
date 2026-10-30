(function () {
  'use strict';
  function makeHops(start, jump, count) {
    if (![start, jump, count].every(Number.isInteger) || count < 1 || count > 10) throw new Error('請輸入整數，跳格次數限 1～10 次。');
    const points = Array.from({ length: count + 1 }, (_, i) => start + jump * i);
    if (points.some(n => n < 0 || n > 10000)) throw new Error('三年級數線範圍為 0～10000，請調整起點或跳格數。');
    return points;
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { makeHops };
  if (typeof document === 'undefined') return;
  function render(id) {
    const root = document.getElementById(id);
    root.innerHTML = `<section class="card number-line-tool"><h3>數線與加減跳格</h3><p>先預測落點，再逐步跳格。向右表示增加，向左表示減少；每一格的間距相同。</p>
      <form class="practice-settings-grid"><label>起點<input name="start" aria-label="數線起點" type="number" min="0" max="10000" value="20" required></label><label>每次跳多少<input name="jump" aria-label="每次跳格數" type="number" min="-10000" max="10000" value="10" required></label><label>跳幾次<input name="count" aria-label="跳格次數" type="number" min="1" max="10" value="3" required></label><button class="btn btn-primary" type="submit">畫出數線</button></form>
      <p class="number-line-status" role="status"></p><svg viewBox="0 0 760 220" role="img" aria-label="加減跳格數線"></svg><div class="number-line-actions"><button class="btn btn-primary" data-next>走一步</button><button class="btn btn-outline" data-reset>回到起點</button></div><p>說說看：為什麼向這個方向走？最後的數量比起點多還是少？可用浮動畫記圈出落點。</p></section>`;
    let points = [], progress = 0;
    const svg = root.querySelector('svg');
    const status = root.querySelector('[role="status"]');
    const button = root.querySelector('[data-next]');
    const NS = 'http://www.w3.org/2000/svg';
    function node(tag, attrs, label) {
      const el = document.createElementNS(NS, tag);
      Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
      if (label !== undefined) el.textContent = label;
      svg.appendChild(el);
    }
    function paint() {
      svg.replaceChildren();
      const max = Math.max(...points), span = Math.max(10, max);
      let step = Math.max(1, Math.pow(10, Math.floor(Math.log10(span / 5))));
      while (span / step > 9) step *= 2;
      const lo = 0;
      const hi = Math.min(10000, Math.ceil(max / step) * step + step);
      const x = value => 45 + (value - lo) / (hi - lo || 1) * 670;
      node('line', { x1: 35, x2: 725, y1: 150, y2: 150, stroke: '#475569', 'stroke-width': 3 });
      for (let n = lo; n <= hi; n += step) {
        node('line', { x1: x(n), x2: x(n), y1: 144, y2: 158, stroke: '#64748b', 'stroke-width': 2 });
        node('text', { x: x(n), y: 183, 'text-anchor': 'middle', 'font-size': 18, fill: '#334155' }, n);
      }
      for (let i = 1; i <= progress; i++) {
        const from = x(points[i - 1]), to = x(points[i]), mid = (from + to) / 2;
        node('path', { d: `M${from},140 Q${mid},35 ${to},140`, fill: 'none', stroke: '#6366f1', 'stroke-width': 3 });
        const sign = to >= from ? -1 : 1;
        node('path', { d: `M${to + sign * 9},128 L${to},140 L${to - sign * 2},124`, fill: 'none', stroke: '#6366f1', 'stroke-width': 3 });
      }
      node('circle', { cx: x(points[progress]), cy: 150, r: 7, fill: '#4338ca' });
      status.textContent = `已走 ${progress} / ${points.length - 1} 步，目前落在 ${points[progress]}。${progress === points.length - 1 ? '請學生說出跳格與算式的關係。' : '先預測下一個落點。'}`;
      button.disabled = progress === points.length - 1;
    }
    function setup(event) {
      event?.preventDefault();
      const form = root.querySelector('form');
      try { points = makeHops(Number(form.elements.start.value), Number(form.elements.jump.value), Number(form.elements.count.value)); progress = 0; paint(); }
      catch (error) { status.textContent = error.message; button.disabled = true; svg.replaceChildren(); }
    }
    root.querySelector('form').addEventListener('submit', setup);
    button.onclick = () => { if (progress < points.length - 1) { progress++; paint(); } };
    root.querySelector('[data-reset]').onclick = setup;
    setup();
  }
  window.NumberLineTool = { render };
})();
