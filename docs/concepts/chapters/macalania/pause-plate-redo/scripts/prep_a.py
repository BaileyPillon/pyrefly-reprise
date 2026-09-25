"""Option A prep: keep-mask of Seymour, antechamber prefill, cheek-vein softening. Pixels only."""
import numpy as np
from PIL import Image, ImageFilter
ROOT='D:/Final Fantasy/'; S='D:/Tools/pyrefly-scratch/picks0925/ch7-art/'
W,H=1344,768
src=Image.open(ROOT+'public/art/pause/macalania.png').convert('RGB')
a=np.asarray(src).astype(np.float32)
m=np.asarray(Image.open(S+'matte-current.png').convert('L')).astype(np.float32)/255
r,g,b=a[...,0],a[...,1],a[...,2]
K=(m>0.5).astype(np.float32)
yy,xx=np.mgrid[0:H,0:W]
# left rooftop / spires: keep only cool (hair) pixels
left=(xx<340)
K[left & ~((b>r+8)&((r+g+b)/3>150))]=0
K[(xx<240)&(yy<470)]=0
# right spire and roof/lantern
K[(xx>1110)&(xx<1275)&(yy<235)]=0
K[(xx>1100)&(xx<1300)&(yy>=225)&(yy<340)]=0
K[(xx>1285)&(yy>230)&(yy<470)&~(b>r+8)]=0
Km=Image.fromarray((K*255).astype(np.uint8)).filter(ImageFilter.MedianFilter(5))
Km.save(S+'keepA.png')
# background prefill from the installed backdrop (antechamber arches + both braziers)
bd=Image.open(ROOT+'public/art/backdrops/macalania-temple.png').convert('RGB')
bg=bd.crop((560,420,2080,1289)).resize((W,H),Image.LANCZOS).filter(ImageFilter.GaussianBlur(7))
bg.save(S+'bgA.png')
kf=np.asarray(Km.filter(ImageFilter.GaussianBlur(2))).astype(np.float32)[...,None]/255
pre=a*kf+np.asarray(bg).astype(np.float32)*(1-kf)
# cheek veins: thin dark red lines in the cheek box -> faint cool veins (softened, not erased)
x0,y0,x1,y1=585,300,780,455
box=a[y0:y1,x0:x1]
med=np.asarray(Image.fromarray(box.astype(np.uint8)).filter(ImageFilter.MedianFilter(11))).astype(np.float32)
lum=box.mean(-1); mlum=med.mean(-1)
red=((box[...,0]>box[...,2]+25)&(box[...,0]>box[...,1]+25)).astype(np.float32)
line=np.clip((mlum-lum-18)/40,0,1)*red
byy,bxx=np.mgrid[y0:y1,x0:x1]
line[(bxx<690)&(byy>392)]=0  # the mouth and nose lines stay exactly as painted
line=np.asarray(Image.fromarray((line*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))).astype(np.float32)[...,None]/255
vein=med*np.array([0.80,0.84,0.97])  # a faint cool shadow of the skin, not red
soft=med*(1-line)+ (med*(1-0.3)+vein*0.3)*line
pre[y0:y1,x0:x1]=pre[y0:y1,x0:x1]*(1-np.clip(line*0.9,0,1))+soft*np.clip(line*0.9,0,1)
Image.fromarray(np.clip(pre,0,255).astype(np.uint8)).save(S+'preA.png')
# inpaint mask = background (not keep), dilated a little and feathered
inv=Image.fromarray(((1-np.asarray(Km)/255)*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(4))
inv.save(S+'maskA.png')
print('keep share',K.mean(), 'vein px', int((line>0.3).sum()))
