(() => {
  'use strict';
  const root=document.documentElement,cover=document.querySelector('.image-cover picture img');
  const entry=document.querySelector('.cover-enter');
  const story=[...document.querySelectorAll('[data-media-group="story"]')];
  const later=[...document.querySelectorAll('[data-media-group="later"]')];
  let released=false,pendingTap=false,staticOnly=false,resolveReady;
  const ready=new Promise(resolve=>{resolveReady=resolve;});
  const frame=callback=>window.requestAnimationFrame?window.requestAnimationFrame(callback):setTimeout(callback,0);
  let pageWidth=window.innerWidth;
  root.style.setProperty('--paper-height',window.innerHeight+'px');
  window.addEventListener('resize',()=>{
    // Ignore browser-toolbar height changes; lvh already reserves their full space.
    if(pageWidth!==window.innerWidth){pageWidth=window.innerWidth;root.style.setProperty('--paper-height',window.innerHeight+'px');}
  },{passive:true});
  function activate(image){
    const src=image.getAttribute('data-media-src');
    if(!src||image.getAttribute('src'))return;
    image.loading='eager';image.src=src;
  }
  function release(){
    if(released)return;
    released=true;
    for(const image of story)activate(image);
    root.classList.remove('cover-first');
    resolveReady();document.dispatchEvent(new Event('camera-media-released'));
  }
  window.WeddingMedia={ready,get released(){return released;}};
  function afterPaint(){
    // The timeout only handles a background tab where animation frames pause.
    const fallback=setTimeout(release,1500);
    frame(()=>frame(()=>{clearTimeout(fallback);release();}));
  }
  function coverReady(){
    if(cover?.naturalWidth&&typeof cover.decode==='function')cover.decode().then(afterPaint,afterPaint);
    else afterPaint();
  }
  if(!cover||cover.complete)coverReady();
  else{cover.addEventListener('load',coverReady,{once:true});cover.addEventListener('error',coverReady,{once:true});}

  // A quick tap while media is loading stays on the visible invitation. It is
  // replayed once after both controllers are ready, not a jump to an empty page.
  entry?.addEventListener('click',event=>{
    if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||(event.button!==undefined&&event.button!==0))return;
    if(staticOnly||window.WeddingCameraStory?.played||window.WeddingCameraStory?.ready)return;
    event.preventDefault();pendingTap=true;entry.setAttribute('aria-busy','true');release();
  });
  function resumeTap(fallback=false){
    staticOnly=staticOnly||fallback;
    entry?.removeAttribute('aria-busy');
    if(!pendingTap)return;
    pendingTap=false;
    // Let readiness/decode listeners finish configuring the page-turn geometry.
    frame(()=>entry?.click());
  }
  document.addEventListener('camera-assets-ready',()=>resumeTap());
  document.addEventListener('camera-story-complete',()=>resumeTap(true));

  let fonts=false;
  function activateLater(image){
    activate(image);root.classList.add('later-media-ready');
    if(fonts)return;fonts=true;
    const link=document.createElement('link');link.rel='stylesheet';
    link.href='https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500;600&display=swap';
    document.head.appendChild(link);
  }
  if(window.IntersectionObserver){
    const observer=new window.IntersectionObserver(entries=>{
      for(const item of entries)if(item.isIntersecting&&released){activateLater(item.target);observer.unobserve(item.target);}
    },{rootMargin:'320px 0px'});
    ready.then(()=>{for(const image of later)observer.observe(image);});
  }else{
    const check=()=>{if(released)for(const image of later)if(image.getBoundingClientRect().top<window.innerHeight+320)activateLater(image);};
    window.addEventListener('scroll',check,{passive:true});ready.then(check);
  }
})();
