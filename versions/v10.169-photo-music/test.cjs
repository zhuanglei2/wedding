const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'music.js'),'utf8');
class El{
 constructor(){this.events={};this.dataset={};this.attrs={};this.disabled=true;this.textContent='';this.value='0';this.values={};this.style={setProperty:(k,v)=>this.values[k]=v};this.classes=new Set();this.classList={contains:n=>this.classes.has(n),add:n=>this.classes.add(n),remove:n=>this.classes.delete(n)}}
 addEventListener(k,fn){(this.events[k]||=[]).push(fn)}
 removeEventListener(k,fn){this.events[k]=(this.events[k]||[]).filter(f=>f!==fn)}
 dispatchEvent(e){for(const fn of [...(this.events[e.type]||[])])fn(e);return true}
 fire(type,more={}){this.dispatchEvent({type,...more})}
 setAttribute(k,v){this.attrs[k]=v}
 querySelector(s){return this.children?.[s]||null}
 getBoundingClientRect(){return this.rect||{top:0,bottom:600}}
}
async function flush(){for(let i=0;i<8;i++)await Promise.resolve()}
function fixture({blocked=false,start=0,loaded=true,visible=true,settled=false,pending=true}={}){
 const doc=new El(),win=new El(),root=new El(),section=new El(),art=new El(),photo=new El(),cover=new El(),player=new El(),audio=new El();
 const icon=new El(),toggle=new El(),seek=new El(),elapsed=new El(),duration=new El(),status=new El(),back=new El(),forward=new El();
 toggle.children={span:icon};player.dataset={state:'waiting',startSeconds:String(start)};
 player.children={'.music-toggle':toggle,'.music-seek':seek,'.music-elapsed':elapsed,'.music-duration':duration,'.music-status':status,'.music-back':back,'.music-forward':forward};
 section.children={'.reference-art':art,'.camera-photo img':photo};
 art.rect=visible?{top:0,bottom:600}:{top:900,bottom:1500};if(settled)art.classes.add('camera-photo-settled');
 if(pending)root.classes.add('camera-pending');
 photo.complete=loaded;photo.naturalWidth=loaded?1600:0;
 Object.assign(audio,{preload:'none',paused:true,muted:false,currentTime:0,duration:NaN,ended:false,loads:0,plays:[],block:blocked,pendingPlay:false});
 audio.load=()=>{audio.loads++;audio.duration=264.724898;audio.fire('loadedmetadata')};
 audio.pause=()=>{audio.paused=true;audio.fire('pause')};
 audio.play=()=>{audio.plays.push({muted:audio.muted,at:audio.currentTime});
  if(audio.block)return Promise.reject(Object.assign(new Error('blocked'),{name:'NotAllowedError'}));
  if(audio.pendingPlay)return new Promise(resolve=>{audio.resolve=()=>{audio.paused=false;audio.fire('playing');resolve()}});
  audio.paused=false;audio.fire('playing');return Promise.resolve();
 };
 doc.documentElement=root;doc.hidden=false;doc.children={'#our-story':section,'#wedding-music':player,'#wedding-audio':audio,'.cover-enter':cover};
 win.innerHeight=800;const observers=[];
 win.MutationObserver=class{constructor(fn){this.fn=fn;observers.push(this)}observe(){}disconnect(){this.done=true}};
 const context={document:doc,window:win,Event:class{constructor(type){this.type=type}},console};
 vm.runInNewContext(source,context);
 const mutate=()=>observers.filter(o=>!o.done).forEach(o=>o.fn());
 return{doc,win,root,art,photo,cover,player,audio,toggle,seek,elapsed,status,back,forward,mutate,ready:()=>{art.classes.add('camera-photo-settled');mutate()}};
}
(async()=>{
 const a=fixture();assert.equal(a.audio.loads,0);assert.equal(a.audio.plays.length,0,'no initial download/play');
 a.cover.fire('click');await flush();assert.equal(a.audio.loads,1);assert(a.audio.plays[0].muted,'gesture preparation is silent');assert(a.audio.paused);assert.equal(a.player.dataset.state,'waiting');
 a.ready();await flush();assert.equal(a.player.dataset.state,'playing');assert.equal(a.audio.currentTime,0);assert(!a.audio.muted);assert.equal(a.toggle.attrs['aria-pressed'],'true');
 a.toggle.fire('click');assert(a.audio.paused);a.audio.currentTime=42;a.audio.fire('timeupdate');assert.equal(a.elapsed.textContent,'00:42');
 const played=a.audio.plays.length;a.doc.fire('camera-story-complete');a.mutate();a.win.fire('scroll');assert.equal(a.audio.plays.length,played,'no restart on revisit');assert.equal(a.audio.currentTime,42);
 a.toggle.fire('click');await flush();assert.equal(a.audio.currentTime,42,'manual resume keeps time');
 a.seek.value='75.5';a.seek.fire('input');assert.equal(a.audio.currentTime,75.5);a.seek.fire('change');assert.equal(a.elapsed.textContent,'01:15');
 a.forward.fire('click');assert.equal(a.audio.currentTime,85.5);a.back.fire('click');assert.equal(a.audio.currentTime,75.5);
 a.seek.value='999';a.seek.fire('input');a.seek.fire('change');assert(a.audio.currentTime<265);a.seek.value='0';a.seek.fire('input');a.back.fire('click');assert.equal(a.audio.currentTime,0);
 a.doc.hidden=true;a.doc.fire('visibilitychange');assert(a.audio.paused);a.doc.hidden=false;a.doc.fire('visibilitychange');await flush();assert(!a.audio.paused);
 a.toggle.fire('click');const pausedPlays=a.audio.plays.length;a.doc.hidden=true;a.doc.fire('visibilitychange');a.doc.hidden=false;a.doc.fire('visibilitychange');await flush();assert.equal(a.audio.plays.length,pausedPlays,'manual pause survives background');
 const b=fixture({blocked:true});b.ready();await flush();assert.equal(b.player.dataset.state,'blocked');assert.equal(b.toggle.attrs['aria-pressed'],'false');assert(!b.toggle.disabled);assert.equal(b.audio.plays.length,1);
 b.win.fire('scroll');b.doc.fire('camera-story-complete');await flush();assert.equal(b.audio.plays.length,1,'blocked auto play is not repeatedly retried');
 b.audio.block=false;b.toggle.fire('click');await flush();assert.equal(b.player.dataset.state,'playing');
 b.audio.fire('error');assert.equal(b.player.dataset.state,'error');const loads=b.audio.loads;b.toggle.fire('click');await flush();assert.equal(b.audio.loads,loads+1);assert.equal(b.player.dataset.state,'playing');
 const c=fixture({loaded:false});c.ready();assert.equal(c.audio.plays.length,0,'broken/unloaded photo does not start music');c.photo.complete=true;c.photo.naturalWidth=1600;c.photo.fire('load');await flush();assert.equal(c.player.dataset.state,'playing');
 const d=fixture({visible:false,settled:true,pending:false});assert.equal(d.audio.loads,0,'static/reduced-motion page below fold does not preload');d.art.rect={top:20,bottom:620};d.win.fire('scroll');await flush();assert.equal(d.player.dataset.state,'playing');
 const e=fixture({start:67});e.ready();await flush();assert.equal(e.audio.currentTime,67);e.audio.ended=true;e.audio.fire('ended');e.toggle.fire('click');await flush();assert.equal(e.audio.currentTime,67,'configured replay starts at chosen offset');
 const f=fixture();f.audio.pendingPlay=true;f.ready();assert.equal(f.player.dataset.state,'loading');f.toggle.fire('click');f.audio.resolve();await flush();assert(f.audio.paused,'late play promise cannot override manual cancel');
 const g=fixture();g.audio.pendingPlay=true;g.cover.fire('click');g.ready();g.seek.value='30';g.seek.fire('input');g.seek.fire('change');g.audio.pendingPlay=false;g.audio.resolve();await flush();assert.equal(g.audio.currentTime,30,'late gesture preparation keeps reader seek');
 let interactions=0;g.doc.addEventListener('wedding-music-interaction',()=>interactions++);g.player.fire('keydown');g.back.fire('click');assert.equal(interactions,2);
 console.log('PASS: no initial audio request; silent gesture prep; photo-loaded/visible/settled gate; blocked autoplay/manual fallback; real playback state; seek/skip; once only; background/manual pause; retry; future offset; late-promise cancellation.');
 // Use the actual handoff controller: music interaction must cancel its hold.
 const doc=new El(),win=new El(),root=new El(),page=new El(),target=new El();let hold=null;
 root.style.scrollBehavior='';doc.documentElement=root;doc.children={'#our-story':page,'#celebration':target};
 win.innerHeight=800;win.innerWidth=390;win.requestAnimationFrame=()=>1;win.cancelAnimationFrame=()=>{};win.matchMedia=()=>({matches:false});
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'story-handoff.js'),'utf8'),{document:doc,window:win,Event:class{constructor(type){this.type=type}},setTimeout:fn=>{hold=fn;return 1},clearTimeout:()=>{hold=null}});
 doc.fire('camera-story-started');doc.fire('camera-story-complete',{detail:{reason:'finished'}});assert(hold);assert(root.classes.has('story-handoff-pending'));
 doc.fire('wedding-music-interaction');assert.equal(hold,null);assert(!root.classes.has('story-handoff-pending'),'music input releases third-page gate without jumping');
 console.log('PASS: actual page 2→3 controller cancels on player interaction. These are simulated DOM/media tests, not WeChat device playback.');
})().catch(error=>{console.error(error);process.exitCode=1});
