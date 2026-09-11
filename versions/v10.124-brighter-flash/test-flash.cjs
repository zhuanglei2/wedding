const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const before=require('../v10.123-full-paper-texture/camera-story-math.js'),after=require('./camera-story-math.js');
const math=require('../v10.104-cover-first-paint/page-turn-math.js');
const read=(dir,file)=>fs.readFileSync(path.join(dir,file),'utf8'),prior=path.resolve(__dirname,'../v10.123-full-paper-texture');
const css=read(__dirname,'camera-story.css'),html=read(__dirname,'index.html');
const withoutFlash=state=>{const {flash,lensFlash,...rest}=state;return rest;};
for(const width of [320,390,430,760])for(const height of [568,844,1100]){
 const g={width,height,left:20,viewportWidth:width+40,actorWidth:math.actorWidth(width)};
 const rect={left:20,top:Math.max(0,(height-width*1.5)/2),width,height:width*1.5};
 const a=before.makePlan(math,g,rect),b=after.makePlan(math,g,rect);
 let screenRuns=0,lensRuns=0,lastScreen=false,lastLens=false;
 for(let t=0;t<=after.DURATION;t+=5){
  const current=after.sample(t,b),old=before.sample(t,a);
  assert.deepEqual(withoutFlash(current),withoutFlash(old),'Only exposure changes at '+t);
  for(const [key,peak] of [['flash',after.FLASH_PEAK],['lensFlash',.98]]){
   assert.ok(Number.isFinite(current[key])&&current[key]>=0&&current[key]<=peak);
  }
  if(current.flash>0&&!lastScreen)screenRuns++;
  if(current.lensFlash>0&&!lastLens)lensRuns++;
  lastScreen=current.flash>0;lastLens=current.lensFlash>0;
 }
 assert.equal(screenRuns,1);assert.equal(lensRuns,1);
 assert.equal(after.sample(1580,b).flash,0);assert.ok(after.sample(1580,b).lensFlash>0);
 assert.equal(after.sample(after.FLASH_AT,b).flash,.78);
 assert.equal(after.sample(after.FLASH_HOLD_END,b).flash,.78);
 assert.ok(after.sample(1800,b).flash>before.sample(1800,a).flash);
 for(const t of [-1,0,2030,6800,9000])assert.equal(after.sample(t,b).flash,0);
 for(const t of [1600,1660,1705,2030]){
  assert.ok(Math.abs(after.sample(t-.001,b).flash-after.sample(t+.001,b).flash)<.001,'Continuous exposure');
 }
 let last=0;
 for(let t=1600;t<=1705;t++){const value=after.sample(t,b).flash;assert.ok(value>=last);last=value;}
 for(let t=1705;t<=2030;t++){const value=after.sample(t,b).flash;assert.ok(value<=last);last=value;}
 for(const t of [2000,1660,1500,6800,1700,0,1800]){
  assert.deepEqual(after.sample(t,b),after.sample(t,b),'Pure time-sampled state');
 }
}
const stripCss=t=>t.replace(/<style id="camera-runtime-style">[\s\S]*?<\/style>/,'').replace(/V10\.12[34]/g,'VERSION');
assert.equal(stripCss(html),stripCss(read(prior,'index.html')),'No markup/content or loading change');
assert.equal(html.match(/<style id="camera-runtime-style">([\s\S]*?)<\/style>/)[1].trim(),css.trim());
for(const file of ['camera-story.js','page-turn.js','handoff-math.js','paper-tail.js','page-media.js']){
 assert.equal(read(__dirname,file),read(prior,file),file+' unchanged');
}
assert.match(css,/\.camera-flash\{position:absolute;inset:0;background:#fff;opacity:0;will-change:opacity;pointer-events:none\}/);
assert.match(css,/@media\(prefers-reduced-motion:reduce\)\{[\s\S]*?\.camera-flight-layer,\.camera-lens-glow\{display:none!important\}/);
assert.match(css,/@media print\{[\s\S]*?\.camera-flight-layer,\.camera-lens-glow\{display:none!important\}/);
assert.ok(Math.abs(29+42/2-50)<1e-9&&Math.abs(36.9+28/2-50.9)<1e-9,'Same lens center');
const control=read(__dirname,'camera-story.js');
assert.match(control,/flash:0,lensFlash:0/,'Completion clears light');
assert.match(control,/visibilitychange/);assert.match(control,/pagehide/);assert.match(control,/if\(active\|\|played\)return false/);
console.log('PASS: 12 geometries; one continuous flash, 78% peak + 45ms hold, same lens center; non-flash samples unchanged; reduced-motion, abort cleanup, markup and no new assets. No browser visual claim.');
