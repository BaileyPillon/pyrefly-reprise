"""Film set, repair round: take the baked GREEN tint off named parts of a cut-out (the judge: green reflections on the
back of Barret's gatling, "green tint along the lower edge of the blade and the front of the sweater" on Cloud). Inside
BOX (one or more rectangles, in the cut-out's pixels), a pixel whose green stands clearly above BOTH red and blue (the
mako tint: never indigo, skin, brown, blond, red or the olive trousers, whose blue is far below green but whose red is
close to green) is moved toward a neutral colour of the same brightness, or toward the colour of its own red and blue
(MODE=hue: the indigo knit keeps its blue-purple). Alpha is untouched.
Usage: python degreen.py <cut.png> <out.png>   env BOX=x0,y0,x1,y1[;...] MIN=18 MODE=grey|hue|ink"""
import json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

src, dst = sys.argv[1], sys.argv[2]
MIN = float(os.environ.get('MIN', 18))
MODE = os.environ.get('MODE', 'grey')
a = np.asarray(Image.open(src).convert('RGBA')).astype(float)
H, W = a.shape[:2]
area = np.zeros((H, W), bool)
for bx in os.environ['BOX'].split(';'):
    x0, y0, x1, y1 = (int(t) for t in bx.split(','))
    area[max(0, y0):y1, max(0, x0):x1] = True
r, g, b = a[..., 0], a[..., 1], a[..., 2]
ex = g - np.maximum(r, b)
w = np.clip((ex - MIN) / 30, 0, 1) * area * (a[..., 3] > 0) * (np.abs(r - g) > 12)
w = ndimage.gaussian_filter(w, 1.0) * area
out = a.copy()
if MODE == 'ink':   # an unlit back edge: the mint line becomes the dark outline colour
    tgt = np.zeros_like(a[..., :3]) + np.array([22., 16., 14.])
elif MODE == 'hue':
    tgt = np.stack([r, np.maximum(r, b) * 0.8, b], -1)
else:
    lum = 0.3 * r + 0.59 * g + 0.11 * b
    tgt = np.stack([lum, lum, lum * 1.03], -1)
out[..., :3] = a[..., :3] * (1 - w[..., None]) + tgt * w[..., None]
Image.fromarray(out.clip(0, 255).astype(np.uint8)).save(dst)
print(json.dumps({'step': 'degreen', 'script': 'film-set/scripts/degreen.py', 'box': os.environ['BOX'], 'mode': MODE,
                  'pixels': int((w > 0.05).sum()), 'strong': int((w > 0.5).sum())}))
