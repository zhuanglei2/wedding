const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const math=require('../v10.161-auto-story/memory-math.js'),html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
const source=fs.readFileSync(path.join(__dirname,'../v10.163-love-copy-handoff/memory.js'),'utf8');
const sectionHTML=html.slice(html.indexOf('<section id="story-timeline"'),html.indexOf('</section>',html.indexOf('<section id="story-timeline"'))+10);
const nodeHTML=[...sectionHTML.matchAll(/<li class="story-node[^>]+>(.*?)<\/li>/gs)].map(m=>m[1]);
const textRows=nodeHTML.map(h=>[...h.matchAll(/<(h3|p)[^>]+class="type-block"[^>]*>(.*?)<\/\1>/gs)].map(m=>[...m[2].matchAll(/<span class="type-glyph" aria-hidden="true">(.*?)<\/span>/gs)].map(x=>x[1])));
const cardHTML=[...sectionHTML.matchAll(/<figure class="memory-card[^>]*>[\s\S]*?<\/figure>/g)].map(m=>m[0]);
const cardCount=cardHTML.length,plan=math.makePlan(textRows,cardCount);
assert.equal(nodeHTML.length,5);assert.equal(cardCount,19);
assert(!sectionHTML.includes('memory-11.webp'),'old single heart must not remain');
assert(sectionHTML.includes('2026-10'));assert(sectionHTML.includes('media/wedding-finale.webp'));
assert(sectionHTML.indexOf('keepsake-grid')<sectionHTML.indexOf('wedding-node'));
const keepsakeHTML=sectionHTML.match(/<figure class="memory-card memory-keepsake"[\s\S]*?<\/figure>/)[0];
assert.equal((keepsakeHTML.match(/data-media-src=/g)||[]).length,4,'four photos retained');
assert(!/keepsake-author|keepsake-date|<figcaption>|朝暮与共|四季相依|作乐|2026年1月3日/.test(keepsakeHTML),'no keepsake text');
class Element {
 constructor(name,y=0,height=80){this.name=name;this.y=y;this.height=height;this.offsetHeight=height;this.clientHeight=height;this.clientWidth=328;this.dataset={};this.style={setProperty(k,v){this[k]=v}};this.listeners={};this.children=[];this.hidden=false;this.classes=new Set();this.classList={add:(...v)=>v.forEach(x=>this.classes.add(x)),remove:(...v)=>v.forEach(x=>this.classes.delete(x)),contains:v=>this.classes.has(v)};this.selectors={};}
 querySelectorAll(s){return this.selectors[s]||[]}
 querySelector(s){return this.querySelectorAll(s)[0]||null}
 addEventListener(name,f){(this.listeners[name]??=[]).push(f)}
 removeEventListener(name,f){this.listeners[name]=(this.listeners[name]||[]).filter(x=>x!==f)}
 fire(name,event={}){for(const f of [...(this.listeners[name]||[])])f(event)}
 append(el){this.children.push(el);this.selectors.button=[el]}
 dispatchEvent(event){this.fire(event.type,event);return true}
 remove(){this.removed=true}
 getBoundingClientRect(){const top=this.y-this.win.scrollY-(this.scrollParent?.scrollTop||0);return {top,bottom:top+this.height,left:0,width:this.clientWidth,height:this.height}}
}
async function fixture({reduced=false,noWAAPI=false,broken=false,paperHeight=850,screenHeight=850,introHeight=280,wrap=18,rowHeight=28,scrollQuantum=0,frameStep=32,sourceOverride=null,handoffPending=false,integrated=false}={}){
 let time=0,serial=0,scrollPort=null,onFrame=()=>{};const raf=new Map(),timers=new Map(),animations=[],scrolled=[],innerMoves=[];
 const win=new Element('window');win.scrollY=0;win.innerHeight=screenHeight;win.visualViewport=new Element('visual-viewport');win.visualViewport.height=screenHeight;win.WeddingMemoryMath=math;win.scrollTo=(_,y)=>{win.scrollY=y;scrolled.push(y)};
 function el(name,y,h){const result=new Element(name,y,h);result.win=win;result.scrollParent=scrollPort;return result}
 const root=el('html');root.scrollHeight=6000;
 if(handoffPending)root.classList.add('story-handoff-pending');
 const doc=el('document');doc.documentElement=root;doc.hidden=false;doc.fonts=el('fonts');doc.fonts.ready=Promise.resolve();doc.createElement=name=>el(name);
 const frameTop=introHeight+60;
 const page=el('page',0,paperHeight),intro=el('intro',30,introHeight),port=el('port',frameTop,paperHeight-frameTop-40),previous=el('previous',-paperHeight,paperHeight);port.scrollHeight=4200;let scrollTop=0;Object.defineProperty(port,'scrollTop',{get(){return scrollTop},set(v){scrollTop=Math.max(0,Math.min(port.scrollHeight-port.clientHeight,scrollQuantum?Math.round(v/scrollQuantum)*scrollQuantum:v));innerMoves.push(scrollTop)}});page.selectors['.story-paper-window']=[port];page.selectors['.story-fixed-intro']=[intro];
 page.style.setProperty=function(k,v){this[k]=v;if(k==='--story-page-height'){page.height=page.clientHeight=Number.parseFloat(v);port.height=port.clientHeight=page.height-frameTop-40}};
 doc.selectors['#celebration']=[page];doc.selectors['#our-story']=[previous];scrollPort=port;
 const section=el('section',frameTop+50,3800),copy=el('copy',frameTop+1900,800),stage=el('stage',frameTop+1900,800),final=el('final',frameTop+3020,520);
 const image=(name)=>{const i=el(name);i.dataset.mediaSrc=name+'.webp';i.naturalWidth=0;i.complete=false;i.decode=()=>Promise.resolve();Object.defineProperty(i,'src',{set(v){this.source=v;this.complete=true;this.naturalWidth=broken?0:800;Promise.resolve().then(()=>this.fire(broken?'error':'load'))}});return i};
 let ypos=frameTop+70;const blocks=[],glyphs=[];
 const nodes=textRows.map((row,n)=>{const node=el('node'+n,ypos,450);const bs=[],gs=[];row.forEach((text,b)=>{const block=el('block'+b,ypos,80);const chars=text.map((value,i)=>{const g=el('glyph',ypos+Math.floor(i/wrap)*rowHeight,rowHeight);g.textContent=value;return g});block.selectors['.type-glyph']=chars;bs.push(block);gs.push(chars);ypos+=Math.max(80,Math.ceil(text.length/wrap)*rowHeight)});node.selectors['.type-block']=bs;blocks.push(bs);glyphs.push(gs);ypos+=120;return node});
 final.y=nodes.at(-1).y+110;
 port.scrollHeight=Math.max(4200,final.y-frameTop+700);
 const imgs=[];const cards=Array.from({length:cardCount},(_,i)=>{const card=el('card'+i,frameTop+2000,i===cardCount-1?310:290);const assets=Array.from({length:i===cardCount-1?4:1},(_,j)=>image(`photo${i}-${j}`));imgs.push(...assets);card.selectors['img[data-media-src]']=assets;if(!noWAAPI)card.animate=(frames,options)=>{const a={frames,options,currentTime:0,pause(){this.paused=true},cancel(){this.cancelled=true}};animations.push(a);return a};return card});
 const finalImg=image('final');imgs.push(finalImg);final.selectors['img[data-media-src]']=[finalImg];
 section.selectors={'[data-story-node]':nodes,'.memory-stack':[stage],'.memory-copy':[copy],'.wedding-finale':[final],'img[data-media-src]':imgs};stage.selectors['[data-memory-card]']=cards;doc.selectors['#story-timeline']=[section];
 const media=el('media');media.matches=reduced;
 const context={window:win,document:doc,matchMedia:()=>media,requestAnimationFrame:f=>{raf.set(++serial,f);return serial},cancelAnimationFrame:id=>raf.delete(id),setTimeout:(f,ms)=>{timers.set(++serial,{at:time+ms,f});return serial},clearTimeout:id=>timers.delete(id),Date:{now:()=>1000000+time},CustomEvent:class{constructor(type,options={}){this.type=type;this.detail=options.detail}},Promise,console};
 if(integrated){
  const fourth=el('fourth',paperHeight+80,900);fourth.scrollParent=null;doc.selectors['#wedding-invitation']=[fourth];
  win.requestAnimationFrame=context.requestAnimationFrame;win.cancelAnimationFrame=context.cancelAnimationFrame;win.matchMedia=()=>media;win.innerWidth=390;win.scrollX=0;
  win.scrollTo=options=>{win.scrollY=Math.round(options.top);scrolled.push(win.scrollY);Promise.resolve().then(()=>win.fire('scroll'))};
  context.Event=class{constructor(type){this.type=type}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'memory-handoff.js'),'utf8'),context);
 }
 vm.runInNewContext(sourceOverride||source,context);
 const flush=async()=>{for(let i=0;i<12;i++)await Promise.resolve()};await flush();
 async function advance(ms){const until=time+ms;while(time<until){time=Math.min(time+frameStep,until);for(const [id,timer] of [...timers])if(timer.at<=time){timers.delete(id);timer.f()}const callbacks=[...raf.values()];raf.clear();callbacks.forEach(f=>f(time));await flush();onFrame()}}
 async function to(t){await advance(Math.max(0,t-time))}
 return {advance,to,win,doc,section,page,intro,port,previous,nodes,blocks,glyphs,stage,cards,final,media,scrolled,innerMoves,animations,plan,onFrame(f){onFrame=f},get pendingFrames(){return raf.size},get time(){return time}};
}
(async()=>{
 const countTyped=f=>f.glyphs.flat(2).filter(g=>g.classList.contains('typed')).length;
 const previousRuntime=fs.readFileSync(path.join(__dirname,'../v10.161-auto-story/memory.js'),'utf8');
 for(const frameStep of [8,16,32]){
  async function followError(runtime){
   const f=await fixture({frameStep,sourceOverride:runtime});let lag=0,samples=0;
   f.onFrame(()=>{
    if(f.section.dataset.storyPhase!=='typing'||f.port.scrollTop<=1)return;
    const active=f.blocks.flat().find(b=>b.classList.contains('typing'));
    const glyph=active?.querySelectorAll('.type-glyph').filter(g=>g.classList.contains('typed')).at(-1);if(!glyph)return;
    const r=glyph.getBoundingClientRect(),p=f.port.getBoundingClientRect();
    lag+=Math.abs((r.top+r.bottom)/2-(Math.max(0,p.top)+Math.min(f.win.innerHeight,p.bottom))/2);samples++;
   });
   await f.advance(6000);return {lag,samples,typed:countTyped(f)};
  }
  const oldFollow=await followError(previousRuntime),newFollow=await followError(source);
  assert(oldFollow.samples>20&&newFollow.samples>20);
  assert.equal(newFollow.typed,oldFollow.typed,'scroll speed must not change typing clock');
  assert(newFollow.lag<oldFollow.lag*.85,`less tracking lag at ${frameStep}ms frames`);
 }
 async function firstResumedGlyph(runtime){
  const f=await fixture({frameStep:16,scrollQuantum:1,sourceOverride:runtime});await f.to(4600);
  f.win.fire('wheel');f.port.scrollTop+=151;f.port.fire('scroll');const before=countTyped(f),at=f.time;
  while(countTyped(f)===before&&f.time-at<3000)await f.advance(16);
  assert(countTyped(f)>before,'resume must finish');return f.time-at;
 }
 const oldReturn=await firstResumedGlyph(previousRuntime),newReturn=await firstResumedGlyph(source);
 assert(newReturn<=oldReturn-80,'finite rejoin is observably faster');
 console.log('PASS: less follow lag at 8/16/32ms frames; identical typing progress; finite resume',oldReturn+'ms -> '+newReturn+'ms including gesture quiet/read wait.');
 const oldMath=require('../v10.155-more-memories/memory-math.js');
 for(const glyph of ['爱','A','2',' ','，','。','！','…'])for(const heading of [false,true])assert(math.glyphDelay(glyph,heading)<oldMath.glyphDelay(glyph,heading));
 assert.equal(math.glyphDelay('爱'),30);assert.equal(math.nodeHold,oldMath.nodeHold);
 assert.deepEqual(math.photoSchedule(19),oldMath.photoSchedule(19),'photo durations/order untouched');
 assert(plan.end<oldMath.makePlan(textRows,19).end);
 const gated=await fixture({handoffPending:true});await gated.advance(4500);assert.equal(countTyped(gated),0,'third page waits through camera, hold and outer scroll');assert.equal(gated.pendingFrames,0);
 gated.doc.documentElement.classList.remove('story-handoff-pending');gated.doc.fire('story-handoff-complete');await gated.advance(1000);assert(countTyped(gated)>0,'typing begins after handoff arrival');
 const integerScroll=await fixture({scrollQuantum:1,frameStep:16});
 await integerScroll.to(1600);integerScroll.win.fire('wheel');integerScroll.port.scrollTop+=151;
 const beforeResume=countTyped(integerScroll);
 await integerScroll.advance(6000);
 assert(countTyped(integerScroll)>beforeResume,'integer-pixel scroll must resume typing after user releases');
 const oldRuntime=fs.readFileSync(path.join(__dirname,'../v10.159-flow-and-gilt/memory.js'),'utf8');
 const oldFailure=await fixture({scrollQuantum:1,frameStep:16,sourceOverride:oldRuntime});
 await oldFailure.to(1600);oldFailure.win.fire('wheel');oldFailure.port.scrollTop+=151;
 const frozen=countTyped(oldFailure);await oldFailure.advance(6000);
 assert.equal(countTyped(oldFailure),frozen,'same regression fixture reproduces the V10.159 freeze');
 for(const scrollQuantum of [1,.5,1/3])for(const frameStep of [8,16,32]){
  const q=await fixture({scrollQuantum,frameStep});await q.to(4600);
  for(const offset of [151,-151,100000]){
   q.win.fire('wheel');q.port.scrollTop+=offset;q.port.fire('scroll');
   const before=countTyped(q);await q.advance(2400);
   assert(countTyped(q)>before,`typing resumes: quantum ${scrollQuantum}, frame ${frameStep}, offset ${offset}`);
  }
  assert.equal(q.scrolled.length,0);
  const photos=await fixture({scrollQuantum,frameStep});await photos.to(plan.photoStart+300);
  photos.win.fire('wheel');photos.port.scrollTop+=151;photos.port.fire('scroll');
  const photoTimes=photos.animations.map(a=>a.currentTime);await photos.advance(2400);
  assert(photos.animations.some((a,i)=>a.currentTime>photoTimes[i]),'quantized photo phase resumes too');
 }
console.log('PASS: V10.159 freeze reproduced; V10.166 preserves the V10.160 fix with integer/half/third-pixel scrolling, 8/16/32ms frames, both directions, clamped scroll bounds and photo flights.');

 for(const options of [{paperHeight:640,screenHeight:640,wrap:8,rowHeight:34},{paperHeight:850,screenHeight:850},{paperHeight:900,screenHeight:600,wrap:12,rowHeight:32}]){
  const reading=await fixture(options),intro=reading.intro.getBoundingClientRect();let checked=0,centered=0,lastRow=null,rowSince=0;
  reading.onFrame(()=>{
   if(reading.section.dataset.storyPhase!=='typing')return;
   const active=reading.blocks.flat().find(b=>b.classList.contains('typing'));if(!active)return;
   const glyph=active.querySelectorAll('.type-glyph').filter(g=>g.classList.contains('typed')).at(-1);if(!glyph)return;
   const r=glyph.getBoundingClientRect(),p=reading.port.getBoundingClientRect(),top=Math.max(0,p.top),bottom=Math.min(reading.win.visualViewport.height,p.bottom);
   assert(r.top>=top+16-1&&r.bottom<=bottom-16+1,'current line stays out of masked edges');checked++;
   if(lastRow!==glyph.y){lastRow=glyph.y;rowSince=reading.time}
   const center=(r.top+r.bottom)/2,target=(top+bottom)/2,canCenter=glyph.y-p.top-(bottom-top)/2>0;
   if(canCenter&&reading.time-rowSince>350){assert(Math.abs(center-target)<12,'current line settles at viewport center');centered++}
   assert.deepEqual(reading.intro.getBoundingClientRect(),intro,'comic remains stationary while tracking lines');
  });
  // Shorter requested prose has fewer long rows; retain every-frame geometry assertions above.
  await reading.to(plan.end+300);assert(checked>100&&centered>=5,`line-by-line tracking exercised: ${checked} visible, ${centered} centered`);
 }
 for(let node=0;node<5;node++){
  const hold=await fixture(),last=plan.events.filter(e=>e.kind==='block-end'&&e.node===node).at(-1).at;
  await hold.to(last+100);assert(hold.glyphs[node].flat().every(g=>g.classList.contains('typed')));
  const typed=hold.glyphs.flat(2).filter(g=>g.classList.contains('typed')).length;
  await hold.to(last+950);assert.equal(hold.glyphs.flat(2).filter(g=>g.classList.contains('typed')).length,typed,'no typing during one-second hold');
  if(node<3)assert(!hold.nodes[node+1].classList.contains('entered'));
  if(node===3)assert.equal(hold.animations.length,0,'photos wait until reading hold ends');
  if(node===4)assert(!hold.final.classList.contains('revealed'),'final photo waits until reading hold ends');
 }
 const reflow=await fixture(),holdAt=plan.events.filter(e=>e.kind==='block-end'&&e.node===1).at(-1).at;
 await reflow.to(holdAt+80);
 const row=reflow.glyphs[1].at(-1),lastGlyph=row.at(-1);
 row.forEach(g=>g.y+=48);reflow.doc.fonts.fire('loadingdone');
 reflow.win.visualViewport.height=620;reflow.win.visualViewport.fire('resize');
 await reflow.advance(650);
 const rr=lastGlyph.getBoundingClientRect(),pr=reflow.port.getBoundingClientRect();
 assert(Math.abs((rr.top+rr.bottom)/2-(pr.top+620)/2)<12,'font reflow and visual viewport resize re-center current line during hold');
 assert.equal(reflow.scrolled.length,0);
 const f=await fixture(),introRect=f.intro.getBoundingClientRect(),portRect=f.port.getBoundingClientRect();await f.to(600);assert(f.nodes[0].classList.contains('entered'));assert(!f.nodes[1].classList.contains('entered'));
 const first=f.glyphs[0][0].filter(g=>g.classList.contains('typed')).length;assert(first>0&&first<f.glyphs[0][0].length,'real character typing');
 await f.to(plan.photoStart+100);assert(f.glyphs[3].flat().every(g=>g.classList.contains('typed')));assert(!f.nodes[4].classList.contains('entered'));assert.equal(f.animations.length,cardCount);
 await f.to(plan.holdStart-100);assert(!f.cards.at(-1).classList.contains('landed'),'keepsake cannot finish early');assert.notEqual(f.section.dataset.storyPhase,'keepsake-hold');
 await f.to(plan.holdStart+300);assert.equal(f.section.dataset.storyPhase,'keepsake-hold');assert(f.cards.every(c=>c.classList.contains('landed')),'all old and new photos have landed');assert(!f.stage.hidden);
 await f.to(plan.fadeStart+650);assert.equal(f.section.dataset.storyPhase,'fading');assert(Number(f.stage.style.opacity)>0&&Number(f.stage.style.opacity)<1);
 await f.to(plan.photoEnd+650);assert(f.stage.hidden);assert(f.nodes[4].classList.contains('entered'));
 await f.to(plan.finalPhotoStart+650);assert(Number(f.final.style.opacity)>0&&Number(f.final.style.opacity)<1);assert(f.glyphs[4].flat().every(g=>g.classList.contains('typed')));
 await f.to(plan.end+300);assert.equal(f.section.dataset.storyPhase,'complete');const count=f.animations.length;f.win.fire('scroll');await f.advance(1000);assert.equal(f.animations.length,count,'no replay');
 assert.equal(f.scrolled.length,0,'outer page never moved');assert(f.innerMoves.length>20,'timeline scrolls inside paper');assert.equal(f.page.clientHeight,850,'paper height remains unchanged');
 assert.deepEqual(f.intro.getBoundingClientRect(),introRect,'comic position unchanged throughout animation');
 assert.deepEqual(f.port.getBoundingClientRect(),portRect,'timeline viewport position and size fixed');
 assert(f.port.clientHeight<f.page.clientHeight,'timeline uses only lower part of paper');
 assert.equal(Number.parseFloat(f.page.style['--story-window-height']),f.port.clientHeight,'photos size to timeline slot');
 const photoHeight=Number.parseFloat(f.page.style['--final-photo-height']);
 assert.equal(photoHeight+76,f.port.clientHeight,'final photo uses full viewport minus frame and safe edges');
 assert(photoHeight>Math.max(64,f.port.clientHeight-110-76),'photo no longer shrinks to leave room for text');
 f.port.scrollTop=0;f.port.fire('scroll');assert.deepEqual(f.intro.getBoundingClientRect(),introRect,'manual rewind does not move comics');

 const typedCount=f=>f.glyphs.flat(2).filter(g=>g.classList.contains('typed')).length;
 const manual=await fixture();await manual.to(1000);manual.win.fire('wheel');
 const stopped=typedCount(manual),s=manual.innerMoves.length;
 await manual.advance(700);assert.equal(typedCount(manual),stopped);assert.equal(manual.innerMoves.length,s);assert.equal(manual.pendingFrames,0,'manual pause uses no RAF');
 manual.port.scrollTop+=180;manual.port.fire('scroll');
 await manual.advance(700);assert.equal(typedCount(manual),stopped,'momentum extends quiet period');
 await manual.advance(2500);assert(typedCount(manual)>stopped,'typing resumes after quiet period');
 assert(manual.port.classList.contains('story-following'),'manual input is not a permanent opt-out');
 assert.equal(manual.scrolled.length,0);
 manual.doc.hidden=true;manual.doc.fire('visibilitychange');const hiddenCount=typedCount(manual);
 await manual.advance(3000);assert.equal(typedCount(manual),hiddenCount);assert.equal(manual.pendingFrames,0,'background RAF stopped');
 manual.doc.hidden=false;manual.doc.fire('visibilitychange');await manual.advance(1600);assert(typedCount(manual)>hiddenCount,'foreground resumes same run across an intentional reading hold');
 const drag=await fixture();await drag.to(1000);drag.win.fire('pointerdown');drag.win.fire('touchstart');
 const heldCount=typedCount(drag);await drag.advance(3000);assert.equal(typedCount(drag),heldCount,'long stationary hold cannot resume');
 drag.win.fire('pointerup');await drag.advance(1800);assert.equal(typedCount(drag),heldCount,'touch still held');
 drag.win.fire('touchend',{touches:[]});await drag.advance(1800);assert(typedCount(drag)>heldCount);
 for(let i=0;i<20;i++){drag.win.fire('scroll');drag.doc.fire('visibilitychange')}
 assert(drag.pendingFrames<=1,'at most one animation loop');
 const photoPause=await fixture();await photoPause.to(plan.photoStart+500);
 photoPause.win.fire('wheel');const times=photoPause.animations.map(a=>a.currentTime);
 await photoPause.advance(600);assert.deepEqual(photoPause.animations.map(a=>a.currentTime),times,'photo flights also pause');
 await photoPause.advance(1800);assert(photoPause.animations.some((a,i)=>a.currentTime>times[i]),'photo flights resume, not restart');
 await photoPause.advance(plan.end+1000);assert.equal(photoPause.section.dataset.storyPhase,'complete');
 const finished=photoPause.animations.length;photoPause.win.fire('wheel');photoPause.win.fire('touchstart');photoPause.port.fire('scroll');await photoPause.advance(2000);
 assert.equal(photoPause.animations.length,finished);assert.equal(photoPause.pendingFrames,0,'completed sequence does not replay');

 const accessible=await fixture({reduced:true});await accessible.to(100);assert(!accessible.section.classList.contains('story-enhanced'));assert.equal(accessible.section.dataset.storyPhase,'complete');assert.equal(accessible.scrolled.length,0);
 const fallback=await fixture({noWAAPI:true});await fallback.to(plan.end+300);assert.equal(fallback.section.dataset.storyPhase,'complete');assert(fallback.cards.at(-1).classList.contains('landed'));
 const bad=await fixture({broken:true});await bad.to(plan.end+300);assert.equal(bad.section.dataset.storyPhase,'complete');assert(bad.final.querySelector('button'),'failed final photo has retry');
 for(const [paperHeight,screenHeight] of [[640,640],[900,780],[1500,900]]){const r=await fixture({paperHeight,screenHeight});await r.to(plan.end+300);assert.equal(r.page.clientHeight,paperHeight);assert.equal(r.section.dataset.storyPhase,'complete');assert.equal(r.scrolled.length,0);assert(r.port.scrollTop>0);const h=Math.min(r.port.clientHeight,screenHeight);assert.equal(Number.parseFloat(r.page.style['--final-photo-height']),h-76,'large portrait keeps safe margins');assert(r.final.classList.contains('revealed'))}
 const away=await fixture();await away.to(1000);away.win.scrollY=10000;const seen=away.glyphs.flat(2).filter(g=>g.classList.contains('typed')).length;await away.advance(3000);assert.equal(away.glyphs.flat(2).filter(g=>g.classList.contains('typed')).length,seen,'leaving the fixed paper pauses sequence');assert.equal(away.pendingFrames,0);away.win.scrollY=0;away.win.fire('scroll');await away.advance(1000);assert(away.glyphs.flat(2).filter(g=>g.classList.contains('typed')).length>seen);
 const resized=await fixture();await resized.to(8000);resized.previous.height=720;resized.win.innerHeight=720;resized.win.visualViewport.height=720;resized.win.fire('resize');await resized.to(plan.end+300);assert.equal(resized.page.clientHeight,720);assert.equal(resized.section.dataset.storyPhase,'complete');
 const integrated=await fixture({integrated:true,frameStep:16}),completion=[];
 integrated.doc.addEventListener('memory-story-complete',event=>{completion.push({at:integrated.time,reason:event.detail.reason});assert.equal(integrated.final.style.opacity,'1','final photo completely visible before completion');assert(integrated.glyphs.flat(2).every(g=>g.classList.contains('typed')),'all text printed before completion')});
 await integrated.to(plan.end+100);assert.equal(completion.length,1);assert.equal(completion[0].reason,'finished');assert.equal(integrated.scrolled.length,0);
 await integrated.to(completion[0].at+999);assert.equal(integrated.scrolled.length,0,'full 1s hold starts at actual playback completion');
 await integrated.advance(700);assert(integrated.win.scrollY>0&&integrated.win.scrollY<930);
 await integrated.advance(900);assert.equal(integrated.win.scrollY,930,'actual natural completion reaches fourth-page start');assert.equal(integrated.pendingFrames,0);
 const totalMoves=integrated.scrolled.length;integrated.win.fire('scroll');integrated.port.fire('scroll');await integrated.advance(5000);assert.equal(completion.length,1);assert.equal(integrated.scrolled.length,totalMoves,'no repeat after scroll');
 for(const options of [{broken:true},{reduced:true}]){const f=await fixture({...options,integrated:true});await f.to(plan.end+5000);assert.equal(f.scrolled.length,0,'missing finale or reduced motion cannot auto-advance')}
 console.log('PASS: actual timeline completion -> full 1s hold -> fourth page; one shot; all text and finale visible first; failed image/reduced motion no jump.');
 console.log('PASS: unchanged glyph timing/layout/photo schedule; 19 cards land before hold/fade; centered keepsake; enlarged finale; line-centered scrolling; font reflow/resize; 1000ms holds; fixed comic/paper; 640/850/900/1500px heights; manual override; image-error fallback.');
 console.log('PASS: wheel/touch/momentum pause and resume; long hold; offscreen and background suspend; single RAF; photo phase resume; completed state stays readable. Total sequence:',Math.round(plan.end/1000)+'s');
})().catch(e=>{console.error(e);process.exitCode=1});
