from PIL import Image, ImageFilter; import numpy as np
bd=Image.open('D:/Final Fantasy/public/art/backdrops/ff7-sector1-reactor.png').convert('RGB')
sx,sy,ox,oy=0.605,0.61,12,286
B=np.asarray(bd.resize((int(2688*sx),int(1536*sy)),Image.LANCZOS),dtype=np.float32)
P0=np.zeros((900,1600,3),np.float32); c=B[oy:oy+900, ox:ox+1600]; P0[:c.shape[0],:c.shape[1]]=c
def fit(frame, m):
    F=np.asarray(frame,dtype=np.float32); out=P0.copy()
    for k in range(3):
        a,b=np.polyfit(P0[...,k][m],F[...,k][m],1); out[...,k]=a*P0[...,k]+b
    return F,np.clip(out,0,255)
def mask_of(F,P,rect,thr=38):
    x0,y0,x1,y1=rect
    d=np.abs(F-P).max(axis=2); d=np.asarray(Image.fromarray(np.clip(d,0,255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2)),dtype=np.float32)
    m=np.zeros(d.shape,np.uint8); sub=(d[y0:y1,x0:x1]>thr); m[y0:y1,x0:x1]=sub*255
    im=Image.fromarray(m).filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.MinFilter(5)).filter(ImageFilter.MaxFilter(5))
    return im
m=np.zeros((900,1600),bool); m[130:630,:]=True; m[:,200:700]=False; m[:,1140:1440]=False
up=Image.open('frames/game-1600x900-hint-3.jpg').convert('RGB')
dn=Image.open('frames/game-1600x900-turn.jpg').convert('RGB')
Fu,Pu=fit(up,m); Fd,Pd=fit(dn,m)
BOSS=(190,250,700,600); CLOUD=(1240,360,1400,610); BARRET=(1160,300,1310,535)
mu=mask_of(Fu,Pu,BOSS); md=mask_of(Fd,Pd,BOSS)
mc=mask_of(Fu,Pu,CLOUD); mb=mask_of(Fu,Pu,BARRET)
for n,im in [('mask-boss-up',mu),('mask-boss-down',md),('mask-cloud',mc),('mask-barret',mb)]: im.save(n+'.png')
# base plates
def comp(dst,src,mask,feather=3):
    a=np.asarray(mask.filter(ImageFilter.GaussianBlur(feather)),dtype=np.float32)[...,None]/255
    return dst*(1-a)+src*a
# clean scene: plate everywhere above band + subjects pasted from frames; band from hint-3
band=Fu.copy()
def scene(boss):  # boss in {'up','down',None}
    S=Pu.copy()
    if boss=='up': S=comp(S,Fu,mu)
    if boss=='down': S=comp(S,Fd,md)
    S=comp(S,Fu,mc); S=comp(S,Fu,mb)
    S[636:]=band[636:]
    return S
for nm,b in [('base-up','up'),('base-down','down'),('base-noboss',None)]:
    Image.fromarray(scene(b).astype(np.uint8)).save(nm+'.jpg',quality=93)
S=Pu.copy(); S[636:]=band[636:]; Image.fromarray(S.astype(np.uint8)).save('base-empty.jpg',quality=93)
# cut-outs as RGBA
for nm,F,mk,r in [('cut-boss-up',Fu,mu,BOSS),('cut-boss-down',Fd,md,BOSS),('cut-cloud',Fu,mc,CLOUD),('cut-barret',Fu,mb,BARRET)]:
    rgba=np.dstack([F,np.asarray(mk.filter(ImageFilter.GaussianBlur(1)),dtype=np.float32)]).astype(np.uint8)
    Image.fromarray(rgba,'RGBA').crop(r).save(nm+'.png'); print(nm, r)
