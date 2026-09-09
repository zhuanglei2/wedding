const assert=require('node:assert/strict');
const math=require('./page-turn-math.js'),old=require('../v10.100-refined-character-scale/page-turn-math.js');
const center=a=>{const p=math.rotate(120,170,a.lean);return{x:a.x+p.x*a.scale,y:a.y+p.y*a.scale};};
function atPhase(p){let lo=0,hi=math.DURATION;for(let n=0;n<50;n++){const t=(lo+hi)/2;if(math.progressAt(t)<p)lo=t;else hi=t;}return(hi+lo)/2;}
assert.equal(math.progressAt(-100),0);assert.equal(math.progressAt(math.DURATION+100),1);
for(let ms=1;ms<=math.DURATION;ms++)assert.ok(math.progressAt(ms)>=math.progressAt(ms-1),'Clock never rewinds');
const split=5600*math.JOIN_AT;
assert.ok(Math.abs((math.progressAt(split)-math.progressAt(split-.1))/.1-(math.progressAt(split+.1)-math.progressAt(split))/.1)<1e-7,'Clock velocity continuous');
const flightMs=math.DURATION-atPhase(math.DEPART_AT);
assert.ok(flightMs>1500,'Paired departure has >1.5 seconds, not 0.84');
for(const width of [320,390,768,1000]){
 const g={width,height:844,left:0,viewportWidth:width,actorWidth:math.actorWidth(width)};
 for(let i=0;i<2;i++){
  const boundary=.24+i*.015,e=1e-5;
  const a=center(math.sample(boundary-e,g).actors[i]),b=center(math.sample(boundary,g).actors[i]),c=center(math.sample(boundary+e,g).actors[i]);
  assert.ok(Math.hypot((c.x-b.x-b.x+a.x)/e,(c.y-b.y-b.y+a.y)/e)<10,'Arrival matches moving grip velocity');
 }
 const offset=math.departureOffset(.91,g);
 assert.ok(Math.abs(offset.x/(g.width*.88)-offset.y/(-g.height*.86-g.actorWidth))>.015,'Shared exit is curved, not straight-line translation');
 const peak=(m,clock,start,end)=>{let last,peak=0;for(let t=start;t<=end;t+=16){const c=center(m.sample(clock(t),g).actors[0]);if(last)peak=Math.max(peak,Math.hypot(c.x-last.x,c.y-last.y)/.016);last=c;}return peak;};
 const prior=peak(old,t=>t/5600,4760,5520),next=peak(math,math.progressAt,atPhase(.85),atPhase(.98));
 assert.ok(next<prior*.8,'Peak exit speed meaningfully lower');
}
console.log(`PASS: continuous arrival/clock, curved paired exit, lower peak speed; departure ${(flightMs/1000).toFixed(2)}s (was 0.84s)`);
