const assert=require('node:assert/strict'),fs=require('node:fs');
const {fixture,flush}=require('./test-music.cjs');
const contact={isTrusted:true,touches:[{}],changedTouches:[{}]};
const end={isTrusted:true,touches:[],changedTouches:[{}]};
async function main(){
 const s=fixture({coverReady:false,slowPlay:true,legacyCover:false});
 s.art.fire('touchstart',contact);s.art.fire('touchmove',contact);s.art.fire('touchend',end);
 assert.equal(s.audio.plays.length,2);
 const stale=s.audio.resolve;
 s.art.fire('touchstart',contact);
 assert.equal(s.audio.plays.length,3,'new contact is not swallowed by pending earlier swipe');
 s.art.fire('touchend',end);assert.equal(s.audio.plays.length,4);
 s.art.fire('click',{isTrusted:true});assert.equal(s.audio.plays.length,4,'same release compatibility click deduplicates');
 assert.equal(s.audio.songLoads,1);assert(s.audio.plays.every(p=>p.at===50&&!p.muted));
 s.audio.resolve();stale();await flush();assert.equal(s.player.dataset.state,'playing');
 s.audio.currentTime=79;s.art.fire('touchstart',contact);s.art.fire('touchend',end);
 assert.equal(s.audio.plays.length,4);assert.equal(s.audio.currentTime,79,'playing is never restarted');
 s.toggle.fire('click');s.art.fire('touchcancel',{isTrusted:true});s.art.fire('touchstart',contact);s.art.fire('touchend',end);
 assert(s.audio.paused);assert.equal(s.audio.plays.length,4,'manual pause always wins');

 const c=fixture({coverReady:false,slowPlay:true});c.art.fire('touchstart',contact);c.art.fire('touchend',end);
 c.art.fire('touchcancel',{isTrusted:true});assert.equal(c.audio.plays.length,2,'cancel clears bookkeeping without starting audio');
 c.art.fire('click',{isTrusted:true});assert.equal(c.audio.plays.length,3,'later real tap may recover after cancellation');
 const denied=fixture({coverReady:false,blocked:true});
 denied.art.fire('touchstart',contact);await flush();denied.art.fire('touchend',end);await flush();
 assert.equal(denied.player.dataset.state,'blocked');assert(!denied.startPrompt.hidden);
 const n=denied.audio.plays.length;
 for(let i=0;i<40;i++){denied.art.fire('touchmove',contact);denied.win.fire('scroll');}
 assert.equal(denied.audio.plays.length,n,'no timer or scrolling retry loop');
 denied.audio.block=false;denied.promptLabel.fire('click',{isTrusted:true});await flush();assert(!denied.audio.paused);

 const css=fs.readFileSync(__dirname+'/camera-photo-focus.css','utf8');
 assert(css.includes('transform:scale(1.2)'));assert(css.includes('transform-origin:45% 62%'));
 assert(css.includes('html.star-turn .opening-underlay .reference-art .camera-photo img'));
 assert(!/filter:|blur\(|width:|height:/.test(css),'no filters, recompression or frame size changes');
 // Current frame geometry, in source-photo pixels. Approximate head bounds
 // inspected in the supplied photo; analytical crop check, not screenshot QA.
 const sourceW=853,sourceH=1280,scale=1.2;
 const aspect=(.70*.91428571429)/(1.5*.35*.78551307847);
 const baseH=sourceW/aspect,baseTop=(sourceH-baseH)*.24;
 const left=sourceW*.45*(1-1/scale),top=baseTop+baseH*.62*(1-1/scale);
 const right=left+sourceW/scale,bottom=top+baseH/scale;
 for(const head of [{x:120,y:400,w:92,h:112},{x:490,y:420,w:82,h:115}]){
  assert(head.x>left+12&&head.x+head.w<right-12&&head.y>top+12&&head.y+head.h<bottom-12,'both heads stay within the tighter photo window');
 }
 console.log('PASS: repeated pending swipes, cancellation, manual pause, honest denial and explicit tap recovery; 20% display-only crop preserves both heads analytically. Not mobile/browser visual verification.');
}
main().catch(error=>{console.error(error);process.exitCode=1});
