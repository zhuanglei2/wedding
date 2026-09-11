/* Extend only the blank lower quarter of the existing paper bitmap.
   No new image, canvas, layout height, animation clock or source-photo change. */
(() => {
  'use strict';
  const pages=[...document.querySelectorAll('.paper-page')].map(page=>({
    page,art:page.querySelector('.reference-art'),signature:''
  })).filter(item=>item.art);
  let queued=false;
  function refresh(){
    queued=false;
    const updates=[];
    for(const item of pages){
      const {page,art}=item,width=art.offsetWidth,height=art.offsetHeight;
      if(!width||!height||!page.clientHeight)continue;
      const gap=Math.max(0,page.clientHeight-art.offsetTop-height);
      const blend=gap>0?Math.min(24,height*.02):0;
      const tail=gap+blend;
      // The sampled range must stay within source y=1152..1536, safely below
      // the camera. Uniform scaling also guarantees full-width coverage.
      const sourceHeight=Math.max(width*1.5,height,tail*4);
      const signature=[tail,blend,sourceHeight].join('/');
      if(signature!==item.signature)updates.push({item,tail,blend,sourceHeight,signature});
    }
    // Separate reads from writes; these properties affect paint only.
    for(const {item,tail,blend,sourceHeight,signature} of updates){
      item.page.style.setProperty('--paper-tail-height',tail+'px');
      item.page.style.setProperty('--paper-tail-blend',blend+'px');
      item.page.style.setProperty('--paper-tail-source-height',sourceHeight+'px');
      item.page.classList.add('paper-tail-ready');
      item.signature=signature;
    }
  }
  function schedule(){
    if(queued)return;queued=true;
    window.requestAnimationFrame?window.requestAnimationFrame(refresh):setTimeout(refresh,0);
  }
  refresh();
  if(window.ResizeObserver){
    const observer=new window.ResizeObserver(schedule);
    for(const {page,art} of pages){observer.observe(page);observer.observe(art);}
  }
  window.addEventListener('resize',schedule,{passive:true});
  for(const event of ['camera-media-released','camera-assets-ready','camera-story-complete']){
    document.addEventListener(event,schedule);
  }
})();
