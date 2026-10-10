"""Finish the skill's deterministic composite without touching the photo area."""
from pathlib import Path
import hashlib
import re
import subprocess
import sys

from PIL import Image, ImageChops, ImageOps

ROOT = Path(__file__).resolve().parent
SOURCE = Path('/Users/eleme/Desktop/wedding/087f4a3a79f7b920abff19f11eb716ef.jpg')
WIDTH, HALF = 1536, 1024


def main():
    source_hash = hashlib.sha256(SOURCE.read_bytes()).hexdigest()
    base_path = ROOT / 'drafts/base-diptych.png'
    output = ROOT / 'portrait-087f-omm.png'
    if output.exists():
        raise SystemExit('Final already exists; create a new version instead of overwriting.')

    # Required composition helper from juanshejun-ui/omm-photo-acrylic-diptych.
    subprocess.run([
        sys.executable, str(ROOT / 'scripts/compose_diptych.py'),
        str(SOURCE), str(ROOT / 'drafts/lower-panel.png'), str(base_path),
        '--width', str(WIDTH), '--photo-mode', 'contain', '--background', '#f8f5ef',
    ], check=True)

    with Image.open(SOURCE) as original:
        photo = ImageOps.contain(original.convert('RGB'), (WIDTH, HALF), Image.Resampling.LANCZOS)
    left, top = (WIDTH - photo.width) // 2, (HALF - photo.height) // 2
    box = (left, top, left + photo.width, top + photo.height)

    with Image.open(base_path) as composed:
        poster = composed.convert('RGB')
    assert ImageChops.difference(poster.crop(box), photo).getbbox() is None

    # The skill permits paper-colored portrait letterboxing. Only replace that
    # empty margin with the actual page-two grain; preserve every photo pixel.
    with Image.open(ROOT / 'drafts/page-two-paper.png') as paper:
        paper_top = paper.convert('RGB')
    assert paper_top.size == (WIDTH, HALF)
    paper_top.paste(poster.crop(box), (left, top))
    poster.paste(paper_top, (0, 0))
    poster.save(output, optimize=True)

    assert poster.width * 4 == poster.height * 3
    assert poster.height == HALF * 2
    assert ImageChops.difference(poster.crop(box), photo).getbbox() is None
    assert ImageChops.difference(poster.crop((0, 0, left, HALF)), paper_top.crop((0, 0, left, HALF))).getbbox() is None
    assert source_hash == hashlib.sha256(SOURCE.read_bytes()).hexdigest()

    for width in (960, WIDTH):
        web = poster if width == WIDTH else poster.resize((width, width * 4 // 3), Image.Resampling.LANCZOS)
        web_path = ROOT / f'portrait-087f-omm-{width}.webp'
        web.save(web_path, 'WEBP', quality=92, method=6)
        print(f'Web image: {web_path.name}, {web_path.stat().st_size / 1024:.1f} KiB')

    html = (ROOT / 'index.html').read_text()
    for resource in re.findall(r'src="([^"]+)"', html):
        assert (ROOT / resource).is_file(), resource
    assert '<script' not in html
    assert 'mask-image' not in html and 'filter:' not in html
    assert html.count('<img ') == 1
    print(f'PASS: 3:4 {poster.width}x{poster.height}; 50/50 split at y={HALF}.')
    print(f'PASS: photo at {box}, every PNG pixel equals proportionally scaled source.')
    print(f'PASS: page-two paper margin; original source unchanged ({source_hash}).')


if __name__ == '__main__':
    main()
