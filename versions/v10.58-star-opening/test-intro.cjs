const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync(__dirname + '/intro.js', 'utf8');
function setup(options = {}) {
  const animations = [], timers = new Map();
  let timerId = 0;
  class Element {
    constructor() { this.listeners = {}; this.classes = new Set(); this.classList = {add: n => this.classes.add(n), remove: n => this.classes.delete(n)}; }
    addEventListener(name, fn) { (this.listeners[name] ||= []).push(fn); }
    emit(name, event = {}) { (this.listeners[name] || []).forEach(fn => fn(event)); }
    focus() { this.focused = true; }
    setAttribute(key, value) { this[key] = value; }
    animate(frames, timing) {
      if (options.throws) throw Error('Unavailable animation');
      let resolve, reject;
      const finished = new Promise((a,b) => {resolve=a; reject=b;});
      const result = {frames,timing,finished,resolve,cancel() { this.cancelled=true; reject(Error('Cancelled')); }};
      animations.push(result);
      return result;
    }
  }
  const nodes = {};
  for (const name of ['.star-intro','.image-cover','.star-open','.star-touch','.star-left','.star-right','.star-heading','.star-actions','.star-backdrop','.star-skip']) nodes[name] = new Element();
  const dialog = nodes['.star-intro'];
  const images = [new Element(),new Element()];
  images.forEach(img => { img.complete = !!options.broken; img.naturalWidth=options.broken?0:1254; });
  dialog.querySelector = name => nodes[name];
  dialog.querySelectorAll = () => images;
  dialog.showModal = () => { dialog.open=true; };
  dialog.close = () => { dialog.open=false; dialog.emit('close'); };
  if(options.unsupported) dialog.showModal=undefined;
  if(options.noAnimate) nodes['.star-left'].animate=undefined;
  const root = new Element();
  const reduce = new Element(); reduce.matches=!!options.reduce;
  const window = {location:{hash:options.hash||''},scrollY:options.scrollY||0,matchMedia:()=>reduce,dispatchEvent:()=>{}};
  const context = {document:{querySelector:n=>nodes[n],documentElement:root},window,Event:class {},setTimeout:fn=>{timers.set(++timerId,fn);return timerId;},clearTimeout:id=>timers.delete(id)};
  vm.runInNewContext(source,context);
  return {nodes,dialog,root,images,reduce,animations,timers,click:n=>nodes[n].emit('click')};
}
const tick = () => new Promise(resolve => setImmediate(resolve));
const closed = s => {assert.ok(!s.dialog.open);assert.ok(!s.root.classes.has('intro-active'));};
(async()=>{
  let s=setup(); assert.ok(s.dialog.open);assert.ok(s.nodes['.star-open'].focused);
  s.click('.star-open');assert.equal(s.animations.length,5);
  s.click('.star-touch');assert.equal(s.animations.length,5,'Double taps ignored');
  s.animations.forEach(a=>{assert.equal(a.timing.iterations,1);assert.ok(a.timing.duration<=2000);a.resolve();});
  await tick();closed(s);assert.ok(s.nodes['.image-cover'].focused);assert.equal(s.timers.size,0);
  s=setup();s.click('.star-skip');closed(s);
  s=setup();let prevented=false;s.dialog.emit('cancel',{preventDefault(){prevented=true;}});closed(s);assert.ok(prevented);
  s=setup();s.click('.star-touch');s.click('.star-skip');await tick();closed(s);assert.ok(s.animations.every(a=>a.cancelled));
  s=setup({reduce:true});s.click('.star-open');closed(s);assert.equal(s.animations.length,0);
  s=setup();s.click('.star-open');s.reduce.matches=true;s.reduce.emit('change');await tick();closed(s);
  s=setup();s.images[0].emit('error');closed(s);
  for(const options of [{broken:true},{unsupported:true},{hash:'#photos'},{scrollY:500}]) closed(setup(options));
  s=setup({noAnimate:true});s.click('.star-open');closed(s);
  s=setup({throws:true});s.click('.star-open');closed(s);
  s=setup();s.click('.star-open');[...s.timers.values()][0]();await tick();closed(s);
  console.log('PASS: opening, double-tap, skip, Escape, reduced motion, image failure, API fallback, deep links, timeout, focus and scroll unlock');
})().catch(error=>{console.error(error);process.exitCode=1;});
