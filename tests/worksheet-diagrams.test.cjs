const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const data = require('../js/data.js');
const figures = require('../js/worksheet-diagrams.js');
const firstTen = id => data.practiceBank.filter(p => p.unitId === id).slice(0, 10);
const distance = (a, b) => Math.hypot(a.x-b.x, a.y-b.y);

test('worksheet diagrams cover the intended questions and omit stale diagrams after quantities change', () => {
  const expected = {u1:2,u2:0,u3:2,u4:10,u5:10,u6:2,u7:8,u8:10,u9:10};
  for (const [unit, count] of Object.entries(expected)) assert.equal(firstTen(unit).filter(p=>figures.render(p)).length,count,unit);
  const ruler = data.practiceBank.find(p=>p.id==='p4_1_4');
  assert.equal(figures.render({...ruler,question:ruler.question.replace('3 公分','4 公分')}),'');
  const pizza = data.practiceBank.find(p=>p.id==='p8_1_6');
  assert.equal(figures.render({...pizza,question:pizza.question.replace('6 塊','8 塊')}),'');
  assert.equal(figures.render({id:'unknown',question:'圓'}),'');
});

test('circle diagrams distinguish radii, diameters and the chord that misses the center', () => {
  for (const kind of ['radius','diameter','radii','chord','compare','fold-cross','fold-line','parts']) {
    const g = figures.circleGeometry(kind), center = {x:g.cx,y:g.cy};
    for (const s of g.segments) {
      assert.ok(Math.abs(distance(s.b,center)-g.r)<1e-10);
      if (s.role==='radius') {
        assert.deepEqual(s.a,center);
        assert.ok(Math.abs(distance(s.a,s.b)-g.r)<1e-10);
      } else {
        assert.ok(Math.abs(distance(s.a,center)-g.r)<1e-10);
        if (s.role==='diameter') {
          assert.ok(Math.abs(distance(s.a,s.b)-2*g.r)<1e-10);
          assert.ok(Math.abs((s.a.x+s.b.x)/2-g.cx)<1e-10);
          assert.ok(Math.abs((s.a.y+s.b.y)/2-g.cy)<1e-10);
        } else {
          assert.notEqual(s.a.y,g.cy);
          assert.equal(s.a.y,s.b.y);
          assert.ok(distance(s.a,s.b)<2*g.r);
        }
      }
    }
  }
  const folds=figures.circleGeometry('fold-cross');
  assert.equal(folds.segments.length,2);
});

test('circle identification figures indicate the target without printing its answer name', () => {
  for (const [id,answer] of [['p9_1_1','圓心'],['p9_1_2','圓周'],['p9_1_3','半徑'],['p9_1_4','直徑']]) {
    const html=figures.render(data.practiceBank.find(p=>p.id===id));
    assert.ok(html.includes('<svg'));
    assert.ok(!html.includes(answer),id);
  }
});

test('ruler endpoints and every tick use one common millimeter scale, including nonzero starts', () => {
  for(const [start,end,min,max] of [[0,1,0,10],[0,34,0,40],[20,50,0,60],[35,115,30,120],[0,23,0,30]]) {
    const g=figures.rulerGeometry(start,end,min,max);
    assert.equal(g.start,g.at(start));
    assert.equal(g.end,g.at(end));
    assert.ok(Math.abs((g.end-g.start)/(g.at(min+1)-g.at(min))-(end-start))<1e-10);
  }
  assert.throws(()=>figures.rulerGeometry(0,70,0,60));
});

test('fraction sectors make equal, adjacent shares and close the whole circle', () => {
  for(const denominator of [2,4,6,8,10,12]) {
    const sectors=Array.from({length:denominator},(_,i)=>figures.sectorPath(80,65,48,i,denominator).match(/-?\d+(?:\.\d+)?/g).map(Number));
    let angleSum=0;
    for(const [i,s] of sectors.entries()) {
      const start={x:s[2],y:s[3]},end={x:s[9],y:s[10]},next=sectors[(i+1)%denominator];
      assert.ok(Math.abs(distance(start,{x:80,y:65})-48)<.001);
      assert.ok(Math.abs(distance(end,{x:80,y:65})-48)<.001);
      assert.deepEqual([end.x,end.y],[next[2],next[3]]);
      let angle=Math.atan2(end.y-65,end.x-80)-Math.atan2(start.y-65,start.x-80);
      if(angle<=0)angle+=2*Math.PI;
      assert.ok(Math.abs(angle-2*Math.PI/denominator)<.0001);
      angleSum+=angle;
    }
    assert.ok(Math.abs(angleSum-2*Math.PI)<.0001);
  }
  assert.throws(()=>figures.sectorPath(80,65,48,4,4));
});

test('the capacity water level follows the same spacing as the ten equal divisions', () => {
  for(let level=0;level<=10;level++) {
    const g=figures.capacityGeometry(10,level);
    assert.equal(g.water,g.at(level));
    assert.ok(Math.abs((g.bottom-g.water)/(g.bottom-g.top)-level/10)<1e-10);
  }
  assert.throws(()=>figures.capacityGeometry(10,11));
});

test('the brownie is four equal squares with exactly one marked share', () => {
  const html=figures.render(data.practiceBank.find(p=>p.id==='p8_1_1'));
  const parts=[...html.matchAll(/<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)" fill="([^"]+)"/g)];
  assert.equal(parts.length,4);
  assert.ok(parts.every(p=>p[3]===parts[0][3]&&p[4]===parts[0][4]));
  assert.equal(parts.filter(p=>p[5].startsWith('url(')).length,1);
  assert.equal(new Set(parts.map(p=>p[1])).size,2);
  assert.equal(new Set(parts.map(p=>p[2])).size,2);
});

test('illustrations can be switched off while all units retain ten questions and calculation areas', () => {
  let html='';
  const context={window:{NANI_G3S1_DATA:data,WorksheetDiagrams:figures,location:{href:'https://example.invalid/math/index.html'},addEventListener(){},LearningRecords:{escapeHtml:value=>String(value)},open(){return {document:{write(value){html=value;},close(){}}};}},URL};
  vm.runInNewContext(fs.readFileSync(require.resolve('../js/contest-features.js'),'utf8'),context);
  for(const unit of data.units) for(const enabled of [true,false]) {
    context.window.WorksheetGenerator.generateAndPrint(unit.id,'空白',true,true,'',true,enabled);
    assert.equal((html.match(/class="ws-question-box"/g)||[]).length,10);
    assert.equal((html.match(/class="ws-grid-area/g)||[]).length,10);
    assert.equal((html.match(/data-ws-figure=/g)||[]).length,enabled?firstTen(unit.id).filter(p=>figures.render(p)).length:0);
  }
});
