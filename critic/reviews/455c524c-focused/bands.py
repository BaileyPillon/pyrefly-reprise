import json,sys,numpy as np
from PIL import Image
def prof(p):
    im=np.asarray(Image.open(p).convert('L'),dtype=float);return im
out={}
for d,tag in [('1600x900','cand'),('2000x1012','cand'),('1280x1024','cand'),('390x844','cand'),('live-1600x900','live')]:
    idx=json.load(open(f'cam/{d}/{tag}-index.json'))['frames']
    rows=[]
    for f in idx:
        im=prof(f'cam/{d}/{f["f"]}');H,W=im.shape
        col=im[int(H*.15):int(H*.85)].mean(axis=0)
        # slab = edge column strip clearly darker than a reference strip 25-35% in from the edge
        def slab(side):
            seg=col[:int(W*.30)] if side=='L' else col[int(W*.70):][::-1]
            ref=seg[int(W*.20):int(W*.30)].mean()
            dark=seg[:int(W*.20)]<ref*0.45
            # longest run of dark columns
            best=r=0
            for v in dark:
                r=r+1 if v else 0;best=max(best,r)
            return best/W
        rows.append((f['s'],slab('L'),slab('R')))
    a=np.array(rows)
    out[d]={'frames':len(rows),'maxL':float(a[:,1].max()),'maxR':float(a[:,2].max()),'framesOver3pct':int(((a[:,1]>.03)|(a[:,2]>.03)).sum())}
    print(d,out[d])
json.dump(out,open('cam/bands.json','w'),indent=1)
