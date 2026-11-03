/* 三上拔河：共用正式題庫，答案以選項索引判斷，不受顯示語言影響。 */
(function(root){
  'use strict';
  const shuffle=(items,random=Math.random)=>{
    const out=[...items];
    for(let i=out.length-1;i>0;i--){const j=Math.min(i,Math.floor(Math.max(0,random())*(i+1)));[out[i],out[j]]=[out[j],out[i]];}
    return out;
  };
  function selectPool(data,{units,level=0,section='all'}){
    const ids=new Set(units);
    return data.practiceBank.filter(q=>ids.has(q.unitId)&&(!Number(level)||q.level===Number(level))&&(section==='all'||q.sectionId===section));
  }
  function deck(pool,random=Math.random){
    if(!pool.length)throw new RangeError('Empty question pool');
    const groups=new Map();pool.forEach(q=>{if(!groups.has(q.unitId))groups.set(q.unitId,[]);groups.get(q.unitId).push(q);});
    const queues=new Map();let units=[];
    return ()=>{
      if(!units.length)units=shuffle([...groups.keys()],random);
      const id=units.pop();
      if(!queues.get(id)?.length)queues.set(id,shuffle(groups.get(id),random));
      const question=queues.get(id).pop();
      return {question,options:shuffle(question.options.map((text,index)=>({text,index})),random),attempts:0,supported:false,locked:false,wrong:new Set()};
    };
  }
  function create({pool,mode='duo',seconds=0,random=Math.random}){
    const state={phase:'playing',mode,remaining:seconds>0?seconds*1000:null,rope:0,winner:null,history:[],blue:null,red:null};
    const draws={blue:deck(pool,random),red:deck(pool,random)};
    for(const team of ['blue','red'])state[team]={turn:1,current:draws[team](),completed:0,firstCorrect:0,firstAttempts:0,supported:0,skipped:0,streak:0,maxStreak:0};
    function finish(){
      if(state.phase==='finished')return;
      for(const team of ['blue','red']){
        const q=state[team].current;
        if(!q.locked&&(q.attempts||q.supported))state.history.push({team,id:q.question.id,independent:false,supported:true,skipped:false,unfinished:true});
      }
      state.phase='finished';state.winner=state.rope<0?'blue':state.rope>0?'red':null;
    }
    function answer(team,index){
      if(state.phase!=='playing'||!['blue','red'].includes(team))return null;
      const t=state[team],q=t.current;
      if(q.locked||!q.options[index]||q.wrong.has(index))return null;
      const correct=q.options[index].index===q.question.answerIndex,independent=correct&&q.attempts===0&&!q.supported;
      if(!q.attempts)t.firstAttempts++;
      q.attempts++;
      if(!correct){q.supported=true;q.wrong.add(index);t.streak=0;return {correct:false};}
      q.locked=true;t.completed++;
      if(independent){t.firstCorrect++;t.streak++;t.maxStreak=Math.max(t.maxStreak,t.streak);}else{t.supported++;t.streak=0;}
      const power=8+(independent&&t.streak>=3?4:0);
      state.rope=Math.max(-100,Math.min(100,state.rope+(team==='blue'?-power:power)));
      state.history.push({team,id:q.question.id,independent,supported:!independent,skipped:false});
      if(Math.abs(state.rope)>=100)finish();
      return {correct:true,independent,power};
    }
    function help(team){
      if(state.phase!=='playing'||state[team].current.locked)return false;
      state[team].current.supported=true;state[team].streak=0;return true;
    }
    function next(team){
      if(state.phase!=='playing')return false;
      const t=state[team],q=t.current;
      if(!q.locked){t.skipped++;t.streak=0;state.history.push({team,id:q.question.id,independent:false,supported:q.supported,skipped:true});}
      t.turn++;t.current=draws[team]();return true;
    }
    function tick(ms){
      if(state.phase!=='playing'||state.remaining===null||!Number.isFinite(ms)||ms<=0)return;
      state.remaining=Math.max(0,state.remaining-ms);if(!state.remaining)finish();
    }
    return {state,answer,help,next,tick,finish,pause(){if(state.phase==='playing')state.phase='paused';},resume(){if(state.phase==='paused')state.phase='playing';}};
  }
  const api={shuffle,selectPool,deck,create};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Grade3Tug=api;
})(typeof window!=='undefined'?window:globalThis);
