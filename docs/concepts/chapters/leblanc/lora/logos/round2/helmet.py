"""Logos head size, objective: the helmet is rigid, so its longest chord (the diameter of the
silver region) does not change with how the head is turned in the picture plane.

  python -s helmet.py <cutout.png> <seedx,seedy> <box l,t,r,b> <check.png>

Silver = alpha > 128, value > 0.28, and either a neutral or cool grey (saturation < 0.12, blue not below red: the pale warm face stays out) or a cool tint
(hue 190 to 290, saturation < 0.5: the shaded side of the dome), so skin and black hair stay out; flood-filled 8-connected from a seed
on the dome, clipped to the box (so a revolver touching the helmet is cut away by the box).
The fill's convex hull gives the diameter; black engraving lines are closed by a 3 px
dilation of the mask before filling. The check image tints the fill so it can be LOOKED at.
Prints {"px": diameter, "area": pixels}."""
import json, math, sys
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

src, seed, box, check = sys.argv[1:]
sx, sy = [int(v) for v in seed.split(',')]
l, t, r, b = [int(v) for v in box.split(',')]
im = Image.open(src).convert('RGBA')
a = np.asarray(im).astype(np.float32)
rgb = a[..., :3] / 255
mx, mn = rgb.max(2), rgb.min(2)
sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
hue = np.zeros_like(mx)
d_ = np.maximum(mx - mn, 1e-6)
r_, g_, b_ = rgb[..., 0], rgb[..., 1], rgb[..., 2]
hue = np.where(mx == r_, ((g_ - b_) / d_) % 6, np.where(mx == g_, (b_ - r_) / d_ + 2, (r_ - g_) / d_ + 4)) * 60
cool = (hue >= 190) & (hue <= 290)
m = (a[..., 3] > 128) & (mx > 0.28) & (((sat < 0.12) & (b_ >= r_ - 0.012)) | (cool & (sat < 0.5)))
clip = np.zeros_like(m); clip[t:b, l:r] = True
m &= clip
m = ndimage.binary_closing(m, iterations=3) & clip
lab, n = ndimage.label(m, structure=np.ones((3, 3)))
k = lab[sy, sx]
if k == 0:
    raise SystemExit(f'seed {seed} not on silver')
reg = ndimage.binary_fill_holes(lab == k)
ys, xs = np.nonzero(reg)
pts = np.stack([xs, ys], 1)
from scipy.spatial import ConvexHull
h = pts[ConvexHull(pts).vertices]
d = np.sqrt(((h[:, None, :] - h[None, :, :]) ** 2).sum(-1))
i, j = np.unravel_index(d.argmax(), d.shape)
c = np.asarray(Image.open(src).convert('RGBA').crop((0, 0, im.width, im.height))).copy()
c[reg] = (c[reg] * 0.4 + np.array([0, 255, 0, 255]) * 0.6).astype(np.uint8)
ci = Image.fromarray(c)
from PIL import ImageDraw
dr = ImageDraw.Draw(ci)
dr.line([tuple(h[i]), tuple(h[j])], fill=(255, 0, 0, 255), width=2)
ci.crop((max(0, l - 10), max(0, t - 10), min(im.width, r + 10), min(im.height, b + 10))).save(check)
print(json.dumps({'px': round(float(d.max()), 1), 'area': int(reg.sum()), 'ends': [h[i].tolist(), h[j].tolist()]}))
