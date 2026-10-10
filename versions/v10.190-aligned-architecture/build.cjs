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
  // Register the pencil field to the source photograph. The source photo is
  // never warped; only the generated frame's left contour is corrected.
  const knots=[[0,0],[155,130],[865,855],[1015,1015],[1200,1200]];
  const aligned=Buffer.alloc(generated.length);
  for(let x=0;x<W;x++){
   let k=1;while(k<knots.length-1&&x>knots[k][0])k++;
   const a=knots[k-1],b=knots[k],sx=a[1]+(x-a[0])*(b[1]-a[1])/(b[0]-a[0]);
   const x0=Math.floor(sx),x1=Math.min(W-1,x0+1),t=sx-x0;
   for(let y=0;y<H;y++)for(let c=0;c<3;c++)aligned[(y*W+x)*3+c]=Math.round(generated[(y*W+x0)*3+c]*(1-t)+generated[(y*W+x1)*3+c]*t);
  }
  generated=aligned;
  background=await sharp(generated,{raw:{width:W,height:H,channels:3}}).png().toBuffer();
 }
 // Keep original geometry authoritative instead of adopting AI-moved photo
 // geometry. Narrow paper-grain variation supplies a nonuniform matte fringe.
 const upperEdge=preparing?null:Array.from({length:W},(_,x)=>top+boundary(x/scale)*scale);
 const lowerEdge=preparing?null:Array.from({length:W},(_,x)=>top+(1170+12*Math.sin(x/scale/105)+2.5*Math.sin(x/scale/11))*scale);
 const ph=pixels.info.height,alpha=Buffer.alloc(W*ph),rgba=Buffer.alloc(W*ph*4);
 let protectedPixels=0;
 for(let y=0;y<ph;y++)for(let x=0;x<W;x++){
  const sx=x/scale,sy=y/scale,i=y*W+x;
  const upper=boundary(sx),lower=1170+12*Math.sin(sx/105)+2.5*Math.sin(sx/11);
  // Original geometry stays fixed. Grain variation is bounded so pencil ink
  // cannot create long spikes or eat into the source photograph.
  const distance=preparing?Math.min(sy-upper,lower-sy):Math.min(y+top-upperEdge[x],lowerEdge[x]-(y+top));
  const grain=preparing?0:Math.max(-1.3,Math.min(1.3,(generated[((y+top)*W+x)*3]-235)*.12));
  const t=Math.max(0,Math.min(1,(distance+grain)/3));
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
  await sharp(paperBase).composite([{input:await sharp(original).rotate().resize({width:W}).png().toBuffer(),left:0,top}]).png().toFile(path.join(design,'registered-full-source.png'));
  await sharp(paperBase).composite([{input:nativeLayer,left:0,top}]).png().toFile(path.join(design,'registered-composition.png'));
  console.log(JSON.stringify({canvas:[W,H],source,sourceHash,photoPlacement:{left:0,top,width:W,height:ph},photoShare:protectedPixels/(W*H)}));return;
 }
 // Reuse the existing paper-only footer rather than generated floor outside
 // the source photo. This also keeps its small wording clear of the picture.
 const footer=await sharp(path.resolve(root,'../v10.189-french-architecture/design/gathered-scenes-master.png')).extract({left:0,top:1600,width:W,height:400}).png().toBuffer();
 const blankFooter=await sharp(paperBase).extract({left:0,top:1800,width:W,height:200}).png().toBuffer();
 const master=await sharp(background).composite([{input:footer,left:0,top:1600},{input:blankFooter,left:0,top:1800},{input:nativeLayer,left:0,top}]).removeAlpha().png().toBuffer();
 const actual=await sharp(master).raw().toBuffer();let checked=0;
 for(let y=0;y<ph;y++)for(let x=0;x<W;x++){
  const i=y*W+x;if(alpha[i]!==255)continue;
  for(let c=0;c<3;c++)if(actual[((y+top)*W+x)*3+c]!==pixels.data[i*3+c])throw Error('Native RGB changed');
  checked++;
 }
 if(checked!==protectedPixels||hash(fs.readFileSync(source))!==sourceHash)throw Error('Original fidelity failure');
 fs.writeFileSync(path.join(design,'gathered-scenes-master.png'),master);
 const cropTop=160,displayHeight=H-cropTop;
 const display=await sharp(master).extract({left:0,top:cropTop,width:W,height:displayHeight}).png().toBuffer();
 await sharp(display).resize({width:360}).png().toFile(path.join(design,'thumbnail.png'));
 const assets=[];
 for(const width of [600,900,1200]){
  const file=`gathered-scenes-${width}.webp`,target=path.join(media,file);
  await sharp(display).resize({width}).webp({quality:91,effort:6,smartSubsample:true}).toFile(target);
  assets.push({file,width,height:Math.round(width*displayHeight/W),bytes:fs.statSync(target).size});
 }
 const manifest={canvas:{width:W,height:H},display:{width:W,height:displayHeight,cropTop},lyrics:['是想念如你温柔过境','才发现原来花开都有声音'],source,sourceHash,paper,photograph:{left:0,top,width:W,height:ph,protectedPixels,share:protectedPixels/(W*H),layoutShare:0.57644},
 policy:'One factual photographic anchor; French architectural contours are reinterpreted with ImageGen above it. All original people, veil, clothing and full train are protected native photograph pixels, proportionally resampled only. Exact proof applies to PNG master; WebP is lossy delivery.',
 pixelProof:`PASS: ${checked} protected original RGB pixels`,assets};
 fs.writeFileSync(path.join(design,'asset-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 console.log(JSON.stringify(manifest,null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1});
