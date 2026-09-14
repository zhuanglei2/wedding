const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const base=path.resolve(__dirname,'../v10.161-auto-story'),html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8'),old=fs.readFileSync(path.join(base,'index.html'),'utf8');
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
const expected=old.replaceAll('V10.161','V10.162').replace('src="story-handoff.js"','src="../v10.161-auto-story/story-handoff.js"').replace('src="opening-runtime.js"','src="../v10.161-auto-story/opening-runtime.js"').replace('src="memory-math.js"','src="../v10.161-auto-story/memory-math.js"');
assert.equal(html.trimEnd(),expected.trimEnd(),'only version and inherited behavior links change; layout/assets untouched');
const oldRuntime=read(path.join(base,'memory.js'));
assert.equal(read(path.join(__dirname,'memory.js')).trimEnd(),oldRuntime.replace('rejoinElapsed/420','rejoinElapsed/300').replace('dt/140','dt/95').trimEnd(),'only follow scroll and finite rejoin timing change');
console.log('PASS: '+references.size+' local dependencies; scripts parse; photos/layout/copy/typewriter/1s handoff preserved; exactly two scroll timing changes.');
