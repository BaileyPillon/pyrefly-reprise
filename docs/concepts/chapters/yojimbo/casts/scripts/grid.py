import sys
from PIL import Image, ImageDraw
src, x0,y0,x1,y1, s, out = sys.argv[1], *map(int, sys.argv[2:7]), sys.argv[7]
im=Image.open(src).convert('RGBA'); bg=Image.new('RGBA',im.size,(128,128,128,255)); bg.alpha_composite(im)
c=bg.crop((x0,y0,x1,y1)).resize(((x1-x0)*s,(y1-y0)*s),Image.NEAREST).convert('RGB'); d=ImageDraw.Draw(c)
step=10
for x in range((x0//step+1)*step, x1, step):
    col=(255,255,0) if x%50==0 else (90,90,90)
    if x%50==0 or s>=3: d.line([((x-x0)*s,0),((x-x0)*s,c.height)],fill=col,width=1)
    if x%50==0: d.text(((x-x0)*s+2,2),str(x),fill=(255,255,0))
for y in range((y0//step+1)*step, y1, step):
    col=(255,255,0) if y%50==0 else (90,90,90)
    if y%50==0 or s>=3: d.line([(0,(y-y0)*s),(c.width,(y-y0)*s)],fill=col,width=1)
    if y%50==0: d.text((2,(y-y0)*s+2),str(y),fill=(255,255,0))
c.save(out,quality=92)
