'use strict';
const model=SeamStudy,stage=document.getElementById('stage'),cover=document.getElementById('cover'),underlay=document.getElementById('underlay'),paper=document.getElementById('paper'),slider=document.getElementById('time'),buttons=[...document.querySelectorAll('button[data-time]')];
let ready=false;
buttons.forEach(b=>b.disabled=true);
const surface=WeddingPaperSurface.create(paper,cover,model.COUNT);
function paint(){
 if(!ready)return;
 const s=model.sample(Number(slider.value)),scale=stage.clientWidth/model.W;
 surface.configure({width:stage.clientWidth});
 paper.style.perspective=stage.clientWidth*8+'px';
 surface.paint({p:s.front?0:s.finished?1:.5,strips:s.paper.strips.map(p=>({...p,x:p.x*scale,z:p.z*scale}))});
 cover.style.opacity=s.front?'1':'0';
 document.getElementById('time-value').textContent=s.t.toFixed(2)+' 秒';
 document.getElementById('status').textContent=s.phase;
 document.getElementById('stars').textContent=Math.round(s.stars*100)+'%';
 document.getElementById('guides').style.opacity=document.getElementById('show-guides').checked?'1':'0';
 s.actors.forEach((a,i)=>{
  const g=document.getElementById(i===0?'boy':'girl');g.style.opacity=a.visible?'1':'0';
  const e=g.querySelector('ellipse');e.setAttribute('cx',a.x);e.setAttribute('cy',a.y);e.setAttribute('rx',a.width/2);e.setAttribute('ry',a.height/2);
  const l=g.querySelector('line');l.setAttribute('x1',a.x);l.setAttribute('y1',a.y);l.setAttribute('x2',a.hand.x);l.setAttribute('y2',a.hand.y);
  const c=g.querySelector('circle');c.setAttribute('cx',a.hand.x);c.setAttribute('cy',a.hand.y);
  const text=g.querySelector('text');text.setAttribute('x',a.x);text.setAttribute('y',a.y-40);
 });
 let contact='—';
 if(s.t>=1&&s.t<=4)contact=Math.max(...s.actors.map(a=>Math.abs(a.hand.x-s.paper.edge))).toFixed(3)+' px（源坐标）';
 if(s.joined)contact=Math.hypot(s.actors[0].hand.x-s.actors[1].hand.x,s.actors[0].hand.y-s.actors[1].hand.y).toFixed(3)+' px（共同牵手点）';
 document.getElementById('contact').textContent=contact;
}
const load=img=>img.decode();
Promise.all([cover,underlay,...surface.images].map(load)).then(()=>{ready=true;slider.disabled=false;buttons.forEach(b=>b.disabled=false);paint();}).catch(()=>{document.getElementById('status').textContent='原图加载失败，本检查页未启动；请检查本地资源路径。';});
slider.addEventListener('input',paint);buttons.forEach(b=>b.addEventListener('click',()=>{slider.value=b.dataset.time;paint();}));
document.getElementById('show-guides').addEventListener('change',paint);
new ResizeObserver(paint).observe(stage);
document.getElementById('carrier').textContent=model.carrier.width.toFixed(3)+' × 3282；每侧 '+model.carrier.padX.toFixed(3)+' px 安全区（导出时等比取整）';
