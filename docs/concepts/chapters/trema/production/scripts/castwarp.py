# Trema hero cast, derived from the idle's own pixels (method r3): the raised hand and its cuff are lifted D px and
# the wide sleeve that hangs from that wrist is stretched to follow, so the hand rises to his beard line; the sleeve's
# hem stays where it was. Everything outside the arm polygon is the idle's pixels exactly.
# Usage: castwarp.py idle.png out.png D
import sys, json, numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
inp, out, D = sys.argv[1], sys.argv[2], float(sys.argv[3])
im = Image.open(inp).convert('RGBA'); A = np.asarray(im).astype(np.float32); H, W = A.shape[:2]
POLY = [(160,250),(222,250),(254,330),(260,372),(284,377),(320,395),(320,420),(307,440),(307,460),(304,480),(301,500),
        (295,520),(292,560),(289,600),(286,640),(283,680),(280,708),(192,708),(192,400),(160,396)]
pm = Image.new('L', (W, H), 0); ImageDraw.Draw(pm).polygon(POLY, fill=255); M = np.asarray(pm) > 0
Y0, YB = 380.0, 708.0
lay = A.copy(); lay[..., 3] *= M; lay[..., :3] *= lay[..., 3:4] / 255  # premultiplied
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
top = Y0 - D; k = (YB - Y0) / (YB - top)
ys = np.where(yy < top, yy + D, np.where(yy < YB, Y0 + (yy - top) * k, yy))
warped = np.stack([ndi.map_coordinates(lay[..., c], [ys, xx], order=1, mode='constant') for c in range(4)], -1)
# only rows the arm can reach
reach = (yy < YB)
warped *= reach[..., None]
base = A.copy(); base[M, 3] = 0; base[..., :3] *= base[..., 3:4] / 255
# vacated slivers inside the body: M pixels that were opaque, now uncovered, enclosed by the body -> diffuse fill
wa = warped[..., 3]
vac = M & (A[..., 3] > 128) & (wa < 128)
body = (base[..., 3] > 200)
encl = ndi.binary_fill_holes(ndi.binary_closing(body | (wa > 128), iterations=4))
vac &= encl
col = np.where(base[..., 3:4] > 0, base[..., :3] * 255 / np.maximum(base[..., 3:4], 1), 0); known = body.copy()
for it in range(400):
    s = ndi.uniform_filter(col * known[..., None], size=(3, 3, 1)); kk = ndi.uniform_filter(known.astype(np.float32), 3)
    upd = vac & ~known & (kk > 0.001)
    if not upd.any(): break
    col[upd] = s[upd] / kk[upd][:, None]; known |= upd
base[vac, :3] = col[vac]; base[vac, 3] = 255
# composite premultiplied layer over base
outp = warped + base * (1 - wa[..., None] / 255)
a = outp[..., 3:4]; rgb = np.where(a > 0, outp[..., :3] * 255 / np.maximum(a, 1), 0)
res = np.concatenate([rgb, a], -1).clip(0, 255).astype(np.uint8)
Image.fromarray(res, 'RGBA').save(out)
# seam mask for the repaint: the wrist joint, the sleeve's top edge where it now crosses the chest, and the vacated slivers
sm = Image.new('L', (W, H), 0); d = ImageDraw.Draw(sm)
d.ellipse((222, 372 - D - 16, 270, 372 - D + 22), fill=255)          # wrist/cuff mouth
d.polygon([(250, 370 - D), (325, 392 - D), (330, 420), (300, 420), (250, 300 - D + 70)], fill=255)  # sleeve top vs chest
smn = (np.asarray(sm) > 0) | ndi.binary_dilation(vac, iterations=5)
edge = ndi.binary_dilation(M, iterations=4) & ~ndi.binary_erosion(M, iterations=4) & (res[..., 3] > 30) & (yy > 380 - D) & (xx > 270)
smn |= edge
Image.fromarray((smn * 255).astype(np.uint8)).save(out[:-4] + '-seam.png')
print(out, 'D', D, 'vacated', int(vac.sum()), 'seam px', int(smn.sum()))
