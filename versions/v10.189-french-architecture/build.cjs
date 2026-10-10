// ImageGen supplies the source-derived illustration. Native source RGB protects
// the photographic anchor. The matte follows scenery, never a figure outline.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),sharp=require('sharp');
const root=__dirname,W=1200,H=2000,top=60;
const source='/Users/eleme/Desktop/wedding/59636a811k762aacf68c8ec4b37bbc52.jpg';
const paper=path.resolve(root,'../v10.159-flow-and-gilt/media/camera-clean.webp');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const points=[[0,510],[160,475],[330,330],[500,305],[660,280],[854,230]];
function boundary(x){
  const j=points.findIndex((p,i)=>i>0&&x<=p[0]);
  const a=points[Math.max(0,j-1)],b=points[j<0?points.length-1:j];
  const v=a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]||1);
  return v+3*Math.sin(x/19)+1.5*Math.sin(x/4.7);
}
async function main(){
 const design=path.join(root,'design'),media=path.join(root,'media');
 fs.mkdirSync(design,{recursive:true});fs.mkdirSync(media,{recursive:true});
 const original=fs.readFileSync(source),sourceHash=hash(original),scale=W/854;
 const pixels=await sharp(original).rotate().resize({width:W}).removeAlpha().raw().toBuffer({resolveWithObject:true});
 const preparing=process.argv.includes('--prepare');
 let background,generated;
 if(!preparing){
  if(process.argv[2])fs.copyFileSync(process.argv[2],path.join(design,'generated-illustration.png'));
  background=await sharp(path.join(design,'generated-illustration.png')).resize(W,H,{fit:'fill'}).removeAlpha().png().toBuffer();
  generated=await sharp(background).raw().toBuffer();
 }
 // Register restoration to the actual generated fiber edge, not the straight
 // layout-guide silhouette. Only the environmental fringe uses generated RGB.
 function materialEdge(x,expected,direction){
  const luma=(px,py)=>{const i=(Math.max(0,Math.min(H-1,py))*W+Math.max(0,Math.min(W-1,px)))*3;return .2126*generated[i]+.7152*generated[i+1]+.0722*generated[i+2];};
  const start=Math.round(expected+direction*(direction===1?150:25)),end=Math.round(expected-direction*100);
  // Walk from the solid photo out to the paper. Scanning from paper inward
  // would confuse long pencil strokes with the photographic material.
  for(let y=start;direction>0?y>end:y<end;y-=direction){
   let total=0;
   for(let dy=0;dy<6;dy+=2){
    const row=[];for(let dx=-12;dx<=12;dx+=2)row.push(luma(x+dx,y-direction*dy));
    row.sort((a,b)=>a-b);total+=row[10];
   }
   if(total/3>229)return y;
  }
  throw Error(`Cannot register paper edge at column ${x}`);
 }
 const medianEdge=values=>values.map((_,x)=>{const nearby=values.slice(Math.max(0,x-10),Math.min(W,x+11)).sort((a,b)=>a-b);return nearby[Math.floor(nearby.length/2)];});
 const upperEdge=preparing?null:medianEdge(Array.from({length:W},(_,x)=>materialEdge(x,top+boundary(x/scale)*scale,1)));
 const lowerEdge=preparing?null:medianEdge(Array.from({length:W},(_,x)=>materialEdge(x,top+(1170+12*Math.sin(x/scale/105)+2.5*Math.sin(x/scale/11))*scale,-1)));
 const ph=pixels.info.height,alpha=Buffer.alloc(W*ph),rgba=Buffer.alloc(W*ph*4);
 let protectedPixels=0;
 for(let y=0;y<ph;y++)for(let x=0;x<W;x++){
  const sx=x/scale,sy=y/scale,i=y*W+x;
  const upper=boundary(sx),lower=1170+12*Math.sin(sx/105)+2.5*Math.sin(sx/11);
  // Preserve 12 canvas pixels of genuine generated fibers, then a 4px
  // registration blend in scenery. No broad airbrushed/feathered paper band.
  const distance=preparing?Math.min(sy-upper,lower-sy):Math.min(y+top-upperEdge[x],lowerEdge[x]-(y+top));
  const t=Math.max(0,Math.min(1,(distance-12)/4));
  const a=preparing?Math.max(0,Math.min(1,distance/1.5)):t*t*(3-2*t);
  alpha[i]=Math.round(255*a);if(alpha[i]===255)protectedPixels++;
  for(let c=0;c<3;c++)rgba[i*4+c]=pixels.data[i*3+c];rgba[i*4+3]=alpha[i];
 }
 const nativeLayer=await sharp(rgba,{raw:{width:W,height:ph,channels:4}}).png().toBuffer();
 await sharp(alpha,{raw:{width:W,height:ph,channels:1}}).png().toFile(path.join(design,'preservation-mask.png'));
 const sample=await sharp(paper).extract({left:0,top:1120,width:1024,height:416}).resize({width:W}).png().toBuffer();
 fs.writeFileSync(path.join(design,'page-two-paper-sample.png'),sample);
 const tileHeight=(await sharp(sample).metadata()).height,paperLayers=[];
 for(let y=0,n=0;y<H;y+=tileHeight,n++){
   const input=await sharp(sample).flip(n%2===1).extract({left:0,top:0,width:W,height:Math.min(tileHeight,H-y)}).png().toBuffer();
   paperLayers.push({input,left:0,top:y});
 }
 const paperBase=await sharp({create:{width:W,height:H,channels:3,background:'#f8f5ef'}}).composite(paperLayers).png().toBuffer();
 if(process.argv.includes('--prepare')){
  await sharp(paperBase).composite([{input:nativeLayer,left:0,top}]).png().toFile(path.join(design,'registered-composition.png'));
  console.log(JSON.stringify({canvas:[W,H],source,sourceHash,photoPlacement:{left:0,top,width:W,height:ph},photoShare:protectedPixels/(W*H)}));return;
 }
 const master=await sharp(background).composite([{input:nativeLayer,left:0,top}]).removeAlpha().png().toBuffer();
 const actual=await sharp(master).raw().toBuffer();let checked=0;
 for(let y=0;y<ph;y++)for(let x=0;x<W;x++){
  const i=y*W+x;if(alpha[i]!==255)continue;
  for(let c=0;c<3;c++)if(actual[((y+top)*W+x)*3+c]!==pixels.data[i*3+c])throw Error('Native RGB changed');
  checked++;
 }
 if(checked!==protectedPixels||hash(fs.readFileSync(source))!==sourceHash)throw Error('Original fidelity failure');
 fs.writeFileSync(path.join(design,'gathered-scenes-master.png'),master);
 await sharp(master).resize(360,600).png().toFile(path.join(design,'thumbnail.png'));
 const assets=[];
 for(const width of [600,900,1200]){
  const file=`gathered-scenes-${width}.webp`,target=path.join(media,file);
  await sharp(master).resize({width}).webp({quality:91,effort:6,smartSubsample:true}).toFile(target);
  assets.push({file,width,height:Math.round(width*5/3),bytes:fs.statSync(target).size});
 }
 const manifest={canvas:{width:W,height:H},source,sourceHash,paper,photograph:{left:0,top,width:W,height:ph,protectedPixels,share:protectedPixels/(W*H),layoutShare:0.57644},
 policy:'One factual photographic anchor; French architectural contours are reinterpreted with ImageGen above it. All original people, veil, clothing and full train are protected native photograph pixels, proportionally resampled only. Exact proof applies to PNG master; WebP is lossy delivery.',
 pixelProof:`PASS: ${checked} protected original RGB pixels`,assets};
 fs.writeFileSync(path.join(design,'asset-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 console.log(JSON.stringify(manifest,null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1});
