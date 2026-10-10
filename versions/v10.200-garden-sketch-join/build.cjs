// Format-only conversion of the generated asset; no photo editing or resize.
const sharp=require('sharp'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const input=path.join(__dirname,'media/garden-eaves-sketch.png');
 const output=path.join(__dirname,'media/garden-eaves-sketch.webp');
 const before=await sharp(input).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 await sharp(input).webp({lossless:true,effort:6}).toFile(output);
 const after=await sharp(output).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 assert.deepEqual(after.info,before.info);
 assert(before.data.equals(after.data),'All generated raster pixels must be preserved');
 console.log('PASS lossless format conversion; generated pixels unchanged:',output);
})().catch(error=>{console.error(error);process.exitCode=1});
