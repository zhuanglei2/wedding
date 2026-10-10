const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),sharp=require('sharp');
const root=__dirname,base=path.resolve(root,'../v10.191-compact-scene-lyrics');
async function main(){
 const article=/<article class="gathered-scenes"[\s\S]*?<\/article>/;
 for(const filename of ['index.html','preview.html']){
  const html=fs.readFileSync(path.join(root,filename),'utf8'),old=fs.readFileSync(path.join(base,filename),'utf8');
  assert.equal(html.replace(article,''),old.replace(article,''),'all other pages and animation unchanged');
  assert.equal(html.match(/<figcaption class="scene-lyrics">[\s\S]*?<\/figcaption>/)[0].replaceAll('../v10.191-compact-scene-lyrics/media/','media/'),old.match(/<figcaption class="scene-lyrics">[\s\S]*?<\/figcaption>/)[0],'lyric composition unchanged');
  for(const match of html.matchAll(/(?:src|href)="([^"#?]+)(?:[?#][^"]*)?"/g)){
   if(/^(https?:|data:|tel:|mailto:)/.test(match[1]))continue;
   assert(fs.existsSync(path.resolve(root,match[1])),'missing '+match[1]);
  }
  for(const match of html.matchAll(/(?:data-media-)?srcset="([^"]+)"/g))for(const item of match[1].split(','))assert(fs.existsSync(path.resolve(root,item.trim().split(/\s+/)[0])));
 }
 const main=fs.readFileSync(path.join(root,'index.html'),'utf8').match(article)[0].replace(/<noscript>[\s\S]*?<\/noscript>/g,'');
 assert(!/<img\s+src=/.test(main),'lazy media gate intact');
 const css=fs.readFileSync(path.join(root,'scene-paper.css'),'utf8');
 assert(css.includes('aspect-ratio:1200/1540'));assert(!css.includes('margin:-'));assert(!css.includes('transform:'));assert(!css.includes('clip-path:'));
 const m=JSON.parse(fs.readFileSync(path.join(root,'design/asset-manifest.json')));
 assert.deepEqual(m.canvas,{width:1200,height:1540});assert.equal(m.illustrationReduction,260);
 const hash=crypto.createHash('sha256').update(fs.readFileSync(m.source)).digest('hex');assert.equal(hash,m.sourceHash);
 const native=await sharp(m.source).resize({width:1200}).removeAlpha().raw().toBuffer();
 const actual=await sharp(path.join(root,'design/gathered-scenes-master.png')).removeAlpha().raw().toBuffer();
 const edge=JSON.parse(fs.readFileSync(path.join(root,'design/edge.json')));let count=0;
 for(let y=0;y<1540;y++)for(let x=0;x<1200;x++){
  if(y<edge[x]-260+12)continue;
  for(let c=0;c<3;c++)assert.equal(actual[(y*1200+x)*3+c],native[((y+260)*1200+x)*3+c]);count++;
 }
 assert.equal(count,m.nativePixelChecks);
 for(const asset of m.assets){
  const p=path.join(root,'media',asset.file),metadata=await sharp(p).metadata();
  assert.equal(metadata.width,asset.width);assert.equal(metadata.height,Math.round(asset.width*1540/1200));
  assert.equal(fs.statSync(p).size,asset.bytes);assert(asset.bytes<400000);
 }
 console.log(`PASS ${count} photo-core RGB pixels preserved; actual paper field shortened; no CSS top crop; same lyrics/other pages; responsive media gate and dependencies.`);
}
main().catch(e=>{console.error(e);process.exitCode=1});
