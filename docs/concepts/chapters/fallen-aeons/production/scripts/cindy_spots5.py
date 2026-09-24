# Cindy idle clean pass: six pale dots on the picked render's red shell spots (ellipses found by eye at 2x) are filled by
# diffusion from the red-hued pixels around them only (never from the blue shell or the grey rim), so the shell reads as
# red spots on blue (visual-bible 1.22.6). Pixel repair only, no GPU; every pixel outside the dots is the picked render's.
import numpy as np, sys, json
from PIL import Image, ImageDraw
from scipy import ndimage
src,dst,spec=sys.argv[1],sys.argv[2],sys.argv[3]
dots=json.loads(spec)
im=Image.open(src).convert('RGBA'); A=np.asarray(im).astype(np.float32)
rgb=A[...,:3]; al=A[...,3]; H,W=al.shape
r,g,b=rgb[...,0],rgb[...,1],rgb[...,2]
redhue=(r>g+50)&(r>b+30)&(al>200)
m=Image.new('L',(W,H),0); d=ImageDraw.Draw(m)
for x,y,rx,ry in dots: d.ellipse((x-rx,y-ry,x+rx,y+ry),fill=255)
e=np.asarray(m)>0
blue=(b>r+55)&(b>g+40)&(al>120)
hole=ndimage.binary_dilation(e&~redhue&~blue&(al>120),iterations=2)&ndimage.binary_dilation(e,iterations=2)&(al>120)&~ndimage.binary_dilation(blue,iterations=1)
known=redhue&~hole
out=rgb.copy(); k0=known.copy()
for it in range(1500):
    s=ndimage.uniform_filter(out*k0[...,None],size=(3,3,1)); k=ndimage.uniform_filter(k0.astype(np.float32),size=3)
    upd=hole&~k0&(k>0.001)
    if not upd.any(): break
    out[upd]=s[upd]/k[upd][:,None]; k0=k0|upd
# relax inside the hole (harmonic smoothing with the red boundary held fixed)
for it in range(200):
    w=(hole|redhue).astype(np.float32); s=ndimage.uniform_filter(out*w[...,None],size=(3,3,1)); kw=ndimage.uniform_filter(w,size=3); out[hole]=s[hole]/kw[hole][:,None]
res=np.concatenate([np.clip(out,0,255),al[...,None]],-1).astype(np.uint8)
Image.fromarray(res,'RGBA').save(dst)
Image.fromarray((hole*255).astype(np.uint8)).save(dst[:-4]+'-changed.png')
print('changed px',int(hole.sum()),'unfilled',int((hole&~k0).sum()))
