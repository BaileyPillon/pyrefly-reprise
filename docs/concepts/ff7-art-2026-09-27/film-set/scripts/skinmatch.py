"""Film set, repair round: match a pose's SKIN tone to its idle's (the judge: Barret's aim and fire have "browner skin,
unlike the idle's redder face"). Skin is found by colour in both pictures (warm hue 2..38 degrees, saturation 0.30..0.80,
value above VMIN: the lit and mid-shadow skin, not the darker brown leather of the vest and boots), optionally only
above row YMAX of the pose (the trousers and boots stay out). The pose's skin pixels are moved per channel from their
own mean and spread to the idle's, blended in by a soft skin mask; everything else is untouched.
Usage: python skinmatch.py <pose.png> <idle.png> <out.png>   env VMIN=0.42 YMAX=<row>"""
import json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

src, ref, dst = sys.argv[1:4]
VMIN = float(os.environ.get('VMIN', 0.42))


def skin(a):
    rgb = a[..., :3] / 255
    mx, mn = rgb.max(-1), rgb.min(-1)
    s = (mx - mn) / np.maximum(mx, 1e-6)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    hue = np.degrees(np.arctan2(np.sqrt(3) * (g - b), 2 * r - g - b)) % 360
    op = a[..., 3] > 128 if a.shape[-1] == 4 else np.ones(r.shape, bool)
    return op & (hue > 2) & (hue < 38) & (s > 0.30) & (s < 0.80) & (mx > VMIN)


A = np.asarray(Image.open(src).convert('RGBA')).astype(float)
R = np.asarray(Image.open(ref).convert('RGBA')).astype(float)
ma, mr = skin(A), skin(R)
if os.environ.get('YMAX'):
    ma[int(os.environ['YMAX']):] = False
    mr[int(os.environ.get('YMAX_REF', os.environ['YMAX'])):] = False
out = A.copy()
w = ndimage.gaussian_filter(ma.astype(float), 1.5)
stats = {}
for c in range(3):
    ps, rs = A[..., c][ma], R[..., c][mr]
    stats['rgb'[c]] = [round(float(ps.mean())), round(float(rs.mean()))]
    moved = (A[..., c] - ps.mean()) / max(ps.std(), 1) * rs.std() + rs.mean()
    out[..., c] = A[..., c] * (1 - w) + moved * w
Image.fromarray(out.clip(0, 255).astype(np.uint8)).save(dst)
print(json.dumps({'step': 'skinmatch', 'script': 'film-set/scripts/skinmatch.py', 'to': ref.replace('\\', '/'),
                  'skinMeanPoseToIdle': stats, 'pixels': int(ma.sum())}))
