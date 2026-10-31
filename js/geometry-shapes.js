/* 同時改變邊長與方向，辨認長方形與正方形的不變特徵。 */
(function () {
  'use strict';
  function describe(width, height) {
    if (![width, height].every(n => Number.isInteger(n) && n >= 1 && n <= 8)) throw new Error('邊長限 1～8 格');
    return { square: width === height, rightAngles: 4, sides: [width, height, width, height] };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { describe };
  if (typeof document === 'undefined') return;
  function append(containerId) {
    const host = document.getElementById(containerId);
    const root = document.createElement('section');
    root.className = 'card shape-comparison-tool';
    host.appendChild(root);
    root.innerHTML = `<h3>正方形與長方形：轉一轉、比一比</h3><p>先預測：改變方向，邊長與直角的數量會不會改變？圖上每格是相同的長度單位。</p><div class="practice-settings-grid"><label>橫邊長<select data-width aria-label="圖形橫邊長">${Array.from({ length: 8 }, (_, i) => `<option value="${i + 1}" ${i === 5 ? 'selected' : ''}>${i + 1} 格</option>`).join('')}</select></label><label>直邊長<select data-height aria-label="圖形直邊長">${Array.from({ length: 8 }, (_, i) => `<option value="${i + 1}" ${i === 2 ? 'selected' : ''}>${i + 1} 格</option>`).join('')}</select></label><button class="btn btn-outline" data-rotate>旋轉 45 度</button><button class="btn btn-outline" data-square>設成正方形</button></div><svg viewBox="0 0 560 410" role="img" aria-label="四個直角及四邊長度比較圖"></svg><p role="status" class="number-line-status"></p><p>想一想：四條邊都一樣長就一定是正方形嗎？還需要檢查四個角是不是直角。</p>`;
    const width = root.querySelector('[data-width]'), height = root.querySelector('[data-height]');
    let angle = 0;
    function paint() {
      const w = Number(width.value), h = Number(height.value), info = describe(w, h), unit = 27;
      const x = -w * unit / 2, y = -h * unit / 2, farX = -x, farY = -y;
      const corners = [[x,y,1,1],[farX,y,-1,1],[farX,farY,-1,-1],[x,farY,1,-1]];
      root.querySelector('svg').innerHTML = `<g transform="translate(280 205) rotate(${angle})"><rect x="${x}" y="${y}" width="${w * unit}" height="${h * unit}" fill="#eef2ff" stroke="#4338ca" stroke-width="4"/>${Array.from({length:w-1},(_,i)=>`<path d="M${x+(i+1)*unit} ${y}v${h*unit}" stroke="#a3b7ca"/>`).join('')}${Array.from({length:h-1},(_,i)=>`<path d="M${x} ${y+(i+1)*unit}h${w*unit}" stroke="#a3b7ca"/>`).join('')}${corners.map(([a,b,dx,dy]) => `<path d="M${a + 13 * dx},${b} v${13 * dy} h${-13 * dx}" fill="none" stroke="#d97706" stroke-width="3"/>`).join('')}<text x="0" y="${y - 14}" text-anchor="middle" fill="#334155" font-size="19">${w} 格</text><text x="0" y="${farY + 29}" text-anchor="middle" fill="#334155" font-size="19">${w} 格</text><text x="${x - 14}" y="5" text-anchor="end" fill="#334155" font-size="19">${h} 格</text><text x="${farX + 14}" y="5" fill="#334155" font-size="19">${h} 格</text></g>`;
      root.querySelector('[role="status"]').textContent = `${info.square ? '這是正方形：四邊一樣長，也是四個角都是直角的長方形。' : '這是長方形：對邊一樣長，四個角都是直角。'}目前轉了 ${angle} 度，邊長與四個直角都沒有改變。`;
    }
    width.onchange = height.onchange = paint;
    root.querySelector('[data-rotate]').onclick = () => { angle = (angle + 45) % 360; paint(); };
    root.querySelector('[data-square]').onclick = () => { height.value = width.value; paint(); };
    paint();
  }
  window.GeometryShapes = { append };
})();
