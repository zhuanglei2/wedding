// Static technical layout only; reuse existing complete cutouts without redrawing.
// No network, generation, upload, or production-site changes.
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const deps='/Users/eleme/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const sharp=require(path.join(deps,'sharp'));
const {createCanvas,loadImage}=require(path.join(deps,'@napi-rs/canvas'));
const source=path.resolve(__dirname,'../v10.81-clean-alpha/characters-transparent.png');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const W=900,H=1600,card={left:130,top:50,width:640,height:1500};
const plans=[{name:'groom',left:497,top:350,height:400},{name:'bride',left:410,top:830,height:400}];
async function main(){
 const originalHash=sha(source);
 const {data,info}=await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const w=info.width,h=info.height,n=w*h,labels=new Int32Array(n),queue=new Int32Array(n),parts=[];let label=0;
 for(let s=0;s<n;s++)if(data[s*4+3]>0&&!labels[s]){
  let head=0,tail=0;label++;queue[tail++]=s;labels[s]=label;let x0=w,x1=0,y0=h,y1=0;
  while(head<tail){const i=queue[head++],x=i%w,y=Math.floor(i/w);x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);
   for(const j of [x?i-1:-1,x<w-1?i+1:-1,y?i-w:-1,y<h-1?i+w:-1])if(j>=0&&data[j*4+3]>0&&!labels[j]){labels[j]=label;queue[tail++]=j;}
  }parts.push({label,count:tail,x0,x1,y0,y1});
 }
 const mainParts=parts.sort((a,b)=>b.count-a.count).slice(0,2).sort((a,b)=>a.y0-b.y0);
 assert.equal(mainParts.length,2);assert(parts.slice(2).every(p=>p.count<20));
 const scene=createCanvas(W,H),ctx=scene.getContext('2d');
 ctx.fillStyle='#29323a';ctx.fillRect(0,0,W,H);
 ctx.fillStyle='#501c19';ctx.fillRect(card.left+3,card.top+3,card.width,card.height);
 ctx.fillStyle='#942e26';ctx.fillRect(card.left,card.top,card.width,card.height);
 const layout=[];
 for(let k=0;k<2;k++){
  const p=mainParts[k],bw=p.x1-p.x0+1,bh=p.y1-p.y0+1,buf=Buffer.alloc(bw*bh*4);
  for(let y=p.y0;y<=p.y1;y++)for(let x=p.x0;x<=p.x1;x++){const i=y*w+x;if(labels[i]===p.label)data.copy(buf,((y-p.y0)*bw+x-p.x0)*4,i*4,i*4+4);}
  const file=path.join(__dirname,`${plans[k].name}.png`);
  await sharp(buf,{raw:{width:bw,height:bh,channels:4}}).png().toFile(file);
  const width=bw*plans[k].height/bh,L={...plans[k],width,sourceBounds:p};layout.push(L);
  ctx.drawImage(await loadImage(file),L.left,L.top,L.width,L.height);
 }
 fs.writeFileSync(path.join(__dirname,'first-frame-candidate.png'),scene.toBuffer('image/png'));
 // Separate diagram: guide labels must never be uploaded as the reference.
 const diagram=createCanvas(W,H),d=diagram.getContext('2d');d.drawImage(scene,0,0);
 d.strokeStyle='#ffe5a8';d.lineWidth=2;d.setLineDash([9,8]);
 layout.forEach(L=>d.strokeRect(L.left-12,L.top-12,L.width+24,L.height+24));
 d.beginPath();d.moveTo(770,80);d.lineTo(770,1530);d.stroke();d.setLineDash([]);
 const grip={x:497+(1241-mainParts[0].x0)*400/(mainParts[0].y1-mainParts[0].y0+1),y:350+(458-mainParts[0].y0)*400/(mainParts[0].y1-mainParts[0].y0+1)};
 d.fillStyle='#fff1b9';d.beginPath();d.arc(grip.x,grip.y,8,0,Math.PI*2);d.fill();
 d.font='22px sans-serif';d.fillText('REFERENCE ONLY / NOT THE LIVE INVITATION',170,110);
 d.fillText('grip → left 200 px',200,grip.y-45);
 d.beginPath();d.moveTo(grip.x,grip.y);d.lineTo(grip.x-200,grip.y);d.lineTo(grip.x-184,grip.y-9);d.moveTo(grip.x-200,grip.y);d.lineTo(grip.x-184,grip.y+9);d.stroke();
 d.fillText('0–0.6s contact · 0.6–3.2s pull · 3.2–4s settle',155,1425);
 d.fillText('FULL FIGURES STAY IN FRAME · NO REAL PHOTO',160,1470);
 fs.writeFileSync(path.join(__dirname,'layout-check.png'),diagram.toBuffer('image/png'));
 const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
 let minimumCarrierMargin=Infinity,minimumCardMargin=Infinity,minActorVerticalGap=Infinity;
 for(let t=0;t<=4.00001;t+=.01){
  const a=layout.map((L,k)=>({...L,left:L.left-200*smooth((t-.6-(k?.25:0))/(k?2.55:2.6))}));
  for(const L of a){minimumCarrierMargin=Math.min(minimumCarrierMargin,L.left,W-L.left-L.width,L.top,H-L.top-L.height);minimumCardMargin=Math.min(minimumCardMargin,L.left-card.left,card.left+card.width-L.left-L.width);}
  minActorVerticalGap=Math.min(minActorVerticalGap,a[1].top-a[0].top-a[0].height);
 }
 assert(minimumCarrierMargin>=100);assert(minimumCardMargin>=-1);assert(minActorVerticalGap>=70);assert(Math.abs(grip.x-770)<3);assert.equal(sha(source),originalHash);
 const report={version:'10.87',status:'HOLD_REAL_VIDEO_COMPOSITE_NOT_VERIFIED',kind:'static_layout_and_director_targets_not_generated_motion',source:'../v10.81-clean-alpha/characters-transparent.png',sourceSha256:originalHash,frame:{width:W,height:H},card,layout,grip,desiredPull:{dx:-200,dy:0,endProjectedCardAngleDegrees:Math.acos((640-200)/640)*180/Math.PI},checks:{sourceFileUnchanged:true,completeComponents:2,minimumCarrierMarginPx:minimumCarrierMargin,minimumCardMarginPx:minimumCardMargin,minActorVerticalGapPx:minActorVerticalGap,gripToCardEdgePx:Math.abs(grip.x-770),realPhotoIncluded:false},gates:{staticLayout:true,promptPrepared:true,platformConfigured:false,actualVideoMatte:false,actualVideoHandTracking:false,mobileComposite:false,readyToSpendCredits:false},limits:['Pixel-preserving component extraction, then uniform resize for layout; not original resolution in output.','Checks only cover prescribed translation envelopes, NOT AI-generated body movement.','Flat rectangular prop is a spatial reference, not proof of thick-card motion.','Reference side margins are off-site working space; production invitation is untouched.','Source pose lacks a separate thumb/fingers: palm contact is intended, not realistic finger wrapping.','Second segment needs release BEFORE handholding/flight.']};
 fs.writeFileSync(path.join(__dirname,'verification.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report,null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1});
