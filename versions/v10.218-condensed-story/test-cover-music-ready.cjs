const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {fixture,flush,El}=require('./test-music.cjs');
const readiness=fs.readFileSync(__dirname+'/cover-music-ready.js','utf8');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
function setup({unloaded=false,slowDecode=false,decodeFails=false,hidden=false,blocked=false,empty=false,legacyDecode=false,noRAF=false}={}){
 let id=0;const frames=new Map(),timers=new Map();
 const images=empty?[]:[0,1].map(()=>{
  const image=new El();image.complete=!unloaded;image.naturalWidth=unloaded?0:1400;image.decodeCalls=0;
  image.decode=()=>{
   image.decodeCalls++;
   if(decodeFails)return Promise.reject(Error('decode failed'));
   return slowDecode?new Promise(resolve=>image.finishDecode=resolve):Promise.resolve();
  };
  if(legacyDecode)delete image.decode;
  image.load=()=>{image.complete=true;image.naturalWidth=1400;image.fire('load')};
  image.fail=()=>{image.complete=true;image.naturalWidth=0;image.fire('error')};
  return image;
 });
 const result=fixture({coverReady:false,legacyCover:false,loaded:false,hidden,blocked,beforeRuntime:({doc,win,context})=>{
  doc.querySelectorAll=selector=>{assert.equal(selector,'.image-cover picture img','only first-page assets are awaited');return images;};
  if(!noRAF){win.requestAnimationFrame=fn=>{frames.set(++id,fn);return id};win.cancelAnimationFrame=id=>frames.delete(id);}
  context.setTimeout=fn=>{timers.set(++id,fn);return id};context.clearTimeout=id=>timers.delete(id);
  vm.runInNewContext(readiness,context);
 }});
 const tick=()=>{const queue=noRAF?timers:frames,batch=[...queue.values()];queue.clear();for(const fn of batch)fn();};
 return {...result,images,frames,timers,tick};
}
async function paint(s){s.tick();s.tick();await flush();}
async function main(){
 assert(html.indexOf('src="cover-music-ready.js"')<html.indexOf('src="music.js"'));
 let s=setup();await flush();
 assert.equal(s.audio.loads,0);assert.equal(s.audio.plays.length,0,'no immediate script-load playback');
 s.tick();assert.equal(s.audio.plays.length,0,'first paint opportunity completes before playback');
 s.tick();await flush();assert.equal(s.audio.plays.length,1);assert.equal(s.audio.currentTime,50);
 assert.equal(s.player.dataset.state,'playing');assert(s.startPrompt.hidden);assert(!s.photo.complete,'no wait for second-page/lazy photos');
 assert(s.images.every(image=>image.decodeCalls===1));
 s.audio.currentTime=81;s.doc.fire('wedding-cover-ready');s.doc.fire('camera-assets-ready');s.doc.fire('camera-media-released');s.win.fire('pageshow');s.tick();await flush();
 assert.equal(s.audio.plays.length,1);assert.equal(s.audio.currentTime,81);

 s=setup({unloaded:true,slowDecode:true});await flush();assert.equal(s.frames.size,0);
 s.doc.fire('camera-media-released');s.images[0].load();await flush();s.images[0].finishDecode();await flush();
 assert.equal(s.audio.plays.length,0);assert.equal(s.frames.size,0,'both cover layers must be ready');
 s.images[1].load();await flush();assert.equal(s.audio.plays.length,0);
 s.images[1].finishDecode();await flush();s.tick();assert.equal(s.audio.plays.length,0);s.tick();await flush();
 assert.equal(s.audio.plays.length,1);assert.equal(s.audio.currentTime,50);

 s=setup({hidden:true});await flush();assert.equal(s.frames.size,0);assert.equal(s.audio.plays.length,0);
 s.doc.hidden=false;s.doc.fire('visibilitychange');await paint(s);assert.equal(s.audio.plays.length,1);
 s=setup();await flush();s.tick();s.doc.hidden=true;s.doc.fire('visibilitychange');
 assert.equal(s.frames.size,0);s.tick();assert.equal(s.audio.plays.length,0);
 s.doc.hidden=false;s.doc.fire('visibilitychange');s.tick();assert.equal(s.audio.plays.length,0);s.tick();await flush();assert.equal(s.audio.plays.length,1);

 s=setup({unloaded:true});s.icon.fire('click',{isTrusted:true});await flush();
 assert.equal(s.audio.plays.length,1,'explicit play does not forfeit gesture while waiting for images');s.audio.currentTime=65;
 s.images.forEach(image=>image.load());await flush();await paint(s);assert.equal(s.audio.plays.length,1);assert.equal(s.audio.currentTime,65);
 s=setup({unloaded:true});s.icon.fire('click',{isTrusted:true});await flush();s.icon.fire('click',{isTrusted:true});assert(s.audio.paused);
 s.images.forEach(image=>image.load());await flush();await paint(s);assert.equal(s.audio.plays.length,1);assert(s.audio.paused,'late assets do not override explicit pause');

 for(const trigger of ['bridge','click']){
  s=setup({unloaded:true});
  if(trigger==='bridge'){
   s.win.WeixinJSBridge={invoke(){throw Error('unrelated native APIs must not be called')}};
   s.doc.fire('WeixinJSBridgeReady');
  }else s.art.fire('click',{isTrusted:true});
  assert.equal(s.audio.plays.length,1,'actual '+trigger+' handler starts before image loading completes');
  assert(!s.win.WeddingCoverReady.ready);await flush();assert.equal(s.audio.currentTime,50);
  s.audio.currentTime=75;s.images.forEach(image=>image.load());await flush();await paint(s);
  assert.equal(s.audio.plays.length,1);assert.equal(s.audio.currentTime,75,'later cover notification cannot restart music');
 }

 for(const settings of [{decodeFails:true},{empty:true},{unloaded:true}]){
  s=setup(settings);if(settings.unloaded)s.images[0].fail();await flush();await paint(s);
  assert.equal(s.audio.plays.length,0);assert(!s.startPrompt.hidden);assert(s.win.WeddingCoverReady.failed);
  s.promptLabel.fire('click',{isTrusted:true});await flush();assert(!s.audio.paused,'asset failure has manual fallback');assert.equal(s.audio.currentTime,50);
 }
 for(const settings of [{legacyDecode:true},{noRAF:true}]){
  s=setup(settings);await flush();await paint(s);assert.equal(s.audio.plays.length,1);
 }
 s=setup({blocked:true});await flush();await paint(s);assert.equal(s.audio.plays.length,1);
 assert.equal(s.player.dataset.state,'blocked');assert(!s.startPrompt.hidden,'autoplay denial remains explicit, never a fake playing state');
 s.audio.block=false;s.promptLabel.fire('click',{isTrusted:true});await flush();assert(!s.audio.paused);assert.equal(s.audio.currentTime,50);
 console.log('PASS: real cover readiness + music modules; both first-page layers loaded/decoded/painted before one auto attempt; 50s offset; no gallery wait; hidden, slow, cached, failed and legacy assets; explicit play/pause priority; denied autoplay fallback.');
 console.log('Simulated DOM/media only; not real iPhone/Android playback verification.');
}
main().catch(error=>{console.error(error);process.exitCode=1});
