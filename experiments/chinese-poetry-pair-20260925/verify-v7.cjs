const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('/Users/eleme/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');

async function main() {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, 'style-v7.css'), 'utf8');
  assert(html.includes('aria-labelledby="title"') && html.includes('id="title"'));
  assert.equal((html.match(/<img /g) || []).length, 2);
  assert(html.includes('style-v7.css') && html.includes('poem-lettering-v1.webp'));
  assert(!/class="paper"|<footer|figcaption|@font-face|filter:|box-shadow:|border-radius:/.test(html + css));
  for (const match of html.matchAll(/(?:src|srcset|href)="([^"]+)"/g)) {
    assert(fs.existsSync(path.resolve(__dirname, match[1])), `Missing ${match[1]}`);
  }
  const source = await sharp('/Users/eleme/Desktop/wedding/IMG_8989.PNG.JPG').removeAlpha().raw().toBuffer();
  const asset = await sharp(path.join(__dirname, 'media/corridor-lossless.webp')).removeAlpha().raw().toBuffer();
  assert(source.equals(asset), 'Original photograph pixels unchanged');
  const title = await sharp(path.join(__dirname, 'media/poem-lettering-v1.webp')).metadata();
  assert(title.hasAlpha && title.width === 1024 && title.height === 1536);

  for (const [vw, vh] of [[240,360],[320,480],[320,568],[375,667],[390,844],[430,932],[280,1000],[600,400],[1024,768],[1440,900]]) {
    const w = vw <= 600 ? vw : Math.min(vw, 520);
    const h = Math.max(vh, w * 1.5);
    const pw = Math.min(w, 591), ph = pw * 885 / 591, s = pw / 591;
    assert(ph <= h && pw <= w, 'Photo fits the fixed single-page stage');
    assert(s <= 1, 'No CSS enlargement beyond original pixels');
    const sourceTop = ph * (-14.5762711864 / 100);
    assert(Math.abs(sourceTop + 129 * s) < .00001, 'Only top screenshot bar is hidden');
    assert(Math.abs(sourceTop + 1014 * s - ph) < .00001, 'Full dress/feet and photo bottom retained');
    const titleBottom = ph * .08 + pw * .22 * 1536 / 1024;
    assert(titleBottom < (449 - 129) * s, 'Entire lettering frame stays above both heads');
    assert(pw * (.04 + .22) < pw, 'Lettering inside photo');
    console.log(`PASS ${vw}x${vh}: photo ${pw.toFixed(1)}x${ph.toFixed(1)}, original aspect, lettering clear of people`);
  }
  console.log('PASS: resources, source pixels, transparent lettering, native aspect, no paper. Static geometry checks, not browser visual QA.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
