const assert=require('node:assert/strict'),fs=require('node:fs');
const {setup,checkFinal}=require('./test-opening-runtime.cjs');
const read=f=>fs.readFileSync(__dirname+'/'+f,'utf8');
const css=read('camera-story.css'),html=read('index.html'),instant=read('instant-paper.js');

// These namespaces belong to independent renderers with different origins.
assert.doesNotMatch(css+instant,/\.paper-strip\b|['"]paper-strip['"]/);
assert.match(html,/\.paper-strip\{[^}]*transform-origin:0 0/);
assert.match(css,/\.instant-film-strip\{[^}]*transform-origin:50% 50%/);
assert.match(css,/\.reference-art\{overflow:hidden\}/);
assert.match(css,/html\{overflow-x:clip;overscroll-behavior-x:none\}/);
for(const [,selector,body]of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)){
 if(/\b(?:html|body|main)\b|\.opening-sequence/.test(selector))
  assert.doesNotMatch(body,/overflow(?:-[xy])?\s*:\s*(?:hidden|auto|scroll)/,'No new sticky ancestor scrolling container');
}
assert.match(css,/#our-story:focus\{outline:none\}/);
assert.match(css,/#our-story\.keyboard-landing:focus\{outline:2px solid #b83c31;outline-offset:-5px\}/);
assert.match(css,/\.camera-names\{background:none;clip-path:inset\(90% 0 0 0\);opacity:var\(--names-alpha\)\}/);
assert.match(css,/transform-origin:36\.9140625% 93\.75%;transform:scale\(1\.16\)/);
assert.match(css,/\.camera-names::after\{clip-path:inset\(90% 0 0 51%\)\}/);
assert.match(css,/html\.cover-first \.camera-names::before,\s*html\.cover-first \.camera-names::after\{background-image:none!important\}/);

// Original artwork: 1024x1536; measured red glyph extents. No changed bitmap.
const W=1024,H=1536,origin={x:378,y:1440},scale=1.16;
const x=v=>origin.x+(v-origin.x)*scale,y=v=>origin.y+(v-origin.y)*scale;
const names={left:260,right:495,top:1413,bottom:1467};
assert.ok(names.left>W*.25&&names.right<W*.485,'Name ink inside fully opaque horizontal mask');
assert.ok(names.top>H*.917&&names.bottom<H*.96,'Name ink inside fully opaque vertical mask');
assert.ok(x(names.left)>0&&x(names.right)<W*.51,'Enlarged names never collide with date window');
assert.ok(y(names.top)>H*.9&&y(names.bottom)<H,'No clipped enlarged glyph strokes');
assert.ok(W*.51<526,'Original separator dot remains fully visible');
for(const file of ['camera-story-math.js','handoff-math.js','paper-tail.js','page-media.js'])
 assert.equal(read(file),read('../v10.126-instant-paper/'+file),file+' stays unchanged');

async function main(){
 for(const trigger of ['pointerdown','touchstart','pointer-click','keyboard']){
  const s=await setup(),entry=s.nodes['.cover-enter'],chapter=s.nodes['#our-story'];
  entry.emit('keydown',{key:'Enter'});
  assert.ok(chapter.classes.has('keyboard-landing'));
  if(trigger==='pointerdown'||trigger==='touchstart')entry.emit(trigger);
  entry.emit('click',{detail:trigger==='pointer-click'?1:0,preventDefault(){}});
  s.tick(0);s.tick(3800);
  assert.equal(chapter.classes.has('keyboard-landing'),trigger==='keyboard',trigger);
  assert.ok(chapter.focused,'Accessible landing focus is retained');
  s.tick(10600);checkFinal(s);
 }
 for(const zoom of [1,2]){
  const s=await setup(),scrolls=[],nativeScroll=s.win.scrollTo;
  s.win.scrollX=12;s.win.visualViewport={scale:zoom};
  s.win.scrollTo=p=>{scrolls.push(p);if(p.left!==undefined)s.win.scrollX=p.left;nativeScroll(p)};
  s.click();s.tick(0);s.tick(3800);s.tick(10600);checkFinal(s);
  assert.equal(scrolls.length,1,'No extra vertical jump at completion');
  assert.equal(scrolls[0].left,zoom===1?0:12,'Normal zoom resets X; pinch zoom is preserved');
  assert.equal(scrolls[0].top,914);
 }
 console.log('PASS: isolated paper namespaces, stable containment, pointer/keyboard focus, horizontal cleanup without vertical jump, enlarged original names/date-safe bounds. Not a mobile pixel test.');
}
main().catch(e=>{console.error(e);process.exitCode=1});
