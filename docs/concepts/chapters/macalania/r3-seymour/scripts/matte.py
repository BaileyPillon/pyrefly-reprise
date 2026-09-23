"""Peel the white rembg halo off the concept cut-out (FFX only, Seymour). Binary alpha kept (house convention)."""
import sys, numpy as np
from PIL import Image
from scipy import ndimage as ndi
src, out = sys.argv[1], sys.argv[2]
im = np.array(Image.open(src).convert("RGBA")).astype(np.int32)
rgb, a = im[:, :, :3], im[:, :, 3] > 0
mn, mx = rgb.min(2), rgb.max(2)
white = (mn >= int(sys.argv[3]) if len(sys.argv) > 3 else mn >= 205) & ((mx - mn) <= 34)
deep = (mn >= 225) & ((mx - mn) <= 22)
removed = 0
for it in range(12):
    edge = a & ~ndi.binary_erosion(a, structure=np.ones((3, 3)), border_value=0)
    kill = edge & (white if it < 3 else deep)
    n = int(kill.sum()); removed += n
    if n == 0: break
    a &= ~kill
# drop specks: opaque components under 12 px
lab, n = ndi.label(a, structure=np.ones((3, 3)))
sizes = ndi.sum(a, lab, range(1, n + 1))
small = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s < 12])
a &= ~small
im[:, :, 3] = np.where(a, 255, 0)
im[:, :, :3][~a] = 0
Image.fromarray(im.astype(np.uint8)).save(out)
print("peeled", removed, "specks", int(small.sum()), "components", n)
# enclosed background gaps between the right-hand hair strands (box authored by eye at 1:1)
im2 = np.array(Image.open(out)).astype(np.int32)
rgb2, a2 = im2[:, :, :3], im2[:, :, 3] > 0
mn2, mx2 = rgb2.min(2), rgb2.max(2)
gap = a2 & (mn2 >= 226) & ((mx2 - mn2) <= 16)
box = np.zeros_like(gap); box[150:440, 430:640] = True
gap &= box
gap = ndi.binary_dilation(gap, iterations=1) & a2 & (mn2 >= 205) & ((mx2 - mn2) <= 30) & box
lab, n = ndi.label(gap, structure=np.ones((3, 3)))
sizes = ndi.sum(gap, lab, range(1, n + 1))
kill = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if 3 <= s <= 300])
im2[:, :, 3][kill] = 0; im2[:, :, :3][kill] = 0
Image.fromarray(im2.astype(np.uint8)).save(out)
print("gaps", int(kill.sum()), [int(s) for s in sizes])
