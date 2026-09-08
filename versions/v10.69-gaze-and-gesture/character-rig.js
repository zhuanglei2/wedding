/* Render layered raster limbs; no new character artwork is drawn in code. */
(function(scope){
  'use strict';
  // Pixel rectangles in the generated 1774×887 atlas. Alpha-matted source
  // keeps identical coordinates so every joint has one stable origin.
  const crops={body0:[90,8,340,505],body1:[477,4,461,542],
    arm0L:[1050,191,176,291],arm0R:[1454,191,179,291],
    legL:[179,553,162,306],legR:[620,553,164,306],
    arm1L:[1036,561,158,287],arm1R:[1460,561,166,287]};
  // All eye whites, irises/highlights and skin are sampled from the existing
  // atlas. These are animated image fragments, not new face artwork or files.
  const eyes=[
    [{box:[193,211,40,51],iris:[207,217,26,37],white:[198,225,5,24],skin:[199,263,30,3]},
     {box:[264,211,40,51],iris:[279,217,25,37],white:[269,225,5,24],skin:[270,263,28,3]}],
    [{box:[667,201,40,47],iris:[670,206,24,34],white:[698,212,4,23],skin:[674,249,27,3]},
     {box:[731,200,39,47],iris:[734,206,24,34],white:[760,212,4,23],skin:[739,248,26,3]}]
  ];
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
    function oval(x,y,w,h){ctx.beginPath();ctx.ellipse(x+w/2,y+h/2,w/2,h/2,0,0,Math.PI*2);ctx.clip();}
    function faceEyes(a){
      const c=crops['body'+a.index],b=math.layouts[a.index].body;
      // Work in source-image coordinates to retain the original face proportions.
      ctx.save();ctx.translate(b[0],b[1]);ctx.scale(b[2]/c[2],b[3]/c[3]);ctx.translate(-c[0],-c[1]);
      for(const e of eyes[a.index]){
        const [x,y,w,h]=e.box,open=a.eyeOpen??1;
        ctx.save();oval(x-1,y-1,w+2,h+2);
        if(open<.999)ctx.drawImage(image,...e.skin,x-1,y-1,w+2,h+2);
        const eh=Math.max(1.4,h*open),ey=y+(h-eh)*.53;
        ctx.save();oval(x,ey,w,eh);
        ctx.drawImage(image,...e.white,x,ey,w,eh);
        // Preserve the real brown iris and its reflected highlight. Limit
        // travel within the existing eye opening; the head itself is not warped.
        const iw=e.iris[2],ih=e.iris[3]*open;
        const ix=x+(w-iw)/2+(a.gazeX||0)*4;
        const iy=ey+(eh-ih)/2+(a.gazeY||0)*2*open;
        ctx.save();oval(ix,iy,iw,Math.max(1,ih));
        ctx.drawImage(image,...e.iris,ix,iy,iw,Math.max(1,ih));ctx.restore();
        ctx.restore();
        if(open<.30){
          // A narrow sample of the original dark iris becomes the closed-eye
          // crease, so a blink reads as an eyelid rather than a vanishing eye.
          const lh=4,lx=x+w*.10,ly=y+h*.53-lh/2;
          ctx.save();ctx.globalAlpha*=Math.min(1,(.30-open)/.20);oval(lx,ly,w*.80,lh);
          ctx.drawImage(image,...e.iris,lx,ly,w*.80,lh);
          ctx.restore();
        }
        ctx.restore();
      }
      ctx.restore();
    }
    function body(a,l){
      const [x,y,w,h]=l.body;
      const neck=a.index===0?169:193;
      // Overlap at the neck avoids a transparent seam. Small head rotations,
      // unlike a rotating full-body sticker, leave shoulders/hand anchors fixed.
      ctx.save();ctx.beginPath();ctx.rect(x-8,neck-4,w+16,y+h-neck+12);ctx.clip();
      if(a.index===1){ctx.translate(120,neck);ctx.rotate((a.skirtSway||0)*Math.PI/180);ctx.translate(-120,-neck);}
      part('body'+a.index,...l.body);ctx.restore();
      ctx.save();ctx.translate(120,neck);ctx.rotate((a.headAngle||0)*Math.PI/180);ctx.translate(-120,-neck+(a.headNod||0));
      ctx.beginPath();ctx.rect(x-8,y-8,w+16,neck-y+9);ctx.clip();
      part('body'+a.index,...l.body);faceEyes(a);ctx.restore();
    }
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
        body(a,l);
        limb('arm'+a.index+'L',l.left.x,l.left.y,a.freeArm,43,88);
        limb('arm'+a.index+'R',l.shoulder.x,l.shoulder.y,a.arm,43,88);
        ctx.restore();
      });
    }
    return {paint,clear};
  }
  scope.WeddingCharacterRig={create,crops,eyes};
})(typeof window==='object'?window:globalThis);
