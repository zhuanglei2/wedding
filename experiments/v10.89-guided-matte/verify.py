import sys,json,hashlib
from pathlib import Path
sys.path.insert(0,'/private/tmp/wedding-v1088.TQDAlk/libs')
import cv2 as cv
import numpy as np
root=Path(__file__).resolve().parent
frames=Path(sys.argv[1]);out=Path(sys.argv[2])
source=Path('/Users/eleme/Downloads/PixVerse_V6_Image_Text_540P_One_continuous_fou.mp4')
rgb_equal=True;stats=[];previous=None
for f in range(97):
    im=cv.imread(str(frames/f'frame-{f+1:03d}.png'))
    rgba=cv.imread(str(out/'alpha'/f'frame-{f+1:03d}.png'),cv.IMREAD_UNCHANGED)
    rgb_equal=rgb_equal and np.array_equal(im,rgba[:,:,:3])
    a=rgba[:,:,3];area=int(np.sum(a>127))
    stats.append({'frame':f,'area':area,'relativeAreaChange':None if previous is None else round((area-previous)/previous,5)})
    previous=area
# These inspected patches sit INSIDE the opaque dress. They are not whole-mask
# ground truth and do not evaluate edges, veil transparency or all frames.
probes={0:(410,582,434,605),36:(410,587,432,610),60:(326,588,350,612),96:(198,590,220,613)}
probe_results=[]
for f,(x1,y1,x2,y2) in probes.items():
    im=cv.imread(str(frames/f'frame-{f+1:03d}.png')).astype(np.float32)
    b,g,r=cv.split(im)
    eligible=(((r>60)&(r>g*1.45)&(g>b*1.08)&(b<95)) | (np.sqrt((r-220)**2+(g-213)**2+(b-196)**2)<28)).astype(np.uint8)
    _,labels=cv.connectedComponents(eligible)
    boundary=np.unique(np.concatenate([labels[0,:],labels[-1,:],labels[:,0],labels[:,-1]]))
    boundary=boundary[boundary>0]
    old=~np.isin(labels,boundary)
    new=cv.imread(str(out/'alpha'/f'frame-{f+1:03d}.png'),cv.IMREAD_UNCHANGED)[:,:,3]
    probe_results.append({'frame':f,'rect':[x1,y1,x2,y2],'oldOpaqueFraction':float(old[y1:y2,x1:x2].mean()),'newOpaqueFraction':float((new[y1:y2,x1:x2]==255).mean())})
report={'version':'10.89','sourceSHA256':hashlib.sha256(source.read_bytes()).hexdigest(),'frameCount':97,'RGBIdenticalToDecodedSource':bool(rgb_equal),'dressInteriorProbes':probe_results,'largestAreaChanges':sorted(stats[1:],key=lambda x:abs(x['relativeAreaChange']),reverse=True)[:10],'creditsConsumed':0,'deployed':False,'limitations':['Guided GrabCut, not semantic AI matting or ground-truth segmentation.','Fine red fringe and temporal edge quality require further mobile assessment.','Source paper occludes the right side of the dress near the end; missing pixels are not recreated.','Hand-to-card contact and full-card turn remain unresolved.']}
(root/'verification.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
