const assert=require('node:assert/strict'),fs=require('node:fs');
const {fixture,flush}=require('./test-music.cjs');
const {setup}=require('./test-opening-runtime.cjs');
async function withTurn(settings={}){
 const turn=await setup(settings);
 const music=fixture({blocked:true,legacyCover:false,beforeRuntime:({doc})=>{doc.documentElement=turn.root;}});
 await flush();return {turn,music};
}
async function main(){
 let {turn,music}=await withTurn();
 assert.equal(music.audio.plays.length,1);assert.equal(music.player.dataset.state,'blocked');
 await turn.advance(2999);music.mutate();assert.equal(music.audio.plays.length,1);
 await turn.advance(1);assert(turn.root.classes.has('turn-playing'));music.mutate();
 assert.equal(music.audio.plays.length,2,'real 3-second automatic turn triggers one additional ordinary request');
 await flush();assert.equal(music.player.dataset.state,'blocked');assert(!music.startPrompt.hidden,'denied retry never claims audible playback');
 for(let i=0;i<8;i++){music.mutate();music.win.fire('scroll');music.doc.fire('camera-story-started');}
 assert.equal(music.audio.plays.length,2);assert.equal(music.audio.songLoads,1);assert.equal(music.audio.currentTime,50);
 music.audio.block=false;music.promptLabel.fire('click',{isTrusted:true});await flush();assert(!music.audio.paused);

 ({turn,music}=await withTurn());music.audio.block=false;await turn.advance(3000);music.mutate();await flush();
 assert.equal(music.player.dataset.state,'playing');assert.equal(music.audio.currentTime,50);
 music.audio.currentTime=72;music.mutate();assert.equal(music.audio.currentTime,72);
 ({turn,music}=await withTurn({slowAssets:true}));await turn.advance(3000);music.mutate();assert.equal(music.audio.plays.length,1);
 await turn.releaseAssets();music.mutate();assert.equal(music.audio.plays.length,2,'wait for actual turn when assets are late');await flush();
 for(const settings of [{earlyInput:'touchstart'},{reduce:true},{broken:true},{hidden:true},{hash:'#our-story'}]){
  ({turn,music}=await withTurn(settings));await turn.advance(10000);music.mutate();
  assert.equal(music.audio.plays.length,1,'no additional request when no actual turn occurs');
 }
 for(const condition of ['playing','manual-pause','pending','ended','error','hidden','settled']){
  const s=fixture({blocked:condition!=='playing'&&condition!=='manual-pause',slowPlay:condition==='pending'});await flush();
  if(condition==='manual-pause')s.toggle.fire('click');
  if(condition==='pending'){s.audio.block=false;s.audio.pendingPlay=true;s.promptLabel.fire('click',{isTrusted:true});}
  if(condition==='ended'){s.audio.ended=true;s.audio.fire('ended');}
  if(condition==='error')s.audio.fire('error');
  if(condition==='hidden')s.doc.hidden=true;
  if(condition==='settled')s.root.classes.add('turn-settled');
  const before=s.audio.plays.length;s.root.classes.add('turn-playing');s.mutate();await flush();
  assert.equal(s.audio.plays.length,before,condition+' is not interrupted');
 }
 assert.deepEqual(fs.readFileSync(__dirname+'/opening-runtime.js'),fs.readFileSync(__dirname+'/../v10.214-swipe-retry-photo-focus/opening-runtime.js'),'animation runtime unchanged');
 require('./test-page-content.cjs');
 const turnHandler=text=>text.slice(text.indexOf(' function recoverOnCoverTurn'),text.indexOf(' function recoverOnWeChatReady'));
 assert.equal(turnHandler(fs.readFileSync(__dirname+'/music.js','utf8')),turnHandler(fs.readFileSync(__dirname+'/../v10.215-turn-music-retry/music.js','utf8')),'automatic-turn music retry unchanged; only ended handling changes');
 console.log('PASS: actual idle-turn controller at 2999/3000ms, late assets, canceled/hidden/reduced turns; one ordinary music retry, permission denial fallback, playing/pause/pending/end/error guards. Mock DOM/media, not WeChat verification.');
}
main().catch(error=>{console.error(error);process.exitCode=1});
