const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const root=__dirname;
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const previous=fs.readFileSync(path.join(root,'../v10.193-compact-drawn-paper/index.html'),'utf8');
const normalized=html.replace('src="story-handoff.js"','src="../v10.183-photo-led-collage/story-handoff.js"').replace('href="../v10.193-compact-drawn-paper/scene-paper.css"','href="scene-paper.css"').replaceAll('../v10.193-compact-drawn-paper/media/','media/');
assert.equal(normalized,previous,'latest art/lyrics and all other content intact');
assert.equal((html.match(/src="story-handoff.js"/g)||[]).length,1,'one handoff owner');
assert(!html.includes('../v10.183-photo-led-collage/story-handoff.js'));
assert(html.indexOf('id="our-story"')<html.indexOf('id="gathered-scenes"'));
assert(html.indexOf('id="gathered-scenes"')<html.indexOf('id="celebration"'));
assert(html.includes('../v10.193-compact-drawn-paper/media/gathered-scenes-1200.webp'));
assert(html.includes('../v10.191-compact-scene-lyrics/media/lyrics-1200.webp'));
for(const match of html.matchAll(/(?:src|href)="([^"#?]+)(?:[?#][^"]*)?"/g)){
 if(/^(https?:|data:|tel:|mailto:)/.test(match[1]))continue;
 assert(fs.existsSync(path.resolve(root,match[1])),'missing '+match[1]);
}
for(const match of html.matchAll(/(?:data-media-)?srcset="([^"]+)"/g))for(const item of match[1].split(','))assert(fs.existsSync(path.resolve(root,item.trim().split(/\s+/)[0])));
const runtime=fs.readFileSync(path.join(root,'story-handoff.js'),'utf8');new vm.Script(runtime);
for(const phrase of ["querySelector('#gathered-scenes')","querySelector('#celebration')","hold('photo-bottom',3000)","hold('timeline',1000)","story-handoff-complete"]){assert(runtime.includes(phrase),phrase)}
const memory=fs.readFileSync(path.join(root,'../v10.168-faster-story-follow/memory.js'),'utf8');
assert(memory.includes("!root.classList.contains('story-handoff-pending')"),'timeline blocks while route owns document scroll');
assert(memory.includes("document.addEventListener('story-handoff-complete'"),'timeline resumes at arrival');
assert(html.includes('../v10.166-mobile-scroll-owner/memory-handoff.js'),'existing timeline-to-next-page transition retained');
const entry=fs.readFileSync(path.join(root,'../../index.html'),'utf8');
assert(entry.includes('versions/v10.194-continuous-story/index.html'));
console.log('PASS latest picture/lyrics integrated in full page; one scroll owner; timeline gate/resume wiring; unchanged later-page handoff; all local dependencies; default local entry points to V10.194.');
