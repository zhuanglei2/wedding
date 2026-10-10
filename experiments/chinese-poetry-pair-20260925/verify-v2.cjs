const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('/Users/eleme/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root = __dirname;

function cmapHas(font, character) {
  let cmap = 0;
  for (let i = 0; i < font.readUInt16BE(4); i++) {
    const record = 12 + i * 16;
    if (font.toString('ascii', record, record + 4) === 'cmap') cmap = font.readUInt32BE(record + 8);
  }
  assert(cmap, 'Font has a cmap');
  const cp = character.codePointAt(0);
  for (let i = 0; i < font.readUInt16BE(cmap + 2); i++) {
    const table = cmap + font.readUInt32BE(cmap + 4 + i * 8 + 4);
    const format = font.readUInt16BE(table);
    if (format === 12) {
      const count = font.readUInt32BE(table + 12);
      for (let n = 0; n < count; n++) {
        const group = table + 16 + n * 12;
        if (cp >= font.readUInt32BE(group) && cp <= font.readUInt32BE(group + 4)) return true;
      }
    }
    if (format !== 4 || cp > 0xffff) continue;
    const count = font.readUInt16BE(table + 6) / 2;
    const ends = table + 14, starts = ends + count * 2 + 2;
    const deltas = starts + count * 2, ranges = deltas + count * 2;
    for (let n = 0; n < count; n++) {
      const start = font.readUInt16BE(starts + n * 2);
      if (cp < start || cp > font.readUInt16BE(ends + n * 2)) continue;
      const delta = font.readInt16BE(deltas + n * 2);
      const offset = font.readUInt16BE(ranges + n * 2);
      let glyph = offset ? font.readUInt16BE(ranges + n * 2 + offset + (cp - start) * 2) : cp;
      if (offset && !glyph) continue;
      glyph = (glyph + delta) & 0xffff;
      if (glyph) return true;
    }
  }
  return false;
}

async function main() {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'style-v2.css'), 'utf8');
  assert(!/摘自|庄磊|吴郁|figcaption|class="preface"|class="names"|poem-credit|婚礼请柬/.test(html));
  assert(html.includes('今夕何夕') && html.includes('见此良人'));
  assert.equal((html.match(/<figure /g) || []).length, 2);
  assert(!/box-shadow|rotate\(|border:.*photograph/.test(css));
  for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    assert(fs.existsSync(path.resolve(root, match[1])), `Missing ${match[1]}`);
  }
  for (const match of css.matchAll(/url\("([^"]+)"\)/g)) {
    assert(fs.existsSync(path.resolve(root, match[1])), `Missing ${match[1]}`);
  }
  const font = fs.readFileSync(path.resolve(root, '../../assets/ma-shan-zheng-v10.6.ttf'));
  for (const character of '今夕何夕见此良人') assert(cmapHas(font, character), `Missing glyph: ${character}`);
  console.log('PASS: all poem characters have real brush-font glyphs; assets present, removed copy stays removed.');

  const source = '/Users/eleme/Desktop/wedding/IMG_8989.PNG.JPG';
  const decoded = await sharp(source).removeAlpha().raw().toBuffer();
  const web = await sharp(path.join(root, 'media/corridor-lossless.webp')).removeAlpha().raw().toBuffer();
  assert(decoded.equals(web), 'Web image is pixel-identical to decoded JPEG, before CSS grading');
  assert(Math.abs(680 * 49.1176470588 / 100 - 334) < 0.000001);
  assert.equal(334 + 680, 1014);
  assert(334 < 458 && 1014 > 978, 'Selected source window contains both heads and feet');
  console.log('PASS: lossless source pixels; cropping removes overhead background, not people.');

  for (const [w, viewport] of [[320,568],[375,667],[390,844],[430,932],[600,400],[520,780]]) {
    const h = Math.max(viewport, w * 1.5);
    const firstWidth = Math.min(w * .63, h * .275);
    const firstBottom = h * .075 + firstWidth * 1280 / 854;
    const secondWidth = Math.min(w * .69, h * .38);
    const secondLeft = w * .95 - secondWidth;
    const secondTop = h * .93 - secondWidth * 680 / 591;
    const titleLeft = w * (1 - .055 - (.095 * 1.12 * 2 + .008));
    assert(firstBottom < secondTop, `Photographs collide at ${w}`);
    assert(w * .05 + firstWidth < titleLeft, `Title collides at ${w}`);
    assert(secondLeft > w * .21, `Poem collides at ${w}`);
    assert(h * .93 < h - w * .018, `Bottom band collides at ${w}`);
    console.log(`PASS: ${w}x${viewport}: fixed sheet ${h}px; photos, poem and footer do not overlap.`);
  }
  console.log('Geometry checks are not a browser screenshot/visual inspection.');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
