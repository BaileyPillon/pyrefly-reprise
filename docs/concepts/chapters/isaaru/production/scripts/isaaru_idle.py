# Chapter XIV (FFX only): Isaaru's idle from the picked O-1 A render (isaaru-a3, seed 921103), method r3.
# The picked pixels are the painting. Repairs toward the wiki's words (Isaaru, "Appearance", revid 4026440),
# as far as the pick allows, all pixel work (no GPU):
#   1. the coat's sea-green front panels end at the knee (they reached the ankles): erased below a hem line,
#      the white robe in front is untouched, a 2 px ink hem drawn along the cut;
#   2. the wide white sash recoloured sea green, and the navy cord knot with its hanging cords a deeper sea green
#      (a Lab rank-map onto the painting's OWN sea-green lapel pixels: no new colour is invented);
#   3. the dark navy coat pulled toward black (chroma x0.5, L x0.9);
#   4. the white robe's highlights compressed (L>75 -> 75+(L-75)*0.6) so the chapter's bloom does not blow it out.
# Usage: python isaaru_idle.py <in.png> <out.png> <maskdir>
import sys, os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
sys.path.insert(0, os.path.dirname(__file__))
from labkit import rgb2lab, lab2rgb, rgb2hsv, ramp_map

src, out, md = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(md, exist_ok=True)
im = Image.open(src).convert('RGBA')
W, H = im.size
A = np.asarray(im).astype(np.float64)
rgb, al = A[..., :3].copy(), A[..., 3].copy()
hsv = rgb2hsv(rgb)
hue, sat, val = hsv[..., 0], hsv[..., 1], hsv[..., 2]
lab = rgb2lab(rgb)
ys, xs = np.mgrid[0:H, 0:W]

def poly(pts):
    m = Image.new('L', (W, H), 0); ImageDraw.Draw(m).polygon(pts, fill=255)
    return np.asarray(m) > 0

def dil(mask, r):
    return np.asarray(Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(2 * r + 1))) > 0

def save(mask, name):
    Image.fromarray((mask * 255).astype(np.uint8)).save(f'{md}/{name}.png')

opaque = al > 8
teal = (hue > 160) & (hue < 200) & (sat > 0.4) & (val > 0.3) & opaque
# reference ramp: the painting's own sea-green lapels and collar
lapel_ref = teal & poly([(330, 160), (545, 160), (545, 300), (330, 300)])
ref = lab[lapel_ref]
print('lapel ref px', lapel_ref.sum(), 'L q05/50/95', np.percentile(ref[:, 0], [5, 50, 95]).round(1))

# ---- 1. knee hem: the sea-green front panels below the knee go; the robe in front keeps every pixel
KNEE = 846
robe = opaque & (sat < 0.5) & (val > 0.45) & (((hue > 195) & (hue < 260)) | (sat < 0.12))   # white / lavender robe
def cut_y(x, side):
    return KNEE + (250 - x) * 0.10 if side == 'L' else KNEE + (x - 560) * 0.10
below = (((xs < 330) & (ys > cut_y(xs, 'L'))) | ((xs > 560) & (ys > cut_y(xs, 'R')))) & (ys < 1110)
tealp = opaque & (hue > 150) & (hue < 205) & (sat > 0.25) & (val > 0.15)
e0 = below & tealp & (xs < 330)
eraseL = e0 | (dil(e0, 5) & below & ~robe & (xs < 330))       # left: the panel, its outer ink, its anti-aliased rim
# right: the strip hangs outside the robe's edge; fit that edge as a straight line along the strip's inner side
# and cut everything outside it, so the robe keeps a clean silhouette
rows = [y for y in range(KNEE, 1110) if (tealp[y, 560:] & (xs[y, 560:] > 560)).any() and y > cut_y(600, 'R')]
xt = np.array([560 + np.nonzero(tealp[y, 560:])[0].min() for y in rows], np.float64)
ka, kb = np.polyfit(np.array(rows, np.float64), xt, 1)
yend = max(rows) + 3
edge = ka * ys + kb - 1.0                                   # the robe's new outer edge (sub-pixel)
cov = np.clip(edge - xs, 0, 1)                              # 1 inside, 0 outside, fractional on the edge pixel
bandR = (xs > 560) & (ys > cut_y(xs, 'R')) & (ys <= yend)
eraseR = bandR & (cov < 1) & opaque
save(eraseL | eraseR, 'erase-knee')
panel_above = tealp & ~below & (ys > KNEE - 40) & ((xs < 330) | (xs > 560))
erase = eraseL | eraseR
hem = panel_above & dil(erase, 2)                           # ink along the new hem
reinkL = robe & dil(eraseL, 2) & below
inkR = bandR & (xs >= edge - 3) & (cov > 0)                 # a 2-3 px ink line along the fitted edge
save(hem | reinkL | inkR, 'hem')
al_new = al.copy()
al_new[eraseR] = al[eraseR] * cov[eraseR]
al_new[eraseL] = 0
al = al_new
ink = np.array([22, 24, 34], np.float64)
rgb[hem] = rgb[hem] * 0.15 + ink * 0.85
rgb[reinkL] = rgb[reinkL] * 0.25 + ink * 0.75
rgb[inkR] = rgb[inkR] * 0.2 + ink * 0.8
lab = rgb2lab(rgb)
print('right edge fit x = %.4f*y + %.1f over rows %d..%d' % (ka, kb, min(rows), max(rows)))

# ---- 2. belt and cord knot -> sea green, taking a*/b* from the painting's OWN lapel at the new lightness
Lr = ref[:, 0]
bins = np.linspace(Lr.min(), Lr.max(), 24)
bi = np.digitize(Lr, bins)
tab = np.array([[bins[i - 1], *ref[bi == i, 1:].mean(0)] for i in range(1, 25) if (bi == i).sum() > 8])
def ab_at(L):
    return np.stack([np.interp(L, tab[:, 0], tab[:, 1]), np.interp(L, tab[:, 0], tab[:, 2])], -1)
def remap(sel, w, lo, hi, tlo, thi):
    L = lab[sel, 0]
    Ln = tlo + np.clip((L - lo) / (hi - lo), 0, 1) * (thi - tlo)
    new = np.concatenate([Ln[:, None], ab_at(Ln)], -1)
    ww = w[sel][:, None]
    lab[sel] = lab[sel] * (1 - ww) + new * ww

sash_poly = poly([(396, 372), (420, 366), (470, 361), (510, 361), (535, 367), (539, 382), (532, 402), (470, 409), (440, 407), (400, 409), (395, 395)])
knot_poly = poly([(398, 392), (455, 372), (500, 366), (532, 370), (550, 408), (552, 452), (538, 478), (534, 940), (466, 940), (470, 480), (454, 470), (446, 430), (398, 412)])
blue = (hue > 205) & (hue < 250)
Cq = np.hypot(lab[..., 1], lab[..., 2])
core = blue & opaque & knot_poly & (lab[..., 0] < 55) & (Cq > 25) & ((ys >= 478) | (val > 0.22))
hl = blue & opaque & knot_poly & dil(core, 2) & (lab[..., 0] < 66) & (Cq > 31) & ((ys >= 478) | (val > 0.22))
w_cord = (core | hl).astype(np.float64)
w_cord[hl & ~core] = np.clip((66 - lab[hl & ~core, 0]) / 11, 0, 1)
w_sash = (sash_poly & opaque & (val > 0.5) & (sat < 0.5)).astype(np.float64) * (1 - w_cord)
cord = w_cord > 0.02; sash = w_sash > 0.02
save(cord, 'cord'); save(sash, 'sash')
remap(sash, w_sash, 55, 99, 50, 80)
remap(cord, w_cord, 10, 78, 16, 54)

# ---- 3. navy coat toward black
navy = opaque & (hue > 195) & (hue < 260) & (sat > 0.18) & (val < 0.5) & ~cord & ~sash
save(navy, 'navy')
lab[navy, 1:] *= 0.5
lab[navy, 0] *= 0.9

# ---- 4. tame the white robe's highlights (low chroma, bright)
chroma = np.hypot(lab[..., 1], lab[..., 2])
hi = opaque & (lab[..., 0] > 75) & (chroma < 16) & ~sash & ~cord
lab[hi, 0] = 75 + (lab[hi, 0] - 75) * 0.6
save(hi, 'robe-tame')

rgb2 = rgb.copy()
chg = sash | cord | navy | hi
rgb2[chg] = lab2rgb(lab[chg])
o = np.dstack([rgb2, al]).clip(0, 255).astype(np.uint8)
Image.fromarray(o, 'RGBA').save(out)
diff = (np.abs(o.astype(int) - A.astype(int)).max(-1) > 3)
save(diff, 'changed')
print('erase', erase.sum(), 'hem', hem.sum(), 'sash', sash.sum(), 'cord', cord.sum(), 'navy', navy.sum(), 'tame', hi.sum(),
      'changed share of opaque', round(diff.sum() / opaque.sum(), 3))
