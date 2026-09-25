"""Living portrait v6 full (both): the v5.1 judge's throat line, found per frame (page scale).

A thin horizontal line across the throat (canvas y 800-860, x 380-620, mapped onto the page by the capture's canvas box): in
every row, each pixel minus the mean of the rows 2 above and 2 below; a frame is flagged when one row has a run of 40 page px
(about 65 canvas px) of the same sign beyond 2.5 levels.

    python throat.py <frames dir> <log json with the canvas box> <out .npy>
"""
import json, sys, numpy as np
from PIL import Image
def detect(frames_dir, box, n):
    sx=box['width']/832; sy=box['height']/1216
    y0=int(box['y']+800*sy); y1=int(box['y']+860*sy); x0=int(box['x']+380*sx); x1=int(box['x']+620*sx)
    res=[]
    for i in range(n):
        g=np.asarray(Image.open(f'{frames_dir}/{i:05d}.png').convert('L')).astype(np.float32)
        band=g[y0-2:y1+2, x0:x1]
        d=band[2:-2]-(band[:-4]+band[4:])/2
        best=0
        for r in d:
            for sgn in (1,-1):
                m=np.concatenate([[0],((sgn*r)>2.5).astype(int),[0]])
                e=np.flatnonzero(np.diff(m)); runs=e[1::2]-e[::2]
                if len(runs): best=max(best,runs.max())
        res.append(int(best))
    return np.array(res)
if __name__=='__main__':
    L=json.load(open(sys.argv[2])); r=detect(sys.argv[1], L['box'], len(L['frames'])); np.save(sys.argv[3], r)
    print('frames', len(r), 'run>=40 page px', int((r>=40).sum()), '>=60', int((r>=60).sum()), 'median', float(np.median(r)), 'max', int(r.max()))
