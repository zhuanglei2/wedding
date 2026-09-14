// DOM/scroll event simulation, not browser or WeChat verification.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
function fixture(route,{legacy=false,delay=48,step=16,quantum=1,order='before',ignored=false}={}){
 const kind=route===2?'story':'memory',event=route===2?'camera-story-complete':'memory-story-complete';
 const src=route===2?'#our-story':'#celebration',dst=route===2?'#celebration':'#wedding-invitation';
 const code=fs.readFileSync(path.resolve(__dirname,legacy?'../v10.165-mobile-handoff':'.',kind+'-handoff.js'),'utf8');
 let now=0,id=0,anchor=2080;const frames=new Map(),timers=new Map(),pending=[],writes=[],finished=[];
 const emitter=()=>({listeners:{},addEventListener(t,f){(this.listeners[t]??=[]).push(f)},fire(t,e={}){for(const f of this.listeners[t]||[])f(e)}});
 const classes=new Set(),root={scrollHeight:8000,style:{scrollBehavior:'smooth'},classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x)}};
 const win={...emitter(),innerWidth:390,innerHeight:800,scrollY:1000,scrollX:0,visualViewport:{...emitter(),scale:1}};
 const preference={...emitter(),matches:false};win.matchMedia=()=>preference;
 win.requestAnimationFrame=f=>{frames.set(++id,f);return id};win.cancelAnimationFrame=i=>frames.delete(i);
 win.scrollTo=({top})=>{writes.push({at:now,top});if(!ignored)pending.push({at:now+delay,top:Math.round(top/quantum)*quantum})};
 const source={getBoundingClientRect:()=>({top:1000-win.scrollY,bottom:2000-win.scrollY})};
 const target={getBoundingClientRect:()=>({top:anchor-win.scrollY,bottom:anchor+1000-win.scrollY})};
 const doc={...emitter(),hidden:false,documentElement:root,scrollingElement:root,querySelector:s=>s===src?source:s===dst?target:null};
 doc.dispatchEvent=e=>{if(e.type===kind+'-handoff-complete')finished.push({at:now,y:win.scrollY,anchor});doc.fire(e.type,e)};
 vm.runInNewContext(code,{window:win,document:doc,Event:class{constructor(type){this.type=type}},setTimeout:(f,ms)=>{timers.set(++id,{f,at:now+ms});return id},clearTimeout:i=>timers.delete(i)});
 function commit(){let applied=false;while(pending.length&&pending[0].at<=now){win.scrollY=pending.shift().top;applied=true}if(applied)win.fire('scroll')}
 function advance(ms){const end=now+ms;while(now<end){now=Math.min(end,now+step);if(order==='before')commit();for(const [i,t]of [...timers])if(t.at<=now){timers.delete(i);t.f()}const batch=[...frames.values()];frames.clear();batch.forEach(f=>f(now));if(order==='after')commit()}}
 const complete=()=>doc.fire(event,{detail:{reason:'finished'}});
 if(route===2)doc.fire('camera-story-started');
 complete();
 return {win,doc,root,classes,preference,writes,finished,advance,complete,get gated(){return classes.has(kind+'-handoff-pending')},get frameCount(){return frames.size},get timerCount(){return timers.size},get anchor(){return anchor},set anchor(v){anchor=v}};
}
for(const route of [2,3]){
 const old=fixture(route,{legacy:true});old.advance(4000);
 assert(old.writes.length>0&&old.win.scrollY>1000&&old.win.scrollY<2080,'reproduce V165 scroll starts then stops before target');
 console.log('REPRO V165 '+route+'→'+(route+1)+': stopped at '+old.win.scrollY+' instead of 2080');
}
if(process.argv.includes('--legacy-only'))process.exit(0);
let cases=0;
for(const route of [2,3])for(const delay of [0,16,48,120,250])for(const step of [8,16,33])for(const order of ['before','after']){
 const f=fixture(route,{delay,step,order,quantum:step===8?.5:step===33?1/3:1});
 f.advance(999);assert.equal(f.writes.length,0,'full 1s hold');
 f.advance(701);assert(f.win.scrollY>1000&&f.win.scrollY<2080,'smooth middle');
 assert(f.gated,'do not start next scene during travel');
 f.advance(2300);assert.equal(f.win.scrollY,2080,'arrives despite delayed native scroll');
 assert.equal(f.finished.length,1);assert(Math.abs(f.finished[0].y-2080)<=2,'gate released only at actual destination');
 assert(!f.gated);assert.equal(f.frameCount,0);assert.equal(f.timerCount,0);assert.equal(f.root.style.scrollBehavior,'smooth');
 const count=f.writes.length;f.complete();f.win.fire('scroll');f.advance(3000);assert.equal(f.writes.length,count,'no replay');
 cases++;
}
for(const route of [2,3])for(const phase of [500,1500,2440]){
 const f=fixture(route,{delay:120});f.advance(phase);f.win.innerHeight=910;f.anchor+=83;f.win.scrollY+=34;f.win.fire('scroll');f.win.fire('resize');f.win.visualViewport.fire('resize');f.advance(4000);
 assert.equal(f.win.scrollY,2163,'toolbar/layout shift updates final anchor');assert.equal(f.finished.length,1);assert(Math.abs(f.finished[0].y-2163)<=2);
 for(const type of ['touchstart','touchmove','wheel','pointerdown','keydown']){
  const manual=fixture(route,{delay:120});manual.advance(phase);manual.win.fire(type,{key:'ArrowDown'});
  const count=manual.writes.length;manual.advance(4000);
  assert.equal(manual.writes.length,count,'explicit '+type+' stops new writes');assert(!manual.gated);assert.equal(manual.frameCount,0);
 }
}
for(const route of [2,3]){
 const blocked=fixture(route,{ignored:true});blocked.advance(4500);assert.equal(blocked.win.scrollY,1000);assert.equal(blocked.frameCount,0,'unscrollable viewport has finite fallback');assert(!blocked.gated,'manual navigation remains available');
 const rotated=fixture(route);rotated.advance(1600);rotated.win.innerWidth=800;rotated.win.fire('resize');const n=rotated.writes.length;rotated.advance(4000);assert.equal(rotated.writes.length,n);
 const zoom=fixture(route);zoom.advance(1600);zoom.win.visualViewport.scale=1.2;zoom.win.visualViewport.fire('resize');const z=zoom.writes.length;zoom.advance(4000);assert.equal(zoom.writes.length,z);
}
console.log('PASS: '+cases+' delayed/quantized/ordered scroll cases; actual arrival gate; toolbar/layout shifts in hold/travel/settle; genuine input cancellation; finite failure fallback; both page transitions.');
