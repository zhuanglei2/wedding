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
  const headImage=document.querySelector('.head-source');
  // Both the under-paper preview and the real scrolling page must decode before the turn.
  const nextMedia=Array.from(document.querySelectorAll('.reference-art img'));
  const sourceImages=[...new Set([coverImage,rigImage,nextImage,headImage,...nextMedia])];
  const images=[...sourceImages];
  const decoded=new WeakSet(),decoding=new WeakSet();
  function pixelsReady(){
    let ready=true;
    // Decode the cover, sprites and both page renderings before a flight, not on its
    // first canvas frame. Browsers without decode retain the load-event gate.
    for(const image of sourceImages){
      if(!image||typeof image.decode!=='function'||decoded.has(image))continue;
      ready=false;
      if(!decoding.has(image)){
        decoding.add(image);
        try{image.decode().then(()=>{decoded.add(image);configure();},()=>{assetFailed=true;configure();});}
        catch(_){assetFailed=true;}
      }
    }
    return ready;
  }
  let rig=null,paper=null,trail=null,prepared=false;
  function prepare(){
    if(prepared||preference.matches||!coverImage?.complete||!coverImage.naturalWidth)return;
    prepared=true;
    try{
      // Cover gets the first request budget. Prepare sprites and the next photo
      // only afterwards; never create slices with the unused JPEG fallback.
      for(const image of [rigImage,headImage]){
        const src=image?.getAttribute?.('data-src');
        if(src)image.src=src;
      }
      if(nextImage)nextImage.loading='eager';
      for(const image of nextMedia)image.loading='eager';
      rig=window.WeddingCharacterRig?.create(stars,rigImage,math,headImage);
      paper=window.WeddingPaperSurface?.create(document.querySelector('.paper-slices'),coverImage,math.SEGMENTS);
      trail=window.WeddingStarTrail?.create(document.querySelector('.star-trail'));
      if(paper&&paper.images)for(const image of paper.images){images.push(image);watch(image);}
    }catch(_){assetFailed=true;}
  }
  let enabled=false,frame=0,geometry=null,travelFrame=0,assetFailed=false;
  let playing=false,completed=false,progress=0,playbackScrollY=null;
  const properties=['--turn-vh','--track-height','--sheet-height','--sheet-top','--hinge-y','--stars-width'];
  const playbackProperties=['--play-sheet-top','--play-sheet-left','--play-sheet-width'];
  function cancelTravel(){
    if(travelFrame)window.cancelAnimationFrame(travelFrame);travelFrame=0;
    playing=false;root.classList.remove('turn-playing');
    playbackScrollY=null;
    playbackProperties.forEach(name=>root.style.removeProperty(name));
    sheet.style.removeProperty('--hinge-y');
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
      // Complete the paper turn while the couple stays together, awaiting the camera beat.
      const held=math.sample(Math.min(progress,.79),geometry);
      if(progress>=1&&!playing)held.actors=held.actors.map(a=>({...a,opacity:0}));
      state.actors=held.actors;state.emitters=held.actors.map(a=>a.emitter);
      state.opacity=Math.max(...held.actors.map(a=>a.opacity));
      paper.paint(state);rig.paint(state,geometry);
      sheet.style.setProperty('--front-opacity',state.p<=0?'1':'0');
      sheet.style.setProperty('--cover-fill',state.p<=0?'#922c25':'transparent');
      entry.style.pointerEvents=state.p<.02?'auto':'none';
      if(trail)trail.update(state,geometry,timestamp);
    }catch(_){clear();}
  }
  function schedule(){if(enabled&&!playing&&!frame)frame=window.requestAnimationFrame(paint);}
  function finish(focus=false,skipStory=false){
    const handoff=geometry?math.sample(.79,geometry).actors:null;
    cancelTravel();if(frame)window.cancelAnimationFrame(frame);frame=0;
    completed=true;progress=1;
    if(geometry)window.scrollTo({top:geometry.start+geometry.distance,behavior:'auto'});
    paint(0);if(trail)trail.clear();
    if(focus)chapter.focus({preventScroll:true});
    if(skipStory)window.WeddingCameraStory?.complete();
    else window.WeddingCameraStory?.start({actors:handoff});
  }
  function startTravel(focus=false){
    if(!enabled||!geometry||playing||document.hidden)return;
    if(frame)window.cancelAnimationFrame(frame);frame=0;
    // Freeze the exact visible crop. Do not scroll to the old bottom-of-cover
    // trigger: that 250ms alignment made a tap look like a downward jump.
    const rect=cover.getBoundingClientRect();
    playbackScrollY=window.scrollY;
    root.style.setProperty('--play-sheet-top',rect.top+'px');
    root.style.setProperty('--play-sheet-left',geometry.left+'px');
    root.style.setProperty('--play-sheet-width',geometry.width+'px');
    // Paper and character grips must share a viewport-relative hinge even
    // when the reader taps near the top or halfway down a long invitation.
    sheet.style.setProperty('--hinge-y',(geometry.height*.60-rect.top)+'px');
    playing=true;completed=false;progress=0;root.classList.add('turn-playing');
    let started;
    const advance=timestamp=>{
      if(!enabled||!playing)return;
      if(started===undefined)started=timestamp;
      const elapsed=timestamp-started;
      progress=math.progressAt(elapsed*math.DURATION/3800);
      paint(timestamp);
      if(!enabled||!playing)return;
      if(progress<1)travelFrame=window.requestAnimationFrame(advance);
      else finish(focus);
    };
    travelFrame=window.requestAnimationFrame(advance);
  }
  function onScroll(){
    if(!enabled||!geometry)return;
    if(playing){
      // Consume residual mobile momentum without moving the fixed paper or
      // cancelling its clock. No per-frame scroll writes during playback.
      if(playbackScrollY!==null&&Math.abs(window.scrollY-playbackScrollY)>1)
        window.scrollTo({top:playbackScrollY,behavior:'auto'});
      return;
    }
    const offset=window.scrollY-geometry.start;
    if(offset<=2){completed=false;progress=0;}
    else if(offset>=geometry.distance-2){completed=true;progress=1;}
    else if(!completed&&offset>8){startTravel();return;}
    schedule();
  }
  function configure(){
    prepare();
    if(!rig||!paper||preference.matches||(window.WeddingCameraStory&&!window.WeddingCameraStory.ready)||assetFailed||images.some(img=>!img||!img.complete||!img.naturalWidth)||!pixelsReady()){
      const wasPlaying=playing;clear();
      if(wasPlaying)chapter.scrollIntoView?.({behavior:'auto'});
      return;
    }
    // Mobile address bars change innerHeight during scrolling. Freeze the
    // geometry for one flight; a real width/orientation change settles it.
    if(playing&&geometry&&geometry.viewportWidth===window.innerWidth)return;
    const settleAfterResize=playing;
    if(playing)finish(false,true);
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
  function watch(img){if(!img)return;img.addEventListener('load',configure);img.addEventListener('error',()=>{assetFailed=true;configure();});}
  images.forEach(watch);
  document.addEventListener('camera-assets-ready',configure);
  window.addEventListener('scroll',onScroll,{passive:true});
  window.addEventListener('resize',configure,{passive:true});window.addEventListener('pageshow',configure);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){if(playing)finish(false,true);if(trail)trail.clear();}});
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
    if(event.key==='Escape'){event.preventDefault();finish(true,true);}
    else if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(event.key))guard(event);
    else if(event.key==='Tab')finish(false,true);
  });
  if(preference.addEventListener)preference.addEventListener('change',configure);else if(preference.addListener)preference.addListener(configure);
  entry.addEventListener('click',event=>{
    if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||(event.button!==undefined&&event.button!==0)||!enabled||!geometry)return;
    event.preventDefault();startTravel(true);
  });
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(configure);
  configure();
})();
