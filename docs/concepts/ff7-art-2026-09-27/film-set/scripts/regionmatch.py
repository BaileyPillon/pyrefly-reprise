"""Film set, repair round: match the colours of a repainted part to the same material elsewhere in the SAME figure
(LOOK: Barret's completed near boot came out paler and greyer than his far boot). Pixels of warm hue (the brown
leather, 5..45 degrees, saturation > 0.2) inside box A move per channel from their own mean and spread to those of the
same kind of pixels inside box B. Coordinates are the cut-out's own. Alpha untouched.
Usage: python regionmatch.py <cut.png> <out.png> <A: x0,y0,x1,y1> <B: x0,y0,x1,y1> "<what>" """
import json, sys
import numpy as np
from PIL import Image
from scipy import ndimage

src, dst, A, B, what = sys.argv[1:6]
a = np.asarray(Image.open(src).convert('RGBA')).astype(float)
rgb = a[..., :3] / 255
mx, mn = rgb.max(-1), rgb.min(-1)
s = (mx - mn) / np.maximum(mx, 1e-6)
r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
hue = np.degrees(np.arctan2(np.sqrt(3) * (g - b), 2 * r - g - b)) % 360
import os
HLO, HHI = (float(t) for t in os.environ.get('HUE', '5,45').split(','))   # HUE=lo,hi: another material (olive trousers 50,95)
leather = (a[..., 3] > 128) & (hue > HLO) & (hue < HHI) & (s > 0.2) & (mx > 0.12)


def boxm(bx):
    x0, y0, x1, y1 = (int(t) for t in bx.split(','))
    m = np.zeros(leather.shape, bool)
    m[y0:y1, x0:x1] = True
    return m


ma, mb = leather & boxm(A), leather & boxm(B)
w = ndimage.gaussian_filter(ma.astype(float), 1.2) * boxm(A)
out = a.copy()
st = {}
for c in range(3):
    pa, pb = a[..., c][ma], a[..., c][mb]
    st['rgb'[c]] = [round(float(pa.mean())), round(float(pb.mean()))]
    moved = (a[..., c] - pa.mean()) / max(pa.std(), 1) * pb.std() + pb.mean()
    out[..., c] = a[..., c] * (1 - w) + moved * w
Image.fromarray(out.clip(0, 255).astype(np.uint8)).save(dst)
print(json.dumps({'step': 'regionmatch', 'script': 'film-set/scripts/regionmatch.py', 'fix': A, 'like': B, 'meanFixToLike': st,
                  'hue': [HLO, HHI], 'pixels': int(ma.sum()), 'what': what}))
