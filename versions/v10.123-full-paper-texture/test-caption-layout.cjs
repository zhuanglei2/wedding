const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const oldDir=path.resolve(__dirname,'../v10.120-full-paper-cover-priority');
const read=(dir,name)=>fs.readFileSync(path.join(dir,name),'utf8');
const css=read(__dirname,'camera-story.css'),oldCss=read(oldDir,'camera-story.css');
const html=read(__dirname,'index.html'),oldHtml=read(oldDir,'index.html');
const rule=(text,selector)=>text.match(new RegExp('^'+selector.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\{([^}]+)\\}','m'))[1];
assert.equal(rule(css,'.camera-names'),rule(oldCss,'.camera-names'),'Names/date styling remains byte-identical');
assert.equal(rule(css,'.camera-caption,.camera-names'),rule(oldCss,'.camera-caption,.camera-names'),'Original artwork source and common positioning stay unchanged');
const normalizeHtml=t=>t.replace(/<style id="camera-runtime-style">[\s\S]*?<\/style>/,'').replace(/<script src="paper-tail.js" defer><\/script>\n/g,'').replace(/V10\.12[0123]/g,'VERSION');
assert.equal(normalizeHtml(html),normalizeHtml(oldHtml),'Outside caption CSS and version labels the full page is identical');
assert.equal(html.match(/<style id="camera-runtime-style">([\s\S]*?)<\/style>/)[1].trim(),css.trim(),'Inline and standalone CSS agree');
for(const file of ['camera-story.js','page-turn.js','page-media.js','handoff-math.js','camera-story-math.js']){
 assert.equal(read(__dirname,file),read(oldDir,file),file+' unchanged: timing, photo, flight, loading');
}
assert.match(css,/html\.cover-first \.camera-caption::before,/);
assert.match(css,/html\.cover-first \.camera-caption::after,/);
assert.equal(rule(css,'.camera-caption'),'background:none;clip-path:inset(76% 0 10% 0);opacity:var(--caption-alpha)');
assert.equal(rule(css,'.camera-caption::before'),'clip-path:inset(76% 49.5% 10% 12%);transform:translate(-1.8%,0)');
assert.equal(rule(css,'.camera-caption::after'),'clip-path:inset(76% 16% 10% 50.5%);transform:translate(3.4%,.7%)');
// Conservative glyph extents from the original 1024 x 1536 artwork, not a rendered-page assertion.
const en={left:154,right:514,top:1180,bottom:1362},zh={left:522,right:835,top:1218,bottom:1348};
assert.ok(en.left>1024*.12&&en.right<1024*.505);
assert.ok(zh.left>1024*.505&&zh.right<1024*.84);
for(const w of [320,375,390,430,768,1000]){
 const scale=w/1024,h=w*1.5;
 const a={left:en.left*scale-w*.018,right:en.right*scale-w*.018,top:en.top*scale,bottom:en.bottom*scale};
 const b={left:zh.left*scale+w*.034,right:zh.right*scale+w*.034,top:zh.top*scale+h*.007,bottom:zh.bottom*scale+h*.007};
 assert.ok(b.left-a.right>=w*.052,'Clear bilingual gap increases by 5.2% of the artwork width');
 assert.ok(a.left>0&&b.right<w,'No horizontal overflow of visible captions');
 assert.ok(a.top>h*.76&&b.top>h*.76&&a.bottom<h*.90&&b.bottom<h*.90,'Entire glyphs stay in the existing caption band, clear of names/date');
}
console.log('PASS: only bilingual caption layout changed; original type/color, names/date, photo, motion and loading preserved; 6 display widths and inline CSS verified. No browser visual claim.');
