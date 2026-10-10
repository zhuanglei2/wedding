const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const from=path.join(__dirname,'../v10.151-fixed-comic-timeline');
function write(name,content){const target=path.join(__dirname,name);const patch='*** Begin Patch\n'+(fs.existsSync(target)?`*** Delete File: ${target}\n`:'')+`*** Add File: ${target}\n`+content.split('\n').map(l=>'+'+l).join('\n')+'\n*** End Patch\n';const bin=cp.execFileSync('/bin/zsh',['-lc','command -v apply_patch'],{encoding:'utf8'}).trim();cp.execFileSync(bin,[],{input:patch})}
write('index.html',fs.readFileSync(path.join(from,'index.html'),'utf8').replaceAll('V10.151','V10.152'));
for(const file of ['memory-math.js','memory.js','memory.css','test.cjs'])if(!fs.existsSync(path.join(__dirname,file)))write(file,fs.readFileSync(path.join(from,file),'utf8'));
console.log('V10.152 built from fixed-comic timeline; existing assets and layout preserved.');
