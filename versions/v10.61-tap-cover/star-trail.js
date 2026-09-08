/* Small finite pool; particles follow the two figures, never the pointer.
   Live-web lifecycle: after movement stops, survivors fade in under 0.9s. */
(function(scope){
  'use strict';
  const MAX=36;
  const seed=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
  function anchors(s,g){
    const angle=s.tilt*Math.PI/180,c=Math.cos(angle),sn=Math.sin(angle);
    return [.23,.78].map(f=>{
      const dx=(f-.75)*g.actorWidth,dy=.36*g.actorHeight;
      return {x:s.x+.75*g.actorWidth+dx*c-dy*sn,y:s.y+.55*g.actorHeight+dx*sn+dy*c};
    });
  }
  class Pool{
    constructor(){this.slots=Array(MAX).fill(null);this.cursor=0;this.serial=0;this.last=null;this.carry=0;}
    clear(){this.slots.fill(null);this.last=null;this.carry=0;}
    update(s,g,time){
      if(s.p<=0||s.p>=1||s.opacity<.05){this.last=null;this.carry=0;return;}
      const points=anchors(s,g);
      if(!this.last){this.last={points,time};return;}
      const dx=points[0].x-this.last.points[0].x,dy=points[0].y-this.last.points[0].y;
      const distance=Math.hypot(dx,dy);
      // A scroll jump/resize must not draw a streak across the whole screen.
      if(distance>g.viewportWidth*.65||time-this.last.time>180){this.last={points,time};this.carry=0;return;}
      if(distance<.25) return;
      this.carry+=distance;
      const count=Math.min(6,Math.floor(this.carry/9));
      if(count) this.carry%=9;
      for(let i=1;i<=count;i++) for(let emitter=0;emitter<2;emitter++){
        const a=this.last.points[emitter],b=points[emitter],fraction=i/count;
        const x=a.x+(b.x-a.x)*fraction,y=a.y+(b.y-a.y)*fraction;
        if(x<-30||x>g.viewportWidth+30||y<-30||y>g.height+30)continue;
        const n=++this.serial;
        this.slots[this.cursor]={born:time,life:640+seed(n)*240,x,y,
          vx:(seed(n*3)-.5)*28-dx/distance*12,vy:8+seed(n*7)*18,
          radius:n%3===0?3.7+seed(n*5)*2.7:1.1+seed(n*5)*1.2,
          star:n%3===0,spin:(seed(n*11)-.5)*1.4,angle:seed(n*13)*Math.PI,
          color:n%3===0?'#fff0bd':n%2?'#e9bd72':'#f5dba0'};
        this.cursor=(this.cursor+1)%MAX;
      }
      this.last={points,time};
    }
    sample(time){
      const result=[];
      this.slots.forEach((p,i)=>{
        if(!p)return;
        const age=(time-p.born)/p.life;
        if(age>=1){this.slots[i]=null;return;}
        if(age<0)return;
        const seconds=(time-p.born)/1000;
        result.push({...p,x:p.x+p.vx*seconds,y:p.y+p.vy*seconds+12*seconds*seconds,
          radius:p.radius*(1-.55*age),angle:p.angle+p.spin*seconds,
          opacity:Math.min(1,age/.08)*Math.pow(1-age,1.6)*.86});
      });
      return result;
    }
  }
  function create(canvas){
    if(!canvas||!canvas.getContext)return null;
    let ctx;try{ctx=canvas.getContext('2d',{alpha:true});}catch(_){return null;}
    if(!ctx)return null;
    const pool=new Pool();let frame=0,width=0,height=0,dpr=1;
    function clear(){
      if(frame)scope.cancelAnimationFrame(frame);
      frame=0;pool.clear();ctx.clearRect(0,0,width,height);
    }
    function draw(time){
      frame=0;ctx.clearRect(0,0,width,height);
      const visible=pool.sample(time);
      visible.forEach(p=>{
        ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);
        ctx.globalAlpha=p.opacity;ctx.fillStyle=p.color;
        ctx.shadowColor='#edc372';ctx.shadowBlur=p.star?7:3;
        ctx.beginPath();
        if(p.star){
          for(let i=0;i<10;i++){
            const angle=-Math.PI/2+i*Math.PI/5,r=p.radius*(i%2?.43:1);
            const x=Math.cos(angle)*r,y=Math.sin(angle)*r;
            if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
          }
          ctx.closePath();
        }else ctx.arc(0,0,p.radius,0,Math.PI*2);
        ctx.fill();ctx.restore();
      });
      if(visible.length)frame=scope.requestAnimationFrame(draw);
    }
    return {clear,update(state,g,time){
      if(width!==g.viewportWidth||height!==g.height){
        clear();width=g.viewportWidth;height=g.height;
        dpr=Math.min(scope.devicePixelRatio||1,1.75,Math.sqrt(1800000/(width*height)));
        canvas.width=Math.ceil(width*dpr);canvas.height=Math.ceil(height*dpr);
        ctx.setTransform(dpr,0,0,dpr,0,0);
      }
      pool.update(state,g,time);
      if(!frame&&pool.slots.some(Boolean))frame=scope.requestAnimationFrame(draw);
    }};
  }
  const api={Pool,anchors,MAX,create};
  if(typeof module==='object'&&module.exports)module.exports=api;
  else scope.WeddingStarTrail=api;
})(typeof window==='object'?window:globalThis);
