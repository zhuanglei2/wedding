const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require('sharp');

const root = __dirname;
const source = '/Users/eleme/Desktop/wedding/59636a811k762aacf68c8ec4b37bbc52.jpg';
const W = 1200, H = 2000;
const sha256 = buffer => crypto.createHash('sha256').update(buffer).digest('hex');

async function main() {
  const design = path.join(root, 'design'), media = path.join(root, 'media');
  fs.mkdirSync(design, {recursive: true});
  fs.mkdirSync(media, {recursive: true});
  const original = fs.readFileSync(source), sourceHash = sha256(original);
  const metadata = await sharp(original).metadata();
  const resized = await sharp(original).rotate().resize({width: W}).removeAlpha().raw().toBuffer({resolveWithObject: true});
  const photoHeight = resized.info.height;
  const photo = await sharp(resized.data, {raw: resized.info}).png().toBuffer();

  if (process.argv.includes('--prepare')) {
    await sharp({create: {width: W, height: H, channels: 3, background: '#f6f2e9'}})
      .composite([{input: photo, left: 0, top: 0}]).png()
      .toFile(path.join(design, 'registered-single-scene.png'));
    console.log(JSON.stringify({source, sourceHash, sourceWidth: metadata.width, sourceHeight: metadata.height, canvas: [W,H], photoHeight}));
    return;
  }

  const generated = process.argv[2];
  if (generated) fs.copyFileSync(generated, path.join(design, 'generated-paper-underpainting.png'));
  const underpainting = await sharp(path.join(design, 'generated-paper-underpainting.png'))
    .resize(W, H, {fit: 'fill'}).removeAlpha().png().toBuffer();
  const rgba = Buffer.alloc(W * photoHeight * 4), alpha = Buffer.alloc(W * photoHeight);
  const scale = W / metadata.width;
  const smooth = t => { t = Math.max(0, Math.min(1, t)); return t*t*(3-2*t); };
  let protectedPixels = 0;
  for (let y=0; y<photoHeight; y++) for (let x=0; x<W; x++) {
    const sx = x/scale, sy = y/scale, i = y*W+x;
    // One CONTINUOUS photographic field, not a silhouette cutout. The entire
    // mural, sofa, window, people, veil and gown stay source-native. Only the
    // blank ceiling and lower floor meet the generated paper underpainting.
    const upper = 130 + 8*Math.sin(sx/71) + 3*Math.sin(sx/19);
    const lower = 1170 + 13*Math.sin(sx/113) + 4*Math.sin(sx/31);
    const amount = smooth((sy-upper)/35) * (1-smooth((sy-lower)/65));
    alpha[i] = Math.round(amount*255);
    if (sy >= 174 && sy <= 1130) alpha[i] = 255;
    if (alpha[i]===255) protectedPixels++;
    for (let c=0; c<3; c++) rgba[i*4+c] = resized.data[i*3+c];
    rgba[i*4+3] = alpha[i];
  }
  const nativeLayer = await sharp(rgba,{raw:{width:W,height:photoHeight,channels:4}}).png().toBuffer();
  await sharp(alpha,{raw:{width:W,height:photoHeight,channels:1}}).png().toFile(path.join(design,'preservation-mask.png'));
  const master = await sharp(underpainting).composite([{input:nativeLayer,left:0,top:0}]).removeAlpha().png().toBuffer();
  const actual = await sharp(master).removeAlpha().raw().toBuffer();
  let compared = 0;
  for (let i=0; i<alpha.length; i++) if (alpha[i]===255) {
    for(let c=0;c<3;c++) if(actual[i*3+c] !== resized.data[i*3+c]) throw Error('Native photographic pixels changed at '+i);
    compared++;
  }
  if (compared!==protectedPixels || sha256(fs.readFileSync(source))!==sourceHash) throw Error('Source fidelity verification failed');
  fs.writeFileSync(path.join(design,'gathered-scenes-master.png'),master);
  await sharp(master).resize(360,600).png().toFile(path.join(design,'thumbnail.png'));
  const assets=[];
  for (const width of [600,900,1200]) {
    const file=`gathered-scenes-${width}.webp`,target=path.join(media,file);
    await sharp(master).resize({width}).webp({quality:91,effort:6,smartSubsample:true}).toFile(target);
    assets.push({file,width,height:Math.round(width*5/3),bytes:fs.statSync(target).size});
  }
  const manifest={canvas:{width:W,height:H},source,sourceWidth:metadata.width,sourceHeight:metadata.height,sourceHash,
    policy:'One continuous source photograph. All people AND their surrounding scene are original photograph pixels, proportionally resampled only. Generated treatment is limited to environmental outer paper edges. No new accent colour. Exact pixel proof applies to lossless master; responsive WebP is lossy delivery.',
    photograph:{left:0,top:0,width:W,height:photoHeight,fullyProtectedSourceBand:[174,1130],protectedPixels,pixelProof:`PASS: ${compared} RGB pixels match directly resized original.`},assets};
  fs.writeFileSync(path.join(design,'asset-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  console.log(JSON.stringify(manifest,null,2));
}
main().catch(error=>{console.error(error);process.exitCode=1;});
