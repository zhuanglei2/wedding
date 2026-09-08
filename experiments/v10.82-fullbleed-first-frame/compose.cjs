// Local static first-frame composition. Reuses original invitation pixels;
// does not generate imagery, upload assets, or modify the production site.
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const sharp=require('/Users/eleme/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const coverPath=path.resolve(__dirname,'../../versions/v10.71-collar-and-motion/cover.webp');
const actorsPath=path.resolve(__dirname,'../v10.81-clean-alpha/characters-transparent.png');
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
async function main(){
 const originals={cover:hash(coverPath),actors:hash(actorsPath)};
 const {data,info}=await sharp(actorsPath).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const w=info.width,h=info.height,n=w*h,labels=new Int32Array(n),q=new Int32Array(n),parts=[];let id=0;
 for(let start=0;start<n;start++)if(data[start*4+3]>0&&!labels[start]){
   let head=0,tail=0;id++;labels[start]=id;q[tail++]=start;
   let x0=w,y0=h,x1=0,y1=0;
   while(head<tail){const i=q[head++],x=i%w,y=(i/w)|0;x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);
    for(const j of [x?i-1:-1,x<w-1?i+1:-1,y?i-w:-1,y<h-1?i+w:-1])if(j>=0&&data[j*4+3]>0&&!labels[j]){labels[j]=id;q[tail++]=j;}
   }parts.push({id,count:tail,x0,y0,x1,y1});
 }
 const large=parts.sort((a,b)=>b.count-a.count).slice(0,2).sort((a,b)=>a.y0-b.y0);
 assert.equal(large.length,2);assert(parts.slice(2).every(p=>p.count<20));
 const names=['groom','bride'],positions=[{right:8,top:20,height:340},{left:960,top:350,height:340}],layers=[],layout=[];
 const base=await sharp(coverPath).ensureAlpha().raw().toBuffer({resolveWithObject:true});assert.equal(base.info.width,1400);assert.equal(base.info.height,3282);
 for(let k=0;k<2;k++){
   const p=large[k],bw=p.x1-p.x0+1,bh=p.y1-p.y0+1,buf=Buffer.alloc(bw*bh*4);
   for(let y=p.y0;y<=p.y1;y++)for(let x=p.x0;x<=p.x1;x++){const i=y*w+x;if(labels[i]===p.id)data.copy(buf,((y-p.y0)*bw+x-p.x0)*4,i*4,i*4+4);}
   const dw=Math.round(bw*positions[k].height/bh),dh=positions[k].height;
   const sprite=await sharp(buf,{raw:{width:bw,height:bh,channels:4}}).resize(dw,dh).png().toBuffer();
   fs.writeFileSync(path.join(__dirname,`${names[k]}.png`),sprite);
   const left=positions[k].left??1400-positions[k].right-dw,top=positions[k].top;
   layers.push({input:sprite,left,top});layout.push({name:names[k],left,top,width:dw,height:dh,sourceBounds:p});
 }
 const output=await sharp(base.data,{raw:{width:1400,height:3282,channels:4}}).composite(layers).png().toBuffer();
 fs.writeFileSync(path.join(__dirname,'first-frame.png'),output);
 // This is explicitly a detail crop for inspection, not the frame to submit.
 await sharp(output).extract({left:780,top:0,width:620,height:730}).png().toFile(path.join(__dirname,'contact-detail.png'));
 const rendered=await sharp(output).ensureAlpha().raw().toBuffer();
 const overlay=await sharp({create:{width:1400,height:3282,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(layers).raw().toBuffer();
 let changedOutsideOverlay=0,changedBody=0,changedBorder=0;
 for(let y=0;y<3282;y++)for(let x=0;x<1400;x++){
  const i=(y*1400+x)*4;let diff=false;for(let c=0;c<4;c++)if(rendered[i+c]!==base.data[i+c])diff=true;
  if(diff&&overlay[i+3]===0)changedOutsideOverlay++;
  if(diff&&y>=730)changedBody++;
  if(diff&&(x===0||x===1399))changedBorder++;
 }
 assert.equal(changedOutsideOverlay,0);assert.equal(changedBody,0);assert.equal(changedBorder,0);
 assert.equal(hash(coverPath),originals.cover);assert.equal(hash(actorsPath),originals.actors);
 const report={version:'10.82',kind:'static_original_cover_plus_character_layers',width:1400,height:3282,originals,layout,checks:{sourceFilesUnchanged:true,changedOutsideOverlay,changedAtOrBelow730px:changedBody,changedSideBorderPixels:changedBorder,originalAspectPreserved:true,noAddedMargins:true,noPrecurledPaper:true},limits:['Static pose only: contact and natural motion not validated.','Full cover is taller than a 9:16 viewport; no promise of 9:16 video compatibility.','Characters are from V10.80 pose draft, not pixel-identical to original product photo.','No real-video matte/mesh integration, no upload, no deployment.']};
 fs.writeFileSync(path.join(__dirname,'verification.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
