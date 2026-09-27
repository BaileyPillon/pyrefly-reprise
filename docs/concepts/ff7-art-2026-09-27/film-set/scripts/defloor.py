"""Film set: take the soft floor contact shadow off a party cut-out (both rembg models keep the painted shadow that
spreads round the boots; the game draws its own contact shadow). Works on the checked raw cut-out, in its own
coordinates: in the lowest BAND of the figure's height, a pixel that is grey (chroma < 24: the studio grey and its
shadow, never the brown boots, olive or indigo trousers), in the shadow's value range (not the near-black ink of the
sole, not a lit highlight), FLAT (local spread < 8) and REACHABLE from the outside without crossing an ink line is
cleared (so the dark sole and the steel blade inside their outlines stay);
then threads under ~5 px thick and loose pieces under 64 px left in that band go too.
Usage: python defloor.py <raw-cut.png> <out.png> [band=0.10] [vlo=22] [vhi=110]"""
import json, sys
import numpy as np
from PIL import Image
from scipy import ndimage

src, dst = sys.argv[1], sys.argv[2]
BAND = float(sys.argv[3]) if len(sys.argv) > 3 else 0.10
VLO = float(sys.argv[4]) if len(sys.argv) > 4 else 22
VHI = float(sys.argv[5]) if len(sys.argv) > 5 else 110
a = np.asarray(Image.open(src).convert('RGBA')).astype(float)
al = a[..., 3].copy()
rgb = a[..., :3]
v = rgb.mean(-1)
ch = rgb.max(-1) - rgb.min(-1)
op = al >= 8
rows = np.nonzero(op.any(1))[0]
top, base = rows.min(), rows.max()
y0 = int(base - BAND * (base - top))
low = np.zeros_like(op)
low[y0:] = True
loc = ndimage.uniform_filter(v, 7)
spread = np.sqrt(np.maximum(ndimage.uniform_filter(v * v, 7) - loc * loc, 0))
near = ndimage.binary_dilation(~op, iterations=4)          # the spread is meaningless next to transparent pixels
cand = low & op & (ch < 24) & (v >= VLO) & (v <= VHI) & ((spread < 8) | near)
# only shadow that is reachable from the outside without crossing an ink line: the boot's own dark sole, the steel
# blade and the leather inside the ink outline are never reached (a flood fill from the transparent pixels)
seed = low & ~op
shadow = ndimage.binary_propagation(seed, mask=seed | cand) & cand
al[shadow] = 0
m = al >= 8
thin = m & low & ~ndimage.binary_opening(m, iterations=2) & (ch < 30)
al[thin] = 0
lab, n = ndimage.label(al >= 8, structure=np.ones((3, 3)))
dropped = []
if n > 1:
    sz = ndimage.sum(np.ones(lab.shape), lab, range(1, n + 1))
    big = int(np.argmax(sz)) + 1
    for i, s in enumerate(sz, 1):
        if i != big and s < 64:
            al[lab == i] = 0
            dropped.append(int(s))
out = a.copy()
out[..., 3] = al
Image.fromarray(out.clip(0, 255).astype(np.uint8)).save(dst)
print(json.dumps({'step': 'defloor', 'band': BAND, 'fromRow': y0, 'valueRange': [VLO, VHI], 'cleared': int(shadow.sum()),
                  'threads': int(thin.sum()), 'piecesDropped': dropped}))
