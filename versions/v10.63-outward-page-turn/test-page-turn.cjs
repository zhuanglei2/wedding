const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const math=require('./page-turn-math.js');
const g={width:390,height:844,left:0,viewportWidth:390,actorWidth:109.2};
assert.equal(math.sample(0,g).opacity,0);assert.equal(math.sample(1,g).opacity,0);
assert.equal(math.sample(.36,g).angle,0,'Paper waits until both hands have reached');
for(let p=.371;p<=.8;p+=.002){
  const s=math.sample(p,g);
  assert.ok(s.z>0,'Right edge must lift TOWARD viewer, not into screen');
  assert.ok(s.angle<0&&s.strips.every(strip=>strip.angle<0),'CSS rotation must match +Z bend');
  assert.ok(1-s.z/s.depth>.6,'Perspective stays away from camera plane');
  assert.ok(s.strips.every(strip=>strip.shade>=0&&strip.shade<=.32&&strip.light>=0&&strip.light<=.12&&strip.backShade>=0&&strip.backShade<=.22));
}
assert.ok(math.sample(.8,g).edge<g.left,'Page finishes to the LEFT of its hinge');
const lifted=math.sample(.55,g);
assert.ok(lifted.actors[0].scale>g.actorWidth/240,'Characters approach with lifted paper');
for(let p=.34;p<=.79;p+=.002){
  const state=math.sample(p,g);
  for(const actor of state.actors){
    assert.ok(Math.hypot(actor.hand.x-actor.target.x,actor.hand.y-actor.target.y)<1e-7,'Hand must stay attached during torso lean and paper bending');
  }
}
for(const width of [320,390,768,1000])for(const height of [390,700,844,1000])for(let p=0;p<=1;p+=.01){
  const state=math.sample(p,{...g,width,height});
  const check=v=>{if(typeof v==='number')assert.ok(Number.isFinite(v));else if(v&&typeof v==='object')Object.values(v).forEach(check);};check(state);
  state.strips.slice(1).forEach((s,i)=>{
    const previous=state.strips[i],r=previous.angle*Math.PI/180;
    assert.ok(Math.abs(s.x-previous.x-width/math.SEGMENTS*Math.cos(r))<1e-7);
    assert.ok(Math.abs(s.z-previous.z+width/math.SEGMENTS*Math.sin(r))<1e-7);
  });
}
assert.notEqual(math.sample(.08,g).actors[0].arm,math.sample(.32,g).actors[0].arm,'Actual arm articulation');
assert.notEqual(math.sample(.08,g).actors[0].kick,math.sample(.11,g).actors[0].kick,'Actual leg articulation');
assert.deepEqual(math.sample(.55,g),math.sample(.55,g),'Deterministic seek');
function setup(opts={}){
  const queue=new Map(),events={};let nextFrame=0;
  class El{
    constructor(){this.events={};this.values=new Map();this.style={setProperty:(k,v)=>this.values.set(k,v),removeProperty:k=>this.values.delete(k)};this.classes=new Set();this.classList={add:n=>this.classes.add(n),remove:n=>this.classes.delete(n)};this.complete=true;this.naturalWidth=1000;this.offsetHeight=914;this.clientWidth=390;}
    addEventListener(k,fn){(this.events[k]||=[]).push(fn);}
    emit(k,e={}){(this.events[k]||[]).forEach(fn=>fn(e));}
    querySelector(){return this.image;}
    getBoundingClientRect(){return{top:-win.scrollY,left:0};}
    focus(){this.focused=true;}
  }
  const nodes={};for(const key of ['.opening-sequence','.turn-sheet','.image-cover','.page-turn-stars','#our-story','.cover-enter','.rig-source','.opening-underlay img','.paper-slices'])nodes[key]=new El();
  nodes['.image-cover'].image=new El();
  if(opts.unloaded)nodes['.rig-source'].complete=false;
  if(opts.broken)nodes['.rig-source'].naturalWidth=0;
  const root=new El(),reduce=new El();reduce.matches=!!opts.reduce;
  const calls={rig:0,paper:0,clears:0};
  const win={WeddingPageTurn:math,WeddingCharacterRig:{create:()=>opts.noCanvas?null:{paint:()=>calls.rig++,clear:()=>calls.clears++}},WeddingPaperSurface:{create:()=>({configure(){},paint:()=>calls.paper++,clear:()=>calls.clears++})},innerHeight:844,innerWidth:390,scrollY:0,matchMedia:()=>reduce,requestAnimationFrame:fn=>{queue.set(++nextFrame,fn);return nextFrame;},cancelAnimationFrame:id=>queue.delete(id),addEventListener:(k,fn,options)=>{(events[k]||=[]).push({fn,options});},scrollTo:options=>{win.lastScroll=options;win.scrollY=options.top;}};
  const doc={documentElement:root,querySelector:k=>nodes[k],addEventListener:(k,fn)=>{(events[k]||=[]).push({fn});}};
  vm.runInNewContext(fs.readFileSync(__dirname+'/page-turn.js','utf8'),{window:win,document:doc});
  const flush=(t=0)=>{const fns=[...queue.values()];queue.clear();fns.forEach(fn=>fn(t));};flush();
  return{nodes,root,win,queue,events,reduce,doc,calls,flush};
}
let s=setup();assert.ok(s.root.classes.has('star-turn'));assert.ok(s.calls.rig&&s.calls.paper);
let intercepted=false;s.nodes['.cover-enter'].emit('click',{preventDefault(){intercepted=true;}});assert.ok(intercepted);
s.flush(0);s.flush(350);s.flush(2500);assert.ok(s.win.scrollY>70);
const pending=[...s.queue.keys()];s.nodes['.cover-enter'].emit('click',{preventDefault(){}});assert.deepEqual([...s.queue.keys()],pending);
s.flush(4950);s.flush(4966);assert.ok(s.nodes['#our-story'].focused);assert.equal(s.win.scrollY,70+844*1.15);assert.equal(s.queue.size,0);
for(const opts of [{reduce:true},{unloaded:true},{broken:true},{noCanvas:true}]){
  const f=setup(opts);let caught=false;f.nodes['.cover-enter'].emit('click',{preventDefault(){caught=true;}});
  assert.equal(caught,false);assert.ok(!f.root.classes.has('star-turn'));assert.equal(f.queue.size,0);
}
s=setup();s.nodes['.cover-enter'].emit('click',{preventDefault(){}});s.doc.hidden=true;s.events.visibilitychange[0].fn();assert.equal(s.queue.size,0);
s=setup();s.nodes['.rig-source'].emit('error');assert.ok(!s.root.classes.has('star-turn'));
s=setup();s.reduce.matches=true;s.reduce.emit('change');assert.ok(!s.root.classes.has('star-turn'));
assert.ok(s.events.scroll[0].options.passive);assert.ok(!s.events.touchmove);
console.log('PASS: articulated limbs, continuous curved paper, exact hand contact, responsive finite math, click/repeat/hide/reduced motion/asset fallback, finite completion');
