const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
for(const name of ['index.html','preview.html']){
  const html=fs.readFileSync(path.join(__dirname,name),'utf8');
  const old=fs.readFileSync(path.join(__dirname,'../v10.109-compact-photo-player',name),'utf8');
  const expected=old.replace(/<style id="music-player-style">[\s\S]*?<\/style>/,'').replace(/\n?<script src="\.\.\/v10\.108-music-motion\/music-(?:config|player)\.js" defer><\/script>/g,'').replace(/<div class="music-slot">[\s\S]*?<\/div>/g,'').replaceAll('V10.109','V10.110');
  assert.equal(html.trim(),expected.trim(),'Only music removal and version label may change');
  assert.doesNotMatch(html,/music-|我爱你不问归期|无声动效/);
  assert.match(html,/object-position:50% 28%/);
  assert.match(html,/\.party-photo\{aspect-ratio:1;overflow:hidden\}/);
  for(const [,src]of html.matchAll(/(?:src|href)="([^"#]+)"/g)){
    if(/^(https?:|data:)/.test(src))continue;
    assert.ok(fs.existsSync(path.resolve(__dirname,src.split('?')[0])),src);
  }
}
console.log('PASS: music markup/styles/scripts removed in both pages; crop and all other content unchanged; local assets resolve.');
