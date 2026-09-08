const assert=require('node:assert/strict'),m=require('./geometry.js');
for(let t=0;t<=10;t+=.005){
 const s=m.sample(t);assert(Number.isFinite(s.paper.edge));assert.equal(s.paper.strips.length,m.COUNT);
 if(t>=1&&t<=4)for(const a of s.actors){assert(Math.abs(a.hand.x-s.paper.edge)<1e-8);assert(a.x-a.width/2>0);assert(a.x+a.width/2<m.W);assert(a.y-a.height/2>0);assert(a.y+a.height/2<m.H);}
 if(t>=6.4&&t<9.2){assert(Math.hypot(s.actors[0].hand.x-s.actors[1].hand.x,s.actors[0].hand.y-s.actors[1].hand.y)<1e-8);assert(s.actors[0].x<s.actors[1].x);}
 if(t>=1&&t<7.4)for(const a of s.actors){assert(a.x-a.width/2>0);assert(a.x+a.width/2<m.W);assert(a.y-a.height/2>0);assert(a.y+a.height/2<m.H);}
}
for(const t of [1,1.6,4,5.2,5.8,6.4,7.4,9.2]){
 const a=m.sample(t-1e-6),b=m.sample(t+1e-6);
 a.actors.forEach((p,i)=>assert(Math.hypot(p.x-b.actors[i].x,p.y-b.actors[i].y)<.1,'no position jump at '+t));
}
assert.equal(m.sample(0).front,true);assert.equal(m.sample(10).finished,true);
assert.equal(m.sample(10).stars,0);assert.equal(m.sample(10).actors[0].visible,false);
assert(Math.abs(m.carrier.width/m.carrier.height-9/16)<1e-10);
assert.equal(m.carrier.width-2*m.carrier.padX,m.W);
assert(Math.abs(m.sample(4).paper.edge-m.W*.42)<1e-6);
console.log('PASS: 2001 samples; contact constraints, release clearance, side order, position continuity, exact source crop, endpoints. Does NOT validate real character anatomy, speed continuity, mattes or video integration.');
