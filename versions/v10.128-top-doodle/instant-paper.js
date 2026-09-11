/* Flexible instant film: one cylinder sampled from the existing story clock.
   Only the supplied photograph and plain white stock enter this surface. */
(function(scope){
  'use strict';
  const COUNT=14,START=1800,END=3800,FLAT_AT=4050;
  const clamp=x=>Math.max(0,Math.min(1,x));
  const ease=x=>{x=clamp(x);return x*x*x*(x*(x*6-15)+10)};
  function feedAt(ms){
    const d=END-START,r=180,t=Math.max(0,Math.min(d,ms-START));
    const ramp=u=>u/2-r*Math.sin(Math.PI*u/r)/(2*Math.PI);
    return t<r?ramp(t)/(d-r):t>d-r?1-ramp(d-t)/(d-r):(t-r/2)/(d-r);
  }
  function bendAt(ms){
    return .46*ease(feedAt(ms)/.38)*(1-ease((ms-3650)/(FLAT_AT-3650)));
  }
  function pointAt(y,height,feed,bend){
    const s=Math.max(0,y-feed),k=bend/height;
    if(y<=feed||Math.abs(k)<1e-8)return {y,z:0,angle:0};
    const a=k*s;
    return {y:feed+Math.sin(a)/k,z:(1-Math.cos(a))/k,angle:a};
  }
  function stripsAt(height,progress,bend,count=COUNT){
    const feed=height*(1-progress),h=height/count;
    return Array.from({length:count},(_,i)=>{
      const c=pointAt((i+.5)*h,height,feed,bend);
      return {y:c.y-h/2,z:c.z,angle:c.angle,sourceY:i*h,height:h};
    });
  }
  function create(stage){
    const paper=stage?.querySelector('.instant-paper'),photo=paper?.querySelector('.camera-photo');
    if(!paper||!photo)return null;
    const image=photo.querySelector('img');
    let surface=null,bands=[],height=0,last='',curved=false;
    function prepare(stageWidth){
      if(!image?.naturalWidth)return;
      const width=(stageWidth||stage.getBoundingClientRect().width)*.34;
      const nextHeight=width*.75;
      if(surface&&Math.abs(height-nextHeight)<.01)return;
      if(surface)clear();
      height=nextHeight;
      if(!height)return;
      surface=document.createElement('div');surface.className='paper-curl';surface.setAttribute('aria-hidden','true');
      surface.style.perspective=(height*5)+'px';
      const source=image.currentSrc||image.src;
      for(let i=0;i<COUNT;i++){
        const band=document.createElement('div');band.className='instant-film-strip';
        band.style.height=(height/COUNT+.45)+'px';
        const face=document.createElement('div');face.className='instant-film-face';face.style.height=height+'px';
        face.style.transform='translateY('+(-i*height/COUNT)+'px)';
        const photoWindow=document.createElement('div');photoWindow.className='camera-photo';
        const copy=document.createElement('img');copy.alt='';copy.src=source;copy.width=image.naturalWidth;copy.height=image.naturalHeight;
        photoWindow.appendChild(copy);face.appendChild(photoWindow);band.appendChild(face);surface.appendChild(band);bands.push(band);
      }
      paper.appendChild(surface);
    }
    function paint(state){
      const bend=state.paperBend||0,p=state.print;
      const on=!!surface&&p>0&&bend>.00005;
      if(on!==curved){paper.classList.toggle('paper-is-curved',on);curved=on;}
      if(!on){last='';return;}
      const signature=p.toFixed(6)+'/'+bend.toFixed(6);if(signature===last)return;last=signature;
      surface.style.perspectiveOrigin='50% '+(height*(1-p))+'px';
      const rows=stripsAt(height,p,bend);
      for(let i=0;i<COUNT;i++){
        const row=rows[i],band=bands[i];
        band.style.transform='translate3d(0,'+row.y.toFixed(4)+'px,'+row.z.toFixed(4)+'px) rotateX('+row.angle.toFixed(6)+'rad)';
        // A restrained change of reflection makes the bend legible, never a flash.
        band.style.setProperty('--paper-shade',(Math.sin(row.angle)*.14).toFixed(4));
      }
    }
    function clear(){
      paper.classList.remove('paper-is-curved');curved=false;last='';
      surface?.remove();surface=null;bands=[];
    }
    return {prepare,paint,clear};
  }
  const api={COUNT,START,END,FLAT_AT,feedAt,bendAt,pointAt,stripsAt,create};
  if(typeof module==='object'&&module.exports)module.exports=api;else scope.WeddingInstantPaper=api;
})(typeof window==='object'?window:globalThis);
