const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('/Users/eleme/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');

async function main() {
  const root = __dirname;
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'style.css'), 'utf8');
  const source = '/Users/eleme/Desktop/wedding/087f4a3a79f7b920abff19f11eb716ef.jpg';
  const original = await sharp(source).metadata();

  assert.equal((html.match(/<img\b/g) || []).length, 1, 'Only one photograph');
  assert.equal((html.match(/<h1\b/g) || []).length, 1, 'One accessible page title');
  assert(!/<script\b|<iframe\b|https?:\/\//.test(html + css), 'No remote requests or scripts');
  assert(html.includes('2026-10-06') && html.includes('庄磊') && html.includes('吴郁'));
  assert.match(css, /img\s*\{\s*height:\s*auto;/, 'Full photograph at natural aspect ratio');
  assert(!/object-fit:\s*cover|filter\s*:|mask-image\s*:/.test(css), 'No photo crop, tint or feather');

  for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    assert(fs.existsSync(path.resolve(root, match[1])), `Missing resource: ${match[1]}`);
  }
  for (const match of html.matchAll(/srcset="([^"]+)"/g)) {
    for (const candidate of match[1].split(',')) {
      assert(fs.existsSync(path.resolve(root, candidate.trim().split(/\s+/)[0])));
    }
  }

  const paperMatch = css.match(/background:\s*url\("([^"]+)"\) center bottom \/ 100% auto no-repeat/);
  assert(paperMatch, 'Exact page-two paper scale and alignment');
  const paperPath = path.resolve(root, paperMatch[1]);
  assert(paperPath.endsWith('/versions/v10.125-keepsake-fast/media/camera-clean.webp'));
  const paper = await sharp(paperPath).metadata();
  assert.equal(paper.width, 1024);
  assert.equal(paper.height, 1536);
  assert.match(css, /aspect-ratio:\s*8\s*\/\s*3/);
  assert.equal((html.match(/<i><\/i>/g) || []).length, 16, 'Enough paper strips for content resizing');
  assert.match(css, /nth-child\(even\).*scaleY\(-1\)/);
  console.log('PASS: page-two paper uses only original blank rows 1152–1535, at matching width scale.');

  let webpBytes = 0;
  for (const width of [960, 1600]) {
    const file = path.join(root, 'media', `portrait-${width}.webp`);
    const actual = fs.readFileSync(file);
    const metadata = await sharp(file).metadata();
    const expected = await sharp(source).rotate().resize({ width, withoutEnlargement: true })
      .webp({ quality: 88, effort: 6 }).toBuffer();
    assert(actual.equals(expected), 'Image equals original resized/encoded, without edits');
    assert.equal(metadata.width, width);
    assert(Math.abs(metadata.height - original.height * width / original.width) <= 1);
    assert(!metadata.exif && !metadata.xmp, 'Web asset omits personal metadata');
    assert(actual.length < 600000, 'Photo should stay lightweight');
    webpBytes += actual.length;
    console.log(`PASS: ${width}px original composition, ${(actual.length / 1024).toFixed(1)} KiB.`);
  }
  assert(webpBytes < 800000);
  console.log('PASS: one full uncropped photograph, names/date, local references and responsive image candidates.');
  console.log('Browser layout/visual inspection is not covered by this static check.');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
