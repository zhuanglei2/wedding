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
  let playing=false,completed=false,progress=0;
  const properties=['--turn-vh','--track-height','--sheet-height','--sheet-top','--hinge-y','--stars-width'];
  function cancelTravel(){
    if(travelFrame)window.cancelAnimationFrame(travelFrame);travelFrame=0;
    playing=false;root.classList.remove('turn-playing');
  }
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
      const state=math.sample(progress,geometry);
      paper.paint(state);rig.paint(state,geometry);
      sheet.style.setProperty('--front-opacity',state.p<=0?'1':'0');
      sheet.style.setProperty('--cover-fill',state.p<=0?'#922c25':'transparent');
      entry.style.pointerEvents=state.p<.02?'auto':'none';
      if(trail)trail.update(state,geometry,timestamp);
    }catch(_){clear();}
  }
  function schedule(){if(enabled&&!playing&&!frame)frame=window.requestAnimationFrame(paint);}
  function finish(focus=false){
    cancelTravel();if(frame)window.cancelAnimationFrame(frame);frame=0;
    completed=true;progress=1;
    if(geometry)window.scrollTo({top:geometry.start+geometry.distance,behavior:'auto'});
    paint(0);if(trail)trail.clear();
    if(focus)chapter.focus({preventScroll:true});
  }
  function startTravel(focus=false){
    if(!enabled||!geometry||playing||document.hidden)return;
    if(frame)window.cancelAnimationFrame(frame);frame=0;
    playing=true;completed=false;progress=0;root.classList.add('turn-playing');
    const from=window.scrollY,align=Math.abs(geometry.start-from)>2?250:0;
    let started;
    const advance=timestamp=>{
      if(!enabled||!playing)return;
      if(started===undefined)started=timestamp;
      const elapsed=timestamp-started;
      progress=math.clamp((elapsed-align)/math.DURATION);
      const t=align?math.clamp(elapsed/align):1;
      const top=elapsed<align?from+(geometry.start-from)*t*t*(3-2*t):geometry.start+geometry.distance*progress;
      window.scrollTo({top,behavior:'auto'});
      paint(timestamp);
      if(!enabled||!playing)return;
      if(progress<1)travelFrame=window.requestAnimationFrame(advance);
      else finish(focus);
    };
    travelFrame=window.requestAnimationFrame(advance);
  }
  function onScroll(){
    if(!enabled||!geometry||playing)return;
    const offset=window.scrollY-geometry.start;
    if(offset<=2){completed=false;progress=0;}
    else if(offset>=geometry.distance-2){completed=true;progress=1;}
    else if(!completed&&offset>8){startTravel();return;}
    schedule();
  }
  function configure(){
    if(!rig||!paper||preference.matches||assetFailed||images.some(img=>!img||!img.complete||!img.naturalWidth)){
      const wasPlaying=playing;clear();
      if(wasPlaying)chapter.scrollIntoView?.({behavior:'auto'});
      return;
    }
    // Mobile address bars change innerHeight during scrolling. Freeze the
    // geometry for one flight; a real width/orientation change settles it.
    if(playing&&geometry&&geometry.viewportWidth===window.innerWidth)return;
    const settleAfterResize=playing;
    if(playing)finish();
    if(trail)trail.clear();
    try{
      const rect=sequence.getBoundingClientRect(),width=sequence.clientWidth,height=window.innerHeight;
      // Keep the paper at its actual image height. The underlay and chapter
      // already share one viewport; a 1.15vh track added a visible 0.15vh gap.
      const sheetHeight=cover.offsetHeight,distance=Math.min(height,sheetHeight);
      const actorWidth=math.actorWidth(width);
      const readingOffset=Math.max(0,sheetHeight-height);
      geometry={width,height,left:rect.left,viewportWidth:window.innerWidth,actorWidth,actorHeight:actorWidth*340/240,start:rect.top+window.scrollY+readingOffset,distance};
      const values=[height,sheetHeight+height,sheetHeight,-readingOffset,readingOffset+height*.60,actorWidth];
      properties.forEach((name,i)=>root.style.setProperty(name,values[i]+'px'));
      paper.configure(geometry);root.classList.add('star-turn');enabled=true;
      if(settleAfterResize)window.scrollTo({top:geometry.start+geometry.distance,behavior:'auto'});
      onScroll();
    }catch(_){clear();}
  }
  images.forEach(img=>{if(!img)return;img.addEventListener('load',configure);img.addEventListener('error',()=>{assetFailed=true;configure();});});
  if(nextImage)nextImage.loading='eager';
  window.addEventListener('scroll',onScroll,{passive:true});
  window.addEventListener('resize',configure,{passive:true});window.addEventListener('pageshow',configure);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){if(playing)finish();if(trail)trail.clear();}});
  // Only consume single-finger scrolling during the finite transition. Outside
  // it, reading is native. Multi-touch zoom and modified wheel remain available.
  const guard=event=>{
    if(!playing||event.ctrlKey||event.metaKey||(event.touches&&event.touches.length>1))return;
    if(event.cancelable)event.preventDefault();
  };
  window.addEventListener('wheel',guard,{passive:false});
  window.addEventListener('touchmove',guard,{passive:false});
  window.addEventListener('keydown',event=>{
    if(!playing)return;
    if(event.key==='Escape'){event.preventDefault();finish(true);}
    else if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(event.key))guard(event);
    else if(event.key==='Tab')finish();
  });
  if(preference.addEventListener)preference.addEventListener('change',configure);else if(preference.addListener)preference.addListener(configure);
  entry.addEventListener('click',event=>{
    if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||(event.button!==undefined&&event.button!==0)||!enabled||!geometry)return;
    event.preventDefault();startTravel(true);
  });
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(configure);
  configure();
})();
