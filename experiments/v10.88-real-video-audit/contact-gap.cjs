// Early-shot diagnostic only. Tracks visible yellow mitten's rightmost extent
// in an inspected search ROI; not a semantic all-frame hand tracker.
const fs=require('node:fs'),path=require('node:path');
const deps='/Users/eleme/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const sharp=require(path.join(deps,'sharp')),{createCanvas,loadImage}=require(path.join(deps,'@napi-rs/canvas'));
const dir=process.argv[2],meta=JSON.parse(fs.readFileSync(path.join(dir,'decode.json'))),results=[];
async function main(){
 const sheet=createCanvas(1200,480),ctx=sheet.getContext('2d');ctx.fillStyle='#17212a';ctx.fillRect(0,0,1200,480);
 for(const [k,index] of [0,12,24,36].entries()){
  const frame=meta.frames[index],raw=await sharp(path.join(dir,frame.file)).removeAlpha().raw().toBuffer();
  const yellow=(x,y)=>{let i=(y*576+x)*3,r=raw[i],g=raw[i+1],b=raw[i+2];return r>170&&g>125&&b<g*.9&&r>g*1.08};
  let maxX=-1,points=[];
  for(let y=310;y<465;y++)for(let x=435;x<485;x++)if(yellow(x,y)){maxX=Math.max(maxX,x);points.push({x,y});}
  if(maxX<0)throw Error('Mitten candidate not found');
  points=points.filter(p=>p.x>=maxX-2);const y=Math.round(points.reduce((a,p)=>a+p.y,0)/points.length);
  const boundaries=[];
  for(let yy=y-2;yy<=y+2;yy++)for(let x=485;x<550;x++){const i=(yy*576+x)*3;if(raw[i+1]>160&&Math.abs(raw[i]-raw[i+1])<35){boundaries.push(x);break;}}
  if(!boundaries.length)throw Error('Paper edge not found');boundaries.sort((a,b)=>a-b);const edge=boundaries[Math.floor(boundaries.length/2)],gap=edge-maxX;
  results.push({frame:index,time:frame.time,hand:{x:maxX,y},edge:{x:edge,y},gapSourcePixels:gap,gapAt390pxViewport:gap*390/576,estimatedBoundaryUncertaintyPx:3});
  const image=await loadImage(path.join(dir,frame.file));ctx.drawImage(image,375,245,170,260,k*300,50,280,428);
  const p=(x,yy)=>[k*300+(x-375)*280/170,50+(yy-245)*428/260];
  ctx.strokeStyle='#30ffd1';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(...p(maxX,y));ctx.lineTo(...p(edge,y));ctx.stroke();
  for(const x of [maxX,edge]){const [a,b]=p(x,y);ctx.beginPath();ctx.arc(a,b,4,0,Math.PI*2);ctx.stroke();}
  ctx.fillStyle='white';ctx.font='18px sans-serif';ctx.fillText(`${frame.time.toFixed(2)}s · gap ~${gap}px`,k*300+8,28);
 }
 fs.writeFileSync(path.join(__dirname,'contact-gap.png'),sheet.toBuffer('image/png'));
 fs.writeFileSync(path.join(__dirname,'contact-gap.json'),JSON.stringify({scope:'Four early-shot samples only; inspect overlay to confirm hand/edge identification. Not continuous tracking.',samples:results,criterion:'Continuous palm-edge contact must not have large visible gaps during pull.'},null,2));console.log(results);
}
main().catch(e=>{console.error(e);process.exitCode=1});
