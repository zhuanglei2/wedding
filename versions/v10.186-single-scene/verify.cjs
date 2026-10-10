const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),sharp=require('sharp');
const root=__dirname;
async function main(){
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const base=fs.readFileSync(path.join(root,'../v10.184-remove-escape-list/index.html'),'utf8');
 const section=/<article class="gathered-scenes"[\s\S]*?<\/article>/;
 assert.equal(html.replace(section,''),base.replace(section,''),'other pages, audio and animations unchanged');
 const article=html.match(section)[0];
 assert.equal((html.match(/id="gathered-scenes"/g)||[]).length,1);
 assert(html.indexOf('id="our-story"')<html.indexOf('id="gathered-scenes"'));
 assert(html.indexOf('id="gathered-scenes"')<html.indexOf('id="celebration"'));
 assert(article.includes('data-media-group="later"'));
 assert(!/<img\s+src=/.test(article.split('<noscript>')[0]));
 assert(article.includes('width="1200" height="2000"'));
 assert.equal((article.split('<noscript>')[0].match(/<img /g)||[]).length,1,'one scene, one requested asset');
 assert(!html.includes('绳之巫女序章'));
 assert(!/<title>[^<]*v10/i.test(html));

 const manifest=JSON.parse(fs.readFileSync(path.join(root,'design/asset-manifest.json')));
 assert(manifest.source.endsWith('/59636a811k762aacf68c8ec4b37bbc52.jpg'));
 const original=fs.readFileSync(manifest.source);
 assert.equal(crypto.createHash('sha256').update(original).digest('hex'),manifest.sourceHash);
 const master=await sharp(path.join(root,'design/gathered-scenes-master.png')).removeAlpha().raw().toBuffer({resolveWithObject:true});
 assert.equal(master.info.width,1200);assert.equal(master.info.height,2000);
 const expected=await sharp(original).rotate().resize({width:1200}).removeAlpha().raw().toBuffer();
 const mask=await sharp(path.join(root,'design/preservation-mask.png')).greyscale().raw().toBuffer();
 const scale=1200/manifest.sourceWidth;
 // This wide uninterrupted protected band covers the full real setting and
 // every part of both people, including the entire veil and spread train.
 for(let y=Math.ceil(174*scale);y<=Math.floor(1130*scale);y++){
   for(let x=0;x<1200;x++)assert.equal(mask[y*1200+x],255,'continuous scene protection');
 }
 let checked=0;
 for(let i=0;i<mask.length;i++) if(mask[i]===255){
   for(let c=0;c<3;c++)assert.equal(master.data[i*3+c],expected[i*3+c],'original photograph RGB');
   checked++;
 }
 assert.equal(checked,manifest.photograph.protectedPixels);
 for(const a of manifest.assets){
   const file=path.join(root,'media',a.file),meta=await sharp(file).metadata();
   assert.equal(meta.width,a.width);assert.equal(meta.height,a.height);
   assert.equal(fs.statSync(file).size,a.bytes);assert(a.bytes<350000,'responsive payload budget');
 }
 for(const document of [html,fs.readFileSync(path.join(root,'preview.html'),'utf8')]){
   for(const m of document.matchAll(/(?:src|href)="([^"#?]+)(?:[?#][^"]*)?"/g)){
     const target=m[1];if(/^(?:https?:|data:|tel:|mailto:)/.test(target))continue;
     assert(fs.existsSync(path.resolve(root,target)),'missing dependency '+target);
   }
   for(const m of document.matchAll(/(?:data-media-)?srcset="([^"]+)"/g)){
     for(const candidate of m[1].split(','))assert(fs.existsSync(path.resolve(root,candidate.trim().split(/\s+/)[0])),'missing responsive image');
   }
 }
 console.log(`PASS source unchanged; ${checked} native RGB pixels; continuous protected scene and full people.`);
 console.log('PASS only gallery replaced; second-page placement; one lazy image; all dependencies; responsive size budget.');
}
main().catch(error=>{console.error(error);process.exitCode=1});
