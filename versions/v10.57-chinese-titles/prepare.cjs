const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require('/Users/eleme/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const source=path.join(__dirname,'../../assets/portrait-classic.jpg');
const hash=()=>crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex');
(async()=>{
  const before=hash();
  const results=await Promise.all([
    sharp(source).rotate().resize({width:1400,withoutEnlargement:true}).webp({quality:90,effort:6}).toFile(path.join(__dirname,'classic-reveal.webp')),
    sharp(source).rotate().resize({width:1400,withoutEnlargement:true}).jpeg({quality:92,chromaSubsampling:'4:4:4',mozjpeg:true}).toFile(path.join(__dirname,'classic-reveal.jpg')),
  ]);
  if(before!==hash())throw Error('Source photo changed');
  console.log(JSON.stringify({sourceSha256:before,results},null,2));
})().catch(error=>{console.error(error);process.exitCode=1});
