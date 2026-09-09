"""Bounded contact study on existing footage, not fabricated joint animation.

Independent actors, palm-pivot anticipation, delayed follower, local edge/mitten
occlusion. Stops at 48 degrees: do not claim full opening or final choreography.
"""
import sys,json,math,hashlib,subprocess,importlib.util
from pathlib import Path
sys.path.insert(0,'/private/tmp/wedding-v1088.TQDAlk/libs')
import cv2 as cv
import numpy as np
ROOT=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('geometry',ROOT.parent/'v10.95-layer-proof/render.py')
geo=importlib.util.module_from_spec(spec);spec.loader.exec_module(geo)
W,H,FPS,N=480,1126,24,78
geo.D=W*24
SCALE=.78

def ease(t,a,b):return float(geo.smooth((t-a)/(b-a)))
def angle(t):
    # Monotone cubic interpolation: heavy card starts reluctantly and settles.
    keys=[(.65,0.,0.),(.95,5.,28.),(1.4,33.,44.),(2.05,48.,0.)]
    if t<=keys[0][0]:return 0.
    if t>=keys[-1][0]:return math.radians(48)
    for (t0,y0,m0),(t1,y1,m1) in zip(keys,keys[1:]):
        if t0<=t<=t1:
            u=(t-t0)/(t1-t0);d=t1-t0
            return math.radians((2*u**3-3*u*u+1)*y0+(u**3-2*u*u+u)*d*m0+(-2*u**3+3*u*u)*y1+(u**3-u*u)*d*m1)

def transform(sprite,pivot,target,rotation,scale=SCALE):
    m=cv.getRotationMatrix2D(tuple(map(float,pivot)),rotation,scale)
    m[:,2]+=np.array(target)-pivot
    a=sprite[:,:,3].astype(np.float32)/255
    rgb=cv.warpAffine(sprite[:,:,:3].astype(np.float32)*a[:,:,None],m,(W,H))
    alpha=cv.warpAffine(a,m,(W,H))
    return rgb,alpha,m

def over(base,rgb,a):return np.clip(base*(1-a[:,:,None])+rgb,0,255)
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()

def main(work):
    cv.setNumThreads(2)
    frames=work/'frames';frames.mkdir(exist_ok=True)
    reviews=work/'reviews';reviews.mkdir(exist_ok=True)
    matte=work/'mattes'
    data=json.loads((ROOT/'matte-checks.json').read_text());grips=data['grips']
    sources=[geo.COVER,geo.UNDER,ROOT.parent/'v10.95-layer-proof/source-v1094.mp4']
    before={str(p):sha(p) for p in sources}
    cover=cv.resize(cv.imread(str(geo.COVER)),(W,H),interpolation=cv.INTER_AREA)
    under=np.full((H,W,3),(31,36,46),np.uint8)
    source=cv.imread(str(geo.UNDER));uh=round(source.shape[0]*W/source.shape[1]);uy=(H-uh)//2
    under[uy:uy+uh]=cv.resize(source,(W,uh),interpolation=cv.INTER_AREA)
    oq=np.float32([[0,0],[W-1,0],[W-1,H-1],[0,H-1]])
    sheets=[];details=[];metrics=[];previous=None
    for n in range(N):
        t=n/FPS;a=angle(t);q=geo.quad(a);qb=geo.quad(a,True)
        matrix=cv.getPerspectiveTransform(oq,q)
        paper=cv.warpPerspective(cover,matrix,(W,H)).astype(np.float32)
        coverage=cv.warpPerspective(np.full((H,W),255,np.uint8),matrix,(W,H)).astype(np.float32)/255
        shade=np.zeros((H,W),np.uint8)
        sq=q.copy();sq[:,0]+=9*math.sin(a)
        cv.fillConvexPoly(shade,np.rint(sq).astype(np.int32),255)
        shade=cv.GaussianBlur(shade,(0,0),3+5*math.sin(a))/255*.14*math.sin(a)
        base=under.astype(np.float32)*(1-shade[:,:,None])
        base=base*(1-coverage[:,:,None])+paper*(1-.055*math.sin(a)**2)*coverage[:,:,None]
        ptop=geo.point(W-1,0,a);pbot=geo.point(W-1,H-1,a)
        edge=np.zeros((H,W),np.uint8)
        cv.line(edge,tuple(np.rint(ptop).astype(int)),tuple(np.rint(pbot).astype(int)),255,2,cv.LINE_AA)
        base=base*(1-edge[:,:,None]/255*.7)+np.array([40,58,115])*edge[:,:,None]/255*.7
        # Both characters retain source video motion; neither body is segmented
        # into head/neck/clothes nor morphed. Additional rotation is a whole-body
        # acting cue only, not a newly articulated elbow or shoulder.
        bf=min(77,round(t*24));gf=max(0,min(77,round((t-.18)*24)))
        boy=cv.imread(str(matte/'boy'/f'{bf:03d}.png'),cv.IMREAD_UNCHANGED)
        girl=cv.imread(str(matte/'girl'/f'{gf:03d}.png'),cv.IMREAD_UNCHANGED)
        grip=np.array(grips[str(bf)])
        edge_target=geo.point(W-1,H*.43,a)
        # Source glove is ~17px wide. Put the free edge through its outer third;
        # the wrist remains on the card-facing side. No fake fingers are added.
        target=edge_target+np.array([-5.-8*(1-ease(t,0,.3)),0.])
        rot=5*ease(t,.30,.62)-11*ease(t,.65,1.5)+3*ease(t,1.8,2.6)
        br,ba,m=transform(boy,grip,target,rot)
        fy,fx=np.where(girl[:,:,3]>128)
        center=np.array([(fx.min()+fx.max())/2,(fy.min()+fy.max())/2])
        follow_angle=angle(t-.18)
        follow_edge=geo.point(W-1,H*.43,follow_angle)
        girl_target=np.array([W-110+(follow_edge[0]-(W-1))*.9,H*.58-6*ease(t,.83,1.7)])
        girl_rot=-3.5*ease(t,.83,1.6)+2*ease(t,1.9,2.8)
        gr,ga,_=transform(girl,center,girl_target,girl_rot,.70)
        base=over(base,gr,ga)
        # Small local contact shadow, bounded to card and near the glove.
        cx,cy=edge_target
        shadow=np.zeros((H,W),np.uint8)
        cv.ellipse(shadow,(round(cx-7),round(cy+3)),(8,6),0,0,360,255,-1)
        shadow=cv.GaussianBlur(shadow,(0,0),2)/255*.17*ease(t,0,.3)*coverage
        base*=1-shadow[:,:,None]
        result=over(base,br,ba)
        # Narrow cut-edge in front of the glove heel, while the outer mitten
        # tip stays in front. This is a 2.5D depth cue, not anatomical wrapping.
        contact=np.zeros((H,W),np.uint8)
        cv.line(contact,(round(cx),round(cy-6)),(round(cx),round(cy+5)),255,1,cv.LINE_AA)
        contact=contact/255*ba*ease(t,0,.3)*.8
        result=result*(1-contact[:,:,None])+np.array([48,72,142])*contact[:,:,None]
        result=np.uint8(np.clip(result,0,255))
        cv.imwrite(str(frames/f'{n:03d}.png'),result)
        actual=m[:,:2]@grip+m[:,2]
        if t>=.3:assert np.linalg.norm(actual-target)<1e-3
        # Tight contact view, sampled at the same timestamp as the full card.
        zoom=cv.warpAffine(result,np.float32([[3,0,240-3*cx],[0,3,225-3*cy]]),(480,450),borderValue=(31,36,46))
        panel=np.full((H,960,3),25,np.uint8);panel[:,:480]=result
        panel[70:520,480:]=zoom
        phase='CONTACT' if t<.3 else 'PRELOAD' if t<.65 else 'PULL' if t<2.05 else 'HOLD'
        for line,y in [(f'V10.96 / {phase}',35),(f'{t:.2f}s | card {math.degrees(a):.1f} deg',565),('Hand detail x3',605),('Girl follows 0.18s later',650),('48-degree contact study only',700),('No new generation / no deployment',745),('Whole-body pivot, not joint animation',790)]:
            cv.putText(panel,line,(495,y),0,.57,(220,218,206),1,cv.LINE_AA)
        cv.imwrite(str(reviews/f'{n:03d}.png'),panel)
        metrics.append({'frame':n,'time':t,'phase':phase,'cardAngleDegrees':math.degrees(a),'boyPivotDegrees':rot,
            'sourceFrames':[bf,gf],'palmTargetError':float(np.linalg.norm(actual-target)),
            'boyAlphaPixels':int((ba>.5).sum()),'girlAlphaPixels':int((ga>.5).sum()),
            'contactDepthPixels':int((contact>.05).sum()),'girlTarget':girl_target.tolist(),
            'cardEdge':edge_target.tolist()})
        if n in [0,9,15,25,38,77]:
            strip=np.full((H+36,W,3),25,np.uint8);strip[36:]=result
            cv.putText(strip,f'{t:.2f}s / {phase}',(12,25),0,.6,(230,230,230),1)
            sheets.append(cv.resize(strip,(320,round((H+36)*2/3))))
            details.append(zoom)
        if n%24==0:print(f'contact {n}/{N}',flush=True)
    cv.imwrite(str(ROOT/'contact-sheet.jpg'),np.concatenate([np.concatenate(sheets[:3],axis=1),np.concatenate(sheets[3:],axis=1)]))
    cv.imwrite(str(ROOT/'grip-sheet.jpg'),np.concatenate([np.concatenate(details[:3],axis=1),np.concatenate(details[3:],axis=1)]))
    outputs={}
    for folder,name,width in [(frames,'contact-study.mp4',480),(reviews,'contact-review.mp4',960)]:
        out=ROOT/name
        subprocess.run([geo.FFMPEG,'-hide_banner','-loglevel','error','-y','-framerate','24','-i',str(folder/'%03d.png'),'-c:v','libx264','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',str(out)],check=True)
        cap=cv.VideoCapture(str(out));assert cap.get(cv.CAP_PROP_FPS)==FPS;count=0
        while True:
            ok,im=cap.read()
            if not ok:break
            count+=1;assert im.shape==(H,width,3)
        cap.release();assert count==N
        outputs[name]={'frames':count,'size':[width,H],'sha256':sha(out)}
    assert before=={str(p):sha(p) for p in sources}
    assert all(x['cardAngleDegrees']==0 for x in metrics if x['time']<=.65)
    assert all(metrics[i+1]['cardAngleDegrees']>=metrics[i]['cardAngleDegrees'] for i in range(N-1))
    report={'version':'10.96','duration':N/FPS,'fps':FPS,'outputs':outputs,'unchangedInputHashes':before,
        'fullOpening':False,'webIntegrated':False,'newGeneration':False,'deployed':False,
        'contactAt':.3,'anticipationStarts':.3,'cardMovesAfter':.65,'followerDelay':.18,
        'maximumAngle':48,'wholePrintHomography':True,'frameMetrics':metrics,
        'limitations':['Existing video acting plus whole-body pivot; no new finger/elbow articulation.',
            'Local depth cue, not a reconstructed 3D hand. No release/handholding/flight.',
            'First actors already present. Matte silhouette still needs visual acceptance.']}
    (ROOT/'verification.json').write_text(json.dumps(report,indent=2))
    print(json.dumps({k:v for k,v in report.items() if k!='frameMetrics'},indent=2))

if __name__=='__main__':main(Path(sys.argv[1]))
