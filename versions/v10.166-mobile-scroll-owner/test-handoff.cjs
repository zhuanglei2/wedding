const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const script=fs.readFileSync(path.join(__dirname,'story-handoff.js'),'utf8');
function fixture({reduced=false,scrollY=1000,quantum=1}={}){
 let time=0,id=0,scrollPending=false,targetReads=0;const timers=new Map(),frames=new Map(),moves=[],finished=[];
 const eventTarget=()=>({listeners:{},addEventListener(type,fn){(this.listeners[type]??=[]).push(fn)},fire(type,event={}){for(const fn of this.listeners[type]||[])fn(event)}});
 const root={scrollHeight:8000,style:{scrollBehavior:'smooth'},classes:new Set()};root.classList={add:x=>root.classes.add(x),remove:x=>root.classes.delete(x),contains:x=>root.classes.has(x)};
 const win={...eventTarget(),innerWidth:390,innerHeight:800,scrollY,scrollX:0};
 win.requestAnimationFrame=fn=>{frames.set(++id,fn);return id};win.cancelAnimationFrame=id=>frames.delete(id);
 win.scrollTo=({top})=>{win.scrollY=Math.round(top/quantum)*quantum;moves.push({at:time,y:win.scrollY});scrollPending=true};
 const source={getBoundingClientRect:()=>({top:1000-win.scrollY,bottom:2000-win.scrollY})};
 const target={getBoundingClientRect:()=>{targetReads++;return {top:2080-win.scrollY,bottom:3080-win.scrollY}}};
 const preference={...eventTarget(),matches:reduced};win.matchMedia=()=>preference;
 const doc={...eventTarget(),documentElement:root,scrollingElement:root,hidden:false,querySelector:s=>s==='#our-story'?source:s==='#celebration'?target:null};
 doc.dispatchEvent=e=>{if(e.type==='story-handoff-complete')finished.push(time);doc.fire(e.type,e)};
 vm.runInNewContext(script,{window:win,document:doc,Event:class{constructor(type){this.type=type}},setTimeout:(fn,ms)=>{timers.set(++id,{fn,at:time+ms});return id},clearTimeout:id=>timers.delete(id)});
 function advance(ms){const end=time+ms;while(time<end){time=Math.min(end,time+16);for(const [id,t] of [...timers])if(t.at<=time){timers.delete(id);t.fn()}const callbacks=[...frames.values()];frames.clear();callbacks.forEach(fn=>fn(time));if(scrollPending){scrollPending=false;win.fire('scroll')}}}
 return {win,doc,root,preference,moves,finished,advance,start(){doc.fire('camera-story-started')},complete(reason='finished'){doc.fire('camera-story-complete',{detail:{reason}})},get targetReads(){return targetReads},get pendingFrames(){return frames.size}};
}
for(const quantum of [1,.5,1/3]){
 const f=fixture({quantum});f.start();assert(f.root.classes.has('story-handoff-pending'));f.advance(6000);assert.equal(f.moves.length,0,'no scroll while camera plays');
 f.complete();f.advance(999);assert.equal(f.moves.length,0,'full one-second hold');assert(f.root.classes.has('story-handoff-pending'));
 f.advance(705);assert(f.win.scrollY>1000&&f.win.scrollY<2080,'smooth intermediate position');assert(f.root.classes.has('story-handoff-pending'),'typing gate stays until arrival');
 f.advance(900);assert.equal(f.win.scrollY,2080);assert(!f.root.classes.has('story-handoff-pending'));assert.equal(f.finished.length,1);assert.equal(f.pendingFrames,0);assert.equal(f.root.style.scrollBehavior,'smooth');
 assert.equal(f.targetReads,3,'geometry sampled at start, final request and committed arrival, not every animation frame');assert(f.moves.every((m,i)=>!i||m.y>=f.moves[i-1].y),'only moves downward');
 const total=f.moves.length;f.complete();f.win.fire('scroll');f.advance(5000);assert.equal(f.moves.length,total,'one handoff only');
}
for(const type of ['wheel','touchstart','touchmove','pointerdown','keydown'])for(const at of [500,1500]){
 const f=fixture();f.start();f.complete();f.advance(at);f.win.fire(type,{key:'ArrowDown'});const y=f.win.scrollY,n=f.moves.length;f.advance(3000);assert.equal(f.win.scrollY,y);assert.equal(f.moves.length,n);assert(!f.root.classes.has('story-handoff-pending'));assert.equal(f.pendingFrames,0);
}
for(const reason of ['cancelled','failed',undefined]){const f=fixture();f.start();f.doc.fire('camera-story-complete',{detail:{reason}});f.advance(4000);assert.equal(f.moves.length,0,'fallback is not natural playback completion')}
const low=fixture({reduced:true});low.start();low.complete();low.advance(4000);assert.equal(low.moves.length,0);
const away=fixture({scrollY:2300});away.start();away.complete();away.advance(4000);assert.equal(away.moves.length,0,'never scroll back from later page');
const bg=fixture();bg.start();bg.complete();bg.advance(1300);bg.doc.hidden=true;bg.doc.fire('visibilitychange');const before=bg.moves.length;bg.advance(5000);bg.doc.hidden=false;bg.doc.fire('visibilitychange');bg.advance(2000);assert.equal(bg.moves.length,before,'no late surprise scroll on return');
const drag=fixture();drag.start();drag.complete();drag.advance(1200);drag.win.fire('pointerdown');drag.win.scrollY+=100;drag.win.fire('scroll');const dragMoves=drag.moves.length;drag.advance(3000);assert.equal(drag.moves.length,dragMoves,'scrollbar/manual scroll stops auto movement');
const toolbar=fixture();toolbar.start();toolbar.complete();toolbar.advance(1300);toolbar.win.innerHeight=850;toolbar.win.fire('resize');toolbar.advance(1500);assert.equal(toolbar.win.scrollY,2080,'toolbar height changes do not abort');
const orientation=fixture();orientation.start();orientation.complete();orientation.advance(1300);orientation.win.innerWidth=800;orientation.win.fire('resize');const oriented=orientation.moves.length;orientation.advance(2000);assert.equal(orientation.moves.length,oriented);
console.log('PASS: natural completion only; exact 1s hold; finite monotonic downward scroll; final third-page anchor; typing gate; one-shot; user cancellation; visibility/reduced-motion/scrollbar/resize compatibility; no pixel-convergence lock.');
