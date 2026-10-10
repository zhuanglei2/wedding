const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const sharp=require('/Users/eleme/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const sources=[['garden','/Users/eleme/Desktop/wedding/881da7a9cr3d3e3212939759cd494ede.jpg.JPG'],['corridor','/Users/eleme/Desktop/wedding/IMG_8989.PNG.JPG']];
async function main(){
 fs.mkdirSync(path.join(__dirname,'media'),{recursive:true});
 for(const[name,source]of sources){
  const before=crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex');
  const output=path.join(__dirname,'media',name+'.webp');
  if(fs.existsSync(output))throw new Error('Asset already exists: '+output);
  const result=await sharp(source).webp({quality:92,effort:6}).toFile(output);
  const after=crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex');
  if(before!==after)throw new Error('Original changed');
  console.log(JSON.stringify({name,...result,sourceUnchanged:true,sha256:before}));
 }
}
main().catch(e=>{console.error(e);process.exitCode=1});
