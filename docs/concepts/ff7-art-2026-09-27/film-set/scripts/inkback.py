"""Film set, repair round: the back-edge rim that derim.py cannot re-colour because it sits OUTSIDE the figure's ink
line (a slate/teal or olive band between the inner outline and an outer one, 8-12 px wide, on the edges facing
screen-left). Such a band has no "colour further inside" of its own, so it becomes the ink: inside BOX (optional)
and within BAND px of transparency on edges that do not face screen-right, a pixel whose green is not below its
red (slate, teal, olive, mint: never indigo, purple, brown, skin, blond or red, which all have red above green) is
blended to the figure's own outline colour (the median of its near-black edge pixels). The silhouette is unchanged;
the back edge reads as a heavier ink outline, which is what an unlit back edge is.
Usage: python inkback.py <cut.png> <out.png>   env INKBAND=16 BOX=x0,y0,x1,y1[;x0,...] INKFACE=0.2 (min leftward inward x)"""
import json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

src, dst = sys.argv[1], sys.argv[2]
B = float(os.environ.get('INKBAND', 16))
FACE = float(os.environ.get('INKFACE', 0.2))
a = np.asarray(Image.open(src).convert('RGBA')).astype(float)
H, W = a.shape[:2]
op = a[..., 3] > 128
dist, (iy, ix) = ndimage.distance_transform_edt(op, return_indices=True)
yy, xx = np.mgrid[0:H, 0:W]
n = np.maximum(dist, 1e-6)
ux = (xx - ix) / n
area = np.zeros((H, W), bool)
if os.environ.get('BOX'):
    for bx in os.environ['BOX'].split(';'):
        x0, y0, x1, y1 = (int(t) for t in bx.split(','))
        area[y0:y1, x0:x1] = True
else:
    area[:] = True
band = op & (dist <= B) & (ux > FACE) & area
r, g, b = a[..., 0], a[..., 1], a[..., 2]
w = np.clip((g - r + 8) / 14, 0, 1) * band * (a[..., :3].max(-1) < 200)
w = ndimage.gaussian_filter(w, 0.8) * band
edge = op & (dist <= 3) & (a[..., :3].max(-1) < 40)
ink = np.median(a[edge][:, :3], 0) if edge.any() else np.array([16, 14, 20.])
out = a.copy()
out[..., :3] = a[..., :3] * (1 - w[..., None]) + ink * w[..., None]
Image.fromarray(out.clip(0, 255).astype(np.uint8)).save(dst)
print(json.dumps({'step': 'inkback', 'script': 'film-set/scripts/inkback.py', 'band': B, 'box': os.environ.get('BOX'),
                  'ink': [round(float(t)) for t in ink], 'pixels': int((w > 0.05).sum()), 'strong': int((w > 0.5).sum())}))
