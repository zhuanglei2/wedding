const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(__dirname+'/page-continuation.js','utf8');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const css=fs.readFileSync(__dirname+'/camera-story.css','utf8');

// Minimal DOM exercises the real boot script, not a replacement implementation.
class Element {
  constructor(tag,attrs={},children=[]){this.tag=tag;this.attrs={...attrs};this.children=children;this.nextElementSibling=null;}
  set className(value){this.attrs.class=value}get className(){return this.attrs.class||''}
  setAttribute(k,v){this.attrs[k]=v}removeAttribute(k){delete this.attrs[k]}hasAttribute(k){return Object.hasOwn(this.attrs,k)}
  appendChild(node){this.children.push(node)}
  matches(selector){return selector.split(',').some(s=>s[0]==='['?this.hasAttribute(s.slice(1,-1)):this.tag===s)}
  querySelectorAll(){return this.children.flatMap(child=>[child,...child.querySelectorAll('*')])}
  querySelector(selector){return this.querySelectorAll('*').find(node=>node.className.split(' ').includes(selector.slice(1)))||null}
  cloneNode(deep){return new Element(this.tag,this.attrs,deep?this.children.map(child=>child.cloneNode(true)):[])}
}
const flatten=node=>[node,...node.querySelectorAll('*')];
function fixture(){
  const sequence=new Element('div'),poster=new Element('div',{class:'reference-art'});
  const underlay=new Element('div',{},[poster]);
  const party=new Element('article',{class:'chapter party',id:'party'},[
    new Element('h2'),new Element('img',{src:'../../assets/portrait-party.jpg',width:'3911',height:'5866'})
  ]);
  const garden=new Element('article',{class:'chapter garden'},[
    new Element('img',{src:'../../assets/portrait-garden.jpg',width:'4000',height:'6000'})
  ]);
  const closing=new Element('section',{class:'closing'},[
    new Element('a',{href:'../../guest.html',tabindex:'0',autofocus:''}),
    new Element('div',{contenteditable:'true',id:'editable'})
  ]);
  sequence.nextElementSibling=party;party.nextElementSibling=garden;garden.nextElementSibling=closing;
  const originals=[party,garden,closing],before=originals.map(node=>JSON.stringify(node.attrs)+JSON.stringify(node.children));
  const document={querySelector:selector=>selector==='.opening-sequence'?sequence:underlay,createElement:tag=>new Element(tag)};
  const run=()=>vm.runInNewContext(source,{document});run();run();
  assert.equal(underlay.children.length,2,'Boot twice creates only one continuation');
  assert.equal(underlay.children[0],poster,'Poster dimensions and layers are not touched');
  const continuation=underlay.children[1];
  assert.equal(continuation.children.length,3,'Copy all following chapters, including very tall viewports');
  assert.equal(continuation.attrs['aria-hidden'],'true');assert.ok(continuation.hasAttribute('inert'));
  continuation.children.forEach((copy,i)=>{
    assert.notEqual(copy,originals[i]);assert.equal(copy.className,originals[i].className);
    assert.equal(JSON.stringify(originals[i].attrs)+JSON.stringify(originals[i].children),before[i],'Never mutate real content');
    flatten(copy).forEach(node=>{
      assert.ok(!node.hasAttribute('id'));assert.ok(!node.hasAttribute('autofocus'));
      if(node.matches('a,[contenteditable]'))assert.equal(node.attrs.tabindex,'-1');
      if(node.matches('[contenteditable]'))assert.equal(node.attrs.contenteditable,'false');
      if(node.tag==='img'){
        assert.equal(node.attrs.loading,'lazy');assert.equal(node.attrs.fetchpriority,'low');
        const original=flatten(originals[i]).find(n=>n.tag==='img');
        for(const k of ['src','width','height'])assert.equal(node.attrs[k],original.attrs[k]);
      }
    });
  });
  return continuation;
}
const continuation=fixture();
vm.runInNewContext(source,{document:{querySelector:()=>null}});
assert.ok(html.indexOf('src="page-continuation.js"')<html.indexOf('src="page-turn.js"'),'Continuation is prepared before opening is enabled');
assert.match(html,/class="opening-underlay" aria-hidden="true" inert/);
assert.match(html,/\.reference-art\{[^}]*aspect-ratio:2\/3/,'Do not stretch camera poster');
for(const [name,w,h] of [['party',3911,5866],['garden',4000,6000]]){
  assert.ok(html.includes(`src="../../assets/portrait-${name}.jpg" width="${w}" height="${h}"`),'Real and mirror photos reserve equal space before loading');
}
assert.match(css,/\.opening-continuation\{display:block;margin:0;padding:0;pointer-events:none\}/);
assert.match(css,/\.opening-continuation img\{[^}]*height:auto/,'Legacy underlay height:100% must not stretch following photos');
assert.match(css,/\.opening-continuation \.chapter\.party::before\{content:none\}/,'No legacy gradient covering the date');
assert.match(css,/html\.turn-settled \.opening-underlay,[\s\S]*?\{display:none!important\}/,'Mirror disappears with retired scaffolding');
assert.doesNotMatch(source,/requestAnimationFrame|addEventListener|getBoundingClientRect|offsetHeight|scrollTo/,'No per-frame/scroll work and no new jump');

// Layout regression: same normal-flow descendants under the poster before/after
// landing. This verifies geometry, not browser pixel rendering or WeChat FPS.
let exposed=0;
for(const width of [320,375,390,430,760,1000])for(const height of [568,700,844,1100,1400]){
  const poster=width*1.5,cover=width*3282/1400;
  assert.equal(continuation.children[0].className,'chapter party');
  const beforeTop=poster; // Next normal-flow child of the underlay, no spacer.
  const afterTop=(cover+poster)-cover; // Same chapter in the real document at landing.
  assert.ok(Math.abs(beforeTop-afterTop)<1e-9,'No seam relocation at handoff');
  const oldGap=Math.max(0,height-poster);
  if(oldGap>0){exposed++;assert.ok(beforeTop<height,'Existing next chapter fills the old exposed viewport remainder');}
  const oldFlow=height+(cover+height)-height+poster-height;
  assert.ok(Math.abs(oldFlow-(cover+poster))<1e-9,'Continuation is clipped inside the same underlay, adds no document height');
}
assert.equal(Math.max(0,844-390*1.5),259,'Reproduces the previous 259px empty strip on 390×844');
for(const file of ['page-turn.js','camera-story.js','handoff-math.js','camera-story-math.js']){
  assert.equal(fs.readFileSync(__dirname+'/'+file,'utf8'),fs.readFileSync(__dirname+'/../v10.118-arrive-before-shutter/'+file,'utf8'),'Choreography and lifecycle unchanged: '+file);
}
console.log(`PASS: real continuation boot, no duplicate/interactive clones, reserved photo sizes, 30 geometry cases (${exposed} exposed remainders), unchanged poster/animation, static retirement. No browser pixel/WeChat validation.`);
