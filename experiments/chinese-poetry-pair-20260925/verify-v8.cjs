const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require('/Users/eleme/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');

async function main() {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, 'style-v8.css'), 'utf8');
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'media-manifest-v8.json'), 'utf8'));
  assert(html.includes('style-v8.css') && html.includes('poem-lettering-ivory-v2.webp'));
  assert(html.includes('aria-labelledby="title"') && html.includes('id="title"'));
  assert.equal((html.match(/<img /g) || []).length, 2);
  assert(!/corridor-lossless|poem-lettering-v1|figcaption|filter:|box-shadow:|@font-face/.test(html + css));
  for (const [, list] of html.matchAll(/(?:src|srcset|href)="([^"]+)"/g)) {
    for (const item of list.split(',')) {
      const [url, descriptor] = item.trim().split(/\s+/);
      const file = path.resolve(__dirname, url);
      assert(fs.existsSync(file), `Missing ${url}`);
      if (descriptor) assert.equal((await sharp(file).metadata()).width, Number.parseInt(descriptor));
    }
  }
  const original = fs.readFileSync(manifest.source.path);
  assert.equal(crypto.createHash('sha256').update(original).digest('hex'), manifest.source.sha256);
  for (const item of manifest.exports) {
    const file = path.join(__dirname, item.name);
    const meta = await sharp(file).metadata();
    assert.equal(meta.width, item.width);
    assert.equal(meta.height, item.width * 1.5);
    assert.equal(fs.statSync(file).size, item.bytes);
    assert(item.bytes < 1_000_000);
  }
  const lettering = await sharp(path.join(__dirname, manifest.lettering.file)).metadata();
  assert(lettering.hasAlpha && lettering.width === 1024 && lettering.height === 1536);
  const inscription = css.match(/\.inscription\s*\{([^}]+)\}/)[1];
  const percent = property => Number(inscription.match(new RegExp(`${property}:\\s*([\\d.]+)%`))[1]) / 100;
  assert(css.includes('aspect-ratio: 2 / 3') && css.includes('height: auto'));
  for (const [vw, vh] of [[320,568],[375,667],[390,844],[430,932],[600,400],[1024,768],[1440,900]]) {
    const width = vw <= 600 ? vw : 520;
    const photoHeight = width * 1.5;
    const stageHeight = Math.max(vh, photoHeight);
    assert(photoHeight <= stageHeight && width <= vw);
    const titleBottom = percent('top') * photoHeight + percent('width') * width * lettering.height / lettering.width;
    assert(titleBottom < photoHeight * .36, 'Entire lettering frame above conservative head boundary');
    assert(percent('left') + percent('width') < 1);
    for (const dpr of [1, 2, 3]) {
      assert(manifest.exports.some(item => item.width >= width * dpr), `${vw}px @${dpr}x has sufficient source resolution`);
    }
    console.log(`PASS ${vw}x${vh}: complete ${width}x${photoHeight} photo, 1x–3x assets, lettering above heads`);
  }
  console.log('PASS resources, original hash, export dimensions/sizes and transparency. Static checks only; not browser visual QA.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
