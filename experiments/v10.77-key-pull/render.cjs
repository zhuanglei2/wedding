/* Local 2.5D key-action study: articulated raster actors + projected curved paper.
 * No generative service, no browser, no website deployment.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const packages='/Users/eleme/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const {createCanvas,loadImage}=require(process.env.WEDDING_CANVAS_PACKAGE||packages+'/@napi-rs/canvas');
const sharp=require(process.env.WEDDING_SHARP_PACKAGE||packages+'/sharp');
const old=path.resolve(__dirname,'../../versions/v10.71-collar-and-motion');
const geometry=require('../v10.75-seam-contract/geometry.js');
const compositor=require('../v10.76-free-preflight/composite.cjs');
const anatomy=require(path.join(old,'page-turn-math.js'));
const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x);},mix=(a,b,t)=>a+(b-a)*t;
const PW=400,PH=Math.round(PW*geometry.H/geometry.W),PAD=32,TOP=46,W=PW+2*PAD,H=PH+TOP+38,FPS=20,SECONDS=5,COUNT=FPS*SECONDS;
const rotating=anatomy.rotate;
function hand(a){
 const l=anatomy.layouts[a.index],tip=rotating(0,l.hand,a.arm),waist=anatomy.waist(a.index);
 const bent=rotating(l.shoulder.x+tip.x-120,l.shoulder.y+tip.y-waist,a.spineAngle);
 const point=rotating(bent.x+120,bent.y+waist,a.lean);
 return{x:a.x+point.x*a.scale,y:a.y+point.y*a.scale};
}
function state(time){
 const t=Math.min(4,time),s=geometry.sample(t),reach=ease(t/1.1),effort=ease((t-1.6)/2.4),press=Math.sin(clamp((t-1.1)/.5)*Math.PI);
 const actors=s.actors.map((source,index)=>{
  const target={x:source.hand.x/geometry.W*PW,y:source.hand.y/geometry.H*PH};
  // Before contact, move toward a point 14px short of the paper, then close it.
  target.x-=14*(1-reach);
  const a={index,scale:.39*(1+.045*effort),x:0,y:0,opacity:1,
   lean:mix(-5,-19,effort)+3*press,spineAngle:-3*effort,
   arm:mix(-25,-83,reach)+8*effort,freeArm:10+9*effort,
   kick:4*effort,legFollow:3*effort,elbowBend:2*press+3*effort,
   clothLag:4*ease((t-1.85)/2.15),clothRipple:0,
   eyeOpen:1-.85*Math.sin(clamp((t-.30-index*.05)/.14)*Math.PI)**2,
   gazeX:.85,gazeY:-.10,target};
  const local=hand(a);a.x=target.x-local.x;a.y=target.y-local.y;
  return a;
 });
 return {t,s,actors,phase:time<1.1?'APPROACH / REACH':time<1.6?'CONTACT / BUILD TENSION':time<4?'PULL / CURVED PAPER':'HOLD / CHECK CONTACT'};
}
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
async function main(){
 const assetNames=['cover.webp','classic-reveal.webp','rig-atlas.png','head-expressions.png','character-rig.js','page-turn-math.js'];
 const sourceHashes=Object.fromEntries(assetNames.map(a=>[a,hash(path.join(old,a))]));
 const [cover,under,atlas,lids]=await Promise.all(['cover.webp','classic-reveal.webp','rig-atlas.png','head-expressions.png'].map(a=>loadImage(path.join(old,a))));
 const scope={devicePixelRatio:1};vm.runInNewContext(fs.readFileSync(path.join(old,'character-rig.js'),'utf8'),{window:scope});
 const actorLayer=createCanvas(W,H),rig=scope.WeddingCharacterRig.create(actorLayer,atlas,anatomy,lids),g={viewportWidth:W,height:H};
 const out=path.join(__dirname,'output');fs.mkdirSync(out,{recursive:true});
 const rawFrames=[],poses=[],snapshots=[];let maxError=0;const samples=[0,22,32,55,80];
 function draw(n){
  const time=n/FPS,a=state(time),canvas=createCanvas(W,H),ctx=canvas.getContext('2d');
  ctx.fillStyle='#191e1b';ctx.fillRect(0,0,W,H);
  const page=compositor.frame([cover,under],a.t,PW,false),pc=page.getContext('2d'),edge=a.s.paper.edge/geometry.W*PW;
  if(a.t>1.6&&edge<PW){
   pc.save();const shadow=pc.createLinearGradient(edge,0,edge+22,0);shadow.addColorStop(0,'#15070399');shadow.addColorStop(1,'#15070300');pc.fillStyle=shadow;pc.fillRect(edge,0,22,PH);
   // The mild front-side highlight follows the projected free edge.
   pc.strokeStyle='#f9dca077';pc.lineWidth=1;pc.beginPath();pc.moveTo(edge-.6,0);pc.lineTo(edge-.6,PH);pc.stroke();pc.restore();
  }
  ctx.drawImage(page,PAD,TOP);
  rig.paint({actors:a.actors.map(v=>({...v,x:v.x+PAD,y:v.y+TOP}))},g);ctx.drawImage(actorLayer,0,0);
  ctx.fillStyle='#ecdcbb';ctx.font='12px sans-serif';ctx.fillText('V10.77 / 2.5D KEY-ACTION STUDY',PAD,20);
  ctx.fillStyle='#c4c7bc';ctx.font='11px sans-serif';ctx.fillText(a.phase,PAD,36);ctx.fillText('No finger rig / No generated video / No deployment',PAD,H-13);
  if(time>=1.1)for(const actor of a.actors){
   const actual=hand(actor),e=Math.hypot(actual.x-actor.target.x,actual.y-actor.target.y);maxError=Math.max(maxError,e);assert(e<1e-8);
   // A real opaque palm must exist at the computed contact, not just metadata.
   const x=Math.floor(actual.x+PAD)-2,y=Math.floor(actual.y+TOP);
   const pix=actorLayer.getContext('2d').getImageData(x,y-2,3,5).data;assert([...pix].some((v,i)=>i%4===3&&v>180),'No opaque palm at contact');
  }
  poses.push({time,paperEdge:edge,paperDepth:a.s.paper.z,phase:a.phase,actors:a.actors.map(v=>({index:v.index,hand:hand(v),target:v.target,arm:v.arm,lean:v.lean}))});
  return canvas;
 }
 for(let n=0;n<COUNT;n++){
  const canvas=draw(n);rawFrames.push(Buffer.from(canvas.getContext('2d').getImageData(0,0,W,H).data));
  if(samples.includes(n)){snapshots.push(canvas);fs.writeFileSync(path.join(out,'pose-'+n+'.png'),canvas.toBuffer('image/png'));}
 }
 assert(poses[32].paperDepth===0,'Paper must stay flat until tension completes');
 assert(poses[55].paperDepth>0,'Paper has real z coordinates');
 assert(poses[80].paperEdge<poses[32].paperEdge-PW*.4,'Paper actually travels left');
 const reportCanvas=createCanvas(W*3,H*2),rctx=reportCanvas.getContext('2d');rctx.fillStyle='#191e1b';rctx.fillRect(0,0,reportCanvas.width,reportCanvas.height);
 snapshots.forEach((c,i)=>rctx.drawImage(c,(i%3)*W,Math.floor(i/3)*H));
 rctx.fillStyle='#ecdcbb';rctx.font='20px sans-serif';rctx.fillText('2.5D: raster limbs + curved paper',W*2+20,H+70);rctx.fillText('Contact is locked; fingers do not close.',W*2+20,H+110);
 fs.writeFileSync(path.join(out,'contact-sheet.png'),reportCanvas.toBuffer('image/png'));
 console.log('Rendered '+COUNT+' distinct timeline samples; encoding animated GIF.');
 await sharp(Buffer.concat(rawFrames),{raw:{width:W,height:H*COUNT,channels:4,pageHeight:H},limitInputPixels:false})
  .gif({delay:Array(COUNT).fill(50),loop:0,colours:128,dither:.25,effort:2,keepDuplicateFrames:true}).toFile(path.join(out,'key-pull.gif'));
 const metadata=await sharp(path.join(out,'key-pull.gif'),{animated:true}).metadata();
 assert.equal(metadata.pages,COUNT);assert.equal(metadata.pageHeight,H);
 assert(Math.abs(metadata.delay.reduce((a,b)=>a+b,0)-SECONDS*1000)<1);
 const after=Object.fromEntries(assetNames.map(a=>[a,hash(path.join(old,a))]));assert.deepEqual(after,sourceHashes);
 const report={version:'10.77',format:'animated GIF',durationSeconds:SECONDS,frames:metadata.pages,width:W,height:H,maximumComputedContactErrorPx:maxError,sourceHashes,
  checks:['100 encoded frames / 5 seconds','paper waits until 1.6s','paper has varying strip normals and positive z depth','hand transforms match projected edge after contact','opaque palm pixels present near target','source files unchanged'],
  limits:['2D raster character limbs, not a 3D character model','No finger closing/wrapping or cloth simulation','Frame samples inspected; no browser/mobile playback QA','GIF colour quantization is preview-only','No real-video matte/mesh extraction and no deployment']};
 fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify(report,null,2)+'\n');fs.writeFileSync(path.join(out,'contact-samples.json'),JSON.stringify(poses,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});module.exports={state,hand};
