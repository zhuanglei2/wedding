(() => {
  'use strict';
  const root=document.documentElement,math=window.WeddingPageTurn,story=window.WeddingCameraMath;
  const stages=[...document.querySelectorAll('.reference-art')];
  const stage=document.querySelector('#our-story .reference-art')||stages[0];
  const rigImage=document.querySelector('.rig-source'),eyes=document.querySelector('.head-source');
  const status=document.querySelector('[data-camera-status]');
  if(!stage||!math||!story||!window.requestAnimationFrame)return;
  const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
  const layer=document.createElement('div');layer.className='camera-flight-layer';layer.setAttribute('aria-hidden','true');
  const trailCanvas=document.createElement('canvas'),actorCanvas=document.createElement('canvas'),flash=document.createElement('div');
  trailCanvas.className='camera-trail';actorCanvas.className='camera-actors';flash.className='camera-flash';
  layer.append(trailCanvas,actorCanvas,flash);document.body.appendChild(layer);
  const rig=window.WeddingCharacterRig?.create(actorCanvas,rigImage,math,eyes),trail=window.WeddingStarTrail?.create(trailCanvas);
  let ready=false,active=false,played=false,failed=false,frame=0,started=null,plan=null,scrollAt=0;
  function message(text){if(status)status.textContent=text;}
  const styles=new WeakMap();
  function setStyle(node,key,value){
    let cache=styles.get(node);if(!cache){cache=new Map();styles.set(node,cache);}
    if(cache.get(key)===value)return;
    node.style.setProperty(key,value);cache.set(key,value);
  }
  function css(state){
    const values={
      '--print-y':(-13.7*(1-state.print))+'%',
      '--caption-alpha':String(state.caption),'--names-alpha':String(state.names),
      '--camera-press':String(state.press),'--photo-scale':String(state.photoScale),
      '--photo-rise':state.photoRise+'%','--camera-hide':String(state.cameraHide),
      '--lens-flash':String(state.lensFlash)
    };
    for(const node of stages){
      for(const [key,value] of Object.entries(values))setStyle(node,key,value);
      const settled=state.photoScale===story.PHOTO_SCALE&&state.cameraHide===1;
      if(settled)node.classList.add('camera-photo-settled');else node.classList.remove('camera-photo-settled');
    }
    // Closing note shares the existing names/date reveal clock.
    setStyle(root,'--memo-alpha',String(state.names));
    if(flash.style.opacity!==String(state.flash))flash.style.opacity=String(state.flash);
  }
  function complete(){
    if(frame)window.cancelAnimationFrame(frame);frame=0;active=false;played=true;
    css({print:1,caption:1,names:1,press:0,flash:0,lensFlash:0,photoScale:story.PHOTO_SCALE,photoRise:story.PHOTO_RISE,cameraHide:1,done:true});
    rig?.clear();trail?.clear();layer.classList.remove('is-active');
    root.classList.remove('camera-pending');
    message('照片已打印并放大，欢迎赴约。');
    document.dispatchEvent(new Event('camera-story-complete'));
  }
  function geometry(){
    const rect=stage.getBoundingClientRect(),w=rect.width;
    return {rect,g:{width:w,height:window.innerHeight,left:rect.left,viewportWidth:window.innerWidth,actorWidth:math.actorWidth(w)}};
  }
  function start(input={}){
    if(active||played)return false;
    if(!ready||failed||preference.matches||!rig){complete();return false;}
    const {g,rect}=input.view||geometry();
    plan=story.makePlan(math,g,rect,input.actors,input.flight);active=true;played=true;started=Number.isFinite(input.timestamp)?input.timestamp:null;scrollAt=window.scrollY;
    document.dispatchEvent(new Event('camera-story-started'));
    layer.classList.add('is-active');
    message('星星人正在为你们记录幸福。');
    const draw=timestamp=>{
      frame=0;if(!active)return;
      if(started===null)started=timestamp;
      const state=story.sample(timestamp-started,plan);css(state);
      try{rig.paint(state,plan.g);trail?.update(state,plan.g,timestamp);}catch(_){complete();return;}
      if(state.done){complete();return;}
      frame=window.requestAnimationFrame(draw);
    };
    // Paint the handoff pose synchronously; no one-frame disappearance.
    try{
      const first=story.sample(0,plan);css(first);rig.paint(first,plan.g);
    }catch(_){complete();return false;}
    frame=window.requestAnimationFrame(draw);
    return true;
  }
  window.WeddingCameraStory={start,complete,get ready(){return ready&&!failed&&!preference.matches},get active(){return active},get played(){return played}};
  if(preference.matches||!rig){complete();return;}
  root.classList.add('camera-pending');
  if(window.__cameraBootTimer)clearTimeout(window.__cameraBootTimer);
  // Asset loading never leaves the page hidden indefinitely. Cover has first priority.
  let watchdog=null;
  const cover=document.querySelector('.image-cover img');
  function waitImage(image){
    return new Promise((resolve,reject)=>{
      if(!image)return reject(Error('missing image'));
      const decode=()=>image.naturalWidth?(typeof image.decode==='function'?image.decode().then(resolve,reject):resolve()):reject(Error('broken image'));
      if(image.complete&&image.naturalWidth)return decode();
      image.addEventListener('load',decode,{once:true});image.addEventListener('error',reject,{once:true});
    });
  }
  async function prepare(){
    try{
      if(window.WeddingMedia)await window.WeddingMedia.ready;
      if(cover)await waitImage(cover);
      watchdog=setTimeout(()=>{if(!ready){failed=true;complete();}},15000);
      for(const image of [rigImage,eyes]){
        const src=image?.getAttribute('data-src');if(src&&!image.getAttribute('src'))image.src=src;
      }
      const images=[...new Set([...document.querySelectorAll('.reference-art img'),rigImage,eyes])];
      for(const image of images)if(image)image.loading='eager';
      await Promise.all(images.map(waitImage));
      clearTimeout(watchdog);if(failed)return;
      // Allocate both backing stores before enabling the first-page transition.
      const {g}=geometry();
      rig.paint({actors:[],p:0,opacity:0},g);
      trail?.update({p:0,opacity:0,emitters:[]},g,0);
      ready=true;
      document.dispatchEvent(new Event('camera-assets-ready'));
      if(location.hash==='#our-story')startWhenVisible();
    }catch(_){clearTimeout(watchdog);failed=true;complete();}
  }
  function startWhenVisible(){
    if(!ready||played||root.classList.contains('turn-playing'))return;
    const r=(document.querySelector('#our-story')||stage).getBoundingClientRect();
    // Native scroll/no-canvas fallback and #our-story links also get a usable page.
    if(r.top<=window.innerHeight*.18&&r.bottom>0)start();
  }
  function cancelOnChange(){
    if(active)complete();
  }
  window.addEventListener('resize',cancelOnChange,{passive:true});
  window.addEventListener('scroll',()=>{
    if(active&&Math.abs(window.scrollY-scrollAt)>2)complete();
    else startWhenVisible();
  },{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&active)complete();});
  window.addEventListener('pagehide',()=>{if(active)complete();});
  const change=()=>{if(preference.matches)complete();};
  if(preference.addEventListener)preference.addEventListener('change',change);else preference.addListener(change);
  const guard=event=>{
    if(!active)return;
    if(event.ctrlKey||event.metaKey||event.touches?.length>1){complete();return;}
    if(event.cancelable)event.preventDefault();
  };
  window.addEventListener('wheel',guard,{passive:false});window.addEventListener('touchmove',guard,{passive:false});
  window.addEventListener('keydown',event=>{
    if(!active)return;
    if(event.key==='Escape'||event.key==='Tab'){complete();return;}
    if([' ','ArrowUp','ArrowDown','PageUp','PageDown','Home','End'].includes(event.key))guard(event);
  });
  prepare();
})();
