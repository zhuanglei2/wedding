from pathlib import Path
from html.parser import HTMLParser
from PIL import Image, ImageChops
import re

here = Path(__file__).resolve().parent
root = here.parents[1]
html = (here/'index.html').read_text()
old = (root/'versions/v10.45-knot-alignment/index.html').read_text()
start = '<article class="chapter classic"'
assert html[html.index(start):].replace('V10.49','V10.45') == old[old.index(start):]
class References(HTMLParser):
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        for key in ('src','srcset','href'):
            if key in attrs:
                ref = attrs[key]
                if not ref.startswith(('https:','http:','#','data:')):
                    assert (here/ref).exists(),ref
parser=References()
parser.feed(html)
for ref in re.findall(r'url\(["\x27]?(\.\./\.\./assets/[^"\x27)]+)',html):
    assert (here/ref).exists(),ref
original = Image.open(root/'versions/v10.48-address-dinner/invitation-v10.48.png').convert('RGB')
assert original.size == (1400,3032)
for name in ('cover-v10.48.png','cover-v10.48.webp'):
    current = Image.open(here/name).convert('RGB')
    assert ImageChops.difference(original,current).getbbox() is None,name
    print(name,(here/name).stat().st_size,'bytes: pixels match approved proof')
assert '宁波市宁海县跃龙街道外环东路8号' in html
assert '2026年10月6日，晚宴' in html
assert 'user-scalable=no' not in html
assert html.count('<section class="image-cover"')==1
print('PASS: references, approved cover, accessible text, and unchanged later sections')
