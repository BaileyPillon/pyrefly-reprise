"""Film set, repair round: clear the alpha inside named boxes of a cut-out (a stray curl the render drew off a muzzle,
LOOKED at 1:1 before and after). Colours untouched; the figure's own outline is outside every box.
Usage: python erase.py <cut.png> <out.png> x0,y0,x1,y1[;...] "<what>" """
import json, sys
import numpy as np
from PIL import Image

src, dst, boxes, what = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
a = np.asarray(Image.open(src).convert('RGBA')).copy()
n = 0
for bx in boxes.split(';'):
    x0, y0, x1, y1 = (int(t) for t in bx.split(','))
    n += int((a[y0:y1, x0:x1, 3] > 0).sum())
    a[y0:y1, x0:x1, 3] = 0
Image.fromarray(a).save(dst)
print(json.dumps({'step': 'erase', 'script': 'film-set/scripts/erase.py', 'boxes': boxes, 'pixels': n, 'what': what}))
