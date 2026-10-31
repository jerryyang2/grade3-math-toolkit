/* 學習單原創圖像支援：圖形呈現已知條件，待求數量留白。 */
const WorksheetVisualSupports = (() => {
  'use strict';
  const specs = typeof module !== 'undefined' && module.exports ? require('./worksheet-visual-data.js') : window.WorksheetVisualData;
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const n = value => Math.round(value * 1000) / 1000;
  const text = (x,y,value,size=16,extra='') => `<text x="${n(x)}" y="${n(y)}" font-family="sans-serif" font-size="${size}" fill="#111" stroke="none" ${extra}>${esc(value)}</text>`;
  const center = (x,y,value,size=16) => text(x,y,value,size,'text-anchor="middle"');
  const rect = (x,y,w,h,fill='#fff',extra='') => `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" fill="${fill}" ${extra}/>`;
  const line = (x1,y1,x2,y2,extra='') => `<path d="M${n(x1)} ${n(y1)}L${n(x2)} ${n(y2)}" ${extra}/>`;
  const circle = (x,y,r=4,fill='#fff') => `<circle cx="${n(x)}" cy="${n(y)}" r="${r}" fill="${fill}"/>`;
  const arrow = (x1,y1,x2,y2) => {
    const a=Math.atan2(y2-y1,x2-x1),back=9;
    return line(x1,y1,x2,y2)+line(x2,y2,x2-back*Math.cos(a-.5),y2-back*Math.sin(a-.5))+line(x2,y2,x2-back*Math.cos(a+.5),y2-back*Math.sin(a+.5));
  };
  const svg = (body,height=130,description='依題目已知條件繪製的示意圖，問號留待學生思考') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 ${height}" role="img" aria-label="${esc(description)}"><g fill="none" stroke="#111" stroke-width="1.6" stroke-linejoin="round">${body}</g></svg>`;
  function fingerprint(problem) {
    const value=JSON.stringify([problem.question,problem.options]);let hash=2166136261;
    for(let i=0;i<value.length;i++) hash=Math.imul(hash^value.charCodeAt(i),16777619);
    return (hash>>>0).toString(16).padStart(8,'0');
  }
  const isReviewed = problem => !!specs?.[problem?.id] && specs[problem.id].signature === fingerprint(problem);
  function numberLineGeometry(min,max,step) {
    if(![min,max,step].every(Number.isFinite)||max<=min||step<=0||Math.abs((max-min)/step-Math.round((max-min)/step))>1e-8||(max-min)/step>30) throw new RangeError('Invalid number line');
    const at=value=>24+(value-min)*252/(max-min);
    return {at,ticks:Array.from({length:Math.round((max-min)/step)+1},(_,i)=>({value:min+i*step,x:at(min+i*step)}))};
  }
  function numberLine(s) {
    const g=numberLineGeometry(s.min,s.max,s.step);let body=arrow(14,78,289,78);
    for(const tick of g.ticks) {
      body+=line(tick.x,72,tick.x,85);
      const shown=s.labels?.[tick.value];
      if(shown!==undefined) body+=center(tick.x,108,shown,15);
    }
    if(s.note)body+=center(150,22,s.note,15);
    if(s.start!==undefined) body+=circle(g.at(s.start),78,4,'#111');
    if(s.jumps) {
      for(let i=0;i<Math.abs(s.jumps);i++) {
        const from=g.at(s.start+i*Math.sign(s.jumps)*s.step),to=g.at(s.start+(i+1)*Math.sign(s.jumps)*s.step);
        body+=`<path d="M${n(from)} 67Q${n((from+to)/2)} 34 ${n(to)} 67" stroke-dasharray="4 2"/>`;
      }
      body+=center(g.at(s.start+s.jumps*s.step),108,'？',17);
    }
    if(s.strips) {
      body+=rect(g.at(0),36,g.at(80)-g.at(0),16,'#eee')+rect(g.at(80),36,g.at(110)-g.at(80),16,'#fff','stroke-dasharray="4 2"');
      body+=center((g.at(0)+g.at(80))/2,30,'80 公分',14)+center((g.at(80)+g.at(110))/2,30,'30',14)+center(g.at(110),108,'？',17);
    }
    return svg(body,126,'等距數線；已知數字標在刻度旁，待求刻度以問號或空白表示');
  }
  function cards(values,labels=[]) {
    const columns=Math.min(4,values.length),width=268/columns;let body='';
    values.forEach((value,i)=>{
      const x=16+i%columns*width,y=15+Math.floor(i/columns)*64;
      body+=rect(x,y,width-8,46)+center(x+(width-8)/2,y+29,value,values.length>3?17:19);
      if(labels[i])body+=center(x+(width-8)/2,y+62,labels[i],14);
    });
    return svg(body,Math.ceil(values.length/columns)*64+26);
  }
  function places(s) {
    let body=center(150,23,s.value||'把數字放進位值表',20);
    for(let i=0;i<4;i++)body+=rect(14+i*68,58,68,45)+center(48+i*68,48,['千位','百位','十位','個位'][i],15)+center(48+i*68,88,s.digits?.[i]??'？',20);
    return svg(body,121);
  }
  function money(s) {
    const count=s.items.length,width=268/count;let body='';
    s.items.forEach(([value,quantity],i)=>{
      const x=16+i*width,cx=x+(width-8)/2;
      if(value>=100)body+=rect(x,28,width-8,36,'#eee','rx="4"')+center(cx,53,value,16);
      else body+=circle(cx,47,21)+center(cx,53,value,17);
      body+=center(cx,94,quantity+(value>=100?' 張':' 枚'),17);
    });
    return svg(body,120,'鈔票與硬幣面額及題目給定的張數，尚未計算總額');
  }
  function exchange(s) {
    const a=s.from,b=s.to;
    let body=rect(15,29,102,52,'#eee','rx="4"')+center(66,51,a[0],17)+center(66,72,a[1],16);
    body+=arrow(128,55,168,55)+rect(181,29,102,52,'#fff','rx="4"')+center(232,51,b[0],17)+center(232,72,b[1],16);
    if(s.note)body+=center(150,113,s.note,14);
    return svg(body,132);
  }
  function barModel(s) {
    const segments=s.parts||['？','？'];const w=264/segments.length;
    let body=line(18,23,282,23)+line(18,18,18,28)+line(282,18,282,28)+center(150,16,s.total||'全部：？',16);
    segments.forEach((value,i)=>{body+=rect(18+i*w,45,w,34,i%2?'#fff':'#eee')+center(18+(i+.5)*w,68,value,segments.length>2?13:15);});
    if(s.note)body+=center(150,109,s.note,14);
    return svg(body,126,'部分與全部關係示意，方框不依實際數量比例繪製，未知數量留白');
  }
  function compareBars(s) {
    let body='';const max=Math.max(...s.rows.map(row=>row[1]||1));
    s.rows.forEach(([title,value],i)=>{
      const y=26+i*42;body+=text(16,y,title,15);
      body+=rect(16,y+6,value?268*value/max:220,15,i%2?'#fff':'#eee',i%2?'stroke-dasharray="4 2"':'');
    });
    return svg(body,s.rows.length*42+17,'各圖形使用同一比例，請依題目條件比較');
  }
  function grouping(s) {
    const columns=Math.min(s.count,4),rows=Math.ceil(s.count/columns),w=268/columns;let body='';
    for(let i=0;i<s.count;i++) {
      const x=16+i%columns*w,y=12+Math.floor(i/columns)*55;
      body+=rect(x,y,w-7,44,'#fff','rx="5"')+center(x+(w-7)/2,y+18,'每份',13)+center(x+(w-7)/2,y+36,s.each,15);
    }
    body+=center(150,rows*55+26,s.note||'全部合起來：？',16);
    return svg(body,rows*55+42,'相同的每份數量，總量尚未計算');
  }
  function unitTable(s) {
    let body='';const width=268/s.headings.length;
    s.headings.forEach((heading,i)=>{body+=center(16+(i+.5)*width,23,heading,16);});
    s.rows.forEach((row,j)=>row.forEach((v,i)=>{body+=rect(16+i*width,34+j*34,width,34)+center(16+(i+.5)*width,57+j*34,v,17);}));
    if(s.note)body+=center(150,48+s.rows.length*34,s.note,14);
    return svg(body,66+s.rows.length*34,'單位與位值分欄，題目給定條件已填入，未知換算或計算結果留白');
  }
  function angle(s) {
    const arm=(x,y,a,r=62)=>line(x,y,x+r,y)+line(x,y,x+r*Math.cos(a*Math.PI/180),y-r*Math.sin(a*Math.PI/180));
    let body='';
    if(s.clock) {
      body+=circle(81,67,49);
      for(let hour=1;hour<=12;hour++) {
        const a=(hour*30-90)*Math.PI/180;body+=center(81+39*Math.cos(a),72+39*Math.sin(a),hour,11);
      }
      const a=(s.clock*30-90)*Math.PI/180;
      body+=line(81,67,81,29,'stroke-width="3"')+line(81,67,81+27*Math.cos(a),67+27*Math.sin(a),'stroke-width="4"')+circle(81,67,3,'#111')+text(153,61,s.clock+' 點整',19);
    } else if(s.fold) {
      body+=rect(25,20,96,96)+line(73,20,73,116,'stroke-dasharray="4 3"')+line(25,68,121,68,'stroke-dasharray="4 3"')+circle(73,68,4,'#111')+text(155,56,'展開後的摺痕',16);
    } else if(s.triangle) {
      body+='<path d="M25 110V22L113 110Z"/>'+circle(25,110,4,'#111')+circle(25,22,4,'#111')+circle(113,110,4,'#111');
      body+=text(146,60,'觀察三個開口',16);
    } else {
      const values=s.angles||[s.degrees];
      values.forEach((a,i)=>{
        const x=values.length>1?22+i*95:105;body+=arm(x,100,a,64)+center(x+31,124,values.length>1?String.fromCharCode(65+i):'看這個開口',values.length>1?15:14);
        if(s.reference)body+=line(x,100,x,36,'stroke-dasharray="4 3"');
      });
    }
    return svg(body,140,'依題目條件畫出的角或鐘面，未標示角的名稱');
  }
  function quadrilateral(s) {
    let body='';const square=(x,y,w,h)=>rect(x,y,w,h)+[0,1,2,3].map(i=>circle(x+(i===1||i===2?w:0),y+(i>1?h:0),3,'#111')).join('');
    if(s.both)body=square(22,30,78,78)+square(166,43,110,52)+center(61,131,'甲',16)+center(221,131,'乙',16);
    else {
      const w=s.rectangle?150:90,h=s.ratio?150*s.ratio[1]/s.ratio[0]:90,x=s.rectangle?50:65;
      body=square(x,24,w,h);
      if(s.top)body+=center(x+w/2,16,s.top,16);
      if(s.right)body+=text(x+w+8,74,s.right,15);
      if(s.unknown)body+=center(x+w/2,137,'其他邊：？',15);
      if(s.note)body+=center(150,143,s.note,14);
    }
    return svg(body,157,'依題目條件繪製的四邊形，黑點標出頂點，未填寫待求邊長或圖形名稱');
  }
  function tokens(s) {
    const cols=Math.min(12,s.total||1),r=4,spacing=22;let body='';
    for(let i=0;i<s.total;i++)body+=circle(20+i%cols*spacing,14+Math.floor(i/cols)*14,r);
    const base=24+Math.ceil((s.total||1)/cols)*14;
    if(s.groups)for(let i=0;i<s.groups;i++)body+=rect(16+i*268/s.groups,base,268/s.groups-5,30,'#fff','rx="4"');
    if(s.note)body+=center(150,base+(s.groups?52:20),s.note,14);
    return svg(body,base+(s.groups?65:34),'物品尚未分配，空框或題目條件供學生自行分組');
  }
  function ribbonDivision(s) {
    const sample=264*s.each/s.total;
    return svg(center(150,20,'整條'+s.total+'公分',17)+rect(18,30,264,23,'#eee')+rect(18,80,sample,23)+text(18+sample+12,98,'每段'+s.each+'公分',17)+center(150,133,'能分成幾段？',16),150);
  }
  function remainder(s) {
    let body='';const columns=s.groups===4?2:s.groups;
    for(let i=0;i<s.groups;i++){
      const x=18+i%columns*86,y=14+Math.floor(i/columns)*41;
      body+=rect(x,y,74,32,'#fff','rx="4"');
      for(let j=0;j<s.each;j++)body+=circle(x+17+j*18,y+16,5);
    }
    for(let i=0;i<s.left;i++)body+=circle(244,28+i*20,5);
    body+=text(219,104,'剩下',16)+center(150,134,s.note,15);
    return svg(body,152,'物品已依題目或範例平分到框內，框外物品是尚未分完的部分');
  }
  function longDivision(s) {
    if(s.positions)return svg(center(164,18,'十位',14)+center(194,18,'個位',14)+rect(150,27,58,23)+line(179,27,179,50)+line(137,56,243,56)+line(137,56,137,100)+center(111,85,s.divisor,24)+center(164,85,String(s.dividend)[0],24)+center(194,85,String(s.dividend)[1],24)+center(150,126,'商應寫在哪一格？',16),144);
    let body=center(190,24,'商：？',17)+line(100,37,254,37)+line(100,37,100,111);
    body+=center(72,67,s.divisor,24)+center(178,67,s.dividend,24);
    body+=center(152,91,'計算區留空',14)+center(185,122,'餘數：？',16);
    return svg(body,140,'直式除法的已知被除數與除數，商與餘數留空');
  }
  function fractionBars(s,id) {
    let body=`<defs><pattern id="h-${esc(id)}" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M0 6L6 0" stroke="#333" stroke-width="1"/></pattern></defs>`;
    const rows=s.rows;rows.forEach((row,i)=>{
      const y=25+i*46,w=264/row.denominator;
      body+=text(18,y-6,row.label||'同一個整體',14);
      for(let j=0;j<row.denominator;j++)body+=rect(18+j*w,y,w,23,j<row.selected?`url(#h-${esc(id)})`:j<row.selected+(row.other||0)?'#aaa':'#fff');
    });
    return svg(body,rows.length*46+17,'每一列代表相同大小的一個整體，等分與標記依題目給定條件繪製');
  }
  function capacityScale(maximum,value,divisions=10) {
    if(!(maximum>0)||value<0||value>maximum||!Number.isInteger(divisions)||divisions<1)throw new RangeError('Invalid capacity scale');
    const at=amount=>128-amount/maximum*96;
    return {at,water:at(value),ticks:Array.from({length:divisions+1},(_,i)=>({value:maximum*i/divisions,y:at(maximum*i/divisions)}))};
  }
  function capacityMeasures(s,id) {
    const count=s.items.length,slot=284/count,max=Math.max(...s.items.map(i=>i.value));
    const maximum=Math.max(1000,Math.ceil(max/1000)*1000),divisions=maximum/1000*2;
    let body=`<defs><pattern id="water-${esc(id)}" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M0 6L6 0" stroke="#555" stroke-width=".8"/></pattern></defs>`;
    s.items.forEach((item,i)=>{
      const x=(count===1?100:8+i*slot+10),w=count===3?43:count===2?52:80,g=capacityScale(maximum,item.value,divisions);
      // 直壁量杯：相同容量刻度具有相同高度差，避免用杯子的外形高度猜容量。
      body+=`<path d="M${x} 28h${w}l7-7v111H${x}Z" fill="#fff"/><path d="M${x+w+7} 48q20-8 20 19t-20 19"/>`;
      body+=rect(x+1,g.water,w+5,128-g.water,`url(#water-${esc(id)})`)+line(x,g.water,x+w+6,g.water,'stroke-width="2"');
      for(const tick of g.ticks){const major=tick.value%1000===0;body+=line(x,tick.y,x+(major?17:9),tick.y);if(major)body+=text(x+20,tick.y+4,tick.value,12);}
      body+=center(x+w/2,17,'mL',12)+center(8+(i+.5)*slot,153,item.label,count===3?11:13);
      if(s.operation&&i<count-1)body+=center(8+(i+1)*slot-4,78,s.operation,19);
    });
    // 小於100 mL的餘量放在旁邊的小量杯；主量杯仍保留完整零起點。
    const residual=s.items.map(i=>i.value%1000),needInset=residual.some(v=>v>0&&v<100);
    if(needInset){
      const largest=Math.max(...residual),limit=largest<=10?10:largest<=100?100:largest<=200?200:1000;
      s.items.forEach((item,i)=>{
        const v=residual[i],x=(count===1?222:8+i*slot+94),w=count===1?34:26,at=v=>118-v/limit*58;
        body+=rect(x,60,w,58)+rect(x+1,at(v),w-2,118-at(v),`url(#water-${esc(id)})`);
        for(let j=0;j<=10;j++){const y=at(j*limit/10);body+=line(x,y,x+(j%5?4:9),y);if(j%5===0)body+=text(x+3,y+11,j*limit/10,8);}
        body+=center(x+w/2,40,'餘量',11)+center(x+w/2,53,'mL',10);
      });
    }
    const h=178;body+=center(150,h-6,needInset?'小量杯放大不足 1 L 的部分':'依刻度與標示思考，結果：？',12);
    return svg(body,h,'有刻度的直壁量杯，mL 刻度從零等距增加；比較時使用相同刻度，水位表示題目已知的量').replace('<svg ','<svg data-capacity-measures="true" ');
  }
  function baseTen(s){
    const slot=268/s.items.length;let body='';
    s.items.forEach(([value,quantity],i)=>{
      const x=16+i*slot;
      if(value>=1000)body+=`<path d="M${x+10} 40l20-12 30 12v32l-20 12-30-12Z M${x+10} 40l30 12 20-12 M${x+40} 52v32" fill="#eee"/>`;
      else if(value===100){body+=rect(x+12,32,48,48,'#eee');for(let j=1;j<5;j++)body+=line(x+12+j*9.6,32,x+12+j*9.6,80)+line(x+12,32+j*9.6,x+60,32+j*9.6);}
      else if(value===10){body+=rect(x+30,28,12,55,'#eee');for(let j=1;j<10;j++)body+=line(x+30,28+j*5.5,x+42,28+j*5.5);}
      else body+=rect(x+28,48,16,16,'#eee');
      body+=center(x+36,20,value,15)+center(x+36,111,quantity+' 個',16);
    });return svg(body,132,'十進位積木的位值與題目給定的份數，並非錢幣或紙鈔');
  }
  function sequence(s){
    let body='';s.values.forEach((value,i)=>{const y=12+i*45;body+=rect(18,y,264,30)+center(150,y+21,value,16);if(i<2)body+=arrow(150,y+32,150,y+42);});
    body+=center(150,167,'現在：？元',17);return svg(body,180,'依時間先後花錢再得到錢，兩個步驟的結果留白');
  }
  function fractionCircle(s){
    const row=s.rows[0],r=48,cx=80,cy=64;let body=circle(cx,cy,r);
    for(let j=0;j<row.denominator;j++){const a=j*2*Math.PI/row.denominator;body+=line(cx,cy,cx+r*Math.cos(a),cy+r*Math.sin(a));}
    body+=text(145,60,'同一個完整蛋糕',15)+text(145,86,'每一份一樣大',14);return svg(body,132,'同一個完整的圓形蛋糕，平分成四個相等扇形，待求分數留白');
  }
  const drawers={capacityMeasures,baseTen,sequence,fractionCircle,numberLine,cards:s=>cards(s.values,s.labels),places,money,exchange,barModel,compareBars,grouping,unitTable,angle,quadrilateral,tokens,ribbonDivision,remainder,longDivision,fractionBars};
  function render(problem) {
    if(!isReviewed(problem))return '';
    const entry=specs[problem.id],draw=drawers[entry.kind];
    if(!draw)return '';
    const caption=entry.kind==='barModel'?'部分與全部關係示意，方框不按數量比例繪製。':'依圖中的已知條件思考，問號與空白處由你完成。';
    return `<figure class="ws-diagram" data-ws-figure="${esc(problem.id)}">${draw(entry,problem.id)}<figcaption>${esc(entry.caption||caption)}</figcaption></figure>`;
  }
  function audit(problems) {
    return problems.map(problem=>({id:problem.id,sectionId:problem.sectionId,reviewed:isReviewed(problem),kind:specs?.[problem.id]?.kind||'unreviewed',reason:specs?.[problem.id]?.reason||'尚未檢核'}));
  }
  return {render,audit,isReviewed,fingerprint,numberLineGeometry,capacityScale};
})();
if(typeof window!=='undefined')window.WorksheetVisualSupports=WorksheetVisualSupports;
if(typeof module!=='undefined'&&module.exports)module.exports=WorksheetVisualSupports;
