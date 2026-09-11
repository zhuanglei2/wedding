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
