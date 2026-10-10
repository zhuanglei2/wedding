// Deterministic DOM/WebView model. No browser/network access or screenshot claims.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const code=fs.readFileSync(path.join(__dirname,'story-handoff.js'),'utf8');
function fixture({height=650,portraitHeight=900,lyricsHeight=140,lyricsInset=20,delay=48,step=16,order='before',ready=true,portraitReady=true,decodeDelay=0,decodeReject=false,ignored=false,reduced=false,withPortrait=true,withLyrics=true}={}){
 let now=0,id=0,photoTop=2000,reads=0;const frames=new Map(),timers=new Map(),pending=[],writes=[],finished=[],samples=[],observers=[];
 const schedule=(f,ms)=>{timers.set(++id,{f,at:now+ms});return id};
 const emitter=()=>({listeners:{},addEventListener(t,f){(this.listeners[t]??=[]).push(f)},removeEventListener(t,f){this.listeners[t]=(this.listeners[t]||[]).filter(fn=>fn!==f)},fire(t,e={}){for(const f of [...(this.listeners[t]||[])])f(e)}});
 const classes=new Set(),root={scrollHeight:10000,style:{scrollBehavior:'smooth'},dataset:{},classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x)}};
 const win={...emitter(),innerWidth:390,innerHeight:800,scrollY:1000,scrollX:0,visualViewport:{...emitter(),scale:1,height:800}};
 const preference={...emitter(),matches:reduced};win.matchMedia=()=>preference;
 win.requestAnimationFrame=f=>{frames.set(++id,f);return id};win.cancelAnimationFrame=i=>frames.delete(i);
 win.scrollTo=({top})=>{writes.push({at:now,top,phase:root.dataset.storyHandoffPhase});if(!ignored)pending.push({at:now+delay,top})};
 const makeImage=(name,available)=>({...emitter(),complete:false,naturalWidth:0,decodeCalls:0,decodedAt:null,attrs:{'data-media-src':name+'.webp','data-media-sizes':'124vw','data-media-srcset':name+'-high.webp 2400w'},getAttribute(n){return this.attrs[n]||null},set src(v){this.attrs.src=v;this.complete=available;this.naturalWidth=available?2400:0},decode(){this.decodeCalls++;return {then:(ok,bad)=>schedule(()=>{this.decodedAt=now;(decodeReject?bad:ok)()},decodeDelay)}}});
 const images=[makeImage('photo',ready),makeImage('lyrics',ready)],portraitImages=[makeImage('portrait',portraitReady)];
 const source={getBoundingClientRect:()=>({top:1000-win.scrollY,bottom:1900-win.scrollY})};
 const lyricBounds=()=>({top:photoTop+height-lyricsInset-lyricsHeight-win.scrollY,bottom:photoTop+height-lyricsInset-win.scrollY});
 images[1].getBoundingClientRect=()=>{reads++;return lyricBounds()};
 const photo={getBoundingClientRect:()=>{reads++;return {top:photoTop-win.scrollY,bottom:photoTop+height-win.scrollY}},querySelectorAll:()=>images,querySelector:()=>withLyrics?images[1]:null};
 const portraitTop=()=>photoTop+height;
 const portrait={getBoundingClientRect:()=>({top:portraitTop()-win.scrollY,bottom:portraitTop()+portraitHeight-win.scrollY}),querySelectorAll:()=>portraitImages};
 const anchor=()=>photoTop+height+(withPortrait?portraitHeight:0)+100;
 const timeline={getBoundingClientRect:()=>({top:anchor()-win.scrollY,bottom:anchor()+900-win.scrollY})};
 const doc={...emitter(),hidden:false,documentElement:root,scrollingElement:root,querySelector:s=>s==='#our-story'?source:s==='#gathered-scenes'?photo:s==='#garden-portrait'?(withPortrait?portrait:null):s==='#celebration'?timeline:null};
 doc.dispatchEvent=e=>{if(e.type==='story-handoff-complete')finished.push({at:now,y:win.scrollY,phase:root.dataset.storyHandoffPhase});doc.fire(e.type,e)};
 win.ResizeObserver=class{constructor(fn){this.fn=fn;this.active=true;observers.push(this)}observe(){}disconnect(){this.active=false}};
 vm.runInNewContext(code,{window:win,document:doc,Event:class{constructor(type){this.type=type}},setTimeout:schedule,clearTimeout:i=>timers.delete(i)});
 function commit(){let moved=false;while(pending.length&&pending[0].at<=now){win.scrollY=pending.shift().top;moved=true}if(moved)win.fire('scroll')}
 function advance(ms){const end=now+ms;while(now<end){now=Math.min(end,now+step);if(order==='before')commit();for(const [i,t]of [...timers])if(t.at<=now){timers.delete(i);t.f()}const batch=[...frames.values()];frames.clear();batch.forEach(f=>f(now));if(order==='after')commit();samples.push({at:now,phase:root.dataset.storyHandoffPhase,y:win.scrollY,...lyricBounds()})}}
 function until(phase){for(let i=0;i<3000&&root.dataset.storyHandoffPhase!==phase;i++)advance(16);assert.equal(root.dataset.storyHandoffPhase,phase)}
 function media(which,ok=true){for(const img of which==='portrait'?portraitImages:images){img.complete=true;img.naturalWidth=ok?2400:0;img.fire(ok?'load':'error')}}
 return {win,doc,root,preference,images,portraitImages,writes,finished,samples,advance,until,anchor,portraitTop,media,lyricBounds,relayout(){for(const o of observers)if(o.active)o.fn()},start(){doc.fire('camera-story-started')},complete(reason='finished'){doc.fire('camera-story-complete',{detail:{reason}})},get gated(){return classes.has('story-handoff-pending')},get pending(){return frames.size+timers.size},get now(){return now},get reads(){return reads},set top(n){photoTop=n},set photoHeight(n){height=n}};
}

let cases=0;
const landed=(actual,target,message)=>assert(Math.abs(actual-target)<=2,message||`Landing ${actual} must be within 2px of ${target}`);
for(const height of [650,1400,2000])for(const portraitHeight of [600,1200])for(const viewport of [640,800])for(const delay of [0,120,250])for(const step of [16,33])for(const order of ['before','after']){
 const f=fixture({height,portraitHeight,delay,step,order});f.win.innerHeight=viewport;f.win.visualViewport.height=viewport;
 assert([...f.images,...f.portraitImages].every(i=>!i.attrs.src),'Do not load during cover');
 f.start();f.advance(2000);assert.equal(f.writes.length,0);assert(f.images.every(i=>i.attrs.src&&i.decodeCalls===1));assert(f.portraitImages.every(i=>!i.attrs.src));
 f.complete();f.advance(999);assert.equal(f.writes.length,0,'1s camera hold');
 f.until('reading:lyrics');assert(f.gated);assert.equal(f.finished.length,0);
 const safe=Math.min(48,Math.max(16,viewport*.06));
 assert(f.lyricBounds().top>=safe-2&&f.lyricBounds().bottom<=viewport-safe+2,'Full lyrics within safe viewport');
 const expected=Math.max(2000,2000+height-20-viewport+safe);
 landed(f.win.scrollY,expected,'Only scroll enough to make the lyrics readable');
 let n=f.writes.length;f.advance(2900);assert.equal(f.writes.length,n,'3s visible-lyrics reading hold');
 f.until('holding:timeline');landed(f.win.scrollY,f.portraitTop(),'Must land on the new fourth page');assert(f.gated);assert.equal(f.finished.length,0,'Do not start timeline at portrait');
 n=f.writes.length;f.advance(2900);assert.equal(f.writes.length,n,'3s loaded portrait viewing');
 f.advance(16000);assert.equal(f.win.scrollY,f.anchor());assert.equal(f.finished.length,1);assert.equal(f.finished[0].phase,'complete:timeline');
 assert(!f.gated);assert.equal(f.pending,0);assert.equal(f.root.style.scrollBehavior,'smooth');
 assert(f.writes.every((w,i)=>!i||w.top>=f.writes[i-1].top-1),'Only downward movement');
 for(const leg of ['portrait-top','timeline']){
  const moves=f.writes.filter(w=>w.phase==='scrolling:'+leg);assert(moves.length>20);
  assert(moves.every((w,i)=>!i||w.at-moves[i-1].at<=step),'Continuous frame cadence within each movement');
 }
 const reading=f.samples.filter(s=>s.phase==='reading:lyrics');
 assert(reading.at(-1).at-reading[0].at>=2960,'Reading timer begins after full visibility');
 assert(reading.every(s=>s.top>=safe-2&&s.bottom<=viewport-safe+2));
 const total=f.writes.length;f.start();f.complete();f.advance(20000);assert.equal(f.writes.length,total,'One shot');cases++;
}
const phases=['holding:photo-top','scrolling:photo-top','holding:lyrics','scrolling:lyrics','settling:lyrics','reading:lyrics','scrolling:portrait-top','settling:portrait-top','holding:timeline','scrolling:timeline','settling:timeline'];
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
 const slow=fixture(options);slow.start();slow.complete();slow.until(phase);const y=slow.win.scrollY;slow.advance(1500);assert(slow.gated);landed(slow.win.scrollY,y);slow.media(which);slow.advance(30000);assert.equal(slow.win.scrollY,slow.anchor());
 for(const failure of ['error','timeout','cancel']){
  const f=fixture(options);f.start();f.complete();f.until(phase);if(failure==='error')f.media(which,false);if(failure==='cancel')f.win.fire('touchstart');
  const n=f.writes.length;f.advance(12000);assert.equal(f.writes.length,n);assert(!f.gated);assert.equal(f.pending,0);f.media(which);f.advance(20000);assert.equal(f.writes.length,n,'Late media must not restart route');
 }
}
for(const phase of ['reading:lyrics','scrolling:portrait-top','holding:timeline','scrolling:timeline'])for(const cause of ['hidden','width','zoom','music','hash','reduced','pagehide']){
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
// Production page dimensions at common phone / desktop viewport sizes.
for(const [width,viewport] of [[320,568],[375,667],[390,600],[390,844],[430,700],[430,932],[860,600],[860,800]]){
 const height=Math.min(96,Math.max(48,width*.155))+width*(1540/1200+.3+.04);
 const f=fixture({height,lyricsHeight:width*.3,lyricsInset:width*.04});f.win.innerHeight=viewport;f.win.visualViewport.height=viewport;
 f.start();f.complete();f.until('reading:lyrics');const r=f.lyricBounds(),safe=Math.min(48,Math.max(16,viewport*.06));
 assert(r.top>=safe-2&&r.bottom<=viewport-safe+2,`${width}x${viewport}: lyrics must fit`);
 const n=f.writes.length;f.advance(2900);assert.equal(f.writes.length,n);f.advance(30000);assert.equal(f.win.scrollY,f.anchor());
}
const decoded=fixture({height:1400,decodeDelay:4000});decoded.start();decoded.complete();decoded.advance(3500);assert.equal(decoded.writes.length,0,'Wait for decode before leaving the camera');decoded.advance(30000);assert.equal(decoded.win.scrollY,decoded.anchor());
assert(decoded.images.every(i=>i.decodedAt<=decoded.writes[0].at));
assert(decoded.portraitImages[0].decodedAt<=decoded.writes.find(w=>w.phase==='scrolling:portrait-top').at);
const rejected=fixture({decodeReject:true});rejected.start();rejected.complete();rejected.advance(30000);assert.equal(rejected.win.scrollY,rejected.anchor(),'Loaded images survive decode rejection');
const missing=fixture({withLyrics:false});missing.start();missing.complete();missing.advance(30000);assert.equal(missing.win.scrollY,missing.anchor());
const short=fixture();short.start();short.complete();short.advance(30000);assert(!short.writes.some(w=>w.phase==='scrolling:lyrics'),'No redundant scroll on tall phone');
const resize=fixture({height:1400});resize.start();resize.complete();resize.until('reading:lyrics');resize.advance(2000);resize.win.visualViewport.height=600;resize.win.innerHeight=600;resize.win.fire('resize');resize.until('reading:lyrics');let n=resize.writes.length;resize.advance(2900);assert.equal(resize.writes.length,n,'Restart reading timer after viewport correction');resize.advance(30000);assert.equal(resize.win.scrollY,resize.anchor());
const shifted=fixture({height:1400});shifted.start();shifted.complete();shifted.until('reading:lyrics');shifted.photoHeight=1500;shifted.relayout();shifted.until('reading:lyrics');shifted.advance(30000);assert.equal(shifted.win.scrollY,shifted.anchor(),'ResizeObserver corrects loaded layout shifts');
const tooTall=fixture({height:1400,lyricsHeight:900});tooTall.start();tooTall.complete();tooTall.advance(30000);assert(!tooTall.gated);assert(!tooTall.writes.some(w=>w.phase==='scrolling:portrait-top'),'Never auto-dismiss lyrics too tall for the viewport');
const perf=fixture({height:1400});perf.start();perf.complete();perf.until('scrolling:lyrics');const readCount=perf.reads;perf.advance(400);assert.equal(perf.reads,readCount,'No per-frame layout reads during normal scrolling');
console.log(`PASS ${cases} delayed-WebView routes + 8 real viewport geometries: fully visible 3s lyrics, predecode, cancellation, failures, resize, no redundant scroll or per-frame layout reads.`);
