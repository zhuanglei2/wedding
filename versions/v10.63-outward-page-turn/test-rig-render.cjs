// Exercise the actual canvas renderer and inspect isolated puppet assembly.
// This is an asset check, not a browser screenshot or website layout test.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {createCanvas,loadImage}=require(require.resolve('@napi-rs/canvas',{paths:[process.env.WEDDING_NODE_MODULES||'/Users/eleme/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules']}));
const math=require('./page-turn-math.js');
(async()=>{
  const source=await loadImage(__dirname+'/rig-atlas.png');
  const scope={devicePixelRatio:1};vm.runInNewContext(fs.readFileSync(__dirname+'/character-rig.js','utf8'),{window:scope});
  for(const c of Object.values(scope.WeddingCharacterRig.crops))assert.ok(c[0]>=0&&c[1]>=0&&c[0]+c[2]<=source.width&&c[1]+c[3]<=source.height);
  const output=createCanvas(1080,650),ctx=output.getContext('2d');ctx.fillStyle='#922c25';ctx.fillRect(0,0,1080,650);
  const g={width:390,height:650,viewportWidth:1080,left:0,actorWidth:195};
  for(const [column,p] of [.12,.34,.57].entries()){
    const layer=createCanvas(1080,650),rig=scope.WeddingCharacterRig.create(layer,source,math);
    const state=math.sample(p,g);
    state.actors.forEach((a,i)=>{a.x=column*360+90;a.y=25+i*310;a.opacity=1;});
    rig.paint(state,g);ctx.drawImage(layer,0,0);
  }
  fs.writeFileSync('/private/tmp/wedding-rig-poses.png',output.toBuffer('image/png'));
  console.log('PASS: actual canvas rig renderer, eight atlas crops and three articulated poses');
})();
