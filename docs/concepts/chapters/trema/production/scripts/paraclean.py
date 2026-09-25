# Paragon idle: erase the loose curved blade in front of it (the options README flaw: "a tail or scythe that is not
# attached"). Flood from a seed on the blade over opaque, non-fur pixels inside its box; erase alpha only, plus a
# 2 px guard; the fur edge it leaned on keeps its pixels. Usage: paraclean.py in.png out.png
import sys, numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
inp, out = sys.argv[1:3]
A = np.asarray(Image.open(inp).convert('RGBA')).astype(np.int32); r, g, b, al = [A[..., i] for i in range(4)]
H, W = al.shape
yy, xx = np.mgrid[0:H, 0:W]
POLY = [(318,392),(318,415),(280,440),(215,490),(160,560),(130,630),(135,690),(200,712),(300,700),(365,700),(370,815),(0,815),(0,392)]
pm = Image.new('L', (W, H), 0); ImageDraw.Draw(pm).polygon(POLY, fill=255); box = np.asarray(pm) > 0
fur = (r - b > 22) & (r > g - 5)
cand = box & (al > 12)
lab, n = ndi.label(cand)
metal = (b >= r - 3) & ((r + g + b) / 3 > 80)
blade = box & (al > 12) & ((yy >= 445) | ndi.binary_dilation(metal & box, iterations=3))  # near the mane (y < 445) only the blade's light blue-grey metal and its 3 px ink edge, never the dark fur


bl = ndi.binary_dilation(blade, iterations=2) & box & ~(fur & (al > 200))
na = np.where(bl, 0, al)
res = A.copy(); res[..., 3] = na
# anything left detached and small
lab2, n2 = ndi.label(na > 12); sizes = ndi.sum(np.ones_like(na), lab2, range(1, n2 + 1))
keep = 1 + int(np.argmax(sizes)); small = (lab2 > 0) & (lab2 != keep) & np.isin(lab2, [i + 1 for i, s in enumerate(sizes) if s < 400])
res[small, 3] = 0
Image.fromarray(res.astype(np.uint8), 'RGBA').save(out)
Image.fromarray((bl * 255).astype(np.uint8)).save(out[:-4] + '-erased.png')
print(out, 'erased', int((bl & (al > 12)).sum()), 'specks', int(small.sum()), 'components left', n2 - int(np.isin(np.arange(1, n2 + 1), np.unique(lab2[small])).sum()))
# (2) white background pockets rembg left between the claws and legs (neutral white, > 40 px, below row 300), and
# (3) the white matte halo on the silhouette (neutral near-white pixels touching transparency, 2 passes); the
# gold spikes' warm highlights are not neutral and are kept.
R = np.asarray(Image.open(out).convert('RGBA')).astype(np.int32)
c = R[..., :3]; neutral = (c.min(-1) > 225) & ((c.max(-1) - c.min(-1)) < 18) & (R[..., 3] > 0)
lab3, n3 = ndi.label(neutral); sz = ndi.sum(np.ones(neutral.shape), lab3, range(1, n3 + 1))
cy = ndi.center_of_mass(np.ones(neutral.shape), lab3, range(1, n3 + 1))
pock = np.isin(lab3, [i + 1 for i in range(n3) if sz[i] > 40 and cy[i][0] > 300])
pock = ndi.binary_dilation(pock, iterations=1) & (c.min(-1) > 190)
R[pock, 3] = 0
halo_total = 0
for _ in range(2):
    c = R[..., :3]; nearw = (c.min(-1) > 200) & ((c.max(-1) - c.min(-1)) < 24) & (R[..., 3] > 0)
    touch = ndi.binary_dilation(R[..., 3] < 10, iterations=1)
    h = nearw & touch; R[h, 3] = 0; halo_total += int(h.sum())
Image.fromarray(R.astype(np.uint8), 'RGBA').save(out)
print('pockets opened', int(pock.sum()), 'halo peeled', halo_total)
