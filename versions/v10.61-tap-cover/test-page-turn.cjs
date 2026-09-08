const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {sample}=require('./page-turn-math.js');
const geometry={width:390,height:844,left:0,viewportWidth:390,actorWidth:168,actorHeight:114};
const start=sample(0,geometry);
assert.equal(start.opacity,0);assert.equal(start.angle,0);
const arrival=sample(.20,geometry);
assert.ok(arrival.opacity>0);assert.equal(arrival.angle,0,'Stars approach before sheet moves');
for(let p=.28;p<=.8;p+=.01){
  const s=sample(p,geometry);
  assert.ok(Math.abs(s.x+geometry.actorWidth*.75-s.edge)<1e-8,'Hand/grip follows projected page edge');
  assert.ok(Math.abs(s.y+geometry.actorHeight*.55-s.gripY)<1e-8);
}
const middle=sample(.55,geometry);assert.ok(middle.angle>30&&middle.angle<90);
const end=sample(1,geometry);assert.equal(end.angle,105);assert.equal(end.opacity,0);
assert.deepEqual(sample(.55,geometry),middle,'Rewinding must reproduce same pose');
for(const width of [320,390,768,1000]) for(const height of [390,700,844,1000]){
  for(let p=0;p<=1;p+=.01) Object.values(sample(p,{...geometry,width,height})).forEach(v=>assert.ok(Number.isFinite(v)));
}
function setup(opts={}){
  const queue=new Map(),events={};let nextFrame=0;
  class El {
    constructor(){this.events={};this.values=new Map();this.style={setProperty:(k,v)=>this.values.set(k,v),removeProperty:k=>this.values.delete(k)};this.classes=new Set();this.classList={add:n=>this.classes.add(n),remove:n=>this.classes.delete(n)};this.complete=true;this.naturalWidth=1000;this.naturalHeight=680;this.offsetHeight=60;this.clientWidth=390;}
    addEventListener(k,fn){(this.events[k]||=[]).push(fn);}
    emit(k,event={}){(this.events[k]||[]).forEach(fn=>fn(event));}
    getBoundingClientRect(){return {top:-win.scrollY,left:0};}
    querySelector(){return this.image;}
    focus(){this.focused=true;}
  }
  const nodes={};
  for(const key of ['.opening-sequence','.turn-sheet','.image-cover','.page-turn-stars','#our-story','.cover-enter','.opening-underlay img'])nodes[key]=new El();
  const root=new El(),reduce=new El();reduce.matches=!!opts.reduce;
  nodes['.image-cover'].offsetHeight=914;
  nodes['.image-cover'].image=new El();nodes['.page-turn-stars'].image=new El();
  if(opts.unloaded)nodes['.page-turn-stars'].image.complete=false;
  if(opts.broken)nodes['.page-turn-stars'].image.naturalWidth=0;
  const win={WeddingPageTurn:{sample},innerHeight:844,innerWidth:390,scrollY:0,matchMedia:()=>reduce,requestAnimationFrame:fn=>{queue.set(++nextFrame,fn);return nextFrame;},cancelAnimationFrame:id=>queue.delete(id),addEventListener:(k,fn,options)=>{(events[k]||=[]).push({fn,options});},scrollTo:options=>{win.lastScroll=options;win.scrollY=options.top;}};
  const trailCalls={clears:0,updates:0};
  if(opts.trail)win.WeddingStarTrail={create:()=>({clear:()=>trailCalls.clears++,update:()=>trailCalls.updates++})};
  const doc={documentElement:root,querySelector:k=>nodes[k],addEventListener:(k,fn)=>{(events[k]||=[]).push({fn});}};
  const context={window:win,document:doc};
  vm.runInNewContext(fs.readFileSync(__dirname+'/page-turn.js','utf8'),context);
  const flush=(timestamp=0)=>{const fns=[...queue.values()];queue.clear();fns.forEach(fn=>fn(timestamp));};
  flush();
  return{nodes,win,root,reduce,queue,events,doc,trailCalls,flush,scroll:y=>{win.scrollY=y;(events.scroll||[]).forEach(e=>e.fn());flush();}};
}
let s=setup();assert.ok(s.root.classes.has('star-turn'));assert.equal(s.nodes['.page-turn-stars'].style.opacity,'0.0000');
assert.match(s.nodes['.turn-sheet'].style.transform,/rotateY\(0.0000deg\)/);
assert.ok(s.events.scroll[0].options.passive);assert.ok(s.events.wheel[0].options.passive&&!s.events.touchmove,'Never intercept reading gestures');
s.scroll(70+844*1.15*.55);assert.notEqual(s.nodes['.page-turn-stars'].style.opacity,'0.0000');
const pose=s.nodes['.turn-sheet'].style.transform;s.scroll(1100);s.scroll(70+844*1.15*.55);assert.equal(s.nodes['.turn-sheet'].style.transform,pose);
s.scroll(0);assert.equal(s.nodes['.page-turn-stars'].style.opacity,'0.0000');
let prevented=false;s.nodes['.cover-enter'].emit('click',{preventDefault:()=>{prevented=true;}});assert.ok(prevented);s.flush(0);s.flush(1300);assert.ok(s.win.scrollY>0&&s.win.scrollY<1041);
const pending=[...s.queue.keys()];s.nodes['.cover-enter'].emit('click',{preventDefault(){}});assert.deepEqual([...s.queue.keys()],pending,'Repeated click must not restart transition');
s.flush(2600);assert.equal(s.win.lastScroll.behavior,'auto');assert.equal(s.win.scrollY,70+844*1.15);assert.ok(s.nodes['#our-story'].focused);
for(const options of [{reduce:true},{unloaded:true},{broken:true}]){
  const fallback=setup(options);let intercepted=false;
  fallback.nodes['.cover-enter'].emit('click',{preventDefault(){intercepted=true;}});
  assert.equal(intercepted,false,'Keep native anchor navigation when animation unavailable');
  assert.equal(fallback.queue.size,0);
}
for(const modifier of ['ctrlKey','metaKey','shiftKey','altKey']){
  const modified=setup();let intercepted=false;
  modified.nodes['.cover-enter'].emit('click',{[modifier]:true,preventDefault(){intercepted=true;}});
  assert.equal(intercepted,false);assert.equal(modified.queue.size,0);
}
s.reduce.matches=true;s.reduce.emit('change');assert.ok(!s.root.classes.has('star-turn'));
s=setup({reduce:true});assert.ok(!s.root.classes.has('star-turn'));
s=setup({unloaded:true});assert.ok(!s.root.classes.has('star-turn'));s.nodes['.page-turn-stars'].image.complete=true;s.nodes['.page-turn-stars'].image.emit('load');s.flush();assert.ok(s.root.classes.has('star-turn'));
s=setup({broken:true});assert.ok(!s.root.classes.has('star-turn'));
s=setup();s.nodes['.opening-underlay img'].emit('error');assert.ok(!s.root.classes.has('star-turn'));
s=setup({trail:true});assert.ok(s.trailCalls.updates>0);
let cleared=s.trailCalls.clears;s.doc.hidden=true;s.events.visibilitychange[0].fn();assert.ok(s.trailCalls.clears>cleared);
cleared=s.trailCalls.clears;s.reduce.matches=true;s.reduce.emit('change');assert.ok(s.trailCalls.clears>cleared);
s=setup({trail:true});cleared=s.trailCalls.clears;s.nodes['.opening-underlay img'].emit('error');assert.ok(s.trailCalls.clears>cleared);
console.log('PASS: invitation-first, staged flight/turn/exit, grip synchronization, exact rewind, viewport math, passive gestures, cover tap, repeat-click guard, native fallback, reduced motion and asset failures');
