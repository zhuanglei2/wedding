const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const math=require('./memory-math.js'),html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
const source=fs.readFileSync(path.join(__dirname,'memory.js'),'utf8');
const sectionHTML=html.slice(html.indexOf('<section id="story-timeline"'),html.indexOf('</section>',html.indexOf('<section id="story-timeline"'))+10);
const nodeHTML=[...sectionHTML.matchAll(/<li class="story-node[^>]+>(.*?)<\/li>/gs)].map(m=>m[1]);
const textRows=nodeHTML.map(h=>[...h.matchAll(/<(h3|p)[^>]+class="type-block"[^>]*>(.*?)<\/\1>/gs)].map(m=>[...m[2].matchAll(/<span class="type-glyph" aria-hidden="true">(.*?)<\/span>/gs)].map(x=>x[1])));
const plan=math.makePlan(textRows);
assert.equal(nodeHTML.length,5);assert.equal((sectionHTML.match(/data-memory-card=/g)||[]).length,11);
assert(!sectionHTML.includes('memory-11.webp'),'old single heart must not remain');
assert(sectionHTML.includes('2026-10'));assert(sectionHTML.includes('media/wedding-finale.webp'));
assert(sectionHTML.indexOf('keepsake-grid')<sectionHTML.indexOf('wedding-node'));
const keepsakeHTML=sectionHTML.match(/<figure class="memory-card memory-keepsake"[\s\S]*?<\/figure>/)[0];
assert.equal((keepsakeHTML.match(/data-media-src=/g)||[]).length,4,'four photos retained');
assert(!/keepsake-author|keepsake-date|<figcaption>|朝暮与共|四季相依|作乐|2026年1月3日/.test(keepsakeHTML),'no keepsake text');
const old=fs.readFileSync(path.join(__dirname,'../v10.150-fixed-story-paper/index.html'),'utf8');
const strip=h=>h.replace(/<article class="about-reactions[\s\S]*?<\/article>/,'STORY').replace(/V10\.(150|151|152)/g,'VERSION').trimEnd();
assert(strip(html)===strip(old),'outside story page unchanged');
const oldIntro=old.slice(old.indexOf('<div class="story-paper-content">')+'<div class="story-paper-content">'.length,old.indexOf('<section id="story-timeline"'));
const fixedIntro=html.slice(html.indexOf('<div class="story-fixed-intro">')+'<div class="story-fixed-intro">'.length,html.indexOf('</div><div class="story-timeline-frame">'));
assert.equal(fixedIntro,oldIntro,'heading and comic dialogue unchanged');
assert(html.indexOf('story-fixed-intro')<html.indexOf('story-timeline-frame'));
assert(!html.slice(html.indexOf('<div class="story-paper-window"'),html.indexOf('<section id="story-timeline"')).includes('reaction-story'),'comic is outside scroll viewport');
const previousMath=require('../v10.151-fixed-comic-timeline/memory-math.js');
const previousHTML=fs.readFileSync(path.join(__dirname,'../v10.151-fixed-comic-timeline/index.html'),'utf8');
assert.equal(html.replaceAll('V10.152','V10.151').trimEnd(),previousHTML.trimEnd(),'layout and all content unchanged');
for(const file of ['memory.css','memory.js'])assert.equal(fs.readFileSync(path.join(__dirname,file),'utf8').trimEnd(),fs.readFileSync(path.join(__dirname,'../v10.151-fixed-comic-timeline',file),'utf8').trimEnd(),file+' unchanged');
assert.deepEqual(math.photoSchedule(),previousMath.photoSchedule(),'photo motion timings unchanged');
assert.equal(math.glyphDelay('爱'),45);assert.equal(math.nodeHold,1000);
for(const heading of [false,true])for(const glyph of ['爱','2','A','，','。','！'])assert(math.glyphDelay(glyph,heading)<previousMath.glyphDelay(glyph,heading),'faster typing');
assert(plan.end<previousMath.makePlan(textRows).end,'overall sequence is faster');
for(let node=0;node<5;node++){
 const last=plan.events.filter(e=>e.kind==='block-end'&&e.node===node).at(-1).at;
 const next=node===3?plan.photoStart:node===4?plan.finalPhotoStart:plan.events.find(e=>e.kind==='node'&&e.node===node+1).at;
 assert.equal(next-last,1000,'exact one-second hold after node '+node);
}
assert.equal(textRows.at(-1).at(-1).join(''),'我们要结婚啦！！！！');
assert(html.includes('story-paper-window'));assert(!source.includes('window.scrollTo'),'no automatic document scroll');
const urls=[...sectionHTML.matchAll(/(?:src|data-media-src)="([^"]+)"/g)].map(m=>m[1]);
for(const url of urls)assert(fs.existsSync(path.resolve(__dirname,url)),url);
const schedule=math.photoSchedule();for(let i=2;i<schedule.length;i++)assert(schedule[i].start-schedule[i-1].start<schedule[i-1].start-schedule[i-2].start);
assert(plan.events.filter(e=>e.kind==='node').at(-1).at>plan.photoEnd);
assert.equal(plan.fadeStart-plan.holdStart,3000);assert.equal(plan.photoEnd-plan.fadeStart,1200);

class Element {
 constructor(name,y=0,height=80){this.name=name;this.y=y;this.height=height;this.offsetHeight=height;this.clientHeight=height;this.clientWidth=328;this.dataset={};this.style={setProperty(k,v){this[k]=v}};this.listeners={};this.children=[];this.hidden=false;this.classes=new Set();this.classList={add:(...v)=>v.forEach(x=>this.classes.add(x)),remove:(...v)=>v.forEach(x=>this.classes.delete(x)),contains:v=>this.classes.has(v)};this.selectors={};}
 querySelectorAll(s){return this.selectors[s]||[]}
 querySelector(s){return this.querySelectorAll(s)[0]||null}
 addEventListener(name,f){(this.listeners[name]??=[]).push(f)}
 removeEventListener(name,f){this.listeners[name]=(this.listeners[name]||[]).filter(x=>x!==f)}
 fire(name,event={}){for(const f of [...(this.listeners[name]||[])])f(event)}
 append(el){this.children.push(el);this.selectors.button=[el]}
 remove(){this.removed=true}
 getBoundingClientRect(){const top=this.y-this.win.scrollY-(this.scrollParent?.scrollTop||0);return {top,bottom:top+this.height,left:0,width:this.clientWidth,height:this.height}}
}
async function fixture({reduced=false,noWAAPI=false,broken=false,paperHeight=850,screenHeight=850,introHeight=280}={}){
 let time=0,serial=0,scrollPort=null;const raf=new Map(),timers=new Map(),animations=[],scrolled=[],innerMoves=[];
 const win=new Element('window');win.scrollY=0;win.innerHeight=screenHeight;win.visualViewport={height:screenHeight};win.WeddingMemoryMath=math;win.scrollTo=(_,y)=>{win.scrollY=y;scrolled.push(y)};
 function el(name,y,h){const result=new Element(name,y,h);result.win=win;result.scrollParent=scrollPort;return result}
 const root=el('html');root.scrollHeight=6000;
 const doc=el('document');doc.documentElement=root;doc.hidden=false;doc.fonts={ready:Promise.resolve()};doc.createElement=name=>el(name);
 const frameTop=introHeight+60;
 const page=el('page',0,paperHeight),intro=el('intro',30,introHeight),port=el('port',frameTop,paperHeight-frameTop-40),previous=el('previous',-paperHeight,paperHeight);port.scrollHeight=4200;let scrollTop=0;Object.defineProperty(port,'scrollTop',{get(){return scrollTop},set(v){scrollTop=Math.max(0,Math.min(port.scrollHeight-port.clientHeight,v));innerMoves.push(scrollTop)}});page.selectors['.story-paper-window']=[port];page.selectors['.story-fixed-intro']=[intro];
 page.style.setProperty=function(k,v){this[k]=v;if(k==='--story-page-height'){page.height=page.clientHeight=Number.parseFloat(v);port.height=port.clientHeight=page.height-frameTop-40}};
 doc.selectors['#celebration']=[page];doc.selectors['#our-story']=[previous];scrollPort=port;
 const section=el('section',frameTop+50,3800),copy=el('copy',frameTop+1900,800),stage=el('stage',frameTop+1900,800),final=el('final',frameTop+3020,520);
 const image=(name)=>{const i=el(name);i.dataset.mediaSrc=name+'.webp';i.naturalWidth=0;i.complete=false;i.decode=()=>Promise.resolve();Object.defineProperty(i,'src',{set(v){this.source=v;this.complete=true;this.naturalWidth=broken?0:800;Promise.resolve().then(()=>this.fire(broken?'error':'load'))}});return i};
 let ypos=frameTop+70;const blocks=[],glyphs=[];
 const nodes=textRows.map((row,n)=>{const node=el('node'+n,ypos,450);const bs=[],gs=[];row.forEach((text,b)=>{const block=el('block'+b,ypos,80);const chars=text.map((value,i)=>{const g=el('glyph',ypos+Math.floor(i/18)*28,28);g.textContent=value;return g});block.selectors['.type-glyph']=chars;bs.push(block);gs.push(chars);ypos+=Math.max(80,Math.ceil(text.length/18)*28)});node.selectors['.type-block']=bs;blocks.push(bs);glyphs.push(gs);ypos+=120;return node});
 final.y=nodes.at(-1).y+110;
 const imgs=[];const cards=Array.from({length:11},(_,i)=>{const card=el('card'+i,frameTop+2000,i===10?310:290);const assets=Array.from({length:i===10?4:1},(_,j)=>image(`photo${i}-${j}`));imgs.push(...assets);card.selectors['img[data-media-src]']=assets;if(!noWAAPI)card.animate=(frames,options)=>{const a={frames,options,currentTime:0,pause(){this.paused=true},cancel(){this.cancelled=true}};animations.push(a);return a};return card});
 const finalImg=image('final');imgs.push(finalImg);final.selectors['img[data-media-src]']=[finalImg];
 section.selectors={'[data-story-node]':nodes,'.memory-stack':[stage],'.memory-copy':[copy],'.wedding-finale':[final],'img[data-media-src]':imgs};stage.selectors['[data-memory-card]']=cards;doc.selectors['#story-timeline']=[section];
 const media=el('media');media.matches=reduced;
 const context={window:win,document:doc,matchMedia:()=>media,requestAnimationFrame:f=>{raf.set(++serial,f);return serial},cancelAnimationFrame:id=>raf.delete(id),setTimeout:(f,ms)=>{timers.set(++serial,{at:time+ms,f});return serial},clearTimeout:id=>timers.delete(id),Date:{now:()=>1000000+time},Promise,console};
 vm.runInNewContext(source,context);
 const flush=async()=>{for(let i=0;i<12;i++)await Promise.resolve()};await flush();
 async function advance(ms){const until=time+ms;while(time<until){time=Math.min(time+32,until);for(const [id,timer] of [...timers])if(timer.at<=time){timers.delete(id);timer.f()}const callbacks=[...raf.values()];raf.clear();callbacks.forEach(f=>f(time));await flush()}}
 async function to(t){await advance(Math.max(0,t-time))}
 return {advance,to,win,doc,section,page,intro,port,previous,nodes,blocks,glyphs,stage,cards,final,media,scrolled,innerMoves,animations,plan,get time(){return time}};
}
(async()=>{
 for(let node=0;node<5;node++){
  const hold=await fixture(),last=plan.events.filter(e=>e.kind==='block-end'&&e.node===node).at(-1).at;
  await hold.to(last+100);assert(hold.glyphs[node].flat().every(g=>g.classList.contains('typed')));
  const typed=hold.glyphs.flat(2).filter(g=>g.classList.contains('typed')).length;
  await hold.to(last+950);assert.equal(hold.glyphs.flat(2).filter(g=>g.classList.contains('typed')).length,typed,'no typing during one-second hold');
  if(node<3)assert(!hold.nodes[node+1].classList.contains('entered'));
  if(node===3)assert.equal(hold.animations.length,0,'photos wait until reading hold ends');
  if(node===4)assert(!hold.final.classList.contains('revealed'),'final photo waits until reading hold ends');
 }
 const f=await fixture(),introRect=f.intro.getBoundingClientRect(),portRect=f.port.getBoundingClientRect();await f.to(600);assert(f.nodes[0].classList.contains('entered'));assert(!f.nodes[1].classList.contains('entered'));
 const first=f.glyphs[0][0].filter(g=>g.classList.contains('typed')).length;assert(first>0&&first<f.glyphs[0][0].length,'real character typing');
 await f.to(plan.photoStart+100);assert(f.glyphs[3].flat().every(g=>g.classList.contains('typed')));assert(!f.nodes[4].classList.contains('entered'));assert.equal(f.animations.length,11);
 await f.to(plan.holdStart+300);assert.equal(f.section.dataset.storyPhase,'keepsake-hold');assert(f.cards[10].classList.contains('landed'));
 await f.to(plan.fadeStart+650);assert.equal(f.section.dataset.storyPhase,'fading');assert(Number(f.stage.style.opacity)>0&&Number(f.stage.style.opacity)<1);
 await f.to(plan.photoEnd+650);assert(f.stage.hidden);assert(f.nodes[4].classList.contains('entered'));
 await f.to(plan.finalPhotoStart+650);assert(Number(f.final.style.opacity)>0&&Number(f.final.style.opacity)<1);assert(f.glyphs[4].flat().every(g=>g.classList.contains('typed')));
 await f.to(plan.end+300);assert.equal(f.section.dataset.storyPhase,'complete');const count=f.animations.length;f.win.fire('scroll');await f.advance(1000);assert.equal(f.animations.length,count,'no replay');
 assert.equal(f.scrolled.length,0,'outer page never moved');assert(f.innerMoves.length>20,'timeline scrolls inside paper');assert.equal(f.page.clientHeight,850,'paper height remains unchanged');
 assert.deepEqual(f.intro.getBoundingClientRect(),introRect,'comic position unchanged throughout animation');
 assert.deepEqual(f.port.getBoundingClientRect(),portRect,'timeline viewport position and size fixed');
 assert(f.port.clientHeight<f.page.clientHeight,'timeline uses only lower part of paper');
 assert.equal(Number.parseFloat(f.page.style['--story-window-height']),f.port.clientHeight,'photos size to timeline slot');
 assert(Number.parseFloat(f.page.style['--final-photo-height'])+110+76<=f.port.clientHeight,'final photo fits below wedding text');
 f.port.scrollTop=0;f.port.fire('scroll');assert.deepEqual(f.intro.getBoundingClientRect(),introRect,'manual rewind does not move comics');
 const manual=await fixture();await manual.to(1000);manual.win.fire('wheel');const s=manual.innerMoves.length;await manual.advance(2000);assert.equal(manual.innerMoves.length,s,'manual gesture cancels auto follow');manual.doc.hidden=true;const typed=manual.glyphs.flat(2).filter(g=>g.classList.contains('typed')).length;await manual.advance(3000);assert.equal(manual.glyphs.flat(2).filter(g=>g.classList.contains('typed')).length,typed,'background pauses typing');
 const accessible=await fixture({reduced:true});await accessible.to(100);assert(!accessible.section.classList.contains('story-enhanced'));assert.equal(accessible.section.dataset.storyPhase,'complete');assert.equal(accessible.scrolled.length,0);
 const fallback=await fixture({noWAAPI:true});await fallback.to(plan.end+300);assert.equal(fallback.section.dataset.storyPhase,'complete');assert(fallback.cards[10].classList.contains('landed'));
 const bad=await fixture({broken:true});await bad.to(plan.end+300);assert.equal(bad.section.dataset.storyPhase,'complete');assert(bad.final.querySelector('button'),'failed final photo has retry');
 for(const [paperHeight,screenHeight] of [[640,640],[900,780],[1500,900]]){const r=await fixture({paperHeight,screenHeight});await r.to(plan.end+300);assert.equal(r.page.clientHeight,paperHeight);assert.equal(r.section.dataset.storyPhase,'complete');assert.equal(r.scrolled.length,0);assert(r.port.scrollTop>0)}
 const away=await fixture();await away.to(1000);away.win.scrollY=10000;const seen=away.glyphs.flat(2).filter(g=>g.classList.contains('typed')).length;await away.advance(3000);assert.equal(away.glyphs.flat(2).filter(g=>g.classList.contains('typed')).length,seen,'leaving the fixed paper pauses sequence');away.win.scrollY=0;away.win.fire('scroll');await away.advance(1000);assert(away.glyphs.flat(2).filter(g=>g.classList.contains('typed')).length>seen);
 const resized=await fixture();await resized.to(8000);resized.previous.height=720;resized.win.innerHeight=720;resized.win.visualViewport.height=720;resized.win.fire('resize');await resized.to(plan.end+300);assert.equal(resized.page.clientHeight,720);assert.equal(resized.section.dataset.storyPhase,'complete');
 console.log('PASS: faster typing; exact 1000ms hold after all five nodes; no typing/photo reveal during hold; unchanged layout, comic, photo motion; stationary comic intro; fixed timeline window; hold/fade/wedding ordering; no document scroll; fixed paper at 640/850/900/1500px; internal scroll; resize; once only; manual override; background/offscreen pause; reduced motion; no-WAAPI and image-error fallbacks.');
 console.log('Total sequence:',Math.round(plan.end/1000)+'s; assets:',new Set(urls).size);
})().catch(e=>{console.error(e);process.exitCode=1});
