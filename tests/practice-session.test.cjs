const test=require('node:test'),assert=require('node:assert/strict');
const {orderBank,roundSummary,sectionSummary}=require('../js/practice-session.js');
const data=require('../js/data.js');
const {recordAttempt}=require('../js/learning-records.js');
const row=(extra={})=>({studentId:'demo-1',questionId:'p1_1_1',unitId:'u1',sessionId:'s1',firstCorrect:false,finalCorrect:false,firstSupport:'independent',support:'independent',attempts:1,time:'2026-01-01T00:00:00.000Z',...extra});
test('small rounds sample different sections and units instead of silently using only the first section',()=>{
 const firstUnit=data.practiceBank.filter(p=>p.unitId==='u1'),ordered=orderBank(firstUnit);
 assert.equal(new Set(ordered.slice(0,4).map(p=>p.sectionId)).size,4);
 assert.equal(new Set(orderBank(data.practiceBank).slice(0,9).map(p=>p.unitId)).size,9);
 assert.deepEqual(new Set(ordered.map(p=>p.id)),new Set(firstUnit.map(p=>p.id)));
 assert.equal(ordered.length,firstUnit.length);assert.equal(firstUnit[0],data.practiceBank[0]);
 const basic=firstUnit.filter(p=>p.level===1);assert.ok(orderBank(basic).every(p=>p.level===1));
});
test('round recap separates unanswered, first independent, supported completion and unfinished questions',()=>{
 const rows=[row(),row({questionId:'p2',firstCorrect:true,finalCorrect:true}),row({questionId:'p3',finalCorrect:true,support:'prompted',attempts:2}),row({questionId:'p4',firstCorrect:true,finalCorrect:true,firstSupport:'verbal',support:'verbal'})];
 assert.deepEqual(roundSummary(rows,['p1_1_1','p2','p3','p4','p5','p5']),{total:5,answered:4,unanswered:1,independent:1,supported:2,pending:1,reviewIds:['p1_1_1','p3','p4']});
 assert.deepEqual(roundSummary([],[]),{total:0,answered:0,unanswered:0,independent:0,supported:0,pending:0,reviewIds:[]});
});
test('reviewing a corrected answer preserves its first attempt and cannot mint another star',()=>{
 const attempt={studentId:'demo-1',questionId:'p1',unitId:'u1',sessionId:'s1',support:'independent',correct:false};
 let result=recordAttempt([],attempt);result=recordAttempt(result.entries,{...attempt,support:'prompted',correct:true});assert.equal(result.reward,true);
 result=recordAttempt(result.entries,{...attempt,correct:true});assert.equal(result.reward,false);
 assert.equal(roundSummary(result.entries,['p1']).independent,0);assert.deepEqual(roundSummary(result.entries,['p1']).reviewIds,['p1']);
});
test('reteaching summary uses the latest observation per question, filters students and rejects stale question metadata',()=>{
 const entries=[row({firstCorrect:true,finalCorrect:true}),row({sessionId:'s2',time:'2026-02-01T00:00:00.000Z',finalCorrect:true,firstSupport:'prompted',support:'prompted'}),row({studentId:'other'}),row({questionId:'unknown'}),row({unitId:'u9'}),row({questionId:'p1_1_2'})];
 const summaries=sectionSummary(entries,'demo-1',data.practiceBank);
 assert.equal(summaries.length,1);assert.deepEqual(summaries[0],{id:'s1_1',unitId:'u1',title:'1-1 認識 10000 以內的數',total:2,independent:0,supported:1,pending:1});
 assert.deepEqual(sectionSummary(entries,'no-observations',data.practiceBank),[]);
});
