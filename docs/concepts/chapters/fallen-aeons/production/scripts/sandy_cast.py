# Sandy cast, derived from the clean idle's own pixels (method r3, rig derive): the scythe forearm (gauntlet, hand and
# the attached scythe) is rotated about the elbow so the blade is raised high behind her. Only the elbow joint is
# repainted afterwards. Usage: sandy_cast.py angle out.png
import numpy as np, sys
from PIL import Image, ImageDraw
from scipy import ndimage
ang=float(sys.argv[1]); out=sys.argv[2]
src='D:/Tools/pyrefly-scratch/fallen-aeons-options/renders/sandy-a3.png'
im=Image.open(src).convert('RGBA'); A=np.asarray(im)
a=A[...,3]>24
lab,n=ndimage.label(a); sizes=ndimage.sum(a,lab,range(1,n+1)); order=np.argsort(-sizes)
body_lab=order[0]+1; sc_lab=order[1]+1
scm=ndimage.binary_dilation(lab==sc_lab,iterations=3)&~ndimage.binary_dilation(lab==body_lab,iterations=1)
sc=A.copy(); sc[...,3]=np.where(scm,A[...,3],0)
body=A.copy(); body[...,3]=np.where(scm,0,A[...,3])
W,H=1100,1300
# idle transplant (t7): scythe scale .7, rot 14 about mount, mount -> forearm (238,500), in front of the arm
s,ra,fx,fy=0.7,14,238,500; M=(290,125)
scI=Image.new('RGBA',(1400,1600),(0,0,0,0)); scI.paste(Image.fromarray(sc,'RGBA'),(0,0))
scI=scI.rotate(ra,resample=Image.BICUBIC,center=M); scI=scI.resize((round(scI.width*s),round(scI.height*s)),Image.LANCZOS)
scL=Image.new('RGBA',(W,H),(0,0,0,0)); scL.paste(scI,(round(fx-M[0]*s),round(fy-M[1]*s)),scI)
bL=Image.new('RGBA',(W,H),(0,0,0,0)); bL.paste(Image.fromarray(body,'RGBA'),(0,0))
# forearm polygon (original coords)
E=(196,428)
pm=Image.new('L',(W,H),0); ImageDraw.Draw(pm).polygon([(178,420),(262,404),(345,580),(338,672),(232,672),(196,520),(186,470)],fill=255)
fm=np.asarray(pm)>0
bA=np.asarray(bL).copy(); fore=bA.copy(); fore[...,3]=np.where(fm,fore[...,3],0); rest=bA.copy(); rest[...,3]=np.where(fm,0,rest[...,3])
# the hook spur of the scythe that crosses the skirt goes with the arm too
armL=Image.alpha_composite(Image.fromarray(fore,'RGBA'),scL)
armR=armL.rotate(ang,resample=Image.BICUBIC,center=E)
res=Image.alpha_composite(Image.fromarray(rest,'RGBA'),armR)
res.save(out)
# joint mask for the seam repaint: a disc at the elbow
jm=Image.new('L',(W,H),0); ImageDraw.Draw(jm).ellipse((E[0]-38,E[1]-38,E[0]+38,E[1]+38),fill=255)
jm.save(out[:-4]+'-joint.png')
g=Image.new('RGBA',(W,H),(120,120,128,255)); g.alpha_composite(res); bb=res.getchannel('A').getbbox(); g.crop(bb).convert('RGB').save(out[:-4]+'-look.jpg',quality=90)
print(out,bb)
