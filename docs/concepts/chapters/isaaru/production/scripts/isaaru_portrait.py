# Chapter XIV (FFX only): Isaaru's speaker portrait from the picked O-2 B render (isaaru-pb2, seed 924202), method r3.
# O-2 B was painted from O-1 C's look; Bailey picked O-1 A for the billboard, so the portrait's colours are brought to
# the O-1 A pick (and toward the wiki's "black jacket edged in sea green"), all pixel work, no GPU:
#   1. the yellow-green upper lapels and inner V recoloured sea green, a*/b* taken from the portrait's OWN sea-green
#      lower lapels at each pixel's lightness (no new colour);
#   2. the green-tinted hair strands at both shoulders brought back to his brown, from the portrait's own hair ramp;
#   3. the blue hair tie made gold like O-1 A's, from the portrait's own bronze medallion ramp;
#   4. the royal-navy coat pulled toward black as on the billboard (chroma x0.5, L x0.9).
# Usage: python isaaru_portrait.py <in.png> <out.png> <maskdir>
import sys, os
import numpy as np
from PIL import Image, ImageFilter
sys.path.insert(0, os.path.dirname(__file__))
from labkit import rgb2lab, lab2rgb, rgb2hsv

src, out, md = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(md, exist_ok=True)
im = Image.open(src).convert('RGBA')
W, H = im.size
A = np.asarray(im).astype(np.float64)
rgb, al = A[..., :3], A[..., 3]
hsv = rgb2hsv(rgb); h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
lab = rgb2lab(rgb)
ys, xs = np.mgrid[0:H, 0:W]
op = al > 8

def save(m, n): Image.fromarray((m * 255).astype(np.uint8)).save(f'{md}/{n}.png')
def dil(m, r): return np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(2 * r + 1))) > 0

def table(ref):
    Lr = ref[:, 0]; bins = np.linspace(np.percentile(Lr, 1), np.percentile(Lr, 99), 20); bi = np.digitize(Lr, bins)
    t = np.array([[bins[i - 1], *ref[bi == i, 1:].mean(0)] for i in range(1, 21) if (bi == i).sum() > 6])
    return t
def recolour(sel, t, w=None, lshift=0.0, lscale=1.0):
    L = lab[sel, 0] * lscale + lshift
    ab = np.stack([np.interp(L, t[:, 0], t[:, 1]), np.interp(L, t[:, 0], t[:, 2])], -1)
    new = np.concatenate([L[:, None], ab], -1)
    ww = np.ones(sel.sum()) if w is None else w[sel]
    lab[sel] = lab[sel] * (1 - ww[:, None]) + new * ww[:, None]

teal = op & (h >= 160) & (h < 200) & (s > 0.3) & (ys > 690)
yg = op & (h > 48) & (h < 105) & (s > 0.22) & (ys > 560)
w_yg = np.clip((s - 0.18) / 0.12, 0, 1)
hair = op & (h > 12) & (h < 40) & (s > 0.2) & (v > 0.2) & (ys < 700) & (ys > 150)
green_hair = op & (h >= 95) & (h < 200) & (s > 0.06) & (ys > 330) & (((ys < 690) & (s < 0.45)) | ((ys < 760) & (h < 160))) & ~teal
w_gh = np.clip((s - 0.04) / 0.1, 0, 1)
medal = op & (h > 22) & (h < 48) & (s > 0.45) & (v > 0.35) & (ys > 800)
tie = op & (ys < 95) & (h >= 215) & (h < 265) & (s > 0.35) & (v > 0.28)
navy = op & (h >= 215) & (h < 260) & (s > 0.3) & (v < 0.55) & (ys > 620) & ~yg & ~teal
for n, m in [('teal-ref', teal), ('yg', yg), ('hair-ref', hair), ('green-hair', green_hair), ('medal-ref', medal), ('tie', tie), ('navy', navy)]:
    save(m, n)
print({n: int(m.sum()) for n, m in [('teal', teal), ('yg', yg), ('hair', hair), ('green_hair', green_hair), ('medal', medal), ('tie', tie), ('navy', navy)]})

recolour(yg, table(lab[teal]), w_yg, lshift=-6)
recolour(green_hair, table(lab[hair]), w_gh, lscale=0.8)
recolour(tie, table(lab[medal]), None, lshift=18)
lab[navy, 1:] *= 0.5; lab[navy, 0] *= 0.9

chg = yg | green_hair | tie | navy
o = rgb.copy(); o[chg] = lab2rgb(lab[chg])
res = np.dstack([o, al]).clip(0, 255).astype(np.uint8)
Image.fromarray(res, 'RGBA').save(out)
diff = np.abs(res.astype(int) - A.astype(int)).max(-1) > 3
save(diff, 'changed')
print('changed share of opaque', round(diff.sum() / op.sum(), 3))
