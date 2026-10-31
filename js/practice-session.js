/* 練習小回合與再教摘要：只整理實際作答，不推估精熟或障礙類型。 */
(function(root){
  'use strict';
  function interleave(groups){
    const queues=[...groups.values()].map(items=>items.slice()),out=[];
    while(queues.some(items=>items.length))for(const items of queues)if(items.length)out.push(items.shift());
    return out;
  }
  function group(items,key){const groups=new Map();for(const item of items){const value=key(item);if(!groups.has(value))groups.set(value,[]);groups.get(value).push(item);}return groups;}
  function orderBank(bank){
    const units=group(bank,p=>p.unitId);
    for(const [unit,items] of units){const sections=group(items,p=>p.sectionId);for(const [section,problems]of sections)sections.set(section,interleave(group(problems,p=>p.level)));units.set(unit,interleave(sections));}
    return interleave(units);
  }
  const independent=row=>row.firstCorrect&&row.firstSupport==='independent';
  function roundSummary(rows,questionIds){
    const ids=[...new Set(questionIds)],byId=new Map(rows.map(row=>[row.questionId,row])),observed=ids.map(id=>byId.get(id)).filter(Boolean);
    return {total:ids.length,answered:observed.length,unanswered:ids.length-observed.length,independent:observed.filter(independent).length,supported:observed.filter(row=>row.finalCorrect&&!independent(row)).length,pending:observed.filter(row=>!row.finalCorrect).length,reviewIds:observed.filter(row=>!independent(row)).map(row=>row.questionId)};
  }
  function sectionSummary(entries,studentId,bank){
    const problems=new Map(bank.map(p=>[p.id,p])),latest=new Map();
    entries.forEach((row,index)=>{const p=problems.get(row.questionId);if(row.studentId!==String(studentId)||!p||row.unitId!==p.unitId)return;const previous=latest.get(row.questionId);if(!previous||row.time>=previous.row.time)latest.set(row.questionId,{row,index});});
    const sections=new Map();
    for(const {row}of latest.values()){const p=problems.get(row.questionId);if(!sections.has(p.sectionId))sections.set(p.sectionId,{id:p.sectionId,unitId:p.unitId,title:p.sectionTitle,total:0,independent:0,supported:0,pending:0});const s=sections.get(p.sectionId);s.total++;if(independent(row))s.independent++;else if(row.finalCorrect)s.supported++;else s.pending++;}
    return [...sections.values()].sort((a,b)=>a.id.localeCompare(b.id,undefined,{numeric:true}));
  }
  const api={orderBank,roundSummary,sectionSummary};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MathPracticeSession=api;
})(typeof window!=='undefined'?window:globalThis);
