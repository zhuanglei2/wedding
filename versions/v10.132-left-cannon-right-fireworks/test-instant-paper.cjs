const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const paper=require('./instant-paper.js'),story=require('./camera-story-math.js');
const source=fs.readFileSync(__dirname+'/instant-paper.js','utf8');
let last=0;
for(let t=0;t<=6800;t+=5){
 const p=paper.feedAt(t),bend=paper.bendAt(t);
 assert.ok(p>=last&&p<=1);last=p;
 assert.ok(bend>=0&&bend<=.46);
 if(t<=1800)assert.equal(p,0);
 if(t>=3800)assert.equal(p,1);
 if(t>=4050)assert.equal(bend,0,'Flat before enlargement, never curled after finishing');
 for(const w of [320,390,430,768,1000]){
  const h=w*.255,feed=h*(1-p),rows=paper.stripsAt(h,p,bend);
  assert.equal(rows.length,14);
  rows.forEach((r,i)=>{
   Object.values(r).forEach(x=>assert.ok(Number.isFinite(x)));
   assert.ok(r.z>=0&&r.z<h*.25+1e-7,'Modest forward bow, not a folded/flapping sheet');
   assert.ok(r.angle>=0&&r.angle<=.46);
   if(i){assert.ok(r.y>rows[i-1].y,'No row inversion');assert.ok(r.z>=rows[i-1].z);}
   if(bend===0){assert.ok(Math.abs(r.y-r.sourceY)<1e-9);assert.equal(r.z,0);assert.equal(r.angle,0);}
  });
  assert.deepEqual(paper.pointAt(feed,h,feed,bend),{y:feed,z:0,angle:0},'Feed stays anchored to outlet');
 }
}
const velocity=t=>(paper.feedAt(t+.1)-paper.feedAt(t-.1))/.2;
assert.ok(Math.abs(velocity(2300)-velocity(3200))<1e-10,'Steady roller speed');
for(const boundary of [1800,1980,3620,3800,4050])assert.ok(Math.abs(velocity(boundary-.01)-velocity(boundary+.01))<1e-6);
assert.ok(paper.bendAt(3450)>.4,'A visible bow during feeding');
assert.equal(paper.FLAT_AT,story.FOCUS_START);

// Exercise production DOM creation/paint/cleanup without a browser renderer.
class El{
 constructor(){this.children=[];this.attrs={};this.values={};this.classes=new Set();this.style={setProperty:(k,v)=>this.values[k]=v};this.classList={toggle:(k,v)=>v?this.classes.add(k):this.classes.delete(k),remove:k=>this.classes.delete(k)};}
 appendChild(el){this.children.push(el);el.parent=this}setAttribute(k,v){this.attrs[k]=v}
 remove(){this.parent.children=this.parent.children.filter(x=>x!==this)}
}
const img=new El();Object.assign(img,{src:'fallback.webp',currentSrc:'already-decoded-1600.webp',naturalWidth:1600,naturalHeight:2400});
const windowEl=new El();windowEl.querySelector=()=>img;
const film=new El();film.querySelector=()=>windowEl;film.appendChild(windowEl);
let reads=0;
const stage={querySelector:()=>film,getBoundingClientRect:()=>{reads++;return{width:390}}};
const win={},doc={createElement:()=>new El()};
vm.runInNewContext(source,{window:win,document:doc});
const renderer=win.WeddingInstantPaper.create(stage);renderer.prepare(390);
assert.equal(reads,0,'Use supplied layout, no new handoff measurement');
let surface=film.children[1];assert.equal(surface.children.length,14);assert.equal(surface.attrs['aria-hidden'],'true');
for(const band of surface.children){
 assert.equal(band.className,'instant-film-strip','Curl bands never reuse cover paper-strip');
 assert.equal(band.children[0].className,'instant-film-face');
 assert.equal(band.children[0].children[0].children[0].src,img.currentSrc);
}
renderer.paint({print:paper.feedAt(3400),paperBend:paper.bendAt(3400)});
assert.ok(film.classes.has('paper-is-curved'));
assert.ok(surface.children.every(b=>b.style.transform.includes('rotateX(')),'Production bands really rotate in depth');
assert.ok(parseFloat(surface.children.at(-1).values['--paper-shade'])>0);
renderer.prepare(390);assert.equal(film.children[1],surface,'No rebuilding on a normal handoff');
renderer.prepare(768);assert.notEqual(film.children[1],surface,'Resize before play adapts the surface');
surface=film.children[1];
renderer.paint({print:1,paperBend:0});assert.ok(!film.classes.has('paper-is-curved'));
renderer.clear();renderer.clear();assert.equal(film.children.length,1,'Final native photo only; temporary bands removed');
assert.equal(film.children[0],windowEl);assert.equal(img.src,'fallback.webp','Original displayed image never rewritten');
assert.doesNotMatch(source,/requestAnimationFrame|setInterval|setTimeout|fetch\(/,'No independent clock or fetch');
console.log('PASS: cylindrical feed geometry, outlet anchor, constant roller speed, full flatten-before-focus, real DOM strip transforms, cached source reuse, resize and cleanup. Not a browser-pixel test.');
