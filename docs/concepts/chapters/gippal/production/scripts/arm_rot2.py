# Derived cast (method r3 rig derive): rotate one forearm of a clean idle about its elbow, using the idle's own pixels.
# The vacated pixels are pre-filled by diffusion from the surrounding body (guide for the seam repaint).
# Usage: arm_rot.py in.png out.png '{"poly":[[x,y],...],"pivot":[x,y],"ang":deg,"pad":[l,t]}'
import numpy as np, sys, json
from PIL import Image, ImageDraw
from scipy import ndimage
inp,out,spec=sys.argv[1],sys.argv[2],json.loads(sys.argv[3])
pl,pt=spec.get('pad',[150,200])
src=Image.open(inp).convert('RGBA'); W,H=src.width+2*pl,src.height+pt+50
im=Image.new('RGBA',(W,H),(0,0,0,0)); im.paste(src,(pl,pt),src)
poly=[(x+pl,y+pt) for x,y in spec['poly']]; E=(spec['pivot'][0]+pl,spec['pivot'][1]+pt)
pm=Image.new('L',(W,H),0); ImageDraw.Draw(pm).polygon(poly,fill=255); fm=np.asarray(pm)>0
A=np.asarray(im).astype(np.float32)
fore=A.copy(); fore[...,3]=np.where(fm,fore[...,3],0)
rest=A.copy(); rest[...,3]=np.where(fm,0,rest[...,3])
# vacated: inside polygon, where the body continues behind (fill from rest body pixels by diffusion)
body=rest[...,3]>200
hullm=ndimage.binary_fill_holes(ndimage.binary_closing(body|fm,iterations=6))
xs=np.arange(W)[None,:]-pl; vac=fm&hullm&(A[...,3]>30)&(xs>=spec.get("vacX",-9999))
# keep vacated pixels only where they are enclosed by body (not open background on the outer side)
known=body.copy(); col=rest[...,:3].copy()
for it in range(3000):
    s=ndimage.uniform_filter(col*known[...,None],size=(3,3,1)); k=ndimage.uniform_filter(known.astype(np.float32),size=3)
    upd=vac&~known&(k>0.001)
    if not upd.any(): break
    col[upd]=s[upd]/k[upd][:,None]; known|=upd
restF=rest.copy(); restF[...,:3]=np.where(vac[...,None],col,rest[...,:3]); restF[...,3]=np.where(vac,255,rest[...,3])
foreI=Image.fromarray(fore.astype(np.uint8),'RGBA').rotate(spec['ang'],resample=Image.BICUBIC,center=E)
res=Image.alpha_composite(Image.fromarray(restF.astype(np.uint8),'RGBA'),foreI)
res.save(out)
vm=ndimage.binary_dilation(vac,iterations=4)
Image.fromarray((vm*255).astype(np.uint8)).save(out[:-4]+'-vac.png')
jm=Image.new('L',(W,H),0); r=spec.get('jointR',30); ImageDraw.Draw(jm).ellipse((E[0]-r,E[1]-r,E[0]+r,E[1]+r),fill=255)
Image.fromarray(((np.asarray(jm)>0)|vm).astype(np.uint8)*255).save(out[:-4]+'-mask.png')
print(out,res.size,'vac',int(vac.sum()),'pivot',E)
