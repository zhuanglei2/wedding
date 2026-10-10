const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const sharp=require('/Users/eleme/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const src='/Users/eleme/Desktop/wedding/3b02222b716bf5a60ac9dcfa383f6111.jpg';
const hash=()=>crypto.createHash('sha256').update(fs.readFileSync(src)).digest('hex');
(async()=>{const before=hash(),output=path.join(__dirname,'media');fs.mkdirSync(output,{recursive:true});const image=await sharp(src).rotate().resize({width:1080,height:1620,fit:'inside',withoutEnlargement:true}).webp({quality:84,effort:5}).toFile(path.join(output,'wedding-finale.webp'));if(hash()!==before)throw Error('Original modified');console.log(JSON.stringify(image))})().catch(e=>{console.error(e);process.exitCode=1});
