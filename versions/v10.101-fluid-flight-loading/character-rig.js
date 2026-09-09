/* Keep original head, neck, collar and upper garment as ONE connected image.
   Only eye fragments, arms, legs and lower cloth are articulated independently. */
(function(scope){
  'use strict';
  const crops={body0:[90,8,340,505],body1:[477,4,461,542],
    arm0L:[1050,191,176,291],arm0R:[1454,191,179,291],
    legL:[179,553,162,306],legR:[620,553,164,306],
    arm1L:[1036,561,158,287],arm1R:[1460,561,166,287]};
  const eyes=[
    [{box:[193,211,40,51],iris:[207,217,26,37],white:[198,225,4,20]},
     {box:[264,211,40,51],iris:[279,217,25,37],white:[269,225,4,20]}],
    [{box:[667,201,40,47],iris:[670,206,24,34],white:[698,212,3,20]},
     {box:[731,200,39,47],iris:[734,206,24,34],white:[760,212,3,20]}]
  ];
  // Only the small curved eyelid fragments from the expression atlas are used.
  // The mismatched replacement heads are never drawn.
  const lids=[[[0,0,40,12],[40,0,39,11]],[[0,12,39,10],[40,12,39,11]]];
  const skins=[[241,195,6,4],[715,188,6,4]];
  function create(canvas,image,math,expressions){
    if(!canvas||!canvas.getContext)return null;
    let ctx;try{ctx=canvas.getContext('2d',{alpha:true});}catch(_){return null;}
    if(!ctx)return null;
    let width=0,height=0;
    function part(name,x,y,w,h){ctx.drawImage(image,...crops[name],x,y,w,h);}
    function clear(){ctx.clearRect(0,0,width,height);}
    function oval(x,y,w,h){ctx.beginPath();ctx.ellipse(x+w/2,y+h/2,w/2,h/2,0,0,Math.PI*2);ctx.clip();}
    function gaze(a){
      const c=crops['body'+a.index],b=math.layouts[a.index].body;
      ctx.save();ctx.translate(b[0],b[1]);ctx.scale(b[2]/c[2],b[3]/c[3]);ctx.translate(-c[0],-c[1]);
      for(const [i,e] of eyes[a.index].entries()){
        const [x,y,w,h]=e.box,open=a.eyeOpen??1;
        ctx.save();oval(x,y,w,h);
        ctx.drawImage(image,...skins[a.index],x,y,w,h);
        const oh=Math.max(2,h*open),top=y+(h-oh)*.5;
        ctx.save();oval(x,top,w,oh);ctx.drawImage(image,...e.white,x,top,w,oh);
        const iw=e.iris[2],ih=e.iris[3]*open;
        const gx=Math.max(-1,Math.min(1,(a.gazeX||0)/.85)),gy=Math.max(-1,Math.min(1,(a.gazeY||0)/.65));
        const ix=x+(w-iw)/2+gx*(w-iw)*.44;
        const iy=top+(oh-ih)/2+gy*(h-e.iris[3])*.4*open;
        ctx.save();oval(ix,iy,iw,Math.max(1,ih));
        ctx.drawImage(image,...e.iris,ix,iy,iw,Math.max(1,ih));ctx.restore();ctx.restore();
        if(open<.30&&expressions){
          const lid=lids[a.index][i],lw=w*.86,lh=lw*lid[3]/lid[2];
          ctx.save();ctx.globalAlpha*=Math.min(1,(.30-open)/.18);
          ctx.drawImage(expressions,...lid,x+(w-lw)/2,y+h*.53-lh/2,lw,lh);ctx.restore();
        }
        ctx.restore();
      }
      ctx.restore();
    }
    function limb(name,x,y,angle,bend){
      ctx.save();ctx.translate(x,y);ctx.rotate(angle*Math.PI/180);
      const w=43,h=88;
      for(const [start,end,shear,shift] of [[-10,0,0,0],[0,32.5,bend/32.5,0],[32.5,65,-bend/32.5,bend*2],[65,78,0,0]]){
        ctx.save();ctx.transform(1,0,shear,1,shift,0);ctx.beginPath();ctx.rect(-w/2-1,start,w+2,end-start+.02);ctx.clip();part(name,-w/2,-10,w,h);ctx.restore();
      }
      ctx.restore();
    }
    function paint(state,g){
      if(width!==g.viewportWidth||height!==g.height){
        width=g.viewportWidth;height=g.height;
        const dpr=Math.min(scope.devicePixelRatio||1,1.75,Math.sqrt(1800000/(width*height)));
        canvas.width=Math.ceil(width*dpr);canvas.height=Math.ceil(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
      }
      clear();
      for(const a of state.actors){
        if(a.opacity<=0)continue;
        const l=math.layouts[a.index],b=l.body,waist=math.waist(a.index),bottom=b[1]+b[3];
        ctx.save();ctx.globalAlpha=a.opacity;ctx.translate(a.x,a.y);ctx.scale(a.scale,a.scale);ctx.rotate(a.lean*Math.PI/180);
        if(a.index===0)l.legs.forEach((box,i)=>{
          ctx.save();ctx.translate(box[0]+box[2]/2,box[1]);ctx.rotate(((i?-a.kick:a.kick)+(a.legFollow||0))*Math.PI/180);
          part(i?'legR':'legL',-box[2]/2,0,box[2],box[3]);ctx.restore();
        });
        // Behind the intact upper garment, overlap the waist (never the neck).
        const shear=((a.clothLag||0)+(a.clothRipple||0))/Math.max(1,bottom-waist);
        ctx.save();ctx.transform(1,0,shear,1,-waist*shear,0);ctx.beginPath();ctx.rect(b[0]-20,waist-16,b[2]+40,bottom-waist+16);ctx.clip();part('body'+a.index,...b);ctx.restore();
        // One unbroken upper-body layer includes head, necklace, collar, veil
        // and bouquet. Spine tilt is shared by shoulders and arms as well.
        ctx.save();ctx.translate(120,waist);ctx.rotate((a.spineAngle||0)*Math.PI/180);ctx.translate(-120,-waist);
        ctx.save();ctx.beginPath();ctx.rect(b[0]-10,b[1]-10,b[2]+20,waist+8-b[1]+10);ctx.clip();part('body'+a.index,...b);gaze(a);ctx.restore();
        limb('arm'+a.index+'L',l.left.x,l.left.y,a.freeArm,-(a.elbowBend||0));
        limb('arm'+a.index+'R',l.shoulder.x,l.shoulder.y,a.arm,a.elbowBend||0);
        ctx.restore();ctx.restore();
      }
    }
    return {paint,clear};
  }
  scope.WeddingCharacterRig={create,crops,eyes,lids};
})(typeof window==='object'?window:globalThis);
