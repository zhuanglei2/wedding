/* One deterministic driver: the character follows the sheet's projected edge. */
(function (scope) {
  'use strict';
  const clamp = value => Math.max(0, Math.min(1, value));
  const ease = value => { const x = clamp(value); return x*x*(3-2*x); };
  const lerp = (a,b,p) => a+(b-a)*p;
  function sample(progress, g) {
    const p=clamp(progress);
    const approach=ease(p/.24);
    const pull=ease((p-.27)/.55);
    const departure=ease((p-.82)/.18);
    const angle=105*pull;
    const radians=angle*Math.PI/180;
    const depth=g.width*2.8;
    // rotateY(+angle) pushes the right edge away from the viewer.
    const edge=g.left+g.width*Math.cos(radians)/(1+g.width*Math.sin(radians)/depth);
    const gripY=g.height*.60;
    const xAtGrip=edge-g.actorWidth*.75;
    const yAtGrip=gripY-g.actorHeight*.55;
    let x=lerp(g.viewportWidth+g.actorWidth,xAtGrip,approach);
    let y=lerp(g.height*.16,yAtGrip,approach)-Math.sin(approach*Math.PI)*g.height*.07;
    let tilt=lerp(-18,0,approach);
    if (p>=.24 && p<=.82) { x=xAtGrip; y=yAtGrip; tilt=0; }
    if (p>.82) {
      x=lerp(xAtGrip,-g.actorWidth*1.4,departure);
      y=lerp(yAtGrip,-g.actorHeight*1.3,departure);
      tilt=-22*departure;
    }
    return {p,angle,depth,edge,gripY,x,y,tilt,shade:Math.sin(pull*Math.PI)*.5,opacity:p<=0||p>=1?0:Math.min(1,p/.035,1-departure)};
  }
  const api={sample,clamp};
  if (typeof module==='object' && module.exports) module.exports=api;
  else scope.WeddingPageTurn=api;
})(typeof window==='object'?window:globalThis);
