from pathlib import Path
from html.parser import HTMLParser
from PIL import Image
import hashlib, json

here = Path(__file__).resolve().parent
html = (here/'index.html').read_text()
old = (here.parent/'v10.54-photo-right/index.html').read_text()
start = '<article class="chapter classic"'
assert html[html.index(start):].replace('V10.55','V10.54') == old[old.index(start):]
class Check(HTMLParser):
    def handle_starttag(self,tag,pairs):
        for key,value in pairs:
            if key in ('href','src','srcset') and value and not value.startswith(('http:','https:','#','data:')):
                assert (here/value).exists(), value
for name in ('index.html','compare.html'): Check().feed((here/name).read_text())
report=json.loads((here/'sizes.json').read_text())
source=here/report['source']
assert hashlib.sha256(source.read_bytes()).hexdigest() == report['sourceSha256']
assert source.stat().st_size == report['originalBytes']
for asset in report['results']:
    file=here/asset['name']
    assert Image.open(file).size == (1400,3282)
    assert file.stat().st_size == asset['bytes'] < report['originalBytes']*.3
assert '<source srcset="cover.webp" type="image/webp">' in html
assert 'src="cover.jpg"' in html
assert 'src="invitation-v10.54.png"' not in html
print('PASS: full dimensions, smaller delivery assets, unchanged source hash, valid references and unchanged later pages')
