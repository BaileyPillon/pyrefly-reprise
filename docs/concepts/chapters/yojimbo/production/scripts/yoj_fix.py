# Yojimbo, Lady Ginnem's (FFX only): the picked concept pixels (yojimbo-a2, seed 902102).
# Repair 1: erase the second scabbard that crosses behind him (the black saya between the robe and the hat tassel),
# the one clean-pass item the options README named. Pixel-only: nothing repainted; kept RGB are the concept's own.
# Repair 2: peel the near-white matte halo on the outer edge (grey-white only; the pale geta wood is kept).
import numpy as np, json
from PIL import Image
from scipy import ndimage as ndi
im = np.array(Image.open('yojimbo-a2.png')).astype(int)
r, g, b, al = im[..., 0], im[..., 1], im[..., 2], im[..., 3]
a = al > 0
H, W = a.shape
log = {}
from PIL import ImageDraw
poly = Image.new('L', (W, H), 0); ImageDraw.Draw(poly).polygon([(424, 574), (572, 652), (572, 694), (424, 624)], fill=255)
box = (np.array(poly) > 0); box[:, :427] = False
red = (r > 120) & (r > g + 60) & (r > b + 40)
redzone = ndi.binary_dilation(red & box, iterations=2)  # tassel plus its own ink outline
saya = a & box & ~redzone
# only the part connected to the saya body (not the robe, which lies at x < 424)
lab, n = ndi.label(saya, structure=np.ones((3, 3)))
sz = ndi.sum(saya, lab, range(1, n + 1))
keep_ids = [i + 1 for i, s in enumerate(sz) if s >= 30]
saya = np.isin(lab, keep_ids)
# the robe's own right edge runs straight from (421,575) to (437,655): the saya stub right of it goes, the robe left of it stays
yy, xx = np.mgrid[0:H, 0:W]
line = 421 + (yy - 575) * 0.2
band = (yy >= 575) & (yy <= 632) & (xx < 445)
saya = (saya & ~(band & (xx <= line))) | (a & band & (xx > line + 0.5))
log['saya_erased'] = int(saya.sum())
a &= ~saya
# halo peel: edge pixels that are grey-white
mn = im[..., :3].min(2); mx = im[..., :3].max(2); spread = mx - mn
white = (mn >= 215) & (spread <= 22)
peeled = 0
for it in range(3):
    edge = a & ~ndi.binary_erosion(a, structure=np.ones((3, 3)), border_value=0)
    kill = edge & white
    peeled += int(kill.sum()); a &= ~kill
log['halo_peeled'] = peeled
lab, n = ndi.label(a, structure=np.ones((3, 3))); sz = ndi.sum(a, lab, range(1, n + 1))
small = np.isin(lab, [i + 1 for i, s in enumerate(sz) if s < 30]); a &= ~small; log['specks'] = int(small.sum())
out = im.astype(np.uint8).copy(); out[..., 3] = np.where(a, 255, 0); out[~a, :3] = 0
Image.fromarray(out).save('yojimbo-fixed.png')
m = np.zeros((H, W), np.uint8); m[saya] = 255; Image.fromarray(m).save('yojimbo-saya-mask.png')
print(json.dumps(log))
