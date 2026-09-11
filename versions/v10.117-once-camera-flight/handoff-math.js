(function(scope){
  'use strict';
  const COVER_DURATION=3800,APPROACH_DURATION=1150;
  const clamp=x=>Math.max(0,Math.min(1,x));
  const mix=(a,b,t)=>a+(b-a)*t;
  const ease=x=>{x=clamp(x);return x*x*x*(x*(x*6-15)+10);};
  function cameraView(g){
    return {g:{width:g.width,height:g.height,left:g.left,viewportWidth:g.viewportWidth,actorWidth:g.actorWidth},
      rect:{left:g.left,top:0,width:g.width,height:g.storyHeight||g.width*1.5}};
  }
  function bezier(a,b,c,d,t){
    const u=1-t;return{x:u*u*u*a.x+3*u*u*t*b.x+3*u*t*t*c.x+t*t*t*d.x,
      y:u*u*u*a.y+3*u*u*t*b.y+3*u*t*t*c.y+t*t*t*d.y};
  }
  // Prepare once, not in a scroll handler or the frame loop. One route spans
  // BOTH canvases: letting go -> banking towards camera -> touching shutter.
  function makeFlight(math,camera,g){
    const view=cameraView(g),ends=math.sample(.64,g).actors;
    const cameraPlan=camera.makePlan(math,view.g,view.rect,ends);
    const targets=[cameraPlan.press,cameraPlan.girl];
    const lanes=targets.map((target,i)=>{
      const release=math.releaseAt(i),start=math.sample(release,g).actors[i];
      const from=camera.center(start),to=camera.center(target),eps=.00001;
      const before=camera.center(math.sample(release-eps,g).actors[i]);
      const releaseTime=release*5600*COVER_DURATION/math.DURATION;
      const step=eps*5600*COVER_DURATION/math.DURATION;
      const velocity={x:(from.x-before.x)/step,y:(from.y-before.y)/step};
      // Brief inertia follows the paper; then separate lanes arc to the camera.
      // Limit coast by left-edge clearance so the girl never sails off screen.
      const coast=Math.max(1,Math.min(40,(from.x-g.left-g.actorWidth*.54)/Math.max(.01,-velocity.x)));
      return {start,target,from,to,releaseTime,velocity,coast};
    });
    return {math,camera,g,view,cameraPlan,lanes};
  }
  const channels=['scale','lean','spineAngle','cameraYaw','arm','freeArm','kick','legFollow',
    'clothLag','clothRipple','gazeX','gazeY','eyeOpen','headYaw','headAngle','headNod',
    'headShift','torsoTurn','elbowBend','skirtSway'];
  function actorsAt(ms,flight){
    const {math,camera,g,lanes}=flight;
    const p=math.progressAt(Math.min(COVER_DURATION,Math.max(0,ms))*math.DURATION/COVER_DURATION);
    const initial=ms<=lanes[1].releaseTime?math.sample(p,g).actors:null;
    return lanes.map((lane,i)=>{
      if(ms<=lane.releaseTime)return initial[i];
      const {start,target,from,to,releaseTime,velocity,coast}=lane;
      const dt=ms-releaseTime,duration=COVER_DURATION+APPROACH_DURATION-releaseTime;
      const u=ease(dt/duration);
      const lead=i?{x:from.x+g.width*.45,y:from.y}:from;
      const near=i?{x:to.x-g.width*.025,y:to.y+g.actorWidth*.6}
        :{x:to.x-g.width*.10,y:to.y-g.height*.035};
      const point=bezier(from,lead,near,to,u);
      const inertia=coast*(1-Math.exp(-dt/coast))*(1-u);
      point.x+=velocity.x*inertia;point.y+=velocity.y*inertia;
      const a={...start,opacity:1,grip:0,handhold:0};
      for(const key of channels)a[key]=mix(start[key]||0,target[key]||0,u);
      // Look to the camera before the shoulders/arms complete their turn.
      const look=ease(dt/(duration*.55));
      a.gazeX=mix(start.gazeX||0,target.gazeX,look);
      a.gazeY=mix(start.gazeY||0,target.gazeY,look);
      const local=math.rotate(120,170,a.lean);
      a.x=point.x-local.x*a.scale;a.y=point.y-local.y*a.scale;
      a.hand=camera.hand(a,false);a.leftHand=camera.hand(a,true);
      a.joinedHand=i?a.leftHand:a.hand;
      const foot=math.rotate(120,330,a.lean);
      a.emitter={x:a.x+foot.x*a.scale,y:a.y+foot.y*a.scale};
      return a;
    });
  }
  const api={makeFlight,actorsAt,cameraView,COVER_DURATION,APPROACH_DURATION};
  if(typeof module==='object'&&module.exports)module.exports=api;else scope.WeddingHandoffMath=api;
})(typeof window==='object'?window:globalThis);
