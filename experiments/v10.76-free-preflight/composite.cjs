/* Offline compositing preflight, not AI generation or browser automation.
 * Known synthetic paper geometry + existing RGBA assets only.
 * It cannot infer a mesh or matte from a flattened generated MP4.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const canvasPackage=process.env.WEDDING_CANVAS_PACKAGE||'/Users/eleme/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas';
const {createCanvas,loadImage}=require(canvasPackage);
const M=require('../v10.75-seam-contract/geometry.js');
const sources=path.resolve(__dirname,'../../versions/v10.71-collar-and-motion');
const ASSETS=['cover.webp','classic-reveal.webp','star-couple.png'];
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const crops=[{x:0,y:0,w:480,h:673},{x:500,y:0,w:507,h:673}];
function triangle(ctx,image,uv,xy){
 const [p,q,r]=uv,[a,b,c]=xy;
 const det=p.x*(q.y-r.y)+q.x*(r.y-p.y)+r.x*(p.y-q.y);
 if(Math.abs(det)<1e-8)return;
 const solve=v=>[(v[0]*(q.y-r.y)+v[1]*(r.y-p.y)+v[2]*(p.y-q.y))/det,
 (v[0]*(r.x-q.x)+v[1]*(p.x-r.x)+v[2]*(q.x-p.x))/det,
 (v[0]*(q.x*r.y-r.x*q.y)+v[1]*(r.x*p.y-p.x*r.y)+v[2]*(p.x*q.y-q.x*p.y))/det];
 const x=solve([a.x,b.x,c.x]),y=solve([a.y,b.y,c.y]);
 ctx.save();ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(c.x,c.y);ctx.closePath();ctx.clip();
 ctx.transform(x[0],y[0],x[1],y[1],x[2],y[2]);ctx.drawImage(image,0,0);ctx.restore();
}
function underlay(ctx,img,w,h){ctx.fillStyle='#2e241f';ctx.fillRect(0,0,w,h);const k=Math.min(w/img.width,h/img.height),dw=img.width*k,dh=img.height*k;ctx.drawImage(img,(w-dw)/2,(h-dh)/2,dw,dh);}
const textures=new WeakMap();
function pixels(image){if(!textures.has(image)){const c=createCanvas(image.width,image.height),ctx=c.getContext('2d');ctx.drawImage(image,0,0);textures.set(image,ctx.getImageData(0,0,image.width,image.height));}return textures.get(image);}
// Rasterize shared mesh edges once into a transparent layer. Independent
// antialiased canvas clips leave visible seams when strips are only a few px wide.
function rasterTriangle(out,texture,uv,xy,flat){
 const [a,b,c]=xy,den=(b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y);if(Math.abs(den)<1e-9)return;
 const x0=Math.max(0,Math.floor(Math.min(a.x,b.x,c.x))),x1=Math.min(out.width-1,Math.ceil(Math.max(a.x,b.x,c.x)));
 const y0=Math.max(0,Math.floor(Math.min(a.y,b.y,c.y))),y1=Math.min(out.height-1,Math.ceil(Math.max(a.y,b.y,c.y)));
 for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
  const px=x+.5,py=y+.5,l=((b.y-c.y)*(px-c.x)+(c.x-b.x)*(py-c.y))/den,m=((c.y-a.y)*(px-c.x)+(a.x-c.x)*(py-c.y))/den,n=1-l-m;
  if(Math.min(l,m,n)<-1e-7)continue;const target=(y*out.width+x)*4;
  if(flat){out.data.set(flat,target);continue;}
  const u=Math.max(0,Math.min(texture.width-1,l*uv[0].x+m*uv[1].x+n*uv[2].x-.5));
  const v=Math.max(0,Math.min(texture.height-1,l*uv[0].y+m*uv[1].y+n*uv[2].y-.5));
  const ix=Math.floor(u),iy=Math.floor(v),fx=u-ix,fy=v-iy,jx=Math.min(ix+1,texture.width-1),jy=Math.min(iy+1,texture.height-1);
  for(let k=0;k<4;k++)out.data[target+k]=Math.round(texture.data[(iy*texture.width+ix)*4+k]*(1-fx)*(1-fy)+texture.data[(iy*texture.width+jx)*4+k]*fx*(1-fy)+texture.data[(jy*texture.width+ix)*4+k]*(1-fx)*fy+texture.data[(jy*texture.width+jx)*4+k]*fx*fy);
 }
}
function paper(ctx,cover,s,width,height){
 if(s.front){ctx.drawImage(cover,0,0,width,height);return;}
 if(s.finished)return;
 const sx=width/M.W,sy=height/M.H;
 const layer=createCanvas(width,height),lc=layer.getContext('2d'),out=lc.createImageData(width,height),texture=pixels(cover);
 const proj=(x,z,y)=>({x:x/(1-z/s.paper.depth)*sx,y:(M.H*.5+(y-M.H*.5)/(1-z/s.paper.depth))*sy});
 // Far strips first; this is a known synthetic depth ordering, not recovered tracking.
 for(let i=0;i<M.COUNT;i++){
  const strip=s.paper.strips[i],angle=strip.angle*Math.PI/180,len=M.W/M.COUNT;
  const end={x:strip.x+len*Math.cos(angle),z:strip.z-len*Math.sin(angle)};
  const back=Math.cos(angle)<0;
  for(let j=0;j<8;j++){
   const y0=M.H*j/8,y1=M.H*(j+1)/8;
   const points=[proj(strip.x,strip.z,y0),proj(end.x,end.z,y0),proj(end.x,end.z,y1),proj(strip.x,strip.z,y1)];
   const uv=[{x:cover.width*i/M.COUNT,y:cover.height*j/8},{x:cover.width*(i+1)/M.COUNT,y:cover.height*j/8},{x:cover.width*(i+1)/M.COUNT,y:cover.height*(j+1)/8},{x:cover.width*i/M.COUNT,y:cover.height*(j+1)/8}];
   rasterTriangle(out,texture,[uv[0],uv[1],uv[2]],[points[0],points[1],points[2]],back?[146,44,37,255]:null);
   rasterTriangle(out,texture,[uv[0],uv[2],uv[3]],[points[0],points[2],points[3]],back?[146,44,37,255]:null);
  }
 }
 lc.putImageData(out,0,0);ctx.drawImage(layer,0,0);
}
function drawActors(ctx,img,s,w,h){
 for(const a of s.actors){if(!a.visible)continue;const crop=crops[a.index],height=h*.145,width=height*crop.w/crop.h,x=a.x/M.W*w-width/2,y=a.y/M.H*h-height/2;
 ctx.drawImage(img,crop.x,crop.y,crop.w,crop.h,x,y,width,height);}
}
function frame(images,t,w=420,withActors=true){
 const h=Math.round(w*M.H/M.W),c=createCanvas(w,h),ctx=c.getContext('2d'),s=M.sample(t);
 underlay(ctx,images[1],w,h);paper(ctx,images[0],s,w,h);if(withActors)drawActors(ctx,images[2],s,w,h);return c;
}
function firstFrame(sprite){
 // Exact 9:16 output; preserve original page aspect inside, using subpixel placement.
 const w=1080,h=1920,content=h*M.W/M.H,pad=(w-content)/2;
 const c=createCanvas(w,h),ctx=c.getContext('2d');ctx.fillStyle='#d9cec0';ctx.fillRect(0,0,w,h);ctx.fillStyle='#922c25';ctx.fillRect(pad,0,content,h);
 const s=M.sample(.35);
 for(const a of s.actors){const crop=crops[a.index],dh=h*.145,dw=dh*crop.w/crop.h;
 ctx.drawImage(sprite,crop.x,crop.y,crop.w,crop.h,pad+a.x/M.W*content-dw/2,a.y/M.H*h-dh/2,dw,dh);}
 return {canvas:c,layout:{width:w,height:h,contentWidth:content,padX:pad,normalizedCrop:{left:pad/w,right:1-pad/w,top:0,bottom:1},actorHeight:h*.145}};
}
function validateMatte(hasAlpha,hasMesh){
 if(!hasAlpha)throw Error('BLOCKED: RGB-only video is not a transparent character layer.');
 if(!hasMesh)throw Error('BLOCKED: no measured paper mesh; do not silently replace it with the synthetic fixture.');
}
function exportTriangleTest(){
 const img=createCanvas(12,12),cx=img.getContext('2d');cx.fillStyle='#a12b32';cx.fillRect(0,0,12,12);
 const out=createCanvas(30,30),ctx=out.getContext('2d');
 triangle(ctx,img,[{x:0,y:0},{x:12,y:0},{x:0,y:12}],[{x:2,y:3},{x:26,y:3},{x:2,y:27}]);
 assert.deepEqual([...ctx.getImageData(5,6,1,1).data],[161,43,50,255]);assert.equal(ctx.getImageData(29,29,1,1).data[3],0);
 const surface=createCanvas(32,32),rasterOut=surface.getContext('2d').createImageData(32,32),p=[{x:0,y:0},{x:32,y:0},{x:32,y:32},{x:0,y:32}];
 rasterTriangle(rasterOut,null,null,[p[0],p[1],p[2]],[161,43,50,255]);rasterTriangle(rasterOut,null,null,[p[0],p[2],p[3]],[161,43,50,255]);
 for(let n=0;n<32*32;n++)assert.deepEqual([...rasterOut.data.slice(n*4,n*4+4)],[161,43,50,255],'shared triangle seam at pixel '+n);
}
async function main(){
 const before=Object.fromEntries(ASSETS.map(a=>[a,sha(path.join(sources,a))]));
 const images=await Promise.all(ASSETS.map(a=>loadImage(path.join(sources,a))));
 assert.equal(images[0].width,1400);assert.equal(images[0].height,3282);assert.equal(images[2].width,1007);
 exportTriangleTest();assert.throws(()=>validateMatte(false,true),/RGB-only/);assert.throws(()=>validateMatte(true,false),/mesh/);validateMatte(true,true);
 // Verify crop boundaries exclude the other character; existing matte has transparent exterior.
 const spr=createCanvas(images[2].width,images[2].height),sp=spr.getContext('2d');sp.drawImage(images[2],0,0);
 assert.equal(sp.getImageData(490,300,1,1).data[3],0,'separator between complete characters');
 const compare=(a,b)=>assert.deepEqual(a.getContext('2d').getImageData(0,0,a.width,a.height).data,b.getContext('2d').getImageData(0,0,b.width,b.height).data);
 const start=frame(images,0),expected=createCanvas(start.width,start.height);expected.getContext('2d').drawImage(images[0],0,0,start.width,start.height);compare(start,expected);
 const end=frame(images,10),expectedEnd=createCanvas(end.width,end.height);underlay(expectedEnd.getContext('2d'),images[1],end.width,end.height);compare(end,expectedEnd);
 const output=path.join(__dirname,'output');fs.mkdirSync(output,{recursive:true});
 const times=[0,.35,3,4,6.8,10],labels=['0.0s ORIGINAL COVER','0.35s STATIC ACTOR FIXTURE','3.0s KNOWN MESH','4.0s RELEASE FIXTURE','6.8s PLACEMENT ONLY','10.0s ORIGINAL UNDERLAY'];
 const cw=260,ch=Math.round(cw*M.H/M.W),sheet=createCanvas(cw*3+64,ch*2+140),ctx=sheet.getContext('2d');ctx.fillStyle='#171b19';ctx.fillRect(0,0,sheet.width,sheet.height);ctx.font='15px sans-serif';ctx.fillStyle='#eee4ce';ctx.fillText('OFFLINE COMPOSITING TEST / STATIC ACTORS / NOT GENERATED VIDEO',16,23);
 times.forEach((t,i)=>{const c=frame(images,t,cw),x=16+(i%3)*(cw+16),y=54+Math.floor(i/3)*(ch+44);ctx.drawImage(c,x,y);ctx.fillStyle='#eee4ce';ctx.font='12px sans-serif';ctx.fillText(labels[i],x,y-10);fs.writeFileSync(path.join(output,'fixture-'+String(t).replace('.','-')+'.png'),c.toBuffer('image/png'));});
 fs.writeFileSync(path.join(output,'contact-sheet.png'),sheet.toBuffer('image/png'));
 const first=firstFrame(images[2]);fs.writeFileSync(path.join(output,'first-frame-layout.png'),first.canvas.toBuffer('image/png'));
 const after=Object.fromEntries(ASSETS.map(a=>[a,sha(path.join(sources,a))]));assert.deepEqual(before,after);
 const report={kind:'offline_synthetic_compositing_test',assets:before,tests:{sourceFilesUnchanged:true,triangleInteriorMapping:true,sharedTriangleSeamsFullyCovered:true,firstFrameEqualsOriginalCover:true,lastFrameEqualsOriginalUnderlay:true,rejectOpaqueOnlyInput:true,rejectMissingMesh:true,existingCharacterMatteSeparator:true},firstFrameLayout:first.layout,limitations:['Known synthetic mesh only; no mesh recovered from generated video.','Existing static character crop only; hands do not articulate or grasp.','No video matte extraction, no real-video integration or mobile browser verification.','No physical lighting or natural character animation validation.']};
 fs.writeFileSync(path.join(output,'verification.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});
module.exports={triangle,frame,firstFrame,validateMatte};
