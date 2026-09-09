"""Offline continuation of the existing compositing experiment.

One rigid 3-D invitation plane; old PixVerse character pixels are translated
as a pair, never re-rigged or generated. This tests the card/texture mechanism,
NOT an approved character performance, finger grip, or website integration.
"""
import sys, math, json, hashlib, subprocess
from pathlib import Path
sys.path.insert(0, '/private/tmp/wedding-v1088.TQDAlk/libs')
import cv2 as cv
import numpy as np

ROOT=Path(__file__).resolve().parent
REPO=ROOT.parents[1]
W,H,FPS,N=480,1126,24,78
D=W*8
THICKNESS=2.4
SOURCE=Path('/Users/eleme/Downloads/PixVerse_V6_Image_Text_540P_One_continuous_fou.mp4')
COVER=REPO/'versions/v10.71-collar-and-motion/cover.webp'
UNDER=REPO/'versions/v10.71-collar-and-motion/classic-reveal.webp'
ALPHA=Path('/private/tmp/wedding-v1088.TQDAlk/guided/alpha')
FFMPEG='/private/tmp/wedding-v1088.TQDAlk/libs/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1'

def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def smooth(p):
    p=np.clip(p,0.,1.)
    return p*p*p*(10+p*(-15+6*p))
def angle_at(t):return math.radians(165*float(smooth((t-.35)/1.90)))
def project(x,y,z):
    q=D/(D-z)
    return np.array([W/2+(x-W/2)*q,H/2+(y-H/2)*q],np.float64)
def point(u,v,angle,back=False):
    x=u*math.cos(angle);z=u*math.sin(angle)
    if back:x+=THICKNESS*math.sin(angle);z-=THICKNESS*math.cos(angle)
    return project(x,v,z)
def quad(angle,back=False):
    return np.float32([point(x,y,angle,back) for x,y in [(0,0),(W-1,0),(W-1,H-1),(0,H-1)]])

# Manually inspected palm landmarks. Linear interpolation is approximate,
# not a semantic hand tracker or proof that the fingers wrap around the card.
PALMS={60:(429,490),66:(378,499),72:(317,516),78:(296,520),84:(278,521),90:(264,522),96:(261,523)}
def palm(frame):
    keys=np.array(sorted(PALMS))
    return np.array([np.interp(frame,keys,[PALMS[k][j] for k in keys]) for j in [0,1]])

def main(work):
    work.mkdir(parents=True,exist_ok=True)
    cv.setNumThreads(2)
    inputs={str(p):digest(p) for p in [SOURCE,COVER,UNDER]}
    original=cv.imread(str(COVER));under_source=cv.imread(str(UNDER))
    cover=cv.resize(original,(W,H),interpolation=cv.INTER_AREA)
    # Match the existing page's contain/centre treatment; no crop of either
    # person. This is a poster-height laboratory viewport, NOT mobile DOM QA.
    under=np.full((H,W,3),(31,36,46),np.uint8)
    uh=round(under_source.shape[0]*W/under_source.shape[1]);uy=(H-uh)//2
    under[uy:uy+uh]=cv.resize(under_source,(W,uh),interpolation=cv.INTER_AREA)
    cv.imwrite(str(ROOT/'landing-reference.png'),under)
    cv.imwrite(str(ROOT/'initial-reference.png'),cover)
    source_quad=np.float32([[0,0],[W-1,0],[W-1,H-1],[0,H-1]])
    opaque=np.full((H,W),255,np.uint8)
    sheets=[];metrics=[];first=None;last=None
    sprites={f:cv.imread(str(ALPHA/f'frame-{f+1:03d}.png'),cv.IMREAD_UNCHANGED) for f in range(60,97)}
    actor_scale=W/438*.88
    for n in range(N):
        t=n/FPS;a=angle_at(t);q=quad(a);qb=quad(a,True)
        matrix=cv.getPerspectiveTransform(source_quad,q)
        # One homography for all text/photo pixels, never row-wise squeezing.
        base=under.copy()
        shade=np.zeros((H,W),np.uint8)
        if 0<a<math.pi/2:
            shadow_q=q.copy();shadow_q[:,0]+=12*math.sin(a)
            cv.fillConvexPoly(shade,np.rint(shadow_q).astype(np.int32),255)
            shade=cv.GaussianBlur(shade,(0,0),2+8*math.sin(a))
            base=np.uint8(base*(1-shade[:,:,None]/255*.20*math.sin(a)))
        # True cut-edge face between front and back planes, not a frame border.
        edge_poly=np.rint(np.array([q[1],qb[1],qb[2],q[2]])).astype(np.int32)
        cv.fillConvexPoly(base,edge_poly,(42,58,115),lineType=cv.LINE_AA)
        if math.cos(a)>1e-5:
            printed=cv.warpPerspective(cover,matrix,(W,H),flags=cv.INTER_LINEAR)
            coverage=cv.warpPerspective(opaque,matrix,(W,H),flags=cv.INTER_LINEAR)[:,:,None]/255
            # Very restrained uniform surface lighting; no face-specific edits.
            printed=printed.astype(np.float32)*(1-.10*math.sin(a)**2)
            base=np.uint8(np.clip(base*(1-coverage)+printed*coverage,0,255))
        elif np.max(qb[:,0])>=0:
            cv.fillConvexPoly(base,np.rint(qb).astype(np.int32),(32,37,116),lineType=cv.LINE_AA)
        paper=base.copy()
        f=min(96,60+max(0,int((t-.35)*FPS)))
        grip=palm(f)
        target=point(W-1,H*.465,a)
        # Translation/uniform scale only: source bodily movement remains baked.
        offset=target-grip*actor_scale
        trans=np.float32([[actor_scale,0,offset[0]],[0,actor_scale,offset[1]]])
        sprite=sprites[f];sa=sprite[:,:,3:4].astype(np.float32)/255
        # Premultiplication avoids a red halo being interpolated from hidden RGB.
        premul=sprite[:,:,:3].astype(np.float32)*sa
        rgb=cv.warpAffine(premul,trans,(W,H),flags=cv.INTER_LINEAR)
        alpha=cv.warpAffine(sa[:,:,0],trans,(W,H),flags=cv.INTER_LINEAR)[:,:,None]
        result=np.uint8(np.clip(base*(1-alpha)+rgb,0,255))
        # Pixel provenance of the selected palm, not merely a coordinate label.
        px,py=np.rint(grip).astype(int)
        palm_alpha=int(sprite[max(0,py-3):py+4,max(0,px-3):px+4,3].max())
        p0=point(W-1,0,a);p1=point(W-1,H-1,a);pm=point(W-1,H*.465,a)
        v1,v2=p1-p0,pm-p0
        edge_error=abs(float(v1[0]*v2[1]-v1[1]*v2[0]))/np.linalg.norm(v1)
        actual=grip*actor_scale+offset
        metrics.append({'frame':n,'time':t,'angleDegrees':math.degrees(a),'sourceFrame':f,
            'computedPalmTargetError':float(np.linalg.norm(actual-target)),
            'sourcePalmNeighbourhoodAlpha':palm_alpha,'straightEdgeError':edge_error,
            'visibleActorPixels':int(np.sum(alpha>.02)),'projectedEdgeX':float(target[0])})
        assert edge_error<1e-3
        if np.sum(alpha>.02)>0:assert palm_alpha>180
        if n==0:first=result.copy();assert np.array_equal(paper,cover)
        if n==N-1:last=result.copy();assert np.array_equal(result,under)
        # No titles/labels inside the artwork. Attribution goes in preview chrome.
        cv.imwrite(str(work/f'frame-{n+1:03d}.png'),result)
        if n in [0,19,27,34,42,77]:
            snap=result.copy()
            border=np.full((H+42,W,3),(26,25,24),np.uint8);border[42:]=snap
            cv.putText(border,f'{t:.2f}s / {math.degrees(a):.0f} deg',(12,26),cv.FONT_HERSHEY_SIMPLEX,.65,(236,226,210),1,cv.LINE_AA)
            sheets.append(border)
            cv.imwrite(str(ROOT/f'pose-{n:02d}.jpg'),border)
        if n%24==0:print(f'rendered {n+1}/{N}',flush=True)
    cv.imwrite(str(ROOT/'contact-sheet.jpg'),np.concatenate([np.concatenate(sheets[:3],axis=1),np.concatenate(sheets[3:],axis=1)]))
    subprocess.run([FFMPEG,'-hide_banner','-loglevel','error','-y','-framerate',str(FPS),'-i',str(work/'frame-%03d.png'),'-c:v','libx264','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',str(ROOT/'controlled-card.mp4')],check=True)
    cap=cv.VideoCapture(str(ROOT/'controlled-card.mp4'));count=0
    assert cap.get(cv.CAP_PROP_FPS)==FPS
    while True:
        ok,im=cap.read()
        if not ok:break
        count+=1;assert im.shape==(H,W,3)
    cap.release();assert count==N
    assert inputs=={str(p):digest(p) for p in [SOURCE,COVER,UNDER]}
    report={'version':'10.93','frames':count,'fps':FPS,'duration':N/FPS,'size':[W,H],
        'sourceHashesUnchanged':inputs,'videoSHA256':digest(ROOT/'controlled-card.mp4'),
        'initialPaperExactlyEqualsResizedCover':True,'finalUncompressedFrameExactlyEqualsLandingReference':True,
        'singleHomographyForEntirePrint':True,'maxComputedPalmError':max(m['computedPalmTargetError'] for m in metrics),
        'maxStraightEdgeError':max(m['straightEdgeError'] for m in metrics),'frameMetrics':metrics,
        'limitations':['Old AI body motion remains. Selected palms are manually annotated, not verified finger gripping.',
            'Pair follows edge out to the LEFT solely to test card clearance; not the approved wait/handhold/fly-away choreography.',
            'Fine matte quality and source-occluded clothing remain limited.',
            'Landing is the existing image/contain treatment only, not full second-page DOM or mobile/WeChat validation.',
            'Initial test frame already includes actors; real website actor entrance is not implemented.'],
        'newGeneration':False,'deployed':False,'webIntegrationVerified':False}
    (ROOT/'verification.json').write_text(json.dumps(report,indent=2))
    print(json.dumps({k:v for k,v in report.items() if k!='frameMetrics'},indent=2))

if __name__=='__main__':main(Path(sys.argv[1]))
