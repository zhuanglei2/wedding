const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const root=__dirname,html=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert.equal(html,fs.readFileSync(path.resolve(root,'../v10.194-continuous-story/index.html'),'utf8'),'entire previous art, CSS, lyrics and page content unchanged');
assert(!html.includes('v10.195'),'rejected artwork is not referenced');
assert(html.includes('../v10.193-compact-drawn-paper/scene-paper.css'));
assert(html.includes('../v10.193-compact-drawn-paper/media/gathered-scenes-1200.webp'));
assert(html.includes('../v10.191-compact-scene-lyrics/media/lyrics-1200.webp'));
assert.equal((html.match(/src="story-handoff.js"/g)||[]).length,1);
for(const match of html.matchAll(/(?:src|href)="([^"#?]+)(?:[?#][^"]*)?"/g)){
 if(/^(https?:|data:|tel:|mailto:)/.test(match[1]))continue;
 assert(fs.existsSync(path.resolve(root,match[1])),'missing '+match[1]);
}
for(const match of html.matchAll(/(?:data-media-)?srcset="([^"]+)"/g))for(const item of match[1].split(','))assert(fs.existsSync(path.resolve(root,item.trim().split(/\s+/)[0])));
const runtime=fs.readFileSync(path.join(root,'story-handoff.js'),'utf8');new vm.Script(runtime);
assert(!runtime.includes("leg==='photo-bottom'"));assert(runtime.includes("hold('timeline',3000)"));
const memory=fs.readFileSync(path.resolve(root,'../v10.168-faster-story-follow/memory.js'),'utf8');
assert(memory.includes("!root.classList.contains('story-handoff-pending')"));
assert(memory.includes("document.addEventListener('story-handoff-complete'"));
assert(html.includes('../v10.166-mobile-scroll-owner/memory-handoff.js'));
console.log('PASS: previous artwork/font sizes retained, rejected image not used, resources present, one controller, timeline arrival and subsequent page handoff preserved.');
