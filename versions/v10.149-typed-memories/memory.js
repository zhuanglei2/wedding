/* One monotonic sequence clock for this interactive page. No scroll locking. */
(()=>{'use strict';
 const section=document.querySelector('#story-timeline'),math=window.WeddingMemoryMath;
 if(!section||!math)return;
 const root=document.documentElement,nodes=[...section.querySelectorAll('[data-story-node]')];
 const blocks=nodes.map(n=>[...n.querySelectorAll('.type-block')]);
 const glyphs=blocks.map(row=>row.map(b=>[...b.querySelectorAll('.type-glyph')]));
 const plan=math.makePlan(glyphs.map(row=>row.map(gs=>gs.map(g=>g.textContent))));
 const stage=section.querySelector('.memory-stack'),copy=section.querySelector('.memory-copy');
 const cards=[...stage.querySelectorAll('[data-memory-card]')],finalPhoto=section.querySelector('.wedding-finale');
 const images=[...section.querySelectorAll('img[data-media-src]')];
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let elapsed=0,eventIndex=0,started=false,done=false,frame=0,lastTime=null,focus=section;
 let follow=true,scrollTarget=null,gestureUntil=0,gestureTimer=0,preload=null,assetsReady=false,geometry=null;
 const loaded=new WeakMap(),flights=[];
 const vh=()=>window.visualViewport?.height||window.innerHeight;
 const visible=el=>{const r=el.getBoundingClientRect();return r.bottom>24&&r.top<vh()-24};
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 function phase(name){section.dataset.storyPhase=name}
 function load(img){return new Promise(resolve=>{let settled=false;const finish=ok=>{if(settled)return;settled=true;clearTimeout(timer);img.removeEventListener('load',onload);img.removeEventListener('error',onerror);loaded.set(img,ok);resolve(ok)};const onload=()=>{Promise.resolve(img.decode?.()).catch(()=>{}).then(()=>finish(img.naturalWidth>0))};const onerror=()=>finish(false);const timer=setTimeout(()=>finish(false),10000);img.addEventListener('load',onload);img.addEventListener('error',onerror);img.loading='eager';img.src=img.dataset.mediaSrc;if(img.complete&&img.naturalWidth)onload()})}
 function warm(){if(!preload){let cursor=0;async function worker(){while(cursor<images.length)await load(images[cursor++])}preload=Promise.all([worker(),worker()]).then(()=>{assetsReady=true;return true})}return preload}
 function pointTo(y,allowBack=false){if(!follow)return;const max=Math.max(0,document.documentElement.scrollHeight-vh());scrollTarget=clamp(allowBack?y:Math.max(window.scrollY,y),0,max)}
 function setFocus(el){focus=el;if(!follow)return;const r=el.getBoundingClientRect();if(r.top>vh()*.65||r.top<0)pointTo(window.scrollY+r.top-vh()*.3)}
 function measureBlock(node,block){const gs=glyphs[node][block];geometry=gs.map(g=>{const r=g.getBoundingClientRect();return window.scrollY+r.bottom})}
 function buildFlights(){
  const rect=copy.getBoundingClientRect(),height=copy.clientHeight,width=copy.clientWidth;
  const cardHeight=Math.max(...cards.map(c=>c.offsetHeight));
  const center=clamp(height-cardHeight*.53-20,Math.min(height/2,cardHeight/2+20),Math.max(height/2,height-cardHeight/2-20));
  stage.style.setProperty('--memory-center',center+'px');
  pointTo(window.scrollY+rect.top+center-vh()*.5,true);
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
  if(kind==='block'){blocks[node][block].classList.add('typing');setFocus(blocks[node][block]);measureBlock(node,block)}
  if(kind==='glyph'){glyphs[node][block][index].classList.add('typed');if(follow&&geometry){const y=geometry[index];if(y-window.scrollY>vh()*.74)pointTo(y-vh()*.65)}}
  if(kind==='block-end'){blocks[node][block].classList.remove('typing');blocks[node][block].classList.add('type-complete')}
  if(kind==='photos'){focus=copy;phase('photos');buildFlights()}
  if(kind==='photos-end'){stage.hidden=true;flights.forEach(f=>f.animation?.cancel());phase('between-nodes')}
  if(kind==='final-photo'){focus=finalPhoto;finalPhoto.classList.add('revealed');const r=finalPhoto.getBoundingClientRect();pointTo(window.scrollY+r.top-vh()*.18);phase('wedding-photo');if(!loaded.get(finalPhoto.querySelector('img[data-media-src]')))offerRetry()}
 }
 function renderPhotos(){if(elapsed>=plan.photoStart&&elapsed<plan.photoEnd){const local=elapsed-plan.photoStart;
  flights.forEach(f=>{if(local<f.start)return;f.card.style.visibility='visible';if(f.animation&&!f.finished)f.animation.currentTime=Math.min(f.duration,local-f.start);else f.card.classList.add('landed');if(local>=f.start+f.duration&&!f.finished){f.finished=true;f.card.classList.add('landed');f.card.style.willChange='auto';f.animation?.cancel()}});
  if(elapsed>=plan.fadeStart){phase('fading');stage.style.opacity=String(1-clamp((elapsed-plan.fadeStart)/math.fadeDuration,0,1))}else if(elapsed>=plan.holdStart)phase('keepsake-hold');
 }if(elapsed>=plan.finalPhotoStart){const p=clamp((elapsed-plan.finalPhotoStart)/1200,0,1);finalPhoto.style.opacity=String(p);finalPhoto.style.transform=`translateY(${12*(1-p)}px) rotate(-1deg)`}}
 function offerRetry(){if(finalPhoto.querySelector('button'))return;const button=document.createElement('button');button.className='photo-retry';button.type='button';button.textContent='照片未加载，轻点重试';button.addEventListener('click',async()=>{button.disabled=true;const ok=await load(finalPhoto.querySelector('img[data-media-src]'));if(ok)button.remove();else button.disabled=false});finalPhoto.append(button)}
 function finishStatic(){done=true;cancelAnimationFrame(frame);frame=0;flights.forEach(f=>f.animation?.cancel());section.classList.remove('story-enhanced');root.classList.remove('story-following');nodes.forEach(n=>n.classList.add('entered'));stage.hidden=true;finalPhoto.style.opacity='1';finalPhoto.style.transform='rotate(-1deg)';warm();phase('complete')}
 function tick(now){frame=0;if(done)return;const dt=lastTime===null?0:Math.min(64,now-lastTime);lastTime=now;
  const paused=document.hidden||Date.now()<gestureUntil||(!follow&&!visible(focus));
  const waitingForPhotos=elapsed<plan.photoStart&&elapsed+dt>=plan.photoStart&&!assetsReady;
  if(!paused){if(!waitingForPhotos)elapsed+=dt;
   while(eventIndex<plan.events.length&&plan.events[eventIndex].at<=elapsed)runEvent(plan.events[eventIndex++]);
   if(follow&&scrollTarget!==null){const distance=scrollTarget-window.scrollY;if(Math.abs(distance)<1)scrollTarget=null;else window.scrollTo(0,window.scrollY+distance*Math.min(1,dt/140))}
   renderPhotos();
   if(elapsed>=plan.end){done=true;root.classList.remove('story-following');phase('complete');return}
  }frame=requestAnimationFrame(tick);
 }
 function start(){if(started||done||document.hidden)return;started=true;warm();if(reduced.matches){finishStatic();return}root.classList.add('story-following');setFocus(section);frame=requestAnimationFrame(tick)}
 function monitor(){if(done)return;const r=section.getBoundingClientRect();if(r.top<vh()*1.6&&r.bottom>0)warm();if(!started&&r.top<vh()*.78&&r.bottom>40&&Date.now()>gestureUntil&&!root.classList.contains('turn-playing')&&!root.classList.contains('paper-motion'))start()}
 function gesture(){if(started){follow=false;scrollTarget=null;root.classList.remove('story-following')}gestureUntil=Date.now()+450;clearTimeout(gestureTimer);gestureTimer=setTimeout(monitor,480)}
 ['wheel','touchstart','touchmove','pointerdown'].forEach(name=>window.addEventListener(name,gesture,{passive:true}));
 window.addEventListener('keydown',e=>{if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' ','Escape'].includes(e.key))gesture()});
 window.addEventListener('scroll',monitor,{passive:true});window.addEventListener('hashchange',()=>{if(started)gesture();monitor()});
 window.addEventListener('resize',()=>{geometry=null;gesture()},{passive:true});
 document.addEventListener('visibilitychange',()=>{lastTime=null;if(!document.hidden)monitor()});
 reduced.addEventListener?.('change',()=>{if(reduced.matches)finishStatic()});
 if(!reduced.matches)section.classList.add('story-enhanced');
 Promise.race([document.fonts?.ready||Promise.resolve(),new Promise(resolve=>setTimeout(resolve,2500))]).then(monitor);
})();
