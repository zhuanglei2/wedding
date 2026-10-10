const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require('/Users/eleme/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');

async function main() {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, 'style-v9.css'), 'utf8');
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'media-manifest-v9.json'), 'utf8'));
  assert(html.includes('style-v9.css'));
  assert(html.includes('sizes="(max-width: 600px) 124vw, 644.8px"'));
  assert(html.includes('aria-labelledby="title"') && html.includes('id="title"'));
  for (const [, list] of html.matchAll(/(?:src|srcset|href)="([^"]+)"/g)) {
    for (const item of list.split(',')) {
      const [url, descriptor] = item.trim().split(/\s+/);
      const file = path.resolve(__dirname, url);
      assert(fs.existsSync(file), `Missing ${url}`);
      if (descriptor) assert.equal((await sharp(file).metadata()).width, Number.parseInt(descriptor));
    }
  }
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(manifest.source.path)).digest('hex'), manifest.source.sha256);
  for (const item of manifest.exports) {
    const meta = await sharp(path.join(__dirname, item.name)).metadata();
    assert.equal(meta.width, item.width);
    assert.equal(meta.height, item.width * 1.5);
  }
  const photoRule = css.match(/\.photo-window > img\s*\{([^}]+)\}/)[1];
  const titleRule = css.match(/\.inscription\s*\{([^}]+)\}/)[1];
  const pct = (rule, property) => Number(rule.match(new RegExp(`${property}:\\s*(-?[\\d.]+)%`))[1]) / 100;
  const zoom = pct(photoRule, 'width');
  const left = pct(photoRule, 'left'), top = pct(photoRule, 'top');
  assert(!/filter|transform/.test(photoRule), 'No image effects');
  assert(css.includes('brightness(1.28)') && css.includes('drop-shadow'));
  // Conservative person bounds manually checked against the supplied original.
  const people = { left: .318, right: .735, top: .370, bottom: .967 };
  assert(people.left * zoom + left > 0 && people.right * zoom + left < 1);
  assert(people.top * zoom + top > 0 && people.bottom * zoom + top < 1);

  const { data, info } = await sharp(path.join(__dirname, manifest.lettering.file)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let inkTop = info.height, inkBottom = 0;
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
    if (data[(y * info.width + x) * 4 + 3] > 30) {
      inkTop = Math.min(inkTop, y);
      inkBottom = Math.max(inkBottom, y + 1);
    }
  }
  const titleTop = pct(titleRule, 'top') + pct(titleRule, 'width') * inkTop / info.height;
  const titleBottom = pct(titleRule, 'top') + pct(titleRule, 'width') * inkBottom / info.height;
  assert(titleTop > 0, 'Visible lettering stays inside photograph');
  for (const [vw, vh] of [[320,568],[375,667],[390,844],[430,932],[600,400],[1024,768],[1440,900]]) {
    const w = vw <= 600 ? vw : 520, h = w * 1.5;
    assert(h <= Math.max(vh, h));
    assert((people.top * zoom + top - titleBottom) * h > 2, 'Letters including subtle shadow remain above heads');
    for (const dpr of [1,2,3]) assert(manifest.exports.some(item => item.width >= w * zoom * dpr));
    console.log(`PASS ${vw}x${vh}: 1.24x focus, people and lettering in bounds, 1x–3x photo resources`);
  }
  console.log('PASS source hash, resource URLs, image dimensions and CSS geometry. Static checks, not browser visual QA.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
