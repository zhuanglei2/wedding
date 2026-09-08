(() => {
  'use strict';
  const root=document.documentElement;
  const sequence=document.querySelector('.opening-sequence'),sheet=document.querySelector('.turn-sheet');
  const cover=document.querySelector('.image-cover'),stars=document.querySelector('.page-turn-stars');
  const chapter=document.querySelector('#our-story'),entry=document.querySelector('.cover-enter');
  const math=window.WeddingPageTurn;
  if(!sequence||!sheet||!cover||!stars||!chapter||!entry||!math||!window.matchMedia||!window.requestAnimationFrame) return;
  const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
  const coverImage=cover.querySelector('img'),rigImage=document.querySelector('.rig-source'),nextImage=document.querySelector('.opening-underlay img');
  const images=[coverImage,rigImage,nextImage];
  let rig=null,paper=null,trail=null;
  try{
    rig=window.WeddingCharacterRig?.create(stars,rigImage,math);
    paper=window.WeddingPaperSurface?.create(document.querySelector('.paper-slices'),coverImage,math.SEGMENTS);
    trail=window.WeddingStarTrail?.create(document.querySelector('.star-trail'));
    if(paper&&paper.images)images.push(...paper.images);
  }catch(_){return;}
  let enabled=false,frame=0,geometry=null,travelFrame=0,assetFailed=false;
  const properties=['--turn-vh','--track-height','--sheet-height','--sheet-top','--hinge-y','--stars-width'];
  function cancelTravel(){if(travelFrame)window.cancelAnimationFrame(travelFrame);travelFrame=0;}
  function clear(){
    cancelTravel();if(frame)window.cancelAnimationFrame(frame);frame=0;
    if(trail)trail.clear();if(rig)rig.clear();if(paper)paper.clear();
    enabled=false;root.classList.remove('star-turn');
    properties.forEach(name=>root.style.removeProperty(name));
    sheet.style.removeProperty('--front-opacity');sheet.style.removeProperty('--cover-fill');
    entry.style.removeProperty('pointer-events');
  }
  function paint(timestamp){
    frame=0;if(!enabled||!geometry)return;
    try{
      const state=math.sample((window.scrollY-geometry.start)/geometry.distance,geometry);
      paper.paint(state);rig.paint(state,geometry);
      sheet.style.setProperty('--front-opacity',state.p<=0?'1':'0');
      sheet.style.setProperty('--cover-fill',state.p<=0?'#922c25':'transparent');
      entry.style.pointerEvents=state.p<.02?'auto':'none';
      if(trail)trail.update(state,geometry,timestamp);
    }catch(_){clear();}
  }
  function schedule(){if(enabled&&!frame)frame=window.requestAnimationFrame(paint);}
  function configure(){
    cancelTravel();if(trail)trail.clear();
    if(!rig||!paper||preference.matches||assetFailed||images.some(img=>!img||!img.complete||!img.naturalWidth)){clear();return;}
    try{
      const rect=sequence.getBoundingClientRect(),width=sequence.clientWidth,height=window.innerHeight;
      const sheetHeight=Math.max(height,cover.offsetHeight),distance=height*1.15;
      const actorWidth=Math.min(150,Math.max(95,width*.28));
      geometry={width,height,left:rect.left,viewportWidth:window.innerWidth,actorWidth,actorHeight:actorWidth*340/240,start:rect.top+window.scrollY+sheetHeight-height,distance};
      const values=[height,sheetHeight+distance,sheetHeight,height-sheetHeight,sheetHeight-height+height*.60,actorWidth];
      properties.forEach((name,i)=>root.style.setProperty(name,values[i]+'px'));
      paper.configure(geometry);root.classList.add('star-turn');enabled=true;schedule();
    }catch(_){clear();}
  }
  images.forEach(img=>{if(!img)return;img.addEventListener('load',configure);img.addEventListener('error',()=>{assetFailed=true;clear();});});
  if(nextImage)nextImage.loading='eager';
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',configure,{passive:true});window.addEventListener('pageshow',configure);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelTravel();if(trail)trail.clear();}});
  window.addEventListener('wheel',cancelTravel,{passive:true});window.addEventListener('touchstart',cancelTravel,{passive:true});window.addEventListener('keydown',cancelTravel);
  if(preference.addEventListener)preference.addEventListener('change',configure);else if(preference.addListener)preference.addListener(configure);
  entry.addEventListener('click',event=>{
    if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||(event.button!==undefined&&event.button!==0)||!enabled||!geometry)return;
    event.preventDefault();if(travelFrame)return;
    const from=window.scrollY,align=Math.abs(geometry.start-from)>2?350:0;
    let started;
    const advance=timestamp=>{
      if(!enabled)return;
      if(started===undefined)started=timestamp;
      const elapsed=timestamp-started;
      const p=math.clamp((elapsed-align)/math.DURATION);
      const t=align?math.clamp(elapsed/align):1;
      const top=elapsed<align?from+(geometry.start-from)*t*t*(3-2*t):geometry.start+geometry.distance*p;
      window.scrollTo({top,behavior:'auto'});schedule();
      if(p<1)travelFrame=window.requestAnimationFrame(advance);
      else{travelFrame=0;chapter.focus({preventScroll:true});}
    };
    travelFrame=window.requestAnimationFrame(advance);
  });
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(configure);
  configure();
})();
