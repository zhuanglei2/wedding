const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../v10.178-cover-music/music.js'),'utf8');
const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
const configuredStart=Number(html.match(/data-start-seconds="(\d+)"/)[1]);
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
function fixture({blocked=false,start=configuredStart,loaded=true,visible=true,settled=false,pending=true,hidden=false,slowPlay=false,slowMetadata=false}={}){
 const doc=new El(),win=new El(),root=new El(),section=new El(),art=new El(),photo=new El(),cover=new El(),player=new El(),audio=new El();
 const icon=new El(),toggle=new El(),seek=new El(),elapsed=new El(),duration=new El(),status=new El(),options=new El();
 const coverControl=new El(),coverLabel=new El();coverControl.children={'.cover-music-label':coverLabel};
 options.open=false;options.children={summary:new El()};
 toggle.children={span:icon};player.dataset={state:'waiting',startSeconds:String(start)};
 player.children={'.music-toggle':toggle,'.music-seek':seek,'.music-elapsed':elapsed,'.music-duration':duration,'.music-status':status,'.music-options':options};
 section.children={'.reference-art':art,'.camera-photo img':photo};
 art.rect=visible?{top:0,bottom:600}:{top:900,bottom:1500};if(settled)art.classes.add('camera-photo-settled');
 if(pending)root.classes.add('camera-pending');
 photo.complete=loaded;photo.naturalWidth=loaded?1600:0;
 audio.dataset.src='../v10.169-photo-music/media/love-duet-192.mp3';
 Object.assign(audio,{src:'',readyState:0,songLoads:0,preload:'none',paused:true,muted:false,currentTime:0,duration:NaN,ended:false,loads:0,plays:[],block:blocked,pendingPlay:slowPlay});
 audio.metadata=()=>{audio.readyState=1;audio.duration=264.724898;audio.fire('loadedmetadata')};
 audio.load=()=>{audio.loads++;audio.songLoads++;audio.currentTime=0;audio.ended=false;if(!slowMetadata)audio.metadata()};
 audio.pause=()=>{audio.paused=true;audio.fire('pause')};
 audio.play=()=>{if(audio.src.startsWith('data:')){audio.currentTime=0;audio.duration=.02;audio.readyState=1;audio.fire('loadedmetadata')}
  audio.plays.push({muted:audio.muted,at:audio.currentTime,src:audio.src});
  if(audio.block)return Promise.reject(Object.assign(new Error('blocked'),{name:'NotAllowedError'}));
  if(audio.pendingPlay)return new Promise(resolve=>{audio.resolve=()=>{audio.paused=false;audio.fire('playing');resolve()}});
  audio.paused=false;audio.fire('playing');return Promise.resolve();
 };
 doc.documentElement=root;doc.hidden=hidden;doc.children={'#our-story':section,'#wedding-music':player,'#wedding-audio':audio,'.cover-enter':cover,'#cover-music':coverControl};
 win.innerHeight=800;const observers=[];
 win.MutationObserver=class{constructor(fn){this.fn=fn;observers.push(this)}observe(){}disconnect(){this.done=true}};
 const timers=new Map();let timerId=0;
 const context={document:doc,window:win,Event:class{constructor(type){this.type=type}},console,setTimeout:fn=>{timers.set(++timerId,fn);return timerId},clearTimeout:id=>timers.delete(id)};
 vm.runInNewContext(source,context);
 const mutate=()=>observers.filter(o=>!o.done).forEach(o=>o.fn());
 return{doc,win,root,art,photo,cover,coverControl,coverLabel,player,audio,toggle,seek,elapsed,status,options,mutate,timers,ready:()=>{art.classes.add('camera-photo-settled');mutate()}};
}

(async()=>{
 const a=fixture({loaded:false,visible:false});await flush();
 assert.equal(configuredStart,50);
 assert.equal(a.audio.songLoads,1);assert.equal(a.audio.plays.length,1);assert.equal(a.audio.currentTime,50);
 assert.equal(a.audio.plays[0].at,50);assert.equal(a.elapsed.textContent,'00:50');
 assert.equal(a.player.dataset.state,'playing');assert.equal(a.coverControl.dataset.state,'playing');
 assert.equal(a.coverControl.attrs['aria-pressed'],'true');assert(!a.photo.complete,'music must not await the photo');
 a.audio.currentTime=23;for(const event of ['camera-assets-ready','camera-story-started','camera-shutter','camera-story-complete'])a.doc.fire(event);
 a.win.fire('scroll');a.cover.fire('click',{isTrusted:true});await flush();assert.equal(a.audio.plays.length,1);assert.equal(a.audio.currentTime,23,'later scenes do not restart music');
 let prevent=0,stop=0;a.coverControl.fire('click',{preventDefault(){prevent++},stopPropagation(){stop++}});assert(a.audio.paused);assert.equal(prevent,1);assert.equal(stop,1);
 a.cover.fire('click',{isTrusted:true});a.doc.fire('camera-shutter');a.doc.hidden=true;a.doc.fire('visibilitychange');a.doc.hidden=false;a.doc.fire('visibilitychange');await flush();
 assert.equal(a.audio.plays.length,1,'manual cover pause survives gestures and background');
 a.toggle.fire('click');await flush();assert.equal(a.audio.currentTime,23);assert(!a.audio.paused);assert.equal(a.coverControl.attrs['aria-pressed'],'true');
 const b=fixture({blocked:true});await flush();assert.equal(b.player.dataset.state,'blocked');assert.equal(b.coverLabel.textContent,'开启音乐');assert(!b.coverControl.disabled);
 b.doc.fire('camera-shutter');b.win.fire('scroll');b.cover.fire('click',{isTrusted:false});await flush();assert.equal(b.audio.plays.length,1);
 b.audio.block=false;b.cover.fire('click',{isTrusted:true});await flush();assert.equal(b.player.dataset.state,'playing');assert.equal(b.audio.plays.length,2);assert.equal(b.audio.songLoads,1);
 b.audio.currentTime=65;b.seek.value='42';b.seek.fire('input');b.seek.fire('change');assert.equal(b.audio.currentTime,42);
 b.doc.hidden=true;b.doc.fire('visibilitychange');assert(b.audio.paused);b.doc.hidden=false;b.doc.fire('visibilitychange');await flush();assert(!b.audio.paused);assert.equal(b.audio.currentTime,42);
 const c=fixture({hidden:true});await flush();assert.equal(c.audio.songLoads,0,'do not start in hidden tab');c.doc.hidden=false;c.doc.fire('visibilitychange');await flush();
 assert.equal(c.audio.plays.length,1);c.win.fire('pageshow');await flush();assert.equal(c.audio.plays.length,1);
 const d=fixture({slowPlay:true});assert.equal(d.player.dataset.state,'loading');d.coverControl.fire('click');d.audio.resolve();await flush();assert(d.audio.paused);assert.equal(d.player.dataset.state,'paused','late play cannot override cancel');
 const e=fixture();await flush();e.audio.currentTime=37;e.audio.fire('error');assert.equal(e.player.dataset.state,'error');e.coverControl.fire('click');await flush();
 assert.equal(e.audio.songLoads,2);assert.equal(e.audio.currentTime,37,'retry preserves time');
 e.audio.paused=true;e.audio.ended=true;e.audio.fire('ended');e.coverControl.fire('click');await flush();assert.equal(e.audio.currentTime,50,'replay from configured offset');
 const f=fixture({blocked:true});await flush();f.audio.block=false;f.coverControl.fire('click');await flush();assert.equal(f.player.dataset.state,'playing','explicit cover button retries blocked autoplay');
 const g=fixture({blocked:true});g.audio.block=false;g.cover.fire('click',{isTrusted:true});await flush();assert.equal(g.player.dataset.state,'playing','late initial rejection cannot override successful gesture');
 const h=fixture();await flush();h.options.open=true;h.player.fire('keydown',{key:'Escape',preventDefault(){}});assert(!h.options.open);
 h.doc.hidden=true;h.doc.fire('visibilitychange');h.win.fire('pagehide');h.doc.hidden=false;h.win.fire('pageshow');await flush();assert(!h.audio.paused,'paired lifecycle events resume once');const plays=h.audio.plays.length;h.doc.fire('visibilitychange');await flush();assert.equal(h.audio.plays.length,plays);
 const delayed=fixture({slowMetadata:true});await flush();assert.equal(delayed.elapsed.textContent,'00:50');delayed.audio.metadata();assert.equal(delayed.audio.currentTime,50,'Metadata arriving later applies the pending 50s seek');
 assert.equal(b.audio.plays[1].at,50,'Blocked autoplay gesture keeps 50s start');
 assert(html.includes('data-start-seconds="50"'));assert(html.includes('data-src="../v10.169-photo-music/media/love-duet-192.mp3"'));assert(html.includes('fetchpriority="high"'));
 const previous=fs.readFileSync(path.join(__dirname,'../v10.177-music-start-0s/index.html'),'utf8');
 const coverPicture=/<section class="image-cover"[\s\S]*?(<picture>[\s\S]*?<\/picture>)/;
 assert.equal(html.match(coverPicture)[1],previous.match(coverPicture)[1]);
 const closing=/<section class="closing">[\s\S]*?<\/section>/;assert.equal(html.match(closing)[0],previous.match(closing)[0]);
 for(const m of html.matchAll(/(?:src|href)="([^"#]+)"/g)){const ref=m[1].split(/[?#]/)[0];if(ref&&!/^(?:[a-z]+:|\/)/i.test(ref))assert(fs.existsSync(path.resolve(__dirname,ref)),ref)}
 new vm.Script(source);assert(!/camera-shutter|priming|shutterSeen/.test(source));
 const current=fs.readFileSync(path.join(__dirname,'../v10.204-garden-lettering-fix/index.html'),'utf8');
 const normalize=text=>text.replace('data-start-seconds="50"','data-start-seconds="0"').replace('step="0.1" value="50"','step="0.1" value="0"').replace('aria-valuetext="00:50"','aria-valuetext="00:00"').replace('--progress:18.888%','--progress:0%').replace('aria-label="当前播放时间">00:50','aria-label="当前播放时间">00:00');
 assert.equal(normalize(html),current,'Only the playback offset and initial progress change; lyrics and scrolling stay on V10.204');
 assert(!html.includes('v10.205-readable-lyrics'));
 console.log('PASS: 50s initial play and replay; late metadata; autoplay fallback; pause/resume; seek/retry; background; exact V10.204 layout/lyrics/controller preserved.');
 console.log('Simulated media/DOM checks only; WeChat autoplay and first-load timing need real-device verification.');
})().catch(e=>{console.error(e);process.exitCode=1});
