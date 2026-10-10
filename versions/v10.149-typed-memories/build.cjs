/* Build only this version; older versions and their assets remain unchanged. */
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const dest=__dirname;
let html=fs.readFileSync(path.join(dest,'../v10.148-memory-cascade/index.html'),'utf8').replaceAll('V10.148','V10.149');
const start=html.indexOf('<section id="story-timeline"'),end=html.indexOf('</section></article>',start)+10;
if(start<0||end<start)throw Error('Timeline boundary not found');
const old=html.slice(start,end),originalNodes=old.match(/<li>.*?<\/li>/gs);
if(originalNodes.length!==4)throw Error('Expected four existing nodes');
const escape=s=>s.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const segmenter=new Intl.Segmenter('zh',{granularity:'grapheme'});
function typeBlock(tag,attrs,body){const label=body.replace(/<br\s*\/?>/g,' ').replace(/<[^>]+>/g,'');const content=body.split(/(<[^>]+>)/).map(s=>s.startsWith('<')?s:[...segmenter.segment(s)].map(({segment})=>`<span class="type-glyph" aria-hidden="true">${segment}</span>`).join('')).join('');return `<${tag}${attrs} class="type-block" aria-label="${escape(label)}">${content}</${tag}>`}
function typing(node){return node.replace(/<(h3|p)([^>]*)>(.*?)<\/\1>/gs,(_,tag,attrs,body)=>typeBlock(tag,attrs,body))}
function img(src,alt,width,height){return `<img data-media-src="${src}" width="${width}" height="${height}" alt="${alt}" decoding="async" loading="lazy" fetchpriority="low"><noscript><img src="${src}" alt="${alt}" width="${width}" height="${height}" loading="lazy"></noscript>`}
const alts=['商场灯光下的背影','密室逃生的朋友合影','白墙园林与水面','一起看音乐会','撑伞的旅行留影','夜晚河边的双人合照','夕阳下举起的小点心','生日投影前的留影','捧着生日蛋糕的瞬间','一起吃火锅'];
const cards=alts.map((alt,i)=>`<figure class="memory-card${i===1||i===2?' memory-landscape':''}" data-memory-card="${i}">${img(`../v10.148-memory-cascade/media/memory-${String(i+1).padStart(2,'0')}.webp`,alt,i===1||i===2?800:600,i===1||i===2?600:800)}</figure>`).join('');
const keepsake=`<figure class="memory-card memory-keepsake" data-memory-card="10" aria-label="朝暮与共，四季相依，四宫格纪念卡"><div class="keepsake-author">作乐</div><figcaption>朝暮与共，四季相依<span>😘</span></figcaption><div class="keepsake-grid">${img('media/heart-sea.webp','海边的双手比心',480,640)}${img('media/ice-creams.webp','一起吃的两支冰淇淋',480,640)}${img('media/heart-trees.webp','树影下的双手比心',480,640)}${img('media/heart-sunset.webp','落日下的双手比心',480,640)}</div><div class="keepsake-date">2026年1月3日</div></figure>`;
const nodes=originalNodes.map((node,i)=>{
 node=typing(node).replace('<li>',`<li class="story-node${i===3?' memory-period':''}" data-story-node="${i}">`);
 if(i===3){node=node.replace('<div class="timeline-prose">','<div class="memory-copy"><div class="timeline-prose">');node=node.replace('</li>',`<div class="memory-stack" aria-label="生活照片叠放">${cards}${keepsake}</div></div></li>`)}return node;
});
const finale=typing(`<li class="story-node wedding-node" data-story-node="4"><h3><time datetime="2026-10">2026年10月</time></h3><div class="timeline-prose"><p>我们要结婚啦</p></div><figure class="wedding-finale">${img('media/wedding-finale.webp','我们要结婚啦，草坪上的婚纱合照',1080,1620)}</figure></li>`);
const section=`<section id="story-timeline" class="love-timeline" aria-label="我们的故事时间轴"><ol>${nodes.join('')}${finale}</ol></section>`;
html=html.slice(0,start)+section+html.slice(end);
const target=path.join(dest,'index.html');
// apply_patch is used even for this mechanical, version-scoped HTML rewrite.
const patch='*** Begin Patch\n'+(fs.existsSync(target)?`*** Delete File: ${target}\n`:'')+`*** Add File: ${target}\n`+html.split('\n').map(l=>'+'+l).join('\n')+'\n*** End Patch\n';
const apply=cp.execFileSync('/bin/zsh',['-lc','command -v apply_patch'],{encoding:'utf8'}).trim();cp.execFileSync(apply,[],{input:patch});console.log('Built V10.149 (five timeline nodes, ten photos + one keepsake)');
