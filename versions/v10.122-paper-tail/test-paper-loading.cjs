const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(__dirname+'/index.html','utf8'),css=fs.readFileSync(__dirname+'/camera-story.css','utf8');
const source=fs.readFileSync(__dirname+'/page-media.js','utf8');
const bridge=require('./handoff-math.js'),camera=require('./camera-story-math.js'),math=require('../v10.104-cover-first-paint/page-turn-math.js');
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
for(const width of [320,375,390,430,768,1000])for(const height of [568,700,844,1100,1400]){
  const posterHeight=width*1.5,paperHeight=Math.max(height,posterHeight),storyTop=(paperHeight-posterHeight)/2;
  assert.ok(paperHeight>=height,'Third chapter starts outside the landing viewport');
  const cover=width*3282/1400;
  assert.ok(Math.abs(height+cover+height-height+paperHeight-height-cover-paperHeight)<1e-8,'Unchanged page boundary through retirement');
  const g={width,height,storyHeight:posterHeight,storyTop,left:0,viewportWidth:width,actorWidth:math.actorWidth(width)};
  const flight=bridge.makeFlight(math,camera,g),plan=camera.makePlan(math,g,flight.view.rect,bridge.actorsAt(3800,flight),flight);
  assert.equal(flight.view.rect.top,storyTop);assert.equal(flight.view.rect.height,posterHeight);
  assert.ok(distance(camera.hand(camera.sample(1380,plan).actors[0],true),plan.shutter)<1e-7,'Hand reaches vertically centered camera');
  const s=2.18,actual=[50.5+(35.35-50.5)*s,66.45+(60.35-66.45)*s-8.15,28.4*s,12.2*s];
  const settled=[17.473,45.002,61.912,26.596];
  actual.forEach((value,i)=>assert.ok(Math.abs(value-settled[i])<1e-10,'No photo jump when removing transform'));
}
assert.doesNotMatch(html,/page-continuation.js|opening-continuation/,'No third-page mirror');
assert.match(css,/min-height:100lvh!important/);assert.match(css,/\.paper-page \.reference-art\{flex:none\}/);
assert.equal(html.match(/<style id="camera-runtime-style">([\s\S]*?)<\/style>/)[1].trim(),css.trim(),'Critical CSS is inline and up-to-date');
assert.doesNotMatch(html,/<link rel="stylesheet" href="camera-story.css"/);
const live=html.replace(/<noscript>[\s\S]*?<\/noscript>/g,'');
const deferred=[...live.matchAll(/<img\b[^>]*data-media-src="([^"]+)"[^>]*>/g)];
assert.equal(deferred.length,8);
for(const [tag,src]of deferred){
  assert.doesNotMatch(tag,/\ssrc="/,'No speculative network request for below-fold image');
  assert.ok(fs.existsSync(path.resolve(__dirname,src)));assert.match(html,new RegExp('<noscript><img[^>]*src="'+src.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'"'),'No-script original image fallback');
}
assert.match(live,/<img src="[^"]*cover.jpg"[^>]*fetchpriority="high"/);
assert.match(css,/html\.cover-first \.camera-names\{background-image:none!important\}/);
assert.match(css,/body\{background-image:none!important\}/);
assert.match(css,/html:not\(\.later-media-ready\) \.closing\{background-image:none!important\}/);
assert.doesNotMatch(live,/id="after-cover-font"/,'Remote font no longer competes with second-page preparation');

async function setup({noObserver=false}={}){
  const events={},frames=new Map(),timers=new Map(),requests=[],observers=[];let id=0;
  class El{
    constructor(attrs={}){this.attrs={...attrs};this.events={};this.classes=new Set(['cover-first']);this.children=[];this.complete=false;this.naturalWidth=0;this.top=2000;this.values={};this.style={setProperty:(k,v)=>this.values[k]=v};this.classList={add:n=>this.classes.add(n),remove:n=>this.classes.delete(n)};}
    getAttribute(k){return this.attrs[k]||null}setAttribute(k,v){this.attrs[k]=v}removeAttribute(k){delete this.attrs[k]}
    set src(value){this.attrs.src=value;requests.push(value)}
    addEventListener(k,fn){(this.events[k]||=[]).push(fn)}emit(k,e={}){for(const fn of this.events[k]||[])fn(e)}
    decode(){return Promise.resolve()}getBoundingClientRect(){return{top:this.top}}
    appendChild(el){this.children.push(el)}
    click(){const event={preventDefault(){this.prevented=true}};this.emit('click',event);this.lastClick=event;this.clicks=(this.clicks||0)+1;}
  }
  const root=new El(),cover=new El(),entry=new El(),head=new El();
  const story=Array.from({length:6},(_,i)=>new El({'data-media-src':'story-'+i+'.png'}));
  const later=Array.from({length:2},(_,i)=>new El({'data-media-src':'later-'+i+'.jpg'}));
  const emit=(k,e={})=>{for(const fn of events[k]||[])fn(e)};
  const win={innerWidth:390,innerHeight:844,WeddingCameraStory:{ready:false,played:false},requestAnimationFrame:fn=>{frames.set(++id,fn);return id},addEventListener:(k,fn)=>{(events[k]||=[]).push(fn)}};
  if(!noObserver)win.IntersectionObserver=class{constructor(fn,options){this.fn=fn;this.options=options;this.targets=new Set();observers.push(this)}observe(node){this.targets.add(node)}unobserve(node){this.targets.delete(node)}};
  const doc={documentElement:root,head,querySelector:s=>s==='.cover-enter'?entry:cover,querySelectorAll:s=>s.includes('"story"')?story:later,createElement:()=>new El(),addEventListener:win.addEventListener,dispatchEvent:e=>emit(e.type,e)};
  vm.runInNewContext(source,{window:win,document:doc,Event:class{constructor(type){this.type=type}},setTimeout:fn=>{timers.set(++id,fn);return id},clearTimeout:key=>timers.delete(key)});
  const tick=()=>{const batch=[...frames.values()];frames.clear();batch.forEach(fn=>fn())};
  const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve()};
  const load=async()=>{cover.complete=true;cover.naturalWidth=1400;cover.emit('load');await flush()};
  return{win,root,cover,entry,head,story,later,requests,observers,frames,timers,emit,tick,flush,load};
}
(async()=>{
  let s=await setup();assert.equal(s.requests.length,0);assert.equal(s.head.children.length,0);assert.ok(!s.win.WeddingMedia.released);
  await s.load();assert.equal(s.requests.length,0);s.tick();assert.equal(s.requests.length,0);s.tick();await s.flush();
  assert.ok(s.win.WeddingMedia.released);assert.equal(s.requests.length,6);assert.ok(!s.root.classes.has('cover-first'));
  assert.equal(s.head.children.length,0,'No font request while the second page is preparing');
  const io=s.observers[0];assert.equal(io.targets.size,2);io.fn([{target:s.later[0],isIntersecting:true}]);
  assert.equal(s.requests.length,7);assert.equal(s.head.children.length,1);assert.ok(s.root.classes.has('later-media-ready'));
  io.fn([{target:s.later[1],isIntersecting:true}]);assert.equal(s.head.children.length,1,'Only one font link');
  const initialHeight=s.root.values['--paper-height'];s.win.innerHeight=900;s.emit('resize');assert.equal(s.root.values['--paper-height'],initialHeight,'Toolbar resize does not shift the artwork');
  s.win.innerWidth=844;s.win.innerHeight=390;s.emit('resize');assert.equal(s.root.values['--paper-height'],'390px');
  s=await setup();s.entry.click();assert.ok(s.entry.lastClick.prevented);assert.equal(s.requests.length,6);assert.equal(s.entry.attrs['aria-busy'],'true');
  s.entry.click();assert.equal(s.requests.length,6);s.win.WeddingCameraStory.ready=true;s.emit('camera-assets-ready');s.tick();
  assert.equal(s.entry.clicks,3,'Repeated early taps collapse to one deferred entry');assert.ok(!s.entry.lastClick.prevented);assert.equal(s.entry.attrs['aria-busy'],undefined);
  s=await setup();s.entry.click();s.win.WeddingCameraStory.played=true;s.emit('camera-story-complete');s.tick();assert.ok(!s.entry.lastClick.prevented,'Failed animation falls back to native page entry');
  s=await setup();await s.load();for(const fn of [...s.timers.values()])fn();assert.ok(s.win.WeddingMedia.released,'Background-tab fallback releases resources');
  s=await setup({noObserver:true});await s.load();s.tick();s.tick();await s.flush();assert.equal(s.requests.length,6);
  s.later[0].top=1000;s.emit('scroll');assert.equal(s.requests.length,7,'Old-browser native-scroll lazy fallback');
  console.log('PASS: 30 full-paper geometries, exact final-photo bounds, centered shutter contact, actual delayed-media loader, two cover paint frames, on-demand later photos/font, early-tap deduplication, toolbar/rotation, no-script and failure fallbacks. No browser timing or visual claims.');
})().catch(error=>{console.error(error);process.exitCode=1});
