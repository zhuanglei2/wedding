const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const read=file=>fs.readFileSync(path.resolve(__dirname,file),'utf8');
const html=read('index.html'),current=read('../v10.200-garden-sketch-join/index.html');
const normalized=current
 .replace(/<!-- BEGIN approved garden portrait:[\s\S]*?<!-- END approved garden portrait\. -->\n/,'')
 .replace('<link rel="stylesheet" href="../v10.198-garden-inscription/garden-portrait.css">\n','')
 .replace('<link rel="stylesheet" href="../v10.199-feathered-garden/garden-feather.css">\n','')
 .replace('<link rel="stylesheet" href="garden-sketch.css">\n','')
 .replace('src="../v10.198-garden-inscription/story-handoff.js"','src="../v10.196-flow-through-lyrics/story-handoff.js"');
assert.equal(html,normalized,'Only remove garden and restore direct story handoff; keep every other change');
assert(!/garden-portrait|garden-sketch|garden-eaves|corridor-hq|lettering-flowing|v10\.19[89]|v10\.200/.test(html));
assert(html.includes('id="gathered-scenes"')&&html.includes('class="scene-lyrics"')&&html.includes('class="scene-gilded-join"'));
assert(html.indexOf('id="gathered-scenes"')<html.indexOf('id="story-join"'));
assert(html.indexOf('id="story-join"')<html.indexOf('id="celebration"'));
assert.equal((html.match(/data-memory-card=/g)||[]).length,19);
assert(html.includes('我们要结婚啦！！！！'));
let count=0;const visited=new Set();
function check(url,base=__dirname){
 if(/^(?:#|[a-z]+:|\/\/)/i.test(url))return;
 const file=path.resolve(base,decodeURIComponent(url.split(/[?#]/)[0]));assert(fs.existsSync(file),'Missing '+file);count++;
 if(file.endsWith('.css')&&!visited.has(file)){
  visited.add(file);for(const [,u]of fs.readFileSync(file,'utf8').matchAll(/url\(["']?([^"')]+)["']?\)/g))check(u,path.dirname(file));
 }
}
for(const [,url]of html.matchAll(/(?:src|href|data-media-src|data-src)="([^"]+)"/g))check(url);
for(const [,srcset]of html.matchAll(/(?:srcset|imagesrcset|data-media-srcset)="([^"]+)"/g))for(const src of srcset.split(','))check(src.trim().split(/\s+/)[0]);
for(const [tag,code]of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)){
 const src=tag.match(/\bsrc="([^"]+)"/);new vm.Script(src?read(src[1]):code);
}
console.log(`PASS: whole garden page removed, all other V10.200 content retained; ${count} local references and JS syntax.`);
