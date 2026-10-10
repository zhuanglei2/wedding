const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const sharp = require('/Users/eleme/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');

const root = __dirname;
const photo = '/Users/eleme/Desktop/wedding/aa0dca4cbs40cbfcf2373b2a2e855dd0.jpg';
const lettering = path.join(root, 'media/poem-lettering-ivory-v2.png');
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

async function main() {
  const meta = await sharp(photo).metadata();
  assert.equal(meta.width, 3918);
  assert.equal(meta.height, 5877);
  const originalHash = hash(photo);
  const exports = [];
  for (const width of [900, 1350, 1800]) {
    const name = `media/corridor-hq-${width}-v8.webp`;
    const dest = path.join(root, name);
    if (!fs.existsSync(dest)) await sharp(photo).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 93, effort: 6, smartSubsample: true }).toFile(dest);
    const output = await sharp(dest).metadata();
    assert.equal(output.width, width);
    assert.equal(output.height, width * 1.5);
    exports.push({ name, width: output.width, height: output.height, bytes: fs.statSync(dest).size });
  }
  const letteringName = 'media/poem-lettering-ivory-v2.webp';
  const letteringOutput = path.join(root, letteringName);
  if (!fs.existsSync(letteringOutput)) await sharp(lettering).webp({ lossless: true, effort: 6 }).toFile(letteringOutput);
  const before = await sharp(lettering).ensureAlpha().raw().toBuffer();
  const after = await sharp(letteringOutput).ensureAlpha().raw().toBuffer();
  assert.equal(before.length, after.length);
  for (let i = 0; i < before.length; i += 4) {
    assert.equal(before[i + 3], after[i + 3]);
    if (before[i + 3]) for (let c = 0; c < 3; c++) assert.equal(before[i + c], after[i + c]);
  }
  assert.equal(hash(photo), originalHash, 'Original photo is not modified');
  const manifest = {
    source: { path: photo, width: meta.width, height: meta.height, sha256: originalHash },
    processing: 'Auto-orient, proportional downscale, WebP quality 93. No crop, retouching, sharpening, grading or AI processing.',
    exports,
    lettering: { file: letteringName, bytes: fs.statSync(letteringOutput).size, visiblePixelsAndAlpha: 'lossless' }
  };
  fs.writeFileSync(path.join(root, 'media-manifest-v8.json'), JSON.stringify(manifest, null, 2) + '\n');
  // QA background composition only; neither source photo nor lettering is edited.
  await sharp(lettering).flatten({ background: '#151a17' }).resize({ width: 600 }).png().toFile('/private/tmp/wedding-ivory-lettering-v8-preview.png');
  console.log(JSON.stringify(manifest, null, 2));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
