# Mindy clean pass step 3: close the notch the glove left in the moved abdomen. Inside the abdomen's convex hull,
# transparent pixels are filled by diffusion from the abdomen's own opaque pixels; the caller then repaints only that
# patch at low denoise and re-derives its alpha.
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage
from scipy.spatial import ConvexHull
a=Image.open('work/mindy-idle-a.png').convert('RGBA'); A=np.asarray(a).astype(np.float32)
H,W=A.shape[:2]; yy,xx=np.mgrid[0:H,0:W]
r,g,b,al=[A[...,i] for i in range(4)]
yel=(r>170)&(g>110)&(b<110)&(r-b>90)&(al>200)&(xx>330)&(xx<640)&(yy>540)&(yy<760)
lab,n=ndimage.label(yel); sz=ndimage.sum(yel,lab,range(1,n+1)); keep=np.isin(lab,[i+1 for i,s in enumerate(sz) if s>300])
ys,xs=np.nonzero(keep); pts=np.stack([xs,ys],1); hull=ConvexHull(pts)
m=Image.new('L',(W,H),0); ImageDraw.Draw(m).polygon([tuple(map(float,pts[v])) for v in hull.vertices],fill=255)
hm=np.asarray(m)>0
notch=hm&(al<200)&(xx>370)
known=hm&(al>=200)&~notch
out=A[...,:3].copy(); k0=known.copy()
for it in range(3000):
    s=ndimage.uniform_filter(out*k0[...,None],size=(3,3,1)); k=ndimage.uniform_filter(k0.astype(np.float32),size=3)
    upd=notch&~k0&(k>0.001)
    if not upd.any(): break
    out[upd]=s[upd]/k[upd][:,None]; k0|=upd
res=A.copy(); res[...,:3]=np.where(notch[...,None],out,A[...,:3]); res[...,3]=np.where(notch,255,al)
Image.fromarray(res.astype(np.uint8),'RGBA').save('work/mindy-notch-guide.png')
mm=ndimage.binary_dilation(notch,iterations=6)
Image.fromarray((mm*255).astype(np.uint8)).save('work/mindy-notch-mask.png')
Image.fromarray((ndimage.binary_dilation(notch,iterations=14)*255).astype(np.uint8)).save('work/mindy-notch-region.png')
print('notch px',int(notch.sum()))
