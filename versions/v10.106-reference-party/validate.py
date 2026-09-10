from pathlib import Path
from html.parser import HTMLParser
import hashlib
import re
from PIL import Image

here=Path(__file__).resolve().parent
old=(here.parent/'v10.104-cover-first-paint/index.html').read_text()
html=(here/'index.html').read_text()
preview=(here/'preview.html').read_text()
assert 'V10.106' in html and '庄磊 & 吴郁' in html and '2026.10.06' in html
assert 'classic-reveal.' not in html and 'story-heading' not in html
assert hashlib.sha256((here/'couple-original.jpg').read_bytes()).hexdigest()=='39e6248100d2e1b8eb3ca2cc39af61c0799f76d3211192e31fb3efa7a072040a'
for name,size in [('party-header.png',(1254,1254)),('couple-original.jpg',(4000,6000))]:
    with Image.open(here/name) as im: assert im.size==size
normalized=html.replace('../v10.104-cover-first-paint/','').replace('V10.106','V10.104')
block=re.search(r'<style id="reference-party-style">([\s\S]*?)</style>\n',normalized)
assert block and block[1].count('{')==block[1].count('}')
assert block[1].strip() in preview
normalized=normalized.replace(block[0],'')
pattern=r'<article class="chapter classic[^\"]*"[\s\S]*?</article>'
normalized=re.sub(pattern,re.search(pattern,old)[0],normalized)
pattern=r'<div class="opening-underlay"[\s\S]*?(?=<div class="turn-track">)'
normalized=re.sub(pattern,re.search(pattern,old)[0],normalized)
assert normalized.strip()==old.strip(),'Unrelated cover/chapter/script change'
art=re.findall(r'<div class="reference-art">([\s\S]*?)\n</div>',html)
assert len(art)==2
assert re.sub(r'alt="[^"]*"','alt=""',art[0])==re.sub(r'alt="[^"]*"','alt=""',art[1]),'Turn preview and real page diverge'
class Check(HTMLParser):
    count=0
    def handle_starttag(self,tag,pairs):
        for k,v in pairs:
            if k in ('href','src','srcset','data-src') and v and not v.startswith(('http:','https:','#','data:')):
                assert (here/v).is_file(),v
                self.count+=1
check=Check();check.feed(html);check.feed(preview)
print('PASS: original 4000x6000 photo SHA256 unchanged; generated header dimensions; identical underlay/page art; cover and later chapters unchanged; %d local refs'%check.count)
