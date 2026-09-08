/* A shared deterministic pose drives the paper, shoulders and gripping hands. */
(function(scope){
  'use strict';
  const clamp=x=>Math.max(0,Math.min(1,x));
  const ease=x=>{x=clamp(x);return x*x*(3-2*x);};
  const mix=(a,b,t)=>a+(b-a)*t;
  const rad=x=>x*Math.PI/180;
  const rotate=(x,y,a)=>({x:x*Math.cos(rad(a))-y*Math.sin(rad(a)),y:x*Math.sin(rad(a))+y*Math.cos(rad(a))});
  const DURATION=4600, SEGMENTS=12;
  function paper(p,g){
    const pull=ease((p-.37)/.43),theta=112*pull;
    const curl=25*Math.sin(pull*Math.PI);
    const length=g.width/SEGMENTS,depth=g.width*2.8;
    let x=0,z=0;const strips=[];
    for(let i=0;i<SEGMENTS;i++){
      const angle=theta+curl*Math.sin((i+.5)/SEGMENTS*Math.PI/2);
      strips.push({x,z,angle,width:length+.6,shade:Math.min(.46,Math.abs(angle)/260)});
      x+=length*Math.cos(rad(angle));z-=length*Math.sin(rad(angle));
    }
    return{strips,depth,edge:g.left+x/(1-z/depth),z,pull,angle:theta};
  }
  const layouts=[
    {shoulder:{x:184,y:181},left:{x:64,y:181},hand:65,body:[30,0,180,263],legs:[[73,237,60,99],[131,237,60,99]]},
    {shoulder:{x:184,y:205},left:{x:65,y:205},hand:65,body:[-5,24,260,310]}
  ];
  function actor(p,g,sheet,index){
    const layout=layouts[index],scale=g.actorWidth/240;
    const arrival=ease((p-index*.025)/.245);
    const reach=ease((p-.23)/.11),release=ease((p-.79)/.07),exit=ease((p-.85)/.15);
    const grip=reach*(1-release);
    const flutter=Math.sin(p*Math.PI*12+index*Math.PI)*16*(1-reach);
    const arm=mix(-20+flutter,-88,grip)+release*22;
    const lean=mix(17*(1-arrival),-17*Math.sin(sheet.pull*Math.PI),reach)-exit*20;
    const wave=(1-reach)*Math.sin(p*Math.PI*10+index)*22;
    const freeArm=24+wave+release*Math.sin((p-.79)*Math.PI*9)*38;
    const kick=Math.sin(p*Math.PI*11)*(1-grip)*20;
    const hand=rotate(0,layout.hand,arm);
    const localGrip=rotate(layout.shoulder.x+hand.x,layout.shoulder.y+hand.y,lean);
    const baseY=g.height*(index===0?.51:.77);
    const gripY=g.height*.60+(baseY-g.height*.60)/(1-sheet.z/sheet.depth);
    // The shoulder moves when the torso leans; subtract the rotated actual
    // hand endpoint, not an approximate sprite bounding-box anchor.
    const heldX=sheet.edge-localGrip.x*scale,heldY=gripY-localGrip.y*scale;
    const fromX=g.viewportWidth+80+index*70,fromY=g.height*(.07+index*.14);
    let x=mix(fromX,heldX,arrival),y=mix(fromY,heldY,arrival)-Math.sin(arrival*Math.PI)*40;
    x=mix(x,-g.actorWidth*2-index*60,exit);y=mix(y,-g.actorWidth*2,exit);
    const opacity=p<=0||p>=1?0:Math.min(ease(p/.04),1-exit);
    const actualHand={x:x+localGrip.x*scale,y:y+localGrip.y*scale};
    const foot=rotate(120,330,lean);
    return {x,y,scale,lean,arm,freeArm,kick,grip,opacity,index,
      hand:actualHand,target:{x:sheet.edge,y:gripY},emitter:{x:x+foot.x*scale,y:y+foot.y*scale}};
  }
  function sample(progress,g){
    const p=clamp(progress),sheet=paper(p,g);
    const actors=[actor(p,g,sheet,0),actor(p,g,sheet,1)];
    return {p,...sheet,actors,emitters:actors.map(a=>a.emitter),opacity:Math.max(...actors.map(a=>a.opacity))};
  }
  const api={sample,clamp,layouts,DURATION,SEGMENTS,rotate};
  if(typeof module==='object'&&module.exports)module.exports=api;else scope.WeddingPageTurn=api;
})(typeof window==='object'?window:globalThis);
