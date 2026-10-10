const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const sharp = require('/Users/eleme/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');

async function main() {
  const previous = JSON.parse(fs.readFileSync(path.join(__dirname, 'media-manifest-v8.json'), 'utf8'));
  const source = previous.source.path;
  const hash = () => crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex');
  assert.equal(hash(), previous.source.sha256);
  const name = 'media/corridor-hq-2400-v9.webp';
  const dest = path.join(__dirname, name);
  if (!fs.existsSync(dest)) {
    await sharp(source).rotate().resize({ width: 2400, withoutEnlargement: true })
      .webp({ quality: 93, effort: 6, smartSubsample: true }).toFile(dest);
  }
  const meta = await sharp(dest).metadata();
  assert.equal(meta.width, 2400);
  assert.equal(meta.height, 3600);
  assert.equal(hash(), previous.source.sha256);
  const manifest = {
    ...previous,
    exports: [...previous.exports, { name, width: meta.width, height: meta.height, bytes: fs.statSync(dest).size }],
    framing: 'CSS-only 1.24x framing. Source and exports retain complete 2:3 image; no AI processing or photograph filter.'
  };
  fs.writeFileSync(path.join(__dirname, 'media-manifest-v9.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log(JSON.stringify(manifest, null, 2));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
