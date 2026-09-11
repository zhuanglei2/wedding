// Derived delivery assets only. Never overwrite or retouch originals.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const sharp=require('/Users/eleme/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const dir=path.join(__dirname,'media');
const jobs=[
 {src:'../v10.111-camera-invitation/camera-invitation.png',out:'camera-art.webp',lossless:true},
 {src:'../v10.112-camera-story/camera-clean.png',out:'camera-clean.webp',lossless:true},
 ...[960,1600,2400].map(width=>({src:'../v10.106-reference-party/couple-original.jpg',out:'couple-'+width+'.webp',width,quality:94})),
 ...[780,1170].map(width=>({src:'../v10.54-photo-right/invitation-v10.54.png',out:'cover-'+width+'.webp',width,quality:92}))
];
(async()=>{
 fs.mkdirSync(dir,{recursive:true});
 const records=await Promise.all(jobs.map(async job=>{
  const source=path.resolve(__dirname,job.src),before=hash(source),dest=path.join(dir,job.out);
  let pipeline=sharp(source);
  if(job.width)pipeline=pipeline.resize({width:job.width,withoutEnlargement:true});
  const info=await pipeline.webp(job.lossless?{lossless:true,effort:6}:{quality:job.quality,effort:6,smartSubsample:true}).toFile(dest);
  if(hash(source)!==before)throw Error('Source changed: '+job.src);
  let pixelsEqual=null;
  if(job.lossless){
   const [a,b]=await Promise.all([sharp(source).ensureAlpha().raw().toBuffer(),sharp(dest).ensureAlpha().raw().toBuffer()]);
   pixelsEqual=a.equals(b);if(!pixelsEqual)throw Error('Lossless pixel mismatch');
  }
  return {...job,sourceSha256:before,originalBytes:fs.statSync(source).size,bytes:info.size,height:info.height,width:info.width,pixelsEqual};
 }));
 fs.writeFileSync(path.join(__dirname,'asset-report.json'),JSON.stringify(records,null,2)+'\n');
 console.log(JSON.stringify(records));
})().catch(error=>{console.error(error);process.exitCode=1;});
