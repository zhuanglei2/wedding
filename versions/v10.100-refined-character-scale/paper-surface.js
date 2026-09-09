(function(scope){
  'use strict';
  function create(container,coverImage,count){
    const fronts=[],backs=[],strips=[];
    for(let i=0;i<count;i++){
      const strip=document.createElement('div');strip.className='paper-strip';
      const front=document.createElement('div');front.className='paper-front';
      const back=document.createElement('div');back.className='paper-back';
      const img=document.createElement('img');img.src=coverImage.currentSrc||coverImage.src;img.alt='';img.decoding='async';
      front.appendChild(img);strip.appendChild(front);strip.appendChild(back);container.appendChild(strip);
      fronts.push(img);backs.push(back);strips.push(strip);
    }
    return {
      images:fronts,
      configure(g){
        container.style.perspective=g.width*12+'px';
        strips.forEach((strip,i)=>{
          strip.style.width=g.width/count+.6+'px';fronts[i].style.width=g.width+'px';fronts[i].style.left=-i*g.width/count+'px';
          // One gradient across the whole reverse face, not a repeated stripe.
          backs[i].style.backgroundSize=g.width+'px 100%';
          backs[i].style.backgroundPosition=-(count-1-i)*g.width/count+'px 0';
        });
      },
      paint(state){
        container.style.opacity=state.p>0&&state.p<1?'1':'0';
        state.strips.forEach((s,i)=>{
          strips[i].style.transform=`translate3d(${s.x}px,0,${s.z}px) rotateY(${s.angle}deg)`;
          strips[i].style.setProperty('--strip-shade',s.shade);
          strips[i].style.setProperty('--strip-light',s.light);
          strips[i].style.setProperty('--back-shade',s.backShade);
        });
      },
      clear(){container.style.opacity='0';}
    };
  }
  scope.WeddingPaperSurface={create};
})(typeof window==='object'?window:globalThis);
