/* Page-specific WOFF2 preserves original outlines; still load below the fold. */
(()=>{'use strict';
 const page=document.querySelector('#celebration');if(!page||!window.FontFace)return;
 let requested=false;
 function load(){
  if(requested)return;requested=true;
  const face=new FontFace('AboutHand','url("media/timeline-handwriting.woff2")',{weight:'400',style:'normal',display:'swap'});
  face.load().then(font=>{document.fonts.add(font);document.dispatchEvent(new Event('story-handwriting-ready'))},()=>{requested=false});
 }
 function observe(){
  if(window.IntersectionObserver){const watcher=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){load();watcher.disconnect()}},{rootMargin:'180px 0px'});watcher.observe(page)}
  else{const check=()=>{const r=page.getBoundingClientRect();if(r.top<innerHeight+180&&r.bottom>0){load();window.removeEventListener('scroll',check)}};window.addEventListener('scroll',check,{passive:true});check()}
 }
 if(window.WeddingMedia)window.WeddingMedia.ready.then(observe);else observe();
})();
