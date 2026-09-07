from pathlib import Path
from html.parser import HTMLParser
from PIL import Image
import json

here=Path(__file__).resolve().parent
html=(here/'index.html').read_text()
old=(here.parent/'v10.49-image-cover/index.html').read_text()
start='<article class="chapter classic"'
assert html[html.index(start):].replace('V10.50','V10.49')==old[old.index(start):]
class Check(HTMLParser):
    def handle_starttag(self,tag,pairs):
        attrs=dict(pairs)
        for key in ('src','href','srcset'):
            value=attrs.get(key,'')
            if not value: continue
            refs=[entry.strip().split()[0] for entry in value.split(',')] if key=='srcset' else [value]
            for ref in refs:
                if not ref.startswith(('https:','http:','#','data:')):
                    assert (here/ref).exists(),ref
Check().feed(html)
for asset in json.loads((here/'sizes.json').read_text()):
    file=here/asset['name']
    with Image.open(file) as image:
        assert image.size==(asset['width'],asset['height'])
        assert abs(image.height/image.width-3032/1400)<.002
    assert file.stat().st_size==asset['bytes']
    if file.suffix=='.webp': assert asset['bytes']<400000
assert 'cover-v10.48.png' not in html
assert '@import' not in html
assert '@media(max-width:860px){body{background-image:none}}' in html
print('PASS: all responsive files exist, dimensions/size valid, later pages unchanged')
