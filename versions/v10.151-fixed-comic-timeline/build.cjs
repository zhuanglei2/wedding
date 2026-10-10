const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const from=path.join(__dirname,'../v10.150-fixed-story-paper');
let html=fs.readFileSync(path.join(from,'index.html'),'utf8').replaceAll('V10.150','V10.151');
html=html.replaceAll('"media/wedding-finale.webp"','"../v10.150-fixed-story-paper/media/wedding-finale.webp"');
const opening='<div class="story-paper-window" tabindex="0" role="region" aria-label="关于我们，滚动阅读故事"><div class="story-paper-content">';
const start=html.indexOf(opening),section=html.indexOf('<section id="story-timeline"',start),end=html.indexOf('</section></div></div></article>',section);
if(start<0||section<0||end<0)throw Error('Story page boundaries missing');
const intro=html.slice(start+opening.length,section),timeline=html.slice(section,end+10);
html=html.slice(0,start)+'<div class="story-page-layout"><div class="story-fixed-intro">'+intro+'</div><div class="story-timeline-frame"><div class="story-paper-window" tabindex="0" role="region" aria-label="我们的时间轴，滚动阅读"><div class="story-paper-content">'+timeline+'</div></div></div></div>'+html.slice(end+22);
function write(name,content){const target=path.join(__dirname,name);const patch='*** Begin Patch\n'+(fs.existsSync(target)?`*** Delete File: ${target}\n`:'')+`*** Add File: ${target}\n`+content.split('\n').map(l=>'+'+l).join('\n')+'\n*** End Patch\n';const bin=cp.execFileSync('/bin/zsh',['-lc','command -v apply_patch'],{encoding:'utf8'}).trim();cp.execFileSync(bin,[],{input:patch})}
write('index.html',html);
for(const file of ['memory-math.js','memory.js','memory.css','test.cjs'])if(!fs.existsSync(path.join(__dirname,file)))write(file,fs.readFileSync(path.join(from,file),'utf8'));
console.log('V10.151 built: fixed comic intro and independent timeline window.');
