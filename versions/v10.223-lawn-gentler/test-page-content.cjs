const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
const before=read('../v10.222-year-lawn-balance/index.html'),html=read('index.html');
const patch=/<img class="camera-greeting-patch"[^>]*><noscript><img class="camera-greeting-patch"[^>]*><\/noscript>\n/g;
const timeline=/<section id="story-timeline"[\s\S]*?<\/section>/;
const prose=/<div class="timeline-prose condensed-prose">[\s\S]*?<\/div>/;
assert.equal(html,before,'Every page and all text unchanged');
for(const name of ['memory-math.js','lawn-finale.css','condensed-story.css','font-manifest.json'])assert.equal(read(name),read('../v10.222-year-lawn-balance/'+name),name+' unchanged');
assert.equal(read('memory.js'),read('../v10.222-year-lawn-balance/memory.js').replace('// Ease the full photo back by 6%, keeping its aspect ratio and centered placement.','// Another 5% smaller than V10.222, preserving the full photo and centered placement.').replace('(frameLimit-28)*ratio+16)*.94);','(frameLimit-28)*ratio+16)*.94*.95);'),'Only reduce the complete final frame by another 5%');
assert.equal(read('music.js'),read('../v10.219-loop-music-lawn-focus/music.js'),'50s looping music unchanged');
assert(html.includes('<p>开始于<span>...</span></p>'));
assert(!html.includes('开始于一次'));
const currentTimeline=html.match(timeline)[0],priorTimeline=before.match(timeline)[0];
const nodes=[...currentTimeline.matchAll(/<li class="story-node[^>]*>[\s\S]*?<\/li>/g)].map(m=>m[0]);
assert.equal(nodes.length,2);
const labels=[...nodes[0].matchAll(/<(?:h3|p)\b[^>]*aria-label="([^"]*)"/g)].map(m=>m[1]);
assert.deepEqual(labels,['2024年','撸串、螺蛳粉、火锅...','拼乐高、骑公路车、听古风演唱会、爬山徒步…','我们在一起了']);
assert(!html.includes('2024～2026'));
assert.equal([...nodes[0].match(/<time>(.*?)<\/time>/)[1].matchAll(/<span class="type-glyph" aria-hidden="true">(.*?)<\/span>/g)].map(m=>m[1]).join(''),'2024年','visible heading matches accessible text');
assert(!/2024年3月|2024年5月|2024年7月|爱情总是在|又菜又爱玩|撒狗粮|高达|密室逃生/.test(labels.join('\n')),'old dated prose is removed; existing photo alt text stays descriptive');
for(const fragment of [/<div class="memory-stack"[\s\S]*?<\/li>/,/<figure class="wedding-finale">[\s\S]*?<\/figure>/]){
 assert.equal(currentTimeline.match(fragment)[0],priorTimeline.match(fragment)[0],'photo order and original finale asset unchanged; crop is scoped in CSS');
}
for(const p of nodes[0].matchAll(/<p class="type-block" aria-label="([^"]*)">([\s\S]*?)<\/p>/g)){
 assert.equal([...p[2].matchAll(/<span class="type-glyph" aria-hidden="true">(.*?)<\/span>/g)].map(m=>m[1]).join(''),p[1],'visual glyphs match accessible copy exactly');
}
assert.equal((nodes[0].match(/<br>/g)||[]).length,0,'each of the three sentences is one unbroken line');
assert.equal((html.match(prose)[0].match(/<p /g)||[]).length,3);
const font=JSON.parse(read('font-manifest.json'));
for(const c of labels.join(''))assert(font.requiredCodepoints.includes(c.codePointAt(0)),'subset includes '+c);
for(const c of '撸串古演')assert(font.retainedCodepoints.includes(c.codePointAt(0)),'new glyph has original handwritten outline: '+c);
assert.equal([...html.matchAll(patch)].length,2,'main and underlay greeting, including noscript, match');
assert(!/诚邀你的光临|光景常新|时日有序|岁月并进|新喜已临|id="garden-portrait"|corridor-hq|lettering-flowing|garden-paper-head/.test(html));
assert.equal((html.match(/诚邀您的光临/g)||[]).length,3);
assert.equal((html.match(/data-memory-card=/g)||[]).length,19);
const between=html.split('<article class="gathered-scenes"')[1].split('<article class="editorial-invite"')[0];
assert(between.indexOf('scene-lyrics')<between.indexOf('id="story-join"'));
assert(between.indexOf('id="story-join"')<between.indexOf('id="celebration"'));
assert(html.includes('../v10.198-garden-inscription/story-handoff.js'),'retains existing tested optional-page route');
for(const name of ['opening-runtime.js','cover-music-ready.js','camera-photo-focus.css']){
 assert.equal(read(name),read('../v10.216-restored-centered-photo/'+name),name+' unchanged');
}
const css=read('polite-greeting.css');
assert(css.includes('z-index:2')&&css.includes('pointer-events:none'));
assert(css.includes('clip-path:inset(5.4036458333% 49.51171875% 87.7604166667% 41.50390625%)'),'only corrected glyph can overlay artwork');
const img=fs.readFileSync(path.join(__dirname,'media/polite-greeting.png'));
assert.equal(img.subarray(1,4).toString(),'PNG');assert.equal(img.readUInt32BE(16),1024);assert.equal(img.readUInt32BE(20),1536);
console.log('PASS: only full finale frame shrinks another 5%; 2024年, three unbroken sentences, looping music, photo order, intro and other content retained.');
