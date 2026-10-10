from pathlib import Path
from PIL import Image, ImageChops, ImageOps
import json

root = Path(__file__).resolve().parent
source = Path('/Users/eleme/Desktop/wedding/8213f57f1s0341e9620ea034ee695ed6.jpg')
photo = Image.open(source).convert('RGB')
poster = Image.open(root / 'wedding-omm-diptych.png').convert('RGB')
web = Image.open(root / 'wedding-omm-diptych.webp').convert('RGB')
assert poster.size == (1179, 1572)
assert poster.width * 4 == poster.height * 3
half = poster.height // 2
assert photo.size == (poster.width, half)
assert ImageChops.difference(poster.crop((0, 0, poster.width, half)), photo).getbbox() is None
assert web.size == poster.size
assert ImageChops.difference(web, poster).getbbox() is None
art = Image.open(root / 'drafts/lower-panel.png').convert('RGB')
expected_lower = ImageOps.fit(art, (poster.width, half), Image.Resampling.LANCZOS, centering=(.5, .5))
assert ImageChops.difference(poster.crop((0, half, poster.width, poster.height)), expected_lower).getbbox() is None
html = (root / 'index.html').read_text()
assert 'width="1179" height="1572"' in html
assert 'object-fit: cover' not in html and '<script' not in html
assert 'top: 47.2%' in html and 'height: 2.8%' in html
assert abs(poster.height * (.472 + .028) - half) < .00001
assert poster.height * .472 > 741
assert 'class="photo-feather" aria-hidden="true"' in html
assert 'mask-image: linear-gradient(to bottom' in html
assert 'filter: blur' not in html
print(json.dumps({
    'status': 'PASS', 'canvas': poster.size, 'splitRow': half,
    'photoRGBPixelDifferences': 0, 'webpRGBPixelDifferences': 0,
    'photoScaled': False, 'photoCropped': False,
    'webFeatherRows': [round(poster.height * .472), half],
    'pngBytes': (root / 'wedding-omm-diptych.png').stat().st_size,
    'losslessWebpBytes': (root / 'wedding-omm-diptych.webp').stat().st_size,
}, ensure_ascii=False))
