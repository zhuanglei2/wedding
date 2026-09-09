"""Coordinate-labelled source crops for manual matte inspection."""
import sys
from pathlib import Path
sys.path.insert(0,'/private/tmp/wedding-v1088.TQDAlk/libs')
import cv2 as cv
import numpy as np
root=Path(__file__).resolve().parent
cap=cv.VideoCapture(str(root.parent/'v10.95-layer-proof/source-v1094.mp4'))
panels=[]
for f in [0,12,24,36,48,72,96]:
    cap.set(cv.CAP_PROP_POS_FRAMES,f);ok,im=cap.read();assert ok
    crop=im[270:445,390:525].copy()
    for x in range(400,521,20):
        cv.line(crop,(x-390,0),(x-390,174),(90,90,90),1)
        cv.putText(crop,str(x),(x-390,10),0,.25,(255,255,255),1)
    for y in range(280,441,20):
        cv.line(crop,(0,y-270),(134,y-270),(90,90,90),1)
        cv.putText(crop,str(y),(0,y-270),0,.25,(255,255,255),1)
    crop=cv.resize(crop,(270,350),interpolation=cv.INTER_NEAREST)
    cv.putText(crop,f'frame {f}',(10,330),0,.6,(255,255,255),1)
    panels.append(crop)
cv.imwrite(str(Path(sys.argv[1])/'head-grid.jpg'),np.concatenate(panels,axis=1))
