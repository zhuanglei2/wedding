const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const from=path.join(__dirname,'../v10.149-typed-memories');
let html=fs.readFileSync(path.join(from,'index.html'),'utf8').replaceAll('V10.149','V10.150');
html=html.replaceAll('wedding-finale.webp" width="1080" height="1620"','wedding-finale.webp" width="854" height="1280"');
for(const asset of ['heart-sea','heart-sunset','ice-creams','heart-trees'])html=html.replaceAll(`media/${asset}.webp`,`../v10.149-typed-memories/media/${asset}.webp`);
const keepsake=html.match(/<figure class="memory-card memory-keepsake"[\s\S]*?<\/figure>/)?.[0];
if(!keepsake)throw Error('Four-photo keepsake missing');
html=html.replace(keepsake,keepsake
 .replace(/<div class="keepsake-author">.*?<\/div>/s,'')
 .replace(/<figcaption>.*?<\/figcaption>/s,'')
 .replace(/<div class="keepsake-date">.*?<\/div>/s,'')
 .replace('aria-label="朝暮与共，四季相依，四宫格纪念卡"','aria-label="四张生活照片组成的四宫格"'));
const announcement=html.match(/<p class="type-block" aria-label="我们要结婚啦">.*?<\/p>/s)?.[0];
if(!announcement)throw Error('Wedding announcement missing');
html=html.replace(announcement,announcement.replace('aria-label="我们要结婚啦"','aria-label="我们要结婚啦！！！！"').replace('</p>',Array(4).fill('<span class="type-glyph" aria-hidden="true">！</span>').join('')+'</p>'));
html=html.replace('<article class="about-reactions"','<article class="about-reactions story-fixed-page"');
const layer='<div class="matching-paper-layer" aria-hidden="true"></div>';
html=html.replace(layer,layer+'<div class="story-paper-window" tabindex="0" role="region" aria-label="关于我们，滚动阅读故事"><div class="story-paper-content">');
const section=html.indexOf('<section id="story-timeline"'),end=html.indexOf('</section></article>',section);
if(end<0)throw Error('Story closing boundary missing');
html=html.slice(0,end)+html.slice(end).replace('</section></article>','</section></div></div></article>');
function write(name,content){const target=path.join(__dirname,name);const patch='*** Begin Patch\n'+(fs.existsSync(target)?`*** Delete File: ${target}\n`:'')+`*** Add File: ${target}\n`+content.split('\n').map(l=>'+'+l).join('\n')+'\n*** End Patch\n';const bin=cp.execFileSync('/bin/zsh',['-lc','command -v apply_patch'],{encoding:'utf8'}).trim();cp.execFileSync(bin,[],{input:patch})}
write('index.html',html);
for(const file of ['memory-math.js','memory.js','memory.css','test.cjs'])if(!fs.existsSync(path.join(__dirname,file)))write(file,fs.readFileSync(path.join(from,file),'utf8'));
console.log('V10.150 built; story viewport and four exclamation marks added.');
