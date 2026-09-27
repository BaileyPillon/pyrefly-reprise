"""Hi-fi round: refill holes the rembg cut punched INSIDE a figure (a translucent-looking glowing blade reads as
background to rembg). A hole = a transparent region fully enclosed by the figure. It is refilled from the full
frame only when its full-frame pixels are clearly NOT the flat background grey (a real gap between an arm and
the body shows the background there and stays open). Alpha stays binary, so the strict one-component check
still holds; re-run cutout-check afterwards. Usage: python fill-holes.py <cut.png> <cut.json> <full.png> <out.png>"""
import json, sys
import numpy as np
from PIL import Image
from scipy import ndimage
cut_p, js_p, full_p, out_p = sys.argv[1:5]
cut = np.asarray(Image.open(cut_p).convert('RGBA')).copy()
x0, y0, x1, y1 = json.load(open(js_p))['cropBox']
full = np.asarray(Image.open(full_p).convert('RGB')).astype(int)
bg = np.median(np.concatenate([full[:40].reshape(-1, 3), full[:, :40].reshape(-1, 3)]), 0)
crop = full[y0:y0 + cut.shape[0], x0:x0 + cut.shape[1]]
op = cut[..., 3] >= 8
holes = ndimage.binary_fill_holes(op) & ~op
lab, n = ndimage.label(holes)
filled = 0
for i in range(1, n + 1):
    m = lab == i
    d = np.linalg.norm(crop[m] - bg, axis=1).mean()
    if d > 40:
        cut[m, :3] = crop[m]
        cut[m, 3] = 255
        filled += int(m.sum())
Image.fromarray(cut).save(out_p)
print(json.dumps({'holes': int(n), 'filledPixels': filled, 'bg': bg.tolist()}))
