# Valefor options cleanup (2026-09-28). Two retained-background shapes the cutter left on the picks:
#  1. near-white slivers (background white trapped under the tail / claws), attached to the figure;
#  2. a painted floor shadow smear under the feet (option B).
# Both are removed only where they are connected to the transparent outside, so white or grey
# parts INSIDE the figure are never touched. Alpha stays binary. Then run defringe.py.
# usage: clean.py in.png out.png [--shadow]
import json, sys
import numpy as np
from PIL import Image
from scipy import ndimage

src, out = sys.argv[1], sys.argv[2]
shadow = '--shadow' in sys.argv
im = np.asarray(Image.open(src).convert('RGBA')).astype(np.float32)
rgb, alpha = im[..., :3], im[..., 3] >= 8
lum = rgb[..., 0] * 0.299 + rgb[..., 1] * 0.587 + rgb[..., 2] * 0.114
chroma = rgb.max(-1) - rgb.min(-1)
h, w = alpha.shape
removed = {}


def peel(cand, name, min_px):
    global alpha
    outside = ~alpha
    lab, n = ndimage.label(cand, structure=np.ones((3, 3)))
    if not n:
        removed[name] = 0
        return
    touch = ndimage.binary_dilation(outside) & cand
    ids = np.unique(lab[touch])
    ids = ids[ids > 0]
    sizes = ndimage.sum(cand, lab, ids)
    kill = np.isin(lab, [i for i, s in zip(ids, sizes) if s >= min_px])
    alpha = alpha & ~kill
    removed[name] = int(kill.sum())


peel(alpha & (rgb.min(-1) > 200) & (chroma < 30), 'nearWhite', 40)
if shadow:
    rows = np.where(alpha.any(1))[0]
    floor = np.zeros_like(alpha)
    floor[int(rows.max()) - 60:, :] = True
    peel(alpha & floor & (lum > 85) & (lum < 190) & (chroma < 45), 'floorShadow', 40)
# drop specks under 24 px so the figure stays one piece
lab, n = ndimage.label(alpha, structure=np.ones((3, 3)))
if n > 1:
    sizes = ndimage.sum(alpha, lab, range(1, n + 1))
    big = int(np.argmax(sizes)) + 1
    specks = alpha & (lab != big) & np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s < 24])
    alpha = alpha & ~specks
    removed['specks'] = int(specks.sum())
Image.fromarray(np.dstack([rgb, alpha * 255.0]).clip(0, 255).astype(np.uint8), 'RGBA').save(out)
print(json.dumps(removed))
