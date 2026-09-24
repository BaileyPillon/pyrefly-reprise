"""Guado Guardian r3 idle cut-out (FFX only). Base: the concept's own isnet-anime matte (binary),
cross-checked with a SAM 2.1 small mask of the same raw render. Every RGB pixel is the raw render's.
1) add back thin hair tails / spike tips: raw pixels clearly off-white that SAM or a region-grow from the
   matte reaches (isnet dropped them); 2) peel the white halo at the edge; 3) drop flat-white background
   trapped inside the spear's crescent blade; 4) drop specks."""
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
raw = np.array(Image.open('raw.png').convert('RGB')).astype(int)
c = np.array(Image.open('D:/Final Fantasy/docs/concepts/chapters/macalania/renders/guardian-a.png'))
H, W = raw.shape[:2]
a = np.zeros((H, W), bool); a[23:1173, 2:825] = c[:, :, 3] > 0
sam = np.array(Image.open('sam.m1.png')) > 0
mn = raw.min(2); mx = raw.max(2); spread = mx - mn
fg_strong = mn < 200            # at least about half ink over white
log = {}
# 1) grow: off-white pixels connected to the matte (8-neighbour), limited to the head/hair box and the spear ends
grow_box = np.zeros_like(a); grow_box[20:400, 150:500] = True
cand = fg_strong & ~a & (grow_box | sam)
added = np.zeros_like(a)
cur = a.copy()
for _ in range(60):
    ring = ndi.binary_dilation(cur, structure=np.ones((3, 3))) & cand & ~cur
    if not ring.any(): break
    added |= ring; cur |= ring
log['grown'] = int(added.sum())
a = cur
# 2) halo peel (same rule as r3-seymour/scripts/matte.py)
white = (mn >= 205) & (spread <= 34); deep = (mn >= 225) & (spread <= 22)
peeled = 0
for it in range(12):
    edge = a & ~ndi.binary_erosion(a, structure=np.ones((3, 3)), border_value=0)
    kill = edge & (white if it < 3 else deep)
    n = int(kill.sum()); peeled += n
    if n == 0: break
    a &= ~kill
log['peeled'] = peeled
# 3) trapped flat white inside the crescent blade (raw box x 700..832, y 700..840)
blade = np.zeros_like(a); blade[700:840, 700:832] = True
flat = a & blade & (mn >= 238) & (spread <= 14)
lab, n = ndi.label(flat, structure=np.ones((3, 3)))
sz = ndi.sum(flat, lab, range(1, n + 1))
trap = np.isin(lab, [i + 1 for i, s in enumerate(sz) if s >= 25])
trap = ndi.binary_dilation(trap, iterations=2) & a & blade & (mn >= 200) & (spread <= 30)
a &= ~trap; log['blade_trapped'] = int(trap.sum())
# other enclosed flat-white background pockets anywhere (>= 25 px, fully flat)
flat2 = a & (mn >= 245) & (spread <= 8)
lab, n = ndi.label(flat2, structure=np.ones((3, 3))); sz = ndi.sum(flat2, lab, range(1, n + 1))
pockets = [(int(s), tuple(int(v) for v in ndi.center_of_mass(flat2, lab, i + 1))) for i, s in enumerate(sz) if s >= 25]
log['flat_white_left'] = pockets
# 4) specks
lab, n = ndi.label(a, structure=np.ones((3, 3))); sz = ndi.sum(a, lab, range(1, n + 1))
small = np.isin(lab, [i + 1 for i, s in enumerate(sz) if s < 12]); a &= ~small; log['specks'] = int(small.sum())
out = np.zeros((H, W, 4), np.uint8); out[:, :, :3] = raw; out[:, :, 3] = np.where(a, 255, 0); out[~a, :3] = 0
Image.fromarray(out).save('cut.png'); print(log)
