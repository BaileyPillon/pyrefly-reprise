"""breath-charge, r3 repair cycle (FFX only): the throat swells IN PLACE from idle-near's own pixels.
Only the neck's belly plates (and the lowest 12 px of teal) stretch down; every dorsal scale above that
keeps idle's pixels exactly. The sac outline is the belly edge plus the swell, drawn as binary alpha. The
glow lights the belly plates themselves, so its edge is their own painted seam, and falls off along the neck.
usage: A=66 CX=440 python breath_inplace.py <out.png>"""
import sys, os, json, numpy as np, cv2
sys.path.insert(0, r'D:/Final Fantasy/docs/concepts/chapters/evrae/r3/scripts')
from r3lib import *
out = sys.argv[1]
P = dict(A=float(os.environ.get('A', 50)), cx=float(os.environ.get('CX', 445)), x0=float(os.environ.get('X0', 382)),
         x1=float(os.environ.get('X1', 528)), teal=float(os.environ.get('TEAL', 12)), glow=float(os.environ.get('GLOW', 1.0)))
im = load(); h, w = im.shape[:2]; xs, ys = grid(h, w)
alpha = im[..., 3] > 0.5
lab0 = to_lab(im[..., :3])
pink0 = (lab0[..., 1] > 6) & (lab0[..., 0] > 45)
# per column: belly edge yb (end of the neck's run) and the belly-plate seam ys (top of the pink run at the bottom of it)
yb = np.zeros(w, np.float32); sm = np.zeros(w, np.float32)
for x in range(w):
    if x < 370 or x > 545: continue
    col = alpha[:, x]
    y = 110
    while y < 300 and col[y]: y += 1
    yb[x] = y
    yy = y - 1; run = 0
    while yy > 60:
        run = run + 1 if lab0[yy, x, 1] < -4 else 0
        if run >= 3: break
        yy -= 1
    sm[x] = yy + 3
xr = np.arange(w, dtype=np.float32)
ok = (xr >= 370) & (xr <= 545)
for arr in (yb, sm):
    arr[~ok] = np.interp(xr[~ok], xr[ok], arr[ok])
yb = cv2.GaussianBlur(yb.reshape(1, -1), (0, 0), 3).ravel()
median_filter = lambda v, k: cv2.medianBlur(np.clip(v, 0, 255).astype(np.uint8).reshape(1, -1), k).ravel().astype(np.float32)
sm = median_filter(sm, 9)
sm = cv2.GaussianBlur(sm.reshape(1, -1), (0, 0), 4).ravel()
print('yb', [int(v) for v in yb[380:541:10]]); print('sm', [int(v) for v in sm[380:541:10]])
# the swell profile along the neck: a smooth, wide, slightly skewed bell (not a pendant)
t = np.where(xr < P['cx'], (xr - P['x0']) / (P['cx'] - P['x0']), (P['x1'] - xr) / (P['x1'] - P['cx']))
D = P['A'] * smooth(np.clip(t, 0, 1)) ** 1.2
# right of the peak the sac's bottom does not climb back up to the neck: it rounds off and merges
# into the arch's own descending belly line (one convex underside, no second lobe)
ic = int(P['cx']); ybot = yb[ic] + P['A']
k = float(os.environ.get('K', 0.004))
rhs = ybot - k * (xr - P['cx']) ** 2
soft = lambda p, q, s=6.0: 0.5 * (p + q + np.sqrt((p - q) ** 2 + s * s))
yr = soft(yb, rhs)
D = np.where(xr > P['cx'], np.maximum(yr - yb, 0), D)
D = np.where((xr > P['cx']) & (xr > 560), 0, D)
D = cv2.GaussianBlur(D.astype(np.float32).reshape(1, -1), (0, 0), 3).ravel()
ix = np.clip(xs.astype(int), 0, w - 1)
Dq, ybq, smq = D[ix], yb[ix], sm[ix]
top = smq - P['teal']                         # dorsal of this line is idle's pixels exactly
phi = np.clip((ys - top) / np.maximum(ybq - top, 1), 0, 1)
# the neck layer: idle's opaque pixels above the belly edge in the swell's columns
layer = (alpha & (ys <= ybq + 1.5) & (Dq > 0.01) & (ys > 20)).astype(np.float32)
# inverse map: output y samples idle at y' where y = y' + D*phi(y'); solve per column by lookup
sy = ys.copy()
for x in range(w):
    if D[x] < 0.05: continue
    yy = np.arange(h, dtype=np.float32)
    fwd = yy + D[x] * np.clip((yy - (sm[x] - P['teal'])) / max(yb[x] - (sm[x] - P['teal']), 1), 0, 1)
    sy[:, x] = np.interp(yy, fwd, yy)
sx = xs.copy()
A_ = im.copy(); A_[..., 3] *= layer
B_ = im.copy(); B_[..., 3] *= (1 - layer)
Aw = remap(A_, sx, sy)
lm = cv2.remap(layer, sx, sy, cv2.INTER_LINEAR, borderValue=0)
Aw[..., 3] = np.where(lm > 0.5, Aw[..., 3], 0)
Aw[..., 3] = (Aw[..., 3] > 0.5).astype(np.float32)          # binary alpha, as idle's
# the sac's outline is drawn from geometry, not from idle's stretched stair-step edge: the belly
# edge plus the swell, smoothed, rasterised to binary alpha like every other edge of the sprite
ynew = cv2.GaussianBlur((yb + D).reshape(1, -1), (0, 0), float(os.environ.get('OSIG', 5))).ravel()
ynq = ynew[ix]
zone = (Dq > 2.0) & (ys > smq) & (ys < ybq + Dq + 12)
inside = (ys <= ynq).astype(np.float32)
need = zone & (inside > 0) & (Aw[..., 3] < 0.5)
Aw[..., 3] = np.where(zone, inside, Aw[..., 3])
if need.any():
    src = np.clip(Aw[..., :3] * 255, 0, 255).astype(np.uint8)
    hole = ((Aw[..., 3] > 0.5) & ~need).astype(np.uint8)
    fillc = cv2.inpaint(src, (1 - hole).astype(np.uint8), 4, cv2.INPAINT_TELEA).astype(np.float32) / 255
    Aw[..., :3][need] = fillc[need]
P['filledPx'] = int(need.sum())
# the new rim: idle's stair-step edge line, stretched, leaves a dotted row inside the outline; the
# last 6 px above the outline take the colour 7 px further in, smoothed along the outline only
band = zone & (inside > 0) & (ynq - ys < 6)
yy_, xx_ = np.where(band)
src = Aw[np.clip(yy_ - 7, 0, h - 1), xx_, :3].copy()
Aw[yy_, xx_, :3] = src
hb = cv2.GaussianBlur(Aw[..., :3], (0, 0), sigmaX=1.6, sigmaY=0.01)
Aw[..., :3][band] = hb[band]
P['rimPx'] = int(band.sum())
aA = Aw[..., 3:4]
res = im.copy()
res[..., :3] = np.where(aA > 0, Aw[..., :3], B_[..., :3])
res[..., 3] = np.maximum(aA[..., 0], B_[..., 3])
# restore the stretched softness a little (unsharp in proportion to the local stretch)
stretch = np.clip(np.gradient(ys - sy, axis=0), 0, 3)
blur = cv2.GaussianBlur(res[..., :3], (0, 0), 1.0)
k = np.clip(stretch * 0.6, 0, 0.9)[..., None] * aA
res[..., :3] = np.clip(res[..., :3] + (res[..., :3] - blur) * k, 0, 1)
# pale flecks on the new rim: opaque rim pixels that are near-white take their inner neighbour's colour
moved = (np.abs(ys - sy) > 0.5) & (res[..., 3] > 0)
zero = (res[..., 3] < 0.5).astype(np.uint8)
rim = (cv2.dilate(zero, np.ones((3, 3), np.uint8)) > 0) & (res[..., 3] > 0.5)
inner = cv2.erode((res[..., 3] > 0.5).astype(np.uint8), np.ones((5, 5), np.uint8))
fill = cv2.inpaint(np.clip(res[..., :3] * 255, 0, 255).astype(np.uint8), (1 - inner).astype(np.uint8), 3, cv2.INPAINT_TELEA).astype(np.float32) / 255
pale = res[..., :3].min(-1) > 0.72
fl = moved & rim & pale
res[..., :3][fl] = fill[fl]
# GLOW: the belly plates themselves (idle's pink plates, as warped), faded along the neck by the swell
lab = to_lab(res[..., :3])
plates = ((lab[..., 1] > 4) & (lab[..., 0] > 38) & (res[..., 3] > 0.5) & (ys > smq - 8)).astype(np.uint8)
plates = cv2.morphologyEx(plates, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
g = np.exp(-((xr - P['cx']) / np.where(xr < P['cx'], float(os.environ.get('GL', 48)), float(os.environ.get('GR', 62)))) ** 2) * np.clip(D / 10, 0, 1)   # light falls off along the neck, not at a column
gq = cv2.GaussianBlur(g[ix].astype(np.float32), (0, 0), 2)
neckband = (ys < ybq + Dq + 3) & (ys > smq - 30)
plates = plates * neckband.astype(np.uint8)
pm = cv2.GaussianBlur(plates.astype(np.float32), (0, 0), 0.8) * gq * P['glow'] * (res[..., 3] > 0.5)
# a thin warm spill into the teal row, following the plate seam's own curve (distance, not a level line)
dist = cv2.distanceTransform((1 - plates).astype(np.uint8), cv2.DIST_L2, 3)
spill = np.exp(-dist / 5.0) * (1 - plates) * gq * (res[..., 3] > 0.5) * (ys > smq - 25) * neckband * 0.35
core = np.exp(-(((xs - P['cx']) / 45) ** 2 + ((ys - (smq + (ybq + Dq - smq) * 0.55)) / (0.5 * (ybq + Dq - smq) + 1)) ** 2)) * pm
L, a, b = lab[..., 0], lab[..., 1], lab[..., 2]
Lb = cv2.GaussianBlur(L, (0, 0), 2.5); det = L - Lb
Lt = Lb + (78 - Lb) * (0.75 * pm) + (94 - Lb) * np.clip(0.55 * core, 0, 1) * 0  # base
Lt = Lt + (96 - Lt) * np.clip(0.6 * core, 0, 1)
a2 = a + (38 - a) * (0.8 * pm) ; a2 = a2 + (14 - a2) * np.clip(0.6 * core, 0, 1)
b2 = b + (76 - b) * (0.85 * pm)
# spill: warm the teal a little (keeps its hue family darker; light through the plate edge)
Lt = Lt + (Lb * 0 + 60 - Lt) * spill * 0.4
a2 = a2 + (20 - a2) * spill ; b2 = b2 + (45 - b2) * spill
L2 = Lt + det * (1.0 + 0.3 * pm)
# mouth glow (unchanged idea from r3: the gums, tongue and gullet only)
inside = ((lab[..., 1] > 15) | ((lab[..., 0] < 20) & (lab[..., 1] > -4))).astype(np.float32)
inside = cv2.GaussianBlur(cv2.dilate(inside, np.ones((3, 3), np.uint8)), (0, 0), 1.2)
mouth = np.exp(-(((xs - 272) / 20) ** 2 + ((ys - 214) / 17) ** 2)) * inside * ((xs > 240) & (xs < 310) & (ys > 180) & (ys < 245)) * (res[..., 3] > 0.5)
L2 = L2 + (90 - L2) * np.clip(0.7 * mouth, 0, 1); a2 = a2 + (24 - a2) * np.clip(0.85 * mouth, 0, 1); b2 = b2 + (80 - b2) * np.clip(0.85 * mouth, 0, 1)
res[..., :3] = from_lab(np.stack([np.clip(L2, 0, 100), a2, b2], -1))
# idle's pixels exactly wherever nothing moved and nothing was lit
changed = (np.abs(sy - ys) > 0.02) | (pm > 0.003) | (spill > 0.003) | (mouth > 0.003) | (layer > 0) & (np.abs(sy - ys) > 0.02)
changed = changed & ((ys < ybq + Dq + 14) | (mouth > 0.003))
res[~changed] = im[~changed]
res[..., 3] = (res[..., 3] > 0.5).astype(np.float32)
save(out, res)
r8 = cv2.imread(out, -1)[..., 3]
meta = dict(params=P, maxPush=float(D.max()), softAlphaPx=int(((r8 > 0) & (r8 < 255)).sum()),
            changedShare=float(changed.sum() / alpha.sum()), opaqueRatio=float((r8 > 127).sum() / alpha.sum()),
            unchangedAboveSeam='dorsal of the belly-plate seam minus %g px: idle pixels exactly' % P['teal'])
json.dump(meta, open(out.replace('.png', '.json'), 'w'), indent=1); print(meta)
