"""Diagnostic texture replacement in existing footage, NOT a finished page turn.

No image generation: the original invitation is sampled as a static texture.
Two deliberately labelled hypotheses test an untextured/non-rigid AI surface.
The boundary fit is NOT a recovered 3-D surface or optical texture tracking.
"""
import sys, json, hashlib, subprocess
from pathlib import Path
sys.path.insert(0, '/private/tmp/wedding-v1088.TQDAlk/libs')
import cv2 as cv
import numpy as np

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[1]
WORK = Path(sys.argv[1])
FRAMES = Path('/private/tmp/wedding-v1088.TQDAlk/frames')
ALPHA = Path('/private/tmp/wedding-v1088.TQDAlk/guided/alpha')
SOURCE = Path('/Users/eleme/Downloads/PixVerse_V6_Image_Text_540P_One_continuous_fou.mp4')
COVER = REPO/'versions/v10.71-collar-and-motion/cover.webp'
FFMPEG = '/private/tmp/wedding-v1088.TQDAlk/libs/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1'
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
before = {str(p):sha(p) for p in [SOURCE,COVER]}
for name in ['compare','follow','flat']:
    (WORK/name).mkdir(parents=True,exist_ok=True)
cv.setNumThreads(2)
cover = cv.imread(str(COVER))
assert cover.shape == (3282,1400,3)
frames = [cv.imread(str(FRAMES/f'frame-{i+1:03d}.png')) for i in range(97)]
alphas = [cv.imread(str(ALPHA/f'frame-{i+1:03d}.png'),cv.IMREAD_UNCHANGED)[:,:,3] for i in range(97)]
assert all(f.shape==(1024,576,3) for f in frames)
yy,xx = np.mgrid[:1024,:576].astype(np.float32)
lefts=[]; rights=[]; rejected=[]
for im,alpha in zip(frames,alphas):
    b,g,r=cv.split(im.astype(np.float32))
    red=(r>45)&(r>g*1.65)&(r>b*1.9)&(b<110)
    red[:,:45]=False;red[:,545:]=False
    left=np.argmax(red,axis=1).astype(float)
    right=(575-np.argmax(red[:,::-1],axis=1)).astype(float)
    valid=red.sum(axis=1)>80
    valid[:65]=False;valid[-10:]=False
    # A character obscuring the edge is not a surface tracking feature.
    edge_near=np.abs(xx-right[:,None])<16
    valid &= ~np.any(edge_near & (alpha>20),axis=1)
    rejected.append(int(np.sum(~valid)))
    rows=np.arange(1024)
    right=np.interp(rows,rows[valid],right[valid])
    right=cv.GaussianBlur(right[:,None],(1,21),4)[:,0]
    left[:]=np.median(left[valid])
    lefts.append(left);rights.append(right)
# Symmetric five-frame averaging damps codec noise, not a claim of physical motion.
rights=np.array(rights);lefts=np.array(lefts)
rights=np.stack([rights[max(0,i-2):min(97,i+3)].mean(0) for i in range(97)])
metrics=[];sheet=[]
for i,(im,alpha,left,right) in enumerate(zip(frames,alphas,lefts,rights)):
    # A rigid projected edge must be a straight line. Top/bottom visible bands
    # constrain the baseline; the centre visibly violates that hypothesis.
    ys=np.r_[np.arange(80,150),np.arange(900,1000)]
    fit=np.polyval(np.polyfit(ys,right[ys],1),np.arange(1024))
    baseline_width=float(np.median(fit-left))
    left0=float(np.median(left))
    # Full invitation, no crop, uniform scale: retain its exact input aspect.
    mapped_height=baseline_width*cover.shape[0]/cover.shape[1]
    top=(1024-mapped_height)/2
    map_y=((yy-top)/mapped_height*(cover.shape[0]-1)).astype(np.float32)
    flat_x=((xx-left0)/baseline_width*(cover.shape[1]-1)).astype(np.float32)
    follow_x=((xx-left[:,None])/(right-left)[:,None]*(cover.shape[1]-1)).astype(np.float32)
    # Actual visible red silhouette, plus an existing foreground character matte.
    coverage=np.clip(np.minimum(xx-left[:,None]+.5,right[:,None]-xx+.5),0,1)
    coverage *= ((map_y>=0)&(map_y<=cover.shape[0]-1))
    a=alpha[:,:,None].astype(np.float32)/255
    outputs=[]
    for uv in [flat_x,follow_x]:
        texture=cv.remap(cover,uv,map_y,cv.INTER_LINEAR,borderMode=cv.BORDER_CONSTANT)
        comp=im*(1-coverage[:,:,None])+texture*coverage[:,:,None]
        comp=comp*(1-a)+im*a
        outputs.append(np.clip(comp,0,255).astype(np.uint8))
    # Keep pale source watermark glyphs, not an opaque rectangle of old red.
    for out in outputs:
        glyph=im[:65,400:].min(axis=2)>140
        out[:65,400:][glyph]=im[:65,400:][glyph]
        cv.putText(out,'PixVerse footage / LOCAL TEST',(10,1010),cv.FONT_HERSHEY_SIMPLEX,.43,(255,255,255),1,cv.LINE_AA)
    flat,follow=outputs
    for name,output in [('flat',flat),('follow',follow)]:
        cv.imwrite(str(WORK/name/f'frame-{i+1:03d}.png'),output)
    canvas=np.full((700,1080,3),(27,25,25),np.uint8)
    for j,(panel,title) in enumerate(zip([im,flat,follow],['SOURCE / PixVerse','A: FIXED PRINT + MASK','B: EDGE-FOLLOW WARP'])):
        canvas[38:678,j*360:(j+1)*360]=cv.resize(panel,(360,640),interpolation=cv.INTER_AREA)
        cv.putText(canvas,title,(j*360+10,25),cv.FONT_HERSHEY_SIMPLEX,.50,(235,235,235),1,cv.LINE_AA)
    cv.putText(canvas,f'{i/24:.3f}s | DIAGNOSTIC ONLY - not approved artwork / not a complete opening',(10,695),cv.FONT_HERSHEY_SIMPLEX,.42,(220,220,220),1,cv.LINE_AA)
    cv.imwrite(str(WORK/'compare'/f'frame-{i+1:03d}.png'),canvas)
    if i in [0,48,72,96]:sheet.append(canvas)
    metrics.append({'frame':i,'seconds':i/24,'maxEdgeDeparturePx':float(np.max(np.abs(right-fit))),
                    'minWidthFraction':float(np.min((right-left)/baseline_width)),
                    'interpolatedRows':rejected[i]})
    if i%24==0: print(f'composited {i+1}/97',flush=True)
cv.imwrite(str(ROOT/'contact-sheet.jpg'),np.concatenate(sheet))
np.savez_compressed(ROOT/'boundary-estimates.npz',left=lefts,right=rights)
for name,filename in [('compare','comparison.mp4'),('follow','edge-follow-test.mp4')]:
    subprocess.run([FFMPEG,'-hide_banner','-loglevel','error','-y','-framerate','24','-i',str(WORK/name/'frame-%03d.png'),'-c:v','libx264','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',str(ROOT/filename)],check=True)
assert before=={str(p):sha(p) for p in [SOURCE,COVER]}
checks={}
for filename in ['comparison.mp4','edge-follow-test.mp4']:
    cap=cv.VideoCapture(str(ROOT/filename));fps=cap.get(cv.CAP_PROP_FPS);n=0;size=None
    while True:
        ok,frame=cap.read()
        if not ok:break
        n+=1;size=list(frame.shape[1::-1])
    cap.release();assert n==97 and fps==24
    checks[filename]={'frames':n,'fps':fps,'size':size,'sha256':sha(ROOT/filename)}
(ROOT/'verification.json').write_text(json.dumps({'inputHashesUnchanged':before,'outputs':checks,'frames':metrics,
    'method':'Per-row colour boundary estimate, occlusion interpolation, V10.89 matte; NOT recovered UVs or 3-D tracking.',
    'webIntegrationVerified':False,'completeOpening':False,'newGeneration':False,'deployment':False},indent=2))
print(json.dumps({'outputs':checks,'lastFrame':metrics[-1]},indent=2))
