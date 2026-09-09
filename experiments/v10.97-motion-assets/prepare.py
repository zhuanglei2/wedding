"""Freeze existing video layers and source-pose evidence. No new animation."""
import sys,json,hashlib,subprocess
from pathlib import Path
sys.path.insert(0,'/private/tmp/wedding-v1088.TQDAlk/libs')
import cv2 as cv
import numpy as np
ROOT=Path(__file__).resolve().parent
SOURCE=ROOT.parent/'v10.95-layer-proof/source-v1094.mp4'
FF='/private/tmp/wedding-v1088.TQDAlk/libs/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1'
W,H,FPS,N=592,1024,24,97
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def main(work):
    matte=work/'mattes';frames=work/'asset-review';frames.mkdir(exist_ok=True)
    source_hash=sha(SOURCE);cap=cv.VideoCapture(str(SOURCE));sheets=[]
    for i in range(N):
        ok,im=cap.read();assert ok
        boy=cv.imread(str(matte/'boy'/f'{i:03d}.png'),cv.IMREAD_UNCHANGED)
        girl=cv.imread(str(matte/'girl'/f'{i:03d}.png'),cv.IMREAD_UNCHANGED)
        for rgba in [boy,girl]:assert np.array_equal(rgba[:,:,:3],im)
        alpha=np.maximum(boy[:,:,3],girl[:,:,3]).astype(np.float32)/255
        out=np.uint8(im*alpha[:,:,None]+np.array([42,36,30])*(1-alpha[:,:,None]))
        panel=np.full((1060,1184,3),25,np.uint8)
        panel[36:,:592]=im;panel[36:,592:]=out
        cv.putText(panel,f'ORIGINAL | {i/24:.2f}s',(12,25),0,.6,(230,230,230),1,cv.LINE_AA)
        cv.putText(panel,'EXTRACTED | no added motion',(610,25),0,.6,(230,230,230),1,cv.LINE_AA)
        cv.imwrite(str(frames/f'{i:03d}.png'),panel)
        if i==24:
            cv.imwrite(str(ROOT/'reference-source-f024.png'),im)
            assert np.array_equal(cv.imread(str(ROOT/'reference-source-f024.png')),im)
        if i in [0,18,24,36,60,96]:
            crop=im[260:735,280:525]
            shot=np.full((505,245,3),25,np.uint8);shot[30:]=crop
            cv.putText(shot,f'F{i:03d} / {i/24:.2f}s',(10,21),0,.45,(230,230,230),1,cv.LINE_AA)
            sheets.append(shot)
    assert not cap.read()[0];cap.release()
    cv.imwrite(str(ROOT/'source-poses.jpg'),np.concatenate([np.concatenate(sheets[:3],axis=1),np.concatenate(sheets[3:],axis=1)]))
    layer_checks={}
    for name in ['boy','girl']:
        path=ROOT/f'{name}-rgba.mkv'
        subprocess.run([FF,'-v','error','-y','-framerate','24','-i',str(matte/name/'%03d.png'),'-c:v','ffv1','-level','3','-pix_fmt','bgra',str(path)],check=True)
        # Exact RGBA roundtrip, not OpenCV's alpha-discarding VideoCapture.
        proc=subprocess.Popen([FF,'-v','error','-i',str(path),'-f','rawvideo','-pix_fmt','bgra','pipe:1'],stdout=subprocess.PIPE)
        for i in range(N):
            chunks=[];remaining=W*H*4
            while remaining:
                chunk=proc.stdout.read(remaining);assert chunk
                chunks.append(chunk);remaining-=len(chunk)
            rgba=np.frombuffer(b''.join(chunks),np.uint8).reshape(H,W,4)
            assert np.array_equal(rgba,cv.imread(str(matte/name/f'{i:03d}.png'),cv.IMREAD_UNCHANGED))
        assert proc.stdout.read()==b'';assert proc.wait()==0
        layer_checks[name]={'frames':N,'size':[W,H],'format':'FFV1 BGRA','exactRGBA':True,'sha256':sha(path)}
    out=ROOT/'source-layer-review.mp4'
    subprocess.run([FF,'-v','error','-y','-framerate','24','-i',str(frames/'%03d.png'),'-c:v','libx264','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',str(out)],check=True)
    cap=cv.VideoCapture(str(out));count=0
    assert cap.get(cv.CAP_PROP_FPS)==24
    while True:
        ok,im=cap.read()
        if not ok:break
        count+=1;assert im.shape==(1060,1184,3)
    cap.release();assert count==N;assert sha(SOURCE)==source_hash
    report={'version':'10.97','type':'existing_asset_freeze_and_generation_draft','sourceSHA256':source_hash,
        'frames':N,'fps':FPS,'duration':N/FPS,'layers':layer_checks,
        'sourceFrameReference':24,'referenceExactDecodedSourcePixels':True,
        'reviewSHA256':sha(out),'newMotionGenerated':False,'submitted':False,'deployed':False,
        'important':'Lossless RGBA storage does not certify segmentation or natural gripping.'}
    (ROOT/'verification.json').write_text(json.dumps(report,indent=2))
    print(json.dumps(report,indent=2))
if __name__=='__main__':main(Path(sys.argv[1]))
