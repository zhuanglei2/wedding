const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),sharp=require('sharp');
const root=__dirname,hash=b=>crypto.createHash('sha256').update(b).digest('hex');
async function main(){
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),base=fs.readFileSync(path.join(root,'../v10.187-matching-paper/index.html'),'utf8');
 const section=/<article class="gathered-scenes"[\s\S]*?<\/article>/,article=html.match(section)[0];
 assert.equal(html.replace('href="scene-paper.css"','href="matching-paper.css"').replace(section,''),base.replace(section,''),'unrelated sections unchanged');
 assert.equal((html.match(/id="gathered-scenes"/g)||[]).length,1);
 assert(html.indexOf('id="our-story"')<html.indexOf('id="gathered-scenes"'));
 assert(html.indexOf('id="gathered-scenes"')<html.indexOf('id="celebration"'));
 assert(!/<img\s+src=/.test(article.replace(/<noscript>[\s\S]*?<\/noscript>/g,'')),'assets behind existing media gate');
 assert(!article.includes('<p'));assert(!article.includes('scene-lyric--top'));
 assert(article.indexOf('class="scene-lyrics"')>article.indexOf('class="scene-picture"'));
 assert(article.includes('是想念如你温柔过境，才发现原来花开都有声音'));
 assert(!html.includes('绳之巫女序章'));
 const m=JSON.parse(fs.readFileSync(path.join(root,'design/asset-manifest.json')));
 assert.deepEqual(m.canvas,{width:971,height:1619});
 assert.deepEqual(m.display,{width:1200,height:1800,cropTop:0});
 for(const file of ['design/selected-picture.png','design/gathered-scenes-master.png'])assert.equal(hash(fs.readFileSync(path.join(root,file))),m.sourceHash,'user-selected picture unchanged');
 if(fs.existsSync(m.source))assert.equal(hash(fs.readFileSync(m.source)),m.sourceHash);
 for(const asset of m.assets){
  const target=path.join(root,'media',asset.file),meta=await sharp(target).metadata();
  assert.equal(meta.width,asset.width);assert.equal(meta.height,asset.height);
  assert.equal(asset.height,Math.round(asset.width*1619/971));
  assert.equal(fs.statSync(target).size,asset.bytes);assert(asset.bytes<500000);
 }
 assert(m.lyricImage.transparentPixelRatio>.5);
 for(const asset of m.lyricImage.assets){
  const target=path.join(root,'media',asset.file),meta=await sharp(target).metadata();
  assert(meta.hasAlpha);assert.equal(meta.width,asset.width);assert.equal(meta.height,asset.width/3);
  assert(fs.statSync(target).size<160000,'lightweight transparent lettering');
 }
 const css=fs.readFileSync(path.join(root,'scene-paper.css'),'utf8');
 assert(!css.includes('@font-face'));assert(css.includes('aspect-ratio:1200/1800'));
 for(const filename of ['index.html','preview.html']){
  const doc=fs.readFileSync(path.join(root,filename),'utf8');
  for(const match of doc.matchAll(/(?:src|href)="([^"#?]+)(?:[?#][^"]*)?"/g)){
   if(/^(https?:|data:|tel:|mailto:)/.test(match[1]))continue;
   assert(fs.existsSync(path.resolve(root,match[1])),'missing '+match[1]);
  }
  for(const match of doc.matchAll(/(?:data-media-)?srcset="([^"]+)"/g))for(const item of match[1].split(','))assert(fs.existsSync(path.resolve(root,item.trim().split(/\s+/)[0])));
 }
 console.log('PASS selected composite byte-for-byte intact; separate alpha lyric image; no top text; existing pages unchanged; lazy responsive assets and dependencies.');
}
main().catch(e=>{console.error(e);process.exitCode=1});
