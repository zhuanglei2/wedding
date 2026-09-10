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
