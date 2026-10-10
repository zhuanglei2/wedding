// Reuse the established deterministic WebView fixture for the unchanged route.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const routeDir=path.resolve(__dirname,'../v10.198-garden-inscription');
const source=fs.readFileSync(path.join(routeDir,'test-handoff.cjs'),'utf8');
const harness=source.split('\nlet cases=0;')[0];
assert(harness.includes('function fixture('));
const fixture=vm.runInNewContext(harness+'\nfixture;',{require,__dirname:routeDir,console});
let cases=0;
for(const height of [650,1400,2000])for(const viewport of [640,800])for(const delay of [0,120,250])for(const step of [16,33])for(const order of ['before','after']){
 const f=fixture({height,delay,step,order,withPortrait:false});
 f.win.innerHeight=viewport;f.win.visualViewport.height=viewport;
 f.start();f.complete();f.until('holding:timeline');
 assert(Math.abs(f.win.scrollY-2000)<=2);assert(f.gated);
 const n=f.writes.length;f.advance(2900);assert.equal(f.writes.length,n,'retains gathered photo reading hold');
 f.advance(16000);assert.equal(f.win.scrollY,f.anchor());assert.equal(f.finished.length,1);
 assert.equal(f.finished[0].phase,'complete:timeline');assert(!f.gated);assert.equal(f.pending,0);
 assert(!f.writes.some(w=>w.phase.includes('portrait')),'no invisible garden scroll or pause');
 assert(f.portraitImages.every(image=>!image.attrs.src),'no removed portrait image download');
 cases++;
}
for(const phase of ['holding:photo-top','scrolling:photo-top','holding:timeline','scrolling:timeline','settling:timeline']){
 const f=fixture({withPortrait:false,height:1400,delay:120});f.start();f.complete();f.until(phase);f.win.fire('touchstart');
 const n=f.writes.length;f.advance(20000);assert.equal(f.writes.length,n);assert(!f.gated);assert.equal(f.pending,0);
}
const slow=fixture({withPortrait:false,ready:false});slow.start();slow.complete();slow.until('waiting-media:photo-top');
slow.advance(1000);assert(slow.gated);slow.media('photo');slow.advance(20000);assert.equal(slow.win.scrollY,slow.anchor());
console.log(`PASS: ${cases} no-garden delayed-WebView routes, direct lyrics-to-timeline handoff, no phantom hold/media, slow loading and manual cancellation. Simulated DOM only.`);
