// A deterministic typography proof, not a browser/device screenshot.
const fs=require('node:fs'),path=require('node:path'),sharp=require('sharp');
async function main(){
 const root=__dirname,W=1200,H=1840;
 const fontfile=path.resolve(root,'../../assets/ma-shan-zheng-v10.6.ttf');
 const copy=['是想念如你温柔过境','才发现原来花开都有声音'];
 const layers=[];
 for(let i=0;i<copy.length;i++){
  const raster=await sharp({text:{text:`<span foreground="#76685b" letter_spacing="4977">${copy[i]}</span>`,font:'Ma Shan Zheng 54',fontfile,rgba:true,dpi:72}}).rotate(i===0?-1:-.6,{background:'#00000000'}).png().toBuffer();
  const meta=await sharp(raster).metadata();
  layers.push({input:raster,left:i===0?96:W-96-meta.width,top:i===0?57:H-72-meta.height-13});
 }
 const m=JSON.parse(fs.readFileSync(path.join(root,'design/asset-manifest.json')));
 const base=await sharp(path.join(root,'design/gathered-scenes-master.png')).extract({left:0,top:m.display.cropTop,width:W,height:H}).png().toBuffer();
 await sharp(base).composite(layers).resize({width:900}).png().toFile(path.join(root,'design/lyrics-preview.png'));
 console.log('Rendered a typography proof at 900px. Browser CSS remains editable text.');
}
main().catch(e=>{console.error(e);process.exitCode=1});
