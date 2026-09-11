const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const here=__dirname,root=path.resolve(here,'../..'),read=f=>fs.readFileSync(path.resolve(here,f),'utf8');
const html=read('index.html'),base=read('../v10.135-song-heading/index.html'),css=read('invitation.css'),js=read('invitation-media.js');
assert.equal(html.slice(html.indexOf('<body>'),html.indexOf('<article class="editorial-invite"')),base.slice(base.indexOf('<body>'),base.indexOf('<article class="chapter garden"')),'First three pages changed');
assert.equal(html.match(/<section class="closing">[\s\S]*?<\/section>/)[0],base.match(/<section class="closing">[\s\S]*?<\/section>/)[0]);
assert(!html.includes('<article class="chapter garden">'));
assert(html.indexOf('id="wedding-invitation"')>html.indexOf('id="celebration"'));
for(const s of ['2026.10.06','2026年10月6日','星期二 · 晚宴','西子国际大酒店','外环东路8号','庄磊 &amp; 吴郁'])assert(html.includes(s),s);
const localFiles=new Set(),parse=(source,dir,isHTML)=>{
 const urls=[...source.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)].map(m=>m[1]);
 if(isHTML)for(const m of source.matchAll(/\b(?:data-media-srcset|imagesrcset|srcset|data-media-src|data-original|data-src|src|href)="([^"]+)"/g))for(const value of m[1].split(','))urls.push(value.trim().split(/\s+/)[0]);
 for(const value of urls){if(!value||/^(?:#|\/\/|[a-z]+:)/i.test(value))continue;const file=path.resolve(dir,decodeURIComponent(value.split(/[?#]/)[0]));assert(file.startsWith(root+'/'),file);assert(fs.existsSync(file),'Missing '+file);if(localFiles.has(file))continue;localFiles.add(file);if(file.endsWith('.css'))parse(fs.readFileSync(file,'utf8'),path.dirname(file),false);}
};parse(html,here,true);
assert(!/\bimport\b|fetch\(|setInterval|requestAnimationFrame/.test(js));
new vm.Script(js);
assert(css.includes('.invite-frame-first{left:8%'));
assert(css.includes('aspect-ratio:2/3'));
assert(!css.includes('background-image'));
const report=JSON.parse(read('asset-report.json'));
for(const src of report.sources)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(src.path)).digest('hex'),src.sha256,'Original overwritten');
const photoBytes=report.outputs.filter(x=>/-800\.webp$/.test(x.path)).reduce((n,x)=>n+x.bytes,0);
assert(photoBytes<260000);assert(fs.statSync(path.join(here,'media/invitation-song.woff2')).size<40000);
assert(report.outputs.find(x=>x.path==='media/banquet.webp').bytes<400000);
async function mediaTest(hasObserver){
 let resolveReady,observer,observed=false,disconnected=false;const events={},classes=new Set();
 const images=[0,1,2].map(i=>{const attrs={'data-media-src':'photo'+i+'.webp','data-media-srcset':'photo'+i+'-480.webp 480w','data-media-sizes':'42vw','data-src':'fallback'+i+'.jpg'},order=[];return{attrs,order,listeners:{},getAttribute:n=>attrs[n],addEventListener(n,fn){this.listeners[n]=fn;},removeAttribute(n){delete attrs[n]},set sizes(v){order.push('sizes')},set srcset(v){order.push('srcset')},set src(v){order.push('src');this.currentSrc=v}}});
 const section={querySelectorAll:()=>images,getBoundingClientRect:()=>({top:0})};
 const IO=class{constructor(cb){observer=cb}observe(s){assert.equal(s,section);observed=true}disconnect(){disconnected=true}};
 const window={WeddingMedia:{ready:new Promise(r=>resolveReady=r)},innerHeight:800,addEventListener:(n,f)=>events[n]=f,removeEventListener:n=>delete events[n]};
 if(hasObserver)window.IntersectionObserver=IO;
 const document={getElementById:()=>section,documentElement:{classList:{add:(...names)=>names.forEach(n=>classes.add(n))}}};
 vm.runInNewContext(js,{window,document,IntersectionObserver:IO});
 assert(images.every(x=>x.order.length===0),'Downloads before cover readiness');
 resolveReady();await Promise.resolve();await Promise.resolve();
 if(hasObserver){assert(observed);observer([{isIntersecting:false}]);assert(images.every(x=>x.order.length===0));observer([{isIntersecting:true}]);assert(disconnected);observer([{isIntersecting:true}]);}
 assert(classes.has('invite-media-ready'));assert(classes.has('later-media-ready'));
 for(const image of images)assert.deepEqual(image.order,['sizes','srcset','src'],'Responsive source order or duplicate activation');
 images[0].listeners.error();assert.equal(images[0].currentSrc,'fallback0.jpg');
}
(async()=>{await mediaTest(true);await mediaTest(false);console.log('PASS: first three pages + closing unchanged; fourth-page content/order; '+localFiles.size+' local references; original hashes; '+photoBytes+'-byte phone photos; subset font; cover-gated near-viewport loading + JPEG/no-observer fallbacks. No browser-pixel or device claim.');})().catch(e=>{console.error(e);process.exit(1)});
