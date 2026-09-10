const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const read=file=>fs.readFileSync(path.join(__dirname,file),'utf8');
const normalize=text=>text.trim().replace(/>\s+</g,'><');
for(const name of ['index.html','preview.html']){
  const html=read(name),old=read('../v10.110-no-music-player/'+name);
  const arts=[...html.matchAll(/<div class="reference-art">[\s\S]*?<div class="camera-photo">[\s\S]*?<\/div>\s*<\/div>/g)].map(m=>m[0]);
  assert.equal(arts.length,name==='index.html'?2:1);
  if(arts.length===2)assert.equal(arts[0].replace(/alt="[^"]*"/g,'alt=""'),arts[1].replace(/alt="[^"]*"/g,'alt=""'));
  assert.equal((html.match(/class="camera-art"/g)||[]).length,arts.length);
  assert.match(html,/object-position:50% 24%/);
  assert.doesNotMatch(html,/music-|party-header.png|photo-crop-style/);
  const clean=text=>text.replace(/\/\* Reference-led (?:party|camera) page[\s\S]*?(?=<\/style>)/,'').replace(/<style id="photo-crop-style">[\s\S]*?<\/style>/,'').replace(/<div class="reference-art">[\s\S]*?<\/div>\s*<\/div>(?:\s*<\/div>)?/g,'').replaceAll('V10.111','V10.110').replaceAll('诚邀你的光临 · 庄磊 & 吴郁 · 2026.10.06','Our wedding Party · 庄磊 & 吴郁 · 2026.10.06');
  // Compare outside the explicitly replaced art, CSS, and accessible heading.
  const removeArt=text=>text.replace(/<div class="reference-art">\s*<div class="party-heading">[\s\S]*?<\/div>\s*<div class="party-photo">[\s\S]*?<\/div>\s*<\/div>/g,'').replace(/<div class="reference-art">[\s\S]*?<div class="camera-photo">[\s\S]*?<\/div>\s*<\/div>/g,'');
  assert.equal(normalize(clean(removeArt(html))),normalize(clean(removeArt(old))));
  for(const [,src]of html.matchAll(/(?:src|href)="([^"#]+)"/g)){
    if(/^(https?:|data:)/.test(src))continue;
    assert.ok(fs.existsSync(path.resolve(__dirname,src.split('?')[0])),src);
  }
}
const png=fs.readFileSync(path.join(__dirname,'camera-invitation.png'));
assert.equal(png.readUInt32BE(16),1024);assert.equal(png.readUInt32BE(20),1536);
const photo=fs.readFileSync(path.join(__dirname,'../v10.106-reference-party/couple-original.jpg'));
assert.equal(crypto.createHash('sha256').update(photo).digest('hex'),'39e6248100d2e1b8eb3ca2cc39af61c0799f76d3211192e31fb3efa7a072040a');
console.log('PASS: matched underlay/page, new camera asset dimensions, unchanged original photo hash, preserved cover/later chapters/scripts, all local resources.');
