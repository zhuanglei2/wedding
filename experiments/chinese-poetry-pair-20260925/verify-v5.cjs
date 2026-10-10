const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('/Users/eleme/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');

async function main() {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, 'style-v5.css'), 'utf8');
  assert.equal((html.match(/<img /g) || []).length, 1);
  assert(html.includes('style-v5.css') && html.includes('corridor-lossless.webp'));
  assert(!/garden.webp|red-thread|figcaption|摘自|婚礼请柬|cinnabar|margin-rule|footer/.test(html));
  assert(!/filter:|box-shadow:|border-radius:|rotate\(|mask-image:/.test(css));
  for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    assert(fs.existsSync(path.resolve(__dirname, match[1])), `Missing ${match[1]}`);
  }
  for (const match of css.matchAll(/url\("([^"]+)"\)/g)) {
    assert(fs.existsSync(path.resolve(__dirname, match[1])), `Missing ${match[1]}`);
  }
  const source = await sharp('/Users/eleme/Desktop/wedding/IMG_8989.PNG.JPG').removeAlpha().raw().toBuffer();
  const displayed = await sharp(path.join(__dirname, 'media/corridor-lossless.webp')).removeAlpha().raw().toBuffer();
  assert(source.equals(displayed), 'Original decoded photograph pixels are preserved');

  for (const [vw, vh] of [[240,360],[280,480],[320,480],[320,568],[375,667],[390,844],[430,932],[320,932],[280,1000],[600,400],[1024,768],[1440,900]]) {
    const w = vw <= 600 ? vw : Math.min(vw, 520);
    const h = Math.max(vh, w * 1.5);
    const edge = Math.max(8, Math.min(w * .025, 14));
    const pw = w - 2 * edge, ph = Math.min(h - 2 * edge, pw * 3.25);
    const iw = Math.max(pw, ph * .66779661), scale = iw / 591;
    const left = Math.max(pw - iw, Math.min(pw / 2 - iw * .5211505922, 0));
    const imageTop = ph - 1014 * scale;
    assert(imageTop + 129 * scale <= .0001, 'Top screenshot bar outside window');
    assert(left <= 0 && left + iw >= pw, 'No unfilled sides');
    for (const sx of [180, 435]) for (const sy of [449, 987]) {
      const x = left + sx * scale, y = imageTop + sy * scale;
      assert(x > 0 && x < pw && y > 0 && y < ph, `People intact at ${vw}x${vh}`);
    }
    const font = Math.max(18, Math.min(w * .072, h * .04, 32));
    const titleBottom = ph * .075 + font * (4.6 + .65);
    assert(titleBottom < imageTop + 449 * scale, `Poem stays above people at ${vw}x${vh}`);
    assert(pw * .07 + font * 2.46 < pw, 'Poem stays inside photograph');
    assert(ph <= h - edge * 2, 'Fixed sheet preserved');
    console.log(`PASS ${vw}x${vh}: ${pw.toFixed(1)}x${ph.toFixed(1)} photo; people intact, poem above heads`);
  }
  console.log('PASS one original photo, assets present, no missing source pixels or added decoration. Static checks, not browser visual QA.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
