// Actual canvas character renderer, NOT a browser screenshot or WeChat QA.
const fs=require('node:fs'),vm=require('node:vm');
const {createCanvas,loadImage}=require(require.resolve('@napi-rs/canvas',{paths:['/Users/eleme/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules']}));
const current=require('./page-turn-math.js'),old=require('../v10.102-in-place-turn/page-turn-math.js');
(async()=>{
 const source=await loadImage(__dirname+'/rig-atlas.webp'),lids=await loadImage(__dirname+'/eye-lids.png');
 const scope={devicePixelRatio:1};vm.runInNewContext(fs.readFileSync(__dirname+'/character-rig.js','utf8'),{window:scope});
 const g={width:390,height:650,viewportWidth:390,left:0,actorWidth:current.actorWidth(390)};
 const sheet=createCanvas(1560,1300),sc=sheet.getContext('2d');
 const out=fs.mkdtempSync('/private/tmp/wedding-v10103-review-');
 for(const [row,math] of [old,current].entries()){
  for(const [col,p] of [.82,.85,.89,.93].entries()){
   const c=createCanvas(390,650),ctx=c.getContext('2d'),rig=scope.WeddingCharacterRig.create(c,source,math,lids);
   rig.paint(math.sample(p,g),g);
   ctx.globalCompositeOperation='destination-over';ctx.fillStyle='#922c25';ctx.fillRect(0,0,390,650);ctx.globalCompositeOperation='source-over';
   ctx.fillStyle='#f1d5a0';ctx.font='16px sans-serif';ctx.fillText(`V10.${row?103:102} / phase ${p}`,12,24);
   sc.drawImage(c,col*390,row*650);
  }
 }
 fs.writeFileSync(out+'/comparison.png',sheet.toBuffer('image/png'));
 // Save the complete 6.8s flight at 25fps for repeatable offline inspection.
 const c=createCanvas(390,650),ctx=c.getContext('2d'),rig=scope.WeddingCharacterRig.create(c,source,current,lids);
 for(let frame=0;frame<=170;frame++){
  rig.paint(current.sample(current.progressAt(frame*40),g),g);
  ctx.globalCompositeOperation='destination-over';ctx.fillStyle='#922c25';ctx.fillRect(0,0,390,650);ctx.globalCompositeOperation='source-over';
  fs.writeFileSync(`${out}/${String(frame).padStart(3,'0')}.png`,c.toBuffer('image/png'));
 }
 console.log(out);
})();
