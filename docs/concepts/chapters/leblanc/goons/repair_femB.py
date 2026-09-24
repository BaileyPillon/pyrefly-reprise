"""Pixel repair of fem-B.73313 (FFX-2 only, candidate): recolour the off-canon white face mask and
white chest panel and the blue arm bands / boot soles into the suit's own pink, keeping the painted
shading (luminance ratio) of every pixel. No generation; alpha untouched; the eye is excluded.
    python repair_femB.py in.png out.png
"""
import sys
import numpy as np
from PIL import Image
import colorsys

src, out = sys.argv[1], sys.argv[2]
im = np.asarray(Image.open(src).convert('RGBA')).astype(np.float32) / 255.0
rgb, a = im[..., :3], im[..., 3]
mx = rgb.max(-1); mn = rgb.min(-1)
v = mx
s = np.where(mx > 1e-6, (mx - mn) / np.maximum(mx, 1e-6), 0)
r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
# hue in degrees
d = np.maximum(mx - mn, 1e-6)
h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
H, W = a.shape
yy, xx = np.mgrid[0:H, 0:W]

solid = a > 0.9
# suit reference: saturated pink pixels on the legs (lower half)
suit = solid & (yy > H * 0.55) & ((h > 320) | (h < 10)) & (s > 0.25) & (v > 0.5)
ref = np.median(rgb[suit], axis=0)
ref_l = np.percentile(lum[suit], 80)

white = solid & (s < 0.2) & (v > 0.72)
white &= yy < H * 0.45  # mask + chest panel only
# keep only large white components (the mask and the chest panel); the eye white is a small
# component enclosed by line art, so it survives untouched
from collections import deque
lab = np.zeros(white.shape, np.int32); keep = np.zeros_like(white)
n = 0
for y0, x0 in zip(*np.nonzero(white)):
    if lab[y0, x0]:
        continue
    n += 1; q = deque([(y0, x0)]); lab[y0, x0] = n; comp = []
    while q:
        y, x = q.popleft(); comp.append((y, x))
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1), (-1, 1), (-1, -1)):
            yy2, xx2 = y + dy, x + dx
            if 0 <= yy2 < H and 0 <= xx2 < W and white[yy2, xx2] and not lab[yy2, xx2]:
                lab[yy2, xx2] = n; q.append((yy2, xx2))
    if len(comp) >= 150:
        for y, x in comp:
            keep[y, x] = True
print('white components', n)
grow = keep.copy()
for _ in range(2):
    g2 = grow.copy()
    g2[1:] |= grow[:-1]; g2[:-1] |= grow[1:]; g2[:, 1:] |= grow[:, :-1]; g2[:, :-1] |= grow[:, 1:]
    grow = g2
white = keep | (grow & solid & (s < 0.28) & (v > 0.45))
blue = solid & (h > 170) & (h < 260) & (s > 0.25)

out_rgb = rgb.copy()
for sel, top in ((white, np.percentile(lum[white], 90) if white.any() else 1), (blue, np.percentile(lum[blue], 90) if blue.any() else 1)):
    k = np.clip(lum[sel] / max(top, 1e-3), 0, 1.15)[:, None]
    out_rgb[sel] = np.clip(ref[None, :] * (ref_l / max(np.percentile(lum[suit], 50), 1e-3)) * k, 0, 1)
# soften the join: 1-px feather of the edited area
res = np.concatenate([out_rgb, a[..., None]], -1)
Image.fromarray((res * 255 + 0.5).astype(np.uint8), 'RGBA').save(out)
print('ref', (ref * 255).round(), 'white px', int(white.sum()), 'blue px', int(blue.sum()))
