const assert=require('node:assert/strict'),fs=require('node:fs');
const {setup,checkStatic,checkFinal}=require('./test-opening-runtime.cjs');
const isPlaying=s=>s.root.classes.has('turn-playing');
async function staysManual(s){
  await s.advance(20000);
  assert(!isPlaying(s),'must not start a deferred automatic turn');
  assert.equal(s.calls.handOffs,0);
}
async function main(){
  const bundle=fs.readFileSync(__dirname+'/opening-runtime.js','utf8');
  const previous=fs.readFileSync(__dirname+'/../v10.180-closer-couple/opening-runtime.js','utf8');
  const beforeTurn=text=>text.slice(0,text.indexOf('/* Source: page-turn.js */'));
  assert.equal(beforeTurn(bundle),beforeTurn(previous),'media decode/paint gate, character math, paper renderer and camera scene unchanged');
  // The font subset is intentionally rebuilt for the new story; its outlines
  // and coverage are checked by build-font.py --check and test-page-content.
  for(const file of ['opening-runtime.js','handwriting.js','memory-math.js'])
    assert.deepEqual(fs.readFileSync(__dirname+'/'+file),fs.readFileSync(__dirname+'/../v10.209-idle-cover-turn/'+file),file+' unchanged');

  let s=await setup();
  assert(!isPlaying(s));await s.advance(2999);assert(!isPlaying(s));
  assert.equal(s.calls.handOffs,0);assert.deepEqual(s.calls.scrolls,[]);
  await s.advance(1);assert(isPlaying(s),'starts exactly at 3000ms');
  assert.equal(s.timers.size,0,'one-shot idle timer consumed');
  assert.deepEqual(s.calls.scrolls,[],'automatic start never snaps the viewport first');
  s.tick(3000);s.tick(4600);assert.deepEqual(s.calls.scrolls,[]);
  s.tick(6800);checkStatic(s);assert.equal(s.calls.handOffs,1);
  assert(s.win.WeddingCameraStory.active);assert(!s.nodes['#our-story'].focused,'automatic turn does not steal focus');
  assert.deepEqual(s.calls.scrolls,[914]);
  assert.deepEqual(s.calls.draws.filter(d=>d.type==='camera').at(-1).state.actors,s.calls.draws.filter(d=>d.type==='cover').at(-1).state.actors,'continuous character poses across pages');
  s.tick(13600);checkFinal(s);
  for(const event of ['camera-assets-ready','camera-media-released','pageshow','resize'])s.emit(event);
  s.scroll(0);await s.advance(20000);checkFinal(s);assert.equal(s.calls.handOffs,1,'returning never re-arms automatic turn');

  for(const type of ['pointerdown','touchstart','touchend','click','wheel','keydown']){
    s=await setup();await s.advance(2999);
    s.emit(type,{isTrusted:true,preventDefault(){throw Error('input must stay native')}});
    assert.equal(s.timers.size,0,type+' clears timer immediately');await staysManual(s);
    assert(s.click(),'manual entry still works after automatic cancellation');assert(isPlaying(s));
    s=await setup({earlyInput:type});await staysManual(s);
  }
  s=await setup();s.scroll(5);s.scroll(0);await staysManual(s);
  s=await setup();s.emit('scroll');s.emit('click',{isTrusted:false});await s.advance(3000);
  assert(isPlaying(s),'zero-offset scroll notifications and synthetic events do not masquerade as user action');
  s=await setup();await s.advance(1000);assert(s.click());s.tick(1000);
  await s.advance(4000);assert(isPlaying(s));s.tick(4800);assert.equal(s.calls.handOffs,1,'manual click cancels queued auto path');
  s=await setup();s.scroll(85);s.tick(0);await s.advance(3000);s.tick(3800);
  assert.equal(s.calls.handOffs,1,'manual scrolling still uses the original turn');

  s=await setup({coverPending:true});await s.advance(8000);assert(!isPlaying(s));
  await s.releaseCover();await s.advance(2999);assert(!isPlaying(s));await s.advance(1);assert(isPlaying(s),'dwell starts after visible decoded cover, not navigation');
  s=await setup({coverPending:true});await s.advance(1000);s.emit('touchstart',{isTrusted:true});
  await s.releaseCover();await staysManual(s);
  s=await setup({slowAssets:true});await s.advance(3000);assert(!isPlaying(s));
  assert.deepEqual(s.calls.scrolls,[]);await s.advance(2000);await s.releaseAssets();
  assert(isPlaying(s),'ready assets release an elapsed dwell without another full wait');
  s=await setup({slowAssets:true});await s.advance(3500);s.emit('wheel',{isTrusted:true});await s.releaseAssets();await staysManual(s);
  s=await setup({slowAssets:true});await s.advance(16000);await s.releaseAssets();await staysManual(s);
  assert(s.win.WeddingCameraStory.played,'asset watchdog fallback never later auto-turns onto an unavailable scene');

  s=await setup();await s.advance(1500);s.doc.hidden=true;s.emit('visibilitychange');
  assert.equal(s.timers.size,0);await s.advance(9000);assert(!isPlaying(s));
  s.doc.hidden=false;s.emit('visibilitychange');await s.advance(2999);assert(!isPlaying(s));await s.advance(1);assert(isPlaying(s));
  s=await setup({hidden:true});await s.advance(9000);assert(!isPlaying(s));
  s.doc.hidden=false;s.emit('visibilitychange');await s.advance(3000);assert(isPlaying(s));
  s=await setup({slowAssets:true});await s.advance(3100);s.doc.hidden=true;s.emit('visibilitychange');await s.releaseAssets();
  await s.advance(5000);assert(!isPlaying(s));s.doc.hidden=false;s.emit('visibilitychange');await s.advance(2999);assert(!isPlaying(s));await s.advance(1);assert(isPlaying(s));
  s=await setup();await s.advance(1000);s.emit('pagehide');s.emit('pageshow',{persisted:true});await staysManual(s);

  for(const options of [{hash:'#our-story'},{hash:'#garden-portrait'},{scrollY:40},{scale:1.25},{reduce:true},{broken:true},{noCanvas:true}]){
    s=await setup(options);await staysManual(s);
  }
  s=await setup();s.location.hash='#celebration';s.emit('hashchange');s.location.hash='';await staysManual(s);
  s=await setup();await s.advance(1000);s.win.visualViewport.scale=1.25;s.win.visualViewport.emit('resize');s.win.visualViewport.scale=1;await staysManual(s);
  s=await setup();s.reduce.matches=true;s.reduce.emit('change');s.reduce.matches=false;s.reduce.emit('change');await staysManual(s);
  s=await setup();s.nodes['.rig-source'].emit('error');await staysManual(s);
  s=await setup();await s.advance(2000);s.win.innerHeight-=20;s.emit('resize');s.emit('pageshow');await s.advance(999);assert(!isPlaying(s));await s.advance(1);assert(isPlaying(s),'toolbar resize does not duplicate/restart the timer');
  console.log('PASS: exact 3s foreground dwell; pre-bundle and in-dwell input cancellation; late cover/assets; background/BFCache, restored scroll, deep-link, zoom/reduced-motion/error guards; one original cover-to-camera handoff with no focus/scroll jump.');
  console.log('Simulated DOM/clock tests only; not a real-device visual or WeChat autoplay verification.');
}
main().catch(error=>{console.error(error);process.exitCode=1});
