const fs=require('node:fs'),p=require('node:path'),assert=require('node:assert/strict');
const here=__dirname,read=f=>fs.readFileSync(p.resolve(here,f),'utf8');
const html=read('index.html'),before=read('../v10.138-love-only/index.html'),css=read('invitation.css');
const pattern=/<article class="editorial-invite"[\s\S]*?<\/article>/,content=html.match(pattern)[0],old=before.match(pattern)[0];
assert.equal(html.replace(content,old).replaceAll('V10.140','V10.138'),before,'Other pages changed');
assert.equal(content.match(/<div class="invite-prose">[\s\S]*?<\/div>/)[0],old.match(/<div class="invite-prose">[\s\S]*?<\/div>/)[0]);
assert.deepEqual(html.match(/<img\b[^>]*>/g),before.match(/<img\b[^>]*>/g),'Image elements or loading changed');
assert.deepEqual(html.match(/<script\b[^>]*>/g),before.match(/<script\b[^>]*>/g),'Runtime changed');
assert(!/庄磊|吴郁|Zhuang|Wu Yu|2026|婚礼信息|酒店|晚宴/.test(content));
for(const text of ['Love,','always.','眼前是你，往后也是你','把心动，留在这一刻','未完待续的故事','都想和你一起写'])assert(content.includes(text));
assert(!/min-height:|@keyframes|animation:|background-image:/.test(css),'Artificial page height or extra background/animation');
assert(css.includes('aspect-ratio:729/670'));
const seen=new Set(),assets=new Set();
function scan(file){
 if(seen.has(file))return;seen.add(file);const s=fs.readFileSync(file,'utf8');
 const urls=[...s.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)].map(m=>m[1]);
 if(file.endsWith('.html'))for(const m of s.matchAll(/\b(?:data-media-srcset|imagesrcset|srcset|data-media-src|data-original|data-src|src|href)="([^"]+)"/g))for(const v of m[1].split(','))urls.push(v.trim().split(/\s+/)[0]);
 for(const url of urls){if(!url||/^(?:#|\/\/|[a-z]+:)/i.test(url))continue;const f=p.resolve(p.dirname(file),decodeURIComponent(url.split(/[?#]/)[0]));assert(fs.existsSync(f),'Missing '+f);assets.add(f);if(f.endsWith('.css'))scan(f);}
}
scan(p.join(here,'index.html'));
const bytes=fs.statSync(p.join(here,'love-song.woff2')).size;assert(bytes<45000,'Font budget exceeded');
console.log('PASS: other pages, poem, image elements and runtime unchanged; no names/event details; '+assets.size+' local references; '+bytes+'-byte subset font. No browser/device visual claim.');
