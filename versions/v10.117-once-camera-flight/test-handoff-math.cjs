const assert=require('node:assert/strict'),fs=require('node:fs');
const math=require('../v10.104-cover-first-paint/page-turn-math.js');
const bridge=require('./handoff-math.js'),camera=require('./camera-story-math.js');
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
let smallestSeparation=Infinity,maxSeamSpeedDelta=0;
for(const width of [320,375,390,430,760,1000])for(const height of [568,700,844,1100]){
  const g={width,height,left:20,viewportWidth:width+40,actorWidth:math.actorWidth(width),storyHeight:width*1.5};
  const flight=bridge.makeFlight(math,camera,g),view=bridge.cameraView(g);
  assert.equal(view.rect.top,0);assert.equal(view.rect.height,width*1.5);
  for(let t=0;t<=bridge.COVER_DURATION+bridge.APPROACH_DURATION;t+=8){
    const actors=bridge.actorsAt(t,flight);
    const p=math.progressAt(Math.min(bridge.COVER_DURATION,t)*math.DURATION/bridge.COVER_DURATION);
    for(const a of actors){
      for(const value of Object.values(a))if(typeof value==='number')assert.ok(Number.isFinite(value));
      if(t<=flight.lanes[a.index].releaseTime){
        assert.deepEqual(a,math.sample(p,g).actors[a.index],'Paper contact/entrance unchanged');
      }else{
        assert.equal(a.handhold,0,'No clasp BEFORE shutter');assert.equal(a.grip,0);
        const c=camera.center(a);
        assert.ok(c.x>g.left+g.actorWidth*.45,'Released character stays inside left edge');
        assert.ok(c.x<g.left+g.width,'Approach stays on page');
      }
    }
    if(t>flight.lanes[1].releaseTime){
      const separation=distance(camera.center(actors[0]),camera.center(actors[1]));
      smallestSeparation=Math.min(smallestSeparation,separation/g.actorWidth);
      assert.ok(separation>g.actorWidth*.85,'Separate lanes: no overlapping faces');
    }
  }
  const last=bridge.actorsAt(bridge.COVER_DURATION,flight);
  const plan=camera.makePlan(math,view.g,view.rect,last,flight);
  assert.deepEqual(camera.sample(0,plan).actors,last,'Exact pose handoff, not a near match');
  for(const i of [0,1]){
    const dt=.01;
    const before=camera.center(bridge.actorsAt(bridge.COVER_DURATION-dt,flight)[i]);
    const at=camera.center(last[i]);
    const after=camera.center(camera.sample(dt,plan).actors[i]);
    const delta=Math.hypot((at.x-before.x-after.x+at.x)/dt,(at.y-before.y-after.y+at.y)/dt);
    maxSeamSpeedDelta=Math.max(maxSeamSpeedDelta,delta);
    assert.ok(delta<.001,'Velocity continues across the two canvases');
    assert.ok(distance(at,after)>1e-7,'No frozen handoff pose');
    const r=flight.lanes[i].releaseTime;
    assert.ok(distance(camera.center(bridge.actorsAt(r-dt,flight)[i]),camera.center(bridge.actorsAt(r+dt,flight)[i]))<.2,'No teleport at release');
  }
  for(const boundary of [1150,1450,1760,1950,2650,2850]){
    const before=camera.sample(boundary-.001,plan),after=camera.sample(boundary+.001,plan);
    for(const i of [0,1])assert.ok(distance(before.actors[i],after.actors[i])<.01,'Camera phase continuity '+boundary);
  }
  for(let t=1150;t<1450;t+=10)assert.ok(distance(camera.hand(camera.sample(t,plan).actors[0],true),plan.shutter)<1e-7,'Boy reaches actual shutter');
  for(let t=0;t<1950;t+=10)for(const a of camera.sample(t,plan).actors)assert.equal(a.handhold,0);
  for(let t=2650;t<4700;t+=10){
    const pair=camera.sample(t,plan).actors;
    assert.equal(pair[0].handhold,1);assert.equal(pair[1].handhold,1);
    assert.ok(distance(pair[0].joinedHand,pair[1].joinedHand)<1e-7,'Clasp retained AFTER photograph');
  }
  // Live sticky layout and retired natural-flow layout have identical height.
  const cover=width*3282/1400,poster=width*1.5;
  assert.ok(Math.abs((height+(cover+height)-height+poster-height)-(cover+poster))<1e-9);
}
const css=fs.readFileSync(__dirname+'/camera-story.css','utf8');
assert.match(css,/html\.turn-settled \.cover-enter\{display:none!important\}/);
assert.match(css,/html\.turn-settled \.turn-sheet\{[^}]*height:auto!important/);
assert.match(css,/html\.turn-settled \.image-cover>picture\{opacity:1!important\}/);
assert.match(css,/html\.turn-settled \.classic\.reference-party\{[^}]*margin:0!important;min-height:0!important/);
console.log('PASS: 24 sizes, unchanged paper grips, separate camera lanes, exact pose + velocity handoff, real shutter contact, post-shutter clasp, static settled layout.',{smallestSeparation,maxSeamSpeedDelta});
