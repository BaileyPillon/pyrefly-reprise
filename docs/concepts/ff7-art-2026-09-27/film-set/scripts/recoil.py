"""Film set, repair round: Guard Scorpion's hit/recoil as an EDIT of our own raised (or idle) pick, so it is the same
machine pixel for pixel (the judge: the painted recoil p1 lost the dome housing, the nose visor and moved the eye, so
the silhouette jumped when it swapped with idle or raised; recommended "an edit of raised/p1 ... with a knock-back
tilt and a lens flicker").
  1. Knock-back tilt: the whole cut-out turns ANGLE degrees about its rear foot contact (the right-most foot on the
     baseline), head end up, so the front legs lift off the floor and the rear legs stay planted. Never mirrored.
  2. Lens flicker: the sensor eye (the cyan part nearest the head, left) flares to a white-hot core with a brighter
     cyan ring; the tail's laser lens (the other cyan part) dims to FLICKER of its brightness. Inside the alpha only,
     so the silhouette is the rotated pick's.
Usage: python recoil.py <cut.png> <out.png> [angle=12] [flicker=0.55]"""
import json, sys
import numpy as np
from PIL import Image
from scipy import ndimage

src, dst = sys.argv[1], sys.argv[2]
ANG = float(sys.argv[3]) if len(sys.argv) > 3 else 12
FL = float(sys.argv[4]) if len(sys.argv) > 4 else 0.55
im = Image.open(src).convert('RGBA')
a = np.asarray(im).astype(float)
op = a[..., 3] >= 8
rows = np.nonzero(op.any(1))[0]
base = rows.max()
# the pivot is the REAR foot (the right-most foot touching the floor band, the bottom 3 % of the figure)
band = np.zeros_like(op)
band[int(base - 0.03 * (base - rows.min())):base + 1] = True
fl_lab, fn = ndimage.label(op & band)
feet = sorted((ndimage.center_of_mass(fl_lab == i)[1], i) for i in range(1, fn + 1) if (fl_lab == i).sum() > 200)
px, py = int(feet[-1][0]), int(base)
# lens flicker first (in the source's own coordinates)
r, g, b = a[..., 0], a[..., 1], a[..., 2]
cy = op & (g > 150) & (b > 140) & (r < 150) & (g - r > 60)
cy = ndimage.binary_closing(cy, iterations=3)
lab, n = ndimage.label(cy)
parts = []
for i in range(1, n + 1):
    ys, xs = np.nonzero(lab == i)
    if len(xs) > 400:
        parts.append((xs.mean(), ys.mean(), i, len(xs)))
parts.sort()
eye, lens = (parts[0], parts[-1]) if len(parts) >= 2 else (parts[0], None)
out = a.copy()
em = ndimage.binary_dilation(lab == eye[2], iterations=6) & op
ey, ex = np.nonzero(em)
cx, cyy = ex.mean(), ey.mean()
rad = max(ex.max() - ex.min(), ey.max() - ey.min()) / 2
d = np.hypot(*np.meshgrid(np.arange(a.shape[1]) - cx, np.arange(a.shape[0]) - cyy)) / max(rad, 1)
core = np.clip(1.15 - d, 0, 1)[..., None] * em[..., None]
out[..., :3] = out[..., :3] * (1 - core) + np.array([245, 255, 255.]) * core
ring = em[..., None] * (1 - core)
out[..., :3] = np.where(ring > 0, np.minimum(255, out[..., :3] * np.array([1.0, 1.18, 1.18])), out[..., :3])
lens_px = 0
if lens is not None:
    lm = ndimage.binary_dilation(lab == lens[2], iterations=4) & op
    out[..., :3][lm] = out[..., :3][lm] * FL + np.array([20, 40, 44.]) * (1 - FL)
    lens_px = int(lm.sum())
fl = Image.fromarray(out.clip(0, 255).astype(np.uint8))
# knock-back tilt about the rear foot: pad, rotate about the pivot (clockwise on screen = head end up), crop to the figure
P = int(max(im.size) * 0.3)
big = Image.new('RGBA', (im.width + 2 * P, im.height + 2 * P), (0, 0, 0, 0))
big.paste(fl, (P, P))
rot = big.rotate(-ANG, resample=Image.BICUBIC, center=(px + P, py + P))
ra = np.asarray(rot).copy()
ra[..., 3][ra[..., 3] < 8] = 0
lab2, n2 = ndimage.label(ra[..., 3] >= 8, structure=np.ones((3, 3)))
if n2 > 1:
    sz = ndimage.sum(np.ones(lab2.shape), lab2, range(1, n2 + 1))
    big_i = int(np.argmax(sz)) + 1
    ra[..., 3][(lab2 > 0) & (lab2 != big_i)] = 0
ys, xs = np.nonzero(ra[..., 3] >= 8)
M = 16
crop = Image.fromarray(ra).crop((xs.min() - M, ys.min() - M, xs.max() + M + 1, ys.max() + M + 1))
crop.save(dst)
# where the pivot (the rear foot) lands in the output, so the game can keep that foot where it stood
pvx, pvy = px + P - (xs.min() - M), py + P - (ys.min() - M)
print(json.dumps({'step': 'recoil', 'script': 'film-set/scripts/recoil.py', 'from': src.replace('\\', '/'), 'angleDeg': ANG,
                  'pivot': [px, py], 'pivotInOutput': [int(pvx), int(pvy)], 'eyeFlare': {'centre': [round(cx), round(cyy)], 'radius': round(rad)},
                  'tailLensFlicker': FL, 'tailLensPixels': lens_px, 'size': list(crop.size), 'mirrored': False}))
