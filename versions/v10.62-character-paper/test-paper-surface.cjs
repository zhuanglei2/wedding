const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const math=require('./page-turn-math.js');
class Node{
  constructor(tag){this.tag=tag;this.children=[];this.props={};this.style={setProperty:(k,v)=>this.props[k]=v};}
  appendChild(n){this.children.push(n);}
}
const scope={};vm.runInNewContext(fs.readFileSync(__dirname+'/paper-surface.js','utf8'),{window:scope,document:{createElement:tag=>new Node(tag)}});
const container=new Node('div'),cover={currentSrc:'cover.webp',src:'cover.jpg'};
const surface=scope.WeddingPaperSurface.create(container,cover,12);
assert.equal(container.children.length,12);assert.equal(surface.images.length,12);
assert.ok(surface.images.every(i=>i.src==='cover.webp'&&i.alt===''));
const g={width:390,height:844,left:0,viewportWidth:390,actorWidth:109.2};
surface.configure(g);assert.equal(container.style.perspective,'1092px');
assert.equal(surface.images[11].style.left,'-357.5px');
for(const p of [0,.2,.5,.7,1]){
  const state=math.sample(p,g);surface.paint(state);
  assert.equal(container.style.opacity,p>0&&p<1?'1':'0');
  container.children.forEach((s,i)=>assert.equal(s.style.transform,`translate3d(${state.strips[i].x}px,0,${state.strips[i].z}px) rotateY(${state.strips[i].angle}deg)`));
}
surface.clear();assert.equal(container.style.opacity,'0');
console.log('PASS: 12 original-cover slices, load-readiness list, continuous transforms, finite visibility');
