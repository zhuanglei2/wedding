// Offline actual canvas playback, not a browser screenshot or network benchmark.
const fs=require('node:fs'),vm=require('node:vm');
const {createCanvas,loadImage}=require(require.resolve('@napi-rs/canvas',{paths:['/Users/eleme/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules']}));
const math=require('./page-turn-math.js');
(async()=>{
 const source=await loadImage(__dirname+'/rig-atlas.webp'),heads=await loadImage(__dirname+'/eye-lids.png');
 const scope={devicePixelRatio:1};vm.runInNewContext(fs.readFileSync(__dirname+'/character-rig.js','utf8'),{window:scope});
 const canvas=createCanvas(390,650),rig=scope.WeddingCharacterRig.create(canvas,source,math,heads),ctx=canvas.getContext('2d');
 const g={width:390,height:650,viewportWidth:390,left:0,actorWidth:math.actorWidth(390)};
 const out=fs.mkdtempSync('/private/tmp/wedding-v10101-flight-');
 const sheet=createCanvas(1170,1300),sc=sheet.getContext('2d');
 const samples=[500,1050,1900,4800,5600,6150];
 for(let frame=0;frame<=170;frame++){
  const ms=frame*40,state=math.sample(math.progressAt(ms),g);
  rig.paint(state,g);
  ctx.globalCompositeOperation='destination-over';ctx.fillStyle='#922c25';ctx.fillRect(0,0,390,650);ctx.globalCompositeOperation='source-over';
  ctx.fillStyle='#eed3a0';ctx.font='14px sans-serif';ctx.fillText(`V10.101 / ${(ms/1000).toFixed(2)}s / isolated rig`,14,24);
  fs.writeFileSync(`${out}/${String(frame).padStart(3,'0')}.png`,canvas.toBuffer('image/png'));
 }
 for(const [i,ms] of samples.entries()){
  const im=await loadImage(`${out}/${String(Math.round(ms/40)).padStart(3,'0')}.png`);sc.drawImage(im,(i%3)*390,Math.floor(i/3)*650);
 }
 fs.writeFileSync('/private/tmp/wedding-v10101-flight-sheet.png',sheet.toBuffer('image/png'));
 console.log(out);
})();
