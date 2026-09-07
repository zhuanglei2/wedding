from pathlib import Path
from html.parser import HTMLParser
from PIL import Image, ImageChops, ImageDraw

here = Path(__file__).resolve().parent
html = (here / 'index.html').read_text()
old_html = (here.parent / 'v10.52-full-quality-right/index.html').read_text()
start = '<article class="chapter classic"'
assert html[html.index(start):].replace('V10.53', 'V10.52') == old_html[old_html.index(start):]
assert 'srcset=' not in html
assert 'src="invitation-v10.53.png"' in html
assert 'width="1400" height="3282"' in html
class Check(HTMLParser):
    def handle_starttag(self, tag, pairs):
        for key, value in pairs:
            if key in ('src', 'href') and value and not value.startswith(('http:', 'https:', '#', 'data:')):
                assert (here / value).exists(), value
Check().feed(html)
new = Image.open(here / 'invitation-v10.53.png').convert('RGB')
old = Image.open(here.parent / 'v10.52-full-quality-right/invitation-v10.52.png').convert('RGB')
assert new.size == old.size == (1400, 3282)
diff = ImageChops.difference(new, old)
assert diff.getbbox() is not None
ImageDraw.Draw(diff).rectangle((0, 3130, 1399, 3209), fill=(0, 0, 0))
assert diff.getbbox() is None, 'Pixels outside the sign-off changed'
paper = Image.open(here.parent / 'v10.47-soft-gold-light/background-light.png').convert('RGB').resize((1400, 3032), Image.Resampling.LANCZOS)
assert ImageChops.difference(new.crop((0, 3130, 1400, 3210)), paper.crop((0, 2880, 1400, 2960))).getbbox() is None
print('PASS: sign-off replaced with exact source paper; all other pixels and later pages unchanged; full-resolution PNG and references valid')
