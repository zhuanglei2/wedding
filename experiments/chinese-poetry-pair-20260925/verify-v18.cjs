const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname,file),'utf8');
const html = read('index.html'), old = read('index-staggered-vertical-v17.html');
const base = read('style-v17.css'), css = read('style-v18.css');
assert.equal(html.replace('style-v18.css','style-v17.css'),old,'Only stylesheet reference changes');
assert(css.includes('@import url("style-v17.css")'));
assert(!/\b(?:left|right|top|bottom|transform)\s*:/.test(css),'Coordinates unchanged');
const verses=[...html.matchAll(/class="verse (verse-[a-z]+)" viewBox="([\d ]+)"/g)].map(([,name,box])=>({name,box:box.split(' ').map(Number)}));
assert.equal(verses.length,4);
const percent = (source,name,prop) => Number(source.match(new RegExp(`\\.${name}\\s*\\{([^}]+)\\}`))[1].match(new RegExp(`${prop}:\\s*([\\d.]+)%`))[1])/100;
const commonScale=.076/179;
for(const {name,box} of verses) assert(Math.abs(percent(css,name,'width')/box[2]-commonScale)<1e-10,'Same actual source-pixel scale');
const people={left:.318*1.24-.186,right:.735*1.24-.186,top:.370*1.24-.215};
for(const viewport of [320,375,390,430,600,601,1024,1440]) {
  const w=viewport<=600?viewport:520,h=w*1.5;
  const boxes=verses.map(({name,box})=>{
    const l=percent(base,name,'left')*w,t=percent(base,name,'top')*h,bw=percent(css,name,'width')*w,bh=bw*box[3]/box[2];
    assert(l>3 && t>3 && l+bw+3<w && t+bh+3<h,'Complete strokes and shadow fit');
    assert(l+bw+3<people.left*w || l-3>people.right*w || t+bh+3<people.top*h,'Clear of people');
    return {l,t,r:l+bw,b:t+bh};
  });
  for(const [first,second] of [[boxes[0],boxes[1]],[boxes[2],boxes[3]]]) {
    assert(first.l>second.r+3 && second.t>first.t+5 && second.b>first.b+5,'Keep staggered pairs separated');
  }
  console.log(`PASS ${viewport}px: equal scale, unchanged stagger, no clipping or person overlap`);
}
console.log('PASS: photo, copy, SVG assets and page sizing unchanged. Static verification only.');
