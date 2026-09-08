/* Source-image articulation: separate generated perspective/eyelid poses.
   Display clipping and joint transforms never rewrite the original bitmaps. */
(function(scope){
  'use strict';
  const crops={body0:[90,8,340,505],body1:[477,4,461,542],
    arm0L:[1050,191,176,291],arm0R:[1454,191,179,291],
    legL:[179,553,162,306],legR:[620,553,164,306],
    arm1L:[1036,561,158,287],arm1R:[1460,561,166,287]};
  // The service returned opaque checkerboard despite requesting alpha. These
  // geometric display masks follow the silhouettes, without color-keying pale
  // fabric or changing pixels. Coordinates are in a 362-square atlas cell.
  const outlines=[
    [
      [[108,21],[157,14],[215,23],[284,48],[305,76],[303,118],[333,165],[353,194],[344,211],[311,218],[305,268],[279,312],[239,334],[184,344],[128,333],[82,310],[60,276],[57,221],[64,166],[25,152],[18,138],[25,126],[73,120],[90,90],[94,50]],
      [[53,74],[113,29],[193,15],[263,18],[280,38],[281,89],[300,121],[335,123],[347,137],[334,156],[299,176],[305,216],[301,266],[280,307],[236,332],[180,343],[124,329],[84,305],[67,258],[59,224],[33,223],[20,211],[26,193],[41,169],[35,122]],
      [[66,22],[117,17],[190,26],[280,52],[311,84],[306,130],[333,173],[351,194],[342,213],[311,220],[300,269],[274,312],[225,337],[170,344],[117,330],[80,308],[58,267],[56,221],[66,168],[25,154],[15,138],[22,126],[57,119],[59,65]]
    ],
    [
      [[89,16],[137,35],[179,57],[208,25],[259,13],[288,53],[300,119],[281,138],[286,173],[308,212],[311,264],[287,307],[245,334],[186,347],[128,334],[87,306],[64,263],[65,217],[85,172],[88,143],[60,142],[60,94],[71,50]],
      [[91,17],[137,32],[178,56],[211,23],[258,13],[287,52],[298,120],[279,143],[290,181],[309,224],[310,265],[284,309],[240,335],[182,346],[130,332],[87,307],[66,265],[68,219],[87,173],[86,142],[61,140],[61,91],[75,48]],
      [[93,15],[138,35],[179,56],[207,22],[254,14],[281,53],[294,119],[274,143],[286,182],[304,224],[304,265],[280,309],[235,333],[178,345],[124,332],[83,306],[65,261],[69,216],[88,173],[89,142],[65,142],[65,93],[77,49]]
    ]
  ];
  function create(canvas,image,math,heads){
    if(!canvas||!canvas.getContext)return null;
    let ctx;try{ctx=canvas.getContext('2d',{alpha:true});}catch(_){return null;}
    if(!ctx)return null;
    let width=0,height=0;
    function part(name,x,y,w,h){ctx.drawImage(image,...crops[name],x,y,w,h);}
    function clear(){ctx.clearRect(0,0,width,height);}
    function outline(points){
      const last=points[points.length-1],first=points[0];
      ctx.beginPath();ctx.moveTo((last[0]+first[0])/2,(last[1]+first[1])/2);
      points.forEach((point,i)=>{const next=points[(i+1)%points.length];ctx.quadraticCurveTo(point[0],point[1],(point[0]+next[0])/2,(point[1]+next[1])/2);});
      ctx.closePath();ctx.clip();
    }
    function headPose(index,column,box,opacity){
      if(opacity<.001)return;
      const cellW=(heads.naturalWidth||heads.width)/6,cellH=(heads.naturalHeight||heads.height)/2;
      ctx.save();ctx.globalAlpha*=opacity;ctx.translate(box[0],box[1]);ctx.scale(box[2]/362,box[3]/362);
      outline(scope.WeddingHeadMasks?.[index]?.[column]||outlines[index][column%3]);
      ctx.drawImage(heads,column*cellW,index*cellH,cellW,cellH,0,0,362,362);ctx.restore();
    }
    function head(a){
      const neck=a.index===0?169:193;
      ctx.save();ctx.translate(120,neck);ctx.rotate((a.headAngle||0)*Math.PI/180);
      ctx.translate(-120+(a.headShift||0),-neck+(a.headNod||0));
      if(!heads){
        const b=math.layouts[a.index].body;ctx.beginPath();ctx.rect(b[0]-8,b[1]-8,b[2]+16,neck-b[1]+9);ctx.clip();part('body'+a.index,...b);
      }else{
        const yaw=Math.max(-1,Math.min(1,a.headYaw||0));
        const col=Math.abs(yaw)<.5?0:yaw>0?1:2;
        const shut=(a.eyeOpen??1)<.45?3:0;
        const box=a.index===0?[24,-8,192,187]:[14,-3,212,211];
        headPose(a.index,col+shut,box,1);
      }
      ctx.restore();
    }
    function body(a,l){
      const [x,y,w,h]=l.body,neck=a.index===0?165:187;
      const bottom=y+h,waist=a.index===0?225:247;
      // A small original-fur neck bridge sits BEHIND both moving head and torso.
      // It prevents head lift/tilt from exposing a red slit at the collar.
      const fur=a.index===0?[150,254,12,24]:[631,246,12,24];
      ctx.drawImage(image,...fur,105,neck-16,30,27);
      // Two continuous pieces, not many alpha-overlapping bands. The hem uses
      // one shear anchored at the waist, so mobile sampling cannot create stripes.
      ctx.save();
      if(a.index===1){ctx.beginPath();ctx.moveTo(91,neck);ctx.lineTo(149,neck);ctx.lineTo(188,207);ctx.lineTo(226,251);ctx.lineTo(280,340);ctx.lineTo(-20,340);ctx.lineTo(15,251);ctx.lineTo(54,207);ctx.closePath();ctx.clip();}
      ctx.save();ctx.beginPath();ctx.rect(x-10,neck,w+20,waist-neck+.05);ctx.clip();
      const turn=a.torsoTurn||0;ctx.translate(120,neck);ctx.transform(1-Math.abs(turn)*.055,0,turn*.045,1,0,0);ctx.translate(-120,-neck);
      part('body'+a.index,...l.body);ctx.restore();
      const shear=((a.clothLag||0)+(a.clothRipple||0))/(bottom-waist);
      ctx.save();ctx.transform(1,0,shear,1,-waist*shear,0);ctx.beginPath();ctx.rect(x-10,waist,w+20,bottom-waist);ctx.clip();part('body'+a.index,...l.body);ctx.restore();
      ctx.restore();
      head(a);
      if(a.index===1){
        ctx.save();ctx.beginPath();ctx.ellipse(133,222,43,39,0,0,Math.PI*2);ctx.clip();
        ctx.drawImage(image,641,284,168,126,87.5,184,94.8,72);ctx.restore();
      }
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
      state.actors.forEach(a=>{
        if(a.opacity<=0)return;
        const l=math.layouts[a.index];
        ctx.save();ctx.globalAlpha=a.opacity;ctx.translate(a.x,a.y);ctx.scale(a.scale,a.scale);ctx.rotate(a.lean*Math.PI/180);
        if(a.index===0)l.legs.forEach((box,i)=>{
          ctx.save();ctx.translate(box[0]+box[2]/2,box[1]);ctx.rotate(((i?-a.kick:a.kick)+(a.legFollow||0))*Math.PI/180);
          part(i?'legR':'legL',-box[2]/2,0,box[2],box[3]);ctx.restore();
        });
        body(a,l);
        limb('arm'+a.index+'L',l.left.x,l.left.y,a.freeArm,-(a.elbowBend||0));
        limb('arm'+a.index+'R',l.shoulder.x,l.shoulder.y,a.arm,a.elbowBend||0);
        ctx.restore();
      });
    }
    return {paint,clear};
  }
  scope.WeddingCharacterRig={create,crops,outlines};
})(typeof window==='object'?window:globalThis);
