"""Source-guided video masks. RGB is untouched; no generated/repainted anatomy."""
import sys,json,hashlib
from pathlib import Path
sys.path.insert(0,'/private/tmp/wedding-v1088.TQDAlk/libs')
import cv2 as cv
import numpy as np
ROOT=Path(__file__).resolve().parent
SOURCE=ROOT.parent/'v10.95-layer-proof/source-v1094.mp4'

def holes(mask):
    n,lab,stats,_=cv.connectedComponentsWithStats(255-mask)
    h,w=mask.shape
    for i in range(1,n):
        x,y,ww,hh,_=stats[i]
        if x>0 and y>0 and x+ww<w and y+hh<h:mask[lab==i]=255
    return mask

def extract(im,box,boy):
    x,y,w,h=box;crop=im[y:y+h,x:x+w];b,g,r=cv.split(crop.astype(np.float32))
    yy,xx=np.mgrid[y:y+h,x:x+w]
    key=(r>45)&(r>g*1.55)&(r>b*1.8)
    border=(xx>=497)&(r<130)
    binary=np.uint8(~key&~border)*255
    n,lab,stats,_=cv.connectedComponentsWithStats(binary)
    for i in range(1,n):
        if stats[i,cv.CC_STAT_AREA]<25:binary[lab==i]=0
    protected=np.zeros((h,w),np.uint8)
    if boy:
        # Observed moving face stays in this bounded rectangle. Convex hull
        # of yellow skin closes the mouth-connected notch in the red key.
        skin=(xx>419)&(xx<490)&(yy>=313)&(yy<=354)&(r>165)&(g>115)&(b<200)&~key
        pts=np.column_stack(np.where(skin)[::-1]).astype(np.int32)
        assert len(pts)>100
        cv.fillConvexPoly(protected,cv.convexHull(pts),255)
        binary=np.maximum(binary,protected)
    binary=holes(binary)
    tri=np.full((h,w),cv.GC_PR_BGD,np.uint8)
    tri[cv.dilate(binary,np.ones((3,3),np.uint8))>0]=cv.GC_PR_FGD
    tri[cv.erode(binary,np.ones((3,3),np.uint8))>0]=cv.GC_FGD
    tri[cv.erode(protected,np.ones((3,3),np.uint8))>0]=cv.GC_FGD
    tri[border]=cv.GC_BGD
    tri[:2]=tri[-2:]=cv.GC_BGD;tri[:,:2]=tri[:,-2:]=cv.GC_BGD
    cv.setRNGSeed(96)
    cv.grabCut(crop,tri,None,np.zeros((1,65)),np.zeros((1,65)),3,cv.GC_INIT_WITH_MASK)
    binary=np.uint8((tri==cv.GC_FGD)|(tri==cv.GC_PR_FGD))*255
    binary=holes(binary)
    # Enclosed gaps between black trouser legs are background, not facial
    # interior: do not retain the red card inside that lower-body pocket.
    if boy:binary[key&(yy>390)]=0
    else:
        # The generous bride ROI overlaps a small portion of the boy's shoes.
        # Keep her connected silhouette, not detached pixels from the other actor.
        count,labels,stats,_=cv.connectedComponentsWithStats(binary)
        largest=1+int(np.argmax(stats[1:,cv.CC_STAT_AREA]))
        binary[labels!=largest]=0
    soft=cv.GaussianBlur(binary,(3,3),.5)
    soft[binary==0]=0
    # Interior details stay fully opaque; antialias only the silhouette boundary.
    soft[cv.erode(binary,np.ones((3,3),np.uint8))>0]=255
    core=cv.erode(protected,np.ones((3,3),np.uint8))>0
    soft[core]=255
    out=np.zeros(im.shape[:2],np.uint8);out[y:y+h,x:x+w]=soft
    if boy:assert np.all(soft[core]==255)
    return out,int(core.sum())

def main(work):
    work.mkdir(parents=True,exist_ok=True)
    for name in ['boy','girl','pair']:(work/name).mkdir(exist_ok=True)
    cv.setNumThreads(2)
    cap=cv.VideoCapture(str(SOURCE));sheets=[];stats=[];grips={};f=0
    while True:
        ok,im=cap.read()
        if not ok:break
        ba,core=extract(im,(390,260,130,184),True)
        ga,_=extract(im,(282,400,166,334),False)
        for name,a in [('boy',ba),('girl',ga),('pair',np.maximum(ba,ga))]:
            rgba=cv.cvtColor(im,cv.COLOR_BGR2BGRA);rgba[:,:,3]=a
            assert np.array_equal(rgba[:,:,:3],im)
            cv.imwrite(str(work/name/f'{f:03d}.png'),rgba)
        b,g,r=cv.split(im.astype(np.float32));yy,xx=np.mgrid[:1024,:592]
        seed=(xx>=491)&(xx<=516)&(yy>=336)&(yy<=368)&(r>155)&(g>100)&(b<180)&(r>b*1.3)&(ba>180)
        hy,hx=np.where(seed);assert len(hx)>20
        grips[f]=[float(hx.mean()),float(hy.mean())]
        stats.append({'frame':f,'protectedFaceCore':core,'boyPixels':int((ba>128).sum()),'girlPixels':int((ga>128).sum())})
        if f in [0,24,48,72,96]:
            a=np.maximum(ba,ga)[:,:,None]/255
            dark=np.uint8(im*a+np.array([42,36,30])*(1-a))
            light=np.uint8(im*a+np.array([235,238,241])*(1-a))
            panels=np.concatenate([im[250:740,280:525],dark[250:740,280:525],light[250:740,280:525]],axis=1)
            strip=np.full((520,735,3),25,np.uint8);strip[30:]=panels
            cv.putText(strip,f'{f/24:.2f}s / SOURCE | DARK | LIGHT',(8,22),0,.5,(235,235,235),1,cv.LINE_AA)
            sheets.append(strip)
        if f%24==0:print(f'matte {f}/97',flush=True)
        f+=1
    cap.release();assert f==97
    cv.imwrite(str(ROOT/'matte-sheet.jpg'),np.concatenate(sheets))
    report={'frames':f,'decodedRGBPreserved':True,'sourceSHA256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
        'method':'deterministic guided GrabCut + bounded skin-hull interior protection',
        'faceCoreOpaqueAllFrames':True,'semanticBoundaryCertification':False,'stats':stats,'grips':grips}
    (ROOT/'matte-checks.json').write_text(json.dumps(report,indent=2))

if __name__=='__main__':main(Path(sys.argv[1]))
