const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const base=path.resolve(__dirname,'../v10.160-resume-settle'),html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8'),old=fs.readFileSync(path.join(base,'index.html'),'utf8');
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


const expected=old.replaceAll('V10.160','V10.161').replace('<script src="../v10.159-flow-and-gilt/opening-runtime.js" defer></script>','<script src="story-handoff.js" defer></script>\n<script src="opening-runtime.js" defer></script>').replace('../v10.155-more-memories/memory-math.js','memory-math.js');
assert.equal(html.trimEnd(),expected.trimEnd(),'only version and behavior script links change; visual layout unchanged');
const opening=read(path.join(__dirname,'opening-runtime.js')),oldOpening=read(path.join(__dirname,'../v10.159-flow-and-gilt/opening-runtime.js'));
const index=oldOpening.indexOf('/* Source: camera-story.js */');
const expectedOpening=oldOpening.slice(0,index)+oldOpening.slice(index).replace("function complete(){","function complete(reason='cancelled'){").replace("document.dispatchEvent(new Event('camera-story-complete'));","document.dispatchEvent(new CustomEvent('camera-story-complete',{detail:{reason}}));").replace("if(state.done){complete();return;}","if(state.done){complete('finished');return;}");
assert.equal(opening.trimEnd(),expectedOpening.trimEnd(),'existing camera motion unchanged; only completion reason added');
assert(read(path.join(__dirname,'memory.js')).includes("!root.classList.contains('story-handoff-pending')"));
assert(html.indexOf('src="story-handoff.js"')<html.indexOf('src="opening-runtime.js"'),'completion listener registers before camera');
console.log('PASS: '+references.size+' local references; scripts parse; existing markup/photos/styles/camera motion unchanged; handoff registered before completion and gates third-page playback.');
