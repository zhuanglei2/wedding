const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),sharp=require('sharp');
const root=__dirname;
async function main(){
 const target=path.join(root,'design/lyrics-generated.png');
 if(process.argv[2])fs.copyFileSync(process.argv[2],target);
 const metadata=await sharp(target).metadata();
 assert(metadata.hasAlpha,'ImageGen must supply a real transparent image');
 const alpha=await sharp(target).extractChannel('alpha').raw().toBuffer();
 const transparent=alpha.filter(a=>a===0).length/alpha.length;
 assert(transparent>.5,'No baked background behind lettering');
 const assets=[];
 for(const width of [600,1200]){
  const file=`lyrics-${width}.webp`,output=path.join(root,'media',file);
  await sharp(target).resize({width}).webp({lossless:true,effort:6}).toFile(output);
  const meta=await sharp(output).metadata();
  assets.push({file,width,height:meta.height,bytes:fs.statSync(output).size});
 }
 const manifestPath=path.join(root,'design/asset-manifest.json');
 const manifest=JSON.parse(fs.readFileSync(manifestPath));
 manifest.lyricImage={width:metadata.width,height:metadata.height,transparentPixelRatio:transparent,assets};
 fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
 // Static asset assembly for visual QA, not a browser screenshot. Typography
 // is the generated raster, and the selected composite stays intact on disk.
 const paper=await sharp(path.join(root,'design/page-two-paper-sample.png')).extract({left:0,top:0,width:1200,height:408}).png().toBuffer();
 const main=await sharp(path.join(root,'design/gathered-scenes-master.png')).resize({width:1200}).extract({left:0,top:0,width:1200,height:1800}).png().toBuffer();
 const lettering=await sharp(target).resize({width:1080}).png().toBuffer();
 const proof=await sharp({create:{width:1200,height:2208,channels:3,background:'#f8f5ef'}}).composite([
  {input:main,left:0,top:0},{input:paper,left:0,top:1800},{input:lettering,left:60,top:1800}
 ]).png().toBuffer();
 fs.writeFileSync(path.join(root,'design/layout-proof.png'),proof);
 await sharp(proof).resize({width:720}).png().toFile(path.join(root,'design/layout-preview.png'));
 console.log(JSON.stringify(manifest.lyricImage,null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1});
