/* Render layered raster limbs; no new character artwork is drawn in code. */
(function(scope){
  'use strict';
  // Pixel rectangles in the generated 1774×887 atlas. Alpha-matted source
  // keeps identical coordinates so every joint has one stable origin.
  const crops={body0:[90,8,340,505],body1:[477,4,461,542],
    arm0L:[1050,191,176,291],arm0R:[1454,191,179,291],
    legL:[179,553,162,306],legR:[620,553,164,306],
    arm1L:[1036,561,158,287],arm1R:[1460,561,166,287]};
  function create(canvas,image,math){
    if(!canvas||!canvas.getContext)return null;
    let ctx;try{ctx=canvas.getContext('2d',{alpha:true});}catch(_){return null;}
    if(!ctx)return null;
    let width=0,height=0;
    function part(name,x,y,w,h){ctx.drawImage(image,...crops[name],x,y,w,h);}
    function limb(name,x,y,angle,w,h){
      ctx.save();ctx.translate(x,y);ctx.rotate(angle*Math.PI/180);
      part(name,-w/2,-10,w,h);ctx.restore();
    }
    function clear(){ctx.clearRect(0,0,width,height);}
    function paint(state,g){
      if(width!==g.viewportWidth||height!==g.height){
        width=g.viewportWidth;height=g.height;
        const dpr=Math.min(scope.devicePixelRatio||1,1.75,Math.sqrt(1800000/(width*height)));
        canvas.width=Math.ceil(width*dpr);canvas.height=Math.ceil(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
      }
      clear();
      state.actors.forEach(a=>{
        if(a.opacity<=0)return;
        const l=math.layouts[a.index];
        ctx.save();ctx.globalAlpha=a.opacity;ctx.translate(a.x,a.y);ctx.scale(a.scale,a.scale);ctx.rotate(a.lean*Math.PI/180);
        if(a.index===0){
          l.legs.forEach((box,i)=>{ctx.save();ctx.translate(box[0]+box[2]/2,box[1]);ctx.rotate((i?-a.kick:a.kick)*Math.PI/180);part(i?'legR':'legL',-box[2]/2,0,box[2],box[3]);ctx.restore();});
        }
        // Sleeve roots overlap the body; cuffs and hands stay in front.
        part('body'+a.index,...l.body);
        limb('arm'+a.index+'L',l.left.x,l.left.y,a.freeArm,43,88);
        limb('arm'+a.index+'R',l.shoulder.x,l.shoulder.y,a.arm,43,88);
        ctx.restore();
      });
    }
    return {paint,clear};
  }
  scope.WeddingCharacterRig={create,crops};
})(typeof window==='object'?window:globalThis);
