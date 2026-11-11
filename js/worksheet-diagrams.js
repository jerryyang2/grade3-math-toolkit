/* 原創學習單示意圖：使用可黑白列印的 SVG；只呈現題目條件，不寫出解答。 */
const WorksheetDiagrams = (() => {
  'use strict';
  const supports = typeof module !== 'undefined' && module.exports ? require('./worksheet-visual-supports.js') : window.WorksheetVisualSupports;
  const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const number = value => Math.round(value * 1000) / 1000;
  const text = (x, y, value, extra = '') => `<text x="${number(x)}" y="${number(y)}" ${extra}>${escape(value)}</text>`;
  const line = (a, b, extra = '') => `<path d="M${number(a.x)} ${number(a.y)}L${number(b.x)} ${number(b.y)}" ${extra}/>`;
  const dot = (x, y, r = 3) => `<circle cx="${number(x)}" cy="${number(y)}" r="${r}" fill="#111" stroke="none"/>`;
  const polar = (cx, cy, radius, degrees) => ({ x: cx + radius * Math.cos(degrees * Math.PI / 180), y: cy - radius * Math.sin(degrees * Math.PI / 180) });
  const svg = (label, body, height = 140) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 ${height}" role="img" aria-label="${escape(label)}" focusable="false"><g fill="none" stroke="#111" stroke-width="1.6" stroke-linejoin="round">${body}</g></svg>`;
  const label = (x, y, value, extra = '') => text(x, y, value, `fill="#111" ${/\bstroke=/.test(extra) ? '' : 'stroke="none"'} font-family="sans-serif" ${/\bfont-size=/.test(extra) ? '' : 'font-size="16"'} ${extra}`);
  const hatch = id => `<defs><pattern id="${id}" patternUnits="userSpaceOnUse" width="6" height="6"><path d="M-1 1L1-1M0 6L6 0M5 7L7 5" stroke="#333" stroke-width="1"/></pattern></defs>`;

  function circleGeometry(kind) {
    const cx = 86, cy = 66, r = 47, center = { x: cx, y: cy };
    const segment = (a, b, role) => ({ a, b, role });
    const diameter = segment(polar(cx, cy, r, 180), polar(cx, cy, r, 0), 'diameter');
    const radius = segment(center, polar(cx, cy, r, 55), 'radius');
    const chordOffset = 24, halfChord = Math.sqrt(r * r - chordOffset * chordOffset);
    const chord = segment({ x: cx - halfChord, y: cy - chordOffset }, { x: cx + halfChord, y: cy - chordOffset }, 'chord');
    let segments = [];
    if (kind === 'radius') segments = [radius];
    if (kind === 'diameter' || kind === 'fold-line') segments = [diameter];
    if (kind === 'radii') segments = [15, 70, 135, 205, 270, 320].map(angle => segment(center, polar(cx, cy, r, angle), 'radius'));
    if (kind === 'chord') segments = [chord];
    if (kind === 'compare') segments = [diameter, radius, chord];
    if (kind === 'parts') segments = [diameter, radius];
    if (kind === 'fold-cross') segments = [diameter, segment(polar(cx, cy, r, 90), polar(cx, cy, r, 270), 'diameter')];
    return { cx, cy, r, segments };
  }
  function circle(kind) {
    const g = circleGeometry(kind);
    const descriptions = {
      center: ['看這個黑點', '圓的中央有一個黑點 O'],
      edge: ['看外圍粗線', '整個圓形邊界以粗線表示'],
      radius: ['看這條粗線', '粗線從點 O 連到圓形邊界'],
      diameter: ['看這條粗線', '粗線穿過點 O，兩端都在圓形邊界'],
      radii: ['還可以再畫嗎？', '從點 O 向不同方向畫出一些線段'],
      chord: ['看這條粗線', '粗線兩端在圓形邊界，沒有經過點 O'],
      compare: ['比較線段長短', '同一個圓內畫出三種長度的線段'],
      'fold-cross': ['展開後的摺痕', '圓形紙片展開後，兩條虛線摺痕交叉'],
      'fold-line': ['看這條摺痕', '圓形紙片對摺後展開，虛線表示摺痕'],
      parts: ['比較圖中的線段', '圓內有穿過點 O 的實線，以及從點 O 出發的虛線']
    };
    const [prompt, description] = descriptions[kind];
    let body = `<circle cx="${g.cx}" cy="${g.cy}" r="${g.r}" stroke-width="${kind === 'edge' ? 4 : 1.6}"/>`;
    body += g.segments.map(s => line(s.a, s.b, `stroke-width="${kind === 'radii' ? 2 : 3}" ${kind.startsWith('fold') || (kind === 'parts' && s.role === 'radius') ? 'stroke-dasharray="5 3"' : ''}`)).join('');
    body += dot(g.cx, g.cy) + label(g.cx + 6, g.cy + 19, 'O', 'paint-order="stroke" stroke="#fff" stroke-width="3"');
    body += label(155, 52, prompt);
    if (['center', 'edge', 'radius', 'diameter', 'chord'].includes(kind)) {
      const target = kind === 'center' ? { x: g.cx + 5, y: g.cy } : kind === 'edge' ? polar(g.cx, g.cy, g.r, 25) : kind === 'chord' ? { x: g.cx + 12, y: g.cy - 24 } : kind === 'radius' ? polar(g.cx, g.cy, g.r * .6, 55) : { x: g.cx + 25, y: g.cy };
      body += line({ x: 150, y: 58 }, target, 'stroke-width="1"');
    }
    if (kind === 'radii') body += label(155, 80, '圖中只畫出一部分');
    if (kind.startsWith('fold')) body += label(155, 80, '虛線表示摺痕');
    return svg(description, body, 132);
  }

  function rulerGeometry(start, end, min = 0, max = 60) {
    if (![start, end, min, max].every(Number.isFinite) || min >= max || start < min || end > max || start > end) throw new RangeError('Invalid ruler range');
    const at = mm => 20 + (mm - min) * 260 / (max - min);
    return { start: at(start), end: at(end), min, max, at };
  }
  function ruler(start, end, min, max, object, split = null) {
    const g = rulerGeometry(start, end, min, max);
    let body = `<rect x="14" y="80" width="272" height="48" fill="#fff"/>`;
    for (let mm = min; mm <= max; mm++) {
      body += line({ x: g.at(mm), y: 80 }, { x: g.at(mm), y: mm % 10 === 0 ? 101 : mm % 5 === 0 ? 95 : 89 });
      if (mm % 10 === 0) body += label(g.at(mm), 119, mm / 10, 'text-anchor="middle" font-size="13"');
    }
    body += label(288, 139, 'cm', 'text-anchor="end" font-size="13"');
    body += `<rect x="${number(g.start)}" y="53" width="${number(g.end - g.start)}" height="15" fill="#eee" stroke-width="2"/>`;
    if (split !== null) body += `<rect x="${number(g.at(split))}" y="53" width="${number(g.end - g.at(split))}" height="15" fill="#fff" stroke-dasharray="3 2"/>`;
    for (const x of [g.start, g.end]) body += line({ x, y: 48 }, { x, y: 90 }, 'stroke-dasharray="3 2"');
    body += label(20, 30, object);
    return svg(`直尺放大示意，物品從${start / 10}公分到${end / 10}公分；請依刻度判讀`, body, 146);
  }
  function coinThickness(stacked = false) {
    let body = '';
    const count = stacked ? 3 : 1;
    for (let i = 0; i < count; i++) body += `<path d="M35 ${38 + i * 15}q40-13 80 0v10q-40 13-80 0Z" fill="#fff"/><path d="M35 ${38 + i * 15}q40 13 80 0"/>`;
    body += `<path d="M125 38h12m-6 0v${count * 15 - 5}m-6 0h12"/>`;
    if (stacked) body += `<path d="M180 35l70-10 20 35-70 10Z" fill="#fff"/><path d="M180 35v35l20 34 70-10V60m-70 10v34"/>${label(172, 127, '課本的厚度')}${label(24, 127, '每枚約 2 毫米')}`;
    else body += label(158, 61, '看硬幣側面的厚度');
    return svg(stacked ? '三枚硬幣疊起來，與課本厚度相比' : '硬幣側面與厚度的示意圖', body);
  }

  function angleArm(x, y, length, degrees, extra = '') {
    const end = polar(x, y, length, degrees), arc = polar(x, y, 16, degrees);
    return `<path d="M${x + length} ${y}H${x}L${number(end.x)} ${number(end.y)}" stroke-width="3" ${extra}/><path d="M${x + 16} ${y}A16 16 0 0 0 ${number(arc.x)} ${number(arc.y)}"/>${dot(x, y)}`;
  }
  function angle(kind) {
    let body, description;
    if (kind === 'parts') {
      body = angleArm(65, 105, 100, 65) + label(180, 55, '看連接點') + label(180, 89, '再看兩條線');
      description = '兩條直線段在同一個黑點相接';
    } else if (kind === 'curved') {
      body = '<path d="M40 95Q95 20 155 65M40 95Q100 145 170 100" stroke-width="3"/>' + dot(40, 95) + label(180, 65, '沿著兩條邊看') + label(180, 91, '有沒有彎曲？');
      description = '兩條明顯彎曲的線在一點相接';
    } else if (kind === 'rectangle') {
      body = '<rect x="40" y="24" width="215" height="94"/>' + [[40,24],[255,24],[40,118],[255,118]].map(([x,y])=>dot(x,y)).join('') + label(148, 79, '黑板', 'text-anchor="middle"');
      description = '長方形黑板的轉角有黑點標記';
    } else if (kind === 'triangle') {
      body = '<path d="M30 115L145 20L265 115Z" stroke-width="2"/>' + [[30,115],[145,20],[265,115]].map(([x,y])=>dot(x,y)).join('');
      description = '三角形的每一個頂點有黑點，邊以實線表示';
    } else if (kind === 'align') {
      body = angleArm(45, 98, 78, 60) + angleArm(65, 112, 80, 35, 'stroke-dasharray="5 3"') + label(170, 60, '虛線角可以移動') + label(170, 88, '先對齊哪裡？');
      description = '實線角和虛線角目前尚未疊合，請思考先對齊的位置';
    } else if (kind === 'fan' || kind === 'scissors') {
      const opening = [35, 80];
      body = opening.map((degrees, i) => {
        const x = 45 + i * 150, y = 108, r = 80;
        if (kind === 'scissors') return angleArm(x, y, r, degrees) + `<circle cx="${x-12}" cy="${y+5}" r="11"/><circle cx="${x-6}" cy="${y+22}" r="11"/>` + label(x+40, 137, i ? '張開後' : '原來', 'text-anchor="middle" font-size="14"');
        const top = polar(x, y, r, degrees);
        return `<path d="M${x} ${y}H${x+r}A${r} ${r} 0 0 0 ${number(top.x)} ${number(top.y)}Z"/>` + [1,2,3,4].map(n=>line({x,y},polar(x,y,r,degrees*n/5))).join('') + label(x+30, 137, i ? '打開後' : '原來', 'text-anchor="middle"');
      }).join('');
      description = kind === 'fan' ? '同一把摺扇，從較小開口打開到較大開口' : '剪刀開口從較小變成較大的示意圖';
    } else {
      const unequalOpening = kind === 'compare';
      const lengths = kind === 'lengths' ? [24,80] : kind === 'extend' ? [45,80] : [80,80];
      body = angleArm(40, 108, lengths[0], unequalOpening ? 80 : 55) + angleArm(180, 108, lengths[1], unequalOpening ? 35 : 55, unequalOpening ? 'stroke-dasharray="5 3"' : '');
      body += label(75, 138, unequalOpening ? '藍色角（實線）' : kind === 'lengths' ? '角 A：3 公分' : '原來', 'text-anchor="middle" font-size="14"');
      body += label(225, 138, unequalOpening ? '紅色角（虛線）' : kind === 'lengths' ? '角 B：10 公分' : '邊變長', 'text-anchor="middle" font-size="14"');
      description = unequalOpening ? '藍色角以實線表示，紅色角以虛線表示，開口大小不同' : '兩個角的張開角度相同，邊長不同';
    }
    return svg(description, body, 150);
  }

  function sectorPath(cx, cy, radius, index, denominator) {
    if (!Number.isInteger(denominator) || denominator < 2 || !Number.isInteger(index) || index < 0 || index >= denominator) throw new RangeError('Invalid equal partition');
    const a = polar(cx, cy, radius, 90 - index * 360 / denominator), b = polar(cx, cy, radius, 90 - (index + 1) * 360 / denominator);
    return `M${cx} ${cy}L${number(a.x)} ${number(a.y)}A${radius} ${radius} 0 ${360 / denominator > 180 ? 1 : 0} 1 ${number(b.x)} ${number(b.y)}Z`;
  }
  function fraction(denominator, selected, shape, id) {
    const pattern = `ws-hatch-${id}`;
    let body = hatch(pattern);
    if (shape === 'square') {
      body += Array.from({length:4},(_,i)=>`<rect x="${28+i%2*46}" y="${18+Math.floor(i/2)*46}" width="46" height="46" fill="${i<selected ? `url(#${pattern})` : '#fff'}"/>`).join('');
      body += label(155, 56, '看整個正方形') + label(155, 84, '再數指定的份數');
    } else if (shape === 'pie') {
      body += Array.from({length:denominator},(_,i)=>`<path d="${sectorPath(80,65,48,i,denominator)}" fill="${i<selected ? `url(#${pattern})` : '#fff'}"/>`).join('');
      body += label(155, 56, '看整個圓形') + label(155, 84, '再數指定的份數');
    } else {
      const width = 264 / denominator;
      body += Array.from({length:denominator},(_,i)=>`<rect x="${number(18+i*width)}" y="42" width="${number(width)}" height="45" fill="${i<selected ? `url(#${pattern})` : '#fff'}"/>`).join('');
    }
    return svg(`整體平分成${denominator}份，其中${selected}份以斜線表示`, body, 130);
  }
  function fractionSymbol(numerator, denominator, target, order = false) {
    let body = label(85, 53, numerator, 'text-anchor="middle" font-size="34"') + '<path d="M56 65h58" stroke-width="3"/>' + label(85, 105, denominator, 'text-anchor="middle" font-size="34"');
    if (order) {
      body += [38,65,98].map(y=>`<circle cx="157" cy="${y}" r="12"/>`).join('') + label(180, 54, '空圈寫順序') + label(180, 84, '先寫哪個部分？');
    } else {
      const y = target === 'top' ? 40 : 92;
      body += `<ellipse cx="85" cy="${y}" rx="27" ry="24" stroke-dasharray="4 3"/>` + label(178, y+5, '這個數叫什麼？') + line({x:172,y},{x:116,y});
    }
    return svg(order ? '分數例子與三個空圈，供學生思考書寫順序' : `上下排列的分數，虛線圈出${target==='top'?'上方':'下方'}的數`, body, 132);
  }
  function appleBox() {
    let body = '<rect x="17" y="14" width="266" height="105" rx="5"/>';
    for(let i=0;i<12;i++) {
      const x=42+i%6*43,y=40+Math.floor(i/6)*49;
      body += `<path d="M${x} ${y-4}c-18-12-20 18-7 22l7-2 7 2c13-4 11-34-7-22Z" fill="#fff"/><path d="M${x} ${y-3}v-11m0 4q10-10 13-2q-4 6-13 2"/>`;
      if(i===0) body+=`<ellipse cx="${x}" cy="${y+5}" rx="21" ry="26" stroke-width="2.5" stroke-dasharray="4 2"/>`;
    }
    return svg('一整盒有十二顆蘋果，第一顆以虛線圈出',body,132);
  }

  function capacityGeometry(divisions, level) {
    if (!Number.isInteger(divisions) || divisions < 1 || level < 0 || level > divisions) throw new RangeError('Invalid capacity divisions');
    const at = n => 118 - n * 9;
    return { bottom: at(0), top: at(divisions), water: at(level), at };
  }
  function jug(maximum, unit, level, id) {
    const g=capacityGeometry(10,level), pattern=`ws-hatch-${id}`;
    let body=hatch(pattern)+`<rect x="44" y="${g.top}" width="80" height="90" fill="#fff"/>`;
    if(level) body+=`<rect x="45" y="${g.water}" width="78" height="${g.bottom-g.water}" fill="url(#${pattern})"/>`;
    for(let n=0;n<=10;n++) body+=line({x:44,y:g.at(n)},{x:n%5===0?135:61,y:g.at(n)});
    body+=label(144,g.top+6,`${maximum} ${unit}`)+label(144,g.bottom+5,'0');
    body+=label(190,74,level ? '看水面位置' : '看每個大格');
    return svg(`量杯有十個等高大格，上端標示${maximum}${unit}${level ? '，水面在第'+level+'大格' : ''}`,body,140);
  }
  function capacity(kind, id) {
    let body='';
    if(kind==='spoons') {
      for(const x of [40,145]) body+=`<ellipse cx="${x}" cy="45" rx="24" ry="14"/><path d="M${x+23} 44h40v7h-40"/>${label(x,86,'5 毫升','text-anchor="middle"')}`;
      body+=label(150,124,'兩匙倒進同一杯','text-anchor="middle"');
    } else if(kind==='milk') {
      body='<path d="M90 45l18-25h70l25 25v82H90Z" fill="#fff"/><path d="M90 45h113m-25-25-17 25v82"/>'+label(125,76,'家庭號','text-anchor="middle"')+label(125,101,'鮮奶','text-anchor="middle"');
    } else if(kind==='eye') {
      body='<path d="M55 20h75v105H55Z"/><path d="M56 77h73" stroke-width="3"/>'+label(20,81,'水面','font-size="13"');
      for(const [i,y] of [38,77,115].entries()) body+=`<path d="M205 ${y}q16-14 32 0q-16 14-32 0Z" fill="#fff"/>${dot(221,y,3)}${line({x:202,y},{x:130,y:77},'stroke-dasharray="3 2"')}${label(251,y+5,['A','B','C'][i])}`;
    } else if(kind==='half') {
      body=hatch(`ws-hatch-${id}`);
      for(const [i,fill] of [1,.5].entries()) {
        const x=45+i*155;
        body+=`<path d="M${x} 30h65v95h-65Z" fill="#fff"/><rect x="${x+1}" y="${125-94*fill}" width="63" height="${94*fill-1}" fill="url(#ws-hatch-${id})"/><path d="M${x+15} 30V15h35v15"/>`+label(x+32,145,i?'喝了半壺':'裝滿 650 mL','text-anchor="middle" font-size="14"');
      }
      body+='<path d="M125 75h57m-8-7 8 7-8 7"/>';
    } else if(kind==='containers') {
      body='<path d="M12 57h95l-8 40H24ZM24 97l-5 15m79-15 5 15M126 66h42v40h-42Zm42 5q24-3 2 29M190 85h24v23h-24ZM248 51h25l4 59h-33Zm4 0V35h25v16"/>';
      body+=label(57,136,'浴缸','text-anchor="middle"')+label(147,136,'馬克杯','text-anchor="middle" font-size="14"')+label(202,136,'小量杯','text-anchor="middle" font-size="14"')+label(260,136,'養樂多','text-anchor="middle" font-size="14"');
    }
    return svg({spoons:'兩支小匙各標五毫升',milk:'家庭號鮮奶紙盒示意',eye:'水面旁有三個不同高度的眼睛 A、B、C',half:'同一個水壺裝滿與喝了半壺的水位比較',containers:'浴缸、馬克杯、小量杯與養樂多瓶的示意'}[kind],body,155);
  }
  function groups(count, each, unit) {
    let body='';
    for(let i=0;i<count;i++) body+=`<rect x="${18+i*90}" y="32" width="78" height="69" rx="8" fill="#fff"/>`+label(57+i*90,59,'每份','text-anchor="middle"')+label(57+i*90,86,`${each}${unit}`,'text-anchor="middle"');
    return svg(`${count}份相同的物品，每份標示${each}${unit}，總量尚未計算`,body,126);
  }
  function division(total, mode) {
    let body='';
    const cols=12;
    for(let i=0;i<total;i++) body+=`<rect x="${12+i%cols*23}" y="${14+Math.floor(i/cols)*22}" width="15" height="15" rx="2" fill="#fff"/>`;
    if(mode==='share') body+=Array.from({length:3},(_,i)=>`<rect x="${25+i*90}" y="75" width="70" height="41" rx="8"/>${label(60+i*90,101,'模組'+(i+1),'text-anchor="middle" font-size="14"')}`).join('');
    else body+='<path d="M105 78q45-20 90 0l7 40H98Z"/>'+label(150,104,'每袋 6 塊','text-anchor="middle"');
    return svg(mode==='share'?'十二點能量與三個模組空框，尚未分配':'二十四塊餅乾與一個每袋六塊的包裝示意，尚未分袋',body,132);
  }
  function banknotes() {
    return svg('十張千元鈔票，尚未寫出合計金額',Array.from({length:10},(_,i)=>`<rect x="${12+i%5*57}" y="${18+Math.floor(i/5)*48}" width="49" height="32" rx="3" fill="#fff"/>${label(36+i%5*57,40+Math.floor(i/5)*48,'1000','text-anchor="middle" font-size="14"')}`).join(''),118);
  }
  function placeTable() {
    return svg('千、百、十、個四個位值欄，格子留空由學生填寫',Array.from({length:4},(_,i)=>`<rect x="${12+i*69}" y="44" width="69" height="58"/>${label(46+i*69,29,['千位','百位','十位','個位'][i],'text-anchor="middle"')}`).join(''),118);
  }

  function circleMeasure(kind, given) {
    const cx=85,cy=74,r=44;
    let body='';
    if(kind==='compare') {
      for(const [x,radius,diameter,value] of [[70,48,false,6],[218,40,true,10]]) {
        body+=`<circle cx="${x}" cy="70" r="${radius}"/>`+dot(x,70);
        body+=line({x:diameter?x-radius:x,y:70},{x:x+radius,y:70},'stroke-width="3"');
        body+=label(x,15,x===70?'甲圓':'乙圓','text-anchor="middle"')+label(x,140,`${diameter?'直徑':'半徑'} ${value} 公分`,'text-anchor="middle" font-size="14"');
      }
    } else if(kind==='coins') {
      for(const x of [55,115,175]) body+=`<circle cx="${x}" cy="62" r="30"/>`+dot(x,62);
      body+=line({x:55,y:62},{x:85,y:62},'stroke-width="3"')+label(150,18,'每枚半徑 2 公分','text-anchor="middle"');
      body+='<path d="M25 100v8h180v-8"/>'+label(115,138,'整排長度？公分','text-anchor="middle"');
    } else if(kind==='compass') {
      body+=`<circle cx="${cx}" cy="${cy}" r="${r}" stroke-dasharray="4 3"/><path d="M${cx} ${cy}L107 15L${cx+r} ${cy}M107 15V5" stroke-width="3"/>`+dot(cx,cy);
      body+=`<path d="M${cx} 94v8h${r}v-8"/>`+label(190,51,'兩腳張開的距離','text-anchor="middle" font-size="14"')+line({x:177,y:57},{x:111,y:102});
      if(given)body+=label(107,130,`${given} 公分`,'text-anchor="middle"');
    } else {
      if(kind==='inscribed') body+='<rect x="41" y="30" width="88" height="88"/>'+label(185,40,'色紙邊長 8 公分','text-anchor="middle" font-size="14"');
      body+=`<circle cx="${cx}" cy="${cy}" r="${r}"/>`+dot(cx,cy)+label(cx-5,cy+20,'O','text-anchor="end"');
      if(kind==='wheel') for(let a=0;a<360;a+=45) {
        const end=polar(cx,cy,r,a);body+=line({x:cx,y:cy},end)+dot(end.x,end.y,4);
      }
      body+=line({x:cx-r,y:cy},{x:cx,y:cy},'stroke-width="3"')+line({x:cx,y:cy},{x:cx+r,y:cy},'stroke-width="3" stroke-dasharray="5 3"');
      const radiusKnown=kind==='radius';
      if(kind==='relation') {
        body+=label(185,49,'實線與虛線各是','text-anchor="middle" font-size="14"')+label(185,74,'一條半徑','text-anchor="middle"');
      } else {
        const unit=kind==='wheel'?'公尺':'公分';
        body+=label(185,69,`半徑 ${radiusKnown?given:'？'} ${unit}`,'text-anchor="middle" font-size="14"');
        body+=`<path d="M${cx-r} 127v8h${2*r}v-8"/>`+label(188,143,`直徑 ${radiusKnown?'？':given} ${unit}`,'text-anchor="middle" font-size="14"');
      }
    }
    return svg('圓與已知條件示意，問號為待求長度',body,155);
  }

  // 以穩定題號與關鍵條件對應，題意若改變就不套用舊圖，避免圖文不符。
  const entries = Object.create(null);
  const add = (id, required, draw, caption) => { entries[id] = { required, draw, caption }; };
  const circleTypes=['center','edge','radius','diameter','radii','chord','compare','fold-cross','fold-line','parts'];
  const circleTerms=['最正中心','最外圍','從「圓心」','通過「圓心」','幾條半徑','沒有通過圓心','最長','對摺再對摺','摺痕兩端','哪一個是錯誤'];
  circleTypes.forEach((kind,i)=>add(`p9_1_${i+1}`,[circleTerms[i]],()=>circle(kind),i===4?'圖中只畫出部分線段，可以繼續試畫。':kind.startsWith('fold')?'展開後的圓形紙片；虛線表示摺痕。':'對照黑點與線條，依題意判斷。'));
  [
    [1,['直徑','半徑'],'relation'],
    [2,['半徑是 4 公分'],'radius',4],
    [3,['直徑是 10 公分'],'diameter',10],
    [4,['兩腳張開的距離'],'compass'],
    [5,['直徑 6 公分'],'diameter',6],
    [6,['兩腳張開 5 公分'],'compass',5],
    [7,['半徑是 6 公分','直徑是 10 公分'],'compare'],
    [8,['邊長 8 公分','最大的圓'],'inscribed',8],
    [9,['直徑是 30 公尺'],'wheel',30],
    [10,['3 個半徑都是 2 公分'],'coins']
  ].forEach(([i,required,kind,value])=>add(`p9_2_${i}`,required,()=>circleMeasure(kind,value),'圖為教學示意，請依標示的條件思考；不要直接量圖。'));
  const angleTypes=['parts','curved','rectangle','extend','compare','align','fan','scissors','triangle','lengths'];
  const angleTerms=['什麼組成','彎彎曲曲','黑板','邊畫得更長','藍色角','疊合方法','摺扇','剪刀','三角形','3 公分'];
  angleTypes.forEach((kind,i)=>add(`p5_1_${i+1}`,[angleTerms[i]],()=>angle(kind),'觀察圖中的點、邊與張開方向。'));
  const rulers=[
    [1,['1 公分','10 小格'],0,1,0,10,'看相鄰兩條小刻度線'],
    [2,['7 小格'],0,7,0,10,'粗線表示 7 個小格'],
    [4,['3 公分','4 小格'],0,34,0,40,'橡皮擦'],
    [5,['2 公分','5 公分'],20,50,0,60,'迴紋針'],
    [7,['4 毫米'],0,4,0,10,'粗線表示螞蟻身長'],
    [8,['3 公分 5 毫米','11 公分 5 毫米'],35,115,30,120,'鉛筆'],
    [9,['15 小格','8 小格'],0,23,0,30,'先數實線段，再數虛線段',15],
    [10,['9 毫米','1 公分'],0,9,0,10,'粗線表示指甲寬度']
  ];
  rulers.forEach(([i,required,...args])=>add(`p4_1_${i}`,required,()=>ruler(...args),'放大示意，請依刻度判讀，不要直接用尺量圖。'));
  add('p4_1_3',['厚度','毫米'],()=>coinThickness(),'硬幣側面示意；比較厚度與物品長度的差別。');
  add('p4_1_6',['三片','2 毫米'],()=>svg('三片同厚墊片緊密相疊，每片厚2毫米，總厚度留白', '<path d="M35 35h90v18H35Zm0 18h90v18H35Zm0 18h90v18H35Z" fill="#eee"/>'+label(145,49,'每片 2 毫米')+'<path d="M25 35H15v54h10"/>'+label(145,85,'合計？毫米'),115),'三片厚度相同，緊密相疊不留縫。');
  add('p8_1_1',['1 公尺','4 個等長'],id=>fraction(4,1,'bar',id),'整條長 1 公尺，斜線表示四個等長區段中的一段。');
  add('p8_1_2',['3/8','下面'],()=>fractionSymbol(3,8,'bottom'),'虛線圈出題目指定的數。');
  add('p8_1_3',['5/6','上方'],()=>fractionSymbol(5,6,'top'),'虛線圈出題目指定的數。');
  add('p8_1_4',['8 份','1/8'],id=>fraction(8,1,'bar',id),'外框代表整張色紙，斜線表示其中一份。');
  add('p8_1_5',['長度都不一樣'],()=>svg('同一條繩子剪成三段，長度不相同','<path d="M18 52h65m12 0h45m12 0h129" stroke-width="7"/>'+label(150,102,'三段長短不同','text-anchor="middle"'),125),'先觀察三段是否一樣長。');
  add('p8_1_6',['6 塊','2 塊'],id=>fraction(6,2,'pie',id),'斜線表示吃掉的部分，外圈是一整個披薩。');
  add('p8_1_7',['十格','7 格'],id=>fraction(10,7,'bar',id),'進度條各格等大，斜線表示亮起的部分。');
  add('p8_1_8',['標準的筆順'],()=>fractionSymbol(3,5,'',true),'以分數 3/5 為例，在空圈想一想書寫順序。');
  add('p8_1_9',['8 個','5 格'],id=>fraction(8,5,'pie',id),'徽章的斜線部分已塗色；本題問空白部分。');
  add('p8_1_10',['12 顆','1 顆'],()=>appleBox(),'外框是一整盒，圈起的是拿出的那一顆。');
  add('p7_1_3',['2 小匙','5 毫升'],id=>capacity('spoons',id),'看每匙的量，再想兩匙合起來的量。');
  add('p7_1_4',['家庭號鮮奶'],id=>capacity('milk',id),'想想生活中看過的家庭號鮮奶。');
  add('p7_1_5',['量筒','眼睛'],id=>capacity('eye',id),'A、B、C 是三種觀察高度，請依題意判斷。');
  add('p7_1_6',['1 公升','10 大格'],id=>jug(1,'公升',0,id),'整杯到上方刻度是 1 公升，各大格一樣高。');
  add('p7_1_7',['第 6 大格'],id=>jug(1,'公升',6,id),'1公升量杯分成10大格；斜線區域表示水。');
  add('p7_1_8',['650 mL','半壺'],id=>capacity('half',id),'裝滿與喝了半壺是同一個水壺。');
  add('p7_1_9',['容量最大'],id=>capacity('containers',id),'容器僅為示意，請想想生活中實物的容量。');
  add('p7_1_10',['100 毫升','10 個小格'],id=>jug(100,'毫升',0,id),'上方刻度是 100 毫升，各小格一樣高。');
  add('p1_1_2',['10 個一千元'],()=>banknotes(),'每張示意鈔票代表 1000 元，請自行合計。');
  add('p1_1_8',['五千零六十'],()=>placeTable(),'先想每個位子要填什麼，再讀一次。');
  add('p3_1_1',['20 分','3 回合'],()=>groups(3,20,'分'),'每份相同，想想全部合起來的量。');
  add('p3_1_4',['24 片','3 排'],()=>groups(3,24,'片'),'每個框代表一排，請自行合計。');
  add('p6_1_1',['12 點','3 個模組'],()=>division(12,'share'),'每個小方格表示 1 點能量，下方是三個待分配的模組。');
  add('p6_1_2',['24 塊','6 塊'],()=>division(24,'pack'),'每袋裝一樣多，請自行圈出分組。');

  function render(problem) {
    if (supports && !supports.isReviewed(problem)) return '';
    const entry=entries[problem?.id];
    if (!entry || !entry.required.every(part=>problem.question.includes(part))) return supports?.render(problem) || '';
    return `<figure class="ws-diagram" data-ws-figure="${escape(problem.id)}">${entry.draw(problem.id)}<figcaption>${escape(entry.caption)}</figcaption></figure>`;
  }
  return { render, circleGeometry, rulerGeometry, sectorPath, capacityGeometry, audit: problems => supports.audit(problems) };
})();
if (typeof window !== 'undefined') window.WorksheetDiagrams = WorksheetDiagrams;
if (typeof module !== 'undefined' && module.exports) module.exports = WorksheetDiagrams;
