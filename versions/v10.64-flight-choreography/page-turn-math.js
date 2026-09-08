/* One seekable choreography: approach -> grip/weight -> pull -> free flight.
   The actors deliberately release while visible; the paper keeps its momentum. */
(function(scope){
  'use strict';
  const clamp=x=>Math.max(0,Math.min(1,x));
  const ease=x=>{x=clamp(x);return x*x*(3-2*x);};
  const mix=(a,b,t)=>a+(b-a)*t,rad=x=>x*Math.PI/180;
  const rotate=(x,y,a)=>({x:x*Math.cos(rad(a))-y*Math.sin(rad(a)),y:x*Math.sin(rad(a))+y*Math.cos(rad(a))});
  const DURATION=3900,SEGMENTS=12;
  const releaseAt=i=>.64+i*.02;
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
    const pull=theta/158,curl=12*Math.sin(pull*Math.PI);
    const length=g.width/SEGMENTS,depth=g.width*2.8;
    let x=0,z=0;const strips=[];
    for(let i=0;i<SEGMENTS;i++){
      const angle=-(theta+curl*Math.sin((i+.5)/SEGMENTS*Math.PI/2))||0;
      const face=Math.abs(rad(angle));
      strips.push({x,z,angle,width:length+.6,
        shade:.32*(1-Math.max(0,Math.cos(face))),
        light:.12*Math.max(0,Math.sin(face))*Math.max(0,Math.cos(face)),
        backShade:.22*Math.max(0,Math.sin(face))});
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
    const lean=-38*flight+10*press-29*effort;
    const arm=mix(-35,-86,reach)-14*effort+10*Math.sin(p*28+index)*flight;
    const freeArm=48+20*Math.sin(p*24+index)*flight+18*effort;
    const kick=26*Math.sin(p*32+index*1.2)*flight-10*effort;
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
      const u=clamp((p-release)/(.98+index*.015-release));
      // Loop up and away across visible space, instead of disappearing behind
      // the page's left edge. The second character follows a delayed arc.
      const t=Math.pow(u,1.25);
      const c1={x:at.x-g.width*.09,y:at.y-g.height*.20};
      const c2={x:g.left+g.width*.66,y:g.height*(.11+index*.04)};
      const to={x:g.left+g.width*(.98-index*.08),y:-g.actorWidth*1.8-index*20};
      const point=bezier(at,c1,c2,to,t),bank=ease(u/.45);
      a={...at,...point,grip:0,
        lean:mix(at.lean,42,bank),arm:mix(at.arm,32,bank),freeArm:mix(at.freeArm,-42,bank),
        kick:mix(at.kick,24*Math.sin(u*12+index),ease(u/.25)),
        scale:mix(at.scale,g.actorWidth/240*.72,ease(u))};
    }
    const l=layouts[index],tip=rotate(0,l.hand,a.arm),hand=rotate(l.shoulder.x+tip.x,l.shoulder.y+tip.y,a.lean);
    const foot=rotate(120,330,a.lean);
    // Only fade at the very end, once the flight has visibly left the frame.
    const opacity=p<=0||p>=1?0:1-ease((p-.96)/.04);
    return{...a,opacity,hand:{x:a.x+hand.x*a.scale,y:a.y+hand.y*a.scale},emitter:{x:a.x+foot.x*a.scale,y:a.y+foot.y*a.scale}};
  }
  function sample(progress,g){
    const p=clamp(progress),sheet=paper(p,g),actors=[actor(p,g,sheet,0),actor(p,g,sheet,1)];
    return{p,...sheet,actors,emitters:actors.map(a=>a.emitter),opacity:Math.max(...actors.map(a=>a.opacity))};
  }
  const api={sample,clamp,layouts,DURATION,SEGMENTS,rotate,releaseAt};
  if(typeof module==='object'&&module.exports)module.exports=api;else scope.WeddingPageTurn=api;
})(typeof window==='object'?window:globalThis);
