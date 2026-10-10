const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),sharp=require('sharp');
const root=__dirname;
async function main(){
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),base=fs.readFileSync(path.join(root,'../v10.187-matching-paper/index.html'),'utf8');
 const section=/<article class="gathered-scenes"[\s\S]*?<\/article>/;
 assert.equal(html.replace('href="scene-paper.css"','href="matching-paper.css"').replace(section,''),base.replace(section,''));
 const article=html.match(section)[0];
 assert.equal((html.match(/id="gathered-scenes"/g)||[]).length,1);
 assert(html.indexOf('id="our-story"')<html.indexOf('id="gathered-scenes"'));
 assert(html.indexOf('id="gathered-scenes"')<html.indexOf('id="celebration"'));
 assert(!/<img\s+src=/.test(article.split('<noscript>')[0]));
 assert(article.includes('data-media-group="later"'));
 assert(!article.includes('matching-paper-caption'));
 assert(!html.includes('绳之巫女序章'));
 const m=JSON.parse(fs.readFileSync(path.join(root,'design/asset-manifest.json')));
 assert(m.photograph.share>.56&&m.photograph.share<.60,'photo area expanded');assert.equal(m.photograph.top,60,'photo moved up');
 const original=fs.readFileSync(m.source);
 assert.equal(crypto.createHash('sha256').update(original).digest('hex'),m.sourceHash);
 const expected=await sharp(original).rotate().resize({width:1200}).removeAlpha().raw().toBuffer();
 const master=await sharp(path.join(root,'design/gathered-scenes-master.png')).removeAlpha().raw().toBuffer({resolveWithObject:true});
 assert.equal(master.info.width,1200);assert.equal(master.info.height,2000);
 const a=await sharp(path.join(root,'design/preservation-mask.png')).greyscale().raw().toBuffer();
 // A conservative source-space contour contains both complete people, sofa,
 // veil, hands and the full spread train, well outside the visible anatomy.
 const bodyPath='M425 565 Q472 553 524 549 Q571 531 599 544 Q638 533 669 563 Q696 586 718 604 Q757 612 753 665 Q749 742 745 796 Q760 835 790 852 Q812 875 794 914 Q775 985 704 1032 Q609 1096 509 1105 Q375 1129 239 1094 Q108 1080 56 1028 Q13 1001 0 969 L0 813 Q81 759 172 747 Q311 733 417 738 Q429 694 425 650 Q413 601 425 565 Z';
 const body=await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="${m.photograph.height}" viewBox="0 0 854 1280"><path fill="white" d="${bodyPath}"/></svg>`)).ensureAlpha().extractChannel('alpha').raw().toBuffer();
 let protectedBody=0,checked=0;
 for(let i=0;i<a.length;i++){
  if(body[i]===255){assert.equal(a[i],255,'complete bodies/veil/train protected');protectedBody++;}
  if(a[i]!==255)continue;
  const y=Math.floor(i/1200),x=i%1200,out=((y+m.photograph.top)*1200+x)*3;
  for(let c=0;c<3;c++)assert.equal(master.data[out+c],expected[i*3+c]);checked++;
 }
 assert.equal(checked,m.photograph.protectedPixels);
 for(const asset of m.assets){
  const file=path.join(root,'media',asset.file),meta=await sharp(file).metadata();
  assert.equal(meta.width,asset.width);assert.equal(meta.height,asset.height);
  assert.equal(fs.statSync(file).size,asset.bytes);assert(asset.bytes<500000);
 }
 for(const filename of ['index.html','preview.html']){
  const doc=fs.readFileSync(path.join(root,filename),'utf8');
  for(const match of doc.matchAll(/(?:src|href)="([^"#?]+)(?:[?#][^"]*)?"/g)){
   if(/^(https?:|data:|tel:|mailto:)/.test(match[1]))continue;
   assert(fs.existsSync(path.resolve(root,match[1])),'missing '+match[1]);
  }
  for(const match of doc.matchAll(/(?:data-media-)?srcset="([^"]+)"/g))for(const item of match[1].split(','))assert(fs.existsSync(path.resolve(root,item.trim().split(/\s+/)[0])));
 }
 console.log(`PASS ${checked} native RGB pixels; ${protectedBody} conservative body/veil/train pixels; original source unchanged.`);
 console.log('PASS larger/upward photographic anchor; existing sections unchanged; lazy responsive assets; all dependencies.');
}
main().catch(e=>{console.error(e);process.exitCode=1});
