from pathlib import Path
from html.parser import HTMLParser
from PIL import Image
import hashlib, re
here=Path(__file__).resolve().parent
old=here.parent/'v10.57-chinese-titles'
html=(here/'index.html').read_text()
old_html=(old/'index.html').read_text()
for name in ('cover.webp','cover.jpg','classic-reveal.webp','classic-reveal.jpg','motion.css','motion.js','titles.css'):
    assert (here/name).read_bytes()==(old/name).read_bytes(), name+' changed'
def main(text):
    return text.split('<main>',1)[1].split('</main>',1)[0]
assert main(html)==main(old_html), 'Existing invitation markup changed'
assert '<title>庄磊 & 吴郁 · 婚礼请柬 · V10.58</title>' in html
assert 'CHAPTER 0' not in html
class Check(HTMLParser):
    def handle_starttag(self,tag,pairs):
        for key,value in pairs:
            if key in ('href','src','srcset') and value and not value.startswith(('http:','https:','#','data:')):
                assert (here/value).exists(),value
Check().feed(html)
for css_path in ('intro.css','motion.css','titles.css'):
    for ref in re.findall(r'url\(["\']?([^"\')]+)',(here/css_path).read_text()):
        assert (here/ref).exists(),ref
assert Image.open(here/'star-opening.webp').size==(1254,1254)
assert Image.open(here/'star-opening-original.png').size==(1254,1254)
for file,digest in {
    'portrait-studio.jpg':'3dcfd0bcfdb4952ebf869ec1bd6723a7823b0daee0e0d7408e2531a950cc659c',
    'portrait-classic.jpg':'f4956206f785e0a2f141b81f25a476e1cfcfb809e72f5d60076114e91eef0f4a'
}.items():
    assert hashlib.sha256((here.parent.parent/'assets'/file).read_bytes()).hexdigest()==digest
css=(here/'intro.css').read_text()
assert '.star-intro:not([open]){display:none}' in css
assert '@media(prefers-reduced-motion:reduce)' in css
assert '@media print' in css
print('PASS: original photos, full invitation markup, cover and scroll transition unchanged; resources valid; version and image dimensions correct')
