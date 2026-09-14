/* One natural camera completion -> 1s hold -> one finite downward scroll. */
(()=>{'use strict';
 const root=document.documentElement,source=document.querySelector('#our-story'),target=document.querySelector('#celebration');
 if(!source||!target||!window.requestAnimationFrame)return;
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 const duration=1400,hold=1000;
 let state='idle',consumed=false,timer=0,frame=0,started=null,from=0,to=0,lastWritten=0,width=0,savedBehavior=null;
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
 function visibleSource(){const r=source.getBoundingClientRect();return r.bottom>0&&r.top<window.innerHeight}
 function begin(){
  timer=0;if(state!=='holding')return;
  if(document.hidden||reduced.matches||!visibleSource()){finish('skipped');return}
  from=y();const max=Math.max(0,(document.scrollingElement||root).scrollHeight-window.innerHeight);
  to=Math.min(max,Math.max(0,from+target.getBoundingClientRect().top));
  // Never drag a reader backwards after they have already reached page three.
  if(to<=from+1){finish('skipped');return}
  state='scrolling';lastWritten=from;started=null;width=window.innerWidth;
  savedBehavior=root.style.scrollBehavior||'';root.style.scrollBehavior='auto';
  frame=window.requestAnimationFrame(draw);
 }
 function draw(timestamp){
  frame=0;if(state!=='scrolling')return;
  if(document.hidden){cancel();return}
  if(started===null)started=timestamp;
  const p=Math.max(0,Math.min(1,(timestamp-started)/duration)),ease=p*p*(3-2*p);
  window.scrollTo({left:window.scrollX||0,top:from+(to-from)*ease,behavior:'auto'});
  lastWritten=y();
  if(p===1){finish('complete');return}
  frame=window.requestAnimationFrame(draw);
 }
 document.addEventListener('camera-story-started',()=>{if(!consumed){state='camera';gate()}});
 document.addEventListener('camera-story-complete',event=>{
  if(consumed)return;consumed=true;
  // Resize, failed media, interrupted playback and reduced-motion fallback also
  // complete the camera visually, but are not natural playback completion.
  if(event.detail?.reason!=='finished'||document.hidden||reduced.matches||!visibleSource()){finish('skipped');return}
  state='holding';gate();lastWritten=y();width=window.innerWidth;
  timer=setTimeout(begin,hold);
 });
 for(const type of ['wheel','touchstart','touchmove','pointerdown'])window.addEventListener(type,cancel,{passive:true});
 window.addEventListener('keydown',event=>{if(['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' ','Escape','Tab'].includes(event.key))cancel()});
 window.addEventListener('scroll',()=>{if((state==='holding'||state==='scrolling')&&Math.abs(y()-lastWritten)>3)cancel()},{passive:true});
 window.addEventListener('resize',()=>{if((state==='holding'||state==='scrolling')&&window.innerWidth!==width)cancel()},{passive:true});
 window.addEventListener('hashchange',cancel);
 window.addEventListener('pagehide',cancel);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel()});
 reduced.addEventListener?.('change',()=>{if(reduced.matches&&gated())cancel()});
})();
