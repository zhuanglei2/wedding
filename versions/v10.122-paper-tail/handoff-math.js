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
