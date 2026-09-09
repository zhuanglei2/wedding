const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const math=require('./page-turn-math.js');
class Node{
  constructor(tag){this.tag=tag;this.children=[];this.props={};this.style={setProperty:(k,v)=>this.props[k]=v};}
  appendChild(n){this.children.push(n);}
}
const scope={};vm.runInNewContext(fs.readFileSync(__dirname+'/paper-surface.js','utf8'),{window:scope,document:{createElement:tag=>new Node(tag)}});
const container=new Node('div'),cover={currentSrc:'cover.webp',src:'cover.jpg'};
const surface=scope.WeddingPaperSurface.create(container,cover,math.SEGMENTS);
assert.equal(container.children.length,24);assert.equal(surface.images.length,24);
assert.ok(surface.images.every(i=>i.src==='cover.webp'&&i.alt===''));
const g={width:390,height:844,left:0,viewportWidth:390,actorWidth:109.2};
surface.configure(g);assert.equal(container.style.perspective,'4680px');
assert.equal(container.style.perspective,math.sample(.5,g).depth+'px','CSS and projected hand coordinates must share perspective');
assert.equal(surface.images[23].style.left,'-373.75px');
container.children.forEach((strip,i)=>{
  const back=strip.children[1];
  assert.equal(back.style.backgroundSize,'390px 100%');
  assert.equal(back.style.backgroundPosition,`${-(23-i)*390/24}px 0`,'Backface uses one full-sheet gradient');
});
for(const p of [0,.2,.5,.7,1]){
  const state=math.sample(p,g);surface.paint(state);
  assert.equal(container.style.opacity,p>0&&p<1?'1':'0');
  container.children.forEach((s,i)=>assert.equal(s.style.transform,`translate3d(${state.strips[i].x}px,0,${state.strips[i].z}px) rotateY(${state.strips[i].angle}deg)`));
  container.children.forEach((s,i)=>{
    assert.equal(s.props['--strip-light'],state.strips[i].light);
    assert.equal(s.props['--back-shade'],state.strips[i].backShade);
  });
}
surface.clear();assert.equal(container.style.opacity,'0');
console.log('PASS: 24 continuous original-cover slices; shared backface gradient; finite visibility');
