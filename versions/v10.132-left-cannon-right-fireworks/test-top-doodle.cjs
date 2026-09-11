const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const read=f=>fs.readFileSync(path.resolve(__dirname,f),'utf8'),html=read('index.html'),css=read('camera-story.css'),layout=JSON.parse(read('celebration-layout.json'));
assert.equal((html.match(/class="paper-top-doodle" aria-hidden="true"/g)||[]).length,2);
for(const part of ['cannon','fireworks'])assert.equal((html.match(new RegExp('class="celebration-'+part+'"','g'))||[]).length,2);
assert.ok(css.startsWith(read('../v10.127-contained-paper/camera-story.css')));
assert.ok(css.includes('.celebration-cannon{left:4%')&&css.includes('.celebration-fireworks{right:3.5%'));
assert.ok(css.includes('html.cover-first .celebration-cannon::before,html.cover-first .celebration-fireworks::before{background-image:none!important}'));
assert.ok(css.includes('background:url("'+layout.source+'") 0 0/100% 100% no-repeat'));
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.resolve(__dirname,layout.source))).digest('hex'),layout.sha256,'Original bitmap byte-for-byte unchanged');
assert.equal(fs.readdirSync(__dirname).filter(n=>/\.(webp|png|jpg)$/.test(n)).length,0,'No new image downloads or duplicate image files');
for(const n of JSON.parse(read('bundle-manifest.json')).filter(n=>!n.startsWith('../')))
 assert.equal(read(n),read('../v10.131-fireworks/'+n),n+' unchanged');
const pct=(n,total)=>(n/total*100).toFixed(8)+'%';
const polygon=p=>'polygon('+p.map(([x,y])=>pct(x,1536)+' '+pct(y,1024)).join(',')+')';
assert.ok(css.includes(polygon([[0,0],...layout.seam,[1536,1024],[0,1024]])));
assert.ok(css.includes(polygon([...layout.seam,[1536,0]])));
for(const part of ['cannon','fireworks']){const [x,y,w,h]=layout[part].frame,[x0,y0,x1,y1]=layout[part].ink;assert.ok(x0>x&&y0>y&&x1<x+w&&y1<y+h);assert.ok(css.includes('width:'+pct(1536,w)+';height:'+pct(1024,h)));}
let count=0;
for(const vw of [320,375,390,430,768,1000,1440])for(let head=0;head<=500;head+=2){
 const w=Math.min(vw,1000),cw=Math.max(Math.min(.17*vw,170),Math.min(.65*head+Math.min(.1*vw,100),Math.min(.25*vw,250))),fw=Math.max(Math.min(.19*vw,190),Math.min(.85*head+Math.min(.08*vw,80),Math.min(.3*vw,300)));
 const cLeft=.04*w,cTop=head*.28+Math.min(.01*vw,10),fLeft=.965*w-fw,fTop=head*.12+Math.min(.005*vw,5);
 const cInkRight=cLeft+(839-70)/790*cw,cBottom=cTop+(960-310)/790*cw,fInkLeft=fLeft+(641-620)/860*fw,fBottom=fTop+(544-40)/860*fw;
 assert.ok(cLeft>=0&&fLeft+fw<=w&&cLeft+cw<fLeft,'Two contained corners, open center');
 assert.ok(cBottom<head+w*90/1024-3||cInkRight<w*.235,'Left decoration clears title');
 assert.ok(fBottom<head+w*90/1024-3||fInkLeft>w*.765,'Right decoration clears title');
 assert.ok(Math.max(cBottom,fBottom)<head+w*210/1024-3,'No red headline overlap');
 assert.ok(fTop<cTop,'Fireworks sit slightly higher');count++;
}
console.log('PASS: '+count+' corner layouts, original shared asset and animation, matching reveal/landing artwork, CSS crop windows, title clearance. Not a browser-pixel test.');
