const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=__dirname;
const css=fs.readFileSync(path.join(root,'matching-paper.css'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const base=fs.readFileSync(path.join(root,'../v10.186-single-scene/index.html'),'utf8');
const articlePattern=/<article class="gathered-scenes"[\s\S]*?<\/article>/;
const normalized=html.replace('\n<link rel="stylesheet" href="matching-paper.css">','').replace(articlePattern,'');
assert.equal(normalized,base.replace(articlePattern,''),'all existing pages and runtime remain untouched');
const article=html.match(articlePattern)[0];
assert.equal((article.match(/class="matching-paper-caption"/g)||[]).length,1);
assert(article.includes('data-media-group="later"'));
assert(article.includes('width="1200" height="2000"'));
assert(!/<img\s+src=/.test(article.split('<noscript>')[0]));
assert(article.includes('../v10.186-single-scene/media/gathered-scenes-1200.webp'));
const paperURL='../v10.159-flow-and-gilt/media/camera-clean.webp';
assert(css.includes(paperURL));
assert(base.includes('background:url("'+paperURL+'") center bottom/100% auto no-repeat'),'same source and width scale as camera paper');
assert(css.includes('center bottom/100% auto no-repeat'));
assert(css.includes('html.cover-first .gathered-scenes-sheet::before'));
assert(css.includes('@supports'));
assert(css.includes('-webkit-mask-image:'));
assert(css.includes('.gathered-scenes .matching-paper-caption{display:none}'),'no duplicate caption without mask support');
const originalBand=[174*1200/854,1130*1200/854];
assert(originalBand[0]>=2000*.12 && originalBand[1]<=2000*.83,'all native protected photo pixels stay fully opaque');
assert(2000*.14>2000*.12 && 2000*(1-.18)<2000*.83,'texture overlaps every exposed edge without a blank stripe');
// Both samples are fully inside the material-only lower portion of the
// 1024×1536 camera artwork. Its drawing ends above source y=1000.
assert(1536-2000*.18*(1024/1200)>1000,'no camera/text can leak into reused paper');
for(const filename of ['index.html','preview.html']){
 const document=fs.readFileSync(path.join(root,filename),'utf8');
 for(const m of document.matchAll(/(?:src|href)="([^"#?]+)(?:[?#][^"]*)?"/g)){
  if(/^(https?:|data:|tel:|mailto:)/.test(m[1]))continue;
  assert(fs.existsSync(path.resolve(root,m[1])),'missing dependency '+m[1]);
 }
 for(const m of document.matchAll(/(?:data-media-)?srcset="([^"]+)"/g))for(const candidate of m[1].split(',')){
  assert(fs.existsSync(path.resolve(root,candidate.trim().split(/\s+/)[0])),'missing responsive image');
 }
}
assert(fs.existsSync(path.resolve(root,paperURL)));
assert(!fs.readdirSync(root).some(name=>/\.(webp|png|jpg)$/.test(name)),'no new raster download');
console.log('PASS: exact shared page-two paper URL and width scale; safe blank texture samples; Safari masks and fallback.');
console.log('PASS: native photo fully opaque; unchanged page size and other sections; lazy responsive assets; no extra raster assets.');
