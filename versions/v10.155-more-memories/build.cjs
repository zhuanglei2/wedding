const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const from=path.join(__dirname,'../v10.154-large-wedding-finale');
let html=fs.readFileSync(path.join(from,'index.html'),'utf8').replaceAll('V10.154','V10.155');
const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'media-manifest.json'),'utf8'));
const original=[...html.matchAll(/<figure class="memory-card[^>]*>[\s\S]*?<\/figure>/g)].map(m=>m[0]);
if(original.length!==11||!original.at(-1).includes('memory-keepsake'))throw Error('Unexpected existing photo sequence');
const cards=[...original];let seed=0x20261006;
const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
for(const photo of manifest.files){
 const cls=photo.width>photo.height?'memory-card memory-landscape':'memory-card';
 const tag=`<figure class="${cls}" data-memory-card="0" data-added-memory="${photo.id}"><img data-media-src="${photo.output}" width="${photo.width}" height="${photo.height}" alt="${photo.alt}" decoding="async" loading="lazy" fetchpriority="low"><noscript><img src="${photo.output}" width="${photo.width}" height="${photo.height}" alt="${photo.alt}" loading="lazy"></noscript></figure>`;
 // Shuffle insertion points once at build time; never disturb the opening photo or the final keepsake.
 cards.splice(1+Math.floor(random()*(cards.length-1)),0,tag);
}
const ordered=cards.map((card,i)=>card.replace(/data-memory-card="\d+"/,`data-memory-card="${i}"`));
const start=html.indexOf(original[0]),end=html.indexOf(original.at(-1),start)+original.at(-1).length;
html=html.slice(0,start)+ordered.join('')+html.slice(end);
function write(name,content){const target=path.join(__dirname,name);const patch='*** Begin Patch\n'+(fs.existsSync(target)?`*** Delete File: ${target}\n`:'')+`*** Add File: ${target}\n`+content.trimEnd().split('\n').map(l=>'+'+l).join('\n')+'\n*** End Patch\n';const bin=cp.execFileSync('/bin/zsh',['-lc','command -v apply_patch'],{encoding:'utf8'}).trim();cp.execFileSync(bin,[],{input:patch})}
write('index.html',html);
for(const file of ['memory-math.js','memory.js','memory.css','test.cjs'])if(!fs.existsSync(path.join(__dirname,file)))write(file,fs.readFileSync(path.join(from,file),'utf8'));
console.log('V10.155: 18 daily-life photos plus the original closing four-grid.');
console.log(ordered.map(c=>c.match(/data-media-src="([^"]+)"/)[1]).join('\n'));
