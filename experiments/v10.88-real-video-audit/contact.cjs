const fs=require('node:fs'),path=require('node:path');
const deps='/Users/eleme/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const {createCanvas,loadImage}=require(path.join(deps,'@napi-rs/canvas'));
const dir=process.argv[2],meta=JSON.parse(fs.readFileSync(path.join(dir,'decode.json')));
async function main(){
 const targets=[0,.5,1,1.5,2,2.5,3,meta.frames.at(-1).time];
 const canvas=createCanvas(1200,1140),ctx=canvas.getContext('2d');ctx.fillStyle='#1c222a';ctx.fillRect(0,0,1200,1140);
 for(let k=0;k<targets.length;k++){
  const f=meta.frames.reduce((a,b)=>Math.abs(b.time-targets[k])<Math.abs(a.time-targets[k])?b:a),image=await loadImage(path.join(dir,f.file));
  const x=k%4*300,y=Math.floor(k/4)*570;ctx.drawImage(image,x,y+32,300,533.333);ctx.fillStyle='white';ctx.font='19px sans-serif';ctx.fillText(`${f.time.toFixed(3)}s / ${f.file}`,x+9,y+23);
 }
 fs.writeFileSync(path.join(__dirname,'source-contact-sheet.png'),canvas.toBuffer('image/png'));
 console.log({frameCount:meta.frameCount,duration:meta.duration,fps:meta.nominalFPS,firstFrame:meta.frames[0],lastFrame:meta.frames.at(-1)});
}
main().catch(e=>{console.error(e);process.exitCode=1});
