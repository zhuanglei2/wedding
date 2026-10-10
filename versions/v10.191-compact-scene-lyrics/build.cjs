// Latest user decision: use the supplied composite exactly. No further AI
// redraw, geometry change or restoration pass on this selected picture.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),sharp=require('sharp');
const root=__dirname,hash=b=>crypto.createHash('sha256').update(b).digest('hex');
async function main(){
 const design=path.join(root,'design'),media=path.join(root,'media');
 fs.mkdirSync(design,{recursive:true});fs.mkdirSync(media,{recursive:true});
 const saved=path.join(design,'selected-picture.png');
 const input=process.argv[2]||saved;
 if(input!==saved)fs.copyFileSync(input,saved);
 const data=fs.readFileSync(saved),meta=await sharp(data).metadata();
 // The complete selected picture remains intact on disk. CSS clips old text.
 fs.writeFileSync(path.join(design,'gathered-scenes-master.png'),data);
 const assets=[];
 for(const width of [600,900,1200]){
  const file=`gathered-scenes-${width}.webp`,output=path.join(media,file);
  await sharp(data).resize({width}).webp({quality:91,effort:6,smartSubsample:true}).toFile(output);
  const actual=await sharp(output).metadata();
  assets.push({file,width,height:actual.height,bytes:fs.statSync(output).size});
 }
 const manifest={canvas:{width:meta.width,height:meta.height},display:{width:1200,height:1800,cropTop:0},
 source:input,sourceHash:hash(data),selectedPicture:'design/selected-picture.png',
 lyrics:['是想念如你温柔过境','才发现原来花开都有声音'],
 policy:'User-selected composite kept byte-for-byte as the PNG master. No further image generation, recolouring or portrait manipulation. Responsive WebP is lossy. Only its old English footer is hidden by the webpage viewport; the generated lyric image is a separate DOM image below.',assets};
 fs.writeFileSync(path.join(design,'asset-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 console.log(JSON.stringify(manifest,null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1});
