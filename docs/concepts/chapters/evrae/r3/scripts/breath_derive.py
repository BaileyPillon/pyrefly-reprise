"""breath-charge from idle-near (FFX only): a throat swell warped from idle's own belly plates
(neck-spline style: vertical inflate under the neck, dorsal line fixed) + the charge glow,
the only painted region (a Lab light-and-warmth lift that keeps the plates' own detail)."""
import sys, json, numpy as np, cv2
import os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from r3lib import *
P = dict(cx=float(sys.argv[3]) if len(sys.argv) > 3 else 415, sigL=float(sys.argv[4]) if len(sys.argv) > 4 else 30, sigR=float(sys.argv[5]) if len(sys.argv) > 5 else 38, A=float(sys.argv[2]) if len(sys.argv) > 2 else 72, H=float(os.environ.get('BC_H', 80)), glow=1.0, fade=130, pw=float(os.environ.get('BC_PW', 1.0)))
out = sys.argv[1]
im = load(); h, w = im.shape[:2]; xs, ys = grid(h, w)
alpha = im[..., 3]
# belly edge y_b(x): the neck's lower edge, measured from idle's alpha (x 330..540), smoothed
yb = np.full(w, 138.0, np.float32)
for x in range(330, 541):
    col = alpha[:, x] > 0.5; y = 60
    while y < 260 and not col[y]: y += 1
    while y < 260 and col[y]: y += 1
    yb[x] = y
yb[:330] = yb[330]; yb[541:] = yb[540]
yb = cv2.GaussianBlur(yb.reshape(1, -1), (0, 0), 6).ravel()
ybq = yb[np.clip(xs.astype(int), 0, w - 1)]
# the sac's lower outline is an ellipse arc (rx = sigL/sigR either side, depth A below the belly)
xx = np.arange(w, dtype=np.float32)
rx = np.where(xx < P['cx'], P['sigL'], P['sigR'])
u = np.clip(1 - ((xx - P['cx']) / rx) ** 2, 0, 1)
D = np.maximum(0, (yb[int(P['cx'])] - 12 + (P['A'] + 12) * np.sqrt(u)) - yb)
D = cv2.GaussianBlur(D.reshape(1, -1), (0, 0), 5).ravel()
P['maxD'] = float(D.max())
wt = (D / max(P['A'], 1))[np.clip(xs.astype(int), 0, w - 1)]
Dq = D[np.clip(xs.astype(int), 0, w - 1)]
phi = np.clip((ys - (ybq - P['H'])) / (P['H'] + Dq), 0, 1)
phi = phi ** P['pw']
d = Dq * phi
# fade the push out far below the neck so the rest of the coil never moves
d *= 1 - smooth((ys - (ybq + Dq + 40)) / P['fade'])
sx, sy = xs.copy(), ys - d
wr = remap(im, sx, sy)
# the painted region: charge glow inside the swollen sac (and a mouth glow)
sac_cy = yb[int(P['cx'])] + P['A'] * 0.55
stretch = np.clip(d / P['A'], 0, 1)
core = np.exp(-(((xs - (P['cx'] - 2)) / (P['sigL'] + P['sigR']) * 1.3) ** 2 + ((ys - sac_cy) / (P['A'] * 0.55)) ** 2))
m = np.clip(stretch ** 0.8 * smooth((ys - (ybq + Dq * float(os.environ.get('BC_GD', 0.3)) - float(os.environ.get('BC_G0', 14)))) / float(os.environ.get('BC_GW', 14))), 0, 1) * wr[..., 3] * P['glow']
m = cv2.GaussianBlur(m, (0, 0), 3)
core = core * wr[..., 3]
mouth = np.exp(-(((xs - 272) / 20) ** 2 + ((ys - 214) / 17) ** 2)) * wr[..., 3]
_lab0 = to_lab(wr[..., :3])
inside = ((_lab0[..., 1] > 15) | ((_lab0[..., 0] < 20) & (_lab0[..., 1] > -4))).astype(np.float32)   # the red gums/tongue and the dark gullet
inside = cv2.GaussianBlur(cv2.dilate(inside, np.ones((3, 3), np.uint8)), (0, 0), 1.2)
mouth = mouth * inside * ((xs > 240) & (xs < 310) & (ys > 180) & (ys < 245))
lab = to_lab(wr[..., :3])
L, a, b = lab[..., 0], lab[..., 1], lab[..., 2]
detail = L - cv2.GaussianBlur(L, (0, 0), 3)
Lb = cv2.GaussianBlur(L, (0, 0), 3)
Lt = Lb + (80 - Lb) * (0.8 * m) ; Lt = Lt + (96 - Lt) * np.clip(0.75 * core * m + 0.75 * mouth, 0, 1)
L2 = Lt + detail * (1.0 + 0.4 * m)
a2 = a + (40 - a) * (0.85 * m) ; a2 = a2 + (12 - a2) * np.clip(0.6 * core * m, 0, 1) ; a2 = a2 + (24 - a2) * np.clip(0.85 * mouth, 0, 1)
b2 = b + (80 - b) * np.clip(0.85 * m + 0.85 * mouth, 0, 1)
lab2 = np.stack([np.clip(L2, 0, 100), a2, b2], -1)
res = wr.copy(); res[..., :3] = from_lab(lab2)
# edge fringe inside the warped region only: near-white opaque px touching transparency -> transparent
moved = cv2.dilate((d > 0.5).astype(np.uint8), np.ones((5, 5), np.uint8)) > 0
zero = (res[..., 3] < 0.02).astype(np.uint8)
touch = cv2.dilate(zero, np.ones((3, 3), np.uint8)) > 0
white = (res[..., :3].min(-1) > 0.86)
kill = moved & touch & white & (res[..., 3] > 0)
res[..., 3][kill] = 0
# the stretched jagged edge: open the alpha in the moved band (removes the comb teeth), 1 px AA
band = moved & (ys > ybq - 5)
op = cv2.morphologyEx((res[..., 3] > 0.5).astype(np.uint8), cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)))
op = cv2.morphologyEx(op, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
aa = cv2.GaussianBlur(op.astype(np.float32), (0, 0), 0.8)
fill = cv2.inpaint(np.clip(res[..., :3] * 255, 0, 255).astype(np.uint8), (res[..., 3] < 0.5).astype(np.uint8), 4, cv2.INPAINT_TELEA).astype(np.float32) / 255
res[..., :3][band] = np.where((res[..., 3][band] < 0.5)[:, None], fill[band], res[..., :3][band])
res[..., 3][band] = np.minimum(aa[band], np.maximum(res[..., 3][band], aa[band]))
# isolated specks the stretch left below the sac
n, lab_, st, _ = cv2.connectedComponentsWithStats((res[..., 3] > 0.02).astype(np.uint8), 8)
big = np.argmax(st[1:, cv2.CC_STAT_AREA]) + 1
for i in range(1, n):
    if i != big and st[i, cv2.CC_STAT_AREA] < 60 and moved[lab_ == i].any():
        res[..., 3][lab_ == i] = 0
P['fringeKilled'] = int(kill.sum())
# idle's own pixels, exactly, outside the warped + glow region (MAD 0 there)
region = ((d > 0.05) | (m > 0.004) | (mouth > 0.004)).astype(np.uint8)
region = cv2.dilate(region, np.ones((7, 7), np.uint8))
feather = cv2.GaussianBlur(region.astype(np.float32), (0, 0), 1.5)
feather = np.where(region > 0, np.maximum(feather, 0.0), 0)
feather[region > 0] = np.clip(feather[region > 0] * 1.0, 0, 1)
k = feather[..., None]
res = im * (1 - k) + res * k
res[region == 0] = im[region == 0]
P['regionShare'] = float(region.sum() / (im[..., 3] > 0).sum())
save(out, res)
# the seam band for the optional repaint: the glow's transition across the neck-side scales
tb = ((m > 0.06) & (m < 0.9)).astype(np.uint8)
tb = cv2.dilate(tb, np.ones((9, 9), np.uint8)) * (res[..., 3] > 0.5) * (cv2.erode((res[..., 3] > 0.5).astype(np.uint8), np.ones((9, 9), np.uint8)))
cv2.imwrite(out.replace('.png', '.band.png'), (tb * 255).astype(np.uint8))
P['bandPx'] = int(tb.sum())
gy = np.gradient(d, axis=0); fy, fx = np.where(gy > 0.9)
P['foldBox'] = [int(fx.min()), int(fy.min()), int(fx.max()), int(fy.max())] if len(fx) else None
P['foldOpaque'] = int(((gy > 0.9) & (res[..., 3] > 0.05)).sum())
meta = dict(params=P, sacCentre=[P['cx'] - 4, float(sac_cy)], maxPush=float(d.max()),
            maxDdy=float(np.abs(np.gradient(d, axis=0)).max()))
json.dump(meta, open(out.replace('.png', '.json'), 'w'), indent=1)
print(meta)
