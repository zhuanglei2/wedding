const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
async function main() {
  const design = path.join(__dirname, 'design');
  fs.mkdirSync(design, { recursive: true });
  const source = path.join(__dirname, '../v10.193-compact-drawn-paper/design/gathered-scenes-master.png');
  const crop = await sharp(source).extract({ left: 0, top: 0, width: 1200, height: 700 }).png().toBuffer();
  fs.writeFileSync(path.join(design, 'seam-edit-target.png'), crop);
  // These are visual registration guides, never part of the delivered art.
  const guides = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="700">
    <g fill="none" stroke-width="3" stroke-linecap="round" stroke-dasharray="7 5">
      <path stroke="#e32565" d="M101 183L124 502L142 687 M134 184L158 490L170 647 M882 197L875 284L860 653 M856 197L849 278L836 628"/>
      <path stroke="#1475dd" d="M989 165L984 254L964 640 M1062 166L1050 253L1028 640"/>
      <path stroke="#159367" d="M1124 18L1108 238L1080 650 M1164 18L1146 230L1118 650"/>
    </g>
    <g font-family="sans-serif" font-size="16" fill="#442b27" stroke="#fff" stroke-width="4" paint-order="stroke">
      <text x="170" y="90">1. FRAME: same uprights across tear; NO extra bottom border on paper</text>
      <text x="744" y="30">2. COLUMN: center ~1020</text>
      <text x="904" y="690">3. WINDOW: continue real rails</text>
    </g>
  </svg>`);
  await sharp(crop).composite([{ input: guides }]).png().toFile(path.join(design, 'registration-guide.png'));
  console.log('Prepared 1200x700 paper/seam edit; portraits are outside the editable crop.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
