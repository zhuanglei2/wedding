const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
let source=fs.readFileSync(path.join(__dirname,'../v10.104-cover-first-paint/test-page-turn.cjs'),'utf8');
function change(a,b){assert.ok(source.includes(a),a);source=source.replace(a,b)}
change("require('./page-turn-math.js')","require('../v10.104-cover-first-paint/page-turn-math.js')");
change("__dirname+'/page-turn.js'","__dirname+'/../v10.112-camera-story/page-turn.js'");
change("__dirname+'/page-turn.css'","__dirname+'/../v10.104-cover-first-paint/page-turn.css'");
change("nodes['.image-cover'].image=new El();",`nodes['.image-cover'].image=new El();
  for(const key of ['.underlay-photo','.actual-header','.actual-photo','.underlay-clean','.actual-clean'])nodes[key]=new El();`);
change("nodes['.head-source'],nodes['.opening-underlay img']])","nodes['.head-source'],nodes['.opening-underlay img'],nodes['.underlay-photo'],nodes['.actual-header'],nodes['.actual-photo'],nodes['.underlay-clean'],nodes['.actual-clean']])");
change("querySelector:k=>nodes[k],addEventListener","querySelector:k=>nodes[k],querySelectorAll:()=>[nodes['.opening-underlay img'],nodes['.underlay-photo'],nodes['.actual-header'],nodes['.actual-photo'],nodes['.underlay-clean'],nodes['.actual-clean']],addEventListener");
change("win.WeddingHeadMasks=opts.maskMissing?null:[];",`win.WeddingHeadMasks=opts.maskMissing?null:[];
  win.WeddingCameraStory={ready:!opts.cameraNotReady,start(input){calls.handoff=input;calls.handoffs=(calls.handoffs||0)+1;return true},complete(){calls.cameraCompleted=true}};`);
change('s.decodeQueue.length,4','s.decodeQueue.length,9');
source=source.replaceAll('math.DURATION','3800');
change('[80,240,500,2000,5000,3800-1]','[80,240,500,2000,3500,3800-1]');
source+=`
s=setup();s.nodes['.cover-enter'].emit('click',{preventDefault(){}});s.flush(0);s.flush(3800);
assert.equal(s.calls.handoffs,1,'Exactly one camera continuation');
assert.equal(s.calls.handoff.actors.length,2);
const expected=math.sample(.79,{width:390,height:844,left:0,viewportWidth:390,actorWidth:math.actorWidth(390)}).actors;
for(const i of [0,1]){
 assert.equal(s.calls.handoff.actors[i].x,expected[i].x);assert.equal(s.calls.handoff.actors[i].y,expected[i].y);
}
s=setup();s.nodes['.cover-enter'].emit('click',{preventDefault(){}});emit(s,'keydown',{key:'Escape',preventDefault(){}});
assert.ok(s.calls.cameraCompleted);assert.equal(s.calls.handoffs,undefined,'Escape does not launch another animation');
s=setup({cameraNotReady:true});assert.ok(!s.root.classes.has('star-turn'));
s.win.WeddingCameraStory.ready=true;emit(s,'camera-assets-ready');s.flush();assert.ok(s.root.classes.has('star-turn'));
console.log('PASS: 3800ms cover, no pre-scroll jump, held-pose handoff, exactly-once camera start, Escape and clean-image readiness gate.');
`;
new Function('require','__dirname',source)(require,__dirname);
