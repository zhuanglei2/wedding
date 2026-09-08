// Actual isolated sprite renderer QA, not a browser screenshot.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {createCanvas,loadImage}=require(require.resolve('@napi-rs/canvas',{paths:['/Users/eleme/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules']}));
const math=require('./page-turn-math.js');
(async()=>{
  const source=await loadImage(__dirname+'/rig-atlas.png'),heads=await loadImage(__dirname+'/head-expressions.png');
  const scope={devicePixelRatio:1};vm.runInNewContext(fs.readFileSync(__dirname+'/head-masks.js','utf8'),{window:scope});vm.runInNewContext(fs.readFileSync(__dirname+'/character-rig.js','utf8'),{window:scope});
  assert.equal(heads.width/6,heads.height/2,'Six by two equal atlas cells');
  const g={width:390,height:844,viewportWidth:1500,left:0,actorWidth:math.actorWidth(390)};
  const canvas=createCanvas(1500,900),ctx=canvas.getContext('2d');ctx.fillStyle='#922c25';ctx.fillRect(0,0,1500,900);
  for(let i=0;i<2;i++)for(const [column,p] of [.60,.73,.79,i===0?.828:.86,.92].entries()){
    const layer=createCanvas(1500,900),rig=scope.WeddingCharacterRig.create(layer,source,math,heads);
    const state=math.sample(p,g),a=state.actors[i];
    Object.assign(a,{x:column*300+28,y:i*450+45,scale:1,lean:0,opacity:1});
    state.actors=[a];rig.paint(state,{...g,height:900});ctx.drawImage(layer,0,0);
    ctx.fillStyle='#f2ddb3';ctx.font='16px sans-serif';ctx.fillText(p+' / yaw '+a.headYaw.toFixed(2),column*300+25,i*450+420);
  }
  fs.writeFileSync('/private/tmp/wedding-v1070-expression-check.png',canvas.toBuffer('image/png'));
  for(const width of [320,390,768,1000])for(let p=0;p<=1;p+=.002){
    for(const a of math.sample(p,{...g,width,actorWidth:math.actorWidth(width)}).actors){
      assert.ok(a.eyeOpen>=.039&&a.eyeOpen<=1);
      assert.ok(Math.abs(a.headYaw)<=1&&Math.abs(a.headAngle)<=16);
      assert.ok(Math.abs(a.headNod)<=6&&Math.abs(a.clothLag)<=24);
    }
  }
  const together=math.sample(.8,g).actors;
  assert.ok(together[0].headYaw>.99&&together[1].headYaw<-.99,'Distinct inward-facing head assets');
  assert.ok(math.sample(.6785,g).actors[0].eyeOpen<.05&&math.sample(.7195,g).actors[1].eyeOpen<.05,'Staggered authored blink poses');
  assert.ok(math.sample(.94,g).actors.every(a=>a.headYaw>.99&&a.headNod<-5),'Heads lead upward departure');
  assert.ok(math.sample(.86,g).actors[0].headNod<-0.5&&math.sample(.86,g).actors[1].clothLag<1,'Head leads cloth, not synchronized wobble');
  assert.ok((math.DEPART_AT-math.JOIN_AT)*math.DURATION>=330,'Hold the shared glance before departing');
  const render=(p,index=0)=>{
    const c=createCanvas(400,400),rig=scope.WeddingCharacterRig.create(c,source,math,heads);
    const state=math.sample(p,g),a=state.actors[index];Object.assign(a,{x:50,y:20,scale:1,lean:0,opacity:1});state.actors=[a];
    rig.paint(state,{...g,viewportWidth:400,height:400});return c.getContext('2d').getImageData(0,0,400,400).data;
  };
  assert.notDeepEqual(render(.60),render(.73),'Perspective turn changes actual rendered pixels');
  assert.notDeepEqual(render(.79),render(.828),'Closed eyes change actual rendered pixels');
  assert.deepEqual(render(.73),render(.73),'Renderer is seek deterministic');
  // Mobile-scale contact sheets with the real trajectory and bank, no webpage QA.
  const flight=createCanvas(1170,844),fc=flight.getContext('2d');fc.fillStyle='#922c25';fc.fillRect(0,0,1170,844);
  for(const [n,p] of [.73,.82,.90].entries()){
    const c=createCanvas(390,844),rig=scope.WeddingCharacterRig.create(c,source,math,heads);
    rig.paint(math.sample(p,{...g,viewportWidth:390}),{...g,viewportWidth:390});fc.drawImage(c,n*390,0);
  }
  fs.writeFileSync('/private/tmp/wedding-v1070-mobile-poses.png',flight.toBuffer('image/png'));
  console.log('PASS: generated perspective/blink poses, head/cloth delay, readable clasp, actual sprite rendering and deterministic seek');
})();
