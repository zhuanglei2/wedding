(function(scope){
  'use strict';
  const node=typeof module==='object'&&module.exports;
  const base=node?require('../v10.114-clean-photo-layer/camera-story-math.js'):scope.WeddingCameraMath;
  const bridge=node?require('./handoff-math.js'):scope.WeddingHandoffMath;
  function makePlan(math,g,rect,startActors,flight){
    if(!flight)return base.makePlan(math,g,rect,startActors);
    return {...flight.cameraPlan,starts:startActors,flight};
  }
  function sample(ms,plan){
    const state=base.sample(ms,plan);
    if(plan.flight&&ms<bridge.APPROACH_DURATION){
      state.actors=bridge.actorsAt(bridge.COVER_DURATION+Math.max(0,ms),plan.flight);
      state.emitters=state.actors.map(a=>a.emitter);
      state.opacity=Math.max(...state.actors.map(a=>a.opacity));
    }
    return state;
  }
  const api={...base,makePlan,sample};
  if(node)module.exports=api;else scope.WeddingCameraMath=api;
})(typeof window==='object'?window:globalThis);
