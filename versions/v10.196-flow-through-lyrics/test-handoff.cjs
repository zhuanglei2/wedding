const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=__dirname;
// Reuse the deterministic delayed-WebView fixture, not any old assertions.
const oldTest=fs.readFileSync(path.resolve(root,'../v10.194-continuous-story/test-handoff.cjs'),'utf8');
const fixtureSource=oldTest.slice(oldTest.indexOf('function fixture('),oldTest.indexOf('// Reproduce the old defect'));
const makeFixture=file=>vm.runInNewContext(fixtureSource+'\nfixture',{
 fs,path,vm,assert,__dirname:root,code:fs.readFileSync(file,'utf8')
});
const fixture=makeFixture(path.join(root,'story-handoff.js'));
const baseline=makeFixture(path.resolve(root,'../v10.194-continuous-story/story-handoff.js'));

const old=baseline({height:1400});old.start();old.complete();old.until('holding:timeline');
const oldCount=old.writes.length;old.advance(900);
assert.equal(old.writes.length,oldCount,'reproduced V194 full stop at lyrics before starting again');
assert.equal(old.win.scrollY,2600);

let cases=0;
for(const height of [500,650,1400,2000])for(const viewport of [640,800])for(const delay of [0,48,120,250])for(const step of [8,16,33])for(const order of ['before','after']){
 const f=fixture({height,delay,step,order,quantum:step===33?1/3:1});
 f.win.innerHeight=viewport;f.win.visualViewport.height=viewport;
 f.start();f.advance(2000);assert.equal(f.writes.length,0);assert(f.images.every(i=>!i.attrs.src),'no earlier media loading');
 f.complete();f.advance(999);assert.equal(f.writes.length,0,'camera still holds 1s');
 f.until('holding:timeline');assert(Math.abs(f.win.scrollY-2000)<=2);assert(f.gated);assert.equal(f.finished.length,0);
 const n=f.writes.length;f.advance(2900);assert.equal(f.writes.length,n,'3s loaded-photo viewing retained');
 f.advance(18000);assert.equal(f.win.scrollY,f.anchor());assert.equal(f.finished.length,1);
 assert.equal(f.finished[0].phase,'complete:timeline');assert(!f.gated);assert.equal(f.pending,0);assert.equal(f.root.style.scrollBehavior,'smooth');
 const move=f.writes.filter(w=>w.phase==='scrolling:timeline');assert(move.length>20);
 assert(move.every((w,i)=>i===0||w.at-move[i-1].at<=step),'no stopped timer or intermediate settle within photo-to-timeline pan');
 assert(f.writes.every(w=>!w.phase.includes('photo-bottom')),'no lyrics waypoint');
 assert(f.writes.every((w,i)=>i===0||w.top>=f.writes[i-1].top-1),'monotonic downward route');
 // Crossing the former lyrics landing must be within this SAME live pan.
 if(height>viewport){
  const lyricsLanding=2000+height-viewport;
  const cross=move.findIndex(w=>w.top>=lyricsLanding);
  assert(cross>0&&cross<move.length-1);assert(move[cross+1].top>move[cross].top,'motion continues immediately past lyrics');
 }
 const total=f.writes.length;f.complete();f.start();f.win.fire('scroll');f.advance(20000);assert.equal(f.writes.length,total,'one shot');cases++;
}
for(const phase of ['holding:photo-top','scrolling:photo-top','holding:timeline','scrolling:timeline','settling:timeline']){
 for(const type of ['wheel','touchstart','touchmove','pointerdown','keydown']){
  const f=fixture({height:1400,delay:120});f.start();f.complete();f.until(phase);f.win.fire(type,{key:'ArrowDown'});
  const n=f.writes.length;f.advance(20000);assert.equal(f.writes.length,n,'cancel '+phase);assert(!f.gated);assert.equal(f.pending,0);
 }
 const f=fixture({height:1400,delay:120});f.start();f.complete();f.until(phase);
 f.win.innerHeight=860;f.win.visualViewport.height=860;f.top=2083;f.win.fire('resize');f.win.visualViewport.fire('resize');
 f.advance(20000);assert.equal(f.win.scrollY,f.anchor(),'toolbar/layout correction '+phase);
}
const slow=fixture({ready:false});slow.start();slow.complete();slow.until('waiting-media:photo-top');slow.advance(1500);
assert(slow.gated);slow.media();slow.advance(2900);assert.equal(slow.win.scrollY,2000);slow.advance(6000);assert.equal(slow.win.scrollY,slow.anchor());
for(const failure of ['error','timeout','cancel']){
 const f=fixture({ready:false});f.start();f.complete();f.until('waiting-media:photo-top');
 if(failure==='error')f.media(false);if(failure==='cancel')f.win.fire('touchstart');f.advance(12000);
 assert.equal(f.win.scrollY,2000);assert(!f.gated);assert.equal(f.pending,0);f.media();f.advance(10000);assert.equal(f.win.scrollY,2000);
}
for(const reason of ['cancelled','failed',null]){const f=fixture();f.start();f.complete(reason);f.advance(20000);assert.equal(f.writes.length,0);assert(!f.gated)}
const low=fixture({reduced:true});low.start();low.complete();low.advance(20000);assert.equal(low.writes.length,0);assert(!low.gated);
for(const phase of ['holding:timeline','scrolling:timeline'])for(const cause of ['hidden','width','zoom','music','hash']){
 const f=fixture({height:1400});f.start();f.complete();f.until(phase);
 if(cause==='hidden'){f.doc.hidden=true;f.doc.fire('visibilitychange')}
 if(cause==='width'){f.win.innerWidth=800;f.win.fire('resize')}
 if(cause==='zoom'){f.win.visualViewport.scale=1.2;f.win.visualViewport.fire('resize')}
 if(cause==='music')f.doc.fire('wedding-music-interaction');if(cause==='hash')f.win.fire('hashchange');
 const n=f.writes.length;f.advance(20000);assert.equal(f.writes.length,n);assert(!f.gated);assert.equal(f.pending,0);
}
const blocked=fixture({ignored:true});blocked.start();blocked.complete();blocked.advance(6000);assert.equal(blocked.pending,0);assert(!blocked.gated);
console.log(`PASS: reproduced old lyrics stop; ${cases} uninterrupted short/tall delayed-WebView routes; no intermediate pause; manual takeover, layout/toolbar changes, reduced motion, loading failures and one-shot ownership.`);
