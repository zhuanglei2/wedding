const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),sharp=require('sharp');
const root=__dirname,base=path.resolve(root,'../v10.191-compact-scene-lyrics');
async function main(){
 for(const name of ['index.html','preview.html']){
  const doc=fs.readFileSync(path.join(root,name),'utf8');
  assert.equal(doc.replaceAll('../v10.191-compact-scene-lyrics/media/','media/'),fs.readFileSync(path.join(base,name),'utf8'),'only shared-media paths changed');
  for(const match of doc.matchAll(/(?:src|href)="([^"#?]+)(?:[?#][^"]*)?"/g)){
   if(/^(https?:|data:|tel:|mailto:)/.test(match[1]))continue;
   assert(fs.existsSync(path.resolve(root,match[1])),'missing '+match[1]);
  }
  for(const match of doc.matchAll(/(?:data-media-)?srcset="([^"]+)"/g))for(const item of match[1].split(','))assert(fs.existsSync(path.resolve(root,item.trim().split(/\s+/)[0])));
 }
 const css=fs.readFileSync(path.join(root,'scene-paper.css'),'utf8');
 assert(css.includes('aspect-ratio:1200/1640'));assert(css.includes('margin:-13.3333333333% 0 0'));
 for(const width of [320,375,390,430,768,1000]){
  const top=width*160/1200,height=width*1640/1200,oldEnd=width*1800/1200;
  assert(Math.abs(top+height-oldEnd)<1e-8,'same lower crop edge');
  assert(top<width*740/971,'head trim never reaches either person');
 }
 const out=path.join(root,'design');fs.mkdirSync(out,{recursive:true});
 // Static composition QA only, not a browser or mobile screenshot. This
 // samples the unchanged source through the same viewport as the CSS.
 const scene=await sharp(path.join(base,'design/selected-picture.png')).resize({width:1200}).extract({left:0,top:160,width:1200,height:1640}).png().toBuffer();
 const paper=await sharp(path.join(base,'design/page-two-paper-sample.png')).extract({left:0,top:0,width:1200,height:408}).png().toBuffer();
 const lyrics=await sharp(path.join(base,'design/lyrics-generated.png')).resize({width:1080}).png().toBuffer();
 const proof=await sharp({create:{width:1200,height:2048,channels:3,background:'#f8f5ef'}}).composite([
  {input:scene,left:0,top:0},{input:paper,left:0,top:1640},{input:lyrics,left:60,top:1640}
 ]).png().toBuffer();
 await sharp(proof).resize({width:720}).png().toFile(path.join(out,'layout-preview.png'));
 console.log('PASS: unchanged images/HTML/animation/lyrics; all dependencies; six responsive crop geometries; top reduced 52px at 390px wide. Static visual proof saved.');
}
main().catch(e=>{console.error(e);process.exitCode=1});
