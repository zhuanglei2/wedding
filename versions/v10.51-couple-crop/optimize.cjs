// Re-encode approved pixels for delivery, never change the source photograph.
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('/Users/eleme/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const source = path.join(__dirname, 'invitation-v10.51.png');
(async () => {
  const result = [];
  for (const width of [780,1170,1400]) {
    for (const format of ['webp','jpg']) {
      const name = `cover-${width}.${format}`;
      let pipeline = sharp(source).resize({width});
      pipeline = format === 'webp'
        ? pipeline.webp({quality:84,effort:6,smartSubsample:true})
        : pipeline.jpeg({quality:86,chromaSubsampling:'4:4:4',mozjpeg:true});
      const info = await pipeline.toFile(path.join(__dirname,name));
      result.push({name,width,height:info.height,bytes:info.size});
    }
  }
  fs.writeFileSync(path.join(__dirname,'sizes.json'),JSON.stringify(result,null,2)+'\n');
  console.log(result);
})().catch(error => {console.error(error);process.exitCode=1;});
