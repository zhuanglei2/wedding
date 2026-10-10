const assert=require('node:assert/strict'),fs=require('node:fs');
const html=fs.readFileSync(__dirname+'/index.html','utf8'),css=fs.readFileSync(__dirname+'/condensed-story.css','utf8');
const prose=html.match(/<div class="timeline-prose condensed-prose">([\s\S]*?)<\/div>/)[1];
const rows=[...prose.matchAll(/<p class="type-block" aria-label="([^"]*)">([\s\S]*?)<\/p>/g)];
assert.deepEqual(rows.map(row=>row[1]),['撸串、螺蛳粉、火锅...','拼乐高、骑公路车、听古风演唱会、爬山徒步…','我们在一起了']);
assert(!/<br\b/.test(prose));assert.equal(rows.length,3);
for(const row of rows)assert.equal([...row[2].matchAll(/<span class="type-glyph" aria-hidden="true">([^<]*)<\/span>/g)].map(g=>g[1]).join(''),row[1],'no character removed, duplicated or shortened');
assert(css.includes('.condensed-prose p{white-space:nowrap}'));
assert(css.includes('.story-phrase{display:inline}'));
assert(css.includes('p:nth-child(2){font-size:min(1em,4.2cqw)}'));
assert(!/text-overflow|overflow\s*:|transform\s*:/.test(css),'do not truncate, hide or squash the letters');
// Conservative width estimate: count every character (including punctuation)
// as one full em, and retain the inherited paragraph letter-spacing and border.
for(const paperWidth of [320,360,375,390,414,430,600,768,1000]){
 const container=paperWidth*.84,base=Math.min(32,Math.max(17,container*.042));
 const available=container*.93-.1*base-1;
 const sizes=[base,Math.min(base,container*.042),base*1.1];
 rows.forEach((row,i)=>{
  const spacing=i===2?.08*sizes[i]:.02*base;
  const estimate=[...row[1]].length*(sizes[i]+spacing);
  assert(estimate<available,`line ${i+1} fits the ${paperWidth}px layout`);
 });
}
console.log('PASS: exactly 3 full sentences/3 nowrap rows; middle line scales to width; conservative fit for 9 phone/desktop widths; no cropping or text changes. Analytical, not browser visual QA.');
