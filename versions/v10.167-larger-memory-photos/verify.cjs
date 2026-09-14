const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const base=path.resolve(__dirname,'../v10.166-mobile-scroll-owner'),html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8'),old=fs.readFileSync(path.join(base,'index.html'),'utf8');
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
const expected=old.replaceAll('V10.166','V10.167')
 .replace('src="story-handoff.js"','src="../v10.166-mobile-scroll-owner/story-handoff.js"')
 .replace('src="memory-handoff.js"','src="../v10.166-mobile-scroll-owner/memory-handoff.js"')
 .replace('src="../v10.163-love-copy-handoff/memory.js"','src="memory.js"')
 .replace('<link rel="stylesheet" href="../v10.159-flow-and-gilt/flow-and-gilt.css">','<link rel="stylesheet" href="../v10.159-flow-and-gilt/flow-and-gilt.css">\n<link rel="stylesheet" href="larger-photos.css">');
assert.equal(html.trimEnd(),expected.trimEnd(),'only version and intended CSS/runtime paths differ');
const runtime=read(path.join(__dirname,'memory.js')),previous=read(path.resolve(__dirname,'../v10.163-love-copy-handoff/memory.js'));
const start=runtime.indexOf(' function photoPose('),end=runtime.indexOf(' function buildFlights(){');
assert(start>=0&&end>start);
assert.equal((runtime.slice(0,start)+runtime.slice(end)).replace(
 'cards.forEach((card,i)=>{const step=schedule[i],[x,y,r]=photoPose(step.pose,card.offsetWidth||card.clientWidth,card.offsetHeight,width,box.height);const rest=',
 'cards.forEach((card,i)=>{const step=schedule[i],[x,y,r]=step.pose;const rest=').trimEnd(),
 previous.trimEnd(),'only landing offsets change: typing, flights, timings and handoff stay intact');
const css=read(path.join(__dirname,'larger-photos.css'));
assert(!/url\(|object-fit|wedding-finale|@import/.test(css),'no asset/crop/finale changes');
const rules=[...css.matchAll(/\.story-fixed-page \.story-enhanced \.(memory-card|memory-landscape|memory-keepsake)\{\s*width:min\((\d+)%,calc\(var\(--story-window-height,700px\) \* (\.[\d]+)\)\);[^}]*\}/g)];
assert.equal(rules.length,3);
const pose=vm.runInNewContext('('+runtime.slice(start,end).trim()+')',{clamp:(v,a,b)=>Math.max(a,Math.min(b,v))});
const poses=require('../v10.161-auto-story/memory-math.js').poses;
const screens=[];
for(const w of [268,328,360])for(const h of [220,300,420])screens.push([w,h]);
for(const w of [540,840])for(const h of [500,700])screens.push([w,h]);
let samples=0;
for(const [width,height] of screens)for(const [i,rule]of rules.entries()){
 const fraction=Number(rule[2])/100,factor=Number(rule[3]);
 const caps=['max-width:calc((var(--story-window-height,700px) - 32px - 3%) / 1.56);','max-width:calc((100% - 16px) / 1.2);','max-width:calc((100% - 16px) / 1.05);'];
 assert(rule[0].includes(caps[i]),'safety cap matches geometry calculation');
 const cap=i===0?(height-32-width*.03)/1.56:(width-16)/(i===1?1.2:1.05);
 const cw=Math.min(width*fraction,height*factor,cap),oldWidth=Math.min(width*[.63,.76,.88][i],height*[.46,.65,.72][i]);
 assert(cw>oldWidth,'all three card types enlarge');
 const side=width*(i===2?.05:.02),bottom=width*(i===2?.05:.06);
 const ch=i===2?cw:(cw-2*side-2)*(i===0?4/3:3/4)+side+bottom+2;
 for(const original of i===2?[poses.at(-1)]:poses){
  const [x,y,r]=pose(original,cw,ch,width,height),rad=Math.abs(r)*Math.PI/180;
  const halfW=(cw*Math.cos(rad)+ch*Math.sin(rad))*1.012/2,halfH=(ch*Math.cos(rad)+cw*Math.sin(rad))*1.012/2;
  assert.equal(r,original[2],'rotation untouched');
  assert(Math.abs(x)<=Math.abs(original[0])+1e-8&&Math.abs(y)<=Math.abs(original[1])+1e-8,'only pull risky offsets inward');
  assert(Math.abs(x*cw/100)+halfW<=width/2-8+1e-6,'horizontal border stays inside');
  assert(Math.abs(y*ch/100)+halfH<=height/2-16+1e-6,JSON.stringify({width,height,type:rule[1],cw,ch,r,halfH},null,2));
  samples++;
 }
}
console.log('PASS: '+references.size+' dependency paths and parsing; exact limited edit; '+samples+' representative landing bounds; larger cards, unchanged photo content and timeline timings. Geometry calculations are not browser rendering.');
