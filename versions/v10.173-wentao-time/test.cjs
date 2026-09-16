const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
assert(html.includes('浙江省宁海西子国际大酒店 闻涛厅'));
assert(!html.includes('文涛厅'));
assert(html.includes('2026 年 10 月 6 日 16:58'));
assert(html.includes('2026年10月6日&nbsp; 16:58分'));
assert(html.includes('data-start-seconds="18"'));
const previous=fs.readFileSync(path.join(__dirname,'../v10.172-music-start-18s/index.html'),'utf8');
const mainPicture=s=>s.match(/<section class="image-cover"[\s\S]*?(<picture>[\s\S]*?<\/picture>)/)[1];
assert.equal(mainPicture(html),mainPicture(previous),'Original responsive photograph remains unchanged');
for(const m of html.matchAll(/(?:src|href)="([^"]+)"/g)){
 const u=m[1].split(/[?#]/)[0];
 if(u&&!/^(?:[a-z]+:|\/)/i.test(u))assert(fs.existsSync(path.resolve(__dirname,u)),u);
}
const runtime=fs.readFileSync(path.join(__dirname,'opening-runtime.js'),'utf8');
new vm.Script(runtime);
const surfaceSource=runtime.split('/* Source: ../v10.104-cover-first-paint/paper-surface.js */')[1].split('/* Source: ../v10.104-cover-first-paint/star-trail.js */')[0];
class Node{
 constructor(tag){this.tag=tag;this.children=[];this.props={};this.style={setProperty:(k,v)=>this.props[k]=v};}
 appendChild(n){this.children.push(n)}
 cloneNode(){const n=new Node(this.tag);n.textContent=this.textContent;return n}
}
const scope={};vm.runInNewContext(surfaceSource,{window:scope,document:{createElement:tag=>new Node(tag)}});
const math=require('../v10.104-cover-first-paint/page-turn-math.js');
for(const withDate of [true,false]){
 const layer=new Node('div');layer.textContent='2026年10月6日 16:58分';
 const cover={currentSrc:'cover.webp',src:'cover.jpg',closest:()=>({querySelector:()=>withDate?layer:null})};
 const container=new Node('div'),surface=scope.WeddingPaperSurface.create(container,cover,24);
 assert.equal(surface.images.length,24);
 for(const width of [320,390,768,1000]){
  const g={width,height:844,left:0,viewportWidth:width,actorWidth:width*.28};surface.configure(g);
  container.children.forEach((strip,i)=>{
   const front=strip.children[0];assert.equal(front.children.length,withDate?2:1);
   if(withDate){const clone=front.children[1];assert.equal(clone.textContent,layer.textContent);assert.equal(clone.style.width,width+'px');assert.equal(clone.style.left,(-i*width/24)+'px');assert.equal(clone.style.height,(width*3282/1400)+'px')}
  });
  for(const p of [0,.2,.5,.7,1]){
   const state=math.sample(p,g);surface.paint(state);assert.equal(container.style.opacity,p>0&&p<1?'1':'0');
   container.children.forEach((s,i)=>assert.equal(s.style.transform,`translate3d(${state.strips[i].x}px,0,${state.strips[i].z}px) rotateY(${state.strips[i].angle}deg)`));
  }
 }
}
console.log('PASS: 闻涛厅 / 16:58 / 00:18; original cover references retained; assets exist; date follows all 24 paper strips at 320–1000px; motion math unchanged. Not browser visual QA.');
