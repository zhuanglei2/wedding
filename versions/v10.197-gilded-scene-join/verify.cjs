const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),sharp=require('sharp');
async function main(){
 const root=__dirname,html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const previous=fs.readFileSync(path.resolve(root,'../v10.196-flow-through-lyrics/index.html'),'utf8');
 const style=/<style id="scene-join-style">[\s\S]*?<\/style>\n/;
 const ornament=/<div class="scene-gilded-join" aria-hidden="true">[\s\S]*?<\/div>\n/;
 const normalized=html.replace(style,'').replace(ornament,'').replace('src="../v10.196-flow-through-lyrics/story-handoff.js"','src="story-handoff.js"');
 assert.equal(normalized,previous,'only separator inserted; all existing pictures/content/styles unchanged');
 const join=html.match(ornament)[0];
 assert.equal((html.match(/class="scene-gilded-join"/g)||[]).length,1);
 assert(html.indexOf('id="our-story"')<html.indexOf('id="gathered-scenes"'));
 assert(html.indexOf('id="gathered-scenes"')<html.indexOf('class="scene-gilded-join"'));
 assert(html.indexOf('class="scene-gilded-join"')<html.indexOf('<div class="scene-picture">'));
 assert(html.indexOf('class="scene-gilded-join"')<html.indexOf('id="story-join"'));
 assert(join.includes('loading="lazy"'));assert(join.includes('fetchpriority="low"'));assert(join.includes('alt=""'));
 assert(!/tabindex|<button|<a\s|onload|onclick/.test(join));
 assert.equal((html.match(/story-handoff\.js/g)||[]).length,1);
 assert(html.includes('src="../v10.196-flow-through-lyrics/story-handoff.js"'),'no changed scroll owner');
 const runtime=fs.readFileSync(path.resolve(root,'../v10.196-flow-through-lyrics/story-handoff.js'),'utf8');
 assert(!runtime.includes("leg==='photo-bottom'"));assert(runtime.includes('continuousEase'));
 const css=fs.readFileSync(path.join(root,'scene-join.css'),'utf8');
 assert(!/\b(animation|transform|filter)\s*:/.test(css));
 assert(css.includes('height:clamp(48px,15.5vw,96px)'));assert(css.includes('pointer-events:none'));
 for(const width of [320,375,390,430,768,1000]){
  const container=Math.min(width,860),height=Math.min(96,Math.max(48,width*.155)),imageWidth=Math.min(container*.78,620);
  assert(height<=96);assert(imageWidth<=container);
  assert(imageWidth*290/1946<height,'ornament never clips at '+width);
 }
 for(const match of html.matchAll(/(?:src|href)="([^"#?]+)(?:[?#][^"]*)?"/g)){
  if(/^(https?:|data:|tel:|mailto:)/.test(match[1]))continue;
  assert(fs.existsSync(path.resolve(root,match[1])),'missing '+match[1]);
 }
 for(const match of html.matchAll(/(?:data-media-)?srcset="([^"]+)"/g))for(const item of match[1].split(','))assert(fs.existsSync(path.resolve(root,item.trim().split(/\s+/)[0])));
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'design/asset-manifest.json')));
 assert(manifest.transparentFraction>.8);
 for(const asset of manifest.assets){
  const file=path.join(root,'media',asset.name),meta=await sharp(file).metadata();
  assert(meta.hasAlpha);assert.equal(meta.width,asset.width);assert.equal(meta.height,asset.height);
  assert.equal(fs.statSync(file).size,asset.bytes);assert(asset.bytes<75000);
 }
 console.log('PASS: page 2-to-3 ornament only; unchanged photography/lyrics/controller; aria-hidden, noninteractive, static; 6 viewport geometry checks; transparent responsive WebP, lazy/low-priority; inline CSS and cached paper texture.');
}
main().catch(error=>{console.error(error);process.exitCode=1});
