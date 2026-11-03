/* 原創 124 BPM 運動會節奏：所有聲音於本機合成，暫停即停止。 */
(function(root){
  'use strict';
  const lead=[72,0,76,79,0,76,74,0,72,76,79,81,79,0,76,0,69,0,72,76,0,72,71,0,67,71,74,79,74,0,71,0];
  function beat(step){
    const s=step%32,chord=Math.floor(s/8),bass=[48,48,45,43][chord];
    return {lead:lead[s],bass:s%4===0?bass:s%4===3?bass+7:0,kick:s%4===0,snare:s%4===2,hat:s%2===1,accent:s%8===0};
  }
  function create(Context=root.AudioContext||root.webkitAudioContext){
    let ctx=null,master=null,timer=null,next=0,step=0,duckUntil=0;
    const semitone=n=>440*2**((n-69)/12),interval=60/124/2;
    function tone(freq,time,length,volume,type='triangle',end){
      const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,time);
      if(end)o.frequency.exponentialRampToValueAtTime(end,time+length);
      g.gain.setValueAtTime(.0001,time);g.gain.exponentialRampToValueAtTime(volume,time+.008);g.gain.exponentialRampToValueAtTime(.0001,time+length);
      o.connect(g);g.connect(master);o.start(time);o.stop(time+length+.01);
    }
    function noise(time,length,volume,cutoff){
      const b=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*length),ctx.sampleRate),d=b.getChannelData(0);
      for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*(1-i/d.length);
      const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),g=ctx.createGain();source.buffer=b;
      filter.type='highpass';filter.frequency.value=cutoff;g.gain.setValueAtTime(volume,time);g.gain.exponentialRampToValueAtTime(.0001,time+length);
      source.connect(filter);filter.connect(g);g.connect(master);source.start(time);source.stop(time+length);
    }
    function schedule(){
      while(next<ctx.currentTime+.12){
        const p=beat(step++),v=Date.now()<duckUntil ? .22 : 1;
        if(p.lead){tone(semitone(p.lead),next,interval*.75,.10*v);tone(semitone(p.lead-12),next,interval*.65,.025*v,'sawtooth');}
        if(p.bass)tone(semitone(p.bass),next,interval*.88,.11*v);
        if(p.kick)tone(120,next,.16,.22*v,'sine',42);
        if(p.snare){noise(next,.10,.075*v,1100);tone(180,next,.075,.06*v);}
        if(p.hat)noise(next,.025,.035*v,5500);
        if(p.accent)tone(1046,next,.09,.022*v,'sine');
        next+=interval;
      }
    }
    function stop(){if(timer!==null)clearInterval(timer);timer=null;if(master&&ctx)master.gain.setValueAtTime(0,ctx.currentTime);}
    function start(){
      stop();if(!Context)return false;
      if(!ctx){ctx=new Context();master=ctx.createGain();master.connect(ctx.destination);}
      ctx.resume().catch(()=>{});master.gain.setValueAtTime(.55,ctx.currentTime);next=ctx.currentTime+.025;step=0;schedule();timer=setInterval(schedule,50);return true;
    }
    return {start,stop,duck(){duckUntil=Date.now()+15000;},unduck(){duckUntil=0;}};
  }
  const api={beat,create};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.ForestTugMusic=api;
})(typeof window!=='undefined'?window:globalThis);
