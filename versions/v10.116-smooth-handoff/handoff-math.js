(function(scope){
  'use strict';
  const COVER_DURATION=3800,RELEASED=.64,JOINED=.79;
  const clamp=x=>Math.max(0,Math.min(1,x));
  // Preserve all paper contacts, then keep rejoining motion alive until handoff.
  // Hermite slopes: 1 at the last release, 0 at the camera approach's resting start.
  function actorProgress(p){
    p=clamp(p);if(p<=RELEASED)return p;
    const span=1-RELEASED,t=(p-RELEASED)/span,t2=t*t,t3=t2*t;
    return (2*t3-3*t2+1)*RELEASED+(t3-2*t2+t)*span+(-2*t3+3*t2)*JOINED;
  }
  function cameraView(g){
    return {g:{width:g.width,height:g.height,left:g.left,viewportWidth:g.viewportWidth,actorWidth:g.actorWidth},
      rect:{left:g.left,top:0,width:g.width,height:g.storyHeight||g.width*1.5}};
  }
  const api={actorProgress,cameraView,COVER_DURATION};
  if(typeof module==='object'&&module.exports)module.exports=api;else scope.WeddingHandoffMath=api;
})(typeof window==='object'?window:globalThis);
