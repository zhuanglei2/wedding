const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const base=path.resolve(__dirname,'../v10.163-love-copy-handoff'),html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8'),old=fs.readFileSync(path.join(base,'index.html'),'utf8');
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
const glyphs=s=>[...s].map(c=>'<span class="type-glyph" aria-hidden="true">'+c+'</span>').join('');
assert(old.includes('爬上徒步')&&old.includes(glyphs('爬上徒步')));
const expected=old.replaceAll('爬上徒步','爬山徒步').replaceAll(glyphs('爬上徒步'),glyphs('爬山徒步')).replaceAll('V10.163','V10.164').replace('src="memory-handoff.js"','src="../v10.163-love-copy-handoff/memory-handoff.js"').replace('src="memory.js"','src="../v10.163-love-copy-handoff/memory.js"');
assert.equal(html.trimEnd(),expected.trimEnd(),'only hiking typo/version/inherited script URLs change');
assert(!html.includes('爬上徒步')&&!html.includes(glyphs('爬上徒步')));assert(html.includes('去桐庐-爬山徒步，')&&html.includes(glyphs('爬山徒步')));
console.log('PASS: visible and accessible typo corrected; '+references.size+' local dependencies; JS parses; exact inherited animation scripts/other copy/layout/assets preserved.');
