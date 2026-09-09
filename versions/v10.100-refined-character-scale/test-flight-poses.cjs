// Asset-only contact sheet: exercise the real character renderer at actual
// viewport positions, without a browser or an alternate website renderer.
const fs=require('node:fs'),vm=require('node:vm');
const {createCanvas,loadImage}=require(require.resolve('@napi-rs/canvas',{paths:[process.env.WEDDING_NODE_MODULES||'/Users/eleme/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules']}));
const math=require('./page-turn-math.js');
(async()=>{
  const image=await loadImage(__dirname+'/rig-atlas.png'),heads=await loadImage(__dirname+'/head-expressions.png'),scope={devicePixelRatio:1};
  vm.runInNewContext(fs.readFileSync(__dirname+'/character-rig.js','utf8'),{window:scope});
  const sheet=createCanvas(1560,562),out=sheet.getContext('2d');
  const g={width:390,height:844,viewportWidth:390,left:0,actorWidth:math.actorWidth(390)};
  for(const [i,p] of [.71,.745,.775,.80,.87,.92].entries()){
    const stage=createCanvas(390,844),ctx=stage.getContext('2d');
    const layer=createCanvas(390,844),rig=scope.WeddingCharacterRig.create(layer,image,math,heads);
    const state=math.sample(p,g);rig.paint(state,g);
    ctx.fillStyle='#922c25';ctx.fillRect(0,0,390,844);ctx.drawImage(layer,0,0);
    ctx.fillStyle='#f2ddb3';ctx.font='16px sans-serif';ctx.fillText((p*math.DURATION/1000).toFixed(2)+'s',16,28);
    out.drawImage(stage,i*260,0,260,562);
  }
  fs.writeFileSync('/private/tmp/wedding-v1071-flight-poses.png',sheet.toBuffer('image/png'));
  console.log('PASS: actual actor trajectories rendered at six flight/grip/release/exit positions');
})();
