const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const sharp = require('sharp');
const W = 1200, H = 1540, CROP_H = 700;
const root = __dirname, design = path.join(root, 'design');
const previous = path.resolve(root, '../v10.193-compact-drawn-paper');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const smooth = value => value * value * (3 - 2 * value);

// Registration affects the generated PENCIL/PAPER layer only. The photo's
// perspective, size, tear coordinates and people are never warped.
const sourceX = [0, 50, 80, 827, 849, 935, 1007, 1066, 1090, 1200];
function targetX(y) {
  return [0,
    124 + (y - 502) * 23 / 319,
    158 + (y - 490) * 24 / 306,
    849 - (y - 278) * 13 / 350,
    875 - (y - 284) * 15 / 369,
    984 - (y - 254) * 20 / 386,
    1050 - (y - 253) * 22 / 387,
    1108 - (y - 238) * 28 / 412,
    1146 - (y - 230) * 28 / 420,
    1200];
}
function sourceCoordinate(x, y) {
  const target = targetX(y);
  let i = 0;
  while (i < target.length - 2 && x > target[i + 1]) i++;
  return sourceX[i] + (x - target[i]) / (target[i + 1] - target[i]) * (sourceX[i + 1] - sourceX[i]);
}
async function main() {
  fs.mkdirSync(path.join(root, 'media'), { recursive: true });
  const originalFile = path.join(previous, 'design/gathered-scenes-master.png');
  const originalBytes = fs.readFileSync(originalFile);
  const original = await sharp(originalBytes).removeAlpha().raw().toBuffer();
  const art = await sharp(path.join(design, 'generated-paper.png')).resize(W, CROP_H).removeAlpha().raw().toBuffer();
  const edge = JSON.parse(fs.readFileSync(path.join(previous, 'design/edge.json'))).map(y => y - 260);
  const smoothEdge = edge.map((_, x) => {
    let sum = 0, count = 0;
    for (let i = Math.max(0, x - 24); i <= Math.min(W - 1, x + 24); i++) { sum += edge[i]; count++; }
    return sum / count;
  });
  const result = Buffer.from(original);
  const sample = (x, y, channel) => {
    x = clamp(x, 0, W - 1); y = clamp(y, 0, CROP_H - 1);
    const x0 = Math.floor(x), x1 = Math.min(W - 1, x0 + 1), fx = x - x0;
    const y0 = Math.floor(y), y1 = Math.min(CROP_H - 1, y0 + 1), fy = y - y0;
    const a = art[(y0 * W + x0) * 3 + channel] * (1 - fx) + art[(y0 * W + x1) * 3 + channel] * fx;
    const b = art[(y1 * W + x0) * 3 + channel] * (1 - fx) + art[(y1 * W + x1) * 3 + channel] * fx;
    return a * (1 - fy) + b * fy;
  };
  for (let y = 0; y < CROP_H; y++) for (let x = 0; x < W; x++) {
    const distance = edge[x] - y;
    if (distance <= 0) continue;
    const sx = sourceCoordinate(x, y);
    const e0 = smoothEdge[Math.floor(clamp(sx, 0, W - 1))];
    // The small near-edge vertical registration keeps the generated tear
    // underneath the SAME photographic boundary, avoiding a second seam.
    const sy = y + (e0 - smoothEdge[x]) * smooth(clamp(1 - distance / 100, 0, 1));
    const alpha = smooth(clamp(distance / 8, 0, 1));
    for (let c = 0; c < 3; c++) {
      const index = (y * W + x) * 3 + c;
      result[index] = Math.round(sample(sx, sy, c) * alpha + original[index] * (1 - alpha));
    }
  }
  let preserved = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (y < edge[x]) continue;
    for (let c = 0; c < 3; c++) assert.equal(result[(y * W + x) * 3 + c], original[(y * W + x) * 3 + c]);
    preserved++;
  }
  const master = await sharp(result, { raw: { width: W, height: H, channels: 3 } }).png().toBuffer();
  fs.writeFileSync(path.join(design, 'gathered-scenes-master.png'), master);
  await sharp(master).extract({ left: 0, top: 0, width: W, height: CROP_H }).png().toFile(path.join(design, 'aligned-seam.png'));
  const assets = [];
  for (const width of [600, 900, 1200]) {
    const file = `gathered-scenes-${width}.webp`, target = path.join(root, 'media', file);
    await sharp(master).resize({ width }).webp({ quality: 91, effort: 6, smartSubsample: true }).toFile(target);
    assets.push({ file, width, height: Math.round(width * H / W), bytes: fs.statSync(target).size });
  }
  const lyricsRoot = path.resolve(root, '../v10.191-compact-scene-lyrics/design');
  const paper = await sharp(path.join(lyricsRoot, 'page-two-paper-sample.png')).extract({ left: 0, top: 0, width: W, height: 408 }).png().toBuffer();
  const lyrics = await sharp(path.join(lyricsRoot, 'lyrics-generated.png')).resize({ width: 1080 }).png().toBuffer();
  const proof = await sharp({ create: { width: W, height: H + 408, channels: 3, background: '#f8f5ef' } }).composite([
    { input: master, left: 0, top: 0 }, { input: paper, left: 0, top: H }, { input: lyrics, left: 60, top: H }
  ]).png().toBuffer();
  await sharp(proof).resize({ width: 720 }).png().toFile(path.join(design, 'layout-preview.png'));
  fs.writeFileSync(path.join(design, 'asset-manifest.json'), JSON.stringify({
    source: originalFile, sourceHash: hash(originalBytes), canvas: { width: W, height: H }, nativePixelChecks: preserved,
    sourceAnchors: sourceX, targetAnchorsAtSeam: targetX(270), assets,
    policy: 'ImageGen reworked only the upper paper crop; registered generated pencil architecture to immutable photo axes. All RGB at/below the original tear is identical to V193 PNG master. WebP delivery remains lossy. No people, scale, framing or lyrics changes.'
  }, null, 2) + '\n');
  console.log(JSON.stringify({ preserved, assets }));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
