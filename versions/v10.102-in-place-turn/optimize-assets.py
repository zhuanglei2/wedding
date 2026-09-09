"""Lossless delivery copies; no generative edits, resize or source overwrite."""
from pathlib import Path
from PIL import Image
import hashlib, json

here = Path(__file__).resolve().parent
old = here.parent / 'v10.100-refined-character-scale'
records = []
for name in ('rig-atlas',):
    source = old / (name + '.png')
    dest = here / (name + '.webp')
    with Image.open(source) as im:
        im.save(dest, 'WEBP', lossless=True, exact=True, method=6)
        decoded = Image.open(dest).convert('RGBA')
        # Transparent RGB is immaterial, but every visible pixel and alpha match.
        original = im.convert('RGBA')
        assert original.size == decoded.size
        for a, b in zip(original.getdata(), decoded.getdata()):
            assert a[3] == b[3] and (a[3] == 0 or a == b)
    records.append({'source':str(source.relative_to(here.parent)), 'output':dest.name,
                    'before':source.stat().st_size,'after':dest.stat().st_size,'visible_pixels_equal':True})

# Only four tiny eyelid regions are read by the actual renderer.
boxes = [(1208,240,40,12),(1289,239,39,11),(1212,584,39,10),(1290,584,39,11)]
atlas = Image.new('RGBA', (80,24))
with Image.open(old/'head-expressions.png') as im:
    im = im.convert('RGBA')
    for i,(x,y,w,h) in enumerate(boxes):
        piece = im.crop((x,y,x+w,y+h))
        dx,dy=(i%2)*40,(i//2)*12
        atlas.paste(piece,(dx,dy))
        assert atlas.crop((dx,dy,dx+w,dy+h)).tobytes() == piece.tobytes()
atlas.save(here/'eye-lids.png', optimize=True)
records.append({'source':'v10.100-refined-character-scale/head-expressions.png','output':'eye-lids.png',
    'before':(old/'head-expressions.png').stat().st_size,'after':(here/'eye-lids.png').stat().st_size,
    'source_boxes':boxes,'pixels_equal':True})
for r in records:
    r['sha256']=hashlib.sha256((here/r['output']).read_bytes()).hexdigest()
(here/'ASSET-OPTIMIZATION.json').write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(records,ensure_ascii=False))
