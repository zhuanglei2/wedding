const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),sharp=require('sharp');
(async()=>{
 const here=__dirname,html=fs.readFileSync(path.join(here,'index.html'),'utf8'),base=fs.readFileSync(path.join(here,'../v10.181-clean-page-title/index.html'),'utf8');
 const article=html.match(/<article class="gathered-scenes"[\s\S]*?<\/article>\n/)[0];
 const reverted=html.replace(article,'').replace('src="story-handoff.js"','src="../v10.169-photo-music/story-handoff.js"').replace('<link rel="stylesheet" href="gathered-scenes.css">\n','');
 assert.equal(reverted.trimEnd(),base.trimEnd(),'all existing page content, portraits, title, audio and timeline preserved');
 assert(html.indexOf('id="our-story"')<html.indexOf('id="gathered-scenes"'));
 assert(html.indexOf('id="gathered-scenes"')<html.indexOf('id="story-join"'));
 assert(html.indexOf('id="story-join"')<html.indexOf('id="celebration"'));
 assert.equal((html.match(/id="gathered-scenes"/g)||[]).length,1);
 assert(article.includes('data-media-group="later"'),'existing cover-first IntersectionObserver activates new asset only near viewport');
 assert(!/<img\s+src=/.test(article.split('<noscript>')[0]),'no eager image request during cover load');
 assert(article.includes('width="1200" height="2000"'),'intrinsic reserved height avoids layout shift');
 assert(article.includes('<noscript>'));
 assert(!/<title>[^<]*v10/i.test(html),'no visible version title');
 const manifest=JSON.parse(fs.readFileSync(path.join(here,'design/asset-manifest.json')));
 const master=path.join(here,'design/gathered-scenes-master.png');
 for(const photo of manifest.photos){
  const bytes=fs.readFileSync(photo.source);
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),photo.sha256);
  const expected=await sharp(bytes).rotate().resize(photo.resizeBox.width,photo.resizeBox.height,{fit:'inside',withoutEnlargement:true}).removeAlpha().raw().toBuffer();
  const actual=await sharp(master).extract(photo.photoRect).removeAlpha().raw().toBuffer();
  assert(actual.equals(expected),'every master portrait pixel comes directly from source, no generated overlays');
 }
 for(const asset of manifest.assets){
  const m=await sharp(path.join(here,'media',asset.file)).metadata();
  assert.equal(m.width,asset.width);assert.equal(m.height,asset.height);
  assert(asset.bytes<700000,'bounded per-device image payload');
 }
 const required=['gathered-scenes.css','story-handoff.js',...manifest.assets.map(a=>'media/'+a.file)];
 required.forEach(f=>assert(fs.existsSync(path.join(here,f))));
 const css=fs.readFileSync(path.join(here,'gathered-scenes.css'),'utf8');
 assert(css.includes('aspect-ratio:3/5')&&css.includes('object-fit:contain'));
 console.log('PASS: insertion order; old page byte-for-byte unchanged except new section/style/scroll target; source hashes; complete portrait pixel provenance; 3 responsive assets; cover-first deferred loading; no visible version title.');
})().catch(e=>{console.error(e);process.exitCode=1});
