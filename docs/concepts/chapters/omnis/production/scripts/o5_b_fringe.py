"""O-5 B alternative (FFX only): peel the pale fringe of the b1 matte, the same step 3 as repair.py."""
import numpy as np, json, hashlib
from PIL import Image, ImageFilter
from scipy import ndimage as ndi
p=np.array(Image.open('D:/Tools/pyrefly-scratch/ch1215/omnis-repair/art/o5-b1.matte.png').convert('RGBA')).astype(float); rgb=p[...,:3]; al=p[...,3]>127
def halo(rgb,al):
    er=lambda s: np.array(Image.fromarray((al*255).astype(np.uint8)).filter(ImageFilter.MinFilter(s)))>127
    edge=al&~er(3); inner=er(7); lum=rgb@[0.299,0.587,0.114]
    ls=ndi.uniform_filter(lum*inner,9); ms=ndi.uniform_filter(inner.astype(float),9); ok=ms*81>0.5
    inter=np.where(ok,ls/np.maximum(ms,1e-9),0)
    fr=np.zeros_like(al); fr[0,:]=fr[-1,:]=fr[:,0]=fr[:,-1]=True
    return edge&ok&(lum>inter+50)&~fr, edge&ok
h,e=halo(rgb,al); b=h.sum()/e.sum(); al&=~h
h2,_=halo(rgb,al)
inner=np.array(Image.fromarray((al*255).astype(np.uint8)).filter(ImageFilter.MinFilter(7)))>127
cs=np.stack([ndi.uniform_filter(rgb[...,c]*inner,9) for c in range(3)],-1); cm=ndi.uniform_filter(inner.astype(float),9)
rgb[h2]=(cs/np.maximum(cm,1e-9)[...,None])[h2]
l4,n4=ndi.label(~al); b4=set(np.unique(np.concatenate([l4[0],l4[-1],l4[:,0],l4[:,-1]])))-{0}; s4=ndi.sum(~al,l4,range(1,n4+1))
al|=np.isin(l4,[i+1 for i,s in enumerate(s4) if s<10 and (i+1) not in b4])
l3,n3=ndi.label(al,structure=np.ones((3,3))); s3=ndi.sum(al,l3,range(1,n3+1)); al&=~np.isin(l3,[i+1 for i,s in enumerate(s3) if s<40])
out=np.zeros(p.shape,np.uint8); out[...,:3]=np.where(al[...,None],np.clip(np.rint(rgb),0,255),0); out[...,3]=np.where(al,255,0)
Image.fromarray(out).save('D:/Tools/pyrefly-scratch/ch1215/omnis-repair/art/o5-b1.png')
white=(out[...,:3].min(2)>235)&(out[...,3]>0); wl,wn=ndi.label(white)
print(json.dumps({'haloBefore':round(float(b),4),'islands':int(ndi.label(al,structure=np.ones((3,3)))[1]),'whiteComps':sorted([int(x) for x in ndi.sum(white,wl,range(1,wn+1))],reverse=True)[:4],'sha256':hashlib.sha256(open('D:/Tools/pyrefly-scratch/ch1215/omnis-repair/art/o5-b1.png','rb').read()).hexdigest()}))
