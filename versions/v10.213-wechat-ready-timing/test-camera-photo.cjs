const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const read=file=>fs.readFileSync(path.join(__dirname,file));
const html=read('index.html').toString();
const previous=read('../v10.211-cover-ready-music/index.html').toString();
const blocks=markup=>[...markup.matchAll(/<div class="camera-photo">([\s\S]*?)<\/div>/g)].map(match=>match[1]);
const photos=blocks(html),oldPhotos=blocks(previous);
assert.equal(photos.length,2,'underlay and second-page photo both retained');
for(const block of photos){
  const images=[...block.matchAll(/<img\b[^>]*>/g)].map(match=>match[0]);
  assert.equal(images.length,2,'live image and noscript fallback both retained');
  for(const image of images){
    assert(image.includes('src="media/camera-couple.jpg"'));
    assert(image.includes('data-original="media/camera-couple.jpg"'));
    assert(image.includes('width="853" height="1280"'));
    assert(!image.includes('srcset='),'no obsolete responsive source can override new photo');
    assert(image.includes('loading="lazy" decoding="async" fetchpriority="low"'));
  }
  assert(block.includes('data-media-group="story"'),'same staged decode/paint gate');
}
let restored=html;
photos.forEach((block,index)=>{restored=restored.replace(block,oldPhotos[index]);});
assert.equal(restored,previous,'all markup, CSS, cropping and animation coordinates outside photo blocks unchanged');
for(const file of ['opening-runtime.js','cover-music-ready.js','music-gesture.css','handwriting.js','memory-math.js','media/timeline-handwriting.woff2']){
  assert.deepEqual(read(file),read('../v10.211-cover-ready-music/'+file),file+' unchanged');
}
const bytes=read('media/camera-couple.jpg');
assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),'51545be010524b5a201f5d4515b44cef934391b933c972fe821e5d0f4eda3778','exact supplied JPEG, no generation/recompression');
assert.equal(bytes.readUInt16BE(0),0xffd8);
assert(bytes.length<300000,'use compact source directly, do not upscale');
const runtime=read('opening-runtime.js').toString();
assert(runtime.includes('const source=image.currentSrc||image.src;'));
assert(runtime.includes("copy.src=source;"),'curved print strips use the selected new image');
assert.equal(html,read('../v10.212-new-camera-photo/index.html').toString(),'V10.212 design and music controls unchanged');
console.log('PASS: both camera layers, noscript fallbacks and print-strip source use the new original photo. Frame, animation, controls and remaining pages unchanged.');
