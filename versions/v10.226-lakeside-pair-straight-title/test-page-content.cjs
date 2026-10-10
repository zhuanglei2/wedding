const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
const before=read('../v10.225-second-lakeside-photo/index.html'),html=read('index.html');
const patch=/<img class="camera-greeting-patch"[^>]*><noscript><img class="camera-greeting-patch"[^>]*><\/noscript>\n/g;
const timeline=/<section id="story-timeline"[\s\S]*?<\/section>/;
const prose=/<div class="timeline-prose condensed-prose">[\s\S]*?<\/div>/;
const cardPattern=/<figure class="memory-card[^>]*>[\s\S]*?<\/figure>/g;
const originalBoy=[...read('../v10.223-lawn-gentler/index.html').matchAll(cardPattern)][1][0];
const newBoy=originalBoy.replace('data-memory-card="1"','data-memory-card="2"').replace('data-added-memory="lakeside"','data-added-memory="lakeside-boy"');
let position=0;
const expected=before.replace(cardPattern,card=>{const n=position++;if(n===1)return card+newBoy;return n>1?card.replace(/data-memory-card="\d+"/,'data-memory-card="'+(n+1)+'"'):card;}).replace('<link rel="stylesheet" href="lawn-finale.css">','<link rel="stylesheet" href="lawn-finale.css"><link rel="stylesheet" href="story-heading.css">');
assert.equal(html,expected,'Only insert original boy photo immediately after the girl and link title rotation override');
const cards=[...html.matchAll(cardPattern)].map(m=>m[0]);
const imageNames=cards.map(card=>card.match(/data-media-src="[^\"]*\/([^\/\"]+)"/)[1]);
assert.deepEqual(imageNames,['memory-01.webp','lakeside-second.png','lakeside.webp','sunset-eaves.webp','roses.webp','memory-02.webp','memory-04.webp','memory-05.webp','memory-06.webp','together.webp','memory-09.webp','memory-10.webp','heart-sea.webp']);
assert.deepEqual(cards.map(card=>Number(card.match(/data-memory-card="(\d+)"/)[1])),Array.from({length:13},(_,i)=>i));
assert.equal(cards.join('').match(/data-media-src=/g).length,16,'12 individual photos plus four-grid');
for(const name of ['memory-03.webp','street-food.webp','kayaking.webp','memory-07.webp','memory-08.webp','birthday-wish.webp','dinner.webp'])assert(!html.includes(name),'removed photo is not loaded: '+name);
const oldCards=[...before.matchAll(cardPattern)].map(m=>m[0]);
const withoutId=card=>card.replace(/data-memory-card="\d+"/,'');
assert.deepEqual(cards.filter((_,i)=>i!==2).map(withoutId),oldCards.map(withoutId),'every prior photo, including the girl, is preserved in order');
assert.equal(cards[2],newBoy,'exact original boy image with lazy and noscript fallback');
assert.equal(require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(__dirname,'../v10.155-more-memories/media/lakeside.webp'))).digest('hex'),'5443d948af6b90bf134432fb27229448fc55013a015d2c0196e85fb819b8f1f0','original boy asset unchanged');
assert.equal(read('story-heading.css').replace(/\/\*[\s\S]*?\*\//g,'').trim(),'#celebration #reactions-title{transform:none}','remove inherited rotation on this title only; typography, centering and other transforms unchanged');
assert.equal((cards[1].match(/media\/lakeside-second\.png/g)||[]).length,2,'lazy photo and noscript use the same original');
const secondPhoto=fs.readFileSync(path.join(__dirname,'media/lakeside-second.png'));
assert.equal(require('node:crypto').createHash('sha256').update(secondPhoto).digest('hex'),'db4c2b5604150fa9b4e29224d4c302744e8ef6e307ccbc5bee51495350c2bb1f','uploaded PNG preserved byte-for-byte');
assert.equal(secondPhoto.readUInt32BE(16),1180);assert.equal(secondPhoto.readUInt32BE(20),1572);
assert.equal(cards.at(-1).replace(/data-memory-card="\d+"/,''),oldCards.at(-1).replace(/data-memory-card="\d+"/,''),'four-grid unchanged');
for(const name of ['memory.js','memory-math.js','lawn-finale.css','condensed-story.css','font-manifest.json'])assert.equal(read(name),read('../v10.225-second-lakeside-photo/'+name),name+' unchanged');
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
for(const fragment of [/<figure class="wedding-finale">[\s\S]*?<\/figure>/]){
 assert.equal(currentTimeline.match(fragment)[0],priorTimeline.match(fragment)[0],'original finale unchanged');
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
assert.equal((html.match(/data-memory-card=/g)||[]).length,13);
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
console.log('PASS: original boy photo restored after girl (2nd/3rd), 13 cards/16 photos; all previous photos and order preserved; only story title rotation removed; music, text and animation unchanged.');
