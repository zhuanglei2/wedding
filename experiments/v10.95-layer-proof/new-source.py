"""Inspect/extract the already-generated V10.94, then test the same card geometry.
No generation or semantic reconstruction; segmentation is source-specific.
"""
import sys,json,hashlib,importlib.util
from pathlib import Path
sys.path.insert(0,'/private/tmp/wedding-v1088.TQDAlk/libs')
import cv2 as cv
import numpy as np
ROOT=Path(__file__).resolve().parent
WORK=Path(sys.argv[1]);WORK.mkdir(parents=True,exist_ok=True)
ALPHA=WORK/'alpha';ALPHA.mkdir(exist_ok=True)
OUT=ROOT/'new-source';OUT.mkdir(exist_ok=True)
SOURCE=ROOT/'source-v1094.mp4'
cap=cv.VideoCapture(str(SOURCE));assert cap.get(cv.CAP_PROP_FPS)==24
grips={};stats=[];sheets=[];f=0
while True:
    ok,im=cap.read()
    if not ok:break
    assert im.shape==(1024,592,3)
    b,g,r=cv.split(im.astype(np.float32));yy,xx=np.mgrid[:1024,:592]
    # Generous source-inspected envelopes: full bodies and full dress included.
    roi=(((xx>=390)&(xx<=518)&(yy>=260)&(yy<=440))|
         ((xx>=285)&(xx<=445)&(yy>=400)&(yy<=730)))
    red=(r>45)&(r>g*1.55)&(r>b*1.8)
    gray_border=(xx>=497)&(r<130)
    binary=np.uint8(roi&~red&~gray_border)*255
    count,labels,ss,_=cv.connectedComponentsWithStats(binary)
    for i in range(1,count):
        if ss[i,cv.CC_STAT_AREA]<25:binary[labels==i]=0
    count,labels,ss,_=cv.connectedComponentsWithStats(255-binary)
    for i in range(1,count):
        # Preserve enclosed eyes/mouth/skin and dark outfit details. Red-key
        # thresholds must not punch holes through a character's silhouette.
        x,y,w,h,area=ss[i]
        if x>0 and y>0 and x+w<592 and y+h<1024:binary[labels==i]=255
    soft=cv.GaussianBlur(binary,(3,3),.55);soft[binary==255]=255
    rgba=cv.cvtColor(im,cv.COLOR_BGR2BGRA);rgba[:,:,3]=soft
    assert np.array_equal(rgba[:,:,:3],im)
    cv.imwrite(str(ALPHA/f'frame-{f+1:03d}.png'),rgba)
    # Yellow mitten within a narrow observed ROI, not arbitrary face tracking.
    hand=((xx>=491)&(xx<=516)&(yy>=336)&(yy<=368)&(r>155)&(g>100)&(b<180)&(r>b*1.30)&(soft>180))
    hy,hx=np.where(hand);assert len(hx)>20,(f,len(hx))
    grips[f]=(float(hx.mean()),float(hy.mean()))
    stats.append({'frame':f,'handSeedPixels':len(hx),'opaquePixels':int(np.sum(soft==255))})
    if f in [0,24,48,72,96]:
        a=soft[:,:,None]/255
        dark=np.uint8(im*a+np.array([42,36,30])*(1-a))
        light=np.uint8(im*a+np.array([235,238,241])*(1-a))
        panels=np.concatenate([im[250:740,280:525],dark[250:740,280:525],light[250:740,280:525]],axis=1)
        strip=np.full((520,735,3),25,np.uint8);strip[30:]=panels
        cv.putText(strip,f'{f/24:.2f}s / SOURCE - DARK MATTE - LIGHT MATTE',(8,22),cv.FONT_HERSHEY_SIMPLEX,.45,(235,235,235),1,cv.LINE_AA)
        sheets.append(strip)
    f+=1
cap.release();assert f==97
cv.imwrite(str(OUT/'matte-contact-sheet.jpg'),np.concatenate(sheets))
(OUT/'matte-verification.json').write_text(json.dumps({'frames':f,'sourceSHA256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
    'decodedRGBUnchangedInRGBA':True,'method':'source-specific colour segmentation + bounded mitten centroid',
    'notSemanticClothingCertification':True,'frameStats':stats,'palms':grips},indent=2))
spec=importlib.util.spec_from_file_location('card_proof',ROOT/'render.py')
renderer=importlib.util.module_from_spec(spec);spec.loader.exec_module(renderer)
renderer.ROOT=OUT;renderer.SOURCE=SOURCE;renderer.ALPHA=ALPHA;renderer.SOURCE_START=0
renderer.PALMS=grips
renderer.LIMITATIONS=[
    'Baked V10.94 movement remains; colour-tracked mitten centroid alignment is not verified finger gripping.',
    'Pair follows the edge off LEFT as a geometry test, not waiting, handholding or shared upward flight.',
    'Source-specific matte has fine edge contamination; enclosed silhouette filling can retain small background pockets.',
    'Second image uses contain in a poster-height test viewport, not mobile DOM / WeChat integration.',
    'Actors are present initially; entrance, release and correct depth occlusion are not implemented.'
]
renderer.main(WORK/'rendered')
