const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const read=(dir,file='index.html')=>fs.readFileSync(path.join(__dirname,'..',dir,file),'utf8');
const base=read('v10.155-more-memories'),other=read('v10.154-two-line-invitation');
const fourth=/<article class="editorial-invite"[\s\S]*?<\/article>/;
const closing=/<section class="closing">[\s\S]*?<\/section>/;
assert(fourth.test(base)&&fourth.test(other)&&closing.test(base)&&closing.test(other));
let html=base.replaceAll('V10.155','V10.156')
 .replace(fourth,()=>other.match(fourth)[0]).replace(closing,()=>other.match(closing)[0])
 .replace(/<footer>[\s\S]*?<\/footer>\s*/, '')
 .replace('<link rel="stylesheet" href="../v10.137-love-copy/invitation.css">','<link rel="stylesheet" href="story-heading.css">\n<link rel="stylesheet" href="fourth.css">')
 .replace('<link rel="stylesheet" href="memory.css">','<link rel="stylesheet" href="../v10.144-fourth-paper/paper.css">\n<link rel="stylesheet" href="../v10.151-deckle-transition/transition.css">\n<link rel="stylesheet" href="../v10.155-more-memories/memory.css">')
 .replace('src="memory-math.js"','src="../v10.155-more-memories/memory-math.js"')
 .replace('src="memory.js"','src="../v10.155-more-memories/memory.js"');
// Keep the immutable optimized photos in their original version directory.
html=html.replace(/((?:data-media-src|src)=")media\//g,'$1../v10.155-more-memories/media/');
html=html.replace('<script src="../v10.143-paper-scale/paper.js" defer></script>','<script src="../v10.143-paper-scale/paper.js" defer></script>\n<script defer src="../v10.144-fourth-paper/paper.js"></script>');
const css=read('v10.140-fuller-love','invitation.css')
 .replace(/\/\* Preserve the existing third-page title;[^]*$/,'')
 .replaceAll('EditorialSong','FourthEditorialSong')
 .replace('url("love-song.woff2")','url("../v10.140-fuller-love/love-song.woff2")');
const oldCSS=read('v10.137-love-copy','invitation.css');
const heading=oldCSS.match(/@font-face\{[^}]+\}/)[0].replace('url("invitation-song.woff2")','url("../v10.137-love-copy/invitation-song.woff2")')+'\n'+oldCSS.slice(oldCSS.indexOf('.about-reactions h2{'));
const bin=cp.execFileSync('/bin/zsh',['-lc','command -v apply_patch'],{encoding:'utf8'}).trim();
for(const [name,body] of [['index.html',html],['fourth.css',css],['story-heading.css',heading]]){
 const file=path.join(__dirname,name);
 const patch='*** Begin Patch\n'+(fs.existsSync(file)?`*** Delete File: ${file}\n`:'')+`*** Add File: ${file}\n`+body.trimEnd().split('\n').map(s=>'+'+s).join('\n')+'\n*** End Patch\n';
 cp.execFileSync(bin,[],{input:patch});
}
console.log('Built V10.156: V10.155 story/photos + V10.154 fourth/closing; shared immutable media.');
