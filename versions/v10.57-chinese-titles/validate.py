from pathlib import Path
from html.parser import HTMLParser
from PIL import Image
import hashlib, re
here=Path(__file__).resolve().parent
old=here.parent/'v10.56-paper-reveal'
html=(here/'index.html').read_text()
old_html=(old/'index.html').read_text()
for name in ('cover.webp','cover.jpg','classic-reveal.webp','classic-reveal.jpg','motion.css','motion.js'):
    assert (here/name).read_bytes()==(old/name).read_bytes(), 'Cover changed'
start='<section class="image-cover"'
end='</section>'
def cover(text):
    begin=text.index(start)
    return text[begin:text.index(end,begin)+len(end)]
assert cover(html)==cover(old_html)
expected=re.sub(r'<p class="label">CHAPTER 0[123] / [^<]+</p>','',old_html)
expected=expected.replace('V10.56','V10.57').replace('<link rel="stylesheet" href="motion.css">','<link rel="stylesheet" href="motion.css">\n<link rel="stylesheet" href="titles.css">')
assert html==expected, 'Unexpected content changes'
assert 'CHAPTER 0' not in html
class Check(HTMLParser):
    def handle_starttag(self,tag,pairs):
        for key,value in pairs:
            if key in ('href','src','srcset') and value and not value.startswith(('http:','https:','#','data:')):
                assert (here/value).exists(),value
Check().feed(html)
for name in ('classic-reveal.webp','classic-reveal.jpg'):
    assert Image.open(here/name).size==(1400,2100)
photo=here.parent.parent/'assets/portrait-classic.jpg'
assert hashlib.sha256(photo.read_bytes()).hexdigest()=='f4956206f785e0a2f141b81f25a476e1cfcfb809e72f5d60076114e91eef0f4a'
css=(here/'motion.css').read_text()
assert '@media (prefers-reduced-motion:no-preference)' in css
assert '.opening-underlay{display:none}' in css
assert 'object-fit:contain' in css
assert 'touch-action:none' not in css and 'scroll-snap' not in css
print('PASS: only three chapter labels removed; images and motion unchanged; all references valid; original photo unchanged')
