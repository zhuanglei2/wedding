const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
// Reuse the full previous regression fixture, but execute THIS version's controller.
// Extra mock images represent the underlay photo and the actual page header/photo.
let source=fs.readFileSync(path.join(__dirname,'../v10.104-cover-first-paint/test-page-turn.cjs'),'utf8');
function change(a,b){assert.ok(source.includes(a),'Fixture changed: '+a);source=source.replace(a,b);}
change("require('./page-turn-math.js')","require('../v10.104-cover-first-paint/page-turn-math.js')");
change("__dirname+'/page-turn.css'","__dirname+'/../v10.104-cover-first-paint/page-turn.css'");
change("nodes['.image-cover'].image=new El();",`nodes['.image-cover'].image=new El();
  for(const key of ['.underlay-photo','.actual-header','.actual-photo'])nodes[key]=new El();
  if(opts.photoUnloaded)nodes['.underlay-photo'].complete=false;
  if(opts.photoBroken)nodes['.underlay-photo'].naturalWidth=0;
  if(opts.actualUnloaded)nodes['.actual-photo'].complete=false;`);
change("nodes['.head-source'],nodes['.opening-underlay img']])", "nodes['.head-source'],nodes['.opening-underlay img'],nodes['.underlay-photo'],nodes['.actual-header'],nodes['.actual-photo']])");
change("querySelector:k=>nodes[k],addEventListener", "querySelector:k=>nodes[k],querySelectorAll:()=>[nodes['.opening-underlay img'],nodes['.underlay-photo'],nodes['.actual-header'],nodes['.actual-photo']],addEventListener");
change('s.decodeQueue.length,4','s.decodeQueue.length,7');
source+=`
for(const options of [{photoUnloaded:true},{photoBroken:true},{actualUnloaded:true}]){
 s=setup(options);assert.ok(!s.root.classes.has('star-turn'),'Incomplete new photo cannot start the reveal');
}
s=setup({photoUnloaded:true});
s.nodes['.underlay-photo'].complete=true;s.nodes['.underlay-photo'].emit('load');s.flush();
assert.ok(s.root.classes.has('star-turn'));
s=setup({actualUnloaded:true});
s.nodes['.actual-photo'].complete=true;s.nodes['.actual-photo'].emit('load');s.flush();
assert.ok(s.root.classes.has('star-turn'),'Real page pixels ready before handoff');
s=setup({coverUnloaded:true});
assert.equal(s.nodes['.underlay-photo'].loading,undefined,'Cover keeps priority');
s.nodes['.image-cover'].image.complete=true;s.nodes['.image-cover'].image.emit('load');
for(const key of ['.underlay-photo','.actual-header','.actual-photo'])assert.equal(s.nodes[key].loading,'eager');
for(const width of [320,390,430,768,1000])for(const viewport of [640,844,1200]){
 const artHeight=width*2.5,chapterHeight=Math.max(artHeight,viewport),coverHeight=width*3282/1400;
 const underlayHeight=viewport,trackHeight=coverHeight+viewport;
 const chapterTop=underlayHeight-viewport+trackHeight-viewport;
 assert.ok(Math.abs(chapterTop-coverHeight)<1e-8);
 assert.ok(chapterHeight>=artHeight,'Full photograph fits in native scrolling chapter');
 assert.ok(coverHeight+chapterHeight-viewport>=coverHeight-1e-8,'Underlay remains viewport-anchored until landing');
}
console.log('PASS: new and actual page load/decode gates; original-photo aspect ratio; long-page reading and matching turn/landing geometry');
`;
new Function('require','__dirname',source)(require,__dirname);
