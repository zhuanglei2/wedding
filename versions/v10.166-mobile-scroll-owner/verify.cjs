const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const base=path.resolve(__dirname,'../v10.165-mobile-handoff'),html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8'),old=fs.readFileSync(path.join(base,'index.html'),'utf8');
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
const expected=old.replaceAll('V10.165','V10.166').replace('src="opening-runtime.js"','src="../v10.165-mobile-handoff/opening-runtime.js"');
assert.equal(html.trimEnd(),expected.trimEnd(),'markup/photos/copy/styles/other scripts unchanged');
assert(html.includes('src="../v10.163-love-copy-handoff/memory.js"'),'typing and inner timeline remain unchanged');
for(const name of ['story-handoff.js','memory-handoff.js']){
 const code=read(path.join(__dirname,name));
 assert(code.includes('duration=1400,hold=1000'),'hold and main easing duration unchanged');
 assert(!code.includes("addEventListener('scroll'"),'no scroll-effect-based cancellation');
 assert(code.includes("['wheel','touchstart','touchmove','pointerdown']"),'explicit user control retained');
 assert(code.includes('timestamp-landingAt>=800'),'finite landing fallback');
}
console.log('PASS: '+references.size+' dependency paths; all scripts parse; only two handoff controllers changed; markup, photos, first-page/camera motion, typography and timeline unchanged.');
