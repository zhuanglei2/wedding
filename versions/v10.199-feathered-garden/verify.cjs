// Static checks only: no browser rendering or photo regeneration.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const read=file=>fs.readFileSync(path.resolve(__dirname,file),'utf8');
const html=read('index.html'),previous=read('../v10.198-garden-inscription/index.html'),css=read('garden-feather.css');
const normalized=html.replace('<link rel="stylesheet" href="garden-feather.css">\n','').replaceAll('../v10.198-garden-inscription/','');
assert.equal(normalized,previous,'Only feather stylesheet and shared-resource URLs change');
assert(css.includes('#f8f5ef url("../v10.159-flow-and-gilt/media/camera-clean.webp")'),'Same paper tone/texture as adjacent pages');
const plain=css.replace(/\/\*[\s\S]*?\*\//g,'');
assert(!/\b(?:filter|backdrop-filter|transform|opacity|height|min-height|max-height|width|margin|padding|top|bottom|left|right|animation|transition)\s*:/.test(plain),'No blur, geometry, lettering opacity or timing changes');
const selectors=[...plain.matchAll(/([^{}]+)\{/g)].map(m=>m[1].trim());
assert.deepEqual(selectors,['#garden-portrait','html.cover-first #garden-portrait','#garden-portrait .garden-photo-window'],'No lettering/global masking');
assert(plain.includes('-webkit-mask-image: var(--garden-edge-feather);'));
assert(plain.includes('mask-image: var(--garden-edge-feather);'));
const gradient=plain.match(/linear-gradient\(to bottom,([\s\S]*?)\n  \);/)[1];
const stops=[...gradient.matchAll(/(?:rgba\(0, 0, 0, ([\d.]+)\)|(#000))\s+([\d.]+)%/g)].map(([,alpha,solid,position])=>({alpha:solid?1:Number(alpha),y:Number(position)}));
assert.equal(stops.length,11);assert.equal(stops[0].alpha,0);assert.equal(stops.at(-1).alpha,0);
assert(stops.every((s,i)=>!i||s.y>stops[i-1].y));
assert.deepEqual(stops.filter(s=>s.alpha===1).map(s=>s.y),[4.5,97.4]);
for(const width of [320,375,390,430,600,768,860]){
 const height=width*1.5;
 assert(height*.045<=59,'Top feather stays short');assert(height*.026<=34,'Bottom feather stays short');
 assert((.370*1.24-.215)*100>4.5,'Faces stay in fully opaque photo');
}
let count=0;const visited=new Set();
function check(url,base=__dirname){
 if(/^(?:#|[a-z]+:|\/\/)/i.test(url))return;
 const file=path.resolve(base,url.split(/[?#]/)[0]);assert(fs.existsSync(file),'Missing resource '+file);count++;
 if(file.endsWith('.css')&&!visited.has(file)){
  visited.add(file);for(const [,u]of fs.readFileSync(file,'utf8').matchAll(/url\(["']?([^"')]+)["']?\)/g))check(u,path.dirname(file));
 }
}
for(const [,url]of html.matchAll(/(?:src|href|data-media-src|data-src)="([^"]+)"/g))check(url);
for(const [,srcset]of html.matchAll(/(?:srcset|imagesrcset|data-media-srcset)="([^"]+)"/g))for(const src of srcset.split(','))check(src.trim().split(/\s+/)[0]);
console.log(`PASS: narrow upper/lower feather only; unchanged original pixels, lettering, layout and controller; 7 width checks; ${count} local resource references.`);
