"""Film set, repair round: trim the studio-grey SHELL the cut kept round a figure (the judge's "grey smudge beside the
pauldron spike", "grey fringe along the far arm", "smoky fringe behind the head", "grey wedge between arm and blade",
"background blob in front of the face").
The max-of-two-models cut keeps, in places, a band of flat studio grey outside the ink outline, sometimes closed by a
thin dark line where defringe darkened the new edge. The studio colour is read from the render itself: the colour
still stored under the transparent pixels next to the figure. Over the whole figure (or inside BOX=x0,y0,x1,y1;...), a
pixel is SHELL when it is within TOL of that studio colour (every channel) and flat (local spread < 7, or within 3 px
of the edge), and it is reachable from the outside through shell pixels or through the thin dark rim line (the
outermost 4 px, dark and grey). Shell is cleared, and so is that thin dark rim line where it bounded cleared shell,
so no floating line is left; ink, steel, blade and leather inside their outlines are never reached. Loose pieces under
64 px are dropped. Alpha only; colours untouched.
Usage: python trim.py <cut.png> <out.png>   env TOL=24 BOX=...  STUDIO=r,g,b (override)"""
import json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

src, dst = sys.argv[1], sys.argv[2]
TOL = float(os.environ.get('TOL', 24))
a = np.asarray(Image.open(src).convert('RGBA')).astype(float)
al = a[..., 3].copy()
rgb = a[..., :3]
v = rgb.mean(-1)
ch = rgb.max(-1) - rgb.min(-1)
op = al >= 8
dist = ndimage.distance_transform_edt(op)
near_out = ndimage.binary_dilation(op, iterations=40) & ~op
if os.environ.get('STUDIO'):
    studio = np.array([float(t) for t in os.environ['STUDIO'].split(',')])
else:
    studio = np.median(rgb[near_out], 0)
area = np.ones_like(op)
if os.environ.get('BOX'):
    area = np.zeros_like(op)
    for bx in os.environ['BOX'].split(';'):
        x0, y0, x1, y1 = (int(t) for t in bx.split(','))
        area[y0:y1, x0:x1] = True
loc = ndimage.uniform_filter(v, 7)
spread = np.sqrt(np.maximum(ndimage.uniform_filter(v * v, 7) - loc * loc, 0))
# the studio is lit unevenly (green near the core side), so each pixel is compared with the studio colour stored
# under the transparent pixels nearest to it (averaged over 15 px), and with the global studio colour
# only transparent pixels that still hold studio grey count (under a failed cut they can hold the figure's own colours)
tr = ((~op) & (np.abs(rgb - studio).max(-1) < 30)).astype(float)
wsum = ndimage.uniform_filter(tr, 15)
loc_bg = np.stack([ndimage.uniform_filter(rgb[..., c] * tr, 15) for c in range(3)], -1) / np.maximum(wsum, 1e-6)[..., None]
_, (iy, ix) = ndimage.distance_transform_edt(op, return_indices=True)
local = loc_bg[iy, ix]
like = (np.abs(rgb - local).max(-1) < TOL) | (np.abs(rgb - studio).max(-1) < TOL)
cand = area & op & like & ((spread < 7) | (dist <= 3))
rim = area & op & (dist <= 4) & (v < 70) & (ch < 40)
R = ndimage.binary_propagation(~op, mask=~op | cand | rim) & (cand | rim)
shell = R & cand
rim_cut = R & rim & ndimage.binary_dilation(shell, iterations=5)
al[shell | rim_cut] = 0
lab, n = ndimage.label(al >= 8, structure=np.ones((3, 3)))
dropped = []
if n > 1:
    sz = ndimage.sum(np.ones(lab.shape), lab, range(1, n + 1))
    big = int(np.argmax(sz)) + 1
    for i, s in enumerate(sz, 1):
        if i != big and s < max(64, 0.01 * sz.max()):   # after the trim, a loose piece is left-over studio (a patch box's edge)
            al[lab == i] = 0
            dropped.append(int(s))
out = a.copy()
out[..., 3] = al
Image.fromarray(out.clip(0, 255).astype(np.uint8)).save(dst)
print(json.dumps({'step': 'trim', 'script': 'film-set/scripts/trim.py', 'studio': [round(float(t)) for t in studio], 'tol': TOL,
                  'box': os.environ.get('BOX'), 'cleared': int(shell.sum()), 'rimLineCleared': int(rim_cut.sum()),
                  'piecesDropped': len(dropped), 'largestDropped': max(dropped) if dropped else 0}))
