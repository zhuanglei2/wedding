const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'motion.js'),'utf8');
function boot({reduced=false,failed=false,legacy=false}={}){
  const classes=new Set(), events={}, imageEvents={}, frames=[];
  let preferenceChange, scroll=0, calls=0;
  const style=()=>{const values=new Map();return {setProperty:(k,v)=>values.set(k,v),removeProperty:k=>values.delete(k),getPropertyValue:k=>values.get(k)||''};};
  const elements=[1000,2000,2900].map(y=>({style:style(),attrs:new Set(),
    setAttribute(k){this.attrs.add(k)},removeAttribute(k){this.attrs.delete(k)},
    getBoundingClientRect(){return {top:y-scroll+(parseFloat(this.style.getPropertyValue('--copy-offset'))||0)}}
  }));
  const image={complete:failed,naturalWidth:failed?0:1400,addEventListener:(k,fn)=>imageEvents[k]=fn};
  const underlay={clientHeight:800,style:style(),querySelector:()=>image};
  const cover={getBoundingClientRect:()=>({bottom:900-scroll})};
  const preference={matches:reduced};
  preference[legacy?'addListener':'addEventListener']=legacy?(fn)=>preferenceChange=fn:(name,fn)=>preferenceChange=fn;
  const window={innerHeight:800,matchMedia:()=>preference,
    requestAnimationFrame:fn=>{frames.push(fn);return ++calls},
    addEventListener:(k,fn,options)=>events[k]={fn,options}};
  const document={documentElement:{classList:{add:k=>classes.add(k),remove:k=>classes.delete(k)}},
    querySelector:s=>s==='.image-cover'?cover:underlay,querySelectorAll:()=>elements};
  vm.runInNewContext(source,{window,document});
  const tick=()=>{while(frames.length)frames.shift()()};
  tick();
  return {classes,elements,underlay,events,imageEvents,frames,tick,
    scrollTo:y=>{scroll=y;events.scroll.fn()},
    reduced:value=>{preference.matches=value;preferenceChange()},
    count:()=>calls};
}
const app=boot();
assert(app.classes.has('paper-motion'));
assert.equal(app.events.scroll.options.passive,true);
assert.equal(app.elements[0].style.getPropertyValue('--copy-opacity'),'0.000');
const initialRequests=app.count();
app.scrollTo(900);app.scrollTo(900);app.scrollTo(900);
assert.equal(app.count(),initialRequests+1,'one frame per burst of scroll events');
app.tick();
assert.equal(app.elements[0].style.getPropertyValue('--copy-opacity'),'1.000');
assert.equal(app.underlay.style.getPropertyValue('--photo-opacity'),'1.000');
app.scrollTo(0);app.tick();
assert.equal(app.elements[0].style.getPropertyValue('--copy-opacity'),'0.000','rewind restores state');
app.scrollTo(520);app.tick();
const first=app.elements[0].style.getPropertyValue('--copy-opacity');
app.scrollTo(520);app.tick();
assert.equal(app.elements[0].style.getPropertyValue('--copy-opacity'),first,'no transform feedback drift');
app.reduced(true);app.tick();
assert(!app.classes.has('paper-motion'));
assert(app.elements.every(e=>!e.attrs.has('data-scroll-reveal')));
assert(app.elements.every(e=>e.style.getPropertyValue('--copy-opacity')===''));
app.reduced(false);app.tick();assert(app.classes.has('paper-motion'));
app.imageEvents.error();assert(!app.classes.has('paper-motion'));
const reduced=boot({reduced:true});assert(!reduced.classes.has('paper-motion'));assert.equal(reduced.count(),0);
const failed=boot({failed:true});assert(!failed.classes.has('paper-motion'));
const legacy=boot({legacy:true});legacy.reduced(true);assert(!legacy.classes.has('paper-motion'));
console.log('PASS: passive scroll, frame coalescing, rewind, stable progress, reduced-motion change, old media-query API, image failure fallback');
