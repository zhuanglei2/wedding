const assert=require('node:assert/strict');
const math=require('./page-turn-math.js'),prior=require('../v10.102-in-place-turn/page-turn-math.js');
const screen=w=>({width:w,viewportWidth:w,height:700,left:0,actorWidth:math.actorWidth(w)});
const g=screen(390);
for(let i=0;i<=805;i++)assert.deepEqual(math.sample(i/1000,g),prior.sample(i/1000,g),'Only departure may change');
const delta=(p,i,key)=>math.sample(p,g).actors[i][key]-prior.sample(p,g).actors[i][key];
assert.ok(delta(.84,0,'lean')>9,'Boy makes a readable preparation pose');
assert.ok(Math.abs(delta(.84,1,'lean'))<1,'Girl has not made the same simultaneous bank');
assert.ok(delta(.87,1,'lean')>4,'Girl answers after the boy');
assert.ok(math.sample(.95,g).actors.every(a=>a.lean>35),'Flight has a different silhouette from standing');
assert.ok(math.sample(.86,g).actors.every(a=>Math.abs(a.clothLag)<.01),'Cloth does not lead takeoff');
assert.ok(math.sample(.95,g).actors.every(a=>a.clothLag<-6),'Hem trails after acceleration');
assert.ok(math.sample(.90,g).actors[0].kick>math.sample(.98,g).actors[0].kick+7,'One tuck resolves into extension');
for(const width of [320,390,768,1000]){
 const cfg=screen(width);
 for(let i=790;i<=1000;i++){
  const p=i/1000,pair=math.sample(p,cfg).actors;
  assert.ok(Math.hypot(pair[0].joinedHand.x-pair[1].joinedHand.x,pair[0].joinedHand.y-pair[1].joinedHand.y)<1e-7);
  for(const a of pair)assert.ok(Math.abs(a.clothLag)<=11,'No extreme garment distortion');
 }
 for(const p of [.805,.829,.869,.893,.866,.878,.879,.891,.956,.968,.969,.928,.988]){
  const a=math.sample(p-1e-6,cfg).actors,b=math.sample(p+1e-6,cfg).actors;
  for(let i=0;i<2;i++)assert.ok(Math.hypot(a[i].x-b[i].x,a[i].y-b[i].y)<.1,'No pose-boundary teleport');
 }
}
for(const p of [.82,.85,.89,.94,.99])assert.deepEqual(math.sample(p,g),math.sample(p,g),'Seek deterministic');
assert.equal(math.DURATION,prior.DURATION);
console.log('PASS: arrival/pull unchanged; boy leads, girl responds, cloth/leg follow; hand contact and continuous poses at four widths');
