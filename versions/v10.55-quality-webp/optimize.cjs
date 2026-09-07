// Delivery-only encoding: no resize, crop, retouch, or source overwrite.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require('/Users/eleme/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const source = path.join(__dirname, '../v10.54-photo-right/invitation-v10.54.png');
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
(async () => {
  const before = hash(source);
  const originalBytes = fs.statSync(source).size;
  const results = await Promise.all([
    ['cover.webp', {quality:90, effort:6, smartSubsample:true}],
    ['cover.jpg', {quality:92, chromaSubsampling:'4:4:4', mozjpeg:true}],
  ].map(async ([name, options]) => {
    const pipeline = sharp(source);
    const encoder = name.endsWith('.webp') ? pipeline.webp(options) : pipeline.jpeg(options);
    const info = await encoder.toFile(path.join(__dirname, name));
    if (info.width !== 1400 || info.height !== 3282) throw Error('Unexpected dimensions');
    return {name, ...options, width:info.width, height:info.height, bytes:info.size,
      reductionPercent: +(100 * (1-info.size/originalBytes)).toFixed(2)};
  }));
  if (hash(source) !== before) throw Error('Original changed');
  const report = {source:'../v10.54-photo-right/invitation-v10.54.png', sourceSha256:before, originalBytes, results};
  fs.writeFileSync(path.join(__dirname,'sizes.json'),JSON.stringify(report,null,2)+'\n');
  console.log(report);
})().catch(error => {console.error(error); process.exitCode=1;});
