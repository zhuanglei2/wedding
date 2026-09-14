const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const base=path.resolve(__dirname,'../v10.162-quicker-timeline'),html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8'),old=fs.readFileSync(path.join(base,'index.html'),'utf8');
const read=p=>fs.readFileSync(p,'utf8'),seen=new Set(),references=new Set();
function inspect(file){
 if(seen.has(file))return;seen.add(file);const text=read(file),ext=path.extname(file);
 if(ext==='.js')new vm.Script(text,{filename:file});
 const urls=[];
 if(ext==='.html'){
  for(const m of text.matchAll(/(?:src|href|data-media-src|data-original)="([^"]+)"/g))urls.push(m[1]);
  for(const m of text.matchAll(/(?:imagesrcset|srcset|data-media-srcset)="([^"]+)"/g))urls.push(...m[1].split(',').map(v=>v.trim().split(/\s+/)[0]));
  for(const m of text.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))if(m[1].trim())new vm.Script(m[1]);
 }
 for(const m of text.matchAll(/url\(["']?([^\s"')]+)["']?\)/g))urls.push(m[1]);
 for(const raw of urls){if(/^(data:|https?:|#|mailto:|tel:)/.test(raw))continue;const url=raw.split(/[?#]/)[0];if(!url)continue;const target=path.resolve(path.dirname(file),url);assert(fs.existsSync(target),'missing '+target);references.add(target);if(/\.(css|js)$/.test(target))inspect(target)}
}
inspect(path.join(__dirname,'index.html'));
const getNode=(h,id)=>h.match(new RegExp('<li class="story-node" data-story-node="'+id+'">[\\s\\S]*?</li>'))?.[0];
const prose=n=>n.match(/<div class="timeline-prose">([\s\S]*?)<\/div><\/li>/)[1];
const paras=n=>[...prose(n).matchAll(/<p class="type-block" aria-label="([^"]*)">([\s\S]*?)<\/p>/g)];
const expectedText=[
 '爱情总是在无形中早早埋下了种子，那一天各种巧合，我们开始慢慢了解对方',
 null,
 '命运也在眷顾着我们，推动我们的爱情，这一天我们在一起了'
];
for(let id=0;id<3;id++){
 const a=getNode(old,id),b=getNode(html,id);assert(a&&b);
 assert.equal(b.replace(prose(b),'__PROSE__'),a.replace(prose(a),'__PROSE__'),'dates/headings/node layout unchanged');
 for(const [,label,body] of paras(b)){
  const text=body.replace(/<br\s*\/?>/g,' ').replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim();
  assert.equal(text,label,'visible and screen-reader copy agree');
 }
 if(id!==1){assert.equal(paras(b).length,2);assert.equal(paras(b).map(p=>p[1]).join(''),expectedText[id]);}
 else assert.equal(paras(b).map(p=>p[1]).join(''),paras(a).map(p=>p[1]).join('').replace('但是不怕','不怕不怕'),'May has only the requested phrase change');
}
const strip=h=>h.replace(/<li class="story-node" data-story-node="[012]">[\s\S]*?<\/li>/g,'__EDITED_NODE__');
const expected=old.replaceAll('V10.162','V10.163').replace('<script src="memory.js" defer></script>','<script src="memory-handoff.js" defer></script>\n<script src="memory.js" defer></script>');
assert.equal(strip(html).trimEnd(),strip(expected).trimEnd(),'all other markup/assets/styles and earlier handoff unchanged');
const oldRuntime=read(path.join(base,'memory.js'));
const oldEnd="if(elapsed>=plan.end){done=true;port.classList.remove('story-following');phase('complete');return}";
const newEnd="if(elapsed>=plan.end){done=true;port.classList.remove('story-following');phase('complete');document.dispatchEvent(new CustomEvent('memory-story-complete',{detail:{reason:loaded.get(finalPhoto.querySelector('img[data-media-src]'))?'finished':'media-unavailable'}}));return}";
assert(oldRuntime.includes(oldEnd));
assert.equal(read(path.join(__dirname,'memory.js')).trimEnd(),oldRuntime.replace(oldEnd,newEnd).trimEnd(),'typing/photo/scroll timings remain unchanged; only completion event added');
assert(html.indexOf('src="memory-handoff.js"')<html.indexOf('src="memory.js"'));
console.log('PASS: exact March/May/July copy and aria text; '+references.size+' local dependencies; scripts parse; other pages/images/layout and current motion speeds preserved.');
