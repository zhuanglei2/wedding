// Diagnostic background flood-key only. Not a production roto/semantic mask.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const deps='/Users/eleme/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const sharp=require(path.join(deps,'sharp')),{createCanvas,loadImage}=require(path.join(deps,'@napi-rs/canvas'));
const dir=process.argv[2],meta=JSON.parse(fs.readFileSync(path.join(dir,'decode.json'))),W=576,H=1024;
const indices=[0,36,60,96],crop={left:150,top:240,width:405,height:480};
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
function key(rgb,tol){
 const n=W*H,eligible=new Uint8Array(n),bg=new Uint8Array(n),q=new Int32Array(n);
 // Source-checked background classes: warm red card and pale beige surroundings.
 for(let i=0;i<n;i++){
  const r=rgb[i*3],g=rgb[i*3+1],b=rgb[i*3+2];
  const red=r>60&&r>g*1.45&&g>b*1.08&&b<95;
  const beige=Math.hypot(r-220,g-213,b-196)<tol;
  eligible[i]=red||beige?1:0;
 }
 let head=0,tail=0;const add=i=>{if(eligible[i]&&!bg[i]){bg[i]=1;q[tail++]=i;}};
 for(let x=0;x<W;x++){add(x);add((H-1)*W+x);}for(let y=0;y<H;y++){add(y*W);add(y*W+W-1);}
 while(head<tail){const i=q[head++],x=i%W,y=Math.floor(i/W);if(x)add(i-1);if(x<W-1)add(i+1);if(y)add(i-W);if(y<H-1)add(i+W);}
 const rgba=Buffer.alloc(n*4);let retained=0;
 for(let i=0;i<n;i++){rgba[i*4]=rgb[i*3];rgba[i*4+1]=rgb[i*3+1];rgba[i*4+2]=rgb[i*3+2];rgba[i*4+3]=bg[i]?0:255;if(!bg[i])retained++;}
 return {rgba,retained};
}
async function main(){
 const before=hash(meta.input),sheet=createCanvas(4*320,4*550),s=sheet.getContext('2d');s.fillStyle='#151b22';s.fillRect(0,0,sheet.width,sheet.height);
 const detail=createCanvas(4*400,700),d=detail.getContext('2d');d.fillStyle='#151b22';d.fillRect(0,0,detail.width,detail.height);
 const measurements=[];
 fs.mkdirSync(path.join(dir,'diagnostic'),{recursive:true});
 fs.mkdirSync(path.join(dir,'compare-frames'),{recursive:true});
 const backgrounds=['#172532','#f7f0e1'];
 const cover=await sharp(path.resolve(__dirname,'../../versions/v10.71-collar-and-motion/cover.webp')).resize(W,H,{fit:'contain',background:'#172532'}).removeAlpha().raw().toBuffer();
 for(let f=0;f<meta.frames.length;f++){
  const frame=meta.frames[f],raw=await sharp(path.join(dir,frame.file)).removeAlpha().raw().toBuffer();
  const safe=key(raw,28),hard=key(raw,85);
  measurements.push({frame:f,time:frame.time,conservativeRetained:safe.retained,aggressiveRetained:hard.retained});
  const movie=createCanvas(1152,1064),m=movie.getContext('2d');m.fillStyle='#172532';m.fillRect(0,0,1152,1064);
  const native=await sharp(raw,{raw:{width:W,height:H,channels:3}}).png().toBuffer(),mattePNG=await sharp(safe.rgba,{raw:{width:W,height:H,channels:4}}).png().toBuffer();
  m.drawImage(await loadImage(native),0,40);m.drawImage(await loadImage(mattePNG),576,40);
  m.fillStyle='white';m.font='19px sans-serif';m.fillText(`ORIGINAL / ${frame.time.toFixed(3)}s`,12,27);m.fillText('DIAGNOSTIC KEY ONLY / NOT APPROVED',588,27);
  fs.writeFileSync(path.join(dir,'compare-frames',`frame-${String(f+1).padStart(3,'0')}.png`),movie.toBuffer('image/png'));
  if(!indices.includes(f))continue;
  const col=indices.indexOf(f),x=col*320;
  const orig=await sharp(raw,{raw:{width:W,height:H,channels:3}}).png().toBuffer();
  d.drawImage(await loadImage(orig),crop.left,crop.top,crop.width,crop.height,col*400,42,400,474);d.fillStyle='white';d.font='22px sans-serif';d.fillText(`SOURCE ${frame.time.toFixed(3)}s (enlarged)`,col*400+8,30);
  const samples=[{label:'Original',buf:orig},{label:'Conservative key / dark',rgba:safe.rgba,bg:backgrounds[0]},{label:'Aggressive key / light',rgba:hard.rgba,bg:backgrounds[1]},{label:'Conservative / real cover',rgba:safe.rgba,cover:true}];
  for(let row=0;row<samples.length;row++){
   const sample=samples[row];let png=sample.buf;
   if(!png){const matte=await sharp(sample.rgba,{raw:{width:W,height:H,channels:4}}).png().toBuffer();const base=sample.cover?sharp(cover,{raw:{width:W,height:H,channels:3}}):sharp({create:{width:W,height:H,channels:3,background:sample.bg}});png=await base.composite([{input:matte}]).png().toBuffer();}
   s.drawImage(await loadImage(png),x,row*550+40,288,512);s.fillStyle='white';s.font='15px sans-serif';s.fillText(`${frame.time.toFixed(3)}s · ${sample.label}`,x+4,row*550+24);
   if(row===1)fs.writeFileSync(path.join(dir,'diagnostic',`key-${f}.png`),png);
  }
 }
 fs.writeFileSync(path.join(__dirname,'matte-comparison.png'),sheet.toBuffer('image/png'));
 fs.writeFileSync(path.join(__dirname,'source-detail-sheet.png'),detail.toBuffer('image/png'));
 fs.writeFileSync(path.join(__dirname,'matte-metrics.json'),JSON.stringify({method:'border-connected red hue + Euclidean beige key; thresholds 28 and 85; no semantic foreground ground truth',allFramesProcessed:measurements.length,sourceUnchanged:hash(meta.input)===before,measurements,warning:'Retained pixel count is not mask accuracy. Both candidates require visual assessment; no success score is claimed.'},null,2));
 console.log({processed:measurements.length,sourceUnchanged:hash(meta.input)===before});
}
main().catch(e=>{console.error(e);process.exitCode=1});
