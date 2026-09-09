import sys,json,subprocess,hashlib
from pathlib import Path
sys.path.insert(0,'/private/tmp/wedding-v1088.TQDAlk/libs')
import cv2 as cv
import numpy as np
root=Path(__file__).resolve().parent
ffmpeg=sys.argv[1];work=Path(sys.argv[2])
raw=subprocess.run([ffmpeg,'-hide_banner','-loglevel','error','-i',str(root/'character-mask.mkv'),'-f','rawvideo','-pix_fmt','gray','pipe:1'],check=True,capture_output=True).stdout
assert len(raw)==97*576*1024
frames=np.frombuffer(raw,dtype=np.uint8).reshape(97,1024,576)
for f,a in enumerate(frames):
    original=cv.imread(str(work/'alpha'/f'frame-{f+1:03d}.png'),cv.IMREAD_UNCHANGED)[:,:,3]
    assert np.array_equal(a,original),f'alpha mismatch at {f}'
cap=cv.VideoCapture(str(root/'guided-matte-comparison.mp4'))
fps=cap.get(cv.CAP_PROP_FPS);count=0
while True:
    ok,im=cap.read()
    if not ok:break
    assert im.shape==(466,1050,3)
    count+=1
cap.release()
assert count==97 and fps==24
report={'previewDecodedFrames':count,'fps':fps,'size':[1050,466],'losslessMaskFrames':len(frames),'allMaskPixelsMatchWorkingAlpha':True,'previewSHA256':hashlib.sha256((root/'guided-matte-comparison.mp4').read_bytes()).hexdigest(),'maskSHA256':hashlib.sha256((root/'character-mask.mkv').read_bytes()).hexdigest()}
(root/'encode-verification.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
