const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),seen=new Set();
const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
function reference(url,base){
  url=url.trim();if(!url||/^(?:#|\/\/|[a-z][\w+.-]*:)/i.test(url))return;
  const file=path.resolve(base,decodeURIComponent(url.split(/[?#]/)[0]));
  assert(file.startsWith(root+path.sep)&&fs.statSync(file).isFile(),file);
  if(seen.has(file))return;seen.add(file);
  if(/\.(?:css|js)$/.test(file)){
    const text=fs.readFileSync(file,'utf8');
    if(file.endsWith('.js'))new vm.Script(text,{filename:file});
    urls(text,path.dirname(file));
  }
}
function urls(text,base){
  for(const m of text.matchAll(/url\(\s*(["']?)(.*?)\1\s*\)/g))reference(m[2],base);
}
for(const m of html.matchAll(/\b(data-media-srcset|imagesrcset|srcset|data-media-src|data-original|data-src|src|href)="([^"]*)"/g)){
  if(m[1].endsWith('srcset'))for(const item of m[2].split(','))reference(item.trim().split(/\s+/)[0],__dirname);
  else reference(m[2],__dirname);
}
urls(html,__dirname);
for(const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
assert.equal(seen.size,84);
assert(seen.has(path.join(__dirname,'media/lakeside-second.png')),'new second image is a permanent project asset');
assert(!seen.has(path.join(root,'versions/v10.155-more-memories/media/lakeside.webp')),'old second image no longer requested');
assert(![...seen].some(file=>/\/(?:memory-03|street-food|kayaking|memory-07|memory-08|birthday-wish|dinner)\.webp$/.test(file)),'removed stack photos are not requested');
assert(seen.has(path.join(__dirname,'lawn-finale.css')));
assert(seen.has(path.join(__dirname,'condensed-story.css')));
assert(seen.has(path.join(__dirname,'polite-greeting.css')));
assert(seen.has(path.join(__dirname,'media/polite-greeting.png')));
assert(![...seen].some(file=>/corridor-hq|lettering-flowing|garden-portrait\.css|garden-feather\.css|garden-paper\.css/.test(file)));
assert(seen.has(path.join(__dirname,'camera-photo-focus.css')));
assert(seen.has(path.join(__dirname,'media/camera-couple.jpg')));
assert(!seen.has(path.join(root,'versions/v10.106-reference-party/couple-original.jpg')));
assert(seen.has(path.join(__dirname,'opening-runtime.js')));
assert(!seen.has(path.join(root,'versions/v10.180-closer-couple/opening-runtime.js')));
assert(seen.has(path.join(__dirname,'media/timeline-handwriting.woff2')));
console.log('PASS: all 84 local dependencies resolve, seven removed photos are not requested, lawn finale styling included, all JavaScript parses. No network or deployment performed.');
