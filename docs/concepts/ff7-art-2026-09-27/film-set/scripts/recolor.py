"""Film set, repair round: re-colour a part the render painted in the wrong colour (Cloud's strike: the strap under the
pauldron came out bright red, where every other strap is brown leather; two local repaints kept it red). Inside BOX,
a pixel that is clearly red (red above green by 60 and above blue by 50) takes the TARGET colour (the figure's own
strap brown, sampled by eye from the same render) at its own brightness (the ratio of its value to the red's mean
value), so the shading and the ink stay. Alpha untouched.
Usage: python recolor.py <in.png> <out.png> x0,y0,x1,y1 r,g,b "<what>" """
import json, sys
import numpy as np
from PIL import Image
from scipy import ndimage

src, dst, box, tgt, what = sys.argv[1:6]
x0, y0, x1, y1 = (int(t) for t in box.split(','))
T = np.array([float(t) for t in tgt.split(',')])
im = Image.open(src)
mode = im.mode
a = np.asarray(im.convert('RGBA')).astype(float)
r, g, b = a[..., 0], a[..., 1], a[..., 2]
m = np.zeros(r.shape, bool)
m[y0:y1, x0:x1] = True
m &= (r - g > 60) & (r - b > 50) & (g < 95)   # dark saturated red only: never skin (green far higher)
w = ndimage.gaussian_filter(m.astype(float), 0.8)
w[:y0] = 0; w[y1:] = 0; w[:, :x0] = 0; w[:, x1:] = 0
v = a[..., :3].max(-1)
k = v / max(float(v[m].mean()), 1) if m.any() else v
new = T[None, None, :] * k[..., None]
out = a.copy()
out[..., :3] = a[..., :3] * (1 - w[..., None]) + new * w[..., None]
res = Image.fromarray(out.clip(0, 255).astype(np.uint8))
(res.convert('RGB') if mode == 'RGB' else res).save(dst)
print(json.dumps({'step': 'recolor', 'script': 'film-set/scripts/recolor.py', 'box': box, 'target': tgt, 'pixels': int(m.sum()), 'what': what}))
