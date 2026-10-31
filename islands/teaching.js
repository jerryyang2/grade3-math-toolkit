/* 島嶼解題沿用課堂資料的步驟順序；題目數字由同一份運算過程產生。 */
(function(root){
'use strict';
const data=typeof module!=='undefined'?require('../js/data.js'):NANI_G3S1_DATA;
const tools=typeof module!=='undefined'?require('../js/hands-on-tools.js'):root.HandsOnTools;
const curriculum=typeof module!=='undefined'?require('./curriculum.js'):root.MathIslands;
const routes={u1:'先數個位 → 再數十位、百位、千位 → 留好零的位置 → 合起來讀數',u2:'千百十個對齊 → 從個位開始 → 記錄進位或退位 → 用反向運算檢查',u3:'拆成十位和個位 → 先算個位部分 → 再算十位部分 → 合起來',u4:'零刻度對齊 → 讀整公分 → 數毫米小格 → 換成毫米',u5:'找頂點與邊 → 用三角板直角比對 → 檢查邊長與角',u6:'商：先猜每份 → 乘：算分掉多少 → 減：找餘數 → 比：餘數小於除數',u7:'記住一公升是一千毫升 → 整公升先換算 → 加上零頭毫升',u8:'先看分母：平分幾份 → 再看分子：取了幾份 → 由下往上讀',u9:'固定圓心 → 量出半徑 → 畫圓 → 兩條半徑接成直徑'};
const residents=[
 {id:'captain',unitId:'u1',name:'海獺船長',role:'金幣港的船長',icon:'⚓',line:'歡迎靠岸！零也有自己的位置，別把它留在海上喔！'},
 {id:'shopkeeper',unitId:'u2',name:'小熊店長',role:'補給市集老闆',icon:'🛒',line:'千百十個先排整齊，找零時就不容易算錯了！'},
 {id:'baker',unitId:'u3',name:'兔兔烘焙師',role:'烘焙屋老闆',icon:'🥐',line:'每盤一樣多，拆成十和一，麵包數量慢慢算！'},
 {id:'engineer',unitId:'u4',name:'長頸鹿工程師',role:'造橋工程師',icon:'📏',line:'量橋板要從零刻度開始，每個小格是一毫米！'},
 {id:'builder',unitId:'u5',name:'恐龍建築師',role:'幾何城的工匠',icon:'🏰',line:'圖形轉個方向也沒變，記得檢查邊長和直角！'},
 {id:'picnic',unitId:'u6',name:'松鼠分餐員',role:'野餐林居民',icon:'🧺',line:'輪流分點心，讓每個籃子都一樣多！'},
 {id:'mixologist',unitId:'u7',name:'海豚調飲師',role:'果汁店老闆',icon:'🧃',line:'一公升就是一千毫升，大杯倒好，再加小杯！'},
 {id:'pizza',unitId:'u8',name:'狐狸披薩店老闆',role:'披薩店老闆',icon:'🍕',line:'披薩要公平切，每份一樣大，分數才有意義！'},
 {id:'wheel',unitId:'u9',name:'貓頭鷹技師',role:'摩天輪技師',icon:'🎡',line:'固定圓心，半徑不變；兩條半徑就能接成直徑！'}
];
function method(id){const source=data.units.find(u=>u.id===id);if(!source)throw new RangeError('未知單元');return {route:routes[id],sourceTitle:source.title,sourceSteps:source.scaffoldingSteps.map(s=>s.title),concrete:source.cra.concrete,representational:source.cra.representational};}
const step=(title,text,formula='')=>({title,text,formula});
function steps(t){
 switch(t.kind){
 case 'coins':{const vals=[1,10,100,1000],names=['個','十','百','千'];return [...vals.map((v,i)=>{const n=Math.floor(t.target/v)%(v===1000?100:10);return step(`先看${names[i]}位`,`${names[i]}位需要 ${n} 個 ${v} 元。${n===0?'這一位沒有錢幣，留下零的位置。':'把對應的錢幣放進來，再看下一位。'}`,`${n} × ${v} ＝ ${n*v}`);}),step('合起來讀一讀',`把各位的金額加起來，合計 ${t.target} 元。`,`${Math.floor(t.target/1000)*1000} ＋ ${Math.floor(t.target/100)%10*100} ＋ ${Math.floor(t.target/10)%10*10} ＋ ${t.target%10} ＝ ${t.target}`)];}
 case 'calculate':{const op=t.op==='+'?'+':'-',trace=tools.verticalTrace(t.a,t.b,op);return [step('千百十個先對齊','上排和下排的同一個位值要排在同一欄，從最右邊的個位開始。'),...trace.slice(1).map(s=>{const name=['千','百','十','個'][s.index];const exchange=s.trades.map(tr=>`把 1 個 ${tr.from} 換成 10 個 ${tr.to}。`).join('');return step(`算${name}位`,op==='+'?`${s.left} 加 ${s.right}，還要加上進位的 ${s.incoming}。這一位寫 ${s.written}。${s.outgoing?'滿十，向左進一。':'這一位不用再進位。'}`:`${exchange}${s.left} 減 ${s.right}，這一位寫 ${s.written}。`,op==='+'?`${s.left} ＋ ${s.right} ＋ ${s.incoming} ＝ ${s.combined}`:`${s.left} − ${s.right} ＝ ${s.written}`);}),step('檢查答案','把各位合起來，再用反向運算檢查。',op==='+'?`${t.target} − ${t.b} ＝ ${t.a}`:`${t.target} ＋ ${t.b} ＝ ${t.a}`)];}
 case 'array':{const ten=Math.floor(t.per/10)*10,one=t.per%10;return [step('拆成十位和個位',`每盤 ${t.per} 個，拆成 ${ten} 和 ${one}。`,`${t.per} ＝ ${ten} ＋ ${one}`),step('先算個位部分',`每盤的 ${one} 個，總共有 ${t.groups} 盤。`,`${one} × ${t.groups} ＝ ${one*t.groups}`),step('再算十位部分',`每盤的 ${ten} 個，總共有 ${t.groups} 盤。`,`${ten} × ${t.groups} ＝ ${ten*t.groups}`),step('兩部分合起來','把個位部分和十位部分合起來。',`${ten*t.groups} ＋ ${one*t.groups} ＝ ${t.target}`)];}
 case 'ruler':return [step('零刻度對齊','先找尺上的零，確認橋板左端對齊零刻度，不是對齊尺的最邊緣。'),step('先讀整公分',`橋板右端超過 ${Math.floor(t.target/10)} 公分的粗線。`),step('再數毫米小格',`從整公分的粗線往右數，還有 ${t.target%10} 個小格，每格是一毫米。`),step('寫出換算','一公分是十毫米，整公分換好後，再加小格。',`${Math.floor(t.target/10)} × 10 ＋ ${t.target%10} ＝ ${t.target} 毫米`)];
 case 'shape':return t.mission===0?[step('找頂點與兩條邊','角有一個頂點，和從頂點伸出的兩條邊。'),step('用三角板的直角比一比','把三角板的直角當成標準，頂點對齊、一條邊貼齊。'),step('比開口大小','開口一樣大的是直角；小於直角是銳角，大於直角是鈍角。')]:[step('先檢查四個角','用三角板的直角，比一比圖形的四個角。'),step('再檢查邊長',t.mission===1?'四條邊都要一樣長，都是四公分。':'兩組對邊分別等長，長邊六公分、短邊三公分。'),step('旋轉也不改變圖形','轉個方向，邊長和角的性質都不會改變。')];
 case 'divide':return [step('商：先猜每份',`想 ${t.groups} 的乘法，最接近 ${t.total}，但不能超過。每籃可分 ${t.target} 個。`),step('乘：算分掉多少',`每籃 ${t.target} 個，一共有 ${t.groups} 籃。`,`${t.groups} × ${t.target} ＝ ${t.groups*t.target}`),step('減：找出餘數','全部點心減掉分出去的，就是剩下的。',`${t.total} − ${t.groups*t.target} ＝ ${t.remainder}`),step('比：餘數比籃子數少',`剩下 ${t.remainder} 個，比 ${t.groups} 個籃子少，不能再分一輪。`,`${t.remainder} ＜ ${t.groups}`),step('用乘加驗算','分出去的加上剩下的，要等於原來的總數。',`${t.groups} × ${t.target} ＋ ${t.remainder} ＝ ${t.total}`)];
 case 'pour':return [step('記住換算密碼','一公升等於一千毫升。'),step('整公升先換好',`${Math.floor(t.target/1000)} 公升，先換成 ${Math.floor(t.target/1000)*1000} 毫升。`,`${Math.floor(t.target/1000)} × 1000 ＝ ${Math.floor(t.target/1000)*1000}`),step('加上零頭毫升',`再加 ${t.target%1000} 毫升，沿量杯刻度確認水位。`,`${Math.floor(t.target/1000)*1000} ＋ ${t.target%1000} ＝ ${t.target} 毫升`)];
 case 'fraction':return [step('先看分母','先確認每份一樣大，再看全部平分成幾份。',`分母：${t.d}`),step('再看分子',`把題目要留下或合起來的部分點出來，一共 ${t.target} 份。`,`分子：${t.target}`),step('由下往上讀','先念分母，再念分之，最後念分子。',`${t.target}/${t.d}`)];
 case 'compass':return [step('固定圓心','圓規的針腳固定在圓心，轉動時位置不變。'),step('量出半徑',`從圓心到圓周是半徑，圓規兩腳的距離調成 ${t.target} 公分。`),step('固定半徑畫圓','圓規張開的距離保持不變，讓筆腳沿著圓周轉一圈。'),step('兩條半徑接成直徑','直徑通過圓心，兩條半徑接在一起，所以是半徑的兩倍。',`${t.target} × 2 ＝ ${t.target*2} 公分`)];
 default:return [];
 }
}
const narration={retry:'再看看，還差一小步。可以調整後再檢查，也可以打開提示。',correct:'靠岸成功！這一步，你做到了！',islandAward:'恭喜完成這座島的三個任務，可以領取小證書！',grandAward:'九座島，二十七個任務，全部完成！大證書和環遊世界號都為你準備好了！',cruiseWelcome:'歡迎登上環遊世界號！帶著你的數學超能力，一起航向更大的世界！'};
const api={method,steps,residents,narration};if(typeof module!=='undefined')module.exports=api;else root.MathIslandTeaching=api;
})(typeof window!=='undefined'?window:globalThis);
