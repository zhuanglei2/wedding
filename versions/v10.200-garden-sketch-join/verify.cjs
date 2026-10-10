// Static structure, geometry and resource checks; not browser screenshots.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const read=file=>fs.readFileSync(path.resolve(__dirname,file),'utf8');
const html=read('index.html'),previous=read('../v10.199-feathered-garden/index.html'),css=read('garden-sketch.css');
const overlay=/    <!-- BEGIN garden architecture overlay:[\s\S]*?    <!-- END garden architecture overlay\. -->\n/;
assert(html.match(overlay));
const normalized=html.replace(overlay,'').replace('<link rel="stylesheet" href="garden-sketch.css">\n','').replace('href="../v10.199-feathered-garden/garden-feather.css"','href="garden-feather.css"');
assert.equal(normalized,previous,'Original photo, lettering, crop, page order and runtime remain unchanged');
assert.equal((html.match(/class="garden-eaves"/g)||[]).length,1);
assert(html.includes('class="garden-eaves" aria-hidden="true"'));
assert(html.includes('class="garden-portrait-photo garden-eaves-image" data-media-src="media/garden-eaves-sketch.webp" data-media-group="later"'));
assert(html.includes('src="../v10.198-garden-inscription/story-handoff.js"'),'Same scroll owner');
const runtime=read('../v10.198-garden-inscription/story-handoff.js');
assert(runtime.includes("portrait.querySelectorAll('.garden-portrait-photo')"),'Both main photo and sketch must finish loading before the 3s hold');
const marked=html.match(/<img[^>]*class="[^"]*garden-portrait-photo[^>]*>/g);assert.equal(marked.length,2);
const plain=css.replace(/\/\*[\s\S]*?\*\//g,'');
assert(!/\b(?:filter|backdrop-filter|transform|animation|transition)\s*:/.test(plain));
assert(!plain.includes('.garden-photo-window')&&!plain.includes('.garden-verse-'),'No original-photo or lettering position overrides');
const blocks=[...plain.matchAll(/([^{}]+)\{([^}]+)\}/g)];
assert.deepEqual(blocks.map(b=>b[1].trim()),['#garden-portrait .garden-eaves','#garden-portrait .garden-eaves img','#garden-portrait .garden-inscription']);
assert.equal(blocks[2][2].trim(),'z-index: 2;','Only lettering stacking order changes');
const height=Number(blocks[0][2].match(/height:\s*([\d.]+)%/)[1])/100;
assert.equal(height,.21);assert(blocks[0][2].includes('pointer-events: none;'));
const svg=read('media/eaves-edge.svg');
const normalizedMask=svg.replace(/<!--[\s\S]*?-->/g,'').replace(/\s+/g,' ').trim();
const maskDeclarations=[...css.matchAll(/(?:-webkit-)?mask-image:\s*url\("data:image\/svg\+xml,([^"]+)"\)/g)];
assert.equal(maskDeclarations.length,2,'Inline standard/WebKit masks do not require file:// cross-origin requests');
for(const [,encoded]of maskDeclarations)assert.equal(decodeURIComponent(encoded),normalizedMask,'Inline mask matches checked geometry');
assert(svg.includes('viewBox="0 0 1000 320"')&&svg.includes('preserveAspectRatio="none"'));
assert(!/<(?:script|image|text)\b/.test(svg),'Mask is only native path/alpha geometry');
const d=svg.match(/<path[^>]* d="([^"]+)"/)[1];
const nums=d.split('V222')[1].replace(/[a-z]/gi,' ').trim().split(/\s+/).map(Number);
assert(nums.length%2===0);const y=nums.filter((_,i)=>i%2===1);
const deepest=Math.max(222,...y);assert.equal(deepest,309);
const protectedStart=.370*1.24-.215;
for(const width of [320,375,390,430,600,768,860,1000,1440]){
 const frameHeight=Math.min(width,860)*1.5;
 assert(height*frameHeight<protectedStart*frameHeight,'Even the whole overlay box stays above the people');
 assert((protectedStart-height*deepest/320)*frameHeight>19,'At least 19px clear of people at narrowest width');
}
assert(!html.includes('/.codex/generated_images/'),'No external-workspace runtime assets');
let count=0;const visited=new Set();
function check(url,base=__dirname){
 if(/^(?:#|[a-z]+:|\/\/)/i.test(url))return;
 const file=path.resolve(base,url.split(/[?#]/)[0]);assert(fs.existsSync(file),'Missing '+file);count++;
 if(file.endsWith('.css')&&!visited.has(file)){
  visited.add(file);for(const [,u]of fs.readFileSync(file,'utf8').matchAll(/url\(["']?([^"')]+)["']?\)/g))check(u,path.dirname(file));
 }
}
for(const [,url]of html.matchAll(/(?:src|href|data-media-src|data-src)="([^"]+)"/g))check(url);
for(const [,srcset]of html.matchAll(/(?:srcset|imagesrcset|data-media-srcset)="([^"]+)"/g))for(const src of srcset.split(','))check(src.trim().split(/\s+/)[0]);
for(const [tag,code]of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)){
 const src=tag.match(/\bsrc="([^"]+)"/);new vm.Script(src?read(src[1]):code);
}
console.log(`PASS: architecture-only layer above people; photo/lettering/layout/controller preserved; nine widths and ${count} local references.`);
