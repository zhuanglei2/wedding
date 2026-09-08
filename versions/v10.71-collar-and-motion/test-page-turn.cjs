const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const math=require('./page-turn-math.js');
const g={width:390,height:844,left:0,viewportWidth:390,actorWidth:math.actorWidth(390)};
assert.equal(math.sample(0,g).opacity,0);assert.equal(math.sample(1,g).opacity,0);
assert.equal(math.sample(.33,g).angle,0,'Paper waits for the grip and anticipation beat');
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
for(let p=.30;p<=.66;p+=.002){
  const state=math.sample(p,g);
  for(const actor of state.actors){
    if(p>math.releaseAt(actor.index))continue;
    assert.ok(Math.hypot(actor.hand.x-actor.target.x,actor.hand.y-actor.target.y)<1e-7,'Hand must stay attached during torso lean and paper bending');
  }
}
for(const width of [320,390,768,1000])for(const i of [0,1]){
  const screen={...g,width,viewportWidth:width,actorWidth:math.actorWidth(width)};
  const release=math.releaseAt(i),at=math.sample(release,screen).actors[i];
  const center=math.rotate(120,170,at.lean);
  assert.ok(at.x+center.x*at.scale>0&&at.x+center.x*at.scale<width,'Release must happen visibly inside viewport');
  const before=math.sample(release-1e-6,screen).actors[i],after=math.sample(release+1e-6,screen).actors[i];
  assert.ok(Math.hypot(before.x-after.x,before.y-after.y)<.1,'No teleport on letting go');
  const flying=math.sample(release+.07,screen).actors[i];
  assert.equal(flying.grip,0);
  assert.ok(Math.hypot(flying.hand.x-flying.target.x,flying.hand.y-flying.target.y)>8,'Visible independent flight after release');
  assert.ok(Math.abs(math.sample(.82,screen).angle)>Math.abs(math.sample(release,screen).angle),'Paper keeps turning after release');
}
const old=require('../v10.63-outward-page-turn/page-turn-math.js');
assert.ok(math.sample(.12,g).actors[0].x<old.sample(.12,g).actors[0].x-50,'Early flight is clearly inside the screen, not waiting off its right edge');
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
const center=a=>{const c=math.rotate(120,170,a.lean);return{x:a.x+c.x*a.scale,y:a.y+c.y*a.scale};};
for(const width of [320,390,768,1000]){
  const screen={...g,width,viewportWidth:width,actorWidth:math.actorWidth(width)};
  assert.ok(Math.abs(screen.actorWidth/(Math.min(150,Math.max(95,width*.28)))-.85)<1e-9);
  const waitStart=center(math.sample(.72,screen).actors[0]);
  const waitEnd=center(math.sample(.78,screen).actors[0]);
  assert.ok(Math.hypot(waitStart.x-waitEnd.x,waitStart.y-waitEnd.y)<screen.actorWidth*.45,'Boy stays nearby while reaching, not flying off alone');
  const girlBefore=center(math.sample(.72,screen).actors[1]),girlAfter=center(math.sample(.78,screen).actors[1]);
  assert.ok(Math.hypot(girlBefore.x-girlAfter.x,girlBefore.y-girlAfter.y)>10,'Girl visibly catches up during wait');
  const renderedHand=(a,left)=>{
    const l=math.layouts[a.index],root=left?l.left:l.shoulder;
    const tip=math.rotate(0,l.hand,left?a.freeArm:a.arm);
    const waist=a.index===0?225:247;
    const torso=math.rotate(root.x+tip.x-120,root.y+tip.y-waist,a.spineAngle||0);
    const point=math.rotate(torso.x+120,torso.y+waist,a.lean);
    return{x:a.x+point.x*a.scale,y:a.y+point.y*a.scale};
  };
  for(let p=math.JOIN_AT;p<=1;p+=.001){
    const pair=math.sample(p,screen).actors;
    const right=renderedHand(pair[0],false),left=renderedHand(pair[1],true);
    assert.ok(Math.hypot(right.x-left.x,right.y-left.y)<1e-7,'Rendered boy right hand holds rendered girl left hand throughout flight');
    assert.equal(pair[0].handhold,1);assert.equal(pair[1].handhold,1);
  }
  assert.ok((math.DEPART_AT-math.JOIN_AT)*math.DURATION>=140,'Readable clasp before takeoff');
  const invite=math.sample(.72,screen).actors,clasp=math.sample(.79,screen).actors;
  assert.notEqual(invite[0].arm,clasp[0].arm,'Boy extends invitation hand');
  assert.notEqual(invite[1].freeArm,clasp[1].freeArm,'Girl responds with left hand');
  assert.notEqual(math.sample(.715,screen).actors[0].kick,math.sample(.755,screen).actors[0].kick,'Hover has leg articulation');
  assert.notEqual(math.sample(.85,screen).actors[0].freeArm,math.sample(.91,screen).actors[0].freeArm,'Free hand keeps moving during flight');
  for(const boundary of [.60,.64,.69,.70,.71,.735,.78,.79,.82])for(const i of [0,1]){
    const before=center(math.sample(boundary-1e-6,screen).actors[i]);
    const after=center(math.sample(boundary+1e-6,screen).actors[i]);
    assert.ok(Math.hypot(before.x-after.x,before.y-after.y)<.1,'No jump at release/meeting/departure');
  }
}
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
  const nodes={};for(const key of ['.opening-sequence','.turn-sheet','.image-cover','.page-turn-stars','#our-story','.cover-enter','.rig-source','.head-source','.opening-underlay img','.paper-slices'])nodes[key]=new El();
  nodes['.image-cover'].image=new El();
  if(opts.unloaded)nodes['.rig-source'].complete=false;
  if(opts.broken)nodes['.rig-source'].naturalWidth=0;
  if(opts.headUnloaded)nodes['.head-source'].complete=false;
  if(opts.headBroken)nodes['.head-source'].naturalWidth=0;
  const root=new El(),reduce=new El();reduce.matches=!!opts.reduce;
  const calls={rig:0,paper:0,clears:0,poses:[],configures:0};
  const win={WeddingPageTurn:math,WeddingCharacterRig:{create:()=>opts.noCanvas?null:{paint:state=>{calls.rig++;calls.poses.push(state.p);},clear:()=>calls.clears++}},WeddingPaperSurface:{create:()=>({configure(){calls.configures++;},paint:()=>calls.paper++,clear:()=>calls.clears++})},innerHeight:844,innerWidth:390,scrollY:0,matchMedia:()=>reduce,requestAnimationFrame:fn=>{queue.set(++nextFrame,fn);return nextFrame;},cancelAnimationFrame:id=>queue.delete(id),addEventListener:(k,fn,options)=>{(events[k]||=[]).push({fn,options});},scrollTo:options=>{win.lastScroll=options;win.scrollY=options.top;}};
  win.WeddingHeadMasks=opts.maskMissing?null:[];
  const doc={documentElement:root,querySelector:k=>nodes[k],addEventListener:(k,fn)=>{(events[k]||=[]).push({fn});}};
  vm.runInNewContext(fs.readFileSync(__dirname+'/page-turn.js','utf8'),{window:win,document:doc});
  const flush=(t=0)=>{const fns=[...queue.values()];queue.clear();fns.forEach(fn=>fn(t));};flush();
  return{nodes,root,win,queue,events,reduce,doc,calls,flush};
}
let s=setup();assert.ok(s.root.classes.has('star-turn'));assert.ok(s.calls.rig&&s.calls.paper);
let intercepted=false;s.nodes['.cover-enter'].emit('click',{preventDefault(){intercepted=true;}});assert.ok(intercepted);
s.flush(0);s.flush(350);s.flush(2500);assert.ok(s.win.scrollY>70);
const pending=[...s.queue.keys()];s.nodes['.cover-enter'].emit('click',{preventDefault(){}});assert.deepEqual([...s.queue.keys()],pending);
s.flush(math.DURATION+250);s.flush(math.DURATION+266);assert.ok(s.nodes['#our-story'].focused);assert.equal(s.win.scrollY,914);assert.equal(s.queue.size,0);
for(const opts of [{reduce:true},{unloaded:true},{broken:true},{noCanvas:true},{headUnloaded:true},{headBroken:true}]){
  const f=setup(opts);let caught=false;f.nodes['.cover-enter'].emit('click',{preventDefault(){caught=true;}});
  assert.equal(caught,false);assert.ok(!f.root.classes.has('star-turn'));assert.equal(f.queue.size,0);
}
s=setup();s.nodes['.cover-enter'].emit('click',{preventDefault(){}});s.doc.hidden=true;s.events.visibilitychange[0].fn();assert.equal(s.queue.size,0);
s=setup();s.nodes['.rig-source'].emit('error');assert.ok(!s.root.classes.has('star-turn'));
s=setup();s.reduce.matches=true;s.reduce.emit('change');assert.ok(!s.root.classes.has('star-turn'));
assert.ok(s.events.scroll[0].options.passive);
const emit=(s,name,event={})=>(s.events[name]||[]).forEach(({fn})=>fn(event));
s=setup();
let blocked=false;emit(s,'touchmove',{cancelable:true,preventDefault(){blocked=true;}});assert.equal(blocked,false,'Native scrolling before transition');
s.win.scrollY=85;emit(s,'scroll');assert.ok(s.root.classes.has('turn-playing'),'Scroll triggers a finite playback');
s.flush(0);s.flush(1000);
const before=s.calls.poses.at(-1);s.win.scrollY=400;emit(s,'scroll');s.flush(1500);
assert.ok(s.calls.poses.at(-1)>before,'Clock advances independently of hand scrolling');
emit(s,'touchmove',{cancelable:true,preventDefault(){blocked=true;}});assert.ok(blocked);
assert.ok(s.queue.size>0,'Touch does not cancel playback');
const configures=s.calls.configures;s.win.innerHeight=780;emit(s,'resize');
assert.equal(s.calls.configures,configures,'Browser toolbar resize cannot reset flight geometry');
s.flush(3000);s.flush(math.DURATION+250);assert.equal(s.calls.poses.at(-1),1);assert.ok(!s.root.classes.has('turn-playing'));assert.equal(s.queue.size,0);
blocked=false;emit(s,'wheel',{cancelable:true,preventDefault(){blocked=true;}});assert.equal(blocked,false,'Native scrolling restored');
s.win.scrollY=500;emit(s,'scroll');s.flush();assert.ok(!s.root.classes.has('turn-playing'),'No replay while returning through finished track');
s.win.scrollY=0;emit(s,'scroll');s.flush();assert.equal(s.calls.poses.at(-1),0);
s.win.scrollY=85;emit(s,'scroll');assert.ok(s.root.classes.has('turn-playing'),'Returning to invitation rearms transition');
emit(s,'keydown',{key:'Escape',preventDefault(){}});assert.equal(s.calls.poses.at(-1),1);assert.equal(s.queue.size,0);
for(const scenario of ['background','orientation','reduce','error']){
  s=setup();s.nodes['.cover-enter'].emit('click',{preventDefault(){}});s.flush(0);s.flush(2000);
  if(scenario==='background'){s.doc.hidden=true;emit(s,'visibilitychange');}
  if(scenario==='orientation'){s.win.innerWidth=844;s.win.innerHeight=390;emit(s,'resize');s.flush(2200);}
  if(scenario==='reduce'){s.reduce.matches=true;s.reduce.emit('change');}
  if(scenario==='error')s.nodes['.rig-source'].emit('error');
  assert.ok(!s.root.classes.has('turn-playing'),scenario+' must release gesture lock');
  assert.equal(s.queue.size,0,scenario+' must terminate finite playback');
}
console.log('PASS: waiting and paired flight, smaller actors, continuous paper/hand contact, clock-driven scroll/click, resize/hide/reduce/error escape, native scroll restored');
// Model the actual CSS flow: underlay H, track margin -H, chapter margin -H.
// Chapter top must equal the exact end of the cover, with no 0.15H spacer
// and no minimum-viewport-height padding added to a short invitation.
for(const viewport of [640,844,1024,1400])for(const coverHeight of [600,914,1800]){
  s=setup();s.win.innerHeight=viewport;s.nodes['.image-cover'].offsetHeight=coverHeight;
  emit(s,'resize');s.flush();
  const css=name=>parseFloat(s.root.values.get(name));
  assert.equal(css('--sheet-height'),coverHeight,'No padding below short cover');
  const chapterTop=css('--turn-vh')-css('--turn-vh')+css('--track-height')-css('--turn-vh');
  assert.equal(chapterTop,coverHeight,'Chapter begins exactly at cover bottom');
  assert.equal(css('--sheet-top'),-Math.max(0,coverHeight-viewport)||0,'Short cover starts at top rather than floating down');
  s.nodes['.cover-enter'].emit('click',{preventDefault(){}});
  s.flush(0);s.flush(math.DURATION+250);
  assert.equal(s.win.scrollY,chapterTop,'Finish lands at actual chapter boundary');
  assert.ok(!s.root.classes.has('turn-playing'));
}
console.log('PASS: seamless cover/chapter flow and exact landing across short/tall cover and viewport sizes');
