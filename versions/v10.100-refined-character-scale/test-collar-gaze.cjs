const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {createCanvas,loadImage}=require(require.resolve('@napi-rs/canvas',{paths:['/Users/eleme/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules']}));
const math=require('./page-turn-math.js');
(async()=>{
  const image=await loadImage(__dirname+'/rig-atlas.png'),lids=await loadImage(__dirname+'/head-expressions.png');
  const scope={devicePixelRatio:1};vm.runInNewContext(fs.readFileSync(__dirname+'/character-rig.js','utf8'),{window:scope});
  const g={width:390,height:400,viewportWidth:400,left:0,actorWidth:math.actorWidth(390)};
  function render(index,override={}){
    const canvas=createCanvas(400,400),rig=scope.WeddingCharacterRig.create(canvas,image,math,lids);
    const a=math.sample(.80,g).actors[index];
    Object.assign(a,{x:20,y:20,scale:1,lean:0,spineAngle:0,arm:-65,freeArm:65,opacity:1,clothLag:0,clothRipple:0,eyeOpen:1,gazeX:0,gazeY:0},override);
    rig.paint({actors:[a]},g);return canvas;
  }
  const reference=createCanvas(400,400),rc=reference.getContext('2d'),b=math.layouts[1].body;
  rc.drawImage(image,...scope.WeddingCharacterRig.crops.body1,b[0]+20,b[1]+20,b[2],b[3]);
  const actual=render(1),rect=[115,205,70,45];
  const a=actual.getContext('2d').getImageData(...rect).data,r=rc.getImageData(...rect).data;
  let opaque=0;
  for(let k=0;k<r.length;k+=4)if(r[k+3]===255){
    opaque++;assert.deepEqual(Array.from(a.slice(k,k+4)),Array.from(r.slice(k,k+4)),'Necklace/collar/bouquet must use the intact original pixels');
  }
  assert.ok(opaque>2500,'The checked original collar is a substantial opaque region');
  for(const index of [0,1]){
    const e=scope.WeddingCharacterRig.eyes[index][0],c=scope.WeddingCharacterRig.crops['body'+index],b=math.layouts[index].body;
    const box=[Math.floor(20+b[0]+(e.box[0]-c[0])*b[2]/c[2]),Math.floor(20+b[1]+(e.box[1]-c[1])*b[3]/c[3]),Math.ceil(e.box[2]*b[2]/c[2]),Math.ceil(e.box[3]*b[3]/c[3])];
    const centroid=(gazeX,eyeOpen=1)=>{
      const pixels=render(index,{gazeX,eyeOpen}).getContext('2d').getImageData(...box).data;
      let n=0,total=0;for(let k=0;k<pixels.length;k+=4)if(pixels[k]<140&&pixels[k+3]>200){n++;total+=(k/4)%box[2];}
      return {x:total/Math.max(1,n),n};
    };
    const left=centroid(-.85),right=centroid(.85),closed=centroid(0,.04);
    assert.ok(right.x-left.x>4,'Actual iris travel is readable, not only changing metadata');
    assert.ok(closed.n<left.n*.65&&closed.n>2,'Lid closes the iris but keeps a visible curved crease');
  }
  // Isolated original vs current assembly at the same source scale, not webpage QA.
  const sheet=createCanvas(800,400),sc=sheet.getContext('2d');sc.fillStyle='#922c25';sc.fillRect(0,0,800,400);
  sc.drawImage(reference,0,0);sc.drawImage(actual,400,0);
  sc.fillStyle='#f2ddb3';sc.font='16px sans-serif';sc.fillText('Original source',30,385);sc.fillText('V10.71 intact collar',430,385);
  fs.writeFileSync('/private/tmp/wedding-v1071-collar-check.png',sheet.toBuffer('image/png'));
  console.log('PASS: original collar/necklace pixels, actual iris travel, progressive closed eyelid');
})();
