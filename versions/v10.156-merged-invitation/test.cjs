const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const here=__dirname,read=f=>fs.readFileSync(path.resolve(here,f),'utf8');
const html=read('index.html'),base=read('../v10.155-more-memories/index.html'),other=read('../v10.154-two-line-invitation/index.html');
const article=(s,cls)=>s.match(new RegExp('<article class="'+cls+'[^]*?</article>'))[0];
assert.equal(article(html,'about-reactions'),article(base,'about-reactions').replace(/((?:data-media-src|src)=")media\//g,'$1../v10.155-more-memories/media/'));
assert.equal(article(html,'editorial-invite'),article(other,'editorial-invite'));
assert.equal(html.match(/<section class="closing">[^]*?<\/section>/)[0],other.match(/<section class="closing">[^]*?<\/section>/)[0]);
const bodyStart=s=>s.slice(s.indexOf('<body>'),s.indexOf('<article class="about-reactions'));
assert.equal(bodyStart(html),bodyStart(base),'first and second pages unchanged');
assert(!/<footer>|class="rsvp"|href="[^\"]*guest.html"/.test(html));
assert(html.includes('文涛厅')&&html.includes('这一刻的幸福<br>想与你一同分享'));
assert.equal((html.match(/data-memory-card=/g)||[]).length,19);
const scripts=[...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m=>m[1]);
assert.equal(scripts.length,new Set(scripts).size);
for(const script of scripts)new vm.Script(read(script),{filename:script});
for(const script of ['../v10.143-paper-scale/paper.js','../v10.144-fourth-paper/paper.js','../v10.155-more-memories/memory.js','../v10.155-more-memories/memory-math.js'])assert(scripts.includes(script));
assert(!read('fourth.css').includes('.about-reactions'),'fourth stylesheet has no third-page selectors');
assert(read('fourth.css').includes('FourthEditorialSong'),'fourth font has an isolated family');
assert.equal(read('story-heading.css').replace('url("../v10.137-love-copy/invitation-song.woff2")','url("invitation-song.woff2")').trimEnd(),read('../v10.137-love-copy/invitation.css').match(/@font-face\{[^}]+\}/)[0]+'\n'+read('../v10.137-love-copy/invitation.css').split('/* Reuse the same tiny local subset for the existing third-page title. */\n')[1].trimEnd());
assert(html.indexOf('v10.143-paper-scale/paper.css')<html.indexOf('v10.155-more-memories/memory.css'));
const expected=base.replaceAll('V10.155','V10.156').replace(/<article class="editorial-invite"[^]*?<\/article>/,'FOURTH').replace(/<section class="closing">[^]*?<\/section>/,'CLOSING').replace(/<footer>[^]*?<\/footer>\s*/,'');
const normalized=html.replace(/<article class="editorial-invite"[^]*?<\/article>/,'FOURTH').replace(/<section class="closing">[^]*?<\/section>/,'CLOSING')
 .replace('<link rel="stylesheet" href="story-heading.css">\n<link rel="stylesheet" href="fourth.css">','<link rel="stylesheet" href="../v10.137-love-copy/invitation.css">')
 .replace('<link rel="stylesheet" href="../v10.144-fourth-paper/paper.css">\n','').replace('<link rel="stylesheet" href="../v10.151-deckle-transition/transition.css">\n','')
 .replace('<script defer src="../v10.144-fourth-paper/paper.js"></script>\n','')
 .replaceAll('../v10.155-more-memories/','');
assert.equal(normalized.trimEnd(),expected.trimEnd(),'only scoped fourth/closing merge and asset relocation');
console.log('PASS: unchanged opening/story/19 photos; merged fourth/closing; isolated CSS; both paper layers; shared runtime syntax; no RSVP/footer.');
