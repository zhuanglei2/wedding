"""Deterministic typesetting of a static proof, not AI editing of the couple.

Run with Pillow. Original photograph is only uniformly scaled into the layout.
Fonts remain on this Mac and are not redistributed.
"""
from pathlib import Path
import hashlib
from PIL import Image, ImageDraw, ImageFont, ImageOps, ImageChops

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
ASSETS = ROOT/'versions/v10.47-soft-gold-light'
S = 4
W, H = 350 * S, 758 * S
GOLD = '#e8cc98'
KAI = '/System/Library/AssetsV2/com_apple_MobileAsset_Font7/54a2ad3dac6cac875ad675d7d273dc425010a877.asset/AssetData/Kaiti.ttc'
TIMES = '/System/Library/Fonts/Supplemental/Times New Roman.ttf'
SONG = '/System/Library/Fonts/Supplemental/Songti.ttc'
photo_path = ROOT / 'assets/portrait-studio.jpg'
before = hashlib.sha256(photo_path.read_bytes()).hexdigest()
canvas = Image.open(ASSETS / 'background-light.png').convert('RGB').resize((W, H), Image.Resampling.LANCZOS)
foil = Image.open(ASSETS/'gold-ink.png').convert('RGB').resize((W,H),Image.Resampling.LANCZOS)
# The generated satin material is clipped into existing glyph masks; no AI text.
foil = Image.blend(Image.new('RGB',(W,H),GOLD),foil,.65)

def gold_ink(alpha,position=(0,0)):
    full = Image.new('L',(W,H))
    full.paste(alpha,position)
    shadow = ImageChops.subtract(ImageChops.offset(full,1,2),full).point(lambda p: round(p*.32))
    canvas.paste(Image.new('RGB',(W,H),'#6d271f'),(0,0),shadow)
    canvas.paste(foil,(0,0),full)
    highlight = ImageChops.subtract(full,ImageChops.offset(full,1,1)).point(lambda p: round(p*.16))
    canvas.paste(Image.new('RGB',(W,H),'#fff0cf'),(0,0),highlight)

def text(value, y, size, center=175, tracking=0, font_path=SONG, color=GOLD, index=None, align_address_digits=False):
    font = ImageFont.truetype(font_path, round(size*S),index=(6 if font_path==SONG else 0) if index is None else index)
    layer = Image.new('RGBA', canvas.size)
    draw = ImageDraw.Draw(layer)
    widths = [draw.textlength('路' if align_address_digits and ch.isascii() and ch.isdigit() else ch, font=font) for ch in value]
    total = sum(widths) + tracking*S*(len(value)-1)
    x = center*S-total/2
    baseline = y*S - draw.textbbox((0,0),value,font=font,anchor='ls')[1]
    for ch, width in zip(value, widths):
        if align_address_digits and ch.isascii() and ch.isdigit():
            # Songti's Latin digits sit higher and are narrower than adjacent Chinese.
            # Keep ASCII content; fit the displayed digit to the adjacent CJK ink box.
            box = draw.textbbox((0,0),ch,font=font,anchor='ls')
            cjk_box = draw.textbbox((0,0),'路号',font=font,anchor='ls')
            glyph = Image.new('RGBA',(box[2]-box[0],box[3]-box[1]))
            ImageDraw.Draw(glyph).text((-box[0],-box[1]),ch,font=font,fill=color,anchor='ls')
            target_height = cjk_box[3]-cjk_box[1]
            glyph = glyph.resize((round(glyph.width*target_height/glyph.height),target_height),Image.Resampling.LANCZOS)
            layer.alpha_composite(glyph,(round(x+(width-glyph.width)/2),round(baseline+cjk_box[1])))
        else:
            draw.text((round(x), round(baseline)), ch, font=font, fill=color, anchor='ls', stroke_width=0)
        x += width + tracking*S
    gold_ink(layer.getchannel('A'))

def line(x1, y1, x2, y2, color='#d3ab7370'):
    layer = Image.new('RGBA',canvas.size)
    ImageDraw.Draw(layer).line((x1*S,y1*S,x2*S,y2*S),fill=color,width=2)
    gold_ink(layer.getchannel('A'))

# Reuse the existing brush artwork mask, with one restrained cream-gold ink.
# Threshold only the mask's residual dark paper noise, never the photo.
mask = Image.open(ROOT/'assets/brush-mask-v10.8.png').convert('L')
mask = mask.point(lambda p: max(0, min(255, round((p-22)*255/233))))
mask = mask.crop(mask.getbbox())
mask = ImageOps.contain(mask,(116*S,106*S),Image.Resampling.LANCZOS)
gold_ink(mask,((W-mask.width)//2,67*S))

# All coordinates are measured in the reference's 350px-wide invitation rectangle.
text('致我们最重要的家人和朋友',186,12.2,tracking=.25)
line(120,208,160,208)
line(190,208,230,208)
# Reuse the current site's divider ornament rather than inventing another icon.
divider = Image.open(ASSETS/'divider.png').convert('RGBA')
divider = ImageOps.contain(divider,(25*S,10*S),Image.Resampling.LANCZOS)
gold_ink(divider.getchannel('A'),((W-divider.width)//2,203*S))
text('有生之年·欣喜相逢',224,12.8,tracking=.25)
text('佳期已定·敬备喜筵',242,12.8,tracking=.25)
text('诚挚邀请您和家人参加我们的婚礼',260,12.1,tracking=.05)
# Reuse V10.32's existing round-happiness badge: local Noto font + a thin circle.
# This is exact typesetting of the existing icon, not a hand-drawn glyph.
seal_size = 16*S
seal_mask = Image.new('L',(seal_size,seal_size))
seal_draw = ImageDraw.Draw(seal_mask)
seal_draw.ellipse((2,2,seal_size-3,seal_size-3),outline=220,width=2)
seal_font = ImageFont.truetype(str(ROOT/'assets/noto-serif-tc-v10.6.ttf'),round(10.5*S))
seal_box = seal_draw.textbbox((0,0),'囍',font=seal_font)
seal_draw.text(((seal_size-(seal_box[2]-seal_box[0]))/2-seal_box[0],(seal_size-(seal_box[3]-seal_box[1]))/2-seal_box[1]),'囍',font=seal_font,fill=235)
gold_ink(seal_mask,((W-seal_size)//2,282*S))
text('WEDDING INVITATION',309,12.3,tracking=-.17,font_path=TIMES)

# Preserve the entire original photo: no crop, retouch, color changes or face generation.
photo = ImageOps.exif_transpose(Image.open(photo_path)).convert('RGB')
photo = ImageOps.contain(photo,(218*S,146*S),Image.Resampling.LANCZOS)
canvas.paste(photo,((W-photo.width)//2,336*S))

text('新郎',503,13,center=110)
text('新娘',503,13,center=240)
text('庄磊',524,18.5,center=110,tracking=1.2,font_path=KAI)
text('吴郁',524,18.5,center=240,tracking=1.2,font_path=KAI)
knot = Image.open(ASSETS/'knot.png').convert('RGBA').resize((15*S,15*S),Image.Resampling.LANCZOS)
gold_ink(knot.getchannel('A'),((W-knot.width)//2,526*S))
line(150,523,150,545)
line(200,523,200,545)

text('婚宴时间 · 晚宴',566,14.2,index=1)
text('2026年10月6日',589,14)
# No invented time, lunar calendar or unprovided parents' names.
text('婚宴地点',633,14.2,index=1)
text('浙江省宁海西子国际大酒店',656,13.3)
text('宁波市宁海县跃龙街道外环东路8号',681,11.2,align_address_digits=True)
text('庄磊 与 吴郁 敬邀',722,14.5,tracking=.25)

canvas.save(HERE/'invitation-v10.50.png', optimize=True)
canvas.resize((700,1516),Image.Resampling.LANCZOS).save(HERE/'preview-v10.50.png',optimize=True)
# Optional reference board, with original reference content and watermarks left intact.
reference_path = ROOT/'versions/v10.48-address-dinner/invitation-v10.48.png'
if reference_path.exists():
    ref = Image.open(reference_path).convert('RGB')
    difference = ImageChops.difference(canvas,ref)
    # The lossless master must differ only in the new seal box.
    ImageDraw.Draw(difference).rectangle((166*S,281*S,184*S,300*S),fill=0)
    assert difference.getbbox() is None, 'Unexpected changes outside requested text'
    photo_box = ((W-photo.width)//2,336*S,(W+photo.width)//2,336*S+photo.height)
    assert ImageChops.difference(canvas.crop(photo_box),ref.crop(photo_box)).getbbox() is None
    ref = ref.resize((700,1516),Image.Resampling.LANCZOS)
    board = Image.new('RGB',(1472,1608),'#22201e')
    labels = ImageDraw.Draw(board)
    font = ImageFont.truetype(KAI,26)
    labels.text((374,30),'V10.48 · 定稿',font=font,fill='#ece6de',anchor='mt')
    labels.text((1098,30),'V10.50 · 补回小印章',font=font,fill='#ece6de',anchor='mt')
    board.paste(ref,(24,68))
    board.paste(canvas.resize((700,1516),Image.Resampling.LANCZOS),(748,68))
    board.save(HERE/'comparison-v10.50.jpg',quality=94,subsampling=0)
    canvas.crop((65*S,252*S,285*S,328*S)).save(HERE/'seal-detail-v10.50.png')
assert hashlib.sha256(photo_path.read_bytes()).hexdigest() == before
print('Rendered 1400 x 3032 proof; source photo SHA-256 unchanged:',before)
