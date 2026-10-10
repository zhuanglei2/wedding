const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),sharp=require('sharp');
const root=__dirname,base=path.resolve(root,'../v10.191-compact-scene-lyrics');
const W=1200,H=1540,shift=260,oldBottom=1800;
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
async function main(){
 const design=path.join(root,'design'),media=path.join(root,'media');
 fs.mkdirSync(design,{recursive:true});fs.mkdirSync(media,{recursive:true});
 const sourceFile=path.join(base,'design/selected-picture.png'),sourceBytes=fs.readFileSync(sourceFile);
 const source=await sharp(sourceBytes).resize({width:W}).removeAlpha().raw().toBuffer({resolveWithObject:true});
 // V189 registered this selected image's actual fibrous edge. Its native
 // restoration mask began 12 px inside photography at master offset y=60.
 const oldMask=await sharp(path.resolve(root,'../v10.189-french-architecture/design/preservation-mask.png')).greyscale().raw().toBuffer({resolveWithObject:true});
 assert.equal(oldMask.info.width,W);
 const edge=Array.from({length:W},(_,x)=>{
  let y=0;while(y<oldMask.info.height&&oldMask.data[y*W+x]===0)y++;
  return y+60-12;
 });
 assert(Math.min(...edge)>shift+60);
 const guide=Buffer.alloc(W*H*3),rgba=Buffer.alloc(W*H*4);let preserved=0;
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  const i=y*W+x,e=edge[x],newEdge=e-shift;
  // This is only the registration guide: compress empty illustrated paper,
  // keep its top intact, and translate photography without scaling it.
  const sy=y<50?y:y<newEdge?50+(y-50)*(e-50)/(newEdge-50):y+shift;
  const a=Math.floor(sy),b=Math.min(source.info.height-1,a+1),t=sy-a;
  const photoY=y+shift;
  const alpha=Math.round(255*Math.max(0,Math.min(1,(y-newEdge-4)/8)));
  if(alpha===255)preserved++;
  for(let c=0;c<3;c++){
   guide[i*3+c]=Math.round(source.data[(a*W+x)*3+c]*(1-t)+source.data[(b*W+x)*3+c]*t);
   rgba[i*4+c]=source.data[(photoY*W+x)*3+c];
  }
  rgba[i*4+3]=alpha;
 }
 const guidePng=await sharp(guide,{raw:{width:W,height:H,channels:3}}).png().toBuffer();
 fs.writeFileSync(path.join(design,'paper-spacing-guide.png'),guidePng);
 fs.writeFileSync(path.join(design,'edge.json'),JSON.stringify(edge));
 if(process.argv.includes('--prepare')){
  console.log(JSON.stringify({canvas:[W,H],illustrationReduction:shift,oldEdgeRange:[Math.min(...edge),Math.max(...edge)],newEdgeRange:[Math.min(...edge)-shift,Math.max(...edge)-shift],preserved}));return;
 }
 if(process.argv[2])fs.copyFileSync(process.argv[2],path.join(design,'generated-paper.png'));
 const art=await sharp(path.join(design,'generated-paper.png')).resize(W,H,{fit:'fill'}).png().toBuffer();
 const native=await sharp(rgba,{raw:{width:W,height:H,channels:4}}).png().toBuffer();
 const master=await sharp(art).composite([{input:native,left:0,top:0}]).removeAlpha().png().toBuffer();
 fs.writeFileSync(path.join(design,'gathered-scenes-master.png'),master);
 const actual=await sharp(master).raw().toBuffer();let checked=0;
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  const i=y*W+x;if(rgba[i*4+3]!==255)continue;
  for(let c=0;c<3;c++)assert.equal(actual[i*3+c],source.data[((y+shift)*W+x)*3+c],'selected photo pixels changed');
  checked++;
 }
 assert.equal(checked,preserved);assert.equal(hash(fs.readFileSync(sourceFile)),hash(sourceBytes));
 // Conservative bounds fully surround both people and the entire train.
 let portraitChecks=0;
 for(let sy=920;sy<1660;sy++)for(let x=0;x<1150;x++){
  const i=(sy-shift)*W+x;assert.equal(rgba[i*4+3],255,'people/train must be completely native');portraitChecks++;
 }
 const assets=[];
 for(const width of [600,900,1200]){
  const file=`gathered-scenes-${width}.webp`,target=path.join(media,file);
  await sharp(master).resize({width}).webp({quality:91,effort:6,smartSubsample:true}).toFile(target);
  const m=await sharp(target).metadata();assets.push({file,width,height:m.height,bytes:fs.statSync(target).size});
 }
 const paper=await sharp(path.join(base,'design/page-two-paper-sample.png')).extract({left:0,top:0,width:W,height:408}).png().toBuffer();
 const lyrics=await sharp(path.join(base,'design/lyrics-generated.png')).resize({width:1080}).png().toBuffer();
 const proof=await sharp({create:{width:W,height:H+408,channels:3,background:'#f8f5ef'}}).composite([{input:master,left:0,top:0},{input:paper,left:0,top:H},{input:lyrics,left:60,top:H}]).png().toBuffer();
 await sharp(proof).resize({width:720}).png().toFile(path.join(design,'layout-preview.png'));
 const manifest={canvas:{width:W,height:H},oldBottom,illustrationReduction:shift,source:sourceFile,sourceHash:hash(sourceBytes),nativePixelChecks:checked,portraitChecks,assets,policy:'Only the drawn paper interior is redesigned. Every photographic-core pixel from the user-selected composite is translated upward by 260px with identical RGB in the PNG master. No photographic stretching. Lyrics reused unchanged; WebP delivery is lossy.'};
 fs.writeFileSync(path.join(design,'asset-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 console.log(JSON.stringify(manifest,null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1});
