const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),sharp=require('sharp');
const root=__dirname,design=path.join(root,'design'),media=path.join(root,'media');
async function main(){
 fs.mkdirSync(media,{recursive:true});
 const source=path.join(design,'generated-ornament.png');
 if(process.argv[2])fs.copyFileSync(process.argv[2],source);
 const input=await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const {width:W,height:H}=input.info;
 let left=W,top=H,right=0,bottom=0,transparent=0;
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  const alpha=input.data[(y*W+x)*4+3];if(!alpha)transparent++;
  if(alpha<=2)continue;
  left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
 }
 assert(transparent/(W*H)>.8,'ornament must have true transparent background');
 left=Math.max(0,left-24);top=Math.max(0,top-24);right=Math.min(W-1,right+24);bottom=Math.min(H-1,bottom+24);
 const crop={left,top,width:right-left+1,height:bottom-top+1};
 const ornament=await sharp(source).extract(crop).png().toBuffer();
 fs.writeFileSync(path.join(design,'ornament-master.png'),ornament);
 const assets=[];
 for(const width of [640,1024,1280]){
  const name=`champagne-branch-${width}.webp`,file=path.join(media,name);
  await sharp(ornament).resize({width}).webp({quality:94,alphaQuality:100,effort:6,smartSubsample:true}).toFile(file);
  const metadata=await sharp(file).metadata();assert(metadata.hasAlpha);
  assets.push({name,width,height:metadata.height,bytes:fs.statSync(file).size});
 }
 const full=assets.at(-1),srcset=assets.map(a=>`media/${a.name} ${a.width}w`).join(', ');
 const join=`<div class="scene-gilded-join" aria-hidden="true"><img src="media/${full.name}" srcset="${srcset}" sizes="(max-width: 795px) 78vw, 620px" width="${full.width}" height="${full.height}" loading="lazy" decoding="async" fetchpriority="low" alt=""></div>`;
 let html=fs.readFileSync(path.resolve(root,'../v10.196-flow-through-lyrics/index.html'),'utf8');
 html=html.replace('src="story-handoff.js"','src="../v10.196-flow-through-lyrics/story-handoff.js"');
 const css=fs.readFileSync(path.join(root,'scene-join.css'),'utf8');
 html=html.replace('</head>',`<style id="scene-join-style">\n${css}</style>\n</head>`);
 const anchor='<article class="gathered-scenes" id="gathered-scenes" tabindex="-1" aria-labelledby="gathered-scenes-heading">';
 assert.equal(html.split(anchor).length,2);
 html=html.replace(anchor,anchor+'\n'+join);
 fs.writeFileSync(path.join(root,'index.html'),html);
 // Static material/scale proof, not a browser screenshot. Source footer and
 // next-page artwork are untouched; only the new transparent branch is added.
 const width=780,joinHeight=121,ornamentWidth=Math.round(width*.78);
 const camera=await sharp(path.resolve(root,'../v10.159-flow-and-gilt/media/camera-art.webp')).resize({width}).png().toBuffer();
 const cameraMeta=await sharp(camera).metadata();
 const footerHeight=188;
 const footer=await sharp(camera).extract({left:0,top:cameraMeta.height-footerHeight,width,height:footerHeight}).png().toBuffer();
 const paper=await sharp(path.resolve(root,'../v10.159-flow-and-gilt/media/camera-clean.webp')).resize({width}).png().toBuffer();
 const paperMeta=await sharp(paper).metadata();
 const strip=await sharp(paper).extract({left:0,top:paperMeta.height-joinHeight,width,height:joinHeight}).png().toBuffer();
 const branch=await sharp(ornament).resize({width:ornamentWidth}).ensureAlpha().linear([1,1,1,.92],[0,0,0,0]).png().toBuffer();
 const branchMeta=await sharp(branch).metadata();
 const next=await sharp(path.resolve(root,'../v10.193-compact-drawn-paper/design/gathered-scenes-master.png')).resize({width}).png().toBuffer();
 const nextHeight=470;
 const nextCrop=await sharp(next).extract({left:0,top:0,width,height:nextHeight}).png().toBuffer();
 await sharp({create:{width,height:footerHeight+joinHeight+nextHeight,channels:3,background:'#f8f5ef'}}).composite([
  {input:footer,left:0,top:0},{input:strip,left:0,top:footerHeight},
  {input:branch,left:Math.round((width-ornamentWidth)/2),top:footerHeight+Math.round((joinHeight-branchMeta.height)/2)},
  {input:nextCrop,left:0,top:footerHeight+joinHeight}
 ]).png().toFile(path.join(design,'transition-preview.png'));
 fs.writeFileSync(path.join(design,'asset-manifest.json'),JSON.stringify({sourceDimensions:[W,H],crop,transparentFraction:transparent/(W*H),assets,cssHeightAt390:60.45,policy:'Only a static transparent botanical ornament is new. No portrait/image/lyrics edits. Existing V196 scroll controller reused unchanged; no additional scroll stop or script. CSS is inline to avoid another render-blocking request.'},null,2)+'\n');
 console.log(JSON.stringify({crop,assets}));
}
main().catch(error=>{console.error(error);process.exitCode=1});
