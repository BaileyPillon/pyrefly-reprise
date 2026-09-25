# Baralai hero cast, repair pass (judge 2026-09-25: boot tear, ruler-cut coat edge + notch, debris at the staff butt,
# far hand a stump on a cord). Re-derived from the LOCKED idle's opaque render (renders/baralai.3.png), same geometry as
# bar_cast.py (22 deg about the same elbow), with these changes:
#  1. the moving pole takes ONLY strictly blue pole pixels (+ their 2 px dark outline), never the "b >= r" test that
#     also lifted boot, trouser and coat-edge pixels (the tear, the notch and the rotated flag-shaped debris);
#  2. the far hand (the lower grip on the old pole) and its cord are removed: the hand now hides behind the coat;
#  3. the coat's front edge (rows 500-955, the idle's own straight edge) gets a smooth hand-drawn wave and a fresh
#     2 px ink line, pre-filled with the coat's own colours, then repainted in a band;
#  4. the hole the pole leaves in front of the near boot is closed and pre-filled with the boot's own colours;
#  5. the rebuilt pole ends in a rounded bronze butt cap.
# The chest the forearm uncovers keeps the judged repaint (work/bar-cast-r965102.png inside work/bar-cast-mask.png).
# Writes out/bar2-pre.png (composite, pre-filled) and out/bar2-mask.png (the one repaint mask).
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage
S = 'D:/Tools/pyrefly-scratch/ch1215/gippal'
O = 'D:/Tools/pyrefly-scratch/ch1215/gippal-repair/out'
ANG = 22
src = Image.open(f'{S}/renders/baralai.3.png').convert('RGBA')
PL, PT, PB, PR = 260, 60, 40, 60
W, H = src.width + PL + PR, src.height + PT + PB
im = Image.new('RGBA', (W, H), (0, 0, 0, 0)); im.paste(src, (PL, PT), src)
A = np.asarray(im).astype(np.float32)
yy, xx = np.mgrid[0:H, 0:W]; X = xx - PL; Y = yy - PT
alpha = A[..., 3]
r, g, b = A[..., 0], A[..., 1], A[..., 2]
lum = (r + g + b) / 3
axis = 83 + (Y - 440) * 0.035
blue = (b > r + 30) & (b > g + 12) & (alpha > 0)
fore = Image.new('L', (W, H), 0)
ImageDraw.Draw(fore).polygon([(x + PL, y + PT) for x, y in [(118, 300), (130, 298), (205, 340), (250, 368), (266, 392), (258, 420), (232, 428), (190, 405), (120, 362), (104, 345)]], fill=255)
foreM = np.asarray(fore) > 0
upper = (X < 118) & (Y < 445) & ~((X > 104) & (Y < 135))
strip = (Y >= 445) & (Y < 1000) & (np.abs(X - axis) < 20)  # below 1000 the blue is the near boot's laces, not the pole
pole_core = strip & blue
pole_vis = pole_core | (strip & ndimage.binary_dilation(pole_core, iterations=2) & (lum < 70) & (alpha > 0))
M = (upper | foreM | pole_vis) & (alpha > 0)

# ---- the moving layer: as bar_cast.py, pole rebuilt by tiling rows 445-495 of the idle's pole ----
slice_rows = []
for y in range(445, 495):
    cx = 83 + (y - 440) * 0.035
    xs = np.arange(int(cx) - 16, int(cx) + 17)
    slice_rows.append(A[y + PT, xs + PL].copy())
PROFILE = np.median(np.stack(slice_rows), 0)
pole = np.zeros_like(A)
BOTTOM = 1136
for y in range(445, BOTTOM):
    cx = int(83 + (y - 440) * 0.035)
    xs = np.arange(cx - 16, cx + 17) + PL
    keep = (PROFILE[:, 2] > PROFILE[:, 0] + 30) & (PROFILE[:, 3] > 0)
    tgt = pole[y + PT, xs]; tgt[keep] = PROFILE[keep]; pole[y + PT, xs] = tgt
# pole half-width at the bottom, from the profile
kx = np.nonzero((PROFILE[:, 2] > PROFILE[:, 0] + 30) & (PROFILE[:, 3] > 0))[0]
half = (kx.max() - kx.min() + 1) / 2 + 1
cxb = 83 + (BOTTOM - 440) * 0.035 + PL
capL = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(capL)
# ferrule: a bronze band a little wider than the pole, then a rounded end, both with an ink outline
fy0, fy1 = BOTTOM - 26 + PT, BOTTOM + 12 + PT
d.rounded_rectangle((cxb - half - 3, fy0, cxb + half + 3, fy1), radius=int(half + 2), fill=(40, 30, 22, 255))
d.rounded_rectangle((cxb - half - 1, fy0 + 2, cxb + half + 1, fy1 - 2), radius=int(half), fill=(176, 128, 52, 255))
d.rectangle((cxb - half - 1, fy0 + 9, cxb + half + 1, fy0 + 11), fill=(92, 62, 26, 255))
d.line((cxb - half + 3, fy0 + 4, cxb - half + 3, fy1 - 8), fill=(236, 200, 120, 255), width=2)
cap = np.asarray(capL).astype(np.float32)
layer = A * M[..., None]
pm = (pole[..., 3] > 0) & ~M
layer[pm] = pole[pm]
cm = cap[..., 3] > 0
layer[cm] = cap[cm]

# ---- the rest ----
# the stub of the old pole in front of the near boot's shaft (rows 1000-1115): saturated mid blue, unlike the laces
stub = (Y >= 1000) & (Y < 1115) & (np.abs(X - axis) < 20) & (b > r + 70) & (b > g + 40) & (lum < 150) & (alpha > 0)
stub = ndimage.binary_opening(stub, iterations=1)
stub = ndimage.binary_dilation(stub, iterations=1) & (np.abs(X - axis) < 20) & (Y >= 1000) & (Y < 1115) & ((b > r + 30) | (lum < 60))
rest = A.copy(); rest[..., 3] = np.where(M | stub, 0, rest[..., 3])
ra = rest[..., 3] > 0
green = (g > r + 25) & (g > b + 15) & ra
# the coat's front edge per row: the first green pixel's x (then its outline sits 1-4 px to the left)
edge = {}
for y in range(500, 1000):
    row = np.nonzero(green[y + PT, PL:PL + 200])[0]
    if len(row): edge[y] = row.min()
E0, E1 = 522, 955
# the idle's own edge, median-smoothed (the far hand's rows keep the coat's taper toward the waist)
ser = np.array([edge.get(y, np.nan) for y in range(E0 - 20, E1 + 21)], np.float64)
okk = ~np.isnan(ser); ser[~okk] = np.interp(np.nonzero(~okk)[0], np.nonzero(okk)[0], ser[okk])
ser = ndimage.median_filter(ser, size=25, mode='nearest'); ser = ndimage.uniform_filter1d(ser, 31, mode='nearest')
def e_new(y):
    base = ser[int(y) - (E0 - 20)]
    t = (y - E0) / (E1 - E0)
    wave = 2.6 * np.sin(2 * np.pi * (y - E0) / 190.0) + 1.4 * np.sin(2 * np.pi * (y - E0) / 71.0 + 1.1)
    env = np.clip(np.minimum(t, 1 - t) * 8, 0, 1)   # fades in and out, so the ends meet the idle's own edge
    return base - 2 + wave * env
newA = rest[..., 3].copy()
fillM = np.zeros((H, W), bool)
inkM = np.zeros((H, W), bool)
for y in range(E0, E1 + 1):
    e = e_new(y)
    yr = y + PT
    xsr = np.arange(W) - PL
    # everything left of the new edge goes (the far hand, its cord, the old outline)
    gone = (xsr < e - 2) & (xsr > -PL + 5) & (xsr < 150)
    newA[yr, gone] = 0
    # coat between the new edge and the first green pixel: fill
    first = edge.get(y, int(e_new(y)) + 2)
    fill = (xsr >= e - 2) & (xsr < first + 3)
    fillM[yr, fill] = True
    ink = (xsr >= e - 2) & (xsr < e)
    inkM[yr, ink] = True
# the far hand overlaps the coat: whatever is skin/cord inside the coat's hull above the belt line is filled too
hand = (X > 40) & (X < 115) & (Y > 505) & (Y < 650) & ra & ~green & ~(lum < 45) & ~((r > 180) & (g > 140) & (b < 90))
eRow = np.full(H, -1e9)
for y in range(E0, E1 + 1): eRow[y + PT] = e_new(y) - 2
hand &= (X >= eRow[:, None])
fillM |= hand
# the hole in front of the near boot / trouser (rows 990-1100): close the alpha across the removed pole
low = (Y >= 990) & (Y <= 1110) & (np.abs(X - axis) < 24)
closed = ndimage.binary_closing(ra, structure=np.ones((1, 31)), iterations=1)
hole = low & closed & ~ra
fillM |= hole
known = ra & ~fillM
newA = np.where(fillM, 255, newA)
col = rest[..., :3].copy()
for it in range(3000):
    s = ndimage.uniform_filter(col * known[..., None], size=(3, 3, 1)); k = ndimage.uniform_filter(known.astype(np.float32), size=3)
    upd = fillM & ~known & (k > 0.001)
    if not upd.any(): break
    col[upd] = s[upd] / k[upd][:, None]; known |= upd
rest[..., :3] = np.where(fillM[..., None], col, rest[..., :3])
rest[..., :3] = np.where(inkM[..., None], np.array([46, 58, 50], np.float32), rest[..., :3])
rest[..., 3] = np.where(inkM, 255, newA)
# thin horizontal shreds the stub left on the shaft's silhouette: a vertical opening, in that box only
box = (Y >= 1000) & (Y < 1120) & (X > axis - 34) & (X < axis + 6)
op = ndimage.binary_opening(rest[..., 3] > 0, structure=np.ones((7, 1)))
shred = box & (rest[..., 3] > 0) & ~op
rest[..., 3] = np.where(shred, 0, rest[..., 3])

E = (238 + PL, 405 + PT)
L = Image.fromarray(np.clip(layer, 0, 255).astype(np.uint8), 'RGBA').rotate(ANG, resample=Image.BICUBIC, center=E)
res = Image.alpha_composite(Image.fromarray(rest.astype(np.uint8), 'RGBA'), L)
# keep the judged chest repaint
old = Image.open(f'{S}/work/bar-cast-r965102.png').convert('RGBA')
om = np.asarray(Image.open(f'{S}/work/bar-cast-mask.png').convert('L')) > 0
R = np.asarray(res).copy(); R[om] = np.asarray(old)[om]
res = Image.fromarray(R, 'RGBA')
res.save(f'{O}/bar2-pre.png')
# where the rotated cap landed
capR = np.asarray(Image.fromarray(np.where(cm[..., None], cap, 0).astype(np.uint8), 'RGBA').rotate(ANG, resample=Image.BICUBIC, center=E).getchannel('A')) > 0
mask = ndimage.binary_dilation(fillM | inkM | stub, iterations=6) | ndimage.binary_dilation(capR, iterations=8)
mask &= ~ndimage.binary_dilation(om, iterations=2)
Image.fromarray((mask * 255).astype(np.uint8)).save(f'{O}/bar2-mask.png')
ys_, xs_ = np.nonzero(mask)
print('shred', int(shred.sum()), 'stub', int(stub.sum()), 'size', W, H, 'fill', int(fillM.sum()), 'hole', int(hole.sum()), 'hand', int(hand.sum()),
      'mask box', xs_.min(), ys_.min(), xs_.max(), ys_.max(), 'cap at', np.nonzero(capR)[1].mean().round(), np.nonzero(capR)[0].mean().round())
bg = Image.new('RGBA', (W, H), (255, 0, 255, 255)); bg.alpha_composite(res)
bg.crop((260, 460, 720, 1270)).convert('RGB').save(f'{O}/bar2-pre-look.jpg', quality=90)
for y in range(510, 700, 15): print(y, round(float(e_new(y)), 1), edge.get(y))
