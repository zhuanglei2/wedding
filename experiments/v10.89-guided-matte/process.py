"""Local, source-preserving guided video masks. Not generative reconstruction."""
import sys, os, json, hashlib
from pathlib import Path
sys.path.insert(0, '/private/tmp/wedding-v1088.TQDAlk/libs')
import cv2 as cv
import numpy as np

ROOT=Path(__file__).resolve().parent
FRAMES=Path(sys.argv[1])
OUT=Path(sys.argv[2])
for sub in ['alpha','comparison','contact']:
    (OUT/sub).mkdir(parents=True,exist_ok=True)
cv.setNumThreads(2)
cv.setRNGSeed(0)

# Manually inspected envelopes. Early frames are entirely over red; later
# polygons explicitly exclude the adjacent white paper, preserving white dress.
boxes={0:[(373,261,477,412),(371,484,483,635)],12:[(370,263,478,415),(369,483,483,638)],24:[(370,263,481,416),(369,483,483,638)],36:[(369,333,473,481),(368,487,483,636)],48:[(353,390,461,528),(350,494,462,638)],60:[(338,409,441,565),(288,495,407,641)]}
polys={
60:[[(355,416),(369,414),(404,417),(404,437),(414,444),(413,451),(407,451),(410,472),(408,481),(418,483),(426,480),(435,483),(437,490),(432,499),(420,500),(416,518),(414,534),(399,538),(391,533),(389,548),(383,558),(372,562),(366,552),(365,534),(354,521),(348,525),(341,520),(342,512),(352,503),(358,490),(352,481),(349,460),(353,451),(342,448),(342,442),(354,441)],[(317,499),(333,505),(342,518),(354,527),(363,541),(367,548),(376,547),(383,551),(382,560),(370,567),(378,580),(396,592),(403,600),(397,615),(379,628),(353,638),(333,640),(314,634),(292,623),(297,608),(299,580),(302,550),(296,533),(296,520),(304,516),(316,522)]],
66:[[(326,420),(344,419),(372,425),(371,442),(380,451),(380,459),(372,459),(375,477),(371,490),(378,488),(386,493),(389,500),(386,508),(392,521),(401,540),(399,549),(385,554),(378,547),(372,531),(369,550),(364,560),(351,565),(344,557),(343,539),(337,527),(330,527),(323,520),(327,509),(328,503),(320,492),(316,473),(320,455),(310,454),(307,449),(317,445),(323,444)],[(275,500),(289,504),(301,518),(312,526),(321,546),(328,552),(336,548),(342,551),(343,559),(333,566),(326,568),(335,580),(354,593),(362,601),(356,616),(338,630),(313,638),(293,640),(272,634),(253,623),(258,608),(260,579),(263,549),(255,535),(254,522),(261,517),(274,523)]],
78:[[(299,425),(314,430),(345,441),(341,459),(348,468),(345,476),(335,475),(334,493),(328,505),(337,517),(343,540),(351,561),(346,570),(331,575),(324,568),(320,553),(311,565),(295,568),(289,562),(290,543),(285,531),(279,521),(280,510),(286,505),(283,497),(280,482),(281,467),(285,461),(275,455),(275,449),(293,444)],[(230,496),(244,501),(258,516),(267,528),(275,549),(282,550),(289,554),(289,560),(280,568),(274,570),(283,585),(300,598),(307,605),(301,619),(281,630),(255,638),(234,636),(212,628),(198,616),(203,601),(206,574),(210,545),(205,530),(206,517),(214,510),(224,517)]],
90:[[(277,429),(291,434),(321,448),(317,465),(325,473),(321,480),(311,480),(309,498),(303,508),(313,525),(318,544),(326,565),(322,574),(307,578),(300,572),(296,558),(290,570),(274,574),(269,568),(271,550),(267,535),(258,534),(251,527),(243,524),(239,517),(242,508),(248,507),(253,512),(254,489),(253,477),(257,466),(252,460),(250,453),(266,445)],[(204,494),(218,499),(230,515),(239,529),(247,549),(254,552),(257,559),(252,567),(246,570),(253,588),(268,608),(266,620),(249,631),(228,637),(209,634),(188,627),(170,614),(174,600),(177,575),(180,548),(180,536),(178,522),(184,507),(195,515),(202,519)]],
72:[
 [(318,424),(328,424),(367,439),(365,453),(369,465),(367,473),(355,472),(353,497),(359,511),(364,531),(372,553),(368,563),(352,572),(341,563),(335,548),(327,561),(311,564),(305,556),(309,537),(307,527),(302,521),(303,509),(311,502),(306,496),(300,486),(301,472),(306,456),(297,453),(296,446),(314,445)],
 [(250,498),(270,504),(281,518),(291,527),(301,543),(305,551),(312,549),(317,553),(315,561),(304,568),(308,580),(330,595),(336,603),(331,616),(314,628),(292,636),(269,639),(248,634),(227,623),(232,608),(234,580),(234,548),(230,532),(231,517),(240,519),(250,524)]
 ],
84:[
 [(285,427),(299,432),(332,447),(328,463),(333,470),(331,478),(320,478),(319,495),(313,505),(320,518),(323,535),(334,560),(332,568),(315,576),(306,570),(303,555),(296,567),(277,570),(271,564),(273,555),(272,536),(266,530),(257,525),(250,520),(251,509),(256,505),(264,508),(265,493),(263,480),(265,463),(261,455),(264,447),(278,445)],
 [(215,496),(230,501),(240,515),(250,528),(257,551),(264,552),(270,558),(265,567),(258,570),(264,583),(277,598),(286,607),(282,617),(262,629),(237,637),(216,636),(195,628),(183,616),(187,602),(190,576),(192,544),(189,529),(192,510),(201,514),(210,520)]
 ],
96:[
 [(268,430),(281,432),(314,448),(310,464),(316,474),(312,481),(303,479),(302,496),(296,507),(308,525),(313,543),(322,564),(318,572),(302,578),(296,572),(291,558),(287,571),(270,575),(266,569),(269,558),(266,539),(258,533),(250,532),(247,527),(238,525),(234,519),(236,510),(242,509),(247,513),(248,492),(247,480),(250,465),(244,459),(244,452),(261,445)],
 [(199,494),(213,498),(226,515),(234,528),(240,545),(242,551),(249,552),(253,559),(248,567),(242,571),(244,588),(247,604),(252,620),(251,629),(239,634),(217,636),(195,631),(179,624),(166,613),(170,602),(173,578),(177,553),(178,537),(175,522),(181,508),(189,513),(197,519)]
 ]}

def red_bg(im):
    b,g,r=cv.split(im.astype(np.float32))
    return (r>45)&(r>g*1.65)&(r>b*1.9)&(b<110)&((g-b)<.30*(r-b))

def refine(im,prior,strict=False):
    red=red_bg(im)
    k=cv.getStructuringElement(cv.MORPH_ELLIPSE,(7,7))
    outside=cv.dilate(prior,k)==0
    mask=np.full(prior.shape,cv.GC_PR_BGD,np.uint8)
    mask[prior>0]=cv.GC_PR_FGD
    mask[outside|red]=cv.GC_BGD
    core=cv.erode(prior,cv.getStructuringElement(cv.MORPH_ELLIPSE,(11,11)))>0
    mask[core&~red]=cv.GC_FGD
    cv.grabCut(im,mask,None,np.zeros((1,65)),np.zeros((1,65)),3,cv.GC_INIT_WITH_MASK)
    result=np.where((mask==cv.GC_FGD)|(mask==cv.GC_PR_FGD),255,0).astype(np.uint8)
    # Do not invent hidden dress pixels. Late paper-facing contours are bounded.
    if strict: result[cv.dilate(prior,np.ones((3,3),np.uint8))==0]=0
    n,labels,stats,_=cv.connectedComponentsWithStats(result)
    for j in range(1,n):
        if stats[j,cv.CC_STAT_AREA]<18:result[labels==j]=0
    # Tiny enclosed holes are classifier errors inside opaque toys, not alpha.
    inv=255-result
    n,labels,stats,_=cv.connectedComponentsWithStats(inv)
    for j in range(1,n):
        if stats[j,cv.CC_STAT_AREA]<120:result[labels==j]=255
    return result

# One frame before first contact, the red separator is subpixel-wide and the
# paper can join the hand component. Explicit source-inspected local envelope.
polys[59]=[[(x+(5 if j==0 else 3),y) for x,y in p] for j,p in enumerate(polys[60])]
images=[cv.imread(str(FRAMES/f'frame-{f+1:03d}.png')) for f in range(97)]
assert all(im is not None and im.shape==(1024,576,3) for im in images)
keys={}
for f in sorted(set(boxes)|set(polys)):
    prior=np.zeros((1024,576),np.uint8)
    if f not in polys:
        for x1,y1,x2,y2 in boxes[f]:cv.rectangle(prior,(x1,y1),(x2,y2),255,-1)
    else:
        cv.fillPoly(prior,[np.array(p,np.int32) for p in polys[f]],255)
    keys[f]=refine(images[f],prior,strict=f>=60)

# Dense backward flow maps each in-between frame to both independently labelled
# endpoints. This is temporal propagation, not a semantic tracking accuracy claim.
def warp(mask,source,target):
    a=cv.cvtColor(source,cv.COLOR_BGR2GRAY);b=cv.cvtColor(target,cv.COLOR_BGR2GRAY)
    flow=cv.calcOpticalFlowFarneback(b,a,None,.5,4,23,4,7,1.5,0)
    yy,xx=np.mgrid[:1024,:576].astype(np.float32)
    return cv.remap(mask,xx+flow[:,:,0],yy+flow[:,:,1],cv.INTER_LINEAR)

selected=set(map(int,sys.argv[3].split(','))) if len(sys.argv)>3 else None
metrics=json.loads((ROOT/'matte-metrics.json').read_text())['frames'] if selected else []
for f,im in enumerate(images):
    if selected is not None and f not in selected:continue
    if f in keys:matte=keys[f]
    elif f<60:
        # Before the paper overlaps either toy, the local background is solid
        # red. A generous tracked ROI avoids optical-flow clipping on fast
        # moving hands, hat brim and the bride's bow.
        lo=f//12*12;hi=lo+12;t=(f-lo)/12
        prior=np.zeros((1024,576),np.uint8)
        for aa,bb in zip(boxes[lo],boxes[hi]):
            x1,y1,x2,y2=np.round(np.array(aa)*(1-t)+np.array(bb)*t).astype(int)
            cv.rectangle(prior,(max(0,x1-12),y1-20),(min(493,x2+12),y2+20),255,-1)
        matte=refine(im,prior)
    else:
        lo=max(k for k in keys if k<f);hi=min(k for k in keys if k>f);t=(f-lo)/(hi-lo)
        a=warp(keys[lo],images[lo],im);b=warp(keys[hi],images[hi],im)
        prior=np.where(a*(1-t)+b*t>110,255,0).astype(np.uint8)
        # Optical flow can follow the moving paper instead of a toy. Bound it
        # with translated endpoint silhouettes before any colour refinement.
        def center(m):
            yy,xx=np.where(m>0);return np.array([xx.mean(),yy.mean()])
        ca,cb=center(keys[lo]),center(keys[hi]);delta=cb-ca
        aa=cv.warpAffine(keys[lo],np.float32([[1,0,delta[0]*t],[0,1,delta[1]*t]]),(576,1024))
        bb=cv.warpAffine(keys[hi],np.float32([[1,0,-delta[0]*(1-t)],[0,1,-delta[1]*(1-t)]]),(576,1024))
        envelope=cv.dilate(np.maximum(aa,bb),cv.getStructuringElement(cv.MORPH_ELLIPSE,(9,9)))
        prior[envelope==0]=0
        matte=refine(im,prior,strict=f>=60)
    if f<60:
        # Reject disconnected paper islands entering the generous early ROI.
        # Retain components seeded inside each toy, not simply the largest two
        # (the toys can touch and become one component).
        lo=f//12*12;hi=min(60,lo+12);t=(f-lo)/(hi-lo)
        _,labels=cv.connectedComponents(matte)
        keep=set()
        for aa,bb in zip(boxes[lo],boxes[hi]):
            rect=np.array(aa)*(1-t)+np.array(bb)*t
            cx=int((rect[0]+rect[2])/2);cy=int((rect[1]+rect[3])/2)
            keep.update(np.unique(labels[cy-6:cy+7,cx-6:cx+7]).tolist())
        keep.discard(0)
        matte[~np.isin(labels,list(keep))]=0
    # Fractional coverage only at silhouette; interior RGB and alpha untouched.
    soft=cv.GaussianBlur(matte,(3,3),.55)
    soft[matte==255]=255
    rgba=cv.cvtColor(im,cv.COLOR_BGR2BGRA);rgba[:,:,3]=soft
    cv.imwrite(str(OUT/'alpha'/f'frame-{f+1:03d}.png'),rgba)
    dark=np.full_like(im,(46,35,25));light=np.full_like(im,(226,238,246))
    al=soft[:,:,None]/255
    d=(im*al+dark*(1-al)).astype(np.uint8);l=(im*al+light*(1-al)).astype(np.uint8)
    # Consistent attribution retained in derived previews.
    for panel in [d,l]:cv.putText(panel,'Source: PixVerse.ai',(365,39),cv.FONT_HERSHEY_SIMPLEX,.48,(220,220,220),1,cv.LINE_AA)
    crop=(slice(245,660),slice(155,505))
    panels=[im[crop],d[crop],l[crop]]
    movie=np.full((465,1050,3),(31,25,20),np.uint8)
    for j,p in enumerate(panels):
        movie[40:455,j*350:(j+1)*350]=p
        cv.putText(movie,['SOURCE','GUIDED / DARK','GUIDED / LIGHT'][j],(j*350+8,24),cv.FONT_HERSHEY_SIMPLEX,.53,(230,230,230),1,cv.LINE_AA)
    cv.putText(movie,f'{f/24:.3f}s - PixVerse source / local matte test',(8,463),cv.FONT_HERSHEY_SIMPLEX,.3,(230,230,230),1,cv.LINE_AA)
    cv.imwrite(str(OUT/'comparison'/f'frame-{f+1:03d}.png'),movie)
    if f%12==0:cv.imwrite(str(OUT/'contact'/f'frame-{f+1:03d}.png'),movie)
    metrics=[row for row in metrics if row['frame']!=f]
    metrics.append({'frame':f,'time':f/24,'opaquePixels':int(np.sum(soft==255)),'partialPixels':int(np.sum((soft>0)&(soft<255)))})
    if f%12==0:print(f'processed {f+1}/97',flush=True)
cv.imwrite(str(ROOT/'contact-sheet.jpg'),np.concatenate([cv.imread(str(OUT/'contact'/f'frame-{f+1:03d}.png')) for f in [0,24,48,72,96]],axis=0))
(ROOT/'matte-metrics.json').write_text(json.dumps({'method':'manual envelopes + GrabCut + bidirectional Farneback flow','frames':sorted(metrics,key=lambda r:r['frame']),'warning':'Pixel counts are not accuracy. Final skirt is partly occluded in original footage; no unseen pixels reconstructed.'},indent=2))
