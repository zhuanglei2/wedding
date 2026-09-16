const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'music.js'),'utf8');
const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8'),css=fs.readFileSync(path.join(__dirname,'../v10.171-compact-music/music.css'),'utf8');
assert(html.includes('data-start-seconds="18"'));
assert(!/music-(?:back|forward|foot|artist|spacer)/.test(html));
assert(!html.includes('点击播放，拖动试听'));
assert(html.indexOf('id="wedding-music"')>html.indexOf('id="our-story"'));
assert(html.includes('</section>\n</div>\n</article>'),'player belongs inside the artwork');
assert(css.includes('position:absolute;z-index:8;right:2%;top:93.75%'));
const refs=[...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m=>m[1].split(/[?#]/)[0]).filter(u=>u&&!/^(?:[a-z]+:|\/)/i.test(u));
refs.forEach(u=>assert(fs.existsSync(path.resolve(__dirname,u)),u));

class El{
 constructor(){this.events={};this.dataset={};this.attrs={};this.disabled=true;this.textContent='';this.value='0';this.values={};this.style={setProperty:(k,v)=>this.values[k]=v};this.classes=new Set();this.classList={contains:n=>this.classes.has(n),add:n=>this.classes.add(n),remove:n=>this.classes.delete(n)}}
 addEventListener(k,fn){(this.events[k]||=[]).push(fn)}
 removeEventListener(k,fn){this.events[k]=(this.events[k]||[]).filter(f=>f!==fn)}
 dispatchEvent(e){for(const fn of [...(this.events[e.type]||[])])fn(e);return true}
 fire(type,more={}){this.dispatchEvent({type,...more})}
 setAttribute(k,v){this.attrs[k]=v}
 focus(){this.focused=true}
 contains(el){return el===this||Object.values(this.children||{}).includes(el)}
 querySelector(s){return this.children?.[s]||null}
 getBoundingClientRect(){return this.rect||{top:0,bottom:600}}
}
async function flush(){for(let i=0;i<8;i++)await Promise.resolve()}
function fixture({blocked=false,start=0,loaded=true,visible=true,settled=false,pending=true}={}){
 const doc=new El(),win=new El(),root=new El(),section=new El(),art=new El(),photo=new El(),cover=new El(),player=new El(),audio=new El();
 const icon=new El(),toggle=new El(),seek=new El(),elapsed=new El(),duration=new El(),status=new El(),options=new El();
 options.open=false;options.children={summary:new El()};
 toggle.children={span:icon};player.dataset={state:'waiting',startSeconds:String(start)};
 player.children={'.music-toggle':toggle,'.music-seek':seek,'.music-elapsed':elapsed,'.music-duration':duration,'.music-status':status,'.music-options':options};
 section.children={'.reference-art':art,'.camera-photo img':photo};
 art.rect=visible?{top:0,bottom:600}:{top:900,bottom:1500};if(settled)art.classes.add('camera-photo-settled');
 if(pending)root.classes.add('camera-pending');
 photo.complete=loaded;photo.naturalWidth=loaded?1600:0;
 audio.dataset.src='../v10.169-photo-music/media/love-duet-192.mp3';
 Object.assign(audio,{src:'',readyState:0,songLoads:0,preload:'none',paused:true,muted:false,currentTime:0,duration:NaN,ended:false,loads:0,plays:[],block:blocked,pendingPlay:false});
 audio.load=()=>{audio.loads++;audio.songLoads++;audio.currentTime=0;audio.ended=false;audio.readyState=1;audio.duration=264.724898;audio.fire('loadedmetadata')};
 audio.pause=()=>{audio.paused=true;audio.fire('pause')};
 audio.play=()=>{if(audio.src.startsWith('data:')){audio.currentTime=0;audio.duration=.02;audio.readyState=1;audio.fire('loadedmetadata')}
  audio.plays.push({muted:audio.muted,at:audio.currentTime,src:audio.src});
  if(audio.block)return Promise.reject(Object.assign(new Error('blocked'),{name:'NotAllowedError'}));
  if(audio.pendingPlay)return new Promise(resolve=>{audio.resolve=()=>{audio.paused=false;audio.fire('playing');resolve()}});
  audio.paused=false;audio.fire('playing');return Promise.resolve();
 };
 doc.documentElement=root;doc.hidden=false;doc.children={'#our-story':section,'#wedding-music':player,'#wedding-audio':audio,'.cover-enter':cover};
 win.innerHeight=800;const observers=[];
 win.MutationObserver=class{constructor(fn){this.fn=fn;observers.push(this)}observe(){}disconnect(){this.done=true}};
 const timers=new Map();let timerId=0;
 const context={document:doc,window:win,Event:class{constructor(type){this.type=type}},console,setTimeout:fn=>{timers.set(++timerId,fn);return timerId},clearTimeout:id=>timers.delete(id)};
 vm.runInNewContext(source,context);
 const mutate=()=>observers.filter(o=>!o.done).forEach(o=>o.fn());
 return{doc,win,root,art,photo,cover,player,audio,toggle,seek,elapsed,status,options,mutate,timers,ready:()=>{art.classes.add('camera-photo-settled');mutate()}};
}
(async()=>{
 const a=fixture();assert.equal(a.audio.loads,0);assert.equal(a.audio.plays.length,0,'no initial download/play');
 a.cover.fire('click');await flush();assert.equal(a.audio.loads,0,'cover click primes without requesting the song');assert(a.audio.plays[0].muted,'gesture preparation is silent');assert(a.audio.paused);assert.equal(a.player.dataset.state,'waiting');
 a.ready();await flush();assert.equal(a.player.dataset.state,'playing');assert.equal(a.audio.currentTime,0);assert(!a.audio.muted);assert.equal(a.toggle.attrs['aria-pressed'],'true');
 a.toggle.fire('click');assert(a.audio.paused);a.audio.currentTime=42;a.audio.fire('timeupdate');assert.equal(a.elapsed.textContent,'00:42');
 const played=a.audio.plays.length;a.doc.fire('camera-story-complete');a.mutate();a.win.fire('scroll');assert.equal(a.audio.plays.length,played,'no restart on revisit');assert.equal(a.audio.currentTime,42);
 a.toggle.fire('click');await flush();assert.equal(a.audio.currentTime,42,'manual resume keeps time');
 a.seek.value='75.5';a.seek.fire('input');assert.equal(a.audio.currentTime,75.5);a.seek.fire('change');assert.equal(a.elapsed.textContent,'01:15');
 a.seek.value='999';a.seek.fire('input');a.seek.fire('change');assert(a.audio.currentTime<265);a.seek.value='0';a.seek.fire('input');a.seek.fire('change');assert.equal(a.audio.currentTime,0);
 a.doc.hidden=true;a.doc.fire('visibilitychange');assert(a.audio.paused);a.doc.hidden=false;a.doc.fire('visibilitychange');await flush();assert(!a.audio.paused);
 a.toggle.fire('click');const pausedPlays=a.audio.plays.length;a.doc.hidden=true;a.doc.fire('visibilitychange');a.doc.hidden=false;a.doc.fire('visibilitychange');await flush();assert.equal(a.audio.plays.length,pausedPlays,'manual pause survives background');
 const b=fixture({blocked:true});b.ready();await flush();assert.equal(b.player.dataset.state,'blocked');assert.equal(b.toggle.attrs['aria-pressed'],'false');assert(!b.toggle.disabled);assert.equal(b.audio.plays.length,1);
 b.win.fire('scroll');b.doc.fire('camera-story-complete');await flush();assert.equal(b.audio.plays.length,1,'blocked auto play is not repeatedly retried');
 b.audio.block=false;b.toggle.fire('click');await flush();assert.equal(b.player.dataset.state,'playing');
 b.audio.fire('error');assert.equal(b.player.dataset.state,'error');const loads=b.audio.loads;b.toggle.fire('click');await flush();assert.equal(b.audio.loads,loads+1);assert.equal(b.player.dataset.state,'playing');
 const c=fixture({loaded:false});c.ready();assert.equal(c.audio.plays.length,0,'broken/unloaded photo does not start music');c.photo.complete=true;c.photo.naturalWidth=1600;c.photo.fire('load');await flush();assert.equal(c.player.dataset.state,'playing');
 const d=fixture({visible:false,settled:true,pending:false});assert.equal(d.audio.loads,0,'static/reduced-motion page below fold does not preload');d.art.rect={top:20,bottom:620};d.win.fire('scroll');await flush();assert.equal(d.player.dataset.state,'playing');
 const e=fixture({start:18});e.ready();await flush();assert.equal(e.audio.currentTime,18);e.audio.ended=true;e.audio.fire('ended');e.toggle.fire('click');await flush();assert.equal(e.audio.currentTime,18,'configured replay starts at chosen offset');
 const f=fixture();f.audio.pendingPlay=true;f.ready();assert.equal(f.player.dataset.state,'loading');f.toggle.fire('click');f.audio.resolve();await flush();assert(f.audio.paused,'late play promise cannot override manual cancel');
 const g=fixture();g.audio.pendingPlay=true;g.cover.fire('click');g.ready();g.seek.value='30';g.seek.fire('input');g.seek.fire('change');g.audio.pendingPlay=false;g.audio.resolve();await flush();assert.equal(g.audio.currentTime,30,'late gesture preparation keeps reader seek');
 let interactions=0;g.doc.addEventListener('wedding-music-interaction',()=>interactions++);g.player.fire('keydown');g.options.open=true;g.options.fire('toggle');assert.equal(interactions,2);
 g.player.fire('keydown',{key:'Escape',preventDefault(){}});assert(!g.options.open);assert(g.options.children.summary.focused);
 g.options.open=true;g.doc.fire('pointerdown',{target:g.toggle});assert(g.options.open);g.doc.fire('pointerdown',{target:new El()});assert(!g.options.open);
 console.log('PASS: no initial audio request; silent gesture prep; photo-loaded/visible/settled gate; blocked autoplay/manual fallback; real playback state; seek/disclosure; once only; background/manual pause; retry; 18-second offset; late-promise cancellation.');

 // Load-order regressions: the embedded silence and the real song are different phases.
 const h=fixture({start:18,visible:false});
 h.doc.fire('camera-assets-ready');await flush();assert.equal(h.audio.songLoads,0,'decoded assets alone must not prefetch music');
 h.cover.fire('click');await flush();assert.equal(h.audio.songLoads,1,'open + decoded visuals may buffer');
 assert.equal(h.audio.plays.length,1);assert(h.audio.plays[0].src.startsWith('data:audio/wav;'));
 assert.equal(h.audio.currentTime,18,'silent metadata must not clamp the chosen 18 second start');
 h.doc.fire('camera-story-started');h.doc.fire('camera-assets-ready');assert.equal(h.audio.songLoads,1,'duplicate readiness does not reload');
 h.art.rect={top:0,bottom:600};h.ready();await flush();assert.equal(h.audio.plays.length,2);assert.equal(h.audio.currentTime,18);
 const i=fixture({start:18});
 i.cover.fire('click');await flush();assert.equal(i.audio.songLoads,0,'slow visuals keep music out of the network');
 i.doc.fire('camera-assets-ready');await flush();assert.equal(i.audio.songLoads,1);assert(i.audio.paused,'buffering never plays before photo');
 const j=fixture({start:18});j.audio.pendingPlay=true;j.cover.fire('click');
 const finishSilent=j.audio.resolve;j.doc.fire('camera-assets-ready');assert.equal(j.audio.songLoads,0,'do not replace source during priming');
 j.audio.pendingPlay=false;for(const fn of [...j.timers.values()])fn();assert.equal(j.audio.songLoads,1,'stuck silent promise is bounded');
 j.ready();await flush();j.seek.value='32';j.seek.fire('input');j.seek.fire('change');
 finishSilent();await flush();assert.equal(j.audio.currentTime,32,'late priming cannot reset the real track');assert(!j.audio.paused);
 const k=fixture({start:18});k.cover.fire('click');await flush();k.doc.hidden=true;k.doc.fire('camera-assets-ready');
 assert.equal(k.audio.songLoads,0,'hidden page does not initiate the real MP3');k.doc.hidden=false;k.doc.fire('visibilitychange');
 assert.equal(k.audio.songLoads,1);
 const l=fixture({start:18});l.doc.fire('camera-story-started');assert.equal(l.audio.songLoads,1,'direct camera entry can buffer');
 l.audio.fire('error');l.ready();await flush();assert.equal(l.audio.songLoads,2,'failed speculative buffer is retried at playback');
 assert.equal(l.audio.currentTime,18);assert.equal(l.player.dataset.state,'playing');
 const silent=Buffer.from(h.audio.plays[0].src.split(',')[1],'base64');
 assert.equal(silent.subarray(0,4).toString(),'RIFF');assert.equal(silent.readUInt32LE(40),160);
 assert(silent.subarray(44).every(n=>n===128),'inline 8-bit PCM contains only silence');
 const before=fs.readFileSync(path.join(__dirname,'../v10.174-restore-cover/index.html'),'utf8');
 assert.equal(html,before.replace('V10.174','V10.175').replace('src="../v10.171-compact-music/music.js"','src="music.js"').replace('<audio id="wedding-audio" src=','<audio id="wedding-audio" data-src='));
 assert(!/<audio[^>]*\ssrc=/.test(html),'no fetchable music source in initial markup');
 console.log('PASS: visual-first request gating, 204-byte local silent priming, unchanged MP3, early/late gestures, watchdog, hidden/deep-link fallback, prebuffer failure, 18s preserved; HTML appearance and animation references unchanged.');
 // Use the actual handoff controller: music interaction must cancel its hold.
 const doc=new El(),win=new El(),root=new El(),page=new El(),target=new El();let hold=null;
 root.style.scrollBehavior='';doc.documentElement=root;doc.children={'#our-story':page,'#celebration':target};
 win.innerHeight=800;win.innerWidth=390;win.requestAnimationFrame=()=>1;win.cancelAnimationFrame=()=>{};win.matchMedia=()=>({matches:false});
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../v10.169-photo-music/story-handoff.js'),'utf8'),{document:doc,window:win,Event:class{constructor(type){this.type=type}},setTimeout:fn=>{hold=fn;return 1},clearTimeout:()=>{hold=null}});
 doc.fire('camera-story-started');doc.fire('camera-story-complete',{detail:{reason:'finished'}});assert(hold);assert(root.classes.has('story-handoff-pending'));
 doc.fire('wedding-music-interaction');assert.equal(hold,null);assert(!root.classes.has('story-handoff-pending'),'music input releases third-page gate without jumping');
 console.log('PASS: actual page 2→3 controller cancels on player interaction. These are simulated DOM/media tests, not WeChat device playback.');
})().catch(error=>{console.error(error);process.exitCode=1});
