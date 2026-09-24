import sys
from PIL import Image
# look.py out.jpg scale img1 [img2 ...] (optional crop x0,y0,x1,y1 via env CROP)
import os
out=sys.argv[1]; s=float(sys.argv[2]); ims=[]
crop=os.environ.get('CROP')
for p in sys.argv[3:]:
    im=Image.open(p).convert('RGBA')
    if crop: im=im.crop(tuple(map(int,crop.split(','))))
    bg=Image.new('RGBA',im.size,(128,128,128,255)); bg.alpha_composite(im)
    bg=bg.convert('RGB').resize((int(im.width*s),int(im.height*s)),Image.LANCZOS if s<1 else Image.NEAREST)
    ims.append(bg)
W=sum(i.width for i in ims)+10*(len(ims)-1); H=max(i.height for i in ims)
c=Image.new('RGB',(W,H),(40,40,40)); x=0
for i in ims: c.paste(i,(x,0)); x+=i.width+10
c.save(out,quality=92); print(out,c.size)
