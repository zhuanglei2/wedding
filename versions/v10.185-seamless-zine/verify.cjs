const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),sharp=require('sharp');
const root=__dirname;
async function main(){
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),base=fs.readFileSync(path.join(root,'../v10.184-remove-escape-list/index.html'),'utf8');
 const section=/<article class="gathered-scenes"[\s\S]*?<\/article>/;
 assert.equal(html.replace(section,''),base.replace(section,''),'all other pages/audio/timeline/animation untouched');
 const article=html.match(section)[0];
 assert.equal((html.match(/id="gathered-scenes"/g)||[]).length,1);
 assert(html.indexOf('id="our-story"')<html.indexOf('id="gathered-scenes"'));
 assert(html.indexOf('id="gathered-scenes"')<html.indexOf('id="celebration"'));
 assert(article.includes('data-media-group="later"'));
 assert(!/<img\s+src=/.test(article.split('<noscript>')[0]));
 assert(article.includes('width="1200" height="2000"'));
 assert(!html.includes('绳之巫女序章'));
 assert(!/<title>[^<]*v10/i.test(html));
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'design/asset-manifest.json')));
 assert(manifest.photos[0].source.endsWith('/59636a811k762aacf68c8ec4b37bbc52.jpg'),'latest replacement selected');
 assert(manifest.photos[1].source.endsWith('/087f4a3a79f7b920abff19f11eb716ef.jpg'),'standing source retained');
 const master=await sharp(path.join(root,'design/gathered-scenes-master.png')).removeAlpha().raw().toBuffer({resolveWithObject:true});
 assert.equal(master.info.width,1200);assert.equal(master.info.height,2000);
 for(const p of manifest.photos){
  const bytes=fs.readFileSync(p.source),meta=await sharp(bytes).metadata();
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),p.sha256,'source file remains untouched');
  const expected=await sharp(bytes).rotate().resize({width:p.width}).removeAlpha().raw().toBuffer();
  const a=await sharp(path.join(root,'design',p.mask)).greyscale().raw().toBuffer();
  const faceRects=p.name==='seated'?[[612,574,650,621],[550,641,582,677]]:[[204,625,280,700],[771,677,829,734]];
  const vw=p.name==='seated'?854:1280,scale=p.width/vw;
  for(const [x0,y0,x1,y1] of faceRects)for(let y=Math.ceil(y0*scale);y<Math.floor(y1*scale);y++)for(let x=Math.ceil(x0*scale);x<Math.floor(x1*scale);x++)assert.equal(a[y*p.width+x],255,p.name+' face protection');
  let checked=0;
  for(let y=0;y<p.height;y++)for(let x=0;x<p.width;x++){
   const i=y*p.width+x;if(a[i]!==255)continue;
   assert(y+p.top>=0&&y+p.top<2000,'protected figure stays inside canvas');
   const out=((y+p.top)*1200+x+p.left)*3;
   for(let c=0;c<3;c++)assert.equal(master.data[out+c],expected[i*3+c],p.name+' source RGB fidelity');
   checked++;
  }
  assert.equal(checked,p.protectedPixels);
  console.log(`PASS ${p.name}: ${meta.width}x${meta.height} original; ${checked} original-pixel checks.`);
 }
 for(const a of manifest.assets){
  const file=path.join(root,'media',a.file),meta=await sharp(file).metadata();
  assert.equal(meta.width,a.width);assert.equal(meta.height,a.height);
  assert.equal(fs.statSync(file).size,a.bytes);assert(a.bytes<500000,'responsive payload budget');
 }
 for(const m of html.matchAll(/(?:src|href)="([^"#?]+)(?:[?#][^"]*)?"/g)){
  const target=m[1];if(/^(?:https?:|data:|tel:|mailto:)/.test(target))continue;
  assert(fs.existsSync(path.resolve(root,target)),'missing relative dependency '+target);
 }
 console.log('PASS unchanged existing sections; requested timeline-line deletion retained; page order; cover-first/lazy assets; intrinsic aspect ratio; local dependencies; responsive payloads.');
}
main().catch(e=>{console.error(e);process.exitCode=1});
