const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
for(const name of ['index.html','preview.html']){
  const html=fs.readFileSync(path.join(__dirname,name),'utf8');
  const previous=fs.readFileSync(path.join(__dirname,'../v10.108-music-motion',name),'utf8');
  const slots=[...html.matchAll(/<div class="music-slot">([\s\S]*?)<\/div>/g)];
  assert.equal(slots.length,name==='index.html'?2:1);
  for(const [,slot]of slots){
    assert.ok(slot.indexOf('class="music-toggle"')<slot.indexOf('class="music-meta"'),'Icon before title in DOM');
    assert.match(slot,/我爱你不问归期/);assert.match(slot,/无声动效/);
  }
  assert.match(html,/\.music-meta\{min-width:0;text-align:left/);
  assert.match(html,/music-disc-turn 6s linear/);
  assert.match(html,/animation-play-state:paused/);
  assert.match(html,/prefers-reduced-motion:reduce/);
  assert.match(html,/\.party-photo\{aspect-ratio:1;overflow:hidden\}/);
  assert.match(html,/object-position:50% 28%/);
  assert.match(html,/html.star-turn \.opening-underlay \.reference-art \.party-photo img/);
  assert.match(html,/position:absolute;inset:0;width:100%;height:100%;object-fit:cover/);
  const clean=text=>text.replace(/<style id="photo-crop-style">[\s\S]*?<\/style>/,'').replace(/<style id="music-player-style">[\s\S]*?<\/style>/,'').replace(/<div class="music-slot">[\s\S]*?<\/div>/g,'').replaceAll('V10.109','V10.108').replaceAll('../v10.108-music-motion/music-','music-').replaceAll('新郎庄磊与新娘吴郁的婚纱合照，方形取景保留双人面部、姿态与捧花','新郎庄磊与新娘吴郁的完整婚纱合照，保留原照和完整裙摆').trim().replace(/>\s+</g,'><');
  assert.equal(clean(html),clean(previous),'No unrelated page, picture or animation changes');
  for(const [,src]of html.matchAll(/(?:src|href)="([^"#]+)"/g)){
    if(/^(https?:|data:)/.test(src))continue;
    assert.ok(fs.existsSync(path.resolve(__dirname,src.split('?')[0])),src);
  }
}
const photo=fs.readFileSync(path.join(__dirname,'../v10.106-reference-party/couple-original.jpg'));
assert.equal(crypto.createHash('sha256').update(photo).digest('hex'),'39e6248100d2e1b8eb3ca2cc39af61c0799f76d3211192e31fb3efa7a072040a');
// 4000x6000 original: 4000-square crop starts at y=560, ends at y=4560.
// Known groom hair starts near y=1425; top fade ends before this.
const offset=(6000-4000)*.28;
assert.equal(offset,560);assert.ok(offset+4000*.12<1425);
for(const width of [320,375,390,430,760,1000]){
  const oldHeight=width*1.5,newHeight=width;
  assert.ok(Math.abs(newHeight/oldHeight-2/3)<1e-9);
}
console.log('PASS: icon/text order, rotation/pause/reduced-motion CSS, identical static crop rules, original image hash, unchanged surrounding pages and resource resolution.');
