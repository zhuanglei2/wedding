/* One seekable choreography: approach -> grip/weight -> pull -> free flight.
   The actors deliberately release while visible; the paper keeps its momentum. */
(function(scope){
  'use strict';
  const clamp=x=>Math.max(0,Math.min(1,x));
  const ease=x=>{x=clamp(x);return x*x*(3-2*x);};
  const mix=(a,b,t)=>a+(b-a)*t,rad=x=>x*Math.PI/180;
  const rotate=(x,y,a)=>({x:x*Math.cos(rad(a))-y*Math.sin(rad(a)),y:x*Math.sin(rad(a))+y*Math.cos(rad(a))});
  const DURATION=5600,SEGMENTS=24,DEPART_AT=.85,JOIN_AT=.79;
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
      const t=1-Math.pow(1-clamp(p/arrivalEnd),2);
      const from={x:g.left+g.width*(.76-index*.14),y:-g.actorWidth*1.6-index*55};
      const c1={x:g.left+g.width*(.24-index*.08),y:g.height*(.12+index*.12)};
      const c2={x:end.x-g.width*.13,y:end.y-g.height*.12};
      const point=bezier(from,c1,c2,end,t);
      a.x=point.x;a.y=point.y;a.grip=0;
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
      const departure=clamp((p-DEPART_AT)/(1-DEPART_AT)),travel=departure*departure;
      const hover=p>meetAt&&p<DEPART_AT?2*Math.sin((p-meetAt)/(DEPART_AT-meetAt)*Math.PI)**2:0;
      const bank=ease(departure/.65);
      a={...at,grip:0,lean:mix(mix(at.lean,-3,join),27,bank),
        arm:mix(mix(at.arm,-12,join),8,bank),freeArm:mix(mix(at.freeArm,12,join),-8,bank),
        kick:mix(at.kick,0,join)+4*Math.sin(departure*Math.PI)*bank,
        scale:mix(mix(at.scale,g.actorWidth/240,join),g.actorWidth/240*.78,ease(departure))};
      const local=rotate(120,170,a.lean);
      a.x=point.x+g.width*.72*travel-local.x*a.scale;
      a.y=point.y-(g.height*.64+g.actorWidth)*travel+hover-local.y*a.scale;
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
    const anchor={x:g.left+g.width*.5+g.width*.72*departure*departure,
      y:g.height*.465-(g.height*.64+g.actorWidth)*departure*departure+3*Math.sin(clamp((p-JOIN_AT)/.06)*Math.PI)**2};
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
      a.spineAngle=a.headAngle*.60*ease((p-releaseAt(i))/.06);
      // Cloth follows a delayed acceleration envelope; shoulders and held
      // hands stay fixed. Hem motion increases with distance from the waist.
      const lagLaunch=ease((p-.865)/.105);
      const settle=Math.sin(clamp((p-.65)/.15)*Math.PI);
      a.clothLag=8*lagLaunch+3*pull-2*settle;
      a.clothRipple=1.2*Math.sin(clamp((p-.64)/.20)*Math.PI);
      a.torsoTurn=(i===0?1:-1)*turn*(1-away);
      a.elbowBend=2.5*turn*(1-launch)+1.5*pull;
      a.legFollow=7*lagLaunch-2*settle;
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
  function sample(progress,g){
    const p=clamp(progress),sheet=paper(p,g),actors=[actor(p,g,sheet,0),actor(p,g,sheet,1)];
    const couple=connectedUpperBody(p,expressions(p,g,holdHands(p,g,actors)));
    return{p,...sheet,actors:couple,emitters:couple.map(a=>a.emitter),opacity:Math.max(...couple.map(a=>a.opacity))};
  }
  const api={sample,clamp,layouts,DURATION,SEGMENTS,rotate,releaseAt,actorWidth,waist,DEPART_AT,JOIN_AT};
  if(typeof module==='object'&&module.exports)module.exports=api;else scope.WeddingPageTurn=api;
})(typeof window==='object'?window:globalThis);
