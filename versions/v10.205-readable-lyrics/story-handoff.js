/* Camera -> photo -> fully visible lyrics (3s) -> garden (3s) -> timeline.
   Warm/decode media before movement. One scroll owner; no photo/layout edits. */
(()=>{'use strict';
 const root=document.documentElement,source=document.querySelector('#our-story');
 const photo=document.querySelector('#gathered-scenes'),timeline=document.querySelector('#celebration');
 const portrait=document.querySelector('#garden-portrait');
 if(!source||!photo||!timeline||!window.requestAnimationFrame)return;
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 const images=[...photo.querySelectorAll('.scene-picture img,.scene-lyrics img')];
 const lyrics=photo.querySelector('.scene-lyrics > img');
 const portraitImages=portrait?[...portrait.querySelectorAll('.garden-portrait-photo')]:[];
 let state='idle',leg='photo-top',consumed=false,timer=0,frame=0,started=null;
 let from=0,to=0,duration=1400,width=0,scale=1,landingAt=0,retried=false,anchorDirty=false,savedBehavior=null;
 let mediaChanged=()=>{};
 const warmed=new Map(),mediaCleanups=[];
 let lastTop=0,observer=null;
 const y=()=>window.scrollY||0;
 const vh=()=>window.visualViewport?.height||window.innerHeight;
 const viewTop=()=>window.visualViewport?.offsetTop||0;
 const margin=()=>Math.min(48,Math.max(16,vh()*.06));
 const active=()=>!['idle','complete','cancelled','skipped','media-unavailable'].includes(state);
 function phase(next){state=next;root.dataset.storyHandoffPhase=next+':'+leg}
 function gate(){root.classList.add('story-handoff-pending')}
 function finish(next){
  clearTimeout(timer);timer=0;window.cancelAnimationFrame(frame);frame=0;mediaChanged=()=>{};
  for(const cleanup of mediaCleanups.splice(0))cleanup();observer?.disconnect();
  phase(next);root.classList.remove('story-handoff-pending');
  if(savedBehavior!==null){root.style.scrollBehavior=savedBehavior;savedBehavior=null}
  document.dispatchEvent(new Event('story-handoff-complete'));
 }
 function cancel(){if(!active())return;consumed=true;finish('cancelled')}
 function visible(el){const r=el.getBoundingClientRect();return r.bottom>viewTop()&&r.top<viewTop()+vh()}
 function lyricsVisible(){
  if(!lyrics)return true;
  const r=lyrics.getBoundingClientRect();
  return r.top>=viewTop()+margin()-2&&r.bottom<=viewTop()+vh()-margin()+2;
 }
 function destination(){
  const max=Math.max(0,(document.scrollingElement||root).scrollHeight-vh());
  if(leg==='lyrics'&&lyrics){
   const r=lyrics.getBoundingClientRect(),top=photo.getBoundingClientRect().top;
   // Scroll only enough to reveal the last line with safe space below it.
   return Math.min(max,Math.max(0,y()+top,y()+r.bottom-viewTop()-vh()+margin()));
  }
  const r=(leg==='timeline'?timeline:leg==='portrait-top'?portrait:photo).getBoundingClientRect();
  return Math.min(max,Math.max(0,y()+r.top));
 }
 function write(top){lastTop=top;window.scrollTo({left:window.scrollX||0,top,behavior:'auto'})}
 function hold(next,ms){leg=next;phase('holding');timer=setTimeout(begin,ms)}
 function activatePhoto(media=images){
  // Start during the camera sequence, never during the first-cover download.
  for(const image of media){
   image.loading='eager';
   if(image.getAttribute('src'))continue;
   const src=image.getAttribute('data-media-src');if(!src)continue;
   const sizes=image.getAttribute('data-media-sizes'),set=image.getAttribute('data-media-srcset');
   if(sizes)image.sizes=sizes;if(set)image.srcset=set;
   image.src=src;
  }
 }
 function warm(media){
  activatePhoto(media);
  for(const image of media){
   if(warmed.has(image))continue;
   const record={ready:false,failed:false,decoding:false};warmed.set(image,record);
   function done(){record.ready=image.naturalWidth>0;record.failed=!record.ready;mediaChanged()}
   function check(){
    if(!image.complete||record.decoding||record.ready||record.failed)return;
    if(!image.naturalWidth){record.failed=true;mediaChanged();return}
    if(typeof image.decode!=='function'){done();return}
    record.decoding=true;
    // decode() can reject for a responsive-source switch even after load.
    try{image.decode().then(done,done)}catch(_){done()}
   }
   image.addEventListener('load',check);image.addEventListener('error',check);
   mediaCleanups.push(()=>{image.removeEventListener('load',check);image.removeEventListener('error',check)});
   check();
  }
 }
 function ready(media){return media.every(image=>warmed.get(image)?.ready)}
 function waitForMedia(media,after){
  phase('waiting-media');
  function check(){
   if(state!=='waiting-media')return;
   if(document.hidden||reduced.matches){cancel();return}
   if(media.some(img=>warmed.get(img)?.failed)){finish('media-unavailable');return}
   if(ready(media)){
    mediaChanged=()=>{};clearTimeout(timer);timer=0;after();
   }
  }
  mediaChanged=check;
  timer=setTimeout(()=>{if(state==='waiting-media')finish('media-unavailable')},10000);
  warm(media);check();
 }
 function reading(){
  leg='lyrics';
  if(lyrics){
   const r=lyrics.getBoundingClientRect();
   // Unusually short landscape/zoomed screens must remain manually readable.
   if(r.bottom-r.top>vh()-2*margin()){finish('skipped');return}
   if(!lyricsVisible()){
    if(destination()<=y()+2){finish('skipped');return}
    hold('lyrics',0);return;
   }
  }
  phase('reading');timer=setTimeout(leaveLyrics,3000);
 }
 function leaveLyrics(){
  timer=0;
  if(document.hidden||reduced.matches){cancel();return}
  if(!lyricsVisible()){reading();return}
  if(!portrait){hold('timeline',0);return}
  leg='portrait-top';
  waitForMedia(portraitImages,()=>{
   if(!lyricsVisible()){reading();return}
   hold('portrait-top',0);
  });
 }
 function arrived(){
  if(leg==='photo-top'){
   if(portrait)warm(portraitImages);
   leg='lyrics';
   if(lyrics&&!lyricsVisible()&&destination()>y()+2)hold('lyrics',1200);
   else reading();
   return;
  }
  if(leg==='lyrics'){reading();return}
  if(leg==='portrait-top'){hold('timeline',3000);return}
  finish('complete');
 }
 function settle(timestamp){
  frame=0;if(state!=='settling')return;
  if(document.hidden){cancel();return}
  if(anchorDirty){anchorDirty=false;const next=destination();if(Math.abs(next-to)>1){to=next;write(to)}}
  if(Math.abs(y()-to)<=2){
   const next=destination();
   if(Math.abs(next-to)<=2){arrived();return}
   to=next;write(to);
  }
  if(timestamp-landingAt>=800){finish('skipped');return}
  if(!retried&&timestamp-landingAt>=320){retried=true;write(to)}
  frame=window.requestAnimationFrame(settle);
 }
 function begin(){
  timer=0;if(state!=='holding')return;
  const departing=leg==='photo-top'?source:(leg==='lyrics'||leg==='portrait-top')?photo:(portrait||photo);
  if(document.hidden||reduced.matches||!visible(departing)){finish('skipped');return}
  if(leg==='photo-top'&&!ready(images)){
   waitForMedia(images,()=>hold('photo-top',0));return;
  }
  from=y();to=destination();
  if(leg==='lyrics'&&to<=from+2){reading();return}
  if(to<=from+1){finish('skipped');return}
  // Distance-based travel, with a deliberate, separate reading beat. No long
  // whole-page glide that whisks lyrics away just after they enter the screen.
  duration=leg==='photo-top'?1400:leg==='lyrics'
   ?Math.min(3200,Math.max(900,(to-from)*3.5))
   :Math.min(4200,Math.max(1800,(to-from)*2.5));
  lastTop=from;
  phase('scrolling');started=null;width=window.innerWidth;
  if(savedBehavior===null)savedBehavior=root.style.scrollBehavior||'';
  root.style.scrollBehavior='auto';frame=window.requestAnimationFrame(draw);
 }
 function continuousEase(p){
  // Smooth launch, steady middle, longer gentle landing into the reading beat.
  const a=.14,b=.3,area=1-(a+b)/2;
  if(p<a)return (p-a/Math.PI*Math.sin(Math.PI*p/a))/(2*area);
  if(p<=1-b)return (p-a/2)/area;
  const q=(p-(1-b))/b;
  return (1-b-a/2+b/2*(q+Math.sin(Math.PI*q)/Math.PI))/area;
 }
 function draw(timestamp){
  frame=0;if(state!=='scrolling')return;
  if(document.hidden){cancel();return}
  if(started===null)started=timestamp;
  if(anchorDirty){
   anchorDirty=false;const next=destination();
   if(Math.abs(next-to)>2){
    if(next<lastTop-2){finish('skipped');return}
    duration=Math.max(400,duration-(timestamp-started));
    from=lastTop;to=next;started=timestamp;
   }
  }
  const p=Math.max(0,Math.min(1,(timestamp-started)/duration));
  const ease=leg==='photo-top'?p*p*(3-2*p):continuousEase(p);
  if(p===1){
   phase('settling');landingAt=timestamp;retried=false;anchorDirty=false;
   to=destination();write(to);frame=window.requestAnimationFrame(settle);return;
  }
  write(from+(to-from)*ease);frame=window.requestAnimationFrame(draw);
 }
 document.addEventListener('camera-story-started',()=>{
  if(!consumed){phase('camera');gate();if(!reduced.matches&&!document.hidden)warm(images)}
 });
 document.addEventListener('camera-story-complete',event=>{
  if(consumed)return;consumed=true;
  if(event.detail?.reason!=='finished'||document.hidden||reduced.matches||!visible(source)){finish('skipped');return}
  gate();width=window.innerWidth;scale=window.visualViewport?.scale||1;
  warm(images);hold('photo-top',1000);
 });
 for(const type of ['wheel','touchstart','touchmove','pointerdown'])window.addEventListener(type,cancel,{passive:true});
 window.addEventListener('keydown',event=>{if(['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' ','Escape','Tab'].includes(event.key))cancel()});
 // Native scroll events may commit asynchronously in WeChat. They are effects
 // of scrollTo, not user intent: only actual input can cancel this route.
 function viewportChange(){
  if(!active()||state==='camera')return;
  if(window.innerWidth!==width||Math.abs((window.visualViewport?.scale||1)-scale)>.01){cancel();return}
  anchorDirty=true;
  if(state==='reading'&&!lyricsVisible()){
   clearTimeout(timer);timer=0;reading();
  }
 }
 window.addEventListener('resize',viewportChange,{passive:true});
 window.visualViewport?.addEventListener?.('resize',viewportChange,{passive:true});
 window.addEventListener('hashchange',cancel);window.addEventListener('pagehide',cancel);
 document.addEventListener('wedding-music-interaction',cancel);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel()});
 reduced.addEventListener?.('change',()=>{if(reduced.matches)cancel()});
 if(window.ResizeObserver){
  observer=new window.ResizeObserver(viewportChange);
  for(const element of [photo,lyrics,portrait,timeline])if(element)observer.observe(element);
 }
})();
