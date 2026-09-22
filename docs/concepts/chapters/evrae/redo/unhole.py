"""Clear enclosed white-background holes that rembg left opaque between coils.

Evrae's loops enclose patches of the white cyclorama; isnet-anime keeps them as
opaque white (the "white holes" in production.md). A hole is a large connected
region of near-pure, near-flat white; painted cream belly scales are shaded and
textured, so they fail the flatness test and are kept.
usage: unhole.py in.png out.png [minArea]  -> prints JSON of what it cleared"""
import sys, json
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
src, dst = sys.argv[1], sys.argv[2]
min_area = int(sys.argv[3]) if len(sys.argv) > 3 else 1200
# optional pale-sky mode: a render whose cyclorama came back pale blue instead of white
min_lum = int(sys.argv[4]) if len(sys.argv) > 4 else 244
max_chroma = int(sys.argv[5]) if len(sys.argv) > 5 else 10
im = np.array(Image.open(src).convert("RGBA")).astype(np.int16)
rgb, a = im[..., :3], im[..., 3]
mn, mx = rgb.min(-1), rgb.max(-1)
white = (a > 128) & (mn >= min_lum) & ((mx - mn) <= max_chroma)
lab, n = ndi.label(white)
cleared, kept = [], []
remove = np.zeros_like(white)
for i in range(1, n + 1):
    m = lab == i
    area = int(m.sum())
    if area < min_area:
        continue
    std = float(rgb[m].std())
    if std <= 4.0:
        remove |= m
        ys, xs = np.nonzero(m)
        cleared.append({"area": area, "std": round(std, 2), "bbox": [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())]})
    else:
        kept.append({"area": area, "std": round(std, 2)})
# eat the anti-aliased rim: pale pixels within 2 px of a cleared hole
ring = ndi.binary_dilation(remove, iterations=2) & ~remove & (mn >= 205) & ((mx - mn) <= 30)
out = im.copy()
out[..., 3][remove | ring] = 0
Image.fromarray(out.astype(np.uint8), "RGBA").save(dst)
print(json.dumps({"cleared": cleared, "keptWhiteRegions": kept, "ringPixels": int(ring.sum())}))
