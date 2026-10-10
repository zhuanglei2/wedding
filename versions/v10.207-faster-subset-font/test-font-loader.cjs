const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'handwriting.js'),'utf8');
const original=fs.readFileSync(path.join(__dirname,'../v10.159-flow-and-gilt/handwriting.js'),'utf8');
assert.equal(source.replace(/^\/\*.*?\*\//,'').replace('media/timeline-handwriting.woff2','../../assets/ma-shan-zheng-v10.6.ttf'),original.replace(/^\/\*.*?\*\//,''),'only font asset and comment change');
const frames=[],events=[],added=[],faces=[];
let completeMedia;
const window={WeddingMedia:{ready:new Promise(resolve=>completeMedia=resolve)}};
const document={querySelector:s=>s==='#celebration'?{}:null,fonts:{add:font=>added.push(font)},dispatchEvent:event=>events.push(event.type)};
class FontFace {constructor(family,url,options){Object.assign(this,{family,url,options});faces.push(this)}load(){return Promise.resolve(this)}}
window.FontFace=FontFace;
class IntersectionObserver {constructor(callback,options){this.callback=callback;this.options=options;frames.push(this)}observe(target){this.target=target}disconnect(){this.disconnected=true}}
window.IntersectionObserver=IntersectionObserver;
(async()=>{
 vm.runInNewContext(source,{window,document,FontFace,IntersectionObserver,Event:class{constructor(type){this.type=type}}});
 assert.equal(faces.length,0);assert.equal(frames.length,0,'wait for cover media readiness');
 completeMedia();await Promise.resolve();assert.equal(frames.length,1);
 assert.equal(frames[0].options.rootMargin,'180px 0px');
 frames[0].callback([{isIntersecting:false}]);assert.equal(faces.length,0);
 frames[0].callback([{isIntersecting:true}]);await Promise.resolve();
 assert.equal(faces.length,1);assert.equal(faces[0].family,'AboutHand');
 assert.equal(faces[0].url,'url("media/timeline-handwriting.woff2")');
 assert.equal(JSON.stringify(faces[0].options),JSON.stringify({weight:'400',style:'normal',display:'swap'}));
 assert.deepEqual(added,faces);assert.deepEqual(events,['story-handwriting-ready']);
 frames[0].callback([{isIntersecting:true}]);assert.equal(faces.length,1,'one font request');
 assert(frames[0].disconnected);
 console.log('PASS: same AboutHand descriptor; deferred WOFF2 load; one request; existing timeline reflow notification preserved.');
})().catch(error=>{console.error(error);process.exitCode=1});
