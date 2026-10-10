// Deterministic DOM/WebView model. No browser/network access or screenshot claims.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const code=fs.readFileSync(path.join(__dirname,'story-handoff.js'),'utf8');
function fixture({height=650,portraitHeight=900,delay=48,step=16,order='before',ready=true,portraitReady=true,ignored=false,reduced=false,withPortrait=true}={}){
 let now=0,id=0,photoTop=2000;const frames=new Map(),timers=new Map(),pending=[],writes=[],finished=[];
 const emitter=()=>({listeners:{},addEventListener(t,f){(this.listeners[t]??=[]).push(f)},removeEventListener(t,f){this.listeners[t]=(this.listeners[t]||[]).filter(fn=>fn!==f)},fire(t,e={}){for(const f of [...(this.listeners[t]||[])])f(e)}});
 const classes=new Set(),root={scrollHeight:10000,style:{scrollBehavior:'smooth'},dataset:{},classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x)}};
 const win={...emitter(),innerWidth:390,innerHeight:800,scrollY:1000,scrollX:0,visualViewport:{...emitter(),scale:1,height:800}};
 const preference={...emitter(),matches:reduced};win.matchMedia=()=>preference;
 win.requestAnimationFrame=f=>{frames.set(++id,f);return id};win.cancelAnimationFrame=i=>frames.delete(i);
 win.scrollTo=({top})=>{writes.push({at:now,top,phase:root.dataset.storyHandoffPhase});if(!ignored)pending.push({at:now+delay,top})};
 const makeImage=(name,available)=>({...emitter(),complete:false,naturalWidth:0,attrs:{'data-media-src':name+'.webp','data-media-sizes':'124vw','data-media-srcset':name+'-high.webp 2400w'},getAttribute(n){return this.attrs[n]||null},set src(v){this.attrs.src=v;this.complete=available;this.naturalWidth=available?2400:0}});
 const images=[makeImage('photo',ready),makeImage('lyrics',ready)],portraitImages=[makeImage('portrait',portraitReady)];
 const source={getBoundingClientRect:()=>({top:1000-win.scrollY,bottom:1900-win.scrollY})};
 const photo={getBoundingClientRect:()=>({top:photoTop-win.scrollY,bottom:photoTop+height-win.scrollY}),querySelectorAll:()=>images};
 const portraitTop=()=>photoTop+height;
 const portrait={getBoundingClientRect:()=>({top:portraitTop()-win.scrollY,bottom:portraitTop()+portraitHeight-win.scrollY}),querySelectorAll:()=>portraitImages};
 const anchor=()=>photoTop+height+(withPortrait?portraitHeight:0)+100;
 const timeline={getBoundingClientRect:()=>({top:anchor()-win.scrollY,bottom:anchor()+900-win.scrollY})};
 const doc={...emitter(),hidden:false,documentElement:root,scrollingElement:root,querySelector:s=>s==='#our-story'?source:s==='#gathered-scenes'?photo:s==='#garden-portrait'?(withPortrait?portrait:null):s==='#celebration'?timeline:null};
 doc.dispatchEvent=e=>{if(e.type==='story-handoff-complete')finished.push({at:now,y:win.scrollY,phase:root.dataset.storyHandoffPhase});doc.fire(e.type,e)};
 vm.runInNewContext(code,{window:win,document:doc,Event:class{constructor(type){this.type=type}},setTimeout:(f,ms)=>{timers.set(++id,{f,at:now+ms});return id},clearTimeout:i=>timers.delete(i)});
 function commit(){let moved=false;while(pending.length&&pending[0].at<=now){win.scrollY=pending.shift().top;moved=true}if(moved)win.fire('scroll')}
 function advance(ms){const end=now+ms;while(now<end){now=Math.min(end,now+step);if(order==='before')commit();for(const [i,t]of [...timers])if(t.at<=now){timers.delete(i);t.f()}const batch=[...frames.values()];frames.clear();batch.forEach(f=>f(now));if(order==='after')commit()}}
 function until(phase){for(let i=0;i<3000&&root.dataset.storyHandoffPhase!==phase;i++)advance(16);assert.equal(root.dataset.storyHandoffPhase,phase)}
 function media(which,ok=true){for(const img of which==='portrait'?portraitImages:images){img.complete=true;img.naturalWidth=ok?2400:0;img.fire(ok?'load':'error')}}
 return {win,doc,root,preference,images,portraitImages,writes,finished,advance,until,anchor,portraitTop,media,start(){doc.fire('camera-story-started')},complete(reason='finished'){doc.fire('camera-story-complete',{detail:{reason}})},get gated(){return classes.has('story-handoff-pending')},get pending(){return frames.size+timers.size},set top(n){photoTop=n}};
}

let cases=0;
const landed=(actual,target,message)=>assert(Math.abs(actual-target)<=2,message||`Landing ${actual} must be within 2px of ${target}`);
for(const height of [650,1400,2000])for(const portraitHeight of [600,1200])for(const viewport of [640,800])for(const delay of [0,120,250])for(const step of [16,33])for(const order of ['before','after']){
 const f=fixture({height,portraitHeight,delay,step,order});f.win.innerHeight=viewport;f.win.visualViewport.height=viewport;
 f.start();f.advance(2000);assert.equal(f.writes.length,0);assert([...f.images,...f.portraitImages].every(i=>!i.attrs.src));
 f.complete();f.advance(999);assert.equal(f.writes.length,0,'1s camera hold');
 f.until('holding:portrait-top');landed(f.win.scrollY,2000);assert(f.gated);assert.equal(f.finished.length,0);
 let n=f.writes.length;f.advance(2900);assert.equal(f.writes.length,n,'3s gathered-photo viewing');
 f.until('holding:timeline');landed(f.win.scrollY,f.portraitTop(),'Must land on the new fourth page');assert(f.gated);assert.equal(f.finished.length,0,'Do not start timeline at portrait');
 n=f.writes.length;f.advance(2900);assert.equal(f.writes.length,n,'3s loaded portrait viewing');
 f.advance(16000);assert.equal(f.win.scrollY,f.anchor());assert.equal(f.finished.length,1);assert.equal(f.finished[0].phase,'complete:timeline');
 assert(!f.gated);assert.equal(f.pending,0);assert.equal(f.root.style.scrollBehavior,'smooth');
 assert(f.writes.every((w,i)=>!i||w.top>=f.writes[i-1].top-1),'Only downward movement');
 for(const leg of ['portrait-top','timeline']){
  const moves=f.writes.filter(w=>w.phase==='scrolling:'+leg);assert(moves.length>20);
  assert(moves.every((w,i)=>!i||w.at-moves[i-1].at<=step),'No intermediate lyric/bottom pause');
 }
 const total=f.writes.length;f.start();f.complete();f.advance(20000);assert.equal(f.writes.length,total,'One shot');cases++;
}
const phases=['holding:photo-top','scrolling:photo-top','holding:portrait-top','scrolling:portrait-top','settling:portrait-top','holding:timeline','scrolling:timeline','settling:timeline'];
for(const phase of phases){
 for(const type of ['wheel','touchstart','touchmove','pointerdown','keydown']){
  const f=fixture({height:1400,delay:120});f.start();f.complete();f.until(phase);f.win.fire(type,{key:'ArrowDown'});
  const n=f.writes.length;f.advance(20000);assert.equal(f.writes.length,n,'Manual cancellation '+phase);assert(!f.gated);assert.equal(f.pending,0);
 }
 const f=fixture({height:1400,delay:120});f.start();f.complete();f.until(phase);f.top=2083;f.win.innerHeight=860;f.win.visualViewport.height=860;f.win.fire('resize');f.win.visualViewport.fire('resize');
 f.advance(30000);assert.equal(f.win.scrollY,f.anchor(),'Toolbar/layout correction '+phase);
}
for(const which of ['photo','portrait']){
 const phase=which==='photo'?'waiting-media:photo-top':'waiting-media:portrait-top';
 const options=which==='photo'?{ready:false}:{portraitReady:false};
 const slow=fixture(options);slow.start();slow.complete();slow.until(phase);const y=slow.win.scrollY;slow.advance(1500);assert(slow.gated);slow.media(which);slow.advance(2900);landed(slow.win.scrollY,y);slow.advance(30000);assert.equal(slow.win.scrollY,slow.anchor());
 for(const failure of ['error','timeout','cancel']){
  const f=fixture(options);f.start();f.complete();f.until(phase);if(failure==='error')f.media(which,false);if(failure==='cancel')f.win.fire('touchstart');
  const n=f.writes.length;f.advance(12000);assert.equal(f.writes.length,n);assert(!f.gated);assert.equal(f.pending,0);f.media(which);f.advance(20000);assert.equal(f.writes.length,n,'Late media must not restart route');
 }
}
for(const phase of ['holding:portrait-top','scrolling:portrait-top','holding:timeline','scrolling:timeline'])for(const cause of ['hidden','width','zoom','music','hash','reduced','pagehide']){
 const f=fixture();f.start();f.complete();f.until(phase);
 if(cause==='hidden'){f.doc.hidden=true;f.doc.fire('visibilitychange')}
 if(cause==='width'){f.win.innerWidth=800;f.win.fire('resize')}
 if(cause==='zoom'){f.win.visualViewport.scale=1.2;f.win.visualViewport.fire('resize')}
 if(cause==='music')f.doc.fire('wedding-music-interaction');if(cause==='hash')f.win.fire('hashchange');if(cause==='pagehide')f.win.fire('pagehide');
 if(cause==='reduced'){f.preference.matches=true;f.preference.fire('change')}
 const n=f.writes.length;f.advance(20000);assert.equal(f.writes.length,n);assert(!f.gated);assert.equal(f.pending,0);
}
for(const reason of ['cancelled','failed',null]){const f=fixture();f.start();f.complete(reason);f.advance(20000);assert.equal(f.writes.length,0);assert(!f.gated)}
const low=fixture({reduced:true});low.start();low.complete();low.advance(20000);assert.equal(low.writes.length,0);assert(!low.gated);
const blocked=fixture({ignored:true});blocked.start();blocked.complete();blocked.advance(6000);assert.equal(blocked.pending,0);assert(!blocked.gated);
const fallback=fixture({withPortrait:false});fallback.start();fallback.complete();fallback.advance(20000);assert.equal(fallback.win.scrollY,fallback.anchor());assert.equal(fallback.finished.length,1);
console.log(`PASS ${cases} delayed-WebView routes: fourth-page landing, 3s loaded holds, continuous lyrics, timeline gate, manual takeover, media failure, reduced motion, layout changes, missing-page fallback.`);
