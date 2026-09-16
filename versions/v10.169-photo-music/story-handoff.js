/* One natural camera completion -> 1s hold -> one finite downward scroll. */
(()=>{'use strict';
 const root=document.documentElement,source=document.querySelector('#our-story'),target=document.querySelector('#celebration');
 if(!source||!target||!window.requestAnimationFrame)return;
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 const duration=1400,hold=1000;
 let state='idle',consumed=false,timer=0,frame=0,started=null,from=0,to=0,width=0,scale=1,landingAt=0,retried=false,anchorDirty=false,savedBehavior=null;
 const y=()=>window.scrollY||0;
 const gated=()=>root.classList.contains('story-handoff-pending');
 function gate(){root.classList.add('story-handoff-pending')}
 function finish(next){
  clearTimeout(timer);timer=0;window.cancelAnimationFrame(frame);frame=0;
  state=next;root.classList.remove('story-handoff-pending');
  if(savedBehavior!==null){root.style.scrollBehavior=savedBehavior;savedBehavior=null}
  document.dispatchEvent(new Event('story-handoff-complete'));
 }
 function cancel(){if(state==='idle'||state==='complete'||state==='cancelled'||state==='skipped')return;consumed=true;finish('cancelled')}
 document.addEventListener('wedding-music-interaction',cancel);
 function visibleSource(){const r=source.getBoundingClientRect();return r.bottom>0&&r.top<window.innerHeight}
 function destination(){
  const max=Math.max(0,(document.scrollingElement||root).scrollHeight-window.innerHeight);
  return Math.min(max,Math.max(0,y()+target.getBoundingClientRect().top));
 }
 function write(top){window.scrollTo({left:window.scrollX||0,top,behavior:'auto'})}
 function settle(timestamp){
  frame=0;if(state!=='settling')return;
  if(document.hidden){cancel();return}
  if(anchorDirty){anchorDirty=false;const next=destination();if(Math.abs(next-to)>1){to=next;write(to)}}
  if(Math.abs(y()-to)<=2){
   // Confirm the DOM anchor as well as scrollY after the browser committed it.
   const next=destination();
   if(Math.abs(next-to)<=2){finish('complete');return}
   to=next;write(to);
  }
  // Never keep the next chapter locked waiting for sub-pixel convergence.
  if(timestamp-landingAt>=800){finish('skipped');return}
  if(!retried&&timestamp-landingAt>=320){retried=true;write(to)}
  frame=window.requestAnimationFrame(settle);
 }
 function begin(){
  timer=0;if(state!=='holding')return;
  if(document.hidden||reduced.matches||!visibleSource()){finish('skipped');return}
  from=y();to=destination();
  // Never drag a reader backwards after they have already reached page three.
  if(to<=from+1){finish('skipped');return}
  state='scrolling';started=null;width=window.innerWidth;
  savedBehavior=root.style.scrollBehavior||'';root.style.scrollBehavior='auto';
  frame=window.requestAnimationFrame(draw);
 }
 function draw(timestamp){
  frame=0;if(state!=='scrolling')return;
  if(document.hidden){cancel();return}
  if(started===null)started=timestamp;
  const p=Math.max(0,Math.min(1,(timestamp-started)/duration)),ease=p*p*(3-2*p);
  if(p===1){
   state='settling';landingAt=timestamp;retried=false;anchorDirty=false;
   to=destination();write(to);frame=window.requestAnimationFrame(settle);return;
  }
  if(anchorDirty){anchorDirty=false;to=destination()}
  write(from+(to-from)*ease);
  frame=window.requestAnimationFrame(draw);
 }
 document.addEventListener('camera-story-started',()=>{if(!consumed){state='camera';gate()}});
 document.addEventListener('camera-story-complete',event=>{
  if(consumed)return;consumed=true;
  // Resize, failed media, interrupted playback and reduced-motion fallback also
  // complete the camera visually, but are not natural playback completion.
  if(event.detail?.reason!=='finished'||document.hidden||reduced.matches||!visibleSource()){finish('skipped');return}
  state='holding';gate();width=window.innerWidth;scale=window.visualViewport?.scale||1;
  timer=setTimeout(begin,hold);
 });
 for(const type of ['wheel','touchstart','touchmove','pointerdown'])window.addEventListener(type,cancel,{passive:true});
 window.addEventListener('keydown',event=>{if(['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' ','Escape','Tab'].includes(event.key))cancel()});
 // A native scroll event is an effect, not evidence of user intent. WebViews
 // may apply scrollTo AFTER the RAF callback; never cancel our own movement.
 // Explicit touch/wheel/pointer/keyboard handlers above retain reader control.
 function viewportChange(){
  if(!['holding','scrolling','settling'].includes(state))return;
  if(window.innerWidth!==width||Math.abs((window.visualViewport?.scale||1)-scale)>.01){cancel();return}
  anchorDirty=true;
 }
 window.addEventListener('resize',viewportChange,{passive:true});
 window.visualViewport?.addEventListener?.('resize',viewportChange,{passive:true});
 window.addEventListener('hashchange',cancel);
 window.addEventListener('pagehide',cancel);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel()});
 reduced.addEventListener?.('change',()=>{if(reduced.matches&&gated())cancel()});
})();
