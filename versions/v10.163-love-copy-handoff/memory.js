/* Fixed paper and comic intro. Only the timeline viewport follows the sequence. */
(()=>{'use strict';
 const section=document.querySelector('#story-timeline'),math=window.WeddingMemoryMath;
 if(!section||!math)return;
 const root=document.documentElement,page=document.querySelector('#celebration'),port=page?.querySelector('.story-paper-window'),intro=page?.querySelector('.story-fixed-intro'),previous=document.querySelector('#our-story');
 if(!port)return;
 const nodes=[...section.querySelectorAll('[data-story-node]')];
 const blocks=nodes.map(n=>[...n.querySelectorAll('.type-block')]);
 const glyphs=blocks.map(row=>row.map(b=>[...b.querySelectorAll('.type-glyph')]));
 const stage=section.querySelector('.memory-stack'),copy=section.querySelector('.memory-copy');
 const cards=[...stage.querySelectorAll('[data-memory-card]')],finalPhoto=section.querySelector('.wedding-finale');
 const plan=math.makePlan(glyphs.map(row=>row.map(gs=>gs.map(g=>g.textContent))),cards.length);
 const images=[...section.querySelectorAll('img[data-media-src]')];
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let elapsed=0,eventIndex=0,started=false,done=false,frame=0,lastTime=null,focus=section;
 let follow=true,scrollTarget=null,gestureUntil=0,gestureTimer=0,preload=null,assetsReady=false,geometry=null,activeCursor=null;
 let pointerHeld=false,touchHeld=false,rejoining=false;
 let rejoinElapsed=0,rejoinFrom=0;
 const resumeDelay=900;
 const loaded=new WeakMap(),flights=[];
 const vh=()=>window.visualViewport?.height||window.innerHeight;
 const visible=el=>{const r=el.getBoundingClientRect(),p=port.getBoundingClientRect();return Math.min(r.bottom,p.bottom,vh())>Math.max(r.top,p.top,0)+16};
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const contentY=el=>el.getBoundingClientRect().top-port.getBoundingClientRect().top+port.scrollTop;
 const readingBox=()=>{const p=port.getBoundingClientRect(),top=Math.max(0,p.top),bottom=Math.min(vh(),p.bottom);return {offset:Math.max(0,top-p.top),height:Math.max(1,bottom-top)}};
 function syncPaper(){
  const height=previous?.getBoundingClientRect().height||Math.max(vh(),page.clientWidth*1.5);
  page.style.setProperty('--story-page-height',Math.ceil(height)+'px');
  const windowHeight=Math.max(1,Math.min(port.clientHeight,vh()));
  page.style.setProperty('--story-window-height',windowHeight+'px');
  // The final portrait may cover the wedding text: reserve only frame and safe-edge space.
  page.style.setProperty('--final-photo-height',Math.max(64,windowHeight-76)+'px');
  page.style.setProperty('--story-anchor-offset',(port.getBoundingClientRect().top-page.getBoundingClientRect().top+20)+'px');
  geometry=null;scrollTarget=null;
  if(activeCursor&&section.dataset.storyPhase==='typing')trackLine(...activeCursor);
 }
 function phase(name){section.dataset.storyPhase=name}
 function load(img){return new Promise(resolve=>{let settled=false;const finish=ok=>{if(settled)return;settled=true;clearTimeout(timer);img.removeEventListener('load',onload);img.removeEventListener('error',onerror);loaded.set(img,ok);resolve(ok)};const onload=()=>{Promise.resolve(img.decode?.()).catch(()=>{}).then(()=>finish(img.naturalWidth>0))};const onerror=()=>finish(false);const timer=setTimeout(()=>finish(false),10000);img.addEventListener('load',onload);img.addEventListener('error',onerror);img.loading='eager';img.src=img.dataset.mediaSrc;if(img.complete&&img.naturalWidth)onload()})}
 function warm(){if(window.WeddingMedia&&!window.WeddingMedia.released)return window.WeddingMedia.ready.then(warm);if(!preload){let cursor=0;async function worker(){while(cursor<images.length)await load(images[cursor++])}preload=Promise.all([worker(),worker()]).then(()=>{assetsReady=true;return true})}return preload}
 function pointTo(y,allowBack=false){if(!follow)return;const max=Math.max(0,port.scrollHeight-port.clientHeight);scrollTarget=clamp(allowBack?y:Math.max(port.scrollTop,y),0,max)}
 function setFocus(el){focus=el}
 function measureBlock(node,block){
  const origin=port.getBoundingClientRect().top-port.scrollTop;let line=null;
  geometry=glyphs[node][block].map(g=>{
   const r=g.getBoundingClientRect(),top=r.top-origin,bottom=top+r.height;
   // Share a line box across glyphs on the same baseline, including mixed fonts.
   if(!line||top>=line.bottom-2||bottom<=line.top+2)line={top,bottom};
   else{line.top=Math.min(line.top,top);line.bottom=Math.max(line.bottom,bottom)}
   return line;
  });
 }
 function trackLine(node,block,index){
  activeCursor=[node,block,index];focus=glyphs[node][block][index]||blocks[node][block];
  if(!follow)return;
  if(!geometry)measureBlock(node,block);
  const line=geometry[index];if(!line)return;
  const box=readingBox();
  // At the beginning, natural scroll bounds hold the text; thereafter track its center.
  pointTo((line.top+line.bottom)/2-box.offset-box.height*.5,true);
 }
 function keepLineVisible(){
  if(!follow||!activeCursor||section.dataset.storyPhase!=='typing')return;
  if(!geometry)measureBlock(activeCursor[0],activeCursor[1]);
  const line=geometry[activeCursor[2]],box=readingBox();if(!line||box.height<line.bottom-line.top)return;
  const inset=Math.min(24,Math.max(0,(box.height-(line.bottom-line.top))/2));
  const lower=line.bottom-box.offset-box.height+inset,upper=line.top-box.offset-inset;
  const safe=clamp(port.scrollTop,lower,upper);
  // Only clamp a large chapter jump/resize to the safe edge; normal line changes ease to center.
  if(Math.abs(safe-port.scrollTop)>.5)port.scrollTop=clamp(safe,0,Math.max(0,port.scrollHeight-port.clientHeight));
 }
 function buildFlights(){
  const height=copy.clientHeight,width=copy.clientWidth,box=readingBox();
  const cardHeight=Math.max(...cards.map(c=>c.offsetHeight));
  const center=clamp(height-cardHeight*.53-20,Math.min(height/2,cardHeight/2+20),Math.max(height/2,height-cardHeight/2-20));
  stage.style.setProperty('--memory-center',center+'px');
  pointTo(contentY(copy)+center-box.offset-box.height*.5,true);
  const schedule=math.photoSchedule(cards.length);
  cards.forEach((card,i)=>{const step=schedule[i],[x,y,r]=step.pose;const rest=`translate(calc(-50% + ${x}%),calc(-50% + ${y}%)) rotate(${r}deg)`;
   card.style.zIndex=String(i+1);card.style.transform=rest;
   if([...card.querySelectorAll('img[data-media-src]')].some(img=>!loaded.get(img))){card.hidden=true;return}
   card.style.willChange='transform';let animation=null;
   if(card.animate){animation=card.animate([
    {transform:`translate(calc(-50% + ${(i%2?1:-1)*width*.3}px),calc(-50% - ${Math.max(height,vh())*.8}px)) rotate(${r+(i%2?22:-22)}deg) scale(1.26)`,opacity:1,offset:0,easing:'cubic-bezier(.48,0,.8,.48)'},
    {transform:rest+' scale(.975)',opacity:1,offset:.78,easing:'ease-out'},
    {transform:rest+' scale(1.012)',opacity:1,offset:.9},
    {transform:rest+' scale(1)',opacity:1,offset:1}
   ],{duration:step.duration,iterations:1,fill:'both'});animation.pause();animation.currentTime=0}
   card.style.visibility='hidden';flights.push({card,animation,start:step.start,duration:step.duration,finished:false});
  });
 }
 function runEvent(event){const {kind,node,block,index}=event;
  if(kind==='node'){nodes[node].classList.add('entered');section.dataset.storyNode=String(node);setFocus(nodes[node]);phase('typing')}
  if(kind==='block'){blocks[node][block].classList.add('typing');measureBlock(node,block);trackLine(node,block,0)}
  if(kind==='glyph'){glyphs[node][block][index].classList.add('typed');trackLine(node,block,index)}
  if(kind==='block-end'){blocks[node][block].classList.remove('typing');blocks[node][block].classList.add('type-complete')}
  if(kind==='photos'){focus=copy;phase('photos');buildFlights()}
  if(kind==='photos-end'){stage.hidden=true;flights.forEach(f=>f.animation?.cancel());phase('between-nodes')}
  if(kind==='final-photo'){focus=finalPhoto;finalPhoto.classList.add('revealed');const box=readingBox();pointTo(contentY(nodes[nodes.length-1])-box.offset-24,true);phase('wedding-photo');if(!loaded.get(finalPhoto.querySelector('img[data-media-src]')))offerRetry()}
 }
 function renderPhotos(){if(elapsed>=plan.photoStart&&elapsed<plan.photoEnd){const local=elapsed-plan.photoStart;
  flights.forEach(f=>{if(local<f.start)return;f.card.style.visibility='visible';if(f.animation&&!f.finished)f.animation.currentTime=Math.min(f.duration,local-f.start);else f.card.classList.add('landed');if(local>=f.start+f.duration&&!f.finished){f.finished=true;f.card.classList.add('landed');f.card.style.willChange='auto';f.animation?.cancel()}});
  if(elapsed>=plan.fadeStart){phase('fading');stage.style.opacity=String(1-clamp((elapsed-plan.fadeStart)/math.fadeDuration,0,1))}else if(elapsed>=plan.holdStart)phase('keepsake-hold');
 }if(elapsed>=plan.finalPhotoStart){const p=clamp((elapsed-plan.finalPhotoStart)/1200,0,1);finalPhoto.style.opacity=String(p);finalPhoto.style.transform=`translateY(${12*(1-p)}px) rotate(-1deg)`}}
 function offerRetry(){if(finalPhoto.querySelector('button'))return;const button=document.createElement('button');button.className='photo-retry';button.type='button';button.textContent='照片未加载，轻点重试';button.addEventListener('click',async()=>{button.disabled=true;const ok=await load(finalPhoto.querySelector('img[data-media-src]'));if(ok)button.remove();else button.disabled=false});finalPhoto.append(button)}
 function finishStatic(){done=true;cancelAnimationFrame(frame);frame=0;flights.forEach(f=>f.animation?.cancel());section.classList.remove('story-enhanced');port.classList.remove('story-following');nodes.forEach(n=>n.classList.add('entered'));stage.hidden=true;finalPhoto.style.opacity='1';finalPhoto.style.transform='rotate(-1deg)';warm();phase('complete')}
 function canPlay(){return !done&&!document.hidden&&!pointerHeld&&!touchHeld&&Date.now()>=gestureUntil&&visible(port)&&!root.classList.contains('turn-playing')&&!root.classList.contains('paper-motion')&&!root.classList.contains('story-handoff-pending')}
 function suspend(){cancelAnimationFrame(frame);frame=0;lastTime=null}
 function queue(){if(started&&!frame&&canPlay())frame=requestAnimationFrame(tick)}
 function restoreFollow(){
  follow=true;rejoining=true;rejoinElapsed=0;rejoinFrom=port.scrollTop;geometry=null;port.classList.add('story-following');
  if(activeCursor&&section.dataset.storyPhase==='typing')trackLine(...activeCursor);
  else if(focus===copy){const box=readingBox(),center=Number.parseFloat(stage.style.getPropertyValue?.('--memory-center')||stage.style['--memory-center'])||copy.clientHeight*.5;pointTo(contentY(copy)+center-box.offset-box.height*.5,true)}
  else if(focus===finalPhoto){const box=readingBox();pointTo(contentY(nodes[nodes.length-1])-box.offset-24,true)}
  else{const box=readingBox();pointTo(contentY(focus)-box.offset-24,true)}
 }
 function tick(now){frame=0;if(!canPlay()){lastTime=null;return}const dt=lastTime===null?0:Math.min(64,now-lastTime);lastTime=now;
  // A finite return, never a floating-point convergence gate. Some browsers
  // quantize scrollTop, so exponential steps can stop several pixels from target.
  if(rejoining){
   if(scrollTarget===null)rejoining=false;
   else{
    rejoinElapsed+=dt;
    const progress=Math.min(1,rejoinElapsed/300),target=clamp(scrollTarget,0,Math.max(0,port.scrollHeight-port.clientHeight));
    port.scrollTop=rejoinFrom+(target-rejoinFrom)*(1-Math.pow(1-progress,3));
    if(progress===1){port.scrollTop=target;scrollTarget=null;rejoining=false}
   }
   queue();return;
  }
  const waitingForPhotos=elapsed<plan.photoStart&&elapsed+dt>=plan.photoStart&&!assetsReady;
  if(!waitingForPhotos)elapsed+=dt;
   while(eventIndex<plan.events.length&&plan.events[eventIndex].at<=elapsed)runEvent(plan.events[eventIndex++]);
   if(follow&&scrollTarget!==null){const distance=scrollTarget-port.scrollTop;if(Math.abs(distance)<1)scrollTarget=null;else port.scrollTop+=distance*Math.min(1,dt/95)}
   keepLineVisible();
   renderPhotos();
   if(elapsed>=plan.end){done=true;port.classList.remove('story-following');phase('complete');document.dispatchEvent(new CustomEvent('memory-story-complete',{detail:{reason:loaded.get(finalPhoto.querySelector('img[data-media-src]'))?'finished':'media-unavailable'}}));return}
  queue();
 }
 function start(){if(started||done||document.hidden)return;started=true;warm();if(reduced.matches){finishStatic();return}port.classList.add('story-following');setFocus(section);queue()}
 function monitor(){
  if(done)return;const r=section.getBoundingClientRect(),p=port.getBoundingClientRect();if(p.top<vh()*1.6&&p.bottom>0)warm();
  if(!canPlay()){suspend();return}
  if(started){if(!follow)restoreFollow();queue();return}
  const bottom=Math.min(p.bottom,vh());if(visible(section)&&r.top<bottom-80)start();
 }
 function armResume(){gestureUntil=Date.now()+resumeDelay;clearTimeout(gestureTimer);gestureTimer=setTimeout(monitor,resumeDelay+24)}
 function gesture(){if(done||!visible(port))return;if(started){follow=false;rejoining=false;scrollTarget=null;port.classList.remove('story-following')}suspend();armResume()}
 window.addEventListener('wheel',gesture,{passive:true});
 window.addEventListener('pointerdown',()=>{if(!done&&visible(port)){pointerHeld=true;gesture()}},{passive:true});
 window.addEventListener('touchstart',()=>{if(!done&&visible(port)){touchHeld=true;gesture()}},{passive:true});
 window.addEventListener('touchmove',()=>{if(touchHeld)gesture()},{passive:true});
 function releasePointer(){if(pointerHeld){pointerHeld=false;armResume()}}
 function releaseTouch(event){if(touchHeld&&!(event.touches?.length)){touchHeld=false;armResume()}}
 ['pointerup','pointercancel'].forEach(name=>window.addEventListener(name,releasePointer,{passive:true}));
 ['touchend','touchcancel'].forEach(name=>window.addEventListener(name,releaseTouch,{passive:true}));
 window.addEventListener('keydown',e=>{if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' ','Escape'].includes(e.key))gesture()});
 function onScroll(){if(!done&&!follow)armResume();monitor()}
 window.addEventListener('scroll',onScroll,{passive:true});port.addEventListener('scroll',onScroll,{passive:true});window.addEventListener('hashchange',()=>{gesture();monitor()});
 window.addEventListener('resize',()=>{syncPaper();monitor()},{passive:true});
 window.visualViewport?.addEventListener?.('resize',()=>{syncPaper();monitor()},{passive:true});
 document.fonts?.addEventListener?.('loadingdone',syncPaper);
 document.addEventListener('story-handwriting-ready',()=>{syncPaper();monitor()});
 document.addEventListener('camera-story-complete',()=>{syncPaper();monitor()});
 document.addEventListener('story-handoff-complete',()=>{syncPaper();monitor()});
 document.addEventListener('visibilitychange',()=>{suspend();pointerHeld=false;touchHeld=false;if(!document.hidden)monitor()});
 window.addEventListener('blur',()=>{pointerHeld=false;touchHeld=false;if(started&&!done)gesture()});
 window.addEventListener('pagehide',suspend);
 window.addEventListener('pageshow',()=>{pointerHeld=false;touchHeld=false;syncPaper();monitor()});
 reduced.addEventListener?.('change',()=>{if(reduced.matches)finishStatic()});
 syncPaper();if(window.ResizeObserver){const observer=new ResizeObserver(syncPaper);[previous,intro,port].filter(Boolean).forEach(el=>observer.observe(el))}
 if(!reduced.matches)section.classList.add('story-enhanced');
 Promise.race([document.fonts?.ready||Promise.resolve(),new Promise(resolve=>setTimeout(resolve,2500))]).then(()=>{syncPaper();monitor()});
})();
