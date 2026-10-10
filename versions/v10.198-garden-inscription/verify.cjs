// Static integration checks, not a browser rendering/screenshot test.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=__dirname,read=name=>fs.readFileSync(path.resolve(root,name),'utf8');
const html=read('index.html'),css=read('garden-portrait.css');
const previous=read('../v10.197-gilded-scene-join/index.html');
const experiment=path.resolve(root,'../../experiments/chinese-poetry-pair-20260925');
const approved=fs.readFileSync(path.join(experiment,'index.html'),'utf8');
const block=/<!-- BEGIN approved garden portrait:[\s\S]*?<!-- END approved garden portrait\. -->\n/;
assert.equal((html.match(/id="garden-portrait"/g)||[]).length,1);
const portrait=html.match(block)?.[0];assert(portrait,'New fourth page exists');
const normalized=html.replace(block,'').replace('<link rel="stylesheet" href="garden-portrait.css">\n','')
 .replace('src="story-handoff.js"','src="../v10.196-flow-through-lyrics/story-handoff.js"')
 .replaceAll('../v10.197-gilded-scene-join/media/champagne-branch','media/champagne-branch');
assert.equal(normalized,previous,'All V10.197 content, ornament, photos and existing styles are preserved');
const order=['our-story','gathered-scenes','garden-portrait','story-join','celebration','wedding-invitation'];
for(let i=1;i<order.length;i++)assert(html.indexOf(`id="${order[i-1]}"`)<html.indexOf(`id="${order[i]}"`),'Page order '+order[i]);
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
for(const id of [...portrait.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]))assert.equal(ids.filter(v=>v===id).length,1,'Unique new ID '+id);
assert(portrait.includes('aria-label="时日有序 光景常新 岁月并进 新喜已临"'));
assert(portrait.includes('flood-color="#E75B48"'));
assert(portrait.includes('data-media-group="later"'));
assert(portrait.includes('<noscript>'));
assert(!portrait.includes('experiments/'),'Runtime assets must not depend on an experiment');
assert(css.includes('aspect-ratio: 2 / 3;'));
assert(css.includes('width: 124%;')&&css.includes('left: -18.6%;')&&css.includes('top: -21.5%;'));
assert(!/\b(?:filter|backdrop-filter|transform)\s*:/.test(css),'Do not blur, recolor or warp the original photo');
const assets=['corridor-hq-900-v8.webp','corridor-hq-1350-v8.webp','corridor-hq-1800-v8.webp','corridor-hq-2400-v9.webp','lettering-flowing-v15.webp'];
for(const name of assets)assert(fs.readFileSync(path.join(root,'media',name)).equals(fs.readFileSync(path.join(experiment,'media',name))),'Exact approved asset '+name);

// Viewboxes, source-column masks and red ink retain the approved artwork.
const verses=[...portrait.matchAll(/class="garden-verse garden-verse-([a-z]+)" viewBox="([\d ]+)"/g)].map(([,name,box])=>({name,box:box.split(' ').map(Number)}));
assert.equal(verses.length,4);
for(const {name,box} of verses)assert(approved.includes(`class="verse verse-${name}" viewBox="${box.join(' ')}"`));
for(const mask of ['M522 0H1024V1536H522V805H535V766H522Z','M0 0H522V766H535V805H522V1536H0Z'])assert(portrait.includes(mask)&&approved.includes(mask));
const percentage=(name,prop)=>Number(css.match(new RegExp(`\\.garden-verse-${name}\\s*\\{([^}]+)\\}`))[1].match(new RegExp(`${prop}:\\s*([\\d.]+)%`))[1])/100;
const commonScale=.076/179;
for(const {name,box} of verses)assert(Math.abs(percentage(name,'width')/box[2]-commonScale)<1e-10,'Equal lettering source-pixel scale');
const people={left:.318*1.24-.186,right:.735*1.24-.186,top:.370*1.24-.215};
for(const viewport of [320,375,390,430,600,768,860,1000,1440]){
 const w=Math.min(viewport,860),h=w*1.5;
 const boxes=verses.map(({name,box})=>{
  const l=percentage(name,'left')*w,t=percentage(name,'top')*h,bw=percentage(name,'width')*w,bh=bw*box[3]/box[2];
  assert(l>3&&t>3&&l+bw+3<w&&t+bh+3<h,'Lettering and shadow fit at '+viewport);
  assert(l+bw+3<people.left*w||l-3>people.right*w||t+bh+3<people.top*h,'No portrait overlap at '+viewport);
  return {l,t,r:l+bw,b:t+bh};
 });
 for(const [a,b] of [[boxes[0],boxes[1]],[boxes[2],boxes[3]]])assert(a.l>b.r+3&&b.t>a.t+5&&b.b>a.b+5,'Keep staggered vertical arrangement');
}

// Follow local resource URLs in the integrated HTML/CSS, never fetch remotely.
let resources=0;const checked=new Set();
function resource(url,base){
 url=url.trim();if(!url||/^(?:[a-z]+:|#|\/\/)/i.test(url))return;
 const target=path.resolve(base,decodeURIComponent(url.split(/[?#]/)[0]));
 assert(fs.existsSync(target),'Missing asset '+url);resources++;
 if(path.extname(target)==='.css'&&!checked.has(target)){
  checked.add(target);const text=fs.readFileSync(target,'utf8');
  for(const [,item]of text.matchAll(/url\(\s*["']?([^\s"')]+)["']?\s*\)/g))resource(item,path.dirname(target));
 }
}
for(const [,url]of html.matchAll(/(?:src|href|data-media-src|data-src|data-original)="([^"]+)"/g))resource(url,root);
for(const [,list]of html.matchAll(/(?:srcset|imagesrcset|data-media-srcset)="([^"]+)"/g))for(const item of list.split(','))resource(item.trim().split(/\s+/)[0],root);
for(const [,style]of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g))for(const [,url]of style.matchAll(/url\(\s*["']?([^\s"')]+)["']?\s*\)/g))resource(url,root);
for(const [tag,code]of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)){
 const src=tag.match(/\bsrc="([^"]+)"/);new vm.Script(src?read(src[1]):code,{filename:src?src[1]:'inline'});
}
console.log(`PASS: V10.197 preserved; page 3 → garden → timeline; five byte-identical approved assets; nine responsive lettering geometries; ${resources} local resource references and JS syntax.`);
