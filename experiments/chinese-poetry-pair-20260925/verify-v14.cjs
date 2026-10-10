const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('/Users/eleme/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');

async function main() {
  const read = file => fs.readFileSync(path.join(__dirname, file), 'utf8');
  const html = read('index.html'), old = read('index-new-joy-v13.html'), css = read('style-v14.css');
  assert.equal(html.match(/<div class="photo-window">[\s\S]*?<\/div>/)[0], old.match(/<div class="photo-window">[\s\S]*?<\/div>/)[0]);
  assert(html.includes('aria-label="时日有序 光景常新 岁月并进 新喜已临"'));
  const verses = [...html.matchAll(/class="verse (verse-[a-z]+)" viewBox="([\d ]+)"/g)].map(([, name, box]) => ({ name, box: box.split(' ').map(Number) }));
  assert.deepEqual(verses.map(v => v.name), ['verse-time','verse-light','verse-years','verse-joy']);
  for (const [, list] of html.matchAll(/(?:src|srcset|href)="([^"]+)"/g)) {
    for (const item of list.split(',')) assert(fs.existsSync(path.join(__dirname, item.trim().split(/\s+/)[0])));
  }
  const { data, info } = await sharp(path.join(__dirname, 'media/lettering-new-joy-v13.webp')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let covered = 0;
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
    if (data[(y * info.width + x) * 4 + 3] <= 30) continue;
    assert.equal(verses.filter(({ box: [l,t,w,h] }) => x >= l && x < l+w && y >= t && y < t+h).length, 1, `Visible stroke ${x},${y} must appear exactly once`);
    covered++;
  }
  for (const vw of [320,375,390,430,600,1024,1440]) {
    const width = vw <= 600 ? vw : 520, height = width * 1.5;
    let previousLeft = Infinity;
    for (const {name, box} of verses) {
      const rule = css.match(new RegExp(`\\.${name}\\s*\\{([^}]+)\\}`))[1];
      const pct = p => Number(rule.match(new RegExp(`${p}:\\s*([\\d.]+)%`))[1]) / 100;
      const angle = Number(rule.match(/--lean:\s*(-?[\d.]+)deg/)[1]) * Math.PI / 180;
      const w = pct('width') * width, h = w * box[3] / box[2];
      const l = pct('left') * width, t = pct('top') * height;
      assert(l < previousLeft, 'Natural right-to-left order'); previousLeft = l;
      for (const [x,y] of [[0,0],[w,0],[0,h],[w,h]]) {
        const px = l + w/2 + (x-w/2) * Math.cos(angle) - y * Math.sin(angle);
        const py = t + (x-w/2) * Math.sin(angle) + y * Math.cos(angle);
        assert(px > 3 && px < width-3 && py > 3);
        assert(py + 3 < (.370 * 1.24 - .215) * height, 'Rotated verse and shadow above heads');
      }
    }
    console.log(`PASS ${vw}px: rotated verses in bounds, above heads, right-to-left order`);
  }
  console.log(`PASS ${covered} visible lettering pixels included exactly once; photo and copy unchanged. Static checks, not browser visual QA.`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
