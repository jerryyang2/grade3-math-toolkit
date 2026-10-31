const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),acorn=require('acorn');
const A=require('../js/game-answer-validation.js');
const html=fs.readFileSync(require('node:path').join(__dirname,'../games/game4-math-park-board/index.html'),'utf8');
const functions=new Map();for(const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)){if(!match[1].trim())continue;const source=match[1],tree=acorn.parse(source,{ecmaVersion:'latest'});for(const node of tree.body)if(node.type==='FunctionDeclaration')functions.set(node.id.name,source.slice(node.start,node.end));}
test('numeric comparison preserves decimal places and minus signs instead of joining all digits',()=>{
 for(const [a,b,correct]of [['15','1.5',false],['-12','12',false],['1-2','12',false],['1.50','1.5',true],['０．５０','0.5',true],['1,000','1000',true],['1,00','100',false],['.5','0.5',true],['75','75%',false],['0.75','75%',true],['1/2','2/4',true],['12','1/2',false],['1/0','0',false],['6餘1','6 ⋯ 1',true],['61','6餘1',false],['14:05','下午2時05分',true],['2:05','下午2時05分',false]])assert.equal(A.equivalent(a,b),correct,`${a} vs ${b}`);
 assert.equal(A.equivalent('100毫米','10公分'),true);assert.equal(A.equivalent('10毫米','10公分'),false);assert.equal(A.equivalent('30元','30','一共需要多少元？'),true);assert.equal(A.equivalent('30公分','30','一共需要多少元？'),false);
});
test('formula check supports valid decomposition and clocks, rejects a wrong expression and never executes code',()=>{
 assert.equal(A.checkFormula('30×3+4×3=102','34*3','102'),true);assert.equal(A.checkFormula('1+1','34*3','102'),false);assert.equal(A.checkFormula('102','34*3','102'),false);
 assert.equal(A.checkFormula('34*3=120','34*3','102'),false);assert.equal(A.checkFormula('1:20+30','1:20+30','下午1時50分'),true);assert.equal(A.checkFormula('gcd(12,18)','gcd(12,18)','6'),true);
 for(const value of ['alert(1)','globalThis.process.exit()','1/0','1..5','1+','(1+2','1'.repeat(200)])assert.equal(A.expression(value),null);
});
test('legacy game generates recognized templates and explicitly declines unsupported topics',()=>{
 const generate=vm.runInNewContext('('+functions.get('generateElementaryMathQuestions')+')');
 for(const topic of ['三位數乘以一位數','四位數加減','二位數除以一位數','公因數','時間與時刻','小數加減','吃披薩同分母分數','10以內加法','長方形周長','二位數乘以二位數']){const result=generate(topic,5,'2',false);assert.equal(result.questions.length,5,topic);assert.ok(result.questions.every(q=>q.text&&q.correctAnswer&&q.options.includes(q.correctAnswer)),topic);}
 const unknown=generate('公升與毫升',5,'2',false);assert.equal(unknown.unsupported,true);assert.equal(unknown.questions.length,0);
});
test('both fill-in and comprehensive game modes reject missing decimals and a clearly wrong formula',()=>{
 const nodes=new Map(),get=id=>{if(!nodes.has(id))nodes.set(id,{value:'',classList:{add(){},remove(){}},focus(){}});return nodes.get(id);};
 const context={document:{getElementById:get},MathGameAnswers:A,state:{questions:[{id:1,text:'一共是多少？'}],answeredMap:{},stars:0},playSuccessSound(){},playTryAgainSound(){},confetti(){},showToast(){},escapeHtml:x=>x};vm.createContext(context);
 for(const name of ['submitFillAnswer','submitCompAnswer'])vm.runInContext(functions.get(name),context);
 get('fillInput_1').value='15';context.submitFillAnswer(1,'1.5','');assert.equal(context.state.stars,0);
 get('fillInput_1').value='1.50';context.submitFillAnswer(1,'1.5','');assert.equal(context.state.stars,1);
 get('compFormula_1').value='1+1';get('compAnswer_1').value='102';context.submitCompAnswer(1,'102','34*3','');assert.match(get('feedbackBox_1').innerHTML,/請再檢查答案與算式/);
 get('compFormula_1').value='30×3+4×3';context.submitCompAnswer(1,'102','34*3','');assert.match(get('feedbackBox_1').innerHTML,/由老師確認/);assert.equal(context.state.stars,1);
});
