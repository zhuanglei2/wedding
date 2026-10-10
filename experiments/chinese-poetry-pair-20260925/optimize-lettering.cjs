const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const sharp = require('/Users/eleme/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');

async function main() {
  const source = path.join(__dirname, 'media/poem-lettering-v1.png');
  const output = path.join(__dirname, 'media/poem-lettering-v1.webp');
  if (!fs.existsSync(output)) await sharp(source).webp({ lossless: true, effort: 6 }).toFile(output);
  const before = await sharp(source).ensureAlpha().raw().toBuffer();
  const after = await sharp(output).ensureAlpha().raw().toBuffer();
  assert.equal(before.length, after.length);
  for (let i = 0; i < before.length; i += 4) {
    assert.equal(after[i + 3], before[i + 3], 'Alpha must be preserved');
    if (before[i + 3]) for (let c = 0; c < 3; c++) {
      assert.equal(after[i + c], before[i + c], 'Visible stroke pixels must be lossless');
    }
  }
  console.log(JSON.stringify({ pngBytes: fs.statSync(source).size, webpBytes: fs.statSync(output).size, visiblePixels: 'identical', alpha: 'identical' }));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
