/* V10.128: ordered deferred runtime bundle. */
;
/* Source: ../v10.104-cover-first-paint/page-turn-math.js */
/* One seekable choreography: approach -> grip/weight -> pull -> free flight.
   The actors deliberately release while visible; the paper keeps its momentum. */
(function(scope){
  'use strict';
  const clamp=x=>Math.max(0,Math.min(1,x));
  const ease=x=>{x=clamp(x);return x*x*(3-2*x);};
  const smooth=x=>{x=clamp(x);return x*x*x*(x*(x*6-15)+10);};
  const mix=(a,b,t)=>a+(b-a)*t,rad=x=>x*Math.PI/180;
  const rotate=(x,y,a)=>({x:x*Math.cos(rad(a))-y*Math.sin(rad(a)),y:x*Math.sin(rad(a))+y*Math.cos(rad(a))});
  const DURATION=6800,SEGMENTS=24,DEPART_AT=.85,JOIN_AT=.79;
  // Keep the pull/wait timings; give the final shared flight room to breathe.
  // Both sides of this clock join have exactly the same first derivative.
  function progressAt(ms){
    ms=Math.max(0,ms);const split=5600*JOIN_AT;
    if(ms<=split)return ms/5600;
    return hermite(JOIN_AT,1,1/5600,1/12000,(ms-split)/(DURATION-split),DURATION-split);
  }
  function departureOffset(p,g){
    const u=clamp((p-DEPART_AT)/(1-DEPART_AT)),t=u*u*(2-u);
    return bezier({x:0,y:0},{x:-g.width*.025,y:-g.height*.18},
      {x:g.width*.36,y:-g.height*.62},{x:g.width*.88,y:-g.height*.86-g.actorWidth},t);
  }
  const releaseAt=i=>.60+i*.04;
  // V10.100: 20% smaller than V10.71. All grips, meeting points and
  // shared hand positions derive from this size, not a canvas-only zoom.
  const actorWidth=width=>Math.min(150,Math.max(95,width*.28))*.68;
  const waist=index=>index===0?225:247;
  const bezier=(a,b,c,d,t)=>{
    const u=1-t;
    return{x:u*u*u*a.x+3*u*u*t*b.x+3*u*t*t*c.x+t*t*t*d.x,y:u*u*u*a.y+3*u*u*t*b.y+3*u*t*t*c.y+t*t*t*d.y};
  };
  function hermite(a,b,va,vb,t,span){
    t=clamp(t);const t2=t*t,t3=t2*t;
    return(2*t3-3*t2+1)*a+(t3-2*t2+t)*va*span+(-2*t3+3*t2)*b+(t3-t2)*vb*span;
  }
  function paper(p,g){
    // Velocity is continuous at release: the page is not tied to the actors
    // after letting go and doesn't stop mid-turn when they change direction.
    const theta=p<=.34?0:p<.65?hermite(0,62,0,400,(p-.34)/.31,.31):hermite(62,158,400,0,(p-.65)/.25,.25);
    const pull=theta/158,curl=30*Math.sin(pull*Math.PI);
    // Weak perspective prevents the approaching free edge from swelling
    // outside the viewport, while preserving the outward turn and grip.
    const length=g.width/SEGMENTS,depth=g.width*12;
    let x=0,z=0;const strips=[];
    for(let i=0;i<SEGMENTS;i++){
      // A distributed bend, not twelve flat panels rotating as a rigid door.
      const angle=-(theta+curl*(.5-.5*Math.cos((i+.5)/SEGMENTS*Math.PI)))||0;
      const face=Math.abs(rad(angle));
      strips.push({x,z,angle,width:length+.6,
        shade:.20*(1-Math.max(0,Math.cos(face))),
        light:.09*Math.max(0,Math.sin(face))*Math.max(0,Math.cos(face)),
        backShade:.12*Math.max(0,Math.sin(face))});
      x+=length*Math.cos(rad(angle));z-=length*Math.sin(rad(angle));
    }
    return{strips,depth,edge:g.left+x/(1-z/depth),z,pull,angle:-theta||0};
  }
  const layouts=[
    {shoulder:{x:184,y:181},left:{x:64,y:181},hand:65,body:[30,0,180,263],legs:[[73,237,60,99],[131,237,60,99]]},
    {shoulder:{x:184,y:205},left:{x:65,y:205},hand:65,body:[-5,24,260,310]}
  ];
  function heldPose(p,g,sheet,index){
    const arrivalEnd=.24+index*.015;
    const flight=1-ease(p/arrivalEnd),reach=ease((p-.21)/.09);
    const effort=ease((p-.34)/.31);
    const press=Math.sin(clamp((p-.28)/.06)*Math.PI);
    const scale=g.actorWidth/240*(1+.12*clamp(sheet.z/g.width)*reach)*(1-.045*press);
    const lean=-20*flight+4*press-22*effort;
    const arm=mix(-18,-86,reach)-10*effort;
    const freeArm=12+8*flight+12*effort;
    const kick=7*Math.sin(clamp(p/arrivalEnd)*Math.PI)*flight-6*effort;
    const l=layouts[index],tip=rotate(0,l.hand,arm),localGrip=rotate(l.shoulder.x+tip.x,l.shoulder.y+tip.y,lean);
    const baseY=g.height*(index===0?.47:.69);
    const target={x:sheet.edge,y:g.height*.60+(baseY-g.height*.60)/(1-sheet.z/sheet.depth)};
    return{x:target.x-localGrip.x*scale,y:target.y-localGrip.y*scale,scale,lean,arm,freeArm,kick,target,grip:reach,index};
  }
  function actor(p,g,sheet,index){
    const arrivalEnd=.24+index*.015,release=releaseAt(index);
    let a=heldPose(p,g,sheet,index);
    if(p<arrivalEnd){
      const end=heldPose(arrivalEnd,g,paper(arrivalEnd,g),index);
      const t=smooth(p/arrivalEnd);
      // Separate approach lanes: the lower target must not overtake through
      // the other character's face while the pair is becoming visible.
      const from={x:g.left+g.width*(index===0?.76:.35),y:-g.actorWidth*1.6};
      const c1={x:g.left+g.width*(.24-index*.08),y:g.height*(.12+index*.12)};
      const c2={x:end.x-g.width*.13,y:end.y-g.height*.12};
      const point=bezier(from,c1,c2,end,t);
      // Follow the moving reach pose as we settle, matching its velocity at
      // contact instead of stopping the path and snapping into a new pose.
      a.x=point.x+(a.x-end.x)*t;a.y=point.y+(a.y-end.y)*t;a.grip=0;
    }
    if(p>release){
      const at=heldPose(release,g,paper(release,g),index);
      const meetAt=index===0?.71:.79,join=ease((p-release)/(meetAt-release));
      const center=rotate(120,170,at.lean);
      const from={x:at.x+center.x*at.scale,y:at.y+center.y*at.scale};
      const meet={x:g.left+g.width*.5+(index===0?-.58:.58)*g.actorWidth,y:g.height*(.43+index*.03)};
      // Keep the release velocity instead of easing from a sudden standstill.
      // The outgoing tangent follows the paper, then curves into a zero-speed wait.
      const eps=.0001,prior=heldPose(release-eps,g,paper(release-eps,g),index);
      const pc=rotate(120,170,prior.lean);
      const velocity={x:(from.x-prior.x-pc.x*prior.scale)/eps,y:(from.y-prior.y-pc.y*prior.scale)/eps};
      const span=meetAt-release;
      const point=bezier(from,{x:from.x+velocity.x*span/3,y:from.y+velocity.y*span/3},meet,meet,clamp((p-release)/span));
      // Boy arrives first and hovers ~400 ms, while the girl catches up.
      // Both then use exactly the same clock and translation to leave together.
      const departure=clamp((p-DEPART_AT)/(1-DEPART_AT)),offset=departureOffset(p,g);
      const hover=p>meetAt&&p<DEPART_AT?2*Math.sin((p-meetAt)/(DEPART_AT-meetAt)*Math.PI)**2:0;
      const bank=ease(departure/.65);
      a={...at,grip:0,lean:mix(mix(at.lean,-3,join),27,bank),
        arm:mix(mix(at.arm,-12,join),8,bank),freeArm:mix(mix(at.freeArm,12,join),-8,bank),
        kick:mix(at.kick,0,join)+4*Math.sin(departure*Math.PI)*bank,
        scale:mix(mix(at.scale,g.actorWidth/240,join),g.actorWidth/240*.78,ease(departure))};
      const local=rotate(120,170,a.lean);
      a.x=point.x+offset.x-local.x*a.scale;
      a.y=point.y+offset.y+hover-local.y*a.scale;
    }
    const l=layouts[index],tip=rotate(0,l.hand,a.arm),hand=rotate(l.shoulder.x+tip.x,l.shoulder.y+tip.y,a.lean);
    const foot=rotate(120,330,a.lean);
    // Only fade at the very end, once the flight has visibly left the frame.
    const opacity=p<=0||p>=1?0:1-ease((p-.96)/.04);
    return{...a,opacity,hand:{x:a.x+hand.x*a.scale,y:a.y+hand.y*a.scale},emitter:{x:a.x+foot.x*a.scale,y:a.y+foot.y*a.scale}};
  }
  function handPoint(a,left=false){
    const l=layouts[a.index],shoulder=left?l.left:l.shoulder;
    const tip=rotate(0,l.hand,left?a.freeArm:a.arm);
    const torso=rotate(shoulder.x+tip.x-120,shoulder.y+tip.y-waist(a.index),a.spineAngle||0);
    const point=rotate(torso.x+120,torso.y+waist(a.index),a.lean);
    return{x:a.x+point.x*a.scale,y:a.y+point.y*a.scale};
  }
  function holdHands(p,g,actors){
    if(p<=.69)return actors;
    const reach=ease((p-.69)/.09),hold=ease((p-.735)/(JOIN_AT-.735));
    const departure=clamp((p-DEPART_AT)/(1-DEPART_AT));
    const waiting=clamp((p-.70)/.09),breath=Math.sin(waiting*Math.PI);
    const bank=ease(departure/.75),settle=Math.sin(departure*Math.PI)*Math.exp(-departure*3);
    // A single physical contact point drives both hands. The body may lean,
    // kick and bob around it, but no hand separates after the clasp.
    const offset=departureOffset(p,g);
    const anchor={x:g.left+g.width*.5+offset.x,
      y:g.height*.465+offset.y+3*Math.sin(clamp((p-JOIN_AT)/.06)*Math.PI)**2};
    return actors.map(a=>{
      const center=rotate(120,170,a.lean);
      const cx=a.x+center.x*a.scale,cy=a.y+center.y*a.scale;
      const boy=a.index===0;
      a.lean=mix(a.lean,mix(boy?5:-4,boy?27:23,bank)+2*settle,reach);
      if(boy){
        a.arm=mix(a.arm,-86+2*settle,reach);
        a.freeArm=mix(a.freeArm,12+5*breath-14*bank,reach);
        a.kick+=reach*(3*breath+3*settle);
      }else{
        a.freeArm=mix(a.freeArm,86-2*settle,reach);
        a.arm=mix(a.arm,-8-12*bank,reach);
      }
      const local=rotate(120,170,a.lean);
      a.x=cx-local.x*a.scale;
      a.y=cy-local.y*a.scale-(boy?5:3)*breath*reach;
      const contact=handPoint(a,!boy);
      a.x+=(anchor.x-contact.x)*hold;
      a.y+=(anchor.y-contact.y)*hold;
      a.hand=handPoint(a);a.leftHand=handPoint(a,true);
      a.joinedHand=boy?a.hand:a.leftHand;a.handhold=hold;
      const foot=rotate(120,330,a.lean);
      a.emitter={x:a.x+foot.x*a.scale,y:a.y+foot.y*a.scale};
      return a;
    });
  }
  function expressions(p,g,actors){
    // Gaze leads the reaching gesture; all expressions are sampled from the
    // same timeline, with two short, staggered blinks, never a free-running loop.
    const heads=actors.map(a=>{
      const point=rotate(120,a.index===0?118:148,a.lean);
      return{x:a.x+point.x*a.scale,y:a.y+point.y*a.scale};
    });
    const blink=(at,duration=.032)=>{
      const u=clamp((p-at)/duration);
      return Math.sin(u*Math.PI)**2;
    };
    return actors.map((a,i)=>{
      const eye=heads[i],partner=heads[1-i];
      const attention=ease((p-(i===0?.610:.651))/.025);
      const away=ease((p-.832)/.055),eyeAway=ease((p-.815)/.024);
      let target={x:mix(a.target.x,partner.x,attention),y:mix(a.target.y,partner.y,attention)};
      target={x:mix(target.x,g.left+g.width*1.25,eyeAway),y:mix(target.y,-g.height*.35,eyeAway)};
      const local=rotate(target.x-eye.x,target.y-eye.y,-a.lean);
      const length=Math.max(1,Math.hypot(local.x,local.y));
      a.gazeX=local.x/length*.85;a.gazeY=local.y/length*.65;
      a.eyeOpen=1-.96*Math.max(blink(i===0?.244:.278),blink(i===0?.6695:.7105),blink(i===0?.812:.835,i===0?.032:.050));
      // Readable key poses, not a larger perpetual wiggle. The glance starts
      // before the reach, the nod resolves into a held clasp, then lift leads flight.
      const turn=ease((p-(i===0?.648:.689))/.075);
      const acknowledgement=Math.sin(clamp((p-(i===0?.779:.794))/.055)*Math.PI);
      const launch=ease((p-.838)/.10),pull=Math.sin(clamp((p-.34)/.30)*Math.PI);
      a.headYaw=mix(mix(0,i===0?1:-1,turn),1,away);
      a.headAngle=mix((i===0?4:-4)*turn+(i===0?2:-2)*acknowledgement,-8,launch)-2*pull;
      a.headNod=2.5*acknowledgement-2.5*launch;
      a.headShift=1.5*a.headYaw;
      const arrivalEnd=.24+i*.015;
      const arrival=clamp(p/arrivalEnd),arrivalLag=clamp((p-.035)/arrivalEnd);
      const arrivalSway=Math.sin(arrival*Math.PI)**2*Math.sin(arrival*Math.PI*1.4);
      a.spineAngle=a.headAngle*.60*ease((p-releaseAt(i))/.06)-5*arrivalSway;
      a.freeArm+=8*arrivalSway;
      // Cloth follows a delayed acceleration envelope; shoulders and held
      // hands stay fixed. Hem motion increases with distance from the waist.
      const lagLaunch=ease((p-.865)/.105);
      const settle=Math.sin(clamp((p-.65)/.15)*Math.PI);
      const clothArrival=p<.32?Math.sin(arrivalLag*Math.PI)**2*(1-ease((p-.24)/.08)):0;
      a.clothLag=8*lagLaunch+3*pull-2*settle-5*clothArrival;
      a.clothRipple=1.2*Math.sin(clamp((p-.64)/.20)*Math.PI);
      a.torsoTurn=(i===0?1:-1)*turn*(1-away);
      a.elbowBend=2.5*turn*(1-launch)+1.5*pull;
      a.legFollow=7*lagLaunch-2*settle+5*clothArrival;
      a.skirtSway=i===1?a.clothLag:0;
      return a;
    });
  }
  function connectedUpperBody(p,actors){
    return actors.map(a=>{
      // Changing spine angle also changes the shoulder. Re-anchor the actual
      // rendered hand so cloth integrity cannot break paper or partner contact.
      const left=a.index===1&&a.handhold>0;
      const target=a.handhold>0?a.joinedHand:p<=releaseAt(a.index)&&a.grip>.99?a.target:null;
      if(target){const hand=handPoint(a,left),weight=a.handhold>0?a.handhold:1;a.x+=(target.x-hand.x)*weight;a.y+=(target.y-hand.y)*weight;}
      a.hand=handPoint(a);a.leftHand=handPoint(a,true);
      if(a.handhold>0)a.joinedHand=a.index===0?a.hand:a.leftHand;
      const foot=rotate(120,330,a.lean);a.emitter={x:a.x+foot.x*a.scale,y:a.y+foot.y*a.scale};
      return a;
    });
  }
  function departureGestures(p,g,actors){
    // One held hand, two responses. Author the reaction before translation,
    // then allow the free limbs and hem to lag. No detached head/neck layers.
    if(p<=.805)return actors;
    return actors.map(a=>{
      const boy=a.index===0,delay=boy?0:.024;
      const prepare=smooth((p-.805-delay)/.064);
      const fly=smooth((p-.866-delay*.5)/.090);
      const follow=smooth((p-.879-delay*.5)/.078);
      const impulse=Math.sin(Math.PI*clamp((p-.847-delay)/.110))**2;
      const recover=smooth((p-.928)/.060);
      // The boy inclines first; the girl answers through their joined hand.
      // Change the whole-body angle, not only its path, then bank into flight.
      a.lean=mix(a.lean,mix(boy?23:14,boy?48:40,fly),prepare);
      a.spineAngle=mix(a.spineAngle,boy?-6.5:-5.5,prepare);
      if(boy){
        a.arm=mix(a.arm,-61,prepare);
        a.freeArm=mix(a.freeArm,30-8*recover,follow);
      }else{
        a.freeArm=mix(a.freeArm,109,prepare);
        a.arm=mix(a.arm,25-7*recover,follow);
      }
      // A single tuck-and-extend impulse rather than looping running legs.
      a.kick=mix(a.kick,(boy?16:10)*impulse+2*follow,prepare);
      a.legFollow=mix(a.legFollow,12-4*recover,follow);
      a.elbowBend=mix(a.elbowBend,4.5-2*recover,prepare);
      // Preserve the solid collar; only the existing lower-cloth layer trails.
      a.clothLag=mix(a.clothLag,-10+3*recover,follow);
      a.clothRipple=0;
      a.skirtSway=boy?0:a.clothLag;
      const eyeLead=smooth((p-.815-delay)/.025);
      a.gazeX=mix(a.gazeX,.70,eyeLead);
      a.gazeY=mix(a.gazeY,-.62,eyeLead);
      return a;
    });
  }
  function sample(progress,g){
    const p=clamp(progress),sheet=paper(p,g),actors=[actor(p,g,sheet,0),actor(p,g,sheet,1)];
    const couple=connectedUpperBody(p,departureGestures(p,g,expressions(p,g,holdHands(p,g,actors))));
    return{p,...sheet,actors:couple,emitters:couple.map(a=>a.emitter),opacity:Math.max(...couple.map(a=>a.opacity))};
  }
  const api={sample,progressAt,departureOffset,clamp,layouts,DURATION,SEGMENTS,rotate,releaseAt,actorWidth,waist,DEPART_AT,JOIN_AT};
  if(typeof module==='object'&&module.exports)module.exports=api;else scope.WeddingPageTurn=api;
})(typeof window==='object'?window:globalThis);

;
/* Source: ../v10.112-camera-story/character-rig.js */
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
        if(a.cameraYaw){ctx.translate(120,0);ctx.scale(1-.16*Math.abs(a.cameraYaw),1);ctx.translate(-120,0);}
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

;
/* Source: ../v10.104-cover-first-paint/paper-surface.js */
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

;
/* Source: ../v10.104-cover-first-paint/star-trail.js */
/* Small finite pool; particles follow the two figures, never the pointer.
   Live-web lifecycle: after movement stops, survivors fade in under 0.9s. */
(function(scope){
  'use strict';
  const MAX=36;
  const seed=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
  function anchors(s,g){
    if(s.emitters)return s.emitters;
    const angle=s.tilt*Math.PI/180,c=Math.cos(angle),sn=Math.sin(angle);
    return [.23,.78].map(f=>{
      const dx=(f-.75)*g.actorWidth,dy=.36*g.actorHeight;
      return {x:s.x+.75*g.actorWidth+dx*c-dy*sn,y:s.y+.55*g.actorHeight+dx*sn+dy*c};
    });
  }
  class Pool{
    constructor(){this.slots=Array(MAX).fill(null);this.cursor=0;this.serial=0;this.last=null;this.carry=0;}
    clear(){this.slots.fill(null);this.last=null;this.carry=0;}
    update(s,g,time){
      if(s.p<=0||s.p>=1||s.opacity<.05){this.last=null;this.carry=0;return;}
      const points=anchors(s,g);
      if(!this.last){this.last={points,time};return;}
      const dx=points[0].x-this.last.points[0].x,dy=points[0].y-this.last.points[0].y;
      const distance=Math.hypot(dx,dy);
      // A scroll jump/resize must not draw a streak across the whole screen.
      if(distance>g.viewportWidth*.65||time-this.last.time>180){this.last={points,time};this.carry=0;return;}
      if(distance<.25) return;
      this.carry+=distance;
      const count=Math.min(6,Math.floor(this.carry/9));
      if(count) this.carry%=9;
      for(let i=1;i<=count;i++) for(let emitter=0;emitter<2;emitter++){
        const a=this.last.points[emitter],b=points[emitter],fraction=i/count;
        const x=a.x+(b.x-a.x)*fraction,y=a.y+(b.y-a.y)*fraction;
        if(x<-30||x>g.viewportWidth+30||y<-30||y>g.height+30)continue;
        const n=++this.serial;
        this.slots[this.cursor]={born:time,life:640+seed(n)*240,x,y,
          vx:(seed(n*3)-.5)*28-dx/distance*12,vy:8+seed(n*7)*18,
          radius:(n%3===0?3.7+seed(n*5)*2.7:1.1+seed(n*5)*1.2)*.8,
          star:n%3===0,spin:(seed(n*11)-.5)*1.4,angle:seed(n*13)*Math.PI,
          color:n%3===0?'#fff0bd':n%2?'#e9bd72':'#f5dba0'};
        this.cursor=(this.cursor+1)%MAX;
      }
      this.last={points,time};
    }
    sample(time){
      const result=[];
      this.slots.forEach((p,i)=>{
        if(!p)return;
        const age=(time-p.born)/p.life;
        if(age>=1){this.slots[i]=null;return;}
        if(age<0)return;
        const seconds=(time-p.born)/1000;
        result.push({...p,x:p.x+p.vx*seconds,y:p.y+p.vy*seconds+12*seconds*seconds,
          radius:p.radius*(1-.55*age),angle:p.angle+p.spin*seconds,
          opacity:Math.min(1,age/.08)*Math.pow(1-age,1.6)*.74});
      });
      return result;
    }
  }
  function create(canvas){
    if(!canvas||!canvas.getContext)return null;
    let ctx;try{ctx=canvas.getContext('2d',{alpha:true});}catch(_){return null;}
    if(!ctx)return null;
    const pool=new Pool();let frame=0,width=0,height=0,dpr=1;
    function clear(){
      if(frame)scope.cancelAnimationFrame(frame);
      frame=0;pool.clear();ctx.clearRect(0,0,width,height);
    }
    function draw(time){
      frame=0;ctx.clearRect(0,0,width,height);
      const visible=pool.sample(time);
      visible.forEach(p=>{
        ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);
        ctx.globalAlpha=p.opacity;ctx.fillStyle=p.color;
        ctx.shadowColor='#edc372';ctx.shadowBlur=p.star?5:2;
        ctx.beginPath();
        if(p.star){
          for(let i=0;i<10;i++){
            const angle=-Math.PI/2+i*Math.PI/5,r=p.radius*(i%2?.43:1);
            const x=Math.cos(angle)*r,y=Math.sin(angle)*r;
            if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
          }
          ctx.closePath();
        }else ctx.arc(0,0,p.radius,0,Math.PI*2);
        ctx.fill();ctx.restore();
      });
      if(visible.length)frame=scope.requestAnimationFrame(draw);
    }
    return {clear,update(state,g,time){
      if(width!==g.viewportWidth||height!==g.height){
        clear();width=g.viewportWidth;height=g.height;
        dpr=Math.min(scope.devicePixelRatio||1,1.75,Math.sqrt(1800000/(width*height)));
        canvas.width=Math.ceil(width*dpr);canvas.height=Math.ceil(height*dpr);
        ctx.setTransform(dpr,0,0,dpr,0,0);
      }
      pool.update(state,g,time);
      if(!frame&&pool.slots.some(Boolean))frame=scope.requestAnimationFrame(draw);
    }};
  }
  const api={Pool,anchors,MAX,create};
  if(typeof module==='object'&&module.exports)module.exports=api;
  else scope.WeddingStarTrail=api;
})(typeof window==='object'?window:globalThis);

;
/* Source: ../v10.114-clean-photo-layer/camera-story-math.js */
(function(scope){
  'use strict';
  const DURATION=6800,PRINT_START=1800,PRINT_END=3800;
  const FOCUS_START=4050,FOCUS_END=5350,CAPTION_START=5500,NAMES_START=5800;
  const FLASH_PEAK=.48,PHOTO_SCALE=2.18,PHOTO_RISE=-8.15;
  const clamp=x=>Math.max(0,Math.min(1,x)),mix=(a,b,t)=>a+(b-a)*t;
  const ease=x=>{x=clamp(x);return x*x*x*(x*(x*6-15)+10);};
  // One attack/decay pulse, never a repeated strobe.
  const pulse=(t,start,peak,end)=>t<start||t>end?0:t<=peak?ease((t-start)/(peak-start)):1-ease((t-peak)/(end-peak));
  const turn=(x,y,deg)=>{const r=deg*Math.PI/180;return{x:x*Math.cos(r)-y*Math.sin(r),y:x*Math.sin(r)+y*Math.cos(r)};};
  function local(a,x,y){
    const p=turn(x-120,y-(a.index?247:225),a.spineAngle||0);
    const px=(p.x+120-120)*(1-.16*Math.abs(a.cameraYaw||0))+120;
    return turn(px,p.y+(a.index?247:225),a.lean);
  }
  function hand(a,left){
    const shoulder={x:left?(a.index?65:64):184,y:a.index?205:181};
    const tip=turn(0,65,left?a.freeArm:a.arm),p=local(a,shoulder.x+tip.x,shoulder.y+tip.y);
    return{x:a.x+p.x*a.scale,y:a.y+p.y*a.scale};
  }
  function anchor(a,point,left){const h=hand(a,left);a.x+=point.x-h.x;a.y+=point.y-h.y;return a;}
  function center(a){const p=turn(120,170,a.lean);return{x:a.x+p.x*a.scale,y:a.y+p.y*a.scale};}
  function atCenter(a,p){const c=turn(120,170,a.lean);a.x=p.x-c.x*a.scale;a.y=p.y-c.y*a.scale;return a;}
  function bezier(a,b,c,d,t){const u=1-t;return{x:u*u*u*a.x+3*u*u*t*b.x+3*u*t*t*c.x+t*t*t*d.x,y:u*u*u*a.y+3*u*u*t*b.y+3*u*t*t*c.y+t*t*t*d.y};}
  function makePlan(math,g,rect,startActors){
    const starts=(startActors||math.sample(.79,g).actors).map(a=>({...a,opacity:1}));
    const shutter={x:rect.left+rect.width*.611,y:rect.top+rect.height*.447};
    const scale=g.actorWidth/240;
    const press={...starts[0],scale,lean:-10,spineAngle:-5,cameraYaw:1,arm:24,freeArm:27,kick:7,legFollow:3,clothLag:-2,clothRipple:0,gazeX:-.75,gazeY:.55,eyeOpen:1,handhold:0};
    anchor(press,shutter,true);
    const girl={...starts[1],scale,lean:-5,spineAngle:-2,cameraYaw:-.25,arm:-12,freeArm:35,kick:0,clothLag:2,clothRipple:0,gazeX:-.75,gazeY:.1,eyeOpen:1,handhold:0};
    atCenter(girl,{x:rect.left+rect.width*.84,y:shutter.y-g.actorWidth*.18});
    const meeting={x:rect.left+rect.width*.72,y:shutter.y-g.actorWidth*.30};
    return{g,rect,starts,shutter,press,girl,meeting,scale};
  }
  function blendPose(a,b,t){
    const out={...a};
    for(const k of ['scale','lean','spineAngle','cameraYaw','arm','freeArm','kick','legFollow','clothLag','clothRipple','gazeX','gazeY','eyeOpen'])out[k]=mix(a[k]||0,b[k]||0,t);
    out.opacity=1;out.handhold=0;
    return out;
  }
  function sample(ms,plan){
    const t=Math.max(0,Math.min(DURATION,ms)),{g,starts,shutter,press,girl,meeting,scale}=plan;
    const approach=ease(t/1150),reach=approach,join=ease((t-1950)/700),depart=ease((t-2850)/1750);
    const pressDip=t>=1450&&t<=1760?Math.sin((t-1450)/310*Math.PI)**2*3:0;
    const targets=[press,girl];
    let actors=starts.map((start,i)=>{
      let a=blendPose(start,targets[i],reach);
      const from=center(start),to=center(targets[i]);
      const point=bezier(from,{x:from.x+(i?g.width*.06:g.width*.09),y:from.y-g.height*.08},{x:to.x+g.width*.025,y:to.y-g.height*.045},to,approach);
      atCenter(a,point);
      const hover=Math.sin(clamp((t-1150)/800)*Math.PI*2)*(i?1.5:0.7);
      if(i===0&&t>=1150&&t<=1950)anchor(a,{x:shutter.x,y:shutter.y+pressDip},true);
      else if(t>=1150&&t<1950)a.y+=hover;
      // Gaze anticipates rejoining. Keep the collar as one intact image.
      const glance=ease((t-1780)/300);
      a.gazeX=mix(a.gazeX,i?-.75:.75,glance);a.gazeY=mix(a.gazeY,.1,glance);
      a.eyeOpen=1-.92*Math.sin(clamp((t-(i?1860:1740))/135)*Math.PI)**2;
      if(t>=1950){
        const base=targets[i],held={...base,lean:mix(i?-4:5,i?28:34,depart),spineAngle:mix(0,-4,depart),cameraYaw:0,
          arm:i?mix(-8,18,depart):-86,freeArm:i?86:mix(12,25,depart),
          gazeX:mix(i?-.75:.75,.75,depart),gazeY:mix(.1,-.55,depart),
          scale:scale*mix(1,.68,depart),kick:Math.sin(depart*Math.PI)*12,legFollow:depart*8,clothLag:-depart*8,clothRipple:0,eyeOpen:a.eyeOpen};
        const p=bezier(meeting,{x:meeting.x-g.width*.02,y:meeting.y-g.height*.15},{x:g.left+g.width*.97,y:-g.height*.15},{x:g.left+g.width*1.45,y:-g.height*.45},depart);
        anchor(held,p,i===1);
        a=blendPose(base,held,join);
        a.x=mix(base.x,held.x,join);a.y=mix(base.y,held.y,join);
        if(join===1)anchor(a,p,i===1);
        a.handhold=join;
      }
      a.hand=hand(a,false);a.leftHand=hand(a,true);a.joinedHand=i?a.leftHand:a.hand;
      const foot=turn(120,330,a.lean);a.emitter={x:a.x+foot.x*a.scale,y:a.y+foot.y*a.scale};
      a.opacity=t>=4700?0:1-ease((t-4500)/200);
      return a;
    });
    const flash=FLASH_PEAK*pulse(t,1600,1660,1890);
    const lensFlash=.98*pulse(t,1520,1620,1850);
    const focus=ease((t-FOCUS_START)/(FOCUS_END-FOCUS_START));
    return{t,p:t>=DURATION?1:Math.max(.001,t/DURATION),actors,emitters:actors.map(a=>a.emitter),opacity:Math.max(...actors.map(a=>a.opacity)),
      flash,lensFlash,focus,photoScale:mix(1,PHOTO_SCALE,focus),photoRise:PHOTO_RISE*focus,
      cameraHide:ease((t-FOCUS_START)/900),press:pressDip/3,print:ease((t-PRINT_START)/(PRINT_END-PRINT_START)),
      caption:ease((t-CAPTION_START)/800),names:ease((t-NAMES_START)/850),done:t>=DURATION};
  }
  const api={makePlan,sample,hand,center,DURATION,PRINT_START,PRINT_END,FOCUS_START,FOCUS_END,CAPTION_START,NAMES_START,FLASH_PEAK,PHOTO_SCALE,PHOTO_RISE};
  if(typeof module==='object'&&module.exports)module.exports=api;else scope.WeddingCameraMath=api;
})(typeof window==='object'?window:globalThis);

;
/* Source: handoff-math.js */
(function(scope){
  'use strict';
  const COVER_DURATION=3800,ARRIVE=[500,650],TURN_START=720,REACH_START=1020,CONTACT_AT=1380;
  const clamp=x=>Math.max(0,Math.min(1,x)),mix=(a,b,t)=>a+(b-a)*t;
  const ease=x=>{x=clamp(x);return x*x*x*(x*(x*6-15)+10);};
  function cameraView(g){
    return {g:{width:g.width,height:g.height,left:g.left,viewportWidth:g.viewportWidth,actorWidth:g.actorWidth},
      rect:{left:g.left,top:g.storyTop||0,width:g.width,height:g.storyHeight||g.width*1.5}};
  }
  function bezier(a,b,c,d,t){
    const u=1-t;return{x:u*u*u*a.x+3*u*u*t*b.x+3*u*t*t*c.x+t*t*t*d.x,
      y:u*u*u*a.y+3*u*u*t*b.y+3*u*t*t*c.y+t*t*t*d.y};
  }
  function finishPose(math,camera,a,point){
    const c=math.rotate(120,170,a.lean);
    a.x=point.x-c.x*a.scale;a.y=point.y-c.y*a.scale;
    a.grip=0;a.handhold=0;a.opacity=1;
    a.hand=camera.hand(a,false);a.leftHand=camera.hand(a,true);
    a.joinedHand=a.index?a.leftHand:a.hand;
    const foot=math.rotate(120,330,a.lean);
    a.emitter={x:a.x+foot.x*a.scale,y:a.y+foot.y*a.scale};
    return a;
  }
  function dockPoses(math,camera,plan){
    return [plan.press,plan.girl].map((target,i)=>finishPose(math,camera,{
      ...target,lean:i?-2:2,spineAngle:0,cameraYaw:0,
      arm:i?12:18,freeArm:i?-14:-22,kick:0,legFollow:0,
      clothLag:0,clothRipple:0,elbowBend:2,eyeOpen:1
    },camera.center(target)));
  }
  function makeFlight(math,camera,g){
    const view=cameraView(g),ends=math.sample(.64,g).actors;
    const cameraPlan=camera.makePlan(math,view.g,view.rect,ends);
    const docks=cameraPlan.docks||dockPoses(math,camera,cameraPlan);
    const lanes=docks.map((target,i)=>{
      const release=math.releaseAt(i),start=math.sample(release,g).actors[i];
      const from=camera.center(start),to=camera.center(target),eps=.00001;
      const before=camera.center(math.sample(release-eps,g).actors[i]);
      const releaseTime=release*5600*COVER_DURATION/math.DURATION;
      const step=eps*5600*COVER_DURATION/math.DURATION;
      const velocity={x:(from.x-before.x)/step,y:(from.y-before.y)/step};
      const coast=Math.max(1,Math.min(40,(from.x-g.left-g.actorWidth*.54)/Math.max(.01,-velocity.x)));
      return {start,target,from,to,releaseTime,velocity,coast,arrival:COVER_DURATION+ARRIVE[i]};
    });
    return {math,camera,g,view,cameraPlan,lanes};
  }
  function actorsAt(ms,flight){
    const {math,camera,g,lanes}=flight;
    const p=math.progressAt(Math.min(COVER_DURATION,Math.max(0,ms))*math.DURATION/COVER_DURATION);
    const initial=ms<=lanes[1].releaseTime?math.sample(p,g).actors:null;
    return lanes.map((lane,i)=>{
      if(ms<=lane.releaseTime)return initial[i];
      const {start,target,from,to,releaseTime,velocity,coast,arrival}=lane;
      const dt=ms-releaseTime,duration=arrival-releaseTime,u=ease(dt/duration);
      const lead=i?{x:from.x+g.width*.62,y:from.y}:from;
      const near=i?{x:to.x-g.width*.025,y:to.y+g.actorWidth*.6}
        :{x:to.x-g.width*.10,y:to.y-g.height*.035};
      const point=bezier(from,lead,near,to,u);
      const inertia=coast*(1-Math.exp(-dt/coast))*(1-u);
      point.x+=velocity.x*inertia;point.y+=velocity.y*inertia;
      // Folding, banking and braking have independent envelopes. No channel
      // points at the shutter until the character is stationary beside it.
      const fold=ease(dt/300),bank=ease((dt-90)/410);
      const brake=ease((ms-(arrival-500))/500),follow=ease((dt-170)/430);
      const kickPulse=Math.sin(Math.PI*clamp((dt-200)/1000))**2;
      const a={...start,scale:mix(start.scale,target.scale,ease(dt/800)),
        lean:mix(mix(start.lean,i?18:26,bank),target.lean,brake),
        spineAngle:mix(mix(start.spineAngle||0,i?-4:-6,follow),0,brake),
        cameraYaw:0,arm:mix(start.arm,target.arm,fold),freeArm:mix(start.freeArm,target.freeArm,fold),
        elbowBend:mix(start.elbowBend||0,2,fold),kick:mix(start.kick,0,fold)+(i?7:12)*kickPulse*(1-brake),
        legFollow:mix(start.legFollow||0,i?5:8,follow)*(1-brake),
        clothLag:mix(start.clothLag||0,i?-5:-7,follow)*(1-brake),clothRipple:0,
        eyeOpen:1-.90*Math.sin(Math.PI*clamp((dt-(i?600:420))/145))**2};
      // Eyes track the actual camera, then resolve into the settled glance.
      const eye=math.rotate(120,i?148:118,a.lean),center=math.rotate(120,170,a.lean);
      const dx=flight.cameraPlan.shutter.x-(point.x+(eye.x-center.x)*a.scale);
      const dy=flight.cameraPlan.shutter.y-(point.y+(eye.y-center.y)*a.scale);
      const local=math.rotate(dx,dy,-a.lean),length=Math.max(1,Math.hypot(local.x,local.y));
      const look=ease(dt/180);
      a.gazeX=mix(mix(start.gazeX||0,.85*local.x/length,look),target.gazeX,brake);
      a.gazeY=mix(mix(start.gazeY||0,.65*local.y/length,look),target.gazeY,brake);
      return finishPose(math,camera,a,point);
    });
  }
  const api={makeFlight,actorsAt,cameraView,dockPoses,finishPose,ease,mix,
    COVER_DURATION,ARRIVE,TURN_START,REACH_START,CONTACT_AT};
  if(typeof module==='object'&&module.exports)module.exports=api;else scope.WeddingHandoffMath=api;
})(typeof window==='object'?window:globalThis);

;
/* Source: instant-paper.js */
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

;
/* Source: camera-story-math.js */
(function(scope){
  'use strict';
  const node=typeof module==='object'&&module.exports;
  const base=node?require('../v10.114-clean-photo-layer/camera-story-math.js'):scope.WeddingCameraMath;
  const bridge=node?require('./handoff-math.js'):scope.WeddingHandoffMath;
  const {ease,mix}=bridge;
  const paper=node?require('./instant-paper.js'):scope.WeddingInstantPaper;
  const PHOTO_SCALE=35/17,PHOTO_RISE=-11.6;
  // V10.124: one fast attack, short exposure hold, soft decay; other clocks unchanged.
  const FLASH_PEAK=.78,FLASH_START=1600,FLASH_AT=1660,FLASH_HOLD_END=1705,FLASH_END=2030;
  function exposure(t,start,peak,hold,end){
    if(t<=start||t>=end)return 0;
    if(t<peak)return ease((t-start)/(peak-start));
    if(t<=hold)return 1;
    return 1-ease((t-hold)/(end-hold));
  }
  function makePlan(math,g,rect,startActors,flight){
    if(flight)return {...flight.cameraPlan,starts:startActors,flight,math};
    const plan=base.makePlan(math,g,rect,startActors);
    // The girl watches, with relaxed hands. She is not also pressing a button.
    const c=base.center(plan.girl);
    plan.girl=bridge.finishPose(math,base,{...plan.girl,arm:12,freeArm:-14,lean:-2,
      spineAngle:0,cameraYaw:0,kick:0,legFollow:0,clothLag:0,clothRipple:0,elbowBend:2},c);
    plan.docks=bridge.dockPoses(math,base,plan);plan.math=math;
    if(!startActors)plan.starts=plan.starts.map((a,i)=>bridge.finishPose(math,base,
      {...a,arm:plan.docks[i].arm,freeArm:plan.docks[i].freeArm,cameraYaw:0},base.center(a)));
    return plan;
  }
  function approach(t,plan){
    if(plan.flight)return bridge.actorsAt(bridge.COVER_DURATION+t,plan.flight);
    return plan.starts.map((start,i)=>{
      const dock=plan.docks[i],u=ease(t/bridge.ARRIVE[i]),a={...start};
      for(const k of ['scale','lean','spineAngle','cameraYaw','arm','freeArm','kick',
        'legFollow','clothLag','clothRipple','gazeX','gazeY','eyeOpen','elbowBend'])a[k]=mix(start[k]||0,dock[k]||0,u);
      const from=base.center(start),to=base.center(dock);
      return bridge.finishPose(plan.math,base,a,{x:mix(from.x,to.x,u),y:mix(from.y,to.y,u)});
    });
  }
  function sample(ms,plan){
    const state=base.sample(ms,plan),t=Math.max(0,ms);
    if(t<bridge.CONTACT_AT){
      state.actors=approach(t,plan).map((a,i)=>{
        if(t<bridge.ARRIVE[i])return a;
        const dock=plan.docks[i],target=i?plan.girl:plan.press;
        const turn=ease((t-bridge.TURN_START)/280);
        const reach=ease((t-bridge.REACH_START)/(bridge.CONTACT_AT-bridge.REACH_START));
        const pose={...dock};
        // A short settled beat, then the torso turns, THEN the hand reaches.
        for(const k of ['lean','spineAngle','cameraYaw'])pose[k]=mix(dock[k]||0,target[k]||0,turn);
        for(const k of ['arm','freeArm','kick','legFollow','clothLag','clothRipple','elbowBend'])
          pose[k]=mix(dock[k]||0,target[k]||0,reach);
        const glance=ease((t-bridge.ARRIVE[i]-90)/170);
        pose.gazeX=mix(dock.gazeX,target.gazeX,glance);pose.gazeY=mix(dock.gazeY,target.gazeY,glance);
        pose.eyeOpen=1-.90*Math.sin(Math.PI*Math.max(0,Math.min(1,(t-(i?760:540))/135)))**2;
        const point=base.center(target);
        // Match the existing girl's gentle wait through the later camera beat.
        if(i&&t>=1150)point.y+=Math.sin(Math.max(0,Math.min(1,(t-1150)/800))*Math.PI*2)*1.5;
        return bridge.finishPose(plan.math,base,pose,point);
      });
      state.emitters=state.actors.map(a=>a.emitter);
      state.opacity=Math.max(...state.actors.map(a=>a.opacity));
    }
    state.flash=FLASH_PEAK*exposure(t,FLASH_START,FLASH_AT,FLASH_HOLD_END,FLASH_END);
    state.lensFlash=.98*exposure(t,1520,1630,1670,FLASH_END);
    state.print=paper.feedAt(t);
    state.paperBend=paper.bendAt(t);
    state.photoScale=mix(1,PHOTO_SCALE,state.focus);
    state.photoRise=PHOTO_RISE*state.focus;
    return state;
  }
  const api={...base,PHOTO_SCALE,PHOTO_RISE,makePlan,sample,FLASH_PEAK,FLASH_START,FLASH_AT,FLASH_HOLD_END,FLASH_END};
  if(node)module.exports=api;else scope.WeddingCameraMath=api;
})(typeof window==='object'?window:globalThis);

;
/* Source: page-media.js */
(() => {
  'use strict';
  const root=document.documentElement,cover=document.querySelector('.image-cover picture img');
  const entry=document.querySelector('.cover-enter');
  const story=[...document.querySelectorAll('[data-media-group="story"]')];
  const later=[...document.querySelectorAll('[data-media-group="later"]')];
  let released=false,pendingTap=false,staticOnly=false,resolveReady;
  const ready=new Promise(resolve=>{resolveReady=resolve;});
  const frame=callback=>window.requestAnimationFrame?window.requestAnimationFrame(callback):setTimeout(callback,0);
  let pageWidth=window.innerWidth;
  root.style.setProperty('--paper-height',window.innerHeight+'px');
  window.addEventListener('resize',()=>{
    // Ignore browser-toolbar height changes; lvh already reserves their full space.
    if(pageWidth!==window.innerWidth){pageWidth=window.innerWidth;root.style.setProperty('--paper-height',window.innerHeight+'px');}
  },{passive:true});
  function activate(image){
    const src=image.getAttribute('data-media-src');
    if(!src||image.getAttribute('src'))return;
    // Select the responsive candidate before setting the fallback URL.
    const sizes=image.getAttribute('data-media-sizes'),srcset=image.getAttribute('data-media-srcset');
    if(sizes)image.sizes=sizes;
    if(srcset)image.srcset=srcset;
    image.loading='eager';image.src=src;
  }
  function release(){
    if(released)return;
    released=true;
    for(const image of story)activate(image);
    root.classList.remove('cover-first');
    resolveReady();document.dispatchEvent(new Event('camera-media-released'));
  }
  window.WeddingMedia={ready,get released(){return released;}};
  function afterPaint(){
    // The timeout only handles a background tab where animation frames pause.
    const fallback=setTimeout(release,1500);
    frame(()=>frame(()=>{clearTimeout(fallback);release();}));
  }
  function coverReady(){
    if(cover?.naturalWidth&&typeof cover.decode==='function')cover.decode().then(afterPaint,afterPaint);
    else afterPaint();
  }
  if(!cover||cover.complete)coverReady();
  else{cover.addEventListener('load',coverReady,{once:true});cover.addEventListener('error',coverReady,{once:true});}

  // A quick tap while media is loading stays on the visible invitation. It is
  // replayed once after both controllers are ready, not a jump to an empty page.
  entry?.addEventListener('click',event=>{
    if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||(event.button!==undefined&&event.button!==0))return;
    if(staticOnly||window.WeddingCameraStory?.played||window.WeddingCameraStory?.ready)return;
    event.preventDefault();pendingTap=true;entry.setAttribute('aria-busy','true');release();
  });
  function resumeTap(fallback=false){
    staticOnly=staticOnly||fallback;
    entry?.removeAttribute('aria-busy');
    if(!pendingTap)return;
    pendingTap=false;
    // Let readiness/decode listeners finish configuring the page-turn geometry.
    frame(()=>entry?.click());
  }
  document.addEventListener('camera-assets-ready',()=>resumeTap());
  document.addEventListener('camera-story-complete',()=>resumeTap(true));

  let fonts=false;
  function activateLater(image){
    activate(image);root.classList.add('later-media-ready');
    if(fonts)return;fonts=true;
    const link=document.createElement('link');link.rel='stylesheet';
    link.href='https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500;600&display=swap';
    document.head.appendChild(link);
  }
  if(window.IntersectionObserver){
    const observer=new window.IntersectionObserver(entries=>{
      for(const item of entries)if(item.isIntersecting&&released){activateLater(item.target);observer.unobserve(item.target);}
    },{rootMargin:'320px 0px'});
    ready.then(()=>{for(const image of later)observer.observe(image);});
  }else{
    const check=()=>{if(released)for(const image of later)if(image.getBoundingClientRect().top<window.innerHeight+320)activateLater(image);};
    window.addEventListener('scroll',check,{passive:true});ready.then(check);
  }
})();

;
/* Source: paper-tail.js */
/* V10.123: extend both page edges using only the blank lower quarter of the existing bitmap.
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
      const headGap=Math.max(0,art.offsetTop);
      const headBlend=headGap>0?Math.min(24,height*.02):0;
      const head=headGap+headBlend;
      // The sampled range must stay within source y=1152..1536, safely below
      // the camera. Uniform scaling also guarantees full-width coverage.
      const sourceHeight=Math.max(width*1.5,height,tail*4);
      const headSourceHeight=Math.max(width*1.5,height,head*4);
      const signature=[tail,blend,sourceHeight,head,headBlend,headSourceHeight].join('/');
      if(signature!==item.signature)updates.push({item,tail,blend,sourceHeight,head,headBlend,headSourceHeight,signature});
    }
    // Separate reads from writes; these properties affect paint only.
    for(const {item,tail,blend,sourceHeight,head,headBlend,headSourceHeight,signature} of updates){
      item.page.style.setProperty('--paper-tail-height',tail+'px');
      item.page.style.setProperty('--paper-tail-blend',blend+'px');
      item.page.style.setProperty('--paper-tail-source-height',sourceHeight+'px');
      item.page.style.setProperty('--paper-head-height',head+'px');
      item.page.style.setProperty('--paper-head-blend',headBlend+'px');
      item.page.style.setProperty('--paper-head-source-height',headSourceHeight+'px');
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

;
/* Source: camera-story.js */
(() => {
  'use strict';
  const root=document.documentElement,math=window.WeddingPageTurn,story=window.WeddingCameraMath;
  const stages=[...document.querySelectorAll('.reference-art')];
  const stage=document.querySelector('#our-story .reference-art')||stages[0];
  const rigImage=document.querySelector('.rig-source'),eyes=document.querySelector('.head-source');
  const status=document.querySelector('[data-camera-status]');
  if(!stage||!math||!story||!window.requestAnimationFrame)return;
  const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
  const layer=document.createElement('div');layer.className='camera-flight-layer';layer.setAttribute('aria-hidden','true');
  const trailCanvas=document.createElement('canvas'),actorCanvas=document.createElement('canvas'),flash=document.createElement('div');
  trailCanvas.className='camera-trail';actorCanvas.className='camera-actors';flash.className='camera-flash';
  layer.append(trailCanvas,actorCanvas,flash);document.body.appendChild(layer);
  const paper=window.WeddingInstantPaper?.create(stage);
  const rig=window.WeddingCharacterRig?.create(actorCanvas,rigImage,math,eyes),trail=window.WeddingStarTrail?.create(trailCanvas);
  let ready=false,active=false,played=false,failed=false,frame=0,started=null,plan=null,scrollAt=0;
  function message(text){if(status)status.textContent=text;}
  const styles=new WeakMap();
  function setStyle(node,key,value){
    let cache=styles.get(node);if(!cache){cache=new Map();styles.set(node,cache);}
    if(cache.get(key)===value)return;
    node.style.setProperty(key,value);cache.set(key,value);
  }
  function css(state){
    const values={
      '--print-y':(-17*(1-state.print))+'%',
      '--caption-alpha':String(state.caption),'--names-alpha':String(state.names),
      '--camera-press':String(state.press),'--photo-scale':String(state.photoScale),
      '--photo-rise':state.photoRise+'%','--camera-hide':String(state.cameraHide),
      '--lens-flash':String(state.lensFlash)
    };
    for(const node of stages){
      for(const [key,value] of Object.entries(values))setStyle(node,key,value);
      const settled=state.photoScale===story.PHOTO_SCALE&&state.cameraHide===1;
      if(settled)node.classList.add('camera-photo-settled');else node.classList.remove('camera-photo-settled');
    }
    paper?.paint(state);
    if(flash.style.opacity!==String(state.flash))flash.style.opacity=String(state.flash);
  }
  function complete(){
    if(frame)window.cancelAnimationFrame(frame);frame=0;active=false;played=true;
    css({print:1,caption:1,names:1,press:0,flash:0,lensFlash:0,photoScale:story.PHOTO_SCALE,photoRise:story.PHOTO_RISE,cameraHide:1,done:true});
    paper?.clear();rig?.clear();trail?.clear();layer.classList.remove('is-active');
    root.classList.remove('camera-pending');
    // Clear a residual horizontal offset only at ordinary zoom; never move Y.
    if((!window.visualViewport||window.visualViewport.scale<=1.01)&&Math.abs(window.scrollX||0)>.5)
      window.scrollTo?.({left:0,top:window.scrollY,behavior:'auto'});
    message('照片已打印并放大，欢迎赴约。');
    document.dispatchEvent(new Event('camera-story-complete'));
  }
  function geometry(){
    const rect=stage.getBoundingClientRect(),w=rect.width;
    return {rect,g:{width:w,height:window.innerHeight,left:rect.left,viewportWidth:window.innerWidth,actorWidth:math.actorWidth(w)}};
  }
  function start(input={}){
    if(active||played)return false;
    if(!ready||failed||preference.matches||!rig){complete();return false;}
    const {g,rect}=input.view||geometry();
    paper?.prepare(g.width);
    plan=story.makePlan(math,g,rect,input.actors,input.flight);active=true;played=true;started=Number.isFinite(input.timestamp)?input.timestamp:null;scrollAt=window.scrollY;
    document.dispatchEvent(new Event('camera-story-started'));
    layer.classList.add('is-active');
    message('星星人正在为你们记录幸福。');
    const draw=timestamp=>{
      frame=0;if(!active)return;
      if(started===null)started=timestamp;
      const state=story.sample(timestamp-started,plan);css(state);
      try{rig.paint(state,plan.g);trail?.update(state,plan.g,timestamp);}catch(_){complete();return;}
      if(state.done){complete();return;}
      frame=window.requestAnimationFrame(draw);
    };
    // Paint the handoff pose synchronously; no one-frame disappearance.
    try{
      const first=story.sample(0,plan);css(first);rig.paint(first,plan.g);
    }catch(_){complete();return false;}
    frame=window.requestAnimationFrame(draw);
    return true;
  }
  window.WeddingCameraStory={start,complete,get ready(){return ready&&!failed&&!preference.matches},get active(){return active},get played(){return played}};
  if(preference.matches||!rig){complete();return;}
  root.classList.add('camera-pending');
  if(window.__cameraBootTimer)clearTimeout(window.__cameraBootTimer);
  // Asset loading never leaves the page hidden indefinitely. Cover has first priority.
  let watchdog=null;
  const cover=document.querySelector('.image-cover img');
  function waitImage(image){
    return new Promise((resolve,reject)=>{
      if(!image)return reject(Error('missing image'));
      const decode=()=>image.naturalWidth?(typeof image.decode==='function'?image.decode().then(resolve,reject):resolve()):reject(Error('broken image'));
      if(image.complete&&image.naturalWidth)return decode();
      image.addEventListener('load',decode,{once:true});image.addEventListener('error',reject,{once:true});
    });
  }
  async function prepare(){
    try{
      if(window.WeddingMedia)await window.WeddingMedia.ready;
      if(cover)await waitImage(cover);
      watchdog=setTimeout(()=>{if(!ready){failed=true;complete();}},15000);
      for(const image of [rigImage,eyes]){
        const src=image?.getAttribute('data-src');if(src&&!image.getAttribute('src'))image.src=src;
      }
      const images=[...new Set([...document.querySelectorAll('.reference-art img'),rigImage,eyes])];
      for(const image of images)if(image)image.loading='eager';
      await Promise.all(images.map(waitImage));
      clearTimeout(watchdog);if(failed)return;
      // Allocate both backing stores before enabling the first-page transition.
      const {g}=geometry();
      rig.paint({actors:[],p:0,opacity:0},g);
      trail?.update({p:0,opacity:0,emitters:[]},g,0);
      paper?.prepare(g.width);
      ready=true;
      document.dispatchEvent(new Event('camera-assets-ready'));
      if(location.hash==='#our-story')startWhenVisible();
    }catch(_){clearTimeout(watchdog);failed=true;complete();}
  }
  function startWhenVisible(){
    if(!ready||played||root.classList.contains('turn-playing'))return;
    const r=(document.querySelector('#our-story')||stage).getBoundingClientRect();
    // Native scroll/no-canvas fallback and #our-story links also get a usable page.
    if(r.top<=window.innerHeight*.18&&r.bottom>0)start();
  }
  function cancelOnChange(){
    if(active)complete();
  }
  window.addEventListener('resize',cancelOnChange,{passive:true});
  window.addEventListener('scroll',()=>{
    if(active&&Math.abs(window.scrollY-scrollAt)>2)complete();
    else startWhenVisible();
  },{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&active)complete();});
  window.addEventListener('pagehide',()=>{if(active)complete();});
  const change=()=>{if(preference.matches)complete();};
  if(preference.addEventListener)preference.addEventListener('change',change);else preference.addListener(change);
  const guard=event=>{
    if(!active)return;
    if(event.ctrlKey||event.metaKey||event.touches?.length>1){complete();return;}
    if(event.cancelable)event.preventDefault();
  };
  window.addEventListener('wheel',guard,{passive:false});window.addEventListener('touchmove',guard,{passive:false});
  window.addEventListener('keydown',event=>{
    if(!active)return;
    if(event.key==='Escape'||event.key==='Tab'){complete();return;}
    if([' ','ArrowUp','ArrowDown','PageUp','PageDown','Home','End'].includes(event.key))guard(event);
  });
  prepare();
})();

;
/* Source: page-turn.js */
(() => {
  'use strict';
  const root=document.documentElement;
  const sequence=document.querySelector('.opening-sequence'),sheet=document.querySelector('.turn-sheet');
  const cover=document.querySelector('.image-cover'),stars=document.querySelector('.page-turn-stars');
  const chapter=document.querySelector('#our-story'),entry=document.querySelector('.cover-enter');
  const math=window.WeddingPageTurn,bridge=window.WeddingHandoffMath;
  if(!sequence||!sheet||!cover||!stars||!chapter||!entry||!math||!bridge||!window.matchMedia||!window.requestAnimationFrame) return;
  const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
  const coverImage=cover.querySelector('img'),rigImage=document.querySelector('.rig-source'),nextImage=document.querySelector('.opening-underlay img');
  const headImage=document.querySelector('.head-source');
  // Both the under-paper preview and the real scrolling page must decode before the turn.
  const nextMedia=Array.from(document.querySelectorAll('.reference-art img'));
  const sourceImages=[...new Set([coverImage,rigImage,nextImage,headImage,...nextMedia])];
  const images=[...sourceImages];
  const decoded=new WeakSet(),decoding=new WeakSet();
  function pixelsReady(){
    let ready=true;
    // Decode the cover, sprites and both page renderings before a flight, not on its
    // first canvas frame. Browsers without decode retain the load-event gate.
    for(const image of sourceImages){
      if(!image||typeof image.decode!=='function'||decoded.has(image))continue;
      ready=false;
      if(!decoding.has(image)){
        decoding.add(image);
        try{image.decode().then(()=>{decoded.add(image);configure();},()=>{assetFailed=true;configure();});}
        catch(_){assetFailed=true;}
      }
    }
    return ready;
  }
  let rig=null,paper=null,trail=null,prepared=false;
  function prepare(){
    if((window.WeddingMedia&&!window.WeddingMedia.released)||prepared||preference.matches||!coverImage?.complete||!coverImage.naturalWidth)return;
    prepared=true;
    try{
      // Cover gets the first request budget. Prepare sprites and the next photo
      // only afterwards; never create slices with the unused JPEG fallback.
      for(const image of [rigImage,headImage]){
        const src=image?.getAttribute?.('data-src');
        if(src)image.src=src;
      }
      if(nextImage)nextImage.loading='eager';
      for(const image of nextMedia)image.loading='eager';
      rig=window.WeddingCharacterRig?.create(stars,rigImage,math,headImage);
      paper=window.WeddingPaperSurface?.create(document.querySelector('.paper-slices'),coverImage,math.SEGMENTS);
      trail=window.WeddingStarTrail?.create(document.querySelector('.star-trail'));
      if(paper&&paper.images)for(const image of paper.images){images.push(image);watch(image);}
    }catch(_){assetFailed=true;}
  }
  let enabled=false,frame=0,geometry=null,travelFrame=0,assetFailed=false;
  let playing=false,settled=false,progress=0,elapsed=0,flight=null,playbackScrollY=null;
  const properties=['--turn-vh','--track-height','--sheet-height','--sheet-top','--hinge-y','--stars-width'];
  const playbackProperties=['--play-sheet-top','--play-sheet-left','--play-sheet-width'];
  function cancelTravel(){
    if(travelFrame)window.cancelAnimationFrame(travelFrame);travelFrame=0;
    playing=false;root.classList.remove('turn-playing');
    playbackScrollY=null;
    playbackProperties.forEach(name=>root.style.removeProperty(name));
    sheet.style.removeProperty('--hinge-y');
  }
  function clear(){
    cancelTravel();if(frame)window.cancelAnimationFrame(frame);frame=0;
    if(trail)trail.clear();if(rig)rig.clear();if(paper)paper.clear();
    enabled=false;root.classList.remove('star-turn');
    properties.forEach(name=>root.style.removeProperty(name));
    sheet.style.removeProperty('--front-opacity');sheet.style.removeProperty('--cover-fill');
    entry.style.removeProperty('pointer-events');
  }
  function retire(){
    if(settled)return;
    settled=true;progress=1;
    clear();
    // Terminal state for this document visit. Returning to the cover is reading,
    // not another animation trigger; the real cover remains in normal flow.
    root.classList.add('turn-settled');
    entry.style.pointerEvents='none';
    entry.setAttribute?.('tabindex','-1');
    entry.setAttribute?.('aria-hidden','true');
  }
  function paint(timestamp){
    frame=0;if(!enabled||!geometry)return;
    try{
      const state=math.sample(progress,geometry);
      state.actors=bridge.actorsAt(elapsed,flight);
      state.emitters=state.actors.map(a=>a.emitter);
      state.opacity=Math.max(...state.actors.map(a=>a.opacity));
      paper.paint(state);rig.paint(state,geometry);
      sheet.style.setProperty('--front-opacity',state.p<=0?'1':'0');
      sheet.style.setProperty('--cover-fill',state.p<=0?'#922c25':'transparent');
      entry.style.pointerEvents=state.p<.02?'auto':'none';
      if(trail)trail.update(state,geometry,timestamp);
    }catch(_){finish(false,true);}
  }
  function schedule(){if(enabled&&!playing&&!frame)frame=window.requestAnimationFrame(paint);}
  function finish(focus=false,skipStory=false,timestamp){
    if(settled)return;
    const handoff=flight?bridge.actorsAt(bridge.COVER_DURATION,flight):null;
    const landing=geometry?geometry.start+geometry.distance:null;
    retire();
    if(landing!==null)window.scrollTo({top:landing,left:window.visualViewport?.scale>1.01?window.scrollX:0,behavior:'auto'});
    if(focus)chapter.focus({preventScroll:true});
    if(skipStory)window.WeddingCameraStory?.complete();
    else window.WeddingCameraStory?.start({actors:handoff,view:bridge.cameraView(geometry),timestamp,flight});
  }
  function startTravel(focus=false){
    if(settled||!enabled||!geometry||playing||document.hidden)return;
    if(frame)window.cancelAnimationFrame(frame);frame=0;
    // Freeze the exact visible crop. Do not scroll to the old bottom-of-cover
    // trigger: that 250ms alignment made a tap look like a downward jump.
    const rect=cover.getBoundingClientRect();
    playbackScrollY=window.scrollY;
    root.style.setProperty('--play-sheet-top',rect.top+'px');
    root.style.setProperty('--play-sheet-left',geometry.left+'px');
    root.style.setProperty('--play-sheet-width',geometry.width+'px');
    // Paper and character grips must share a viewport-relative hinge even
    // when the reader taps near the top or halfway down a long invitation.
    sheet.style.setProperty('--hinge-y',(geometry.height*.60-rect.top)+'px');
    playing=true;progress=0;elapsed=0;root.classList.add('turn-playing');
    let started;
    const advance=timestamp=>{
      if(!enabled||!playing)return;
      if(started===undefined)started=timestamp;
      elapsed=Math.min(bridge.COVER_DURATION,timestamp-started);
      progress=math.progressAt(elapsed*math.DURATION/bridge.COVER_DURATION);
      paint(timestamp);
      if(!enabled||!playing)return;
      if(progress<1)travelFrame=window.requestAnimationFrame(advance);
      else finish(focus,false,timestamp);
    };
    travelFrame=window.requestAnimationFrame(advance);
  }
  function onScroll(){
    if(settled||!enabled||!geometry)return;
    if(playing){
      // Consume residual mobile momentum without moving the fixed paper or
      // cancelling its clock. No per-frame scroll writes during playback.
      if(playbackScrollY!==null&&Math.abs(window.scrollY-playbackScrollY)>1)
        window.scrollTo({top:playbackScrollY,behavior:'auto'});
      return;
    }
    const offset=window.scrollY-geometry.start;
    if(offset>=geometry.distance-2){
      retire();
      if(offset>=geometry.distance+(geometry.pageHeight||geometry.storyHeight))window.WeddingCameraStory?.complete();
      return;
    }
    if(offset>8){startTravel();return;}
    progress=0;elapsed=0;schedule();
  }
  function configure(){
    if(settled||(window.WeddingMedia&&!window.WeddingMedia.released))return;
    if(window.WeddingCameraStory?.played&&!playing){retire();return;}
    prepare();
    if(!rig||!paper||preference.matches||(window.WeddingCameraStory&&!window.WeddingCameraStory.ready)||assetFailed||images.some(img=>!img||!img.complete||!img.naturalWidth)||!pixelsReady()){
      if(playing)finish(false,true);else clear();
      return;
    }
    // Mobile address bars change innerHeight during scrolling. Freeze the
    // geometry for one flight; a real width/orientation change settles it.
    if(playing&&geometry&&geometry.viewportWidth===window.innerWidth)return;
    if(playing){finish(false,true);return;}
    if(trail)trail.clear();
    try{
      const rect=sequence.getBoundingClientRect(),width=sequence.clientWidth,height=window.innerHeight;
      // Keep the paper at its actual image height. The underlay and chapter
      // already share one viewport; a 1.15vh track added a visible 0.15vh gap.
      const sheetHeight=cover.offsetHeight,distance=Math.min(height,sheetHeight);
      const art=chapter.querySelector('.reference-art');
      const actorWidth=math.actorWidth(width),storyHeight=art?.offsetHeight||width*1.5;
      const pageHeight=chapter.offsetHeight||storyHeight,storyTop=art?.offsetTop||0;
      const readingOffset=Math.max(0,sheetHeight-height);
      geometry={width,height,storyHeight,storyTop,pageHeight,left:rect.left,viewportWidth:window.innerWidth,actorWidth,actorHeight:actorWidth*340/240,start:rect.top+window.scrollY+readingOffset,distance};
      const values=[height,sheetHeight+height,sheetHeight,-readingOffset,readingOffset+height*.60,actorWidth];
      properties.forEach((name,i)=>root.style.setProperty(name,values[i]+'px'));
      flight=bridge.makeFlight(math,window.WeddingCameraMath,geometry);
      paper.configure(geometry);root.classList.add('star-turn');enabled=true;
      onScroll();
    }catch(_){clear();}
  }
  function watch(img){if(!img)return;img.addEventListener('load',configure);img.addEventListener('error',()=>{assetFailed=true;configure();});}
  images.forEach(watch);
  document.addEventListener('camera-assets-ready',configure);
  document.addEventListener('camera-media-released',configure);
  document.addEventListener('camera-story-started',()=>{if(!playing)retire();});
  window.addEventListener('pagehide',()=>{if(playing)finish(false,true);});
  window.addEventListener('scroll',onScroll,{passive:true});
  window.addEventListener('resize',configure,{passive:true});window.addEventListener('pageshow',configure);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){if(playing)finish(false,true);if(trail)trail.clear();}});
  // Only consume single-finger scrolling during the finite transition. Outside
  // it, reading is native. Multi-touch zoom and modified wheel remain available.
  const guard=event=>{
    if(!playing||event.ctrlKey||event.metaKey||(event.touches&&event.touches.length>1))return;
    if(event.cancelable)event.preventDefault();
  };
  window.addEventListener('wheel',guard,{passive:false});
  window.addEventListener('touchmove',guard,{passive:false});
  window.addEventListener('keydown',event=>{
    if(!playing)return;
    if(event.key==='Escape'){event.preventDefault();chapter.classList.add('keyboard-landing');finish(true,true);}
    else if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(event.key))guard(event);
    else if(event.key==='Tab')finish(false,true);
  });
  if(preference.addEventListener)preference.addEventListener('change',configure);else if(preference.addListener)preference.addListener(configure);
  const pointerLanding=()=>chapter.classList.remove('keyboard-landing');
  entry.addEventListener('pointerdown',pointerLanding,{passive:true});
  entry.addEventListener('touchstart',pointerLanding,{passive:true});
  entry.addEventListener('keydown',event=>{
    if(event.key==='Enter'||event.key===' ')chapter.classList.add('keyboard-landing');
  });
  entry.addEventListener('click',event=>{
    if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||(event.button!==undefined&&event.button!==0)||!enabled||!geometry)return;
    if(event.detail>0)pointerLanding();
    event.preventDefault();startTravel(true);
  });
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(configure);
  configure();
})();
