/* Coordinate-only preflight. Not a character animation or video renderer. */
(function(root){
'use strict';
const W=1400,H=3282,DURATION=10,COUNT=48;
const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x);},mix=(a,b,t)=>a+(b-a)*t;
function curve(a,b,c,d,t){t=clamp(t);const u=1-t;return {x:u*u*u*a.x+3*u*u*t*b.x+3*u*t*t*c.x+t*t*t*d.x,y:u*u*u*a.y+3*u*u*t*b.y+3*u*t*t*c.y+t*t*t*d.y};}
function hermite(a,b,va,vb,t,span){t=clamp(t);return (2*t**3-3*t*t+1)*a+(t**3-2*t*t+t)*va*span+(-2*t**3+3*t*t)*b+(t**3-t*t)*vb*span;}
function sheet(theta){
 let x=0,z=0;const strips=[],depth=W*8,length=W/COUNT,curl=18*Math.sin(theta/170*Math.PI);
 for(let i=0;i<COUNT;i++){const angle=-(theta+curl*(.5-.5*Math.cos((i+.5)/COUNT*Math.PI))),r=angle*Math.PI/180;
 strips.push({x,z,angle,shade:.16*(1-Math.max(0,Math.cos(r))),light:.05*Math.max(0,-Math.sin(r)),backShade:.08*Math.abs(Math.sin(r))});
 x+=length*Math.cos(r);z-=length*Math.sin(r);
 }
 return {strips,z,depth,edge:x/(1-z/depth)};
}
// Release while there is still enough room for the full character envelope.
let low=0,high=90;for(let i=0;i<50;i++){const mid=(low+high)/2;if(sheet(mid).edge>W*.42)low=mid;else high=mid;}
const RELEASE_ANGLE=(low+high)/2;
const gripY=(s,i)=>H*.5+(H*(i===0?.35:.57)-H*.5)/(1-s.z/s.depth);
function held(s,i){const hand={x:s.edge,y:gripY(s,i)};return{x:hand.x-W*.14,y:hand.y,hand};}
function sample(seconds){
 const t=Math.max(0,Math.min(DURATION,seconds));
 const releaseSpeed=RELEASE_ANGLE*.25;
 const theta=t<1.6?0:t<=4?hermite(0,RELEASE_ANGLE,0,releaseSpeed,(t-1.6)/2.4,2.4):hermite(RELEASE_ANGLE,170,releaseSpeed,0,(t-4)/1.5,1.5);
 const paper=sheet(theta),releaseSheet=sheet(RELEASE_ANGLE);
 const actors=[0,1].map(i=>{
  let a=held(paper,i);const released=held(releaseSheet,i);
  if(t<1){a.x-=W*.06*(1-ease(t));a.y-=H*.03*(1-ease(t));a.hand={x:a.hand.x-W*.06*(1-ease(t)),y:a.hand.y-H*.03*(1-ease(t))};}
  if(t>4){
   const endAt=i===0?5.2:5.8,goal={x:W*(i===0?.41:.63),y:H*.38};
   const eps=.00001,previous=held(sheet(RELEASE_ANGLE-releaseSpeed*eps),i),span=endAt-4;
   const velocity={x:(released.x-previous.x)/eps,y:(released.y-previous.y)/eps};
   const point=curve(released,{x:released.x+velocity.x*span/3,y:released.y+velocity.y*span/3},goal,goal,(t-4)/span);
   const relax=ease((t-4)/span);
   a={...point,hand:{x:point.x+mix(W*.14,(i===0?1:-1)*W*.11,relax),y:point.y}};
  }
  if(t>=5.8){const q=ease((t-5.8)/.6);a.hand={x:mix(a.hand.x,W*.52,q),y:mix(a.hand.y,H*.38,q)};}
  if(t>=7.4){const u=clamp((t-7.4)/1.8),dx=W*.88*u*u,dy=-H*.65*u*u;a.x+=dx;a.y+=dy;a.hand.x+=dx;a.hand.y+=dy;}
  return {...a,index:i,width:W*.22,height:H*.145,visible:t>0&&t<9.2};
 });
 const phase=t<1?'靠近右侧自由边':t<1.6?'抓稳后蓄力':t<4?'向左拉纸，抓点同步':t<5.2?'画内松手，连续转弯':t<5.8?'男孩悬停等待':t<6.4?'女孩靠近，伸手相牵':t<7.4?'牵稳手，相视停留 1 秒':t<9.2?'保持牵手，共同飞离':'星尾消散，保留真实第二层';
 const stars=t<1?.2:t<7.4?0:t<9.2?.65:.65*(1-ease((t-9.2)/.8));
 return {t,p:t===0?0:t>=5.5?1:.5,theta,paper,actors,phase,stars,joined:t>=6.4&&t<9.2,front:t<=1.6,finished:t>=5.5};
}
const carrier={width:H*9/16,height:H,contentWidth:W,padX:(H*9/16-W)/2};
const api={W,H,DURATION,COUNT,RELEASE_ANGLE,carrier,sample};
if(typeof module==='object'&&module.exports)module.exports=api;else root.SeamStudy=api;
})(typeof window==='object'?window:globalThis);
