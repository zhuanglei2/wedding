from pathlib import Path
from html.parser import HTMLParser
from PIL import Image, ImageChops, ImageDraw

here = Path(__file__).resolve().parent
html = (here / 'index.html').read_text()
old_html = (here.parent / 'v10.51-couple-crop/index.html').read_text()
start = '<article class="chapter classic"'
assert html[html.index(start):].replace('V10.52', 'V10.51') == old_html[old_html.index(start):]
assert 'srcset=' not in html
assert 'src="invitation-v10.52.png"' in html
assert 'width="1400" height="3282"' in html
class Check(HTMLParser):
    def handle_starttag(self, tag, pairs):
        for key, value in pairs:
            if key in ('src', 'href') and value and not value.startswith(('http:', 'https:', '#', 'data:')):
                assert (here / value).exists(), value
Check().feed(html)
new = Image.open(here / 'invitation-v10.52.png').convert('RGB')
old = Image.open(here.parent / 'v10.51-couple-crop/invitation-v10.51.png').convert('RGB')
assert new.size == old.size == (1400, 3282)
diff = ImageChops.difference(new, old)
ImageDraw.Draw(diff).rectangle((264, 1344, 1135, 2174), fill=(0, 0, 0))
assert diff.getbbox() is None, 'Pixels outside the photograph changed'
print('PASS: full-resolution PNG; only photo region changed; references valid; later pages unchanged')
