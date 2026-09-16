const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const current=fs.readFileSync(path.join(__dirname,'index.html'),'utf8'),old=fs.readFileSync(path.join(__dirname,'../v10.168-faster-story-follow/index.html'),'utf8');
const reduced=current.replaceAll('V10.169','V10.168').replace('<link rel="stylesheet" href="music.css">\n<script src="music.js" defer></script>\n','').replace('src="../v10.168-faster-story-follow/memory.js"','src="memory.js"').replace('src="story-handoff.js"','src="../v10.166-mobile-scroll-owner/story-handoff.js"').replace('<div class="music-slot music-spacer" aria-hidden="true"></div>\n','').replace(/<section class="music-slot" id="wedding-music"[\s\S]*?<\/section>\n/,'');
assert.equal(reduced,old,'existing content/photo/timeline/layout CSS remain byte-identical');
assert.equal((current.match(/id="wedding-audio"/g)||[]).length,1);assert.equal((current.match(/id="wedding-music"/g)||[]).length,1);
assert(current.includes('preload="none"'));assert(!/\bautoplay\b/.test(current));
const previousHandoff=fs.readFileSync(path.join(__dirname,'../v10.166-mobile-scroll-owner/story-handoff.js'),'utf8');
assert.equal(fs.readFileSync(path.join(__dirname,'story-handoff.js'),'utf8').replace(" document.addEventListener('wedding-music-interaction',cancel);\n",''),previousHandoff);
const seen=new Set(),refs=new Set();
function inspect(file){
 if(seen.has(file))return;seen.add(file);const text=fs.readFileSync(file,'utf8'),ext=path.extname(file),urls=[];
 if(ext==='.js')new vm.Script(text,{filename:file});
 if(ext==='.html'){
  for(const m of text.matchAll(/(?:src|href|data-media-src|data-original)="([^"]+)"/g))urls.push(m[1]);
  for(const m of text.matchAll(/(?:imagesrcset|srcset|data-media-srcset)="([^"]+)"/g))urls.push(...m[1].split(',').map(v=>v.trim().split(/\s+/)[0]));
  for(const m of text.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))if(m[1].trim())new vm.Script(m[1]);
 }
 for(const m of text.matchAll(/url\(["']?([^\s"')]+)["']?\)/g))urls.push(m[1]);
 for(const raw of urls){if(/^(data:|https?:|#|mailto:|tel:)/.test(raw))continue;const url=raw.split(/[?#]/)[0];if(!url)continue;const target=path.resolve(path.dirname(file),url);assert(fs.existsSync(target),'missing '+target);refs.add(target);if(/\.(css|js)$/.test(target))inspect(target)}
}
inspect(path.join(__dirname,'index.html'));
assert(fs.statSync(path.join(__dirname,'media/love-duet-192.mp3')).size<6500000);
console.log('PASS: '+refs.size+' referenced assets exist; all JS parses; one real audio player; original content unchanged; no audio preload; exact one-listener handoff diff.');
