const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const base=path.resolve(__dirname,'../v10.164-hiking-copy'),html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8'),old=fs.readFileSync(path.join(base,'index.html'),'utf8');
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
const expected=old.replaceAll('V10.164','V10.165').replace('src="../v10.161-auto-story/opening-runtime.js"','src="opening-runtime.js"').replace('src="../v10.161-auto-story/story-handoff.js"','src="story-handoff.js"').replace('src="../v10.163-love-copy-handoff/memory-handoff.js"','src="memory-handoff.js"');
assert.equal(html.trimEnd(),expected.trimEnd(),'markup/copy/photos/styles unchanged');
const before=read(path.resolve(__dirname,'../v10.161-auto-story/opening-runtime.js')),after=read(path.join(__dirname,'opening-runtime.js'));
const a=before.indexOf('/* Source: camera-story.js */'),z=before.indexOf('/* Source: page-turn.js */');
let camera=before.slice(a,z).replace('plan=null,scrollAt=0;','plan=null,scrollAt=0,playbackWidth=0,playbackScale=1;')
.replace('scrollAt=window.scrollY;\n    document.dispatchEvent','scrollAt=window.scrollY;playbackWidth=window.innerWidth;playbackScale=window.visualViewport?.scale||1;\n    document.dispatchEvent')
.replace("function cancelOnChange(){\n    if(active)complete();\n  }","function cancelOnChange(){\n    // A toolbar height change does not invalidate the frozen camera flight.\n    // Real width/orientation changes and pinch zoom still end the animation.\n    if(active&&(window.innerWidth!==playbackWidth||Math.abs((window.visualViewport?.scale||1)-playbackScale)>.01))complete();\n  }")
.replace("window.addEventListener('resize',cancelOnChange,{passive:true});","window.addEventListener('resize',cancelOnChange,{passive:true});\n  window.visualViewport?.addEventListener?.('resize',cancelOnChange,{passive:true});")
.replace('Math.abs(window.scrollY-scrollAt)>2','Math.abs(window.scrollY-scrollAt)>8');
assert.equal(after.trimEnd(),(before.slice(0,a)+camera+before.slice(z)).trimEnd(),'only camera resize/scroll cancellation changes; motion math and first-page logic untouched');
for(const [name,prior] of [['story-handoff.js','v10.161-auto-story'],['memory-handoff.js','v10.163-love-copy-handoff']]){
 const previous=read(path.resolve(__dirname,'..',prior,name));assert.equal(read(path.join(__dirname,name)).trimEnd(),previous.replace('Math.abs(y()-lastWritten)>3','Math.abs(y()-lastWritten)>8').trimEnd(),'finite handoff timings and manual interruption preserved');
}
console.log('PASS: '+references.size+' local dependencies; scripts parse; exact viewport-cancellation-only scope; photos/copy/math/typing/1s holds and 1.4s scroll timings unchanged.');
