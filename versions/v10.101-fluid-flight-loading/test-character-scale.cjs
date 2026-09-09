// Offline render of the real canvas rig, NOT a browser/page screenshot.
const fs=require('node:fs'), vm=require('node:vm'), assert=require('node:assert/strict');
const {createCanvas,loadImage}=require(require.resolve('@napi-rs/canvas',{paths:['/Users/eleme/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules']}));
const current=require('./page-turn-math.js');
const previous=require('../v10.71-collar-and-motion/page-turn-math.js');
(async()=>{
  const source=await loadImage(__dirname+'/rig-atlas.webp');
  const heads=await loadImage(__dirname+'/eye-lids.png');
  const scope={devicePixelRatio:1};
  vm.runInNewContext(fs.readFileSync(__dirname+'/character-rig.js','utf8'),{window:scope});
  for(const width of [320,375,390,430,768,1000]){
    assert.ok(Math.abs(current.actorWidth(width)/previous.actorWidth(width)-.8)<1e-12);
    const g={width,height:844,left:0,viewportWidth:width,actorWidth:current.actorWidth(width)};
    for(let frame=0;frame<=640;frame++){
      const state=current.sample(frame/1000,g);
      assert.ok(state.edge<=width*1.004,'Free edge must not surge outside the viewport');
    }
  }
  const sheet=createCanvas(780,1260),ctx=sheet.getContext('2d');
  ctx.fillStyle='#922c25';ctx.fillRect(0,0,780,1260);
  for(const [row,p] of [.48,.80].entries())for(const [column,math] of [previous,current].entries()){
    const layer=createCanvas(390,580);
    const g={width:390,height:580,viewportWidth:390,left:0,actorWidth:math.actorWidth(390)};
    g.actorHeight=g.actorWidth*340/240;
    const rig=scope.WeddingCharacterRig.create(layer,source,math,heads);
    const state=math.sample(p,g);
    rig.paint(state,g);
    ctx.drawImage(layer,column*390,row*630+36);
    ctx.fillStyle='#efd4a7';ctx.font='16px sans-serif';
    ctx.fillText(`${column?'V10.100 / 80%':'V10.71 / 100%'} — ${row?'handhold':'pull'}`,column*390+18,row*630+24);
  }
  fs.writeFileSync('/private/tmp/wedding-v10100-size-comparison.png',sheet.toBuffer('image/png'));
  console.log('PASS: 20% smaller at six widths; actual rig before/after render written to /private/tmp/wedding-v10100-size-comparison.png');
})();
