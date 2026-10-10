/* Camera -> gathered photo/lyrics -> timeline. One owner for the whole route;
   the existing timeline gate is released only on arrival or explicit cancel. */
(()=>{'use strict';
 const root=document.documentElement,source=document.querySelector('#our-story');
 const photo=document.querySelector('#gathered-scenes'),timeline=document.querySelector('#celebration');
 if(!source||!photo||!timeline||!window.requestAnimationFrame)return;
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 const images=[...photo.querySelectorAll('.scene-picture img,.scene-lyrics img')];
 let state='idle',leg='photo-top',consumed=false,timer=0,frame=0,started=null;
 let from=0,to=0,duration=1400,width=0,scale=1,landingAt=0,retried=false,anchorDirty=false,savedBehavior=null;
 let cleanupMedia=()=>{};
 const y=()=>window.scrollY||0;
 const vh=()=>window.visualViewport?.height||window.innerHeight;
 const active=()=>!['idle','complete','cancelled','skipped','media-unavailable'].includes(state);
 function phase(next){state=next;root.dataset.storyHandoffPhase=next+':'+leg}
 function gate(){root.classList.add('story-handoff-pending')}
 function finish(next){
  clearTimeout(timer);timer=0;window.cancelAnimationFrame(frame);frame=0;cleanupMedia();
  phase(next);root.classList.remove('story-handoff-pending');
  if(savedBehavior!==null){root.style.scrollBehavior=savedBehavior;savedBehavior=null}
  document.dispatchEvent(new Event('story-handoff-complete'));
 }
 function cancel(){if(!active())return;consumed=true;finish('cancelled')}
 function visible(el){const r=el.getBoundingClientRect();return r.bottom>0&&r.top<vh()}
 function destination(){
  const max=Math.max(0,(document.scrollingElement||root).scrollHeight-vh());
  const r=(leg==='timeline'?timeline:photo).getBoundingClientRect();
  const absolute=leg==='photo-bottom'?Math.max(y()+r.top,y()+r.bottom-vh()):y()+r.top;
  return Math.min(max,Math.max(0,absolute));
 }
 function write(top){window.scrollTo({left:window.scrollX||0,top,behavior:'auto'})}
 function hold(next,ms){leg=next;phase('holding');timer=setTimeout(begin,ms)}
 function activatePhoto(){
  // These two images are warmed only after the camera sequence has completed,
  // not during the first-cover download. Respect responsive candidate order.
  for(const image of images){
   if(image.getAttribute('src'))continue;
   const src=image.getAttribute('data-media-src');if(!src)continue;
   const sizes=image.getAttribute('data-media-sizes'),set=image.getAttribute('data-media-srcset');
   if(sizes)image.sizes=sizes;if(set)image.srcset=set;
   image.loading='eager';image.src=src;
  }
 }
 function waitForPhoto(){
  phase('waiting-media');
  function check(){
   if(state!=='waiting-media')return;
   if(document.hidden||reduced.matches){cancel();return}
   if(images.some(img=>img.complete&&!img.naturalWidth)){finish('media-unavailable');return}
   if(images.every(img=>img.complete&&img.naturalWidth>0)){
    cleanupMedia();clearTimeout(timer);timer=0;
    hold('photo-bottom',3000);
   }
  }
  cleanupMedia=()=>{
   for(const image of images){image.removeEventListener('load',check);image.removeEventListener('error',check)}
   cleanupMedia=()=>{};
  };
  for(const image of images){image.addEventListener('load',check);image.addEventListener('error',check)}
  timer=setTimeout(()=>{if(state==='waiting-media')finish('media-unavailable')},10000);
  activatePhoto();check();
 }
 function arrived(){
  if(leg==='photo-top'){waitForPhoto();return}
  if(leg==='photo-bottom'){hold('timeline',1000);return}
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
  if(document.hidden||reduced.matches||!visible(leg==='photo-top'?source:photo)){finish('skipped');return}
  from=y();to=destination();
  // A short photograph page fits entirely in view. After its full viewing
  // pause, go straight to the timeline; do not insert an empty scroll.
  if(leg==='photo-bottom'&&to<=from+2){leg='timeline';begin();return}
  if(to<=from+1){finish('skipped');return}
  duration=leg==='photo-bottom'?Math.min(6500,Math.max(1800,(to-from)*10)):1400;
  phase('scrolling');started=null;width=window.innerWidth;
  if(savedBehavior===null)savedBehavior=root.style.scrollBehavior||'';
  root.style.scrollBehavior='auto';frame=window.requestAnimationFrame(draw);
 }
 function draw(timestamp){
  frame=0;if(state!=='scrolling')return;
  if(document.hidden){cancel();return}
  if(started===null)started=timestamp;
  const p=Math.max(0,Math.min(1,(timestamp-started)/duration)),ease=p*p*(3-2*p);
  if(p===1){
   phase('settling');landingAt=timestamp;retried=false;anchorDirty=false;
   to=destination();write(to);frame=window.requestAnimationFrame(settle);return;
  }
  if(anchorDirty){anchorDirty=false;to=destination()}
  write(from+(to-from)*ease);frame=window.requestAnimationFrame(draw);
 }
 document.addEventListener('camera-story-started',()=>{if(!consumed){phase('camera');gate()}});
 document.addEventListener('camera-story-complete',event=>{
  if(consumed)return;consumed=true;
  if(event.detail?.reason!=='finished'||document.hidden||reduced.matches||!visible(source)){finish('skipped');return}
  gate();width=window.innerWidth;scale=window.visualViewport?.scale||1;
  activatePhoto();hold('photo-top',1000);
 });
 for(const type of ['wheel','touchstart','touchmove','pointerdown'])window.addEventListener(type,cancel,{passive:true});
 window.addEventListener('keydown',event=>{if(['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' ','Escape','Tab'].includes(event.key))cancel()});
 // Native scroll events may commit asynchronously in WeChat. They are effects
 // of scrollTo, not user intent: only actual input can cancel this route.
 function viewportChange(){
  if(!active()||state==='camera')return;
  if(window.innerWidth!==width||Math.abs((window.visualViewport?.scale||1)-scale)>.01){cancel();return}
  anchorDirty=true;
 }
 window.addEventListener('resize',viewportChange,{passive:true});
 window.visualViewport?.addEventListener?.('resize',viewportChange,{passive:true});
 window.addEventListener('hashchange',cancel);window.addEventListener('pagehide',cancel);
 document.addEventListener('wedding-music-interaction',cancel);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel()});
 reduced.addEventListener?.('change',()=>{if(reduced.matches)cancel()});
})();
