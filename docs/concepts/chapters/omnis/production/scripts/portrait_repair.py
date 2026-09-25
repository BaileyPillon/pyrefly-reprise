"""Chapter XII (FFX only): one masked repair of the B17 c Omnis portrait candidate (judge FAIL 5.9, 2026-09-25).
1) The blown forehead oval and its orange rim are painted down to the surrounding skin: a harmonic (Laplace)
   fill from the skin around the mask, plus a faint grain matched to that skin. No GPU.
2) The 229 px hair-crown pocket at (246-270, 159-175) is closed from the raw render's own pixels (portrait.b3).
3) The pale edge fringe is peeled: 1 px edge pixels more than 50 brighter than the 9 px interior mean become
   transparent (one pass, canvas-edge rows kept), then any left are recoloured to that interior mean."""
import json, sys, hashlib
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi
SRC = 'D:/Final Fantasy/public/art/portraits/seymour-omnis.png'
RAW = 'D:/Tools/pyrefly-scratch/ch1215/omnis/work/portrait.b3.png'
OUT = sys.argv[1] if len(sys.argv) > 1 else 'seymour-omnis.repaired.png'
p = np.array(Image.open(SRC).convert('RGBA')).astype(np.float64)
raw = np.array(Image.open(RAW).convert('RGB')).astype(np.float64)
H, W = p.shape[:2]
rgb, al = p[..., :3], p[..., 3] > 127
mn, mx = rgb.min(2), rgb.max(2)
# ---- 1) the oval
box = np.zeros((H, W), bool); box[195:362, 285:395] = True
core = (mn > 215) & box & al
lab, n = ndi.label(core)
seed = lab[255, 335]
oval = lab == seed if seed else core
rim = box & al & (rgb[..., 0] > rgb[..., 2] + 6)
m = ndi.binary_dilation(oval, iterations=4)
m |= rim & ndi.binary_dilation(oval, iterations=12)
m = ndi.binary_dilation(m, iterations=2) & al
fill = rgb.copy()
ys, xs = np.nonzero(m)
y0, y1, x0, x1 = ys.min() - 2, ys.max() + 3, xs.min() - 2, xs.max() + 3
sub = fill[y0:y1, x0:x1].copy(); mk = m[y0:y1, x0:x1]
# Dark neighbours (the brow line, lashes, the hairline) are not skin: they take no part as a boundary
# (a Neumann edge there), so the fill never smears them into the forehead.
lum_sub = sub @ [0.299, 0.587, 0.114]
wgt = (mk | (lum_sub >= 140)).astype(np.float64)
init = sub[(~mk) & (lum_sub >= 140)].mean(0); sub[mk] = init
nb = lambda a: (np.roll(a, 1, 0), np.roll(a, -1, 0), np.roll(a, 1, 1), np.roll(a, -1, 1))
den = sum(nb(wgt))
for _ in range(5000):  # Jacobi on the masked pixels only
    num = sum(x * w[..., None] for x, w in zip(nb(sub), nb(wgt)))
    sub[mk] = (num / np.maximum(den, 1e-9)[..., None])[mk]
grain_sd = 0.0  # no grain: the skin around is flat cel shading (a grain read as noise at 2x)
fill[y0:y1, x0:x1] = sub
# feather the join over 2 px
w = ndi.gaussian_filter(m.astype(float), 1.0); w = np.maximum(w, m)
rgb = rgb * (1 - w[..., None]) + fill * w[..., None]
# ---- 2) the pocket
tr = ~al
lab2, n2 = ndi.label(tr)
pk = lab2 == lab2[167, 258]
assert 150 < pk.sum() < 400, pk.sum()
rgb[pk] = raw[pk]; al = al | pk
# ---- 3) the fringe
def halo_mask(rgb, al):
    er = lambda s: np.array(Image.fromarray((al * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(s))) > 127
    edge = al & ~er(3); inner = er(7)
    lum = rgb @ [0.299, 0.587, 0.114]
    ls = ndi.uniform_filter(lum * inner, 9) ; ms = ndi.uniform_filter(inner.astype(float), 9)
    ok = ms * 81 > 0.5
    inter = np.where(ok, ls / np.maximum(ms, 1e-9), 0)
    frame = np.zeros_like(al); frame[0, :] = frame[-1, :] = frame[:, 0] = frame[:, -1] = True
    return edge & ok & (lum > inter + 50) & ~frame, edge & ok, rgb.copy(), inter, ls, ms
hm, e, _, inter, ls, ms = halo_mask(rgb, al)
before = float(hm.sum() / max(e.sum(), 1))
al = al & ~hm
hm2, e2, _, _, _, _ = halo_mask(rgb, al)
# recolour the rest to the interior mean colour
inner = np.array(Image.fromarray((al * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(7))) > 127
cs = np.stack([ndi.uniform_filter(rgb[..., c] * inner, 9) for c in range(3)], -1)
cm = ndi.uniform_filter(inner.astype(float), 9)
mean_c = cs / np.maximum(cm, 1e-9)[..., None]
rgb[hm2] = mean_c[hm2]
hm3, e3, _, _, _, _ = halo_mask(rgb, al)
# the peel must not open pinholes: refill enclosed transparent specks under 10 px
l4, n4 = ndi.label(~al)
b4 = set(np.unique(np.concatenate([l4[0], l4[-1], l4[:, 0], l4[:, -1]]))) - {0}
s4 = ndi.sum(~al, l4, range(1, n4 + 1))
pin = np.isin(l4, [i + 1 for i, s in enumerate(s4) if s < 10 and (i + 1) not in b4])
al |= pin
# drop specks under 40 px
lab3, n3 = ndi.label(al, structure=np.ones((3, 3)))
sz = ndi.sum(al, lab3, range(1, n3 + 1))
al &= ~np.isin(lab3, [i + 1 for i, s in enumerate(sz) if s < 40])
out = np.zeros((H, W, 4), np.uint8)
out[..., :3] = np.where(al[..., None], np.clip(np.rint(rgb), 0, 255), 0).astype(np.uint8)
out[..., 3] = np.where(al, 255, 0)
Image.fromarray(out).save(OUT)
o = out[..., :3].astype(int)
blown = int(((o.min(2) > 235) & (out[..., 3] > 0))[212:300, 300:370].sum())
print(json.dumps({'ovalMaskPx': int(m.sum()), 'pocketClosedPx': int(pk.sum()), 'haloBefore': round(before, 4),
  'haloPeeledPx': int(hm.sum()), 'haloRecolouredPx': int(hm2.sum()), 'haloAfter': round(float(hm3.sum() / max(e3.sum(), 1)), 4),
  'blownPxInOvalBox': blown, 'grainSd': round(grain_sd, 2), 'sha256': hashlib.sha256(open(OUT, 'rb').read()).hexdigest()}))
