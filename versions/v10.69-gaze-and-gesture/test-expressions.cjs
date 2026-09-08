// Isolated sprite QA using the same production renderer, not a webpage render.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {createCanvas,loadImage}=require(require.resolve('@napi-rs/canvas',{paths:['/Users/eleme/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules']}));
const math=require('./page-turn-math.js');
(async()=>{
  const source=await loadImage(__dirname+'/rig-atlas.png'),scope={devicePixelRatio:1};
  vm.runInNewContext(fs.readFileSync(__dirname+'/character-rig.js','utf8'),{window:scope});
  const canvas=createCanvas(1500,920),ctx=canvas.getContext('2d');
  ctx.fillStyle='#922c25';ctx.fillRect(0,0,1500,920);
  const g={width:390,height:844,viewportWidth:1500,left:0,actorWidth:math.actorWidth(390)};
  for(let i=0;i<2;i++){
    const phases=i===0?[.62,.695,.724,.795,.87]:[.64,.72,.775,.81,.87];
    for(const [column,p] of phases.entries()){
      const layer=createCanvas(1500,920),rig=scope.WeddingCharacterRig.create(layer,source,math);
      const state=math.sample(p,g),a=state.actors[i];
      a.x=column*300+28;a.y=i*460+40;a.scale=1;a.lean=0;a.opacity=1;
      state.actors=[a];rig.paint(state,{...g,height:920});ctx.drawImage(layer,0,0);
      ctx.fillStyle='#f2ddb3';ctx.font='16px sans-serif';ctx.fillText(p+' / eyes '+a.eyeOpen.toFixed(2),column*300+25,i*460+420);
    }
  }
  for(const width of [320,390,768,1000])for(let p=0;p<=1;p+=.002){
    for(const a of math.sample(p,{...g,width,actorWidth:math.actorWidth(width)}).actors){
      assert.ok(a.eyeOpen>=.039&&a.eyeOpen<=1);
      assert.ok(Math.abs(a.gazeX)<=.851&&Math.abs(a.gazeY)<=.651);
      assert.ok(Math.abs(a.headAngle)<4.5&&Math.abs(a.headNod)<=1.8);
    }
  }
  const facing=math.sample(.80,g).actors;
  assert.ok(facing[0].gazeX>0&&facing[1].gazeX<0,'Look toward each other');
  assert.ok(math.sample(.775,g).actors[1].eyeOpen<.05,'Girl blink is visible');
  assert.ok(math.sample(.724,g).actors[0].eyeOpen<.05,'Boy blink is staggered');
  const leaving=math.sample(.90,g).actors;
  assert.ok(leaving.every(a=>a.gazeY<0),'Eyes lead upward departure');
  for(const pair of scope.WeddingCharacterRig.eyes)for(const eye of pair)for(const r of Object.values(eye)){
    assert.ok(r[0]>=0&&r[1]>=0&&r[0]+r[2]<=source.width&&r[1]+r[3]<=source.height,'Source-derived eye crop stays within atlas');
  }
  const eyePixels=(gaze,open)=>{
    const layer=createCanvas(400,400),rig=scope.WeddingCharacterRig.create(layer,source,math);
    const state=math.sample(.80,g),a=state.actors[0];
    Object.assign(a,{x:20,y:20,scale:1,lean:0,headAngle:0,headNod:0,gazeX:gaze,gazeY:0,eyeOpen:open,opacity:1});
    state.actors=[a];rig.paint(state,{...g,viewportWidth:400,height:400});
    return layer.getContext('2d').getImageData(100,123,69,31).data;
  };
  const left=eyePixels(-.85,1),right=eyePixels(.85,1),shut=eyePixels(0,.04);
  assert.notDeepEqual(left,right,'Actual iris pixels move, not just pose metadata');
  const dark=pixels=>{let n=0;for(let k=0;k<pixels.length;k+=4)if(pixels[k]<140&&pixels[k+3]>200)n++;return n;};
  assert.ok(dark(shut)>3&&dark(shut)<dark(left)*.5,'Blink retains a dark eyelid but closes the open eye');
  fs.writeFileSync('/private/tmp/wedding-v1069-expression-check.png',canvas.toBuffer('image/png'));
  console.log('PASS: real renderer, bounded gaze/head movement, staggered blink and departure gaze');
})();
