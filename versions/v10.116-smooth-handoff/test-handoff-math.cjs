const assert=require('node:assert/strict'),fs=require('node:fs'),bridge=require('./handoff-math.js');
const before=require('../v10.104-cover-first-paint/page-turn-math.js');
for(let p=0;p<=.64;p+=.001)assert.equal(bridge.actorProgress(p),p,'Do not change grip or release');
let previous=.64;
for(let p=.641;p<1;p+=.001){
 const value=bridge.actorProgress(p);assert.ok(value>previous&&value<.79);previous=value;
}
assert.ok(Math.abs(bridge.actorProgress(1)-.79)<1e-9);
const eps=1e-5;
assert.ok(Math.abs((bridge.actorProgress(.64+eps)-.64)/eps-1)<.001);
assert.ok(Math.abs((.79-bridge.actorProgress(1-eps))/eps)<.001,'End velocity matches next smooth approach');
for(const width of [320,375,390,430,760,1000])for(const viewport of [568,700,844,1100]){
 const cover=width*3282/1400,poster=width*1.5,track=cover+viewport;
 const actualHeight=viewport+track-viewport-viewport+poster;
 assert.ok(Math.abs(actualHeight-cover-poster)<1e-9,'Sequence ends at actual poster bottom, never an extra viewport');
 const view=bridge.cameraView({width,height:viewport,left:12,viewportWidth:width+24,actorWidth:before.actorWidth(width),storyHeight:poster});
 assert.equal(view.rect.height,poster);assert.equal(view.rect.top,0);
}
const html=fs.readFileSync(__dirname+'/index.html','utf8');
assert.match(html,/margin-top:calc\(-1 \* var\(--turn-vh\)\);min-height:0;background:#f8f5ef/);
assert.doesNotMatch(html,/reference-party\{[^}]*min-height:(?:var\(--turn-vh\)|100svh)/);
console.log('PASS: release-safe continuous actor retiming, matched arrival velocity and natural page flow across 24 sizes.');
