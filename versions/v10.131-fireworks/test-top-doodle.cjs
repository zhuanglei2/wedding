const assert=require('node:assert/strict'),fs=require('node:fs');
const read=f=>fs.readFileSync(__dirname+'/'+f,'utf8'),html=read('index.html'),css=read('camera-story.css');
assert.equal((html.match(/class="paper-top-doodle" aria-hidden="true"/g)||[]).length,2);
assert.ok(css.startsWith(read('../v10.127-contained-paper/camera-story.css')),'Original CSS preserved');
assert.ok(!css.includes('top-doodle.png'),'Old ornament replaced rather than accumulated');
assert.ok(css.includes('background:url("party-fireworks.webp") center/contain no-repeat'));
assert.ok(css.includes('right:2%')&&css.includes('pointer-events:none'));
assert.ok(css.includes('html.cover-first .paper-top-doodle{background-image:none!important}'));
for(const n of JSON.parse(read('bundle-manifest.json')).filter(n=>!n.startsWith('../')))
 assert.equal(read(n),read('../v10.128-top-doodle/'+n),n+' unchanged');
const asset=fs.readFileSync(__dirname+'/party-fireworks.webp');
assert.equal(asset.subarray(8,12).toString(),'WEBP');assert.ok(asset.length<350*1024);
let count=0;
for(const vw of [320,375,390,430,768,1000,1440])for(let head=0;head<=500;head+=2){
 const w=Math.min(vw,1000),dw=Math.max(Math.min(vw*.2,200),Math.min(head*1.45,Math.min(vw*.52,400))),dh=dw*2/3;
 const left=.98*w-dw,top=head*.15+Math.min(.005*vw,5);
 const inkLeft=left+91/1536*dw,inkBottom=top+960/1024*dh;
 assert.ok(left>=0&&left+dw<=w&&top>=0,'Contained by paper width and top');
 assert.ok(inkBottom<head+w*90/1024-3||inkLeft>w*.765,'Above title or in its right gutter');
 assert.ok(inkBottom<head+w*210/1024-3,'No collision with the red headline');
 count++;
}
console.log('PASS: '+count+' paper-head geometries, original runtime and CSS preserved, one shared static ornament, cover-first loading priority. Not a browser-pixel test.');
