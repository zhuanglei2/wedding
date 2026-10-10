const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('/Users/eleme/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');

async function main() {
  const read = file => fs.readFileSync(path.join(__dirname, file), 'utf8');
  const html = read('index.html');
  const old = read('index-loose-inscription-v14.html');
  const css = read('style-v15.css');
  const photo = page => page.match(/<div class="photo-window">[\s\S]*?<\/div>/)[0];
  assert.equal(photo(html), photo(old), 'Photo and responsive exports must not change');
  assert(html.includes('aria-label="时日有序 光景常新 岁月并进 新喜已临"'));
  assert(html.includes('href="style-v15.css"'));
  assert(!css.includes('rotate('), 'No artificial tilt');
  assert(!html.includes('feMorphology'), 'Keep the natural new brush weight');
  for (const [, list] of html.matchAll(/(?:src|srcset|href)="([^"]+)"/g)) {
    for (const item of list.split(',')) {
      const resource = item.trim().split(/\s+/)[0];
      assert(fs.existsSync(path.join(__dirname, resource)), `Missing ${resource}`);
    }
  }
  const [png, webp] = await Promise.all(['png', 'webp'].map(ext =>
    sharp(path.join(__dirname, `media/lettering-flowing-v15.${ext}`)).ensureAlpha().raw().toBuffer({resolveWithObject:true})
  ));
  assert.equal(png.info.width, 1024);
  assert.equal(png.info.height, 1536);
  assert.equal(webp.data.length, png.data.length);
  for (let i = 0; i < png.data.length; i += 4) {
    assert.equal(webp.data[i+3], png.data[i+3], 'Lossless alpha');
    if (png.data[i+3]) for (let c = 0; c < 3; c++) assert.equal(webp.data[i+c], png.data[i+c], 'Lossless visible RGB');
  }

  const verses = [...html.matchAll(/class="verse (verse-[a-z]+)" viewBox="([\d ]+)"[\s\S]*?<path d="([^"]+)"/g)].map(([, name, box, clip]) => ({name, box:box.split(' ').map(Number), clip}));
  assert.deepEqual(verses.map(v=>v.name), ['verse-opening','verse-closing']);
  assert.equal(verses[0].clip, 'M522 0H1024V1536H522V805H535V766H522Z');
  assert.equal(verses[1].clip, 'M0 0H522V766H535V805H522V1536H0Z');
  let visible = 0;
  for (let y = 0; y < png.info.height; y++) for (let x = 0; x < png.info.width; x++) {
    if (png.data[(y*png.info.width+x)*4+3] <= 30) continue;
    const boundary = y >= 766 && y < 805 ? 535 : 522;
    const [l,t,w,h] = verses[x >= boundary ? 0 : 1].box;
    assert(x >= l && x < l+w && y >= t && y < t+h, `No lost stroke ${x},${y}`);
    visible++;
  }
  assert(visible > 100000);

  // Conservative source-person rectangle includes faces, hands and full dress.
  // The same unchanged CSS crop maps source coordinates into the photo frame.
  const people = {left:.318*1.24-.186, right:.735*1.24-.186};
  for (const viewport of [320,375,390,430,600,601,1024,1440]) {
    const w = viewport <= 600 ? viewport : 520, h = w*1.5;
    const rectangles = verses.map(({name,box}) => {
      const rule = css.match(new RegExp(`\\.${name}\\s*\\{([^}]+)\\}`))[1];
      const percent = prop => {
        const match = rule.match(new RegExp(`${prop}:\\s*([\\d.]+)%`));
        return match ? Number(match[1])/100 : null;
      };
      const width = percent('width')*w, height = width*box[3]/box[2];
      const left = percent('left') === null ? w*(1-percent('right'))-width : percent('left')*w;
      const top = percent('top') === null ? h*(1-percent('bottom'))-height : percent('top')*h;
      assert(left > 3 && top > 3 && left+width+3 < w && top+height+3 < h);
      assert(left+width+3 < people.left*w || left-3 > people.right*w, 'Both complete inscription boxes and shadows avoid people');
      return {left,top,width,height};
    });
    assert(rectangles[0].top < h*.1 && rectangles[1].top > h*.6, 'Diagonal rather than paired alignment');
    assert(rectangles[0].width > rectangles[1].width, 'Opening is larger without fading the closing');
    console.log(`PASS ${viewport}px: upper-left/lower-right positions, in frame, clear of people`);
  }
  console.log(`PASS ${visible} visible pixels retained once; lossless asset; source photo, wording and page sizing unchanged. Static QA only, not browser rendering.`);
}
main().catch(error => {console.error(error); process.exitCode=1;});
