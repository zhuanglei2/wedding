const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
const before=read('../v10.216-restored-centered-photo/index.html'),html=read('index.html');
const patch=/<img class="camera-greeting-patch"[^>]*><noscript><img class="camera-greeting-patch"[^>]*><\/noscript>\n/g;
const expected=before
 .replaceAll('诚邀你的光临','诚邀您的光临')
 .replace(/<!-- BEGIN approved garden portrait:[\s\S]*?<!-- END approved garden portrait\. -->\n/,'')
 .replace('<link rel="stylesheet" href="../v10.198-garden-inscription/garden-portrait.css">\n','')
 .replace('<link rel="stylesheet" href="../v10.199-feathered-garden/garden-feather.css">\n','')
 .replace('<link rel="stylesheet" href="../v10.203-garden-paper-head/garden-paper.css">\n','');
assert.equal(html.replace(patch,'').replace('<link rel="stylesheet" href="polite-greeting.css">\n',''),expected,'Only greeting and garden page change');
assert.equal([...html.matchAll(patch)].length,2,'main and underlay greeting, including noscript, match');
assert(!/诚邀你的光临|光景常新|时日有序|岁月并进|新喜已临|id="garden-portrait"|corridor-hq|lettering-flowing|garden-paper-head/.test(html));
assert.equal((html.match(/诚邀您的光临/g)||[]).length,3);
assert.equal((html.match(/data-memory-card=/g)||[]).length,19);
const between=html.split('<article class="gathered-scenes"')[1].split('<article class="editorial-invite"')[0];
assert(between.indexOf('scene-lyrics')<between.indexOf('id="story-join"'));
assert(between.indexOf('id="story-join"')<between.indexOf('id="celebration"'));
assert(html.includes('../v10.198-garden-inscription/story-handoff.js'),'retains existing tested optional-page route');
for(const name of ['music.js','opening-runtime.js','cover-music-ready.js','camera-photo-focus.css']){
 assert.equal(read(name),read('../v10.216-restored-centered-photo/'+name),name+' unchanged');
}
const css=read('polite-greeting.css');
assert(css.includes('z-index:2')&&css.includes('pointer-events:none'));
assert(css.includes('clip-path:inset(5.4036458333% 49.51171875% 87.7604166667% 41.50390625%)'),'only corrected glyph can overlay artwork');
const img=fs.readFileSync(path.join(__dirname,'media/polite-greeting.png'));
assert.equal(img.subarray(1,4).toString(),'PNG');assert.equal(img.readUInt32BE(16),1024);assert.equal(img.readUInt32BE(20),1536);
console.log('PASS: polite greeting in both image layers and accessible text; garden page/assets/inscription removed; other markup, centered photo, animation and music unchanged.');
