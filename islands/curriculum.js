/* 原創單元任務；與既有南一三上單元對應。可在瀏覽器與 Node 共用。 */
(function(root){
  'use strict';
  const islands = [
    {id:'u1',name:'位值金幣港',icon:'🪙',color:'#d18a22',land:'#a8c978',buddy:'海獺港長',unit:'數到 10000',goal:'用千、百、十、個組成數，理解零的佔位與滿十進一。',missions:['金幣入庫','零的守門員','點亮萬位燈塔'],tip:'從千位到個位，一格一格確認；沒有的位值也要留下 0。',say:'哪一格沒有人？零為什麼不能省略？'},
    {id:'u2',name:'加減補給市集',icon:'🛒',color:'#bc7058',land:'#d1bf87',buddy:'小熊店長',unit:'四位數的加減',goal:'對齊位值，完成四位數加減，檢查進位與跨零退位。',missions:['補給合計','找零任務','跨零大挑戰'],tip:'千百十個先對齊，從個位開始。加法滿十進一，減法不足向左借。',say:'你在哪一位進位或退位？用反向運算檢查一次。'},
    {id:'u3',name:'乘法烘焙山',icon:'🥐',color:'#bf6a83',land:'#cdb2ab',buddy:'兔兔烘焙師',unit:'乘法',goal:'把多位數乘法拆成十位和個位，連結等量分組與乘積。',missions:['排好烤盤','十位與個位','烘焙大訂單'],tip:'一盤拆成幾個十和幾個一，再看有幾盤；各部分乘完後合起來。',say:'每盤一樣多嗎？「每盤幾個 × 幾盤」代表什麼？'},
    {id:'u4',name:'毫米造橋灣',icon:'📏',color:'#408f99',land:'#a2cbb0',buddy:'長頸鹿工程師',unit:'幾毫米',goal:'從零刻度量長度，連結公分和毫米，知道 1 公分是 10 毫米。',missions:['橋板量一量','公分換毫米','修好小棧橋'],tip:'物體左端對齊 0。大格是公分，每一小格是 1 毫米；10 小格是 1 公分。',say:'為什麼要從 0 開始？這段有幾個整公分，再多幾毫米？'},
    {id:'u5',name:'幾何工匠城',icon:'🏰',color:'#8470ae',land:'#bcc3db',buddy:'恐龍建築師',unit:'角、正方形和長方形',goal:'比對直角，依邊長和角的特徵辨識正方形與長方形。',missions:['直角守衛','尋找正方形','長方形城門'],tip:'旋轉不會改變圖形。正方形四邊一樣長；長方形有四個直角，兩組對邊分別等長。',say:'不要只看擺放方向。你用哪些邊與角的條件判斷？'},
    {id:'u6',name:'除法野餐林',icon:'🧺',color:'#70934b',land:'#96bc88',buddy:'松鼠分餐員',unit:'除法',goal:'一個一個公平分，理解商、餘數，以及餘數小於除數。',missions:['大家一樣多','剩下的點心','野餐再分裝'],tip:'每個籃子都要一樣多。剩下的比籃子數少，才是真的分完了。',say:'還能再給每個籃子一個嗎？剩下幾個，為什麼不能再平分？'},
    {id:'u7',name:'容量調飲所',icon:'🧃',color:'#4d8fa9',land:'#a1c7cd',buddy:'海豚調飲師',unit:'公升和毫升',goal:'以量杯調出指定容量，連結 1 公升等於 1000 毫升。',missions:['第一杯果汁','公升換毫升','派對特調'],tip:'先倒整公升，再加毫升。1 公升是 1000 毫升；沿量杯刻度讀容量。',say:'這一杯有幾個 1000 毫升？還需要多少毫升？'},
    {id:'u8',name:'分數披薩島',icon:'🍕',color:'#c87b4d',land:'#dfbe86',buddy:'狐狸主廚',unit:'分數',goal:'在等分的一個整體中表示分數，理解分母與分子。',missions:['公平切披薩','留下幾份','同分母拼盤'],tip:'整個披薩先等分。分母是一共分幾份，分子是選了其中幾份。',say:'每份一樣大嗎？你選的是幾分之幾？未選的又是多少？'},
    {id:'u9',name:'圓形摩天輪',icon:'🎡',color:'#4c9b89',land:'#a4cbb0',buddy:'貓頭鷹技師',unit:'圓',goal:'找圓心、半徑和直徑，以固定半徑畫圓，理解直徑是半徑的兩倍。',missions:['圓規出發','直徑的祕密','摩天輪施工'],tip:'圓規針尖固定在圓心。半徑是圓心到圓周；直徑通過圓心，是兩條半徑。',say:'如果半徑加倍，圓會怎麼變？哪一段是直徑？'}
  ];
  function task(id,mission=0,random=null){
    if(!islands.some(i=>i.id===id)||![0,1,2].includes(mission))throw new RangeError('未知單元或任務');
    const pick=(lo,hi)=>random?lo+Math.floor(Math.max(0,Math.min(.999999,random()))*(hi-lo+1)):null;
    let t={id,mission};
    switch(id){
      case 'u1':{const n=random?(mission===2?pick(6,10)*1000:mission===1?(pick(1,8)*1000+pick(1,9)*10):pick(1001,8999)):[2346,3050,10000][mission];t={...t,kind:'coins',target:n,prompt:`幫港長存入 ${n.toLocaleString()} 元。用下方的錢幣組出剛好的金額。`,hint:`${Math.floor(n/1000)} 個千、${Math.floor(n/100)%10} 個百、${Math.floor(n/10)%10} 個十、${n%10} 個一。`};break;}
      case 'u2':{const a=random?pick(1200,3999):[1485,3000,4000][mission],b=random?pick(101,1199):[2378,1465,2086][mission],op=mission===0?'+':'−';t={...t,kind:'calculate',a,b,op,target:op==='+'?a+b:a-b,prompt:mission===0?`帳篷 ${a} 元，補給箱 ${b} 元。一共要付多少元？`:`拿 ${a} 元買 ${b} 元的補給，應該找回多少元？`,hint:op==='+'?'用位值對齊。個位開始相加，滿十就向左進一。':'個位不夠減時，向左找能借的位；經過的 0 需要逐位退位。'};break;}
      case 'u3':{const per=random?pick(12,mission===2?78:29):[12,24,36][mission],groups=random?pick(2,5):[3,3,4][mission];t={...t,kind:'array',per,groups,target:per*groups,prompt:`每盤 ${per} 個麵包，要準備 ${groups} 盤。先排好烤盤，再算一共幾個。`,hint:`每盤拆成 ${Math.floor(per/10)*10} 和 ${per%10}。分別乘以 ${groups}，再合起來。`};break;}
      case 'u4':{const mm=random?pick(12,78):[28,43,65][mission];t={...t,kind:'ruler',target:mm,prompt:mission===1?`橋板長 ${Math.floor(mm/10)} 公分 ${mm%10} 毫米。這是多少毫米？`:'橋板左端已對齊尺的 0。觀察右端，這塊橋板長幾毫米？',hint:`先數整公分，每公分 10 毫米，再加上不到一公分的小格。`};break;}
      case 'u5':{t={...t,kind:'shape',target:mission===0?'right':mission===1?'square':'rectangle',prompt:['找出直角，讓守衛通過城門。','找出四個角都是直角，四邊都是 4 公分的圖形。','城門要有四個直角，長邊 6 公分、短邊 3 公分。選出符合的圖形。'][mission],hint:['把三角板的直角想成一個 L，開口和它一樣大就是直角。','就算斜斜擺，四邊一樣長、四個直角，仍然是正方形。','先找四個直角，再看長邊與短邊是否符合；斜四邊形的角不一定是直角。'][mission],rotation:random?pick(0,3)*15:25,optionOffset:random?pick(0,2):0};break;}
      case 'u6':{const groups=random?pick(3,5):[3,4,5][mission],total=random?pick(12,39):[12,19,27][mission];t={...t,kind:'divide',groups,total,target:Math.floor(total/groups),remainder:total%groups,prompt:`把 ${total} 個點心盡量平分給 ${groups} 個籃子。點每個籃子的「＋」分點心。`,hint:'輪流給每個籃子一個，直到剩下的點心不夠再分一輪。'};break;}
      case 'u7':{const ml=random?pick(5,49)*50:[650,1250,2300][mission];t={...t,kind:'pour',target:ml,prompt:`幫調飲師裝好 ${Math.floor(ml/1000)} 公升 ${ml%1000} 毫升的果汁。點量杯加水，也可以倒回。`,hint:'1 公升＝1000 毫升。先用大杯，再用 100 和 50 毫升的小杯補足。'};break;}
      case 'u8':{const d=random?[4,6,8][pick(0,2)]:[4,6,8][mission],n=random?pick(1,d-1):[3,4,5][mission];t={...t,kind:'fraction',d,target:n,prompt:mission===0?`披薩平均切成 ${d} 份，請點選其中 ${n} 份，表示 ${n}/${d} 個披薩。`:mission===1?`一個披薩平均切 ${d} 份，送走 ${d-n} 份。請點出留下的部分。`:`同一個披薩分成 ${d} 等份，先取 2 份，再取 ${n-2} 份。請選出合起來的部分。`,hint:`每小片都是 1/${d}。分母保持 ${d}，只數有幾片。`};if(mission===2&&n<3){t.target=3;t.prompt=`同一個披薩分成 ${d} 等份，先取 2 份，再取 1 份。請選出合起來的部分。`;}break;}
      case 'u9':{const r=random?pick(2,6):[3,4,5][mission];t={...t,kind:'compass',target:r,prompt:mission===0?`固定圓心，調整圓規畫出半徑 ${r} 公分的圓。`:mission===1?`摩天輪直徑要 ${r*2} 公分。請調整圓規的半徑。`:`施工圖需要直徑 ${r*2} 公分的輪子。調好半徑，再確認直徑。`,hint:'從圓心到圓周是一條半徑。通過圓心的直徑＝半徑 × 2。'};break;}
    }
    return t;
  }
  function evaluate(t,s){
    switch(t.kind){
      case 'coins':return s.coins.reduce((sum,n,i)=>sum+n*[1000,100,10,1][i],0)===t.target;
      case 'calculate':return s.answer!==''&&Number(s.answer)===t.target;
      case 'array':return s.groups===t.groups&&s.answer!==''&&Number(s.answer)===t.target;
      case 'ruler':case 'pour':case 'compass':return s.value===t.target;
      case 'shape':return s.choice===t.target;
      case 'divide':return s.baskets.length===t.groups&&s.baskets.every(n=>n===t.target);
      case 'fraction':return s.slices.filter(Boolean).length===t.target;
      default:return false;
    }
  }
  function solution(t){
    switch(t.kind){
      case 'coins':return `${t.target.toLocaleString()} 元，${t.hint}`;
      case 'calculate':return `${t.a} ${t.op} ${t.b}＝${t.target} 元。${t.op==='+'?`可以用 ${t.target} − ${t.b}＝${t.a} 檢查。`:`可以用 ${t.target} ＋ ${t.b}＝${t.a} 檢查。`}`;
      case 'array':return `${t.per} × ${t.groups}＝${Math.floor(t.per/10)*10*t.groups} ＋ ${t.per%10*t.groups}＝${t.target} 個。`;
      case 'ruler':return `${Math.floor(t.target/10)} 公分 ${t.target%10} 毫米＝${t.target} 毫米。`;
      case 'shape':return ['直角的開口和三角板直角相同。','正方形有四個直角，而且四邊等長。','這個長方形有四個直角，兩組對邊分別為 6 公分和 3 公分。'][t.mission];
      case 'divide':return `${t.total} ÷ ${t.groups}＝${t.target}${t.remainder?` 餘 ${t.remainder}`:''}。${t.groups} × ${t.target} ＋ ${t.remainder}＝${t.total}；餘數 ${t.remainder} 小於 ${t.groups}。`;
      case 'pour':return `${Math.floor(t.target/1000)} 公升 ${t.target%1000} 毫升＝${t.target} 毫升。`;
      case 'fraction':return `選了 ${t.target} 份，是 ${t.target}/${t.d} 個披薩；未選的是 ${t.d-t.target}/${t.d}。`;
      case 'compass':return `半徑 ${t.target} 公分，直徑 ${t.target} × 2＝${t.target*2} 公分。`;
    }
  }
  function readProgress(raw){
    try{const data=JSON.parse(raw);const clean={};for(const i of islands){if(!data?.[i.id])continue;clean[i.id]={};for(let m=0;m<3;m++){const r=data[i.id][m];if(r&&Number.isInteger(r.attempts)&&r.attempts>=0&&r.attempts<=10000&&['independent','supported'].includes(r.result))clean[i.id][m]={attempts:r.attempts,result:r.result};}}return clean;}catch{return {};}
  }
  const api={islands,task,evaluate,solution,readProgress};
  if(typeof module!=='undefined')module.exports=api;else root.MathIslands=api;
})(typeof window!=='undefined'?window:globalThis);
