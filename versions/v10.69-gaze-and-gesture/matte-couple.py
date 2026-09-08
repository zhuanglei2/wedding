"""Source-preserving local matte for the selected flat-gray product photo.
Only the alpha channel changes; RGB and the reference remain untouched.
"""
from pathlib import Path
from collections import deque
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

here=Path(__file__).resolve().parent
source=Image.open(here/'star-couple-reference.jpg').convert('RGB')
rgb=np.asarray(source).astype(np.int16)
h,w=rgb.shape[:2]
protect=Image.new('L',(w,h))
d=ImageDraw.Draw(protect)
# Interior protection keeps pale wedding fabric connected to each figure.
d.polygon([(279,291),(374,285),(451,315),(474,356),(471,410),(482,461),(445,480),(445,572),(419,615),(463,646),(497,670),(517,685),(515,720),(480,738),(445,728),(439,783),(419,865),(433,887),(430,916),(351,917),(340,876),(322,876),(316,917),(209,917),(211,884),(224,863),(208,785),(201,730),(170,717),(146,726),(117,708),(121,678),(149,662),(196,645),(233,608),(225,549),(220,449),(205,420),(181,398),(195,376),(249,387)],fill=255)
d.rectangle((150,250,550,540),fill=0)
d.rectangle((305,844,349,936),fill=0)
d.polygon([(727,324),(739,332),(765,350),(782,372),(796,394),(800,405),(789,438),(750,468),(704,470),(693,423),(690,390),(701,366),(718,346)],fill=255)
d.polygon([(829,274),(854,287),(883,309),(895,332),(907,365),(930,398),(894,407),(866,416),(837,400),(817,375),(805,349),(802,328),(810,304),(820,285)],fill=255)
d.polygon([(748,429),(875,429),(915,477),(938,570),(966,660),(1004,720),(1042,773),(1070,800),(1050,837),(1004,874),(946,895),(874,899),(780,897),(720,876),(678,849),(650,801),(661,758),(680,733),(698,676),(714,590),(727,497)],fill=255)
protected=np.asarray(protect)>0
# The source background is neutral light gray. Flood only exterior-connected
# neutral pixels; never key all white pixels (which would destroy the dress).
neutral=(rgb.max(axis=2)-rgb.min(axis=2)<=8)&(rgb.min(axis=2)>=224)
candidate=neutral&~protected
background=np.zeros((h,w),dtype=bool)
queue=deque()
for x in range(w):
    queue.append((0,x));queue.append((h-1,x))
for y in range(h):
    queue.append((y,0));queue.append((y,w-1))
while queue:
    y,x=queue.popleft()
    if not(0<=y<h and 0<=x<w) or background[y,x] or not candidate[y,x]:continue
    background[y,x]=True
    queue.extend(((y-1,x),(y+1,x),(y,x-1),(y,x+1)))
alpha=Image.fromarray(np.uint8(~background)*255)
# Remove tiny isolated background JPEG artifacts using source-region bounds.
region=Image.new('L',(w,h));rd=ImageDraw.Draw(region)
rd.rectangle((102,267,552,936),fill=255);rd.rectangle((607,267,1104,939),fill=255)
alpha=Image.fromarray(np.minimum(np.asarray(alpha),np.asarray(region))).filter(ImageFilter.GaussianBlur(.45))
rgba=source.convert('RGBA');rgba.putalpha(alpha)
bounds=alpha.getbbox()
crop=(max(0,bounds[0]-8),max(0,bounds[1]-8),min(w,bounds[2]+8),min(h,bounds[3]+8))
rgba=rgba.crop(crop)
assert np.array_equal(np.asarray(rgba.convert('RGB')),np.asarray(source.crop(crop))), 'Source RGB changed'
assert alpha.getpixel((320,510))==255 and alpha.getpixel((825,540))==255, 'Face alpha changed'
rgba.save(here/'star-couple.png',optimize=True)
preview=Image.new('RGBA',rgba.size,'#922c25');preview.alpha_composite(rgba)
preview.convert('RGB').save('/private/tmp/wedding-couple-matte-preview.jpg',quality=95)
print('RGBA cutout',rgba.size,'alpha range',rgba.getchannel('A').getextrema(),'source RGB verified; crop',crop)
