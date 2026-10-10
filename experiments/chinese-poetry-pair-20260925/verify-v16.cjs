const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('/Users/eleme/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');

async function main() {
  const read = file => fs.readFileSync(path.join(__dirname, file), 'utf8');
  const html = read('index.html'), old = read('index-diagonal-inscription-v15.html'), css = read('style-v16.css');
  const photo = page => page.match(/<div class="photo-window">[\s\S]*?<\/div>/)[0];
  assert.equal(photo(html), photo(old));
  assert(html.includes('aria-label="时日有序 光景常新 岁月并进 新喜已临"'));
  assert(html.includes('href="style-v16.css"'));
  assert(css.includes('@import url("style-v9.css")'));
  assert(!css.includes('rotate(') && !css.includes('writing-mode: vertical'));
  for (const [, value] of html.matchAll(/(?:src|srcset|href)="([^"]+)"/g)) {
    for (const item of value.split(',')) assert(fs.existsSync(path.join(__dirname, item.trim().split(/\s+/)[0])));
  }
  const assets = await Promise.all(['png','webp'].map(ext => sharp(path.join(__dirname, `media/lettering-horizontal-v16.${ext}`)).ensureAlpha().raw().toBuffer({resolveWithObject:true})));
  const [png,webp] = assets;
  assert.equal(png.data.length, webp.data.length);
  for (let i=0; i<png.data.length; i+=4) {
    assert.equal(png.data[i+3], webp.data[i+3]);
    if (png.data[i+3]) for(let c=0;c<3;c++) assert.equal(png.data[i+c], webp.data[i+c]);
  }
  const verses = [...html.matchAll(/class="verse (verse-[a-z]+)" viewBox="([\d ]+)"/g)].map(([,name,box])=>({name,box:box.split(' ').map(Number)}));
  assert.deepEqual(verses.map(v=>v.name), ['verse-time','verse-light','verse-years','verse-joy']);
  assert(verses.every(v=>v.box[2]>v.box[3]*2.5), 'Phrases must be horizontal');
  let covered=0;
  for(let y=0;y<png.info.height;y++) for(let x=0;x<png.info.width;x++) {
    if(png.data[(y*png.info.width+x)*4+3]<=30) continue;
    assert.equal(verses.filter(({box:[l,t,w,h]})=>x>=l && x<l+w && y>=t && y<t+h).length,1,'Every visible stroke appears once');
    covered++;
  }
  const rule = name => css.match(new RegExp(`\\.${name}\\s*\\{([^}]+)\\}`))[1];
  const percent = (name, prop) => Number(rule(name).match(new RegExp(`${prop}:\\s*([\\d.]+)%`))[1])/100;
  const people = {left:.318*1.24-.186, right:.735*1.24-.186, top:.370*1.24-.215};
  for(const viewport of [320,375,390,430,600,601,1024,1440]) {
    const w=viewport<=600?viewport:520, h=w*1.5, gap=Math.max(3,Math.min(viewport*.01,5));
    for(const [group,indices] of [['verse-opening',[0,1]],['verse-closing',[2,3]]]) {
      const width=percent(group,'width')*w;
      const heights=indices.map(i=>{const v=verses[i];const factor=i%2?percent(v.name,'width'):1;return width*factor*v.box[3]/v.box[2];});
      const height=heights[0]+heights[1]+gap;
      const opening=group==='verse-opening';
      const left=opening?percent(group,'left')*w:w-percent(group,'right')*w-width;
      const top=opening?percent(group,'top')*h:h-percent(group,'bottom')*h-height;
      assert(left>3 && top>3 && left+width+3<w && top+height+3<h);
      assert(top+height+3<people.top*h || left>people.right*w+3 || left+width+3<people.left*w,'No overlap with conservative person bounds');
      if(!opening) assert(top>h*.7,'Closing remains lower right');
    }
    console.log(`PASS ${viewport}px: horizontal groups in frame and clear of people`);
  }
  console.log(`PASS ${covered} visible text pixels; lossless alpha/RGB; unchanged photograph and copy. Static QA, not browser rendering.`);
}
main().catch(error=>{console.error(error);process.exitCode=1;});
