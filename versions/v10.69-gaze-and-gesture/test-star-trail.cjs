const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {Pool,anchors,MAX}=require('./star-trail.js');
const {sample}=require('./page-turn-math.js');
const g={width:390,height:844,left:0,viewportWidth:390,actorWidth:168,actorHeight:112};
const pool=new Pool();
pool.update(sample(0,g),g,0);assert.equal(pool.sample(10).length,0);
let peak=0;
for(let t=0;t<=1800;t+=16){pool.update(sample(t/2600,g),g,t);peak=Math.max(peak,pool.sample(t+1).length);}
assert.ok(peak>5&&peak<=MAX);assert.equal(MAX,36);
const live=pool.sample(1800);assert.ok(live.some(p=>p.star));assert.ok(live.some(p=>!p.star));
assert.ok(live.every(p=>p.opacity>=0&&p.opacity<=.86&&Number.isFinite(p.x)&&Number.isFinite(p.y)));
const born=pool.serial;for(let t=1800;t<2900;t+=16)pool.sample(t);
assert.equal(pool.serial,born,'Resting does not emit');assert.equal(pool.sample(2900).length,0,'Idle tail completely expires');
const check=new Pool();check.update(sample(.4,g),g,0);check.update(sample(.41,g),g,16);
check.update(sample(1,g),g,32);assert.equal(check.sample(1000).length,0,'No stale final stars');
check.clear();assert.equal(check.slots.filter(Boolean).length,0);
const a=anchors(sample(.5,g),g);assert.deepEqual(a,sample(.5,g).actors.map(actor=>actor.emitter));
const source=fs.readFileSync(__dirname+'/star-trail.js','utf8');assert.ok(!source.includes('Math.random'));
// Canvas lifecycle and graceful absence, without a browser dependency.
const queue=new Map();let next=0,clears=0;
const context=new Proxy({clearRect(){clears++;}}, {get:(target,key)=>target[key]||(()=>{}),set:(target,key,value)=>{target[key]=value;return true;}});
const scope={devicePixelRatio:3,requestAnimationFrame:fn=>{queue.set(++next,fn);return next;},cancelAnimationFrame:id=>queue.delete(id)};
vm.runInNewContext(source,{window:scope});
const create=scope.WeddingStarTrail.create;
assert.equal(create(null),null);assert.equal(create({getContext:()=>null}),null);assert.equal(create({getContext:()=>{throw Error('blocked');}}),null);
const canvas={getContext:()=>context};const trail=create(canvas);
for(let t=500;t<900;t+=16)trail.update(sample(t/2600,g),g,t);
assert.ok(canvas.width*canvas.height<=1810000);assert.ok(queue.size>0);
for(let t=900;t<1900;t+=16){const fns=[...queue.values()];queue.clear();fns.forEach(fn=>fn(t));}
assert.equal(queue.size,0,'No perpetual frame loop after particles die');assert.ok(clears>0);
for(let t=500;t<900;t+=16)trail.update(sample(t/2600,g),g,t);
trail.clear();assert.equal(queue.size,0,'Clear cancels pending animation');
console.log('PASS: two foot emitters, limited gold stars/dust, no idle emission, finite fade, capped resolution, stopped RAF, unavailable-canvas fallback');
