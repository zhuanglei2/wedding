const assert=require('node:assert/strict'),fs=require('node:fs');
const read=f=>fs.readFileSync(__dirname+'/'+f,'utf8');
const html=read('index.html'),css=read('camera-story.css');
assert.equal((html.match(/<div class="paper-top-doodle" aria-hidden="true"><\/div>/g)||[]).length,2,'Both reveal scenes share the decoration');
assert.ok(css.startsWith(read('../v10.127-contained-paper/camera-story.css')),'Existing typography, containment and motion styling unchanged');
assert.match(css,/\.paper-top-doodle\{position:absolute;z-index:7/,'Above the paper texture, outside normal flow');
assert.match(css,/html\.cover-first \.paper-top-doodle\{background-image:none!important\}/,'Do not compete with cover loading');
assert.match(css,/background:url\("top-doodle.png"\) center\/200% auto no-repeat/);
assert.match(css,/opacity:\.88;pointer-events:none/,'Decoration cannot steal taps');
for(const file of JSON.parse(read('bundle-manifest.json')).filter(p=>!p.startsWith('../')))
 assert.equal(read(file),read('../v10.127-contained-paper/'+file),file+' unchanged');
const png=fs.readFileSync(__dirname+'/top-doodle.png');
assert.ok(png.length<150*1024,'Small independent asset');
assert.equal(png.readUInt32BE(16),2172);assert.equal(png.readUInt32BE(20),724);assert.equal(png[25],6,'RGBA PNG keeps true transparency');
for(const vw of [320,375,390,430,768,1000,1440])for(const vh of [500,700,844,932,1100]){
 const w=Math.min(vw,1000),artH=w*1.5,head=Math.max(0,(vh-artH)/2);
 const dw=Math.min(vw*.24,240),dh=dw/3.6,top=Math.max(2,(head-Math.min(vw*.06666667,66.666667))/2);
 const inkTop=top+(231/724*(dw*2/3)-(dw*2/3-dh)/2);
 const inkBottom=top+(498/724*(dw*2/3)-(dw*2/3-dh)/2);
 assert.ok(inkTop>=0,'No clipping at page top');
 assert.ok(inkBottom<head+w*90/1024-3,'Ornament stays above original title ink');
 assert.ok(dw<w,'No horizontal overflow');
}
console.log('PASS: 35 viewport geometries, identical reveal/landing decoration, title clearance, original runtime/style preservation, transparent asset and cover loading priority. No browser-pixel claim.');
