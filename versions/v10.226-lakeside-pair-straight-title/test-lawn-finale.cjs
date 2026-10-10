const assert=require('node:assert/strict'),fs=require('node:fs');
const {fixture,plan}=require('./test-timeline.cjs');
const css=fs.readFileSync(__dirname+'/lawn-finale.css','utf8');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
assert(css.includes('aspect-ratio:auto')&&css.includes('object-fit:contain'));
assert(!css.includes('object-fit:cover')&&!css.includes('aspect-ratio:4/5'),'no cropping');
assert(css.includes('#celebration>.wedding-finale.finale-expanded'),'escape the masked timeline, but never the story page');
assert(css.includes('pointer-events:none'),'native scroll and gestures pass through the portrait');
const source=fs.readFileSync(__dirname+'/memory.js','utf8');
assert(source.includes('page.append(finalPhoto)')&&!source.includes('cloneNode'),'move the original loaded image, not a second copy');
const shape=f=>{
 const width=parseFloat(f.final.style['--finale-width']),left=parseFloat(f.final.style['--finale-left']),top=parseFloat(f.final.style['--finale-top']);
 return {width,left,top,height:(width-16)*1280/854+28};
};
function safe(f){
 const r=shape(f),angle=Math.PI/180;
 const rw=r.width*Math.cos(angle)+r.height*Math.sin(angle),rh=r.height*Math.cos(angle)+r.width*Math.sin(angle);
 assert(r.left-(rw-r.width)/2>=8&&r.left+r.width+(rw-r.width)/2<=f.page.clientWidth-8,'tilted frame fits page width');
 assert(r.top-(rh-r.height)/2>=8&&r.top+r.height+(rh-r.height)/2+12<=f.page.clientHeight-8,'full image, frame and reveal motion fit page height');
 assert(r.height<=Math.min(f.page.clientHeight,f.win.visualViewport.height)-64+1e-6);
 return r;
}
async function main(){
 const settings=[
  {paperWidth:320,paperHeight:480,screenHeight:640,introHeight:230},
  {paperWidth:390,paperHeight:585,screenHeight:844,introHeight:280},
  {paperWidth:430,paperHeight:645,screenHeight:932,introHeight:300},
  {paperWidth:768,paperHeight:1152,screenHeight:900},
  {paperWidth:1000,paperHeight:1500,screenHeight:900},
  {paperWidth:844,paperHeight:600,screenHeight:390,introHeight:150}
 ];
 for(const options of settings){
  const f=await fixture(options),intro=f.intro.getBoundingClientRect(),port=f.port.getBoundingClientRect(),image=f.final.querySelector('img[data-media-src]');
  await f.to(plan.finalPhotoStart-100);
  assert.equal(f.final.parentNode,f.nodes.at(-1),'entire timeline is untouched until the finale');
  assert(!f.final.classList.contains('finale-expanded'));
  await f.to(plan.finalPhotoStart+650);
  assert.equal(f.final.parentNode,f.page);assert.equal(f.final.scrollParent,null,'no timeline clipping');
  assert.equal(f.final.querySelector('img[data-media-src]'),image,'no extra image request or changed photo');
  assert(f.final.classList.contains('revealed'));assert(f.final.style.opacity>0&&f.final.style.opacity<1,'original fade progresses');
  const r=safe(f);
  const priorWidth=Math.max(32,Math.min(options.paperWidth*.9,(Math.max(60,Math.min(options.paperHeight,options.screenHeight)-64)-28)*854/1280+16));
  assert(Math.abs(r.width-priorWidth*.94*.95)<1e-6,'full frame is exactly 5% narrower than V10.222');
  assert(Math.abs(r.left+r.width/2-options.paperWidth/2)<1e-6,'photo stays horizontally centered');
  assert(Math.abs(r.top+r.height/2-Math.min(options.paperHeight,options.screenHeight)/2)<1e-6,'photo stays centered within the visible page');
  if(options.paperWidth<=430){
   const old=Math.min(.96*f.port.clientWidth,(f.port.clientHeight-76)*.8+16);
   assert(r.width>old*1.5,'whole frame is clearly larger on phones, not only a cropped face');
  }
  await f.to(plan.end+300);
  assert.equal(f.section.dataset.storyPhase,'complete');assert.equal(f.final.style.opacity,'1');
  assert.equal(f.page.children.filter(el=>el===f.final).length,1,'only one full-photo layer');
  assert.equal(f.page.clientHeight,options.paperHeight);assert.deepEqual(f.intro.getBoundingClientRect(),intro);
  assert.deepEqual(f.port.getBoundingClientRect(),port);assert.equal(f.scrolled.length,0,'no outer-page jump');
  f.page.clientWidth=Math.min(options.paperWidth,375);f.previous.height=640;f.win.visualViewport.height=667;
  f.win.fire('resize');safe(f);assert.equal(f.final.parentNode,f.page,'resizing completed finale keeps the full image safe');
  f.win.scrollY=120;f.win.fire('pageshow');safe(f);
 }
 const reduced=await fixture({reduced:true});await reduced.to(100);
 assert.equal(reduced.final.parentNode,reduced.nodes.at(-1));assert(!reduced.final.classList.contains('finale-expanded'));
 const mid=await fixture();await mid.to(plan.finalPhotoStart+700);mid.media.matches=true;mid.media.fire('change');
 assert.equal(mid.final.parentNode,mid.nodes.at(-1));assert(!mid.final.classList.contains('finale-expanded'),'reduced motion restores readable inline fallback');
 const broken=await fixture({broken:true});await broken.to(plan.end+300);
 assert.equal(broken.final.parentNode,broken.nodes.at(-1),'failed image stays inline with the retry control');
 const button=broken.final.querySelector('button');assert(button);
 broken.final.querySelector('img[data-media-src]').fail=false;button.fire('click');await broken.advance(100);
 assert(button.removed);assert.equal(broken.final.parentNode,broken.page);safe(broken);
 assert(html.includes('<script src="memory.js" defer></script>'));
 console.log('PASS: full original image + larger frame; page-level lift only at finale; 6 phone/desktop layouts; fade, resize, manual scrolling, reduced-motion and failed-image retry; comic/page/timeline dimensions preserved. Mock DOM + analytical geometry, not browser screenshots.');
}
main().catch(error=>{console.error(error);process.exitCode=1});
