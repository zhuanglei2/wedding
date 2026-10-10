// Actual controller in a deterministic DOM/WebView-scroll simulation.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const code=fs.readFileSync(path.join(__dirname,'story-handoff.js'),'utf8');
function fixture({height=650,delay=48,step=16,order='before',quantum=1,ready=true,ignored=false,reduced=false,legacy=false}={}){
 let now=0,id=0,photoTop=2000,photoHeight=height;const frames=new Map(),timers=new Map(),pending=[],writes=[],finished=[];
 const emitter=()=>({listeners:{},addEventListener(t,f){(this.listeners[t]??=[]).push(f)},removeEventListener(t,f){this.listeners[t]=(this.listeners[t]||[]).filter(fn=>fn!==f)},fire(t,e={}){for(const f of [...(this.listeners[t]||[])])f(e)}});
 const classes=new Set(),root={scrollHeight:8500,style:{scrollBehavior:'smooth'},dataset:{},classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x)}};
 const win={...emitter(),innerWidth:390,innerHeight:800,scrollY:1000,scrollX:0,visualViewport:{...emitter(),scale:1,height:800}};
 const preference={...emitter(),matches:reduced};win.matchMedia=()=>preference;
 win.requestAnimationFrame=f=>{frames.set(++id,f);return id};win.cancelAnimationFrame=i=>frames.delete(i);
 win.scrollTo=({top})=>{writes.push({at:now,top,phase:root.dataset.storyHandoffPhase});if(!ignored)pending.push({at:now+delay,top:Math.round(top/quantum)*quantum})};
 const images=[0,1].map(i=>({...emitter(),complete:ready,naturalWidth:ready?1200:0,attrs:{'data-media-src':'picture-'+i+'.webp','data-media-sizes':'100vw','data-media-srcset':'responsive.webp 1200w'},getAttribute(n){return this.attrs[n]||null},set src(v){this.attrs.src=v}}));
 const source={getBoundingClientRect:()=>({top:1000-win.scrollY,bottom:1900-win.scrollY})};
 const photo={getBoundingClientRect:()=>({top:photoTop-win.scrollY,bottom:photoTop+photoHeight-win.scrollY}),querySelectorAll:()=>images};
 const anchor=()=>photoTop+photoHeight+100;
 const timeline={getBoundingClientRect:()=>({top:anchor()-win.scrollY,bottom:anchor()+900-win.scrollY})};
 const doc={...emitter(),hidden:false,documentElement:root,scrollingElement:root,querySelector:s=>s==='#our-story'?source:s==='#gathered-scenes'?photo:s==='#celebration'?timeline:null};
 doc.dispatchEvent=e=>{if(e.type==='story-handoff-complete')finished.push({at:now,y:win.scrollY,anchor:anchor(),phase:root.dataset.storyHandoffPhase});doc.fire(e.type,e)};
 vm.runInNewContext(legacy?fs.readFileSync(path.resolve(__dirname,'../v10.183-photo-led-collage/story-handoff.js'),'utf8'):code,{window:win,document:doc,Event:class{constructor(type){this.type=type}},setTimeout:(f,ms)=>{timers.set(++id,{f,at:now+ms});return id},clearTimeout:i=>timers.delete(i)});
 function commit(){let moved=false;while(pending.length&&pending[0].at<=now){win.scrollY=pending.shift().top;moved=true}if(moved)win.fire('scroll')}
 function advance(ms){const end=now+ms;while(now<end){now=Math.min(end,now+step);if(order==='before')commit();for(const [i,t] of [...timers])if(t.at<=now){timers.delete(i);t.f()}const batch=[...frames.values()];frames.clear();batch.forEach(f=>f(now));if(order==='after')commit()}}
 function until(phase){for(let i=0;i<2000&&root.dataset.storyHandoffPhase!==phase;i++)advance(16);assert.equal(root.dataset.storyHandoffPhase,phase)}
 return {win,doc,root,preference,images,writes,finished,advance,until,anchor,start(){doc.fire('camera-story-started')},complete(reason='finished'){doc.fire('camera-story-complete',{detail:{reason}})},media(ok=true){for(const img of images){img.complete=true;img.naturalWidth=ok?1200:0;img.fire(ok?'load':'error')}},get gated(){return classes.has('story-handoff-pending')},get pending(){return frames.size+timers.size},get time(){return now},set top(n){photoTop=n},set height(n){photoHeight=n}};
}
// Reproduce the old defect using its real controller, not just a code string.
const old=fixture({legacy:true});old.start();old.complete();old.advance(20000);assert.equal(old.win.scrollY,2000);assert(old.win.scrollY<old.anchor());
let cases=0;
for(const height of [650,1400])for(const delay of [0,48,120,250])for(const step of [8,16,33])for(const order of ['before','after']){
 const f=fixture({height,delay,step,order,quantum:step===33?1/3:1});f.start();f.advance(2000);assert.equal(f.writes.length,0);assert(f.images.every(i=>!i.attrs.src),'no early image loading');
 f.complete();f.advance(999);assert.equal(f.writes.length,0,'1s camera hold');f.advance(801);assert(f.win.scrollY>1000&&f.win.scrollY<2000,'first smooth transition');
 f.until('holding:photo-bottom');assert(Math.abs(f.win.scrollY-2000)<=2,'native scroll within landing tolerance');assert(f.gated);assert.equal(f.finished.length,0,'do not release timeline at the new page');
 const n=f.writes.length;f.advance(2900);assert.equal(f.writes.length,n,'visible photo/lyrics receive viewing time');
 f.advance(18000);assert.equal(f.win.scrollY,f.anchor(),'continues to timeline');assert.equal(f.finished.length,1);
 assert(Math.abs(f.finished[0].y-f.anchor())<=2);assert.equal(f.finished[0].phase,'complete:timeline');assert(!f.gated);assert.equal(f.pending,0);assert.equal(f.root.style.scrollBehavior,'smooth');
 if(height===650)assert(!f.writes.some(w=>w.phase==='scrolling:photo-bottom'),'short page has no empty pan');
 else assert(f.writes.some(w=>w.phase==='scrolling:photo-bottom'&&w.top>2000),'tall page reveals bottom lyrics before exit');
 assert(f.writes.every((w,i)=>i===0||w.top>=f.writes[i-1].top-1),'downward route');
 const total=f.writes.length;f.complete();f.start();f.win.fire('scroll');f.advance(20000);assert.equal(f.writes.length,total,'one-shot route');cases++;
}
for(const phase of ['holding:photo-top','scrolling:photo-top','holding:photo-bottom','scrolling:photo-bottom','holding:timeline','scrolling:timeline','settling:timeline']){
 for(const type of ['wheel','touchstart','touchmove','pointerdown','keydown']){
  const f=fixture({height:1400,delay:120});f.start();f.complete();f.until(phase);f.win.fire(type,{key:'ArrowDown'});
  const n=f.writes.length;f.advance(20000);assert.equal(f.writes.length,n,'manual input cancels '+phase);assert(!f.gated);assert.equal(f.pending,0);
 }
 const f=fixture({height:1400,delay:120});f.start();f.complete();f.until(phase);f.win.innerHeight=860;f.win.visualViewport.height=860;f.top=2083;f.win.fire('resize');f.win.visualViewport.fire('resize');f.advance(20000);assert.equal(f.win.scrollY,f.anchor(),'toolbar/layout shift '+phase);
}
const slow=fixture({ready:false});slow.start();slow.complete();slow.until('waiting-media:photo-top');slow.advance(1500);assert(slow.gated);assert.equal(slow.win.scrollY,2000);slow.media();slow.advance(2900);assert.equal(slow.win.scrollY,2000);slow.advance(6000);assert.equal(slow.win.scrollY,slow.anchor());
for(const failure of ['error','timeout','cancel']){const f=fixture({ready:false});f.start();f.complete();f.until('waiting-media:photo-top');if(failure==='error')f.media(false);if(failure==='cancel')f.win.fire('touchstart');f.advance(12000);assert.equal(f.win.scrollY,2000);assert(!f.gated);assert.equal(f.pending,0);f.media();f.advance(6000);assert.equal(f.win.scrollY,2000,'late load cannot restart cancelled flow')}
for(const reason of ['cancelled','failed',null]){const f=fixture();f.start();f.complete(reason);f.advance(20000);assert.equal(f.writes.length,0);assert(!f.gated)}
const low=fixture({reduced:true});low.start();low.complete();low.advance(20000);assert.equal(low.writes.length,0);assert(!low.gated);
for(const phase of ['holding:photo-bottom','scrolling:photo-bottom','scrolling:timeline'])for(const cause of ['hidden','width','zoom','music','hash']){
 const f=fixture({height:1400});f.start();f.complete();f.until(phase);
 if(cause==='hidden'){f.doc.hidden=true;f.doc.fire('visibilitychange')}
 if(cause==='width'){f.win.innerWidth=800;f.win.fire('resize')}
 if(cause==='zoom'){f.win.visualViewport.scale=1.2;f.win.visualViewport.fire('resize')}
 if(cause==='music')f.doc.fire('wedding-music-interaction');if(cause==='hash')f.win.fire('hashchange');
 const n=f.writes.length;f.advance(20000);f.doc.hidden=false;f.doc.fire('visibilitychange');f.advance(6000);assert.equal(f.writes.length,n);assert(!f.gated);assert.equal(f.pending,0);
}
const blocked=fixture({ignored:true});blocked.start();blocked.complete();blocked.advance(6000);assert.equal(blocked.pending,0);assert(!blocked.gated);
console.log(`PASS old stop-at-photo defect reproduced; ${cases} short/tall delayed-WebView routes to timeline; 3s loaded-photo hold; bottom-lyrics pan; single gate; input/background/zoom/music cancellation; finite error fallbacks.`);
