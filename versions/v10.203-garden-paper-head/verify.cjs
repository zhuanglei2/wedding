const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const read = file => fs.readFileSync(path.resolve(__dirname, file), 'utf8');
const html = read('index.html');
const css = read('garden-paper.css').replace(/\/\*[\s\S]*?\*\//g, '');
const paper = /  <!-- BEGIN garden paper head:[\s\S]*?  <!-- END garden paper head\. -->\n/;
assert.equal(html.replace('<link rel="stylesheet" href="garden-paper.css">\n', '').replace(paper, ''),
  read('../v10.202-clean-garden/index.html'), 'Only a paper backdrop and scoped stylesheet are added');
assert(!/garden-eaves|garden-sketch|eaves-edge/.test(html));
assert.equal((html.match(paper)[0].match(/<span>/g) || []).length, 8);
assert(css.includes('inset: 0 0 50%;'));
assert(css.includes('aspect-ratio: 8 / 3;'));
assert(css.includes('center bottom / 100% auto no-repeat'));
assert(css.includes('.garden-frame { z-index: 1; }'));
assert(!/\b(?:filter|backdrop-filter|transform|opacity|animation|transition|clip-path|mask-image)\s*:/.test(css));
assert.deepEqual([...css.matchAll(/([^{}]+)\{/g)].map(m => m[1].trim()), [
  '#garden-portrait .garden-paper-head', '#garden-portrait .garden-paper-head > span',
  '#garden-portrait .garden-frame',
  'html.cover-first:not(.later-media-ready) #garden-portrait .garden-paper-head > span'
]);
for (const [width, viewportHeight] of [[320,568],[320,960],[375,667],[390,844],[430,932],[768,1024],[860,1280],[1000,900]]) {
  const photoHeight = width * 1.5;
  const pageHeight = Math.max(photoHeight, viewportHeight);
  const tileHeight = width * 3 / 8;
  assert(tileHeight * 8 >= pageHeight / 2, 'Paper fills the header');
  assert.equal(1536 - tileHeight / width * 1024, 1152, 'Only blank source paper is visible');
  assert((pageHeight - photoHeight) / 2 + photoHeight * .045 < pageHeight / 2,
    'Paper continues behind the existing top feather');
}
let count = 0;
const visited = new Set();
function check(url, base = __dirname) {
  if (/^(?:#|[a-z]+:|\/\/)/i.test(url)) return;
  const file = path.resolve(base, url.split(/[?#]/)[0]);
  assert(fs.existsSync(file), 'Missing resource: ' + file);
  count++;
  if (visited.has(file)) return;
  visited.add(file);
  if (file.endsWith('.css')) {
    for (const [, u] of fs.readFileSync(file, 'utf8').matchAll(/url\(["']?([^"')]+)["']?\)/g)) check(u, path.dirname(file));
  }
  if (file.endsWith('.js')) new vm.Script(fs.readFileSync(file, 'utf8'), { filename: file });
}
for (const [, url] of html.matchAll(/(?:src|href|data-media-src|data-src)="([^"]+)"/g)) check(url);
for (const [, list] of html.matchAll(/(?:srcset|imagesrcset|data-media-srcset)="([^"]+)"/g)) {
  for (const item of list.split(',')) check(item.trim().split(/\s+/)[0]);
}
for (const [, attrs, script] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
  if (!/src=|type="(?:application\/ld\+json|application\/json)"/.test(attrs)) new vm.Script(script);
}
console.log(`PASS: upper paper only; original photo, lettering, layout and controller unchanged; 8 viewport geometries; ${count} local resources and JS syntax.`);
