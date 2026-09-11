const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(__dirname+'/paper-tail.js','utf8');
const read=(dir,file)=>fs.readFileSync(path.join(dir,file),'utf8');
const prior=path.resolve(__dirname,'../v10.121-offset-caption');
const css=read(__dirname,'camera-story.css'),html=read(__dirname,'index.html');
const clean=t=>t.replace(/<style id="camera-runtime-style">[\s\S]*?<\/style>/,'').replace(/<script src="paper-tail.js" defer><\/script>\n/,'').replace(/V10\.12[12]/g,'VERSION');
assert.equal(clean(html),clean(read(prior,'index.html')),'Markup unchanged except version, paint-only stylesheet and tail helper');
for(const name of ['page-media.js','page-turn.js','camera-story.js','camera-story-math.js','handoff-math.js']){
 assert.equal(read(__dirname,name),read(prior,name),name+' remains byte-identical');
}
const rules=css=>css.match(/\.camera-caption,.camera-names\{[\s\S]*?\.camera-names\{[^}]+\}/)[0];
assert.equal(rules(css),rules(read(prior,'camera-story.css')),'Names/date and bilingual caption unchanged');
assert.equal(html.match(/<style id="camera-runtime-style">([\s\S]*?)<\/style>/)[1].trim(),css.trim());
assert.match(css,/html\.cover-first \.paper-page::after\{background-image:none!important\}/);
assert.doesNotMatch(css,/\.reference-art::after\{bottom:0;background:linear-gradient\(transparent,#f8f5ef\)/,'No fading the bottom edge into solid white');
assert.match(css,/\.paper-page\.paper-tail-ready::after\{\s*content:"";position:absolute/);
function setup(w,h,withObserver=true){
 const events={},frames=[],observers=[],values={},classes=new Set();
 const art={offsetWidth:w,offsetHeight:w*1.5,offsetTop:Math.max(0,(h-w*1.5)/2)};
 const page={clientHeight:Math.max(h,art.offsetHeight),querySelector:()=>art,style:{setProperty:(k,v)=>values[k]=v},classList:{add:v=>classes.add(v)}};
 const win={requestAnimationFrame:fn=>frames.push(fn),addEventListener:(event,fn)=>events[event]=fn};
 if(withObserver)win.ResizeObserver=class{constructor(fn){this.fn=fn;observers.push(this)}observe(){}};
 const doc={querySelectorAll:()=>[page],addEventListener:win.addEventListener};
 vm.runInNewContext(source,{window:win,document:doc,setTimeout:fn=>frames.push(fn)});
 return{page,art,values,classes,events,frames,observers};
}
for(const w of [320,375,390,430,768,1000])for(const h of [568,700,844,1100,1600]){
 const s=setup(w,h),gap=Math.max(0,s.page.clientHeight-s.art.offsetTop-s.art.offsetHeight);
 const tail=parseFloat(s.values['--paper-tail-height']),blend=parseFloat(s.values['--paper-tail-blend']),sourceHeight=parseFloat(s.values['--paper-tail-source-height']);
 assert.equal(tail,gap+blend,'Paint reaches exact bottom of the existing paper page');
 assert.ok(blend<=s.art.offsetHeight*.02+1e-9,'Blend remains below the existing date glyphs');
 assert.ok(1536*(1-tail/sourceHeight)>=1152-1e-9,'Sample only verified blank lower quarter, never camera, text or photograph');
 assert.ok(sourceHeight*2/3>=w-1e-9,'No uncovered horizontal edge');
 assert.ok(s.classes.has('paper-tail-ready'));
 assert.equal(s.page.clientHeight,Math.max(h,w*1.5),'No shorter page and no premature third chapter');
 s.events.resize();s.events.resize();assert.equal(s.frames.length,1,'Coalesce repeated resize');
 s.frames.shift()();assert.equal(s.frames.length,0,'No continuous frame loop');
}
const hidden=setup(0,0);assert.ok(!hidden.classes.has('paper-tail-ready'));
hidden.art.offsetWidth=390;hidden.art.offsetHeight=585;hidden.art.offsetTop=129.5;hidden.page.clientHeight=844;
hidden.events['camera-assets-ready']();hidden.frames.shift()();assert.ok(hidden.classes.has('paper-tail-ready'),'Hidden underlay can activate later');
const fallback=setup(390,844,false);fallback.page.clientHeight=900;fallback.art.offsetTop=157.5;fallback.events.resize();fallback.frames.shift()();
assert.equal(parseFloat(fallback.values['--paper-tail-height']),157.5+11.7);
console.log('PASS: 30 tail geometries, source sampling safety, unchanged page/content/motion, hidden underlay, batched resize and old-browser fallback. No browser visual claim.');
