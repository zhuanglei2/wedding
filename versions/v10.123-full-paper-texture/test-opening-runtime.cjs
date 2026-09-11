const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const math=require('../v10.104-cover-first-paint/page-turn-math.js');
const bridge=require('./handoff-math.js'),camera=require('./camera-story-math.js');
async function setup(options={}){
  const events={},queue=new Map(),timers=new Map(),calls={draws:[],clears:[],scrolls:[],configured:0,handOffs:0};let id=0,win;
  class El{
    constructor(){
      this.events={};this.values={};this.attrs={};this.children=[];this.classes=new Set();
      this.classList={add:n=>this.classes.add(n),remove:n=>this.classes.delete(n),contains:n=>this.classes.has(n)};
      this.style={setProperty:(k,v)=>{this.values[k]=v},removeProperty:k=>{delete this.values[k]}};
      this.complete=true;this.naturalWidth=1000;this.offsetHeight=914;this.clientWidth=390;
    }
    addEventListener(k,fn){(this.events[k]||=[]).push(fn)}
    emit(k,e={}){for(const fn of this.events[k]||[])fn(e)}
    setAttribute(k,v){this.attrs[k]=v}getAttribute(k){return this.attrs[k]||null}
    append(...nodes){this.children.push(...nodes)}appendChild(node){this.children.push(node)}
    querySelector(){return this.image}focus(){this.focused=true}
    decode(){return options.broken?Promise.reject(Error('asset unavailable')):Promise.resolve()}
    getBoundingClientRect(){return{left:options.left||0,top:-win.scrollY,width:this.clientWidth,height:this.offsetHeight,bottom:this.offsetHeight-win.scrollY}}
  }
  const root=new El(),body=new El(),reduce=new El();reduce.matches=!!options.reduce;
  const nodes={};for(const k of ['.opening-sequence','.turn-sheet','.image-cover','.page-turn-stars','#our-story','.cover-enter','.rig-source','.head-source','.paper-slices','.star-trail'])nodes[k]=new El();
  const cover=nodes['.image-cover'],sequence=nodes['.opening-sequence'],stage=new El(),mirror=new El(),coverImage=new El();
  const width=options.width||390,height=options.height||844,coverHeight=options.coverHeight||914;
  sequence.clientWidth=width;cover.offsetHeight=coverHeight;cover.image=coverImage;
  stage.offsetHeight=mirror.offsetHeight=width*1.5;stage.clientWidth=mirror.clientWidth=width;
  const pageHeight=Math.max(height,width*1.5),storyTop=(pageHeight-width*1.5)/2;
  stage.offsetTop=storyTop;nodes['#our-story'].offsetHeight=pageHeight;
  const stageRect=()=>({left:options.left||0,top:coverHeight+storyTop-win.scrollY,width,height:width*1.5,bottom:coverHeight+storyTop+width*1.5-win.scrollY});
  stage.getBoundingClientRect=stageRect;
  nodes['#our-story'].getBoundingClientRect=()=>({left:options.left||0,top:coverHeight-win.scrollY,width,height:pageHeight,bottom:coverHeight+pageHeight-win.scrollY});
  nodes['#our-story'].image=stage;
  cover.getBoundingClientRect=()=>({left:options.left||0,top:-Math.min(win.scrollY,Math.max(0,coverHeight-win.innerHeight)),width,height:coverHeight});
  const media=[new El(),new El(),new El(),new El(),new El(),new El()];
  nodes['.opening-underlay img']=media[0];nodes['.image-cover img']=coverImage;
  nodes['#our-story .reference-art']=stage;
  const emit=(name,event={})=>{for(const handler of events[name]||[])handler(event)};
  win={WeddingPageTurn:math,WeddingCameraMath:camera,WeddingHandoffMath:bridge,
    innerWidth:options.viewportWidth||width,innerHeight:height,scrollY:options.scrollY||0,matchMedia:()=>reduce,
    requestAnimationFrame:fn=>{queue.set(++id,fn);return id},cancelAnimationFrame:i=>queue.delete(i),
    addEventListener:(k,fn)=>{(events[k]||=[]).push(fn)},
    scrollTo:position=>{calls.scrolls.push(position.top);win.scrollY=position.top},
    WeddingCharacterRig:{create:canvas=>options.noCanvas?null:{paint:state=>{
      const type=canvas===nodes['.page-turn-stars']?'cover':'camera';
      if(calls.throwType===type)throw Error('canvas failed');
      calls.draws.push({type,state});
    },clear:()=>calls.clears.push(canvas===nodes['.page-turn-stars']?'cover':'camera')}},
    WeddingPaperSurface:{create:()=>({configure(){calls.configured++},paint(){},clear(){}})},
    WeddingStarTrail:{create:()=>({update(){},clear(){}})}
  };
  const doc={documentElement:root,body,hidden:false,
    querySelector:key=>nodes[key]||null,querySelectorAll:key=>key==='.reference-art'?[stage,mirror]:media,
    createElement:()=>new El(),addEventListener:(k,fn)=>{(events[k]||=[]).push(fn)},dispatchEvent:e=>emit(e.type,e)};
  const context={window:win,document:doc,location:{hash:options.hash||''},Event:class{constructor(type){this.type=type}},
    setTimeout:fn=>{timers.set(++id,fn);return id},clearTimeout:i=>timers.delete(i)};
  const cameraSource=fs.readFileSync(__dirname+'/camera-story.js','utf8');
  vm.runInNewContext(cameraSource,context);
  const start=win.WeddingCameraStory.start;
  win.WeddingCameraStory.start=input=>{calls.handOffs++;calls.input=input;return start(input)};
  vm.runInNewContext(fs.readFileSync(__dirname+'/page-turn.js','utf8'),context);
  for(let n=0;n<30;n++)await Promise.resolve();
  const tick=t=>{const batch=[...queue.values()];queue.clear();for(const fn of batch)fn(t)};
  const scroll=y=>{win.scrollY=y;emit('scroll')};
  const click=()=>{let caught=false;nodes['.cover-enter'].emit('click',{preventDefault(){caught=true}});return caught};
  tick(0);
  return{win,doc,root,body,nodes,stage,mirror,reduce,queue,timers,calls,events,emit,tick,scroll,click};
}
function checkStatic(s){
  assert.ok(s.root.classes.has('turn-settled'),'One-way terminal layout');
  assert.ok(!s.root.classes.has('star-turn'));assert.ok(!s.root.classes.has('turn-playing'));
  assert.equal(s.nodes['.cover-enter'].attrs.tabindex,'-1');
  assert.equal(s.nodes['.cover-enter'].style.pointerEvents,'none');
  assert.equal(s.nodes['.turn-sheet'].values['--front-opacity'],undefined,'Opaque cover restored');
  assert.equal(s.nodes['.turn-sheet'].values['--cover-fill'],undefined);
  for(const prop of ['--turn-vh','--track-height','--sheet-height','--sheet-top','--play-sheet-top','--play-sheet-left','--play-sheet-width'])assert.equal(s.root.values[prop],undefined,prop);
}
function checkFinal(s){
  checkStatic(s);assert.equal(s.queue.size,0);assert.ok(!s.win.WeddingCameraStory.active);
  assert.ok(s.win.WeddingCameraStory.played);
  assert.equal(s.stage.values['--print-y'],'0%');assert.equal(s.stage.values['--caption-alpha'],'1');assert.equal(s.stage.values['--names-alpha'],'1');
  assert.equal(s.stage.values['--camera-hide'],'1');assert.equal(s.stage.values['--lens-flash'],'0');
  assert.equal(s.stage.values['--photo-scale'],String(camera.PHOTO_SCALE));
  assert.deepEqual(s.stage.values,s.mirror.values);
}
async function main(){
  let s=await setup();assert.ok(s.root.classes.has('star-turn'));assert.ok(s.win.WeddingCameraStory.ready);
  assert.ok(s.click());s.tick(0);s.tick(1600);
  assert.deepEqual(s.calls.scrolls,[],'No pre-animation scroll jump');
  const pending=s.queue.size;s.click();assert.equal(s.queue.size,pending);
  s.tick(bridge.COVER_DURATION);checkStatic(s);assert.equal(s.calls.handOffs,1);
  assert.ok(s.win.WeddingCameraStory.active);assert.deepEqual(s.calls.scrolls,[914]);
  assert.equal(s.calls.input.view.rect.top,129.5,'Camera handoff includes full-page vertical centering');
  const coverLast=s.calls.draws.filter(d=>d.type==='cover').at(-1).state.actors;
  const cameraFirst=s.calls.draws.filter(d=>d.type==='camera').at(-1).state.actors;
  assert.deepEqual(cameraFirst,coverLast,'Actual controllers pass identical poses');
  for(const a of cameraFirst)assert.equal(a.handhold,0);
  const coverDraws=s.calls.draws.filter(d=>d.type==='cover').length;
  // A queued final scroll event must not restart the first renderer or stop camera.
  s.emit('scroll');s.emit('pageshow');s.emit('camera-assets-ready');s.tick(3816);
  assert.ok(s.win.WeddingCameraStory.active);assert.equal(s.calls.handOffs,1);
  assert.equal(s.calls.draws.filter(d=>d.type==='cover').length,coverDraws);
  s.tick(3800+1660);assert.equal(s.body.children[0].children[2].style.opacity,'0.48');
  s.tick(3800+3800);assert.equal(s.stage.values['--names-alpha'],'0');
  s.tick(3800+camera.DURATION);checkFinal(s);
  assert.ok(s.stage.classes.has('camera-photo-settled'),'Final image has an unscaled raster layout');
  const before=s.calls.draws.length,configs=s.calls.configured;
  for(let repeat=0;repeat<4;repeat++){
    for(const y of [1900,1400,914,850,500,0,85,500,1000,1700,0]){s.scroll(y);s.tick(12000+repeat*100);checkFinal(s)}
    s.win.innerHeight-=12;s.emit('resize');s.emit('pageshow');s.emit('camera-assets-ready');
    s.reduce.matches=!s.reduce.matches;s.reduce.emit('change');
    s.click();checkFinal(s);
  }
  assert.equal(s.calls.draws.length,before,'Zero new character frames after completion');
  assert.equal(s.calls.configured,configs,'Resize does not rebuild retired paper');
  assert.equal(s.calls.handOffs,1,'No second camera start');
  let blocked=false;s.emit('touchmove',{cancelable:true,preventDefault(){blocked=true}});s.emit('wheel',{cancelable:true,preventDefault(){blocked=true}});assert.ok(!blocked,'Native gestures after completion');
  // Scroll-based initial entry, followed by actual scroll during camera: settle once.
  s=await setup();s.scroll(85);assert.ok(s.root.classes.has('turn-playing'));s.tick(0);s.tick(3800);s.scroll(1000);checkFinal(s);
  for(const y of [0,85,914,1400,0]){s.scroll(y);s.tick(5000);checkFinal(s)}
  // Fast jump to chapter or deep below the whole story must not arm a later replay.
  s=await setup();s.scroll(914);checkStatic(s);assert.ok(s.win.WeddingCameraStory.active);s.tick(0);s.tick(camera.DURATION);checkFinal(s);
  s=await setup();s.scroll(2000);checkFinal(s);s.scroll(914);checkFinal(s);s.scroll(0);checkFinal(s);
  for(const phase of ['cover','camera'])for(const action of ['Escape','Tab','visibilitychange','pagehide','orientation','reduce','error']){
    s=await setup();s.click();s.tick(0);s.tick(phase==='cover'?2000:3800);
    if(action==='Escape'||action==='Tab')s.emit('keydown',{key:action,preventDefault(){}});
    if(action==='visibilitychange'){s.doc.hidden=true;s.emit(action)}
    if(action==='pagehide')s.emit(action);
    if(action==='orientation'){s.win.innerWidth=844;s.win.innerHeight=390;s.emit('resize')}
    if(action==='reduce'){s.reduce.matches=true;s.reduce.emit('change')}
    if(action==='error'){
      s.calls.throwType=phase;s.tick(phase==='cover'?2016:3816);
    }
    checkFinal(s);s.doc.hidden=false;s.emit('pageshow');s.scroll(0);s.scroll(85);s.click();s.tick(12000);checkFinal(s);
  }
  for(const options of [{reduce:true},{broken:true},{noCanvas:true}]){
    s=await setup(options);assert.ok(!s.click());assert.equal(s.queue.size,0);assert.equal(s.stage.values['--names-alpha'],'1');assert.ok(!s.root.classes.has('turn-playing'));
  }
  s=await setup();s.click();s.tick(0);s.calls.throwType='camera';s.tick(3800);checkFinal(s);
  s=await setup();s.click();s.tick(0);s.nodes['.rig-source'].emit('error');checkFinal(s);
  for(const [width,height,coverHeight,left]of [[320,650,750,0],[390,700,914,0],[390,1000,914,0],[768,844,1800,116]])for(const fraction of [0,.5,1]){
    s=await setup({width,height,coverHeight,left,viewportWidth:width+left*2});
    const readingOffset=Math.max(0,coverHeight-height);s.win.scrollY=readingOffset*fraction;
    const initialY=s.win.scrollY;assert.ok(s.click());s.tick(0);
    assert.equal(+parseFloat(s.root.values['--play-sheet-top']),-initialY||0);
    for(const t of [16,200,1300,2600,3799]){s.tick(t);assert.equal(s.win.scrollY,initialY)}
    s.tick(3800);assert.deepEqual(s.calls.scrolls,[coverHeight]);checkStatic(s);
    s.tick(10600);checkFinal(s);s.scroll(0);s.scroll(coverHeight);checkFinal(s);
  }
  console.log('PASS: actual BOTH controllers, exactly-once full sequence, 44 return scrolls, native/jump entry, duplicate clicks, late asset/pageshow/resize events, 14 interruption cases, asset/reduced fallbacks and 12 tap crops.');
}
if(require.main===module)main().catch(error=>{console.error(error);process.exitCode=1});
module.exports={setup,checkStatic,checkFinal};
