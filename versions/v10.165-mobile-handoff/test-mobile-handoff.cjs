// Integration regression: actual bundled camera math/controllers; DOM and canvas drawing are mocked.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const path=require('node:path'),rootPath=path.resolve(__dirname,'../..')+'/';
const previousBundle=fs.readFileSync(rootPath+'versions/v10.161-auto-story/opening-runtime.js','utf8');
const bundle=fs.readFileSync(path.join(__dirname,'opening-runtime.js'),'utf8');
const previousCamera=previousBundle.slice(previousBundle.indexOf('/* Source: camera-story.js */'),previousBundle.indexOf('/* Source: page-turn.js */'));
const previousHandoff=fs.readFileSync(rootPath+'versions/v10.161-auto-story/story-handoff.js','utf8');
const camera=bundle.slice(bundle.indexOf('/* Source: camera-story.js */'),bundle.indexOf('/* Source: page-turn.js */'));
const secondHandoff=fs.readFileSync(path.join(__dirname,'story-handoff.js'),'utf8');
const thirdHandoff=fs.readFileSync(path.join(__dirname,'memory-handoff.js'),'utf8');
async function fixture(edge=2,{legacy=false,width=390,frameStep=16,reduced=false}={}){
 let now=0,id=0;const timers=new Map(),frames=new Map(),moves=[],completions=[];
 const elem=()=>{const classes=new Set();return {listeners:{},style:{setProperty(k,v){this[k]=v}},classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x)},append(){},appendChild(){},setAttribute(){},getAttribute(){return null},addEventListener(t,f){(this.listeners[t]??=[]).push(f)},removeEventListener(){},fire(t,e={}){for(const f of [...(this.listeners[t]||[])])f(e)},dispatchEvent(e){this.fire(e.type,e);return true}}};
 const win=elem();Object.assign(win,{innerWidth:width,innerHeight:800,scrollX:0,scrollY:1000,visualViewport:Object.assign(elem(),{scale:1})});
 const pref=elem();pref.matches=reduced;win.matchMedia=()=>pref;
 win.requestAnimationFrame=f=>{frames.set(++id,f);return id};win.cancelAnimationFrame=i=>frames.delete(i);
 win.scrollTo=({top})=>{win.scrollY=Math.round(top);moves.push(win.scrollY);Promise.resolve().then(()=>win.fire('scroll'))};
 const root=elem();root.scrollHeight=8000;
 const doc=elem();Object.assign(doc,{hidden:false,documentElement:root,scrollingElement:root,body:elem(),createElement:elem});
 const source=elem();source.getBoundingClientRect=()=>({left:0,top:1000-win.scrollY,bottom:2000-win.scrollY,width,height:1000});
 const target=elem();target.getBoundingClientRect=()=>({left:0,top:2080-win.scrollY,bottom:3080-win.scrollY,width,height:1000});
 const stage=elem();stage.getBoundingClientRect=()=>({left:0,top:1000-win.scrollY,bottom:1000+width*1.5-win.scrollY,width,height:width*1.5});
 const image=elem();Object.assign(image,{complete:true,naturalWidth:100,decode:()=>Promise.resolve()});
 const status=elem();
 doc.querySelector=s=>({'#our-story':edge===2?source:null,'#celebration':edge===2?target:source,'#wedding-invitation':edge===3?target:null,'#our-story .reference-art':stage,'.rig-source':image,'.head-source':image,'[data-camera-status]':status,'.image-cover img':image}[s]||null);
 doc.querySelectorAll=s=>s==='.reference-art'?[stage]:[];
 const noOp=()=>{};
 Object.assign(win,{WeddingPageTurn:{actorWidth:()=>70},WeddingCameraMath:{PHOTO_SCALE:1.7,PHOTO_RISE:-10,makePlan:()=>({g:{}}),sample:t=>({print:Math.min(t/2000,1),caption:Math.min(t/2000,1),names:Math.min(t/2000,1),press:0,flash:0,lensFlash:0,photoScale:t>=2000?1.7:1,photoRise:-10,cameraHide:t>=2000?1:0,done:t>=2000})},WeddingCharacterRig:{create:()=>({paint:noOp,clear:noOp})},WeddingInstantPaper:{create:()=>({paint:noOp,clear:noOp,prepare:noOp})},WeddingStarTrail:{create:()=>({update:noOp,clear:noOp})}});
 const context={window:win,document:doc,location:{hash:''},Event:class{constructor(type){this.type=type}},CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail}},setTimeout:(f,ms)=>{timers.set(++id,{f,at:now+ms});return id},clearTimeout:i=>timers.delete(i),console};
 const ctx=vm.createContext(context);
 vm.runInContext(bundle.slice(0,bundle.indexOf('/* Source: page-media.js */')),ctx);
 Object.assign(win,{WeddingCharacterRig:{create:()=>({paint:noOp,clear:noOp})},WeddingInstantPaper:{create:()=>({paint:noOp,clear:noOp,prepare:noOp})},WeddingStarTrail:{create:()=>({update:noOp,clear:noOp})}});
 vm.runInContext(edge===2?(legacy?previousHandoff:secondHandoff):thirdHandoff,ctx);
 doc.addEventListener(edge===2?'camera-story-complete':'memory-story-complete',e=>completions.push({at:now,reason:e.detail?.reason}));
 const flush=async()=>{for(let i=0;i<12;i++)await Promise.resolve()};
 if(edge===2){vm.runInContext(legacy?previousCamera:camera,ctx);await flush();if(!reduced){assert(win.WeddingCameraStory.ready);assert(win.WeddingCameraStory.start());}}
 else doc.dispatchEvent(new context.CustomEvent('memory-story-complete',{detail:{reason:'finished'}}));
 async function advance(ms){const end=now+ms;while(now<end){now=Math.min(end,now+frameStep);for(const [i,t]of [...timers])if(t.at<=now){timers.delete(i);t.f()}const work=[...frames.values()];frames.clear();work.forEach(f=>f(now));await flush()}}
 return {win,doc,stage,status,moves,completions,advance,duration:win.WeddingCameraMath.DURATION,get now(){return now},get pendingFrames(){return frames.size}};
}

(async()=>{
 const legacy=await fixture(2,{legacy:true});await legacy.advance(500);legacy.win.innerHeight=850;legacy.win.fire('resize');await legacy.advance(legacy.duration+3500);
 assert.equal(legacy.completions[0].reason,'cancelled');assert.equal(legacy.stage.style['--names-alpha'],'1');assert.equal(legacy.moves.length,0,'previous version visibly completes but never scrolls');
 for(const width of [320,390,430])for(const frameStep of [8,16,32])for(const phase of ['camera','hold','scroll']){
  const f=await fixture(2,{width,frameStep});
  const at=phase==='camera'?500:phase==='hold'?f.duration+400:f.duration+1700;
  await f.advance(at);const captionsBefore=f.stage.style['--caption-alpha'];
  f.win.innerHeight=phase==='hold'?650:900;f.win.scrollY+=3;
  // Check scroll-before-resize and resize-before-scroll event ordering.
  if(frameStep===16){f.win.fire('scroll');f.win.fire('resize');}else{f.win.fire('resize');f.win.fire('scroll');}
  f.win.visualViewport.fire('resize');
  if(phase==='camera'){assert(f.win.WeddingCameraStory.active,'height-only changes do not settle camera early');assert.equal(f.completions.length,0);assert.equal(f.stage.style['--caption-alpha'],captionsBefore);}
  await f.advance(f.duration+3500);assert.equal(f.completions.length,1);assert.equal(f.completions[0].reason,'finished');
  assert(f.completions[0].at>=f.duration,'full actual camera animation duration retained');assert.equal(f.stage.style['--names-alpha'],'1');assert.equal(f.win.scrollY,2080);assert.equal(f.pendingFrames,0);
 }
 for(const change of ['width','pinch','background','large-scroll'])for(const phase of ['camera','hold','scroll']){
  const f=await fixture();await f.advance(phase==='camera'?500:phase==='hold'?f.duration+400:f.duration+1700);
  if(change==='width'){f.win.innerWidth=800;f.win.fire('resize');}
  if(change==='pinch'){f.win.fire('touchstart',{touches:[{},{}]});f.win.visualViewport.scale=1.2;f.win.visualViewport.fire('resize');}
  if(change==='background'){f.doc.hidden=true;f.doc.fire('visibilitychange');}
  if(change==='large-scroll'){f.win.scrollY+=100;f.win.fire('scroll');}
  const moves=f.moves.length;await f.advance(f.duration+3500);assert.equal(f.moves.length,moves,change+' still cancels '+phase);assert.equal(f.pendingFrames,0);
 }
 for(const type of ['wheel','touchstart','touchmove','pointerdown','keydown'])for(const phase of ['camera','hold','scroll']){
  const f=await fixture();await f.advance(phase==='camera'?500:phase==='hold'?f.duration+400:f.duration+1700);
  f.win.fire(type,{key:'ArrowDown',cancelable:true,preventDefault(){}});const moves=f.moves.length;await f.advance(f.duration+3500);assert.equal(f.moves.length,moves,'manual '+type+' stops auto in '+phase);
 }
 const cumulative=await fixture();await cumulative.advance(500);
 for(let i=0;i<3;i++){cumulative.win.scrollY+=3;cumulative.win.fire('scroll');}
 await cumulative.advance(cumulative.duration+3500);assert.equal(cumulative.completions[0].reason,'cancelled','tolerance is absolute, not unlimited accumulating drift');assert.equal(cumulative.moves.length,0);
 const natural=await fixture();await natural.advance(natural.duration+200);const doneAt=natural.completions[0].at;
 await natural.advance(doneAt+999-natural.now);assert.equal(natural.moves.length,0,'exact full 1s hold after actual completion');
 await natural.advance(750);assert(natural.win.scrollY>1000&&natural.win.scrollY<2080);
 await natural.advance(1000);assert.equal(natural.win.scrollY,2080);
 const count=natural.moves.length;natural.win.fire('scroll');natural.doc.fire('camera-story-complete',{detail:{reason:'finished'}});await natural.advance(5000);assert.equal(natural.moves.length,count,'one shot');
 const reduced=await fixture(2,{reduced:true});await reduced.advance(15000);assert.equal(reduced.moves.length,0);
 for(const at of [500,1700]){const f=await fixture(3);await f.advance(at);f.win.innerHeight=850;f.win.scrollY+=3;f.win.fire('resize');f.win.fire('scroll');await f.advance(3000);assert.equal(f.win.scrollY,2080,'third-to-fourth tolerates the same height and 3px layout drift');}
 console.log('PASS: old mobile failure reproduced; actual bundled camera math -> natural completion -> 1s hold -> third page. 27 width/frame/phase cases; both resize/scroll orderings; no premature completion; finite scroll; fourth-page drift case; one shot.');
 console.log('PASS: manual touch/wheel/key/pointer, pinch, orientation, >8px movement, background and reduced motion keep cancellation behavior. No browser/device verification claimed.');
})().catch(e=>{console.error(e);process.exitCode=1});
