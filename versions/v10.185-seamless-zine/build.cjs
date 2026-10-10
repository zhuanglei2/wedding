// Artwork: image-generated environmental underpainting. Foreground: original pixels.
// Any generated portrait pixels are covered by conservatively protected source
// regions before export. Generated photo/environment seams remain outside them.
// Conservative, manually checked source-space contours keep hair, hands, veils,
// flowers, outfits and trains. They retain nearby real environment, not hard frames.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),sharp=require('sharp');
const root=__dirname,W=1200,H=2000;
const photos=[
 {name:'seated',source:'/Users/eleme/Desktop/wedding/59636a811k762aacf68c8ec4b37bbc52.jpg',left:0,top:-250,width:980,viewBox:'0 0 854 1280',
  contours:['M 425 565 Q 472 553 524 549 Q 571 531 599 544 Q 638 533 669 563 Q 696 586 718 604 Q 757 612 753 665 Q 749 742 745 796 Q 760 835 790 852 Q 812 875 794 914 Q 775 985 704 1032 Q 609 1096 509 1105 Q 375 1129 239 1094 Q 108 1080 56 1028 Q 13 1001 0 969 L 0 813 Q 81 759 172 747 Q 311 733 417 738 Q 429 694 425 650 Q 413 601 425 565 Z']},
 {name:'mural',source:'/Users/eleme/Desktop/wedding/087f4a3a79f7b920abff19f11eb716ef.jpg',left:370,top:720,width:830,viewBox:'0 0 1280 1920',
  contours:[
   'M 186 581 C 253 555 309 574 319 645 Q 330 700 346 745 Q 365 800 379 861 Q 390 947 348 986 Q 341 1107 359 1239 L 328 1440 Q 345 1482 348 1534 Q 268 1573 194 1556 Q 151 1550 126 1476 L 115 1274 Q 95 1124 96 1020 L 103 827 Q 101 746 160 697 Q 162 630 186 581 Z',
   'M 756 604 C 810 587 865 635 863 697 Q 906 740 932 835 Q 971 943 1054 1071 Q 1169 1228 1280 1385 L 1280 1857 Q 1066 1887 865 1849 Q 676 1837 486 1790 Q 324 1765 261 1714 Q 266 1553 351 1399 Q 395 1250 558 1149 Q 623 1047 722 992 Q 693 967 629 977 Q 586 974 598 907 Q 623 857 687 846 L 738 820 Q 759 773 735 722 Q 727 660 756 604 Z'
  ]}
];
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
async function main(){
 const design=path.join(root,'design'),media=path.join(root,'media');
 fs.mkdirSync(media,{recursive:true});
 if(process.argv[2])fs.copyFileSync(process.argv[2],path.join(design,'illustration-background.png'));
 const background=await sharp(path.join(design,'illustration-background.png')).resize(W,H,{fit:'fill'}).removeAlpha().png().toBuffer();
 const layers=[],records=[];
 for(const p of photos){
  const source=fs.readFileSync(p.source),fitted=await sharp(source).rotate().resize({width:p.width}).removeAlpha().raw().toBuffer({resolveWithObject:true});
  const height=fitted.info.height;
  const svg=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${p.width}" height="${height}" viewBox="${p.viewBox}">${p.contours.map(d=>`<path fill="white" d="${d}"/>`).join('')}</svg>`);
  const originalMask=await sharp(svg).ensureAlpha().extractChannel('alpha').raw().toBuffer();
  const featherResult=await sharp(originalMask,{raw:{width:p.width,height,channels:1}}).erode(8).blur(5).greyscale().raw().toBuffer({resolveWithObject:true});
  if(featherResult.info.channels!==1)throw Error('Preservation matte must remain single-channel');
  const feather=featherResult.data;
  const rgba=Buffer.alloc(p.width*height*4),alpha=Buffer.alloc(p.width*height);
  let protectedPixels=0;
  for(let i=0;i<alpha.length;i++){
   // No fade/filter whatsoever INSIDE the protective contour. Only real
   // background outside it gets a narrow irregular environmental handoff.
   const core=originalMask[i];
   // A narrow environmental-only blend reconciles native pixels with the
   // registered underpainting. Its hand-torn seams lie outside this mask.
   alpha[i]=core===255?255:Math.max(core,feather[i]);
   if(alpha[i]===255)protectedPixels++;
   for(let c=0;c<3;c++)rgba[i*4+c]=fitted.data[i*3+c];
   rgba[i*4+3]=alpha[i];
  }
  const layer=await sharp(rgba,{raw:{width:p.width,height,channels:4}}).png().toBuffer();
  const layerName=p.name+'-preserved.png',maskName=p.name+'-preservation-mask.png';
  fs.writeFileSync(path.join(design,layerName),layer);
  await sharp(alpha,{raw:{width:p.width,height,channels:1}}).png().toFile(path.join(design,maskName));
  const cropTop=Math.max(0,-p.top),cropHeight=Math.min(height-cropTop,H-Math.max(0,p.top));
  const visibleLayer=await sharp(layer).extract({left:0,top:cropTop,width:p.width,height:cropHeight}).png().toBuffer();
  layers.push({input:visibleLayer,left:p.left,top:Math.max(0,p.top)});
  records.push({...p,height,sha256:hash(source),protectedPixels,mask:maskName,layer:layerName});
 }
 const master=await sharp(background).composite(layers).removeAlpha().png().toBuffer();
 const pixels=await sharp(master).raw().toBuffer();
 for(const p of records){
  const expected=await sharp(p.source).rotate().resize({width:p.width}).removeAlpha().raw().toBuffer();
  const alpha=await sharp(path.join(design,p.mask)).greyscale().raw().toBuffer();
  let compared=0;
  for(let y=0;y<p.height;y++)for(let x=0;x<p.width;x++){
   const i=y*p.width+x;if(alpha[i]!==255)continue;
   if(y+p.top<0||y+p.top>=H)throw Error('Protected content outside poster: '+p.name);
   const out=((y+p.top)*W+x+p.left)*3;
   for(let c=0;c<3;c++)if(pixels[out+c]!==expected[i*3+c])throw Error('Source fidelity mismatch '+p.name+' '+x+','+y);
   compared++;
  }
  if(compared!==p.protectedPixels)throw Error('Mask pixel count mismatch');
  if(hash(fs.readFileSync(p.source))!==p.sha256)throw Error('Original file changed');
  p.pixelProof=`PASS: ${compared} fully protected pixels exactly match directly resized original RGB.`;
 }
 fs.writeFileSync(path.join(design,'gathered-scenes-master.png'),master);
 await sharp(master).resize(360,600).png().toFile(path.join(design,'thumbnail.png'));
 const assets=[];
 for(const width of [600,900,1200]){
  const file=`gathered-scenes-${width}.webp`,target=path.join(media,file);
  await sharp(master).resize({width}).webp({quality:91,effort:6,smartSubsample:true}).toFile(target);
  assets.push({file,width,height:Math.round(width*5/3),bytes:fs.statSync(target).size});
 }
 const manifest={canvas:{width:W,height:H},policy:'Generated underpainting supplies environment and torn-paper seams only. All final people are covered by original photograph pixels. Only proportional resampling in protected regions; no retouch, recolouring or synthesis. Source-space preservation contours are visually checked; lossless master has exact pixel proof. Responsive WebP is a lossy delivery derivative.',photos:records,assets};
 fs.writeFileSync(path.join(design,'asset-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 console.log(JSON.stringify({proof:records.map(p=>({name:p.name,proof:p.pixelProof})),assets},null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1});
