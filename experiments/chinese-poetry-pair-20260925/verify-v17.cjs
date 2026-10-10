const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('/Users/eleme/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');

async function main() {
  const read = file => fs.readFileSync(path.join(__dirname,file),'utf8');
  const html=read('index.html'), old=read('index-horizontal-inscription-v16.html'), css=read('style-v17.css');
  const photo = page => page.match(/<div class="photo-window">[\s\S]*?<\/div>/)[0];
  assert.equal(photo(html),photo(old),'Photo unchanged');
  assert(html.includes('aria-label="时日有序 光景常新 岁月并进 新喜已临"'));
  assert(html.includes('href="style-v17.css"'));
  assert(css.includes('@import url("style-v9.css")'));
  assert(!css.includes('rotate('));
  for(const [,value] of html.matchAll(/(?:src|srcset|href)="([^"]+)"/g)) {
    for(const item of value.split(',')) assert(fs.existsSync(path.join(__dirname,item.trim().split(/\s+/)[0])));
  }
  assert(html.includes('M522 0H1024V1536H522V805H535V766H522Z'));
  assert(html.includes('M0 0H522V766H535V805H522V1536H0Z'));
  const verses=[...html.matchAll(/class="verse (verse-[a-z]+)" viewBox="([\d ]+)"[\s\S]*?clip-path="url\(#(opening|closing)-column-v17\)"/g)].map(([,name,box,side])=>({name,box:box.split(' ').map(Number),side}));
  assert.deepEqual(verses.map(v=>v.name),['verse-time','verse-light','verse-years','verse-joy']);
  assert(verses.every(v=>v.box[3]>v.box[2]*3));
  const {data,info}=await sharp(path.join(__dirname,'media/lettering-flowing-v15.webp')).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  let covered=0;
  for(let y=0;y<info.height;y++) for(let x=0;x<info.width;x++) {
    if(data[(y*info.width+x)*4+3]<=30) continue;
    const boundary=y>=766 && y<805?535:522;
    const visible=verses.filter(({box:[l,t,w,h],side})=>x>=l && x<l+w && y>=t && y<t+h && (side==='opening'?x>=boundary:x<boundary));
    assert.equal(visible.length,1,`Missing or repeated stroke at ${x},${y}`);
    covered++;
  }
  const people={left:.318*1.24-.186,right:.735*1.24-.186,top:.370*1.24-.215};
  for(const vw of [320,375,390,430,600,601,1024,1440]) {
    const w=vw<=600?vw:520, h=w*1.5;
    const boxes=verses.map(({name,box})=>{
      const rule=css.match(new RegExp(`\\.${name}\\s*\\{([^}]+)\\}`))[1];
      const pct=p=>Number(rule.match(new RegExp(`${p}:\\s*([\\d.]+)%`))[1])/100;
      const l=pct('left')*w,t=pct('top')*h,bw=pct('width')*w,bh=bw*box[3]/box[2];
      assert(l>3 && t>3 && l+bw+3<w && t+bh+3<h);
      assert(l+bw+3<people.left*w || l-3>people.right*w || t+bh+3<people.top*h,'Keep complete text boxes clear of people');
      return {l,t,r:l+bw,b:t+bh,bh};
    });
    for(const [first,second] of [[boxes[0],boxes[1]],[boxes[2],boxes[3]]]) {
      assert(first.l>second.r+3,'Separate right-to-left columns');
      assert(second.t-first.t>first.bh*.2,'About one character of start offset');
      assert(second.b>first.b+5,'End positions are staggered too');
    }
    console.log(`PASS ${vw}px: staggered vertical pairs, correct order, no person overlap`);
  }
  console.log(`PASS ${covered} visible source pixels retained once; unchanged photo, copy and page dimensions. Static checks only.`);
}
main().catch(error=>{console.error(error);process.exitCode=1;});
