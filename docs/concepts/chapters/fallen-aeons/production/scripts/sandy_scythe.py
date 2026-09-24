# Sandy idle clean pass: move the picked render's own floating scythe onto her forearm (pixel transplant, no repaint).
import numpy as np, sys, json
from PIL import Image
from scipy import ndimage
src='D:/Tools/pyrefly-scratch/fallen-aeons-options/renders/sandy-a3.png'
s,ang,fx,fy,behind=float(sys.argv[1]),float(sys.argv[2]),float(sys.argv[3]),float(sys.argv[4]),sys.argv[5]=='behind'
out=sys.argv[6]
im=Image.open(src).convert('RGBA'); A=np.asarray(im)
a=A[...,3]>24
lab,n=ndimage.label(a); sizes=ndimage.sum(a,lab,range(1,n+1)); order=np.argsort(-sizes)
body_lab=order[0]+1; sc_lab=order[1]+1
scm=ndimage.binary_dilation(lab==sc_lab,iterations=3)&~ndimage.binary_dilation(lab==body_lab,iterations=1)
sc=A.copy(); sc[...,3]=np.where(scm,A[...,3],0)
body=A.copy(); body[...,3]=np.where(scm,0,A[...,3])
M=(290,125)
W,H=1000,1300; PADX,PADY=0,0
scI=Image.new("RGBA",(1400,1600),(0,0,0,0)); scI.paste(Image.fromarray(sc,"RGBA"),(0,0))
# rotate about mount then scale
scI=scI.rotate(ang,resample=Image.BICUBIC,center=M,expand=False)
scI=scI.resize((round(scI.width*s),round(scI.height*s)),Image.LANCZOS)
canvas=Image.new('RGBA',(W,H),(0,0,0,0))
bodyI=Image.fromarray(body,'RGBA')
off=(round(fx-M[0]*s),round(fy-M[1]*s))
layer=Image.new('RGBA',(W,H),(0,0,0,0)); layer.paste(scI,off,scI)
bl=Image.new('RGBA',(W,H),(0,0,0,0)); bl.paste(bodyI,(0,0),bodyI)
if behind: canvas=Image.alpha_composite(layer,bl)
else: canvas=Image.alpha_composite(bl,layer)
bb=canvas.getchannel('A').point(lambda v:255 if v>8 else 0).getbbox()
c=canvas.crop((bb[0]-16,bb[1]-16,bb[2]+16,bb[3]+16))
c.save(out)
g=Image.new('RGBA',c.size,(120,120,128,255)); g.alpha_composite(c); g.convert('RGB').save(out[:-4]+'-look.jpg',quality=92)
print(out,c.size,'offset',off,'bbox',bb)
