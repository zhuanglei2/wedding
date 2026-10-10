const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require('/Users/eleme/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');

async function main() {
  const read = file => fs.readFileSync(path.join(__dirname, file), 'utf8');
  const html = read('index.html'), old = read('index-vermillion-v12.html');
  const css = read('style-v13.css');
  const copy = '时日有序 光景常新 岁月并进 新喜已临';
  assert(html.includes(`alt="${copy}"`) && html.includes(`content="${copy}"`));
  assert(!/今夕何夕|见此良人|poem-lettering-ivory/.test(html + read('lettering.html')));
  assert.equal(html.match(/<div class="photo-window">[\s\S]*?<\/div>/)[0], old.match(/<div class="photo-window">[\s\S]*?<\/div>/)[0]);
  for (const [, list] of html.matchAll(/(?:src|srcset|href)="([^"]+)"/g)) {
    for (const item of list.split(',')) assert(fs.existsSync(path.join(__dirname, item.trim().split(/\s+/)[0])));
  }
  const { data, info } = await sharp(path.join(__dirname, 'media/lettering-new-joy-v13.webp')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const original = await sharp(path.join(__dirname, 'media/lettering-new-joy-v13.png')).ensureAlpha().raw().toBuffer();
  assert(info.width === 1254 && info.height === 1254 && info.channels === 4);
  let x0 = info.width, y0 = info.height, x1 = 0, y1 = 0;
  for (let i = 0; i < data.length; i += 4) {
    assert.equal(data[i + 3], original[i + 3]);
    if (data[i + 3]) for (let c = 0; c < 3; c++) assert.equal(data[i + c], original[i + c]);
    if (data[i + 3] > 30) {
      const x = (i / 4) % info.width, y = Math.floor(i / 4 / info.width);
      x0 = Math.min(x0, x); x1 = Math.max(x1, x + 1);
      y0 = Math.min(y0, y); y1 = Math.max(y1, y + 1);
    }
  }
  const rule = css.match(/\.inscription\s*\{([^}]+)\}/)[1];
  const pct = property => Number(rule.match(new RegExp(`${property}:\\s*(-?[\\d.]+)%`))[1]) / 100;
  const bounds = {
    left: pct('left') + pct('width') * x0 / info.width,
    right: pct('left') + pct('width') * x1 / info.width,
    top: pct('top') + pct('width') / 1.5 * y0 / info.width,
    bottom: pct('top') + pct('width') / 1.5 * y1 / info.width
  };
  assert(bounds.left > 0 && bounds.right < 1 && bounds.top > 0);
  for (const vw of [320,375,390,430,600,1024,1440]) {
    const w = vw <= 600 ? vw : 520;
    assert((.370 * 1.24 - .215 - bounds.bottom) * w * 1.5 > 3, 'Visible lettering and shadow above heads');
  }
  const manifest = JSON.parse(read('media-manifest-v9.json'));
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(manifest.source.path)).digest('hex'), manifest.source.sha256);
  console.log({ pass: true, text: copy, inkBounds: bounds, photoUnchanged: true, alphaAndVisibleRGB: 'lossless', scope: 'Static resource, copy and geometry checks; not browser visual QA. Glyphs visually checked separately.' });
}
main().catch(error => { console.error(error); process.exitCode = 1; });
