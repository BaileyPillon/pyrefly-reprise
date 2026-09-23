import cv2, numpy as np, json, sys
S=r"C:/Users/ADMINI~1/AppData/Local/Temp/claude/D--Final-Fantasy/174911c6-80de-460f-ac03-e4631f17478b/scratchpad"
F=float(sys.argv[1]) if len(sys.argv)>1 else 0.64
NT=np.array([float(sys.argv[2]),float(sys.argv[3])]) if len(sys.argv)>3 else np.array([63.,400.])
TIPY=float(sys.argv[4]) if len(sys.argv)>4 else 572.
LEAN=np.deg2rad(float(sys.argv[5])) if len(sys.argv)>5 else np.deg2rad(4.6)
OUT=sys.argv[6] if len(sys.argv)>6 else S+'/idle.heart.png'
idle=cv2.imread('public/art/characters/ormi/idle.png',cv2.IMREAD_UNCHANGED)
r1=cv2.imread('D:/Tools/pyrefly-art-backup/candidates/2026-09-23-lora-r2/ormi/replaced/cast.png',cv2.IMREAD_UNCHANGED)
m=np.load(S+'/r1heart.npy').astype(np.float32)
M_full=np.zeros(r1.shape[:2],np.float32); M_full[555:785,30:170]=m
notch_s=np.array([98.,595.]); tip_s=np.array([61.,767.])
u_s=(tip_s-notch_s)/np.linalg.norm(tip_s-notch_s); v_s=np.array([-u_s[1],u_s[0]])
Ls=np.linalg.norm(tip_s-notch_s)
u_t=np.array([-np.sin(LEAN),np.cos(LEAN)]); v_t=np.array([-u_t[1],u_t[0]])
k=(TIPY-NT[1])/(Ls*u_t[1])
# affine: p' = NT + k*a*u_t + k*F*b*v_t, a=(p-ns).u_s, b=(p-ns).v_s
A=k*np.outer(u_t,u_s)+k*F*np.outer(v_t,v_s)
t=NT-A@notch_s
SC=2  # work on 2x canvas
A2=np.hstack([A,(t*SC)[:,None]]); A2[:, :2]=A  # map from source(1x) to target(2x)
A2=np.hstack([A*SC/1.0, (t*SC)[:,None]])
# upsample source 2x lanczos first, then map source2x->target2x: p2t = A*p2s + t*SC
src2=cv2.resize(r1[...,:3],None,fx=SC,fy=SC,interpolation=cv2.INTER_LANCZOS4)
msk2=cv2.resize(M_full,None,fx=SC,fy=SC,interpolation=cv2.INTER_LINEAR)
Aff=np.hstack([A,(t*SC)[:,None]])
H,W=idle.shape[:2]
wimg=cv2.warpAffine(src2,Aff,(W*SC,H*SC),flags=cv2.INTER_LANCZOS4,borderValue=0)
wm=cv2.warpAffine(msk2,Aff,(W*SC,H*SC),flags=cv2.INTER_LINEAR,borderValue=0)
wimg=cv2.resize(wimg,(W,H),interpolation=cv2.INTER_AREA).astype(np.float32)
wm=cv2.resize(wm,(W,H),interpolation=cv2.INTER_AREA)
hard=(wm>0.5).astype(np.uint8)
# --- shading: idle's own low-frequency light, measured on the shield face around the heart
lab_i=cv2.cvtColor(idle[...,:3],cv2.COLOR_BGR2LAB).astype(np.float32)
lab_r=cv2.cvtColor(r1[...,:3],cv2.COLOR_BGR2LAB).astype(np.float32)
def purple(img):
  b,g,r=[img[...,i].astype(int) for i in range(3)]; return (b>r+5)&(b>g+5)
E=lambda d: cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(2*d+1,2*d+1))
ring_t=(cv2.dilate(hard,E(30))-cv2.dilate(hard,E(4))).astype(bool)&purple(idle[...,:3])&(idle[...,3]>250)
ring_s=(cv2.dilate(M_full.astype(np.uint8),E(30))-cv2.dilate(M_full.astype(np.uint8),E(4))).astype(bool)&purple(r1[...,:3])&(r1[...,3]>250)
Lt=np.median(lab_i[...,0][ring_t]); Ls_=np.median(lab_r[...,0][ring_s])
# plane fit of the idle face light around the heart (purple pixels only)
ys,xs=np.where(ring_t); Lv=lab_i[...,0][ring_t]
X=np.c_[np.ones_like(xs),xs,ys].astype(np.float64); coef,*_=np.linalg.lstsq(X,Lv,rcond=None)
yy,xx=np.mgrid[0:H,0:W]; plane=(coef[0]+coef[1]*xx+coef[2]*yy)
cy,cx=[v.mean() for v in np.where(hard)]
pc=coef[0]+coef[1]*cx+coef[2]*cy
def redL(img,box):
  x0,y0,x1,y1=box; c=img[y0:y1,x0:x1,:3]; hsv=cv2.cvtColor(c,cv2.COLOR_BGR2HSV).astype(int); h,s_,v=hsv[...,0],hsv[...,1],hsv[...,2]
  sel=((h<=8)|(h>=170))&(s_>90)&(v>40); return np.median(cv2.cvtColor(c,cv2.COLOR_BGR2LAB)[...,0][sel].astype(float))
RR=redL(idle,(110,380,200,600))/redL(r1,(45,580,150,760))
face=((idle[...,3]>=250)).astype(np.float32)
Li=lab_i[...,0]*face
G=cv2.GaussianBlur(Li,(0,0),10)/np.maximum(cv2.GaussianBlur(face,(0,0),10),1e-3)
gm=np.median(G[hard>0])
mult=(RR*np.clip(G/gm,0.85,1.15)).astype(np.float32)
print('red ratio',round(RR,3))
print('ring L idle %.1f r1 %.1f  plane coef'%(Lt,Ls_),coef.round(3),'mult in heart',mult[hard>0].min().round(3),mult[hard>0].max().round(3))
# apply the multiplier to L only (keep the heart's own hue), monotone
wl=cv2.cvtColor(np.clip(wimg,0,255).astype(np.uint8),cv2.COLOR_BGR2LAB).astype(np.float32)
wl[...,0]=np.clip(wl[...,0]*mult,0,255)
shaded=cv2.cvtColor(wl.astype(np.uint8),cv2.COLOR_LAB2BGR).astype(np.float32)
# --- composite: interior = transplant, seam band <= 2 px feather at the edge
alpha=np.clip(wm,0,1)
inner=cv2.erode(hard,E(1)).astype(np.float32)
alpha=np.where(inner>0,1.0,np.clip(alpha,0,1)).astype(np.float32)
alpha[cv2.dilate(hard,E(1))==0]=0
alpha*= (idle[...,3]>=250)  # only inside the fully opaque shield
out=idle.copy().astype(np.float32)
out[...,:3]=idle[...,:3]*(1-alpha[...,None])+shaded*alpha[...,None]
out=np.clip(np.round(out),0,255).astype(np.uint8)
cv2.imwrite(OUT,out)
region=cv2.dilate(hard,E(2))
diff=np.abs(out.astype(int)-idle.astype(int)).sum(-1)
print('changed px',int((diff>0).sum()),'outside heart+2px band MAD',float(diff[region==0].mean()),'max',int(diff[region==0].max()))
print('heart bbox',cv2.boundingRect(hard),'area',int(hard.sum()))
np.save(S+'/target_mask.npy',hard); np.save(S+'/region.npy',region)
json.dump({'F':F,'notch':NT.tolist(),'tipY':TIPY,'leanDeg':float(np.rad2deg(LEAN)),'k':float(k),'A':A.tolist(),'t':t.tolist(),'ringL_idle':float(Lt),'ringL_r1':float(Ls_),'plane':coef.tolist()},open(S+'/transplant.json','w'),indent=1)
