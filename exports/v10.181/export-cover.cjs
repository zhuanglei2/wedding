// Export the existing V10.181 first-page composition; no AI redraw or source edits.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const sharp = require('sharp');
const root = path.resolve(__dirname, '../..');
const master = path.join(root, 'versions/v10.54-photo-right/invitation-v10.54.png');
const css = fs.readFileSync(path.join(root, 'versions/v10.180-closer-couple/cover-photo.css'), 'utf8');
const sha = buffer => crypto.createHash('sha256').update(buffer).digest('hex');

(async () => {
  // These are the native composition's photo window and CSS 112% scaling.
  assert(css.includes('width:179.8165137615%'));
  assert(css.includes('top:-193.1407942238%'));
  const source = fs.readFileSync(master);
  const sourceHash = sha(source);
  const metadata = await sharp(source).metadata();
  assert.equal(metadata.width, 1400);
  assert.equal(metadata.height, 3282);
  const frame = { left:264, top:1344, width:872, height:831 };
  const scale = 1.12;
  const x = -frame.left*scale-frame.width*(scale-1)/2;
  const y = -frame.top*scale-frame.height*(scale-1);
  // Rasterize only the existing webpage's crop window at its native resolution.
  const viewport = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${frame.width}" height="${frame.height}" viewBox="0 0 ${frame.width} ${frame.height}"><image x="${x}" y="${y}" width="${metadata.width*scale}" height="${metadata.height*scale}" xlink:href="data:image/png;base64,${source.toString('base64')}"/></svg>`;
  const photo = await sharp(Buffer.from(viewport)).png().toBuffer();
  const rendered = await sharp(source).composite([{input:photo,left:frame.left,top:frame.top}]).png().toBuffer();
  const before = await sharp(source).removeAlpha().raw().toBuffer();
  const after = await sharp(rendered).removeAlpha().raw().toBuffer();
  assert.equal(before.length, after.length);
  for(let row=0;row<metadata.height;row++) for(let col=0;col<metadata.width;col++) {
    if(col>=frame.left && col<frame.left+frame.width && row>=frame.top && row<frame.top+frame.height) continue;
    const offset=(row*metadata.width+col)*3;
    assert.equal(after[offset],before[offset]);
    assert.equal(after[offset+1],before[offset+1]);
    assert.equal(after[offset+2],before[offset+2]);
  }
  const name=path.join(__dirname,'庄磊与吴郁-婚礼请柬');
  await sharp(rendered).png({compressionLevel:9}).toFile(name+'.png');
  await sharp(rendered).jpeg({quality:96,chromaSubsampling:'4:4:4',mozjpeg:true}).toFile(name+'.jpg');
  assert.equal(sha(fs.readFileSync(master)),sourceHash);
  console.log(JSON.stringify({width:metadata.width,height:metadata.height,zoom:scale,sourceUnchanged:true,outsidePhotoPixelIdentical:true,files:['.png','.jpg'].map(ext=>({path:name+ext,bytes:fs.statSync(name+ext).size}))},null,2));
})().catch(error=>{console.error(error.message);process.exitCode=1;});
