const test=require('node:test'),assert=require('node:assert/strict');
const data=require('../js/data.js'),game=require('../games/game6-grade3-tug/engine.js');
const correct=t=>t.current.options.findIndex(o=>o.index===t.current.question.answerIndex);
const wrong=t=>t.current.options.findIndex(o=>o.index!==t.current.question.answerIndex);
test('the game uses all nine canonical units, their 27 subsections, and the original answer indices',()=>{
 const all=game.selectPool(data,{units:data.units.map(u=>u.id)});assert.equal(all.length,270);
 assert.equal(new Set(all.map(q=>q.sectionId)).size,27);
 for(const unit of data.units)for(const section of unit.sections)for(const level of [1,2,3]){
  const pool=game.selectPool(data,{units:[unit.id],section:section.id,level});
  assert.ok(pool.length,section.id+' '+level);
  const m=game.create({pool});
  for(let i=0;i<pool.length;i++){
   assert.equal(m.state.blue.current.question.unitId,unit.id);assert.equal(m.state.blue.current.question.sectionId,section.id);
   assert.equal(m.state.blue.current.question.level,level);assert.equal(new Set(m.state.blue.current.options.map(o=>o.index)).size,4);
   m.answer('blue',correct(m.state.blue));if(m.state.phase==='playing')m.next('blue');else break;
  }
 }
});
test('selected units rotate fairly and each unit consumes its deck before repeating',()=>{
 const pool=data.practiceBank.filter(q=>['u8','u9'].includes(q.unitId));let seed=44;
 const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296),next=game.deck(pool,random),seen={u8:[],u9:[]};
 for(let i=0;i<40;i++){const q=next().question;seen[q.unitId].push(q.id);}
 assert.equal(seen.u8.length,20);assert.equal(seen.u9.length,20);assert.equal(new Set(seen.u8).size,20);assert.equal(new Set(seen.u9).size,20);
 assert.throws(()=>game.deck([]),RangeError);
});
test('wrong choices cannot pull or score twice, and supported completion is separate from first independent success',()=>{
 const m=game.create({pool:data.practiceBank.slice(0,3)}),q=m.state.blue;
 const index=wrong(q);assert.equal(m.answer('blue',index).correct,false);assert.equal(m.state.rope,0);
 assert.equal(m.answer('blue',index),null);assert.equal(q.current.attempts,1);
 const result=m.answer('blue',correct(q));assert.equal(result.independent,false);assert.equal(q.completed,1);assert.equal(q.supported,1);assert.equal(q.firstCorrect,0);
 assert.equal(m.answer('blue',correct(q)),null);assert.equal(m.state.rope,-8);
 m.next('blue');m.help('blue');m.answer('blue',correct(q));assert.equal(q.supported,2);assert.equal(q.streak,0);
 m.next('blue');m.answer('blue',correct(q));assert.equal(q.firstCorrect,1);assert.equal(q.firstAttempts,3);
});
test('three independent successes build a stronger pull, while pause freezes both clock and answers',()=>{
 const m=game.create({pool:data.practiceBank.slice(0,5),seconds:120});
 for(let i=0;i<3;i++){const r=m.answer('blue',correct(m.state.blue));assert.equal(r.power,i===2?12:8);m.next('blue');}
 assert.equal(m.state.rope,-28);m.tick(1000);assert.equal(m.state.remaining,119000);m.pause();
 assert.equal(m.answer('red',correct(m.state.red)),null);m.tick(10000);assert.equal(m.state.remaining,119000);assert.equal(m.next('blue'),false);
 m.resume();m.tick(119000);assert.equal(m.state.phase,'finished');assert.equal(m.state.winner,'blue');assert.equal(m.answer('red',correct(m.state.red)),null);
});
test('ending a match preserves unfinished supported work once and replay starts with fresh scores',()=>{
 const pool=data.practiceBank.slice(0,4),m=game.create({pool});m.answer('blue',wrong(m.state.blue));m.finish();m.finish();
 assert.equal(m.state.history.length,1);assert.equal(m.state.history[0].unfinished,true);assert.equal(m.state.winner,null);
 const fresh=game.create({pool});assert.equal(fresh.state.history.length,0);assert.equal(fresh.state.rope,0);assert.equal(fresh.state.blue.completed,0);
});
test('original sports music has a steady march beat and a repeating melodic phrase',()=>{
 const {beat}=require('../games/game6-grade3-tug/music.js');
 for(let i=0;i<32;i++)assert.deepEqual(beat(i),beat(i+32));
 assert.equal(beat(0).kick,true);assert.equal(beat(2).snare,true);assert.equal(beat(1).hat,true);
 assert.ok(Array.from({length:32},(_,i)=>beat(i)).filter(x=>x.lead).length>16);
});
