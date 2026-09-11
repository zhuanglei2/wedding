/* Re-encode copies only. Original wedding photos and historical assets are untouched. */
const path=require('node:path'),fs=require('node:fs');
const sharp=require('/Users/eleme/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=path.resolve(__dirname,'../..'),out=path.join(__dirname,'media');
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const files=[];
 for(const name of ['boy-love','girl-straight','boy-rethink']){
  const input=path.join(root,'versions/v10.134-inline-reactions',name+'.png'),output=path.join(out,name+'.webp');
  await sharp(input).resize({width:360,withoutEnlargement:true}).webp({quality:90,alphaQuality:100,effort:6}).toFile(output);
  files.push({name,before:fs.statSync(input).size,after:fs.statSync(output).size});
 }
 for(const name of ['camera-art','camera-clean']){
  const input=path.join(root,'versions/v10.125-keepsake-fast/media',name+'.webp'),output=path.join(out,name+'.webp');
  await sharp(input).webp({quality:94,alphaQuality:100,effort:6}).toFile(output);
  files.push({name,before:fs.statSync(input).size,after:fs.statSync(output).size});
 }
 if(process.argv[2])await sharp(process.argv[2]).resize({width:1080}).webp({quality:94,alphaQuality:100,effort:6}).toFile(path.join(out,'gilded-vine.webp'));
 console.log(JSON.stringify({files,before:files.reduce((n,f)=>n+f.before,0),after:files.reduce((n,f)=>n+f.after,0)},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
