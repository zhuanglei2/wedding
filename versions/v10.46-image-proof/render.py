"""Deterministic typesetting of a static proof, not AI editing of the couple.

Run with Pillow. Original photograph is only uniformly scaled into the layout.
Fonts remain on this Mac and are not redistributed.
"""
from pathlib import Path
import hashlib
from PIL import Image, ImageDraw, ImageFont, ImageOps

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
S = 4
W, H = 350 * S, 758 * S
GOLD = '#e8cc98'
KAI = '/System/Library/AssetsV2/com_apple_MobileAsset_Font7/54a2ad3dac6cac875ad675d7d273dc425010a877.asset/AssetData/Kaiti.ttc'
TIMES = '/System/Library/Fonts/Supplemental/Times New Roman.ttf'
SONG = '/System/Library/Fonts/Supplemental/Songti.ttc'
photo_path = ROOT / 'assets/portrait-studio.jpg'
before = hashlib.sha256(photo_path.read_bytes()).hexdigest()
canvas = Image.open(HERE / 'background-refined.png').convert('RGB').resize((W, H), Image.Resampling.LANCZOS)

def text(value, y, size, center=175, tracking=0, font_path=SONG, color=GOLD, index=None):
    font = ImageFont.truetype(font_path, round(size*S),index=(6 if font_path==SONG else 0) if index is None else index)
    layer = Image.new('RGBA', canvas.size)
    draw = ImageDraw.Draw(layer)
    widths = [draw.textlength(ch, font=font) for ch in value]
    total = sum(widths) + tracking*S*(len(value)-1)
    x = center*S-total/2
    baseline = y*S - draw.textbbox((0,0),value,font=font,anchor='ls')[1]
    for ch, width in zip(value, widths):
        draw.text((round(x), round(baseline)), ch, font=font, fill=color, anchor='ls', stroke_width=0)
        x += width + tracking*S
    canvas.paste(layer, (0,0), layer)

def line(x1, y1, x2, y2, color='#d3ab7370'):
    layer = Image.new('RGBA',canvas.size)
    ImageDraw.Draw(layer).line((x1*S,y1*S,x2*S,y2*S),fill=color,width=2)
    canvas.paste(layer,(0,0),layer)

# Reuse the existing brush artwork mask, with one restrained cream-gold ink.
# Threshold only the mask's residual dark paper noise, never the photo.
mask = Image.open(ROOT/'assets/brush-mask-v10.8.png').convert('L')
mask = mask.point(lambda p: max(0, min(255, round((p-22)*255/233))))
mask = mask.crop(mask.getbbox())
mask = ImageOps.contain(mask,(116*S,106*S),Image.Resampling.LANCZOS)
ink = Image.new('RGB',mask.size,GOLD)
canvas.paste(ink,((W-mask.width)//2,67*S),mask)

# All coordinates are measured in the reference's 350px-wide invitation rectangle.
text('致我们最重要的家人和朋友',186,12.2,tracking=.25)
line(120,208,160,208)
line(190,208,230,208)
# Reuse the current site's divider ornament rather than inventing another icon.
divider = Image.open(HERE/'divider.png').convert('RGBA')
divider = ImageOps.contain(divider,(25*S,10*S),Image.Resampling.LANCZOS)
canvas.paste(divider,((W-divider.width)//2,203*S),divider)
text('有生之年·欣喜相逢',224,12.8,tracking=.25)
text('佳期已定·敬备喜筵',242,12.8,tracking=.25)
text('诚挚邀请您和家人参加我们的婚礼',260,12.1,tracking=.05)
text('WEDDING INVITATION',309,12.3,tracking=-.17,font_path=TIMES)

# Preserve the entire original photo: no crop, retouch, color changes or face generation.
photo = ImageOps.exif_transpose(Image.open(photo_path)).convert('RGB')
photo = ImageOps.contain(photo,(218*S,146*S),Image.Resampling.LANCZOS)
canvas.paste(photo,((W-photo.width)//2,336*S))

text('新郎',503,13,center=110)
text('新娘',503,13,center=240)
text('庄磊',524,18.5,center=110,tracking=1.2,font_path=KAI)
text('吴郁',524,18.5,center=240,tracking=1.2,font_path=KAI)
knot = Image.open(HERE/'knot.png').convert('RGBA').resize((15*S,15*S),Image.Resampling.LANCZOS)
canvas.paste(knot,((W-knot.width)//2,526*S),knot)
line(150,523,150,545)
line(200,523,200,545)

text('婚宴时间',566,14.2,index=1)
text('2026年10月6日',589,14)
# No invented time, lunar calendar or unprovided parents' names.
text('婚宴地点',633,14.2,index=1)
text('浙江省宁海西子国际大酒店',656,13.3)
text('庄磊 与 吴郁 敬邀',722,14.5,tracking=.25)

canvas.save(HERE/'invitation-v10.46.png', optimize=True)
canvas.save(HERE/'invitation-v10.46.jpg',quality=95,subsampling=0)
canvas.resize((700,1516),Image.Resampling.LANCZOS).save(HERE/'preview-v10.46.png',optimize=True)
# Optional reference board, with original reference content and watermarks left intact.
reference_path = Path('/Users/eleme/Desktop/wedding/网图/IMG_8777.PNG.JPG')
if reference_path.exists():
    ref = Image.open(reference_path).convert('RGB').crop((120,261,470,1019))
    ref = ref.resize((700,1516),Image.Resampling.LANCZOS)
    board = Image.new('RGB',(1472,1608),'#22201e')
    labels = ImageDraw.Draw(board)
    font = ImageFont.truetype(KAI,26)
    labels.text((374,30),'原参考图',font=font,fill='#ece6de',anchor='mt')
    labels.text((1098,30),'V10.46 · 图片化首稿',font=font,fill='#ece6de',anchor='mt')
    board.paste(ref,(24,68))
    board.paste(canvas.resize((700,1516),Image.Resampling.LANCZOS),(748,68))
    board.save(HERE/'comparison-v10.46.jpg',quality=94,subsampling=0)
assert hashlib.sha256(photo_path.read_bytes()).hexdigest() == before
print('Rendered 1400 x 3032 proof; source photo SHA-256 unchanged:',before)
