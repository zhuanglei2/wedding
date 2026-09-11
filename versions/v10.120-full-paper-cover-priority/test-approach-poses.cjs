const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const math=require('../v10.104-cover-first-paint/page-turn-math.js');
const bridge=require('./handoff-math.js'),camera=require('./camera-story-math.js');
const previous=require('../v10.117-once-camera-flight/handoff-math.js');
const oldCamera=require('../v10.117-once-camera-flight/camera-story-math.js');
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
for(const width of [320,375,390,430,760,1000])for(const height of [568,700,844,1100]){
  const g={width,height,left:20,viewportWidth:width+40,actorWidth:math.actorWidth(width),storyHeight:width*1.5,storyTop:Math.max(0,(height-width*1.5)/2)};
  const f=bridge.makeFlight(math,camera,g),plan=camera.makePlan(math,g,f.view.rect,bridge.actorsAt(3800,f),f);
  for(const i of [0,1]){
    for(let t=f.lanes[i].releaseTime+300;t<=f.lanes[i].arrival;t+=10){
      const a=bridge.actorsAt(t,f)[i];
      assert.ok(Math.abs(a.freeArm-plan.docks[i].freeArm)<1e-9,'Working hand remains tucked during ALL flight');
      assert.ok(Math.abs(a.arm-plan.docks[i].arm)<1e-9,'Released hand folds, not reaching ahead');
      assert.equal(a.cameraYaw,0,'No sideways button pose while travelling');
    }
    const early=bridge.actorsAt(f.lanes[i].releaseTime+700,f)[i],dock=bridge.actorsAt(f.lanes[i].arrival,f)[i];
    assert.ok(early.lean-dock.lean>12,'Visible bank then braking through body');
    assert.ok(Math.abs(early.spineAngle-dock.spineAngle)>3,'Upper body follows flight');
    assert.ok(Math.abs(early.clothLag-dock.clothLag)>3,'Cloth follows, then settles');
  }
  for(let t=500;t<=1380;t+=10){
    const a=camera.sample(t,plan).actors[0];
    assert.ok(distance(camera.center(a),camera.center(plan.press))<1e-7,'Arrival completes before operation');
    if(t<=720){assert.equal(a.cameraYaw,0);assert.equal(a.lean,plan.docks[0].lean)}
    if(t<=1020)assert.equal(a.freeArm,plan.docks[0].freeArm,'No anticipatory arm extension');
    assert.equal(camera.sample(t,plan).flash,0);assert.equal(camera.sample(t,plan).press,0);
  }
  const oldFlight=previous.makeFlight(math,oldCamera,g);
  assert.ok(previous.actorsAt(3800,oldFlight)[0].freeArm>bridge.actorsAt(3800,f)[0].freeArm+30,'Working arm differs visibly from V117');
  assert.ok(distance(camera.hand(camera.sample(1150,plan).actors[0],true),plan.shutter)>g.actorWidth*.1,'Reach is not already completed on arrival');
  assert.ok(distance(camera.hand(camera.sample(1380,plan).actors[0],true),plan.shutter)<1e-7,'Real hand contact only after reach');
  assert.ok(bridge.TURN_START-bridge.ARRIVE[0]>=200,'Readable stopped beat');
  assert.ok(1450-bridge.CONTACT_AT>=60,'Contact before push and flash');
}
// Capture transforms issued by the existing production rig, not just helper
// values. This is draw-command verification, NOT browser/pixel visual QA.
function renderer(){
  let matrix=[1,0,0,1,0,0],stack=[],draws=[];
  function multiply(b){const a=matrix;matrix=[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]]}
  const ctx={save(){stack.push([...matrix])},restore(){matrix=stack.pop()},translate(x,y){multiply([1,0,0,1,x,y])},scale(x,y){multiply([x,0,0,y,0,0])},
    rotate(r){multiply([Math.cos(r),Math.sin(r),-Math.sin(r),Math.cos(r),0,0])},transform(...v){multiply(v)},setTransform(...v){matrix=v},
    clearRect(){},beginPath(){},ellipse(){},clip(){},rect(){},drawImage(image,...args){draws.push({args,matrix:[...matrix]})}};
  const win={devicePixelRatio:1};
  vm.runInNewContext(fs.readFileSync(__dirname+'/../v10.112-camera-story/character-rig.js','utf8'),{window:win});
  const rig=win.WeddingCharacterRig.create({getContext:()=>ctx},{},math,{});
  return{paint(actor,g){draws=[];rig.paint({actors:[actor]},g);return draws}};
}
const g={width:390,height:844,left:0,viewportWidth:390,actorWidth:math.actorWidth(390),storyHeight:585};
const f=bridge.makeFlight(math,camera,g),plan=camera.makePlan(math,g,f.view.rect,bridge.actorsAt(3800,f),f),render=renderer();
function headAngle(a){const body=render.paint(a,g).filter(d=>d.args[0]===90&&d.args[1]===8).at(-1);return Math.atan2(body.matrix[1],body.matrix[0])*180/Math.PI}
const cruise=bridge.actorsAt(2800,f)[0],dock=camera.sample(500,plan).actors[0],turned=camera.sample(1020,plan).actors[0];
assert.ok(Math.abs(headAngle(cruise)-headAngle(dock))>12,'Rendered intact head/collar actually tilts with torso');
assert.ok(Math.abs(headAngle(dock)-headAngle(turned))>10,'Rendered turn is not an unused head flag');
for(const t of [500,720,1020,1150,1250,1380,1450,1600]){
  const a=camera.sample(t,plan).actors[0];
  const handDraw=render.paint(a,g).filter(d=>d.args[0]===1050&&d.args[1]===191).at(-1),m=handDraw.matrix;
  const renderedHand={x:m[2]*65+m[4],y:m[3]*65+m[5]};
  assert.ok(distance(renderedHand,camera.hand(a,true))<1e-7,'Actual limb transform agrees with contact geometry');
}
console.log('PASS: 24 sizes: arms tucked throughout flight, body/cloth braking, 220ms settled beat, turn before reach, contact before press. Production rig draw transforms confirm torso tilt and actual shutter hand.');
