import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ylib import *
import numpy as np, cv2
from PIL import Image, ImageDraw
def crop(p_or_a, box, sc, bg=(128,128,128)):
    a = load(p_or_a) if isinstance(p_or_a, str) else p_or_a
    x0,y0,x1,y1 = box
    c = on_bg(a[y0:y1, x0:x1].astype(np.float32), bg)
    im = Image.fromarray(c)
    return im.resize((int(im.width*sc), int(im.height*sc)), Image.NEAREST if sc>=1 else Image.LANCZOS)
def strip(out, ims, labels=None):
    h = max(i.height for i in ims); w = sum(i.width+6 for i in ims)
    s = Image.new('RGB', (w, h+16), (40,40,40)); x=0; d=ImageDraw.Draw(s)
    for k,i in enumerate(ims):
        s.paste(i,(x,16)); 
        if labels: d.text((x+2,2), labels[k], fill=(255,255,0))
        x += i.width+6
    s.save(out, quality=92); print(out, s.size)
