# Mindy idle clean pass, step 1 (no GPU): take the picked render's own striped abdomen off her hips, put it BEHIND her
# (scaled, tilted down-back, a stinger point added at its tip), and block in hips (black shorts) where it was.
# Output: guide RGBA + repaint mask (hips and joins only; the abdomen keeps its own pixels).
import numpy as np, sys, json
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage
P=json.loads(sys.argv[1]) if len(sys.argv)>1 else {}
sc=P.get('scale',0.62); ang=P.get('ang',-22); cx,cy=P.get('at',[330,650])
src=Image.open('D:/Tools/pyrefly-scratch/fallen-aeons-options/renders/mindy-a2.png').convert('RGBA'); A=np.asarray(src).astype(np.float32)
H,W=A.shape[:2]; r,g,b,a=[A[...,i] for i in range(4)]
yy,xx=np.mgrid[0:H,0:W]
E=((xx-210)/206.0)**2+((yy-663)/138.0)**2<=1.0
lum=(r+g+b)/3; sat=A[...,:3].max(-1)-A[...,:3].min(-1)
glove=(lum<115)&(sat<45)&(yy<625)&(xx>222)&(xx<340)&(yy>520)
glove=ndimage.binary_closing(glove,iterations=2)
lab,n=ndimage.label(glove); sz=ndimage.sum(glove,lab,range(1,n+1)); glove=lab==(np.argmax(sz)+1)
glove=ndimage.binary_dilation(glove,iterations=2)
blue=(b>r+30)&(b>g+20)&(yy<600)
darkbot=(lum<90)&(sat<50)&(yy>730)
abd=E&(a>20)&~glove&~blue
# keep the legs' black shorts under the abdomen's bottom edge: they are outside the ellipse already
abdI=src.copy(); aa=np.asarray(abdI).copy().astype(np.float32)
# fill where the glove and the skirt ruffle covered the abdomen, from the abdomen's own pixels (diffusion)
fillm=E&(glove|blue)&(yy>=545)
known=abd.copy(); out=aa[...,:3].copy()
for it in range(2000):
    s_=ndimage.uniform_filter(out*known[...,None],size=(3,3,1)); k_=ndimage.uniform_filter(known.astype(np.float32),size=3)
    upd=fillm&~known&(k_>0.001)
    if not upd.any(): break
    out[upd]=s_[upd]/k_[upd][:,None]; known|=upd
aa[...,:3]=out; aa[...,3]=np.where(abd|(fillm&known),255,0)*np.where(abd,aa[...,3]/255,1)
abdI=Image.fromarray(aa.astype(np.uint8),'RGBA')
bb=abdI.getbbox(); abdI=abdI.crop(bb)
# stinger at the abdomen's right tip (before rotation): a black cone
st=Image.new('RGBA',(abdI.width+70,abdI.height),(0,0,0,0)); st.paste(abdI,(0,0),abdI)
d=ImageDraw.Draw(st); mid=abdI.height*0.55
d.polygon([(abdI.width-18,mid-26),(abdI.width+62,mid+6),(abdI.width-18,mid+30)],fill=(26,22,30,255))
abdI=st
abdI=abdI.resize((round(abdI.width*sc),round(abdI.height*sc)),Image.LANCZOS).rotate(ang,resample=Image.BICUBIC,expand=True)
# body without the abdomen
body=np.asarray(src).copy(); body[...,3]=np.where(abd,0,body[...,3])
stray=(xx<140)&(yy>515)&(yy<650); body[...,3]=np.where(stray,0,body[...,3]); bodyI=Image.fromarray(body,'RGBA')
# hips block-in (black shorts), drawn on the body layer
hip=Image.new('RGBA',(W,H),(0,0,0,0)); d=ImageDraw.Draw(hip)
poly=P.get('hip',[(150,538),(292,538),(310,600),(343,690),(352,760),(300,786),(262,742),(246,722),(238,798),(150,800),(136,720),(136,620)])
d.polygon([tuple(p) for p in poly],fill=(34,30,38,255))
d.line([(150,556),(298,553)],fill=(217,118,31,255),width=12)  # orange armoured belt
hip=hip.filter(ImageFilter.GaussianBlur(1))
canvas=Image.new('RGBA',(W+200,H),(0,0,0,0))
canvas.alpha_composite(abdI,(round(cx-abdI.width*0.28),round(cy-abdI.height/2))); canvas.save('work/mindy-abd-layer.png')
layer=Image.new('RGBA',(W+200,H),(0,0,0,0)); layer.alpha_composite(hip); layer.alpha_composite(bodyI)
canvas.alpha_composite(layer)
canvas.save('work/mindy-guide.png')
# repaint mask: hips polygon + a band where the abdomen meets the body + the stinger joint
m=Image.new('L',(W+200,H),0); d=ImageDraw.Draw(m); d.polygon([tuple(p) for p in poly],fill=255)
m=Image.fromarray((ndimage.binary_dilation(np.asarray(m)>0,iterations=10)*255).astype(np.uint8))
# do not repaint the glove or the face/torso above y 525
mm=np.asarray(m).copy(); mm[:525]=0
d2=Image.fromarray(mm); ImageDraw.Draw(d2).ellipse(tuple(P.get('joinbox',[290,535,470,620])),fill=255); mm=np.asarray(d2).copy()
gl=np.zeros_like(mm,bool); gl[:H,:W]=glove; mm[ndimage.binary_dilation(gl,iterations=2)]=0
Image.fromarray(mm).filter(ImageFilter.GaussianBlur(4)).save('work/mindy-mask.png')
g2=Image.new('RGBA',canvas.size,(120,120,128,255)); g2.alpha_composite(canvas); g2.convert('RGB').save('look/mindy-guide.jpg',quality=90)
print('ok',canvas.size,bb)
