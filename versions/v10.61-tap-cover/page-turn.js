(() => {
  'use strict';
  const root=document.documentElement;
  const sequence=document.querySelector('.opening-sequence');
  const sheet=document.querySelector('.turn-sheet');
  const cover=document.querySelector('.image-cover');
  const stars=document.querySelector('.page-turn-stars');
  const chapter=document.querySelector('#our-story');
  const entry=document.querySelector('.cover-enter');
  const math=window.WeddingPageTurn;
  if (!sequence||!sheet||!cover||!stars||!chapter||!entry||!math||!window.matchMedia||!window.requestAnimationFrame) return;
  const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
  const trail=window.WeddingStarTrail?window.WeddingStarTrail.create(document.querySelector('.star-trail')):null;
  const coverImage=cover.querySelector('img');
  const starImage=stars.querySelector('img');
  const nextImage=document.querySelector('.opening-underlay img');
  const images=[coverImage,starImage,nextImage];
  let enabled=false, frame=0, geometry=null, travelFrame=0;
  let assetFailed=false;
  const properties=['--turn-vh','--track-height','--sheet-height','--sheet-top','--hinge-y','--stars-width'];
  function cancelTravel() {
    if(travelFrame) window.cancelAnimationFrame(travelFrame);
    travelFrame=0;
  }
  function clear() {
    cancelTravel();
    if(trail) trail.clear();
    enabled=false;
    root.classList.remove('star-turn');
    properties.forEach(name=>root.style.removeProperty(name));
    sheet.style.removeProperty('transform');
    sheet.style.removeProperty('--sheet-shade');
    stars.style.removeProperty('transform');
    stars.style.removeProperty('opacity');
  }
  function paint(timestamp) {
    frame=0;
    if(!enabled||!geometry) return;
    try {
      const state=math.sample((window.scrollY-geometry.start)/geometry.distance,geometry);
      sheet.style.transform=`perspective(${state.depth}px) rotateY(${state.angle.toFixed(4)}deg)`;
      sheet.style.setProperty('--sheet-shade',state.shade.toFixed(4));
      stars.style.transform=`translate3d(${state.x.toFixed(3)}px,${state.y.toFixed(3)}px,0) rotate(${state.tilt.toFixed(3)}deg)`;
      stars.style.opacity=state.opacity.toFixed(4);
      if(trail) trail.update(state,geometry,timestamp);
    } catch (_) { clear(); }
  }
  function schedule() { if(enabled&&!frame) frame=window.requestAnimationFrame(paint); }
  function configure() {
    cancelTravel();
    if(trail) trail.clear();
    if(preference.matches||assetFailed||images.some(img=>!img||!img.complete||!img.naturalWidth)) {clear();return;}
    try {
      // Measure untransformed content, once per resize/load; never from the turning sheet.
      const rect=sequence.getBoundingClientRect();
      const width=sequence.clientWidth;
      const height=window.innerHeight;
      const sheetHeight=Math.max(height,cover.offsetHeight);
      const distance=height*1.15;
      const actorWidth=Math.min(230,Math.max(144,width*.43));
      geometry={width,height,left:rect.left,viewportWidth:window.innerWidth,actorWidth,actorHeight:actorWidth*starImage.naturalHeight/starImage.naturalWidth,start:rect.top+window.scrollY+sheetHeight-height,distance};
      const values=[height,sheetHeight+distance,sheetHeight,height-sheetHeight,sheetHeight-height+height*.60,actorWidth];
      properties.forEach((name,index)=>root.style.setProperty(name,values[index]+'px'));
      root.classList.add('star-turn');
      enabled=true;
      schedule();
    } catch (_) { clear(); }
  }
  images.forEach(img=>{
    if(!img) return;
    img.addEventListener('load',configure);
    img.addEventListener('error',()=>{assetFailed=true;clear();});
  });
  // The hidden next-page layer must be decoded before we hide its static figure.
  if(nextImage) nextImage.loading='eager';
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',configure,{passive:true});
  window.addEventListener('pageshow',configure);
  if(trail) document.addEventListener('visibilitychange',()=>{if(document.hidden) trail.clear();});
  window.addEventListener('wheel',cancelTravel,{passive:true});
  window.addEventListener('touchstart',cancelTravel,{passive:true});
  window.addEventListener('keydown',cancelTravel);
  if(preference.addEventListener) preference.addEventListener('change',configure);
  else if(preference.addListener) preference.addListener(configure);
  entry.addEventListener('click',event=>{
    if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||(event.button!==undefined&&event.button!==0)) return;
    if(!enabled||!geometry) return;
    event.preventDefault();
    if(travelFrame) return;
    const from=window.scrollY, to=geometry.start+geometry.distance;
    let started;
    // Browser-native smooth scrolling may finish in a blink. A finite 2.6s
    // click-through lets the approach, grip and turn each remain visible.
    const advance=timestamp=>{
      if(!enabled) return;
      if(started===undefined) started=timestamp;
      const progress=Math.min(1,(timestamp-started)/2600);
      window.scrollTo({top:from+(to-from)*progress,behavior:'auto'});
      schedule();
      if(progress<1) travelFrame=window.requestAnimationFrame(advance);
      else { travelFrame=0; chapter.focus({preventScroll:true}); }
    };
    travelFrame=window.requestAnimationFrame(advance);
  });
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(configure);
  configure();
})();
