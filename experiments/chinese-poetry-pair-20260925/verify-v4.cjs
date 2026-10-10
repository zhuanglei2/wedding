const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('/Users/eleme/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');

async function main() {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, 'style-v4.css'), 'utf8');
  assert.equal((html.match(/<img /g) || []).length, 1);
  assert(html.includes('style-v4.css') && html.includes('corridor-lossless.webp'));
  assert(!/garden.webp|red-thread|figcaption|摘自|婚礼请柬/.test(html));
  assert(!/filter:|box-shadow:|rotate\(|mask-image:/.test(css));
  for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    assert(fs.existsSync(path.resolve(__dirname, match[1])), `Missing ${match[1]}`);
  }
  for (const match of css.matchAll(/url\("([^"]+)"\)/g)) {
    assert(fs.existsSync(path.resolve(__dirname, match[1])), `Missing ${match[1]}`);
  }
  const source = await sharp('/Users/eleme/Desktop/wedding/IMG_8989.PNG.JPG').removeAlpha().raw().toBuffer();
  const displayed = await sharp(path.join(__dirname, 'media/corridor-lossless.webp')).removeAlpha().raw().toBuffer();
  assert(source.equals(displayed), 'Original decoded photograph pixels are preserved');

  for (const [viewportWidth, viewportHeight] of [[320,568],[375,667],[390,844],[430,932],[320,932],[600,400],[1024,768],[1440,900]]) {
    const w = viewportWidth <= 600 ? viewportWidth : Math.min(viewportWidth, 520);
    const h = Math.max(viewportHeight, w * 1.5);
    const pw = w * .86, ph = h * .71;
    const iw = Math.max(pw, ph * .66779661), scale = iw / 591;
    const imageTop = ph - 1014 * scale;
    const photographTop = imageTop + 129 * scale;
    const top = h * .215;
    const font = Math.min(w * .076, h * .028);
    assert(h * .055 + h * .02 + font * 4.6 < top, 'Poem remains above photo');
    assert(photographTop <= .0001, 'Top screenshot bar stays outside window');
    // Check a conservative source rectangle covering both people. In the curved
    // upper corners, also test against the gate ellipse, not only its bounding box.
    for (const sx of [180, 435]) for (const sy of [449, 987]) {
      const x = pw / 2 + (sx - 591 / 2) * scale;
      const y = imageTop + sy * scale;
      assert(x > 0 && x < pw && y > 0 && y < ph, 'People inside photograph');
      const rx = pw / 2, ry = ph * .28;
      if (y < ry) assert(((x-rx)/rx)**2 + ((y-ry)/ry)**2 < 1, 'People clear curved corners');
    }
    assert(top + ph <= h * .925 + .0001, 'Photo stays in the fixed sheet');
    console.log(`PASS ${viewportWidth}x${viewportHeight}: sheet ${w}x${h}, photo ${pw.toFixed(1)}x${ph.toFixed(1)}`);
  }
  console.log('PASS one photo; original pixels; no missing assets; static layout/crop checks. Not browser visual QA.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
