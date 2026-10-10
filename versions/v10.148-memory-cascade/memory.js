/* Interactive website runtime, not a rendered video. No scroll lock or replay. */
(()=>{'use strict';
 const section=document.querySelector('#story-timeline'),math=window.WeddingMemoryMath;
 if(!section||!math)return;
 const stage=section.querySelector('.memory-stack'),cards=[...stage.querySelectorAll('.memory-card')],blocks=[...section.querySelectorAll('li h3,li .timeline-prose p')],last=blocks[blocks.length-1];
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let started=false,auto=false,token=0,played=false,textRead=false,preload=null,manualDwell=0,monitorFrame=0,gestureUntil=0,gestureTimer=0;
 const animations=[];const ready=new WeakMap();
 const viewport=()=>window.visualViewport?.height||window.innerHeight;
 const visible=(el)=>{const r=el.getBoundingClientRect();return r.bottom>0&&r.top<viewport()};
 function loadImage(card){const img=card.querySelector('[data-media-src]');return new Promise(resolve=>{let settled=false;const finish=(ok)=>{if(settled)return;settled=true;clearTimeout(timer);img.removeEventListener('load',loaded);img.removeEventListener('error',failed);ready.set(card,ok);resolve(ok)};const loaded=()=>{if(img.decode)img.decode().catch(()=>{}).then(()=>finish(img.naturalWidth>0));else finish(true)};const failed=()=>finish(false);const timer=setTimeout(()=>finish(false),6000);img.addEventListener('load',loaded);img.addEventListener('error',failed);img.loading='eager';img.src=img.dataset.mediaSrc;if(img.complete&&img.naturalWidth)loaded()})}
 function warm(){if(!preload){let next=0;const worker=async()=>{while(next<cards.length)await loadImage(cards[next++])};preload=Promise.all([worker(),worker()])}return preload}
 function stopAuto(){if(auto){auto=false;token++;document.documentElement.classList.remove('memory-auto-reading')}}
 function userGesture(){stopAuto();gestureUntil=Date.now()+900;clearTimeout(gestureTimer);gestureTimer=setTimeout(queueMonitor,950)}
 const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 function travel(target,duration,id){return new Promise(resolve=>{const start=window.scrollY,delta=Math.max(0,target-start);if(delta<2){resolve(true);return}let startTime;function frame(t){if(!auto||token!==id){resolve(false);return}if(startTime===undefined)startTime=t;const p=Math.min(1,(t-startTime)/duration),ease=p*p*(3-2*p);window.scrollTo(0,start+delta*ease);if(p<1)requestAnimationFrame(frame);else resolve(true)}requestAnimationFrame(frame)})}
 function reveal(el){if(!el.animate||reduced.matches)return;el.animate([{transform:'translateY(26px)'},{transform:'translateY(0)'}],{duration:650,easing:'cubic-bezier(.18,.7,.25,1)',iterations:1})}
 async function readStory(){if(started||played||document.hidden)return;started=true;warm();if(reduced.matches){textRead=true;return}auto=true;const id=++token;document.documentElement.classList.add('memory-auto-reading');
  try{await delay(650);if(!auto||id!==token)return;
   // Snapshot all geometry before movement; font metrics have settled at boot.
   const vh=viewport(),steps=blocks.map(el=>({el,y:window.scrollY+el.getBoundingClientRect().top-vh*.22,hold:math.readDuration(el.textContent)}));
   for(const step of steps){if(!auto||id!==token)return;if(step.y<window.scrollY-vh*.2)continue;const distance=Math.max(0,step.y-window.scrollY);if(!await travel(step.y,Math.max(650,Math.min(2300,distance*5)),id))return;reveal(step.el);await delay(step.hold)}
   if(!auto||id!==token)return;textRead=true;
   const target=window.scrollY+stage.getBoundingClientRect().top-Math.max(24,(viewport()-stage.clientHeight)/2);
   if(await travel(target,1100,id)){auto=false;document.documentElement.classList.remove('memory-auto-reading');await throwPhotos()}
  }finally{if(id===token){auto=false;document.documentElement.classList.remove('memory-auto-reading')}}
 }
 function settle(){cards.forEach((card,i)=>{if(ready.get(card)===false){card.hidden=true;return}const [x,y,r]=math.poses[i];card.style.transform=`translate(calc(-50% + ${x}%),calc(-50% + ${y}%)) rotate(${r}deg)`;card.classList.add('landed');card.style.willChange='auto'})}
 async function throwPhotos(){if(played||!textRead||!visible(stage)||document.hidden)return;played=true;await warm();if(!visible(stage)||document.hidden||reduced.matches||!cards[0].animate){settle();return}
  const width=stage.clientWidth,height=stage.clientHeight,schedule=math.schedule(cards.length);cards.forEach((card,i)=>{const step=schedule[i],[x,y,r]=step.pose;card.style.zIndex=String(i+1);if(!ready.get(card)){card.hidden=true;return}const rest=`translate(calc(-50% + ${x}%),calc(-50% + ${y}%)) rotate(${r}deg)`;card.style.transform=rest;card.style.willChange='transform';const animation=card.animate([
   {transform:`translate(calc(-50% + ${(i%2?1:-1)*width*.36}px),calc(-50% - ${height*.95}px)) rotate(${r+(i%2?25:-25)}deg) scale(1.3)`,opacity:0,offset:0},
   {opacity:1,offset:.025},
   {transform:rest+' scale(.975)',opacity:1,offset:.77,easing:'ease-out'},
   {transform:rest+' scale(1.016)',opacity:1,offset:.9},
   {transform:rest+' scale(1)',opacity:1,offset:1}
  ],{duration:step.duration,delay:step.start,easing:'cubic-bezier(.45,0,.8,.55)',fill:'both',iterations:1});animations.push(animation);animation.finished.then(()=>{card.classList.add('landed');card.style.willChange='auto';animation.cancel()}).catch(()=>{});
  });
 }
 function monitor(){monitorFrame=0;const r=section.getBoundingClientRect(),vh=viewport();if(r.top<vh*1.6&&r.bottom>0)warm();if(!started&&Date.now()>gestureUntil&&r.top<vh*.72&&r.bottom>vh*.4&&!document.documentElement.classList.contains('paper-motion')&&!document.documentElement.classList.contains('star-turn'))readStory();
  if(!auto&&!textRead){const b=last.getBoundingClientRect();if(b.top>=0&&b.bottom<vh*.95){if(!manualDwell)manualDwell=setTimeout(()=>{manualDwell=0;if(visible(last)){textRead=true;queueMonitor()}},math.readDuration(last.textContent))}else if(b.bottom<vh*.75&&b.bottom<0){textRead=true}else{clearTimeout(manualDwell);manualDwell=0}}
  if(textRead&&!auto&&visible(stage))throwPhotos();
 }
 function queueMonitor(){if(!monitorFrame)monitorFrame=requestAnimationFrame(monitor)}
 section.classList.add('memory-enhanced');
 ['wheel','touchstart','touchmove','pointerdown'].forEach(name=>window.addEventListener(name,userGesture,{passive:true}));
 window.addEventListener('keydown',e=>{if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' ','Escape'].includes(e.key))stopAuto()});
 window.addEventListener('scroll',queueMonitor,{passive:true});window.addEventListener('resize',()=>{stopAuto();queueMonitor()},{passive:true});window.addEventListener('hashchange',queueMonitor);
 document.addEventListener('visibilitychange',()=>{if(document.hidden){stopAuto();animations.forEach(a=>{if(a.playState==='running')a.pause()})}else{animations.forEach(a=>{if(a.playState==='paused')a.play()});queueMonitor()}});
 reduced.addEventListener?.('change',()=>{if(reduced.matches){stopAuto();textRead=true;animations.forEach(a=>a.cancel());warm().then(settle)}});
 if(document.fonts)Promise.race([document.fonts.ready,delay(2500)]).then(queueMonitor);else queueMonitor();
})();
