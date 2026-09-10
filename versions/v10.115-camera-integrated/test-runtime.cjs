const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),math=require('../v10.104-cover-first-paint/page-turn-math.js'),story=require('../v10.114-clean-photo-layer/camera-story-math.js');
async function setup(options={}){
  class El{
    constructor(){this.events={};this.values={};this.attrs={};this.children=[];this.style={setProperty:(k,v)=>this.values[k]=v};this.classes=new Set();this.classList={add:n=>this.classes.add(n),remove:n=>this.classes.delete(n),contains:n=>this.classes.has(n)};this.complete=true;this.naturalWidth=100;this.disabled=true;}
    addEventListener(k,fn){(this.events[k]||=[]).push(fn)}
    emit(k,e={}){for(const fn of this.events[k]||[])fn(e)}
    setAttribute(k,v){this.attrs[k]=v}getAttribute(k){return this.attrs[k]||null}hasAttribute(k){return !!this.attrs[k]}
    append(...els){this.children.push(...els)}appendChild(el){this.children.push(el)}
    getBoundingClientRect(){return{left:0,top:0,width:390,height:585,bottom:585}}
    decode(){return options.broken?Promise.reject(Error('broken')):Promise.resolve()}
  }
  const root=new El(),body=new El(),stage=new El(),mirror=new El(),rigImage=new El(),eyes=new El(),status=new El(),reduce=new El();
  reduce.matches=!!options.reduce;if(options.preview!==false)body.attrs['data-camera-preview']=true;
  const imgs=[new El(),new El(),new El(),new El(),new El(),new El()];
  const events={},queue=new Map(),timers=new Map(),draws=[];let id=0;
  const win={WeddingPageTurn:math,WeddingCameraMath:story,innerWidth:390,innerHeight:844,scrollY:0,matchMedia:()=>reduce,
    WeddingCharacterRig:{create:()=>options.noCanvas?null:{paint:s=>draws.push(s),clear(){}}},WeddingStarTrail:{create:()=>({update(){},clear(){}})},
    requestAnimationFrame:fn=>{queue.set(++id,fn);return id},cancelAnimationFrame:i=>queue.delete(i),
    addEventListener:(k,fn)=>{(events[k]||=[]).push(fn)}};
  const nodes={'.rig-source':rigImage,'.head-source':eyes,'[data-camera-status]':status,'#our-story .reference-art':stage};
  const doc={documentElement:root,body,hidden:false,querySelector:s=>nodes[s]||null,querySelectorAll:s=>s==='.reference-art'?[stage,mirror]:imgs,
    createElement:()=>new El(),addEventListener:(k,fn)=>{(events[k]||=[]).push(fn)},dispatchEvent:e=>{for(const fn of events[e.type]||[])fn(e)}};
  vm.runInNewContext(fs.readFileSync(__dirname+'/camera-story.js','utf8'),{window:win,document:doc,location:{hash:''},Event:class{constructor(type){this.type=type}},setTimeout:fn=>{timers.set(++id,fn);return id},clearTimeout:i=>timers.delete(i)});
  for(let n=0;n<15;n++)await Promise.resolve();
  const emit=(k,e={})=>{for(const fn of events[k]||[])fn(e)};
  const tick=t=>{const callbacks=[...queue.values()];queue.clear();callbacks.forEach(fn=>fn(t))};
  return{win,doc,stage,mirror,root,reduce,draws,emit,tick,queue,timers,status};
}
(async()=>{
  let s=await setup();assert.ok(s.win.WeddingCameraStory.ready);assert.ok(!s.win.WeddingCameraStory.active,'No automatic camera preview on page load');assert.ok(s.win.WeddingCameraStory.start());
  s.tick(0);s.tick(3800);assert.equal(s.stage.values['--print-y'],'0%');assert.equal(s.stage.values['--caption-alpha'],'0');assert.equal(s.stage.values['--names-alpha'],'0');
  assert.deepEqual(s.stage.values,s.mirror.values);
  s.tick(4700);assert.ok(+s.stage.values['--photo-scale']>1);assert.equal(s.stage.values['--caption-alpha'],'0');assert.equal(s.stage.values['--names-alpha'],'0');
  s.tick(5700);assert.ok(+s.stage.values['--caption-alpha']>0);assert.equal(s.stage.values['--names-alpha'],'0');assert.equal(s.stage.values['--photo-scale'],String(story.PHOTO_SCALE));
  s.tick(story.DURATION);assert.equal(s.stage.values['--names-alpha'],'1');assert.equal(s.queue.size,0);assert.ok(!s.win.WeddingCameraStory.active);
  assert.equal(s.win.WeddingCameraStory.start(),false);assert.equal(s.win.WeddingCameraStory.start({replay:true}),false,'No replay override after completion');
  s.win.WeddingCameraStory.complete();
  for(const type of ['visibilitychange','resize','pagehide','Escape','Tab','scroll','multiTouch']){
    s=await setup();assert.ok(s.win.WeddingCameraStory.start());s.tick(0);s.tick(1700);
    if(type==='visibilitychange')s.doc.hidden=true;
    if(type==='scroll')s.win.scrollY=50;
    if(type==='Escape'||type==='Tab')s.emit('keydown',{key:type});
    else if(type==='multiTouch')s.emit('touchmove',{touches:[{},{}]});
    else s.emit(type);
    assert.ok(!s.win.WeddingCameraStory.active,type);assert.equal(s.queue.size,0);assert.equal(s.stage.values['--print-y'],'0%');assert.equal(s.stage.values['--names-alpha'],'1');assert.equal(s.stage.values['--photo-scale'],String(story.PHOTO_SCALE));assert.equal(s.stage.values['--lens-flash'],'0');
  }
  for(const options of [{reduce:true},{broken:true},{noCanvas:true}]){
    s=await setup(options);assert.ok(!s.win.WeddingCameraStory.active);assert.equal(s.queue.size,0);assert.equal(s.stage.values['--names-alpha'],'1');assert.equal(s.stage.values['--camera-hide'],'1');assert.equal(s.stage.values['--photo-scale'],String(story.PHOTO_SCALE));
  }
  s=await setup({preview:false});assert.ok(!s.win.WeddingCameraStory.active);assert.ok(s.win.WeddingCameraStory.start({actors:math.sample(.79,{width:390,height:844,left:0,actorWidth:math.actorWidth(390)}).actors}));assert.equal(s.win.WeddingCameraStory.start(),false);
  let blocked=false;s.emit('touchmove',{cancelable:true,preventDefault(){blocked=true}});assert.ok(blocked);s.win.WeddingCameraStory.complete();blocked=false;s.emit('touchmove',{cancelable:true,preventDefault(){blocked=true}});assert.ok(!blocked);
  console.log('PASS: actual runtime production-only start and once-per-visit guard, synchronized layers, full-print-before-focus-before-copy and retained final zoom, interruption cleanup, error/reduced-motion fallback, duplicate click and native scroll recovery.');
})().catch(e=>{console.error(e);process.exitCode=1});
