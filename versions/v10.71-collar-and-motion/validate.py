from pathlib import Path
from html.parser import HTMLParser
from PIL import Image
import hashlib
here=Path(__file__).resolve().parent
old=here.parent/'v10.70-living-characters'
html=(here/'index.html').read_text()
old_html=(old/'index.html').read_text()
for name in ('cover.webp','cover.jpg','classic-reveal.webp','classic-reveal.jpg','titles.css','star-couple.png','star-couple-reference.jpg','rig-atlas.png','rig-atlas-original.png','star-trail.js'):
    assert (here/name).read_bytes()==(old/name).read_bytes(),name+' changed'
def cover(text):
    start=text.index('<section class="image-cover"')
    return text[start:text.index('</section>',start)+len('</section>')]
entry='<a class="cover-enter" href="#our-story" aria-label="打开请柬，进入下一页"></a>\n'
cue='<a class="turn-cue" href="#our-story">翻开我们的故事 <span aria-hidden="true">↑</span></a>\n'
assert html.count(entry)==1
assert 'turn-cue' not in html and '翻开我们的故事' not in html
assert cover(html)==cover(old_html),'First invitation changed'
assert '<dialog' not in html and 'intro.js' not in html
assert 'V10.71' in html
surface='<div class="paper-slices" aria-hidden="true"></div>\n'
head='<img class="head-source rig-source" src="head-expressions.png" alt="" hidden decoding="async" fetchpriority="low">\n'
assert html.replace('V10.71','V10.70')==old_html.replace('<script src="head-masks.js" defer></script>\n',''), 'Unexpected invitation/chapter markup changes'
for name in ('page-turn.css','paper-surface.js'):
    assert (here/name).read_bytes()==(old/name).read_bytes(),name+' scroll/paper regression'
css=(here/'page-turn.css').read_text()
assert '.rig-source[hidden]{display:none!important}' in css.split('@media',1)[0], 'Atlas must not enter layout in any motion mode'
assert '<canvas class="star-trail"></canvas>' in html
class Check(HTMLParser):
    def handle_starttag(self,tag,pairs):
        for key,value in pairs:
            if key in ('href','src','srcset') and value and not value.startswith(('http:','https:','#','data:')):
                assert (here/value).exists(),value+' missing'
Check().feed(html)
with Image.open(here/'rig-atlas.png') as sprite:
    assert sprite.size==(1774,887),'Rig crop coordinates require original dimensions'
    assert sprite.mode=='RGBA','Sprite must have actual alpha, not a checkerboard'
    alpha=sprite.getchannel('A')
    assert alpha.getextrema()==(0,255),'Sprite needs transparent and opaque pixels'
    assert alpha.histogram()[0]>sprite.width*sprite.height*.1
for file,digest in {
    'portrait-studio.jpg':'3dcfd0bcfdb4952ebf869ec1bd6723a7823b0daee0e0d7408e2531a950cc659c',
    'portrait-classic.jpg':'f4956206f785e0a2f141b81f25a476e1cfcfb809e72f5d60076114e91eef0f4a'
}.items():
    assert hashlib.sha256((here.parent.parent/'assets'/file).read_bytes()).hexdigest()==digest
print('PASS: no envelope/intro; original invitation/photos preserved; local assets exist; character has actual transparent alpha')
