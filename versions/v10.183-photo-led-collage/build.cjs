/* Deterministic composition: image generation supplies paper ONLY.
   Original portraits are fitted in full; no AI portrait pixels, filters or retouching. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require('sharp');
const root = __dirname;
const sourcePaths = [
  '/Users/eleme/Desktop/wedding/087f4a3a79f7b920abff19f11eb716ef.jpg',
  '/Users/eleme/Desktop/wedding/a4ac32bfdq9fbe2e01e87def7bd2b44b.jpg'
];
const generated = process.argv[2];
const hash = data => crypto.createHash('sha256').update(data).digest('hex');

function components(data, width, height) {
  const seen = new Uint8Array(width * height), found = [];
  const dark = i => Math.max(data[i * 3], data[i * 3 + 1], data[i * 3 + 2]) < 75;
  for (let start = 0; start < seen.length; start++) {
    if (seen[start] || !dark(start)) continue;
    const queue = [start]; seen[start] = 1;
    let minX = width, minY = height, maxX = 0, maxY = 0;
    for (let j = 0; j < queue.length; j++) {
      const i = queue[j], x = i % width, y = Math.floor(i / width);
      minX = Math.min(minX,x); maxX = Math.max(maxX,x);
      minY = Math.min(minY,y); maxY = Math.max(maxY,y);
      for (const n of [x > 0 ? i-1 : -1, x+1 < width ? i+1 : -1, y > 0 ? i-width : -1, y+1 < height ? i+width : -1]) {
        if (n >= 0 && !seen[n] && dark(n)) { seen[n] = 1; queue.push(n); }
      }
    }
    if (queue.length > width * height * .05) found.push({pixels:queue, x:minX,y:minY,width:maxX-minX+1,height:maxY-minY+1});
  }
  return found.sort((a,b) => a.y-b.y);
}

// Largest fully opaque inner rectangle: the entire photograph must remain INSIDE it.
function interior(component, width, height) {
  const mask = new Uint8Array(width * height);
  component.pixels.forEach(i => mask[i] = 1);
  const heights = new Int32Array(width); let best={area:0};
  for (let y=component.y; y<component.y+component.height; y++) {
    for (let x=0; x<width; x++) heights[x] = mask[y*width+x] ? heights[x]+1 : 0;
    const stack=[];
    for (let x=0; x<=width; x++) {
      const h=x===width?0:heights[x]; let left=x;
      while (stack.length && stack[stack.length-1].height > h) {
        const prev=stack.pop(), area=prev.height*(x-prev.left); left=prev.left;
        if (area>best.area) best={area,x:prev.left,y:y-prev.height+1,width:x-prev.left,height:prev.height};
      }
      if (!stack.length || stack[stack.length-1].height<h) stack.push({left,height:h});
    }
  }
  return {x:best.x+3,y:best.y+3,width:best.width-6,height:best.height-6};
}

(async()=>{
  const media=path.join(root,'media'), proof=path.join(root,'design');
  fs.mkdirSync(media,{recursive:true}); fs.mkdirSync(proof,{recursive:true});
  if (generated) fs.copyFileSync(generated,path.join(proof,'paper-template.png'));
  const input=path.join(proof,'paper-template.png');
  const {data,info}=await sharp(input).removeAlpha().raw().toBuffer({resolveWithObject:true});
  const holes=components(data,info.width,info.height);
  if(holes.length!==2)throw Error('Expected exactly two black insertion windows; found '+holes.length);
  const clean=Buffer.from(data);
  for(const hole of holes){
    // Remove black key-colour antialiasing from the generated aperture fringe.
    // This runs on the empty paper template, before either original is inserted.
    const nearKey=new Uint8Array(info.width*info.height);
    for(const i of hole.pixels){
      const x=i%info.width,y=Math.floor(i/info.width);
      for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){
        if(x+dx>=0&&x+dx<info.width&&y+dy>=0&&y+dy<info.height)nearKey[(y+dy)*info.width+x+dx]=1;
      }
    }
    for(let y=Math.max(0,hole.y-2);y<Math.min(info.height,hole.y+hole.height+2);y++){
      for(let x=Math.max(0,hole.x-2);x<Math.min(info.width,hole.x+hole.width+2);x++){
        if(!nearKey[y*info.width+x])continue;
        const p=(y*info.width+x)*3,values=[data[p],data[p+1],data[p+2]];
        if(Math.max(...values)<222 && Math.max(...values)-Math.min(...values)<62){
          clean[p]=248;clean[p+1]=245;clean[p+2]=239;
        }
      }
    }
  }
  const W=1200,H=2000;
  let canvas=await sharp(clean,{raw:info}).resize(W,H,{fit:'fill'}).png().toBuffer();
  const layers=[],records=[];
  // Use the planned full-photo geometry, NOT a generated matte's inner shape.
  // The previous version fitted photos to irregular holes and introduced thick
  // white letterboxing. Here every original fills its own true-aspect window.
  const photoLayout=[
    {left:60,top:60,width:1080,height:720},
    {left:420,top:835,width:720,height:1080}
  ];
  for(let i=0;i<holes.length;i++){
    const src=sourcePaths[i===0?1:0],raw=fs.readFileSync(src),meta=await sharp(raw).metadata();
    const rect=photoLayout[i];
    const fit=await sharp(raw).rotate().resize(rect.width,rect.height,{fit:'inside',withoutEnlargement:true}).removeAlpha().png().toBuffer({resolveWithObject:true});
    const placement={left:rect.left+Math.floor((rect.width-fit.info.width)/2),top:rect.top+Math.floor((rect.height-fit.info.height)/2)};
    layers.push({input:fit.data,...placement});
    records.push({source:src,sha256:hash(raw),original:{width:meta.width,height:meta.height},resizeBox:rect,photoRect:{...placement,width:fit.info.width,height:fit.info.height},templateWindow:holes[i],resizedPixels:fit.data});
  }
  canvas=await sharp(canvas).composite(layers).png().toBuffer();
  // Prove every output photographic pixel is exactly the original's resized pixel.
  for(const record of records){
    const actual=await sharp(canvas).extract(record.photoRect).removeAlpha().raw().toBuffer();
    const expected=await sharp(record.resizedPixels).removeAlpha().raw().toBuffer();
    if(!actual.equals(expected))throw Error('Photo was modified during composition');
    if(hash(fs.readFileSync(record.source))!==record.sha256)throw Error('Original file changed');
    record.pixelProof='PASS: all fitted-photo pixels equal directly resized source; no crop, no retouch, no overlay';
    delete record.resizedPixels; delete record.templateWindow.pixels;
  }
  fs.writeFileSync(path.join(proof,'gathered-scenes-master.png'),canvas);
  const files=[];
  for(const width of [600,900,1200]){
    const filename='gathered-scenes-'+width+'.webp',out=path.join(media,filename);
    await sharp(canvas).resize(width).webp({quality:90,effort:6,smartSubsample:true}).toFile(out);
    files.push({file:filename,width,height:Math.round(width*5/3),bytes:fs.statSync(out).size});
  }
  await sharp(canvas).resize(360,600).png().toFile(path.join(proof,'thumbnail.png'));
  const report={canvas:{width:W,height:H},referencePolicy:'Original source bytes untouched. No generative portrait content. Clean landscape supplied by user; no watermark removal.',photos:records,assets:files};
  fs.writeFileSync(path.join(proof,'asset-manifest.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
