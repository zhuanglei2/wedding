const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const math=require('../v10.104-cover-first-paint/page-turn-math.js'),story=require('./camera-story-math.js');
for(const width of [320,375,390,430,760,1000])for(const height of [568,700,844,1100]){
  const g={width,height,left:20,viewportWidth:width+40,actorWidth:math.actorWidth(width)};
  const rect={left:20,top:0,width,height:width*1.5};
  const starts=math.sample(.79,g).actors,plan=story.makePlan(math,g,rect,starts);
  const first=story.sample(0,plan);
  for(const i of [0,1])assert.ok(Math.hypot(first.actors[i].x-starts[i].x,first.actors[i].y-starts[i].y)<1e-7,'Handoff is position-continuous');
  for(let t=0;t<=story.DURATION;t+=10){
    const s=story.sample(t,plan);
    const finite=value=>{if(typeof value==='number')assert.ok(Number.isFinite(value));else if(value&&typeof value==='object')Object.values(value).forEach(finite)};finite(s);
    if(t<=story.FOCUS_END){assert.equal(s.caption,0);assert.equal(s.names,0);}
    if(t<=story.PRINT_END){assert.equal(s.focus,0);assert.equal(s.cameraHide,0);assert.equal(s.photoScale,1);}
    if(s.focus>0)assert.equal(s.print,1,'Enlarge only AFTER full print');
    if(s.caption>0||s.names>0){assert.equal(s.print,1);assert.equal(s.focus,1,'Text only AFTER enlargement settles');}
    if(t>=2650&&t<4700){
      const a=s.actors[0].joinedHand,b=s.actors[1].joinedHand;
      assert.ok(Math.hypot(a.x-b.x,a.y-b.y)<1e-7,'Hands never split during shared departure');
    }
    if(t>=1350&&t<=1450){
      const hand=story.hand(s.actors[0],true);
      assert.ok(Math.hypot(hand.x-plan.shutter.x,hand.y-plan.shutter.y)<1e-7,'Paw really touches shutter');
    }
    assert.ok(s.flash>=0&&s.flash<=story.FLASH_PEAK);
    assert.ok(s.lensFlash>=0&&s.lensFlash<=.98);
    // Geometry of the actual scaled card (percent of poster, not a helper).
    const halfWidth=17*s.photoScale,halfHeight=6.85*s.photoScale,cy=66.45+s.photoRise;
    assert.ok(50.5-halfWidth>0&&50.5+halfWidth<100,'Card stays horizontally inside poster');
    assert.ok(cy-halfHeight>39,'Title is never covered');
    assert.ok(cy+halfHeight<76,'Caption zone stays clear');
    // Uniform wrapper scale does not change photograph aspect ratio or crop.
    assert.ok(Math.abs((28.4*s.photoScale)/(12.2*s.photoScale)-28.4/12.2)<1e-12);
  }
  for(const boundary of [1150,1350,1450,1760,1950,2650,2850,4500]){
    const before=story.sample(boundary-.001,plan),after=story.sample(boundary+.001,plan);
    for(const i of [0,1])assert.ok(Math.hypot(before.actors[i].x-after.actors[i].x,before.actors[i].y-after.actors[i].y)<.05,'Continuous choreography at '+boundary);
  }
  const last=story.sample(story.DURATION,plan);
  assert.equal(last.print,1);assert.equal(last.caption,1);assert.equal(last.names,1);assert.equal(last.focus,1);assert.equal(last.photoScale,story.PHOTO_SCALE);assert.equal(last.cameraHide,1);assert.equal(last.lensFlash,0);assert.equal(last.flash,0);assert.equal(last.opacity,0);
  assert.deepEqual(story.sample(2500,plan),story.sample(2500,plan),'Seekable deterministic sample');
}
for(const file of ['index.html','preview.html']){
  const html=fs.readFileSync(path.join(__dirname,file),'utf8');
  assert.match(html,/camera-pending/);assert.match(html,/camera-print-clip/);assert.match(html,/camera-caption/);assert.match(html,/camera-names/);
  assert.doesNotMatch(html,/music-player/);
  for(const [,src]of html.matchAll(/(?:src|href|data-src)="([^"#]+)"/g)){
    if(/^(https?:|data:)/.test(src))continue;
    assert.ok(fs.existsSync(path.resolve(__dirname,src.split('?')[0])),src);
  }
}
const controller=fs.readFileSync(path.join(__dirname,'camera-story.js'),'utf8');
for(const event of ['visibilitychange','resize','pagehide','Escape','touchmove'])assert.ok(controller.includes(event));
const photo=fs.readFileSync(path.join(__dirname,'../v10.106-reference-party/couple-original.jpg'));
assert.equal(crypto.createHash('sha256').update(photo).digest('hex'),'39e6248100d2e1b8eb3ca2cc39af61c0799f76d3211192e31fb3efa7a072040a');
const plan=story.makePlan(math,{width:390,height:844,left:0,actorWidth:math.actorWidth(390)},{left:0,top:0,width:390,height:585});
assert.ok(story.sample(1580,plan).lensFlash>0);assert.equal(story.sample(1580,plan).flash,0,'Lens lights before screen');
assert.equal(story.sample(1660,plan).flash,.48,'One clear screen peak, three times V112 opacity');
let lit=false,runs=0;
for(let t=0;t<story.DURATION;t++){
 const on=story.sample(t,plan).flash>0;
 if(on&&!lit)runs++;lit=on;
}
assert.equal(runs,1,'Never a repeated strobe');
const css=fs.readFileSync(path.join(__dirname,'camera-story.css'),'utf8');
assert.match(css,/transform-origin:50\.5% 66\.45%/);
assert.match(css,/scale\(var\(--photo-scale\)\)/);
assert.match(css,/prefers-reduced-motion:reduce/);
for(const [,src]of css.matchAll(/url\("([^"]+)"\)/g))assert.ok(fs.existsSync(path.resolve(__dirname,src)),src);
console.log('PASS: 24 viewport geometries, continuous handoff/flight, shutter contact, held-hand departure, single stronger lens/screen flash, print-before-focus-before-copy, enlargement bounds/ratio, original photo intact and resources.');
