const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const base=path.resolve(__dirname,'../v10.158-story-title'),html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8'),old=fs.readFileSync(path.join(base,'index.html'),'utf8');
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
function article(h,id){return h.match(new RegExp('<article[^>]* id="'+id+'"[\\s\\S]*?</article>'))?.[0]}
const normalize=h=>h.replaceAll('../v10.125-keepsake-fast/media/camera-art.webp','media/camera-art.webp').replaceAll('../v10.125-keepsake-fast/media/camera-clean.webp','media/camera-clean.webp');
assert.equal(normalize(article(old,'our-story')),article(html,'our-story'),'second-page framing and content unchanged');
assert.equal(article(old,'wedding-invitation'),article(html,'wedding-invitation'),'fourth page unchanged');
assert.equal(old.match(/<section class="closing"[\s\S]*?<\/section>/)[0],html.match(/<section class="closing"[\s\S]*?<\/section>/)[0]);
assert.equal(old.match(/<h2 id="reactions-title">.*?<\/h2>/)[0],html.match(/<h2 id="reactions-title">.*?<\/h2>/)[0]);
assert(html.indexOf('story-gilded-join')<html.indexOf('id="celebration"'));
assert(html.indexOf('flow-and-gilt.css')>html.indexOf('v10.155-more-memories/memory.css'),'texture and title overrides last');
assert(html.includes('href="flow-and-gilt.css"'));
for(const s of ['object-position:50% 24%','--film-unit:2.0588235294117645px;left:15%;top:39%;width:70%;height:35%'])assert(html.includes(s),'photo centering preserved');
const runtime=read(path.join(__dirname,'opening-runtime.js')),oldRuntime=read(path.join(__dirname,'../v10.132-left-cannon-right-fireworks/opening-runtime.js'));
const normalizeRuntime=s=>s.replace('  let fonts=false;\n','').replace(/    if\(fonts\)return;fonts=true;\n    const link=document.createElement\('link'\);link.rel='stylesheet';\n    link.href='https:\/\/fonts.googleapis.com\/css2\?family=Noto\+Serif\+SC:wght@400;500;600&display=swap';\n    document.head.appendChild\(link\);\n/,'').trim();
assert.equal(runtime.trim(),normalizeRuntime(oldRuntime),'first/second animation runtime untouched except external font request removal');
assert(read(path.join(__dirname,'flow-and-gilt.css')).includes('font-family:AboutHand'));
assert(!read(path.join(__dirname,'reactions.css')).includes('@font-face'),'large font not fetched by initial CSS');
const fontSource=read(path.join(__dirname,'handwriting.js'));new vm.Script(fontSource);
let released,intersection,loads=0,added=0,events=0;
const pending=new Promise(r=>released=r);
class Face{load(){loads++;return Promise.resolve(this)}}
class Observer{constructor(fn){intersection=fn}observe(){}disconnect(){}}
const context={window:{FontFace:Face,WeddingMedia:{ready:pending},IntersectionObserver:Observer},FontFace:Face,IntersectionObserver:Observer,Event:class{},document:{querySelector:()=>({}),fonts:{add(){added++}},dispatchEvent(){events++}}};
vm.runInNewContext(fontSource,context);
(async()=>{assert.equal(loads,0);assert(!intersection,'waits for cover');released();await Promise.resolve();assert(intersection);intersection([{isIntersecting:false}]);assert.equal(loads,0);intersection([{isIntersecting:true}]);intersection([{isIntersecting:true}]);await Promise.resolve();assert.equal(loads,1);assert.equal(added,1);assert.equal(events,1);
 console.log('PASS: '+references.size+' local references; JS syntax; unchanged second-page framing, photo and fourth/fifth content; unchanged opening animation; delayed real handwriting loads once after cover/approach.');
})().catch(e=>{console.error(e);process.exitCode=1});
