/* V10.211: first-page images decoded and painted, not the whole lazy gallery. */
(()=>{'use strict';
 const images=[...document.querySelectorAll('.image-cover picture img')];
 let ready=false,failed=false,decoded=false,frame=0;
 window.WeddingCoverReady={get ready(){return ready},get failed(){return failed}};
 const raf=callback=>window.requestAnimationFrame?window.requestAnimationFrame(callback):setTimeout(callback,0);
 const cancel=id=>window.cancelAnimationFrame?window.cancelAnimationFrame(id):clearTimeout(id);
 function afterPaint(){
  if(ready||failed||!decoded||document.hidden||frame)return;
  frame=raf(()=>{frame=raf(()=>{
   frame=0;if(document.hidden)return;
   ready=true;document.dispatchEvent(new Event('wedding-cover-ready'));
  })});
 }
 function waitImage(image){
  return new Promise((resolve,reject)=>{
   const cleanup=()=>{image.removeEventListener('load',loaded);image.removeEventListener('error',error)};
   function error(){cleanup();reject(new Error('Cover image unavailable'))}
   function loaded(){
    cleanup();if(!image.naturalWidth){reject(new Error('Cover image unavailable'));return;}
    if(typeof image.decode!=='function'){resolve();return;}
    try{Promise.resolve(image.decode()).then(resolve,reject)}catch(error){reject(error)}
   }
   if(image.complete)loaded();
   else{image.addEventListener('load',loaded,{once:true});image.addEventListener('error',error,{once:true});}
  });
 }
 function fail(){failed=true;document.dispatchEvent(new Event('wedding-cover-error'))}
 document.addEventListener('visibilitychange',()=>{
  if(document.hidden){if(frame)cancel(frame);frame=0;}
  else afterPaint();
 });
 window.addEventListener('pageshow',afterPaint);
 if(!images.length){fail();return;}
 Promise.all(images.map(waitImage)).then(()=>{decoded=true;afterPaint()},fail);
})();
