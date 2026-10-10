const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const read = file => fs.readFileSync(path.resolve(__dirname, file), 'utf8');
const html = read('index.html');
const before = read('../v10.200-garden-sketch-join/index.html');
const expected = before
  .replace('<link rel="stylesheet" href="garden-sketch.css">\n', '')
  .replace(/    <!-- BEGIN garden architecture overlay:[\s\S]*?    <!-- END garden architecture overlay\. -->\n/, '');
assert.equal(html, expected, 'Only the roof overlay and its stylesheet are removed');
assert.equal(html, read('../v10.199-feathered-garden/index.html')
  .replace('href="garden-feather.css"', 'href="../v10.199-feathered-garden/garden-feather.css"'),
  'Original portrait, lettering, feather and controller remain unchanged');
assert(!/garden-eaves|garden-sketch|eaves-edge/.test(html));
assert(html.includes('id="garden-portrait"'));
assert(html.includes('aria-label="时日有序 光景常新 岁月并进 新喜已临"'));
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
    for (const [, resource] of fs.readFileSync(file, 'utf8').matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
      check(resource, path.dirname(file));
    }
  }
  if (file.endsWith('.js')) new vm.Script(fs.readFileSync(file, 'utf8'), { filename: file });
}
for (const [, url] of html.matchAll(/(?:src|href|data-media-src|data-src)="([^"]+)"/g)) check(url);
for (const [, srcset] of html.matchAll(/(?:srcset|imagesrcset|data-media-srcset)="([^"]+)"/g)) {
  for (const item of srcset.split(',')) check(item.trim().split(/\s+/)[0]);
}
for (const [, attrs, script] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
  if (!/src=|type="(?:application\/ld\+json|application\/json)"/.test(attrs)) new vm.Script(script);
}
console.log(`PASS: only roof sketch and irregular edge removed; portrait, red lettering, feather and all other content unchanged; ${count} local references and JavaScript syntax checked.`);
