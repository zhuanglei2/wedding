const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const sharp=require('/Users/eleme/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const sources=[
 ['c17ed54854894d61e713e61354c3152b.jpg','kayaking','绿树环绕的河道上划船'],
 ['IMG_0259.HEIC.JPG','street-food','一起吃饼和热汤'],
 ['IMG_0809.JPG','together','两个人并肩自拍'],
 ['IMG_2124.HEIC.JPG','lakeside','坐在湖边享受闲暇'],
 ['IMG_5011.HEIC.JPG','roses','散步时带着的一束玫瑰'],
 ['IMG_5246.HEIC.JPG','sunset-eaves','晚霞下的飞檐'],
 ['IMG_5532.HEIC.JPG','dinner','一起吃饭的日常'],
 ['IMG_5625.HEIC.JPG','birthday-wish','生日蛋糕前许愿']
];
const sourceDir='/Users/eleme/Desktop/wedding/日常';
function write(name,content){const target=path.join(__dirname,name);const patch='*** Begin Patch\n'+(fs.existsSync(target)?`*** Delete File: ${target}\n`:'')+`*** Add File: ${target}\n`+content.trimEnd().split('\n').map(l=>'+'+l).join('\n')+'\n*** End Patch\n';const bin=cp.execFileSync('/bin/zsh',['-lc','command -v apply_patch'],{encoding:'utf8'}).trim();cp.execFileSync(bin,[],{input:patch})}
(async()=>{
 fs.mkdirSync(path.join(__dirname,'media'),{recursive:true});const files=[];
 for(const [name,id,alt] of sources){
  const source=path.join(sourceDir,name),before=fs.readFileSync(source),output=`media/${id}.webp`;
  const result=await sharp(before).rotate().resize({width:800,height:800,fit:'inside',withoutEnlargement:true}).webp({quality:78,effort:5}).toFile(path.join(__dirname,output));
  if(!before.equals(fs.readFileSync(source)))throw Error('Source photo changed: '+name);
  files.push({id,source:name,sourceBytes:before.length,sourceSha256:crypto.createHash('sha256').update(before).digest('hex'),output,alt,width:result.width,height:result.height,bytes:result.size});
 }
 const report={files,totalBytes:files.reduce((s,f)=>s+f.bytes,0),sourceBytes:files.reduce((s,f)=>s+f.sourceBytes,0)};
 write('media-manifest.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
