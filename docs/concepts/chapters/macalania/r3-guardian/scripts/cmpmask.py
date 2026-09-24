import numpy as np
from PIL import Image
from scipy import ndimage as ndi
raw=np.array(Image.open('raw.png').convert('RGB')).astype(int)
c=np.array(Image.open('D:/Final Fantasy/docs/concepts/chapters/macalania/renders/guardian-a.png'))
iso=np.zeros(raw.shape[:2],bool); iso[23:1173,2:825]=c[:,:,3]>0
sam=np.array(Image.open('sam.m1.png'))>0
mn=raw.min(2); mx=raw.max(2); white=(mn>=235)&((mx-mn)<=15)
print('iso',iso.sum(),'sam',sam.sum())
a=iso&~sam; b=sam&~iso
print('iso-only',a.sum(),'of which white',(a&white).sum()); print('sam-only',b.sum(),'of which white',(b&white).sum())
for nm,m in (('iso-only',a),('sam-only',b)):
  l,n=ndi.label(m,np.ones((3,3))); s=ndi.sum(m,l,range(1,n+1))
  big=sorted([(int(s[i]),ndi.find_objects(l)[i]) for i in range(n) if s[i]>40],key=lambda t:-t[0])[:12]
  print(nm,[(k,(sl[1].start,sl[0].start,sl[1].stop,sl[0].stop)) for k,sl in big])
ov=raw.copy().astype(np.uint8); ov[a]=[255,0,255]; ov[b]=[0,200,255]
Image.fromarray(ov).save('maskdiff.png')
