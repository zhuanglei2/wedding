const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const css=fs.readFileSync(__dirname+'/lawn-finale.css','utf8');
assert(css.includes('width:min(96%,calc(var(--final-photo-height,480px) * .8 + 16px))'));
assert(css.includes('aspect-ratio:4/5'));assert(css.includes('object-fit:cover'));assert(css.includes('object-position:50% 100%'));
const clean=css.replace(/\/\*[\s\S]*?\*\//g,'');
assert.equal((clean.match(/\{/g)||[]).length,2,'only frame width and inner portrait crop');
assert(!/^\s*(?:transform|filter|position|z-index|padding|height|animation)\s*:/m.test(clean),'no layout-height, tint, reveal or frame changes');
assert.equal((clean.match(/\.story-fixed-page #story-timeline \.wedding-finale/g)||[]).length,2);
const finale=html.match(/<figure class="wedding-finale">[\s\S]*?<\/figure>/)[0];
assert(finale.includes('width="854" height="1280"'));
assert.equal((finale.match(/\.\.\/v10\.150-fixed-story-paper\/media\/wedding-finale\.webp/g)||[]).length,2,'same original for JS and noscript');
assert(html.indexOf(finale)<html.indexOf('<span>Love,</span>'),'correct lawn portrait before Love, always');
assert(fs.existsSync(path.resolve(__dirname,'../v10.150-fixed-story-paper/media/wedding-finale.webp')));

// Analytical cover geometry using the inspected source (854x1280).
// Bottom-aligned 4:5 retains the entire source width and original lower edge.
const sourceWidth=854,sourceHeight=1280,cropHeight=sourceWidth/(4/5),cropTop=sourceHeight-cropHeight;
assert(cropTop>0&&cropTop<220);assert(cropTop<380-120,'at least 120 source pixels above the higher head');
for(const width of [240,280,328,420,640,840])for(const windowHeight of [150,240,330,470,640,800]){
 const imageBudget=Math.max(64,windowHeight-76);
 const oldWidth=Math.min(.96*width,imageBudget*(2/3)+16);
 const newWidth=Math.min(.96*width,imageBudget*.8+16);
 const zoom=(newWidth-16)/(oldWidth-16),imageHeight=(newWidth-16)/.8,totalHeight=imageHeight+28;
 assert(zoom>=1&&zoom<=1.200001,'never smaller, maximum 20% enlargement');
 assert(totalHeight<=windowHeight-48+1e-6,'same safe vertical budget');
 const angle=Math.PI/180,rotatedWidth=newWidth*Math.cos(angle)+totalHeight*Math.sin(angle);
 const rotatedHeight=totalHeight*Math.cos(angle)+newWidth*Math.sin(angle);
 assert(rotatedWidth<=width,'existing 1deg tilt still fits horizontally');
 assert(rotatedHeight<=windowHeight-32,'portrait stays inside existing edge fades');
}
console.log('PASS: correct pre-Love lawn portrait; same source; 4:5 bottom-aligned sky-only crop; up to 20% larger; safe frame geometry for 36 viewport combinations. Analytical, not browser visual QA.');
