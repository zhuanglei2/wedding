(() => {
  'use strict';
  const section=document.getElementById('wedding-invitation');
  if(!section)return;
  let loaded=false;
  function load(){
    if(loaded)return;loaded=true;
    document.documentElement.classList.add('invite-media-ready','later-media-ready');
    section.querySelectorAll('[data-media-group="invite"]').forEach(image=>{
      const fallback=image.getAttribute('data-src');
      if(fallback)image.addEventListener('error',()=>{image.removeAttribute('srcset');image.src=fallback;},{once:true});
      const sizes=image.getAttribute('data-media-sizes'),srcset=image.getAttribute('data-media-srcset');
      if(sizes)image.sizes=sizes;
      if(srcset)image.srcset=srcset;
      image.loading='eager';image.src=image.getAttribute('data-media-src');
    });
  }
  function observe(){
    if('IntersectionObserver' in window){
      const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){load();observer.disconnect();}},{rootMargin:'400px 0px'});
      observer.observe(section);
    }else{
      const check=()=>{if(section.getBoundingClientRect().top<window.innerHeight+400){load();window.removeEventListener('scroll',check);window.removeEventListener('resize',check);}};
      window.addEventListener('scroll',check,{passive:true});window.addEventListener('resize',check,{passive:true});check();
    }
  }
  if(window.WeddingMedia?.ready)window.WeddingMedia.ready.then(observe);else observe();
})();
