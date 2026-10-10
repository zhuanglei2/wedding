const assert=require('node:assert/strict'),fs=require('node:fs');
const {fixture,flush}=require('./test-music.cjs');
function finish(s){s.audio.currentTime=s.audio.duration;s.audio.ended=true;s.audio.pause();s.audio.fire('ended');}
async function main(){
 const s=fixture({legacyCover:false});await flush();
 for(let cycle=0;cycle<4;cycle++){
  finish(s);assert.equal(s.audio.plays.length,cycle+2,'one synchronous repeat per natural end');
  assert.equal(s.audio.plays.at(-1).at,50);assert.equal(s.audio.currentTime,50);
  s.audio.fire('ended');await flush();assert.equal(s.audio.plays.length,cycle+2,'duplicate end does not restart');
  assert.equal(s.player.dataset.state,'playing');assert.equal(s.elapsed.textContent,'00:50');
  assert(!s.audio.paused);assert(s.startPrompt.hidden);assert.equal(s.audio.loads,1,'never reload the MP3');
 }
 s.audio.currentTime=93;s.toggle.fire('click');const count=s.audio.plays.length;
 s.audio.fire('ended');s.art.fire('touchstart',{isTrusted:true,touches:[{}],changedTouches:[{}]});
 s.doc.hidden=true;s.doc.fire('visibilitychange');s.doc.hidden=false;s.doc.fire('visibilitychange');
 await flush();assert.equal(s.audio.plays.length,count);assert(s.audio.paused);assert.equal(s.audio.currentTime,93);
 s.toggle.fire('click');await flush();assert.equal(s.audio.currentTime,93,'manual resume preserves the chosen position');

 const paused=fixture();await flush();paused.toggle.fire('click');finish(paused);await flush();
 assert.equal(paused.audio.plays.length,1,'even a queued ended event cannot override explicit pause');
 const hidden=fixture();await flush();hidden.doc.hidden=true;hidden.doc.fire('visibilitychange');finish(hidden);
 assert.equal(hidden.audio.plays.length,1,'defer an end event received while hidden');assert.equal(hidden.audio.currentTime,50);
 hidden.doc.hidden=false;hidden.doc.fire('visibilitychange');await flush();assert.equal(hidden.audio.plays.length,2);
 hidden.win.fire('pageshow');await flush();assert.equal(hidden.audio.plays.length,2,'lifecycle notifications deduplicate');

 const pending=fixture();await flush();pending.audio.pendingPlay=true;finish(pending);
 assert.equal(pending.player.dataset.state,'loading');pending.audio.fire('ended');assert.equal(pending.audio.plays.length,2);
 pending.toggle.fire('click');pending.audio.resolve();await flush();assert(pending.audio.paused,'late loop promise cannot override cancel');
 assert.equal(pending.player.dataset.state,'paused');
 const background=fixture();await flush();background.audio.pendingPlay=true;finish(background);
 background.doc.hidden=true;background.doc.fire('visibilitychange');background.audio.resolve();await flush();assert(background.audio.paused);
 background.audio.pendingPlay=false;background.doc.hidden=false;background.doc.fire('visibilitychange');await flush();
 assert.equal(background.audio.plays.length,3);assert(!background.audio.paused);assert.equal(background.audio.currentTime,50);

 const denied=fixture();await flush();denied.audio.block=true;finish(denied);await flush();
 assert.equal(denied.player.dataset.state,'blocked');assert(!denied.startPrompt.hidden);assert.equal(denied.audio.plays.length,2);
 denied.audio.fire('ended');await flush();assert.equal(denied.audio.plays.length,2,'denied repeat never spins in a retry loop');
 denied.audio.block=false;denied.promptLabel.fire('click',{isTrusted:true});await flush();assert(!denied.audio.paused);
 assert.equal(denied.audio.currentTime,50);assert.equal(denied.audio.loads,1);
 const broken=fixture();await flush();broken.audio.fire('error');finish(broken);await flush();
 assert.equal(broken.audio.plays.length,1,'network failure never restarts automatically');assert.equal(broken.player.dataset.state,'error');

 // Content-aware repeat is the only behavioral change, not an autoplay bypass.
 const normalize=source=>source.replace(/^\/\*.*?\*\//,'').replace(/ audio\.addEventListener\('ended',[\s\S]*?(?= audio\.addEventListener\('error')/,'ENDED\n');
 assert.equal(normalize(fs.readFileSync(__dirname+'/music.js','utf8')),normalize(fs.readFileSync(__dirname+'/../v10.218-condensed-story/music.js','utf8')));
 console.log('PASS: 4 automatic 50s repeats; one loaded MP3; duplicate/stale ends; manual pause; pending cancel; hidden/resume; autoplay-denial and network-error fallbacks. Mock media, not phone playback.');
}
main().catch(error=>{console.error(error);process.exitCode=1});
