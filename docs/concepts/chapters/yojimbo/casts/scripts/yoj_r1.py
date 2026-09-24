"""Yojimbo cast r1: pixel repair of blade, root collar and glove edge (FFX only). No GPU."""
from r1common import *
import sys
LEN = float(sys.argv[1]) if len(sys.argv) > 1 else 0.0   # extra blade length in px (option only)
OUTP = sys.argv[2] if len(sys.argv) > 2 else OUT + '/yojimbo-cavern/cast-r1.png'
src = load(OUT + '/yojimbo-cavern/cast.png'); idle = load(IDLE['yojimbo-cavern'])
H, W = src.shape[:2]; op = src[:, :, 3] > 127
ipal = np.unique(idle[idle[:, :, 3] > 127][:, :3], axis=0)
C = lambda t: ipal[np.abs(ipal.astype(int) - np.array(t)).sum(1).argmin()].astype(float)
INK = C((2, 2, 3))
S0, S1, S2, S3, S4 = C((66, 73, 88)), C((122, 133, 156)), C((196, 214, 231)), C((224, 233, 245)), C((246, 248, 249))
SL = C((97, 108, 132))
G0, G1, G2, G3 = C((250, 222, 121)), C((222, 173, 50)), C((149, 100, 16)), C((88, 53, 10))

# ---- blade frame from the old blade pixels
m = np.zeros(op.shape, bool); m[80:300, 0:200] = op[80:300, 0:200]
n, lab, st, _ = cv2.connectedComponentsWithStats(m.astype(np.uint8))
k = 1 + np.argmax(st[1:, 4]); ys, xs = np.where(lab == k)
sel = ys < 265; P = np.stack([xs[sel], ys[sel]], 1).astype(float)
c0 = P.mean(0); ax = np.linalg.svd(P - c0, full_matrices=False)[2][0]
if ax[1] < 0: ax = -ax
nr = np.array([-ax[1], ax[0]])
t = (P - c0) @ ax; q = (P - c0) @ nr
TT = np.arange(int(t.min()) + 12, 100); sp, ed = [], []
for tb in TT:
    s_ = np.abs(t - tb) < 1.0
    sp.append(np.percentile(q[s_], 97)); ed.append(np.percentile(q[s_], 3))
psp = np.polyfit(TT, sp, 2); ped = np.polyfit(TT, ed, 2)
t_tip0 = t.min()
t_tip = t_tip0 - LEN   # lengthening (option only): the same arc continued past the tip
spine = lambda tt: np.polyval(psp, tt); edge = lambda tt: np.polyval(ped, tt)
mid = lambda tt: (spine(tt) + edge(tt)) / 2
wroot = spine(95) - edge(95); wtip = max(9.0, spine(t_tip0 + 30) - edge(t_tip0 + 30))
def wid(tt):
    f = np.clip((tt - t_tip) / (95 - t_tip), 0, 1); return wtip + (wroot - wtip) * f
KIS = 1.7 * wtip
T_H0, T_H1 = 116.0, 130.0
T_END = 118.0
print('frame', c0.round(1), ax.round(3), 'tip t', round(t_tip, 1), 'w root/tip', round(wroot, 1), round(wtip, 1), 'kissaki', round(KIS, 1))

SS = 4
x0, y0, x1, y1 = 0, 0, 240, 330
gy, gx = np.mgrid[y0 * SS:y1 * SS, x0 * SS:x1 * SS]
X = (gx + 0.5) / SS - 0.5; Y = (gy + 0.5) / SS - 0.5
Tt = (X - c0[0]) * ax[0] + (Y - c0[1]) * ax[1]; Qq = (X - c0[0]) * nr[0] + (Y - c0[1]) * nr[1]
qc = mid(np.clip(Tt, t_tip, 140)); w = wid(Tt)
qs = qc + w / 2; qe = qc - w / 2          # spine = +q (concave), edge = -q (convex)
s = np.clip((Tt - t_tip) / KIS, 0, 1)
fk = np.sqrt(np.clip(1 - (1 - s) ** 2, 0, 1))
qe_k = qs - (qs - qe) * fk
qs_k = qs - 0.18 * w * (1 - s) ** 2
inblade = (Tt >= t_tip) & (Tt <= T_END) & (Qq <= qs_k) & (Qq >= qe_k)
dtip = (Tt - t_tip)
ink = inblade & ((qs_k - Qq < 2.0) | (Qq - qe_k < 2.4 + 0.6 * (1 - s)) | (dtip < 2.0))
shin = qs - 0.40 * w
col = np.zeros(X.shape + (3,)); col[:] = S1
lightz = Qq < shin
fr = np.clip((shin - Qq) / np.maximum(shin - qe, 1e-3), 0, 1)[..., None]
col = np.where(lightz[..., None], S3 * (1 - fr) + S4 * fr, col)
col = np.where(((Qq - qe_k) < 3.6)[..., None] & lightz[..., None], S4, col)
col = np.where((np.abs(Qq - shin) < 0.6)[..., None] & (s >= 1)[..., None], SL, col)
col = np.where((np.abs(Tt - (t_tip + KIS)) < 0.6)[..., None] & lightz[..., None], SL, col)
col = np.where(((qs_k - Qq) < 2.8)[..., None] & ~lightz[..., None], SL, col)
col = np.where(ink[..., None], INK, col)
hq = qc; hw = wid(np.full_like(Tt, 118)) / 2 + 2.2
inhab = (Tt >= T_H0) & (Tt <= T_H1) & (np.abs(Qq - hq) <= hw)
hink = inhab & ((Tt - T_H0 < 2.0) | (T_H1 - Tt < 2.0) | (hw - np.abs(Qq - hq) < 2.0))
hf = np.clip((Qq - (hq - hw)) / (2 * hw), 0, 1)[..., None]
hcol = np.where(hf < 0.35, G0 * (1 - hf / 0.35) + G1 * (hf / 0.35), G1 * (1 - (hf - 0.35) / 0.65) + G2 * ((hf - 0.35) / 0.65))
hcol = np.where(((Tt - T_H0) < 4.5)[..., None] & ~hink[..., None], G3 * 0.4 + hcol * 0.6, hcol)
hcol = np.where(hink[..., None], INK, hcol)
cov = inblade.astype(float); covh = inhab.astype(float)
def down(a):
    return a.reshape(a.shape[0] // SS, SS, a.shape[1] // SS, SS, *a.shape[2:]).mean((1, 3))
bl_a = down(cov); bl_c = down(col * cov[..., None]) / np.maximum(bl_a, 1e-6)[..., None]
hb_a = down(covh); hb_c = down(hcol * covh[..., None]) / np.maximum(hb_a, 1e-6)[..., None]

out = src.astype(float).copy()
R = np.zeros((H, W), bool)
PY, PX = np.mgrid[0:H, 0:W]
Tp = (PX - c0[0]) * ax[0] + (PY - c0[1]) * ax[1]; Qp = (PX - c0[0]) * nr[0] + (PY - c0[1]) * nr[1]
oldblade = (lab == k) & (Tp < 116)
box = np.zeros((H, W), bool); box[250:306, 166:212] = True
hsv = cv2.cvtColor(src[:, :, :3], cv2.COLOR_RGB2HSV)
gold = op & (hsv[:, :, 0] >= 10) & (hsv[:, :, 0] <= 32) & (hsv[:, :, 1] > 80) & (hsv[:, :, 2] > 90)
gy_, gx_ = np.where(gold & box)
ell = cv2.fitEllipse(np.stack([gx_, gy_], 1).astype(np.float32))
print('tsuba ellipse', [round(v, 1) for v in (*ell[0], *ell[1], ell[2])])
hb_full = np.zeros((H, W), bool); hb_full[y0:y1, x0:x1] = hb_a >= 0.5
hy, hx = np.where((gold & box) | hb_full)
hull = cv2.convexHull(np.stack([hx, hy], 1).astype(np.int32))
em = np.zeros((H, W), np.uint8); cv2.fillPoly(em, [hull.reshape(-1, 2)], 255); inell = em > 0
blob = box & op & ~inell & (Tp < 140) & ~gold
out[oldblade | blob] = 0
R |= oldblade | blob
red = box & inell & op & (src[:, :, 0].astype(int) > src[:, :, 2].astype(int) + 25) & (src[:, :, 0] > 60) & ~gold & (Tp < 135)
out[red, :3] = INK; R |= red
sub = (slice(y0, y1), slice(x0, x1))
ba = bl_a >= 0.5; ha = hb_a >= 0.5
reg = out[sub]
reg[ba, :3] = bl_c[ba]; reg[ba, 3] = 255
reg[ha, :3] = hb_c[ha]; reg[ha, 3] = 255
out[sub] = reg
Rb = np.zeros((H, W), bool); Rb[sub] = ba | ha; R |= Rb
sil = out[:, :, 3] > 127
near = (cv2.dilate(blob.astype(np.uint8), np.ones((5, 5), np.uint8)) > 0) & box & ~Rb
opn = cv2.morphologyEx(sil.astype(np.uint8), cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (4, 4))).astype(bool)
spk = near & sil & ~opn
nn, ll, ss, _ = cv2.connectedComponentsWithStats((sil & box).astype(np.uint8), connectivity=4)
for j in range(1, nn):
    if ss[j, 4] < 25: spk |= (ll == j) & near
hsv3 = cv2.cvtColor(np.clip(out[:, :, :3], 0, 255).astype(np.uint8), cv2.COLOR_RGB2HSV)
sil = out[:, :, 3] > 127
bd3 = sil & ~cv2.erode(sil.astype(np.uint8), np.ones((3, 3), np.uint8), iterations=2).astype(bool)
pinkpale = ((hsv3[:, :, 2] > 140) & (hsv3[:, :, 1] < 90)) | ((out[:, :, 0] > out[:, :, 1] + 40) & (out[:, :, 2] > out[:, :, 1] + 10))
topz = np.zeros((H, W), bool); topz[250:274, 190:212] = True
spk |= topz & bd3 & pinkpale & ~Rb & ~gold
out[spk] = 0; R |= spk
sil = out[:, :, 3] > 127
er = cv2.erode(sil.astype(np.uint8), np.ones((3, 3), np.uint8), iterations=2).astype(bool)
ll_arc = np.zeros((H, W), bool); ll_arc[284:306, 166:193] = True
edge_px = box & sil & ~Rb & ~er & (cv2.dilate(blob.astype(np.uint8), np.ones((5, 5), np.uint8)) > 0)
dark = out[:, :, :3].max(2) < 70
out[edge_px & ~dark, :3] = INK; R |= edge_px
gpoly = np.array([[197, 306], [214, 306], [213, 318], [222, 336], [230, 342], [230, 350], [197, 350]], np.int32)
gm = np.zeros((H, W), np.uint8); cv2.fillPoly(gm, [gpoly], 1); G = gm > 0
sil = out[:, :, 3] > 127
bd = sil & ~cv2.erode(sil.astype(np.uint8), np.ones((3, 3), np.uint8), iterations=2).astype(bool)
hsv2 = cv2.cvtColor(np.clip(out[:, :, :3], 0, 255).astype(np.uint8), cv2.COLOR_RGB2HSV)
pale = (hsv2[:, :, 2] > 150) & (hsv2[:, :, 1] < 150)
peel = G & bd & pale
out[peel] = 0; R |= peel
sil = out[:, :, 3] > 127
sm = cv2.GaussianBlur(sil.astype(np.float32), (0, 0), 1.3) > 0.5
Gi = cv2.erode(G.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool)   # keep the polygon rim untouched
ns = np.where(Gi, sm, sil)
add = ns & ~sil; rem = sil & ~ns
out[rem] = 0; out[add, 3] = 255; R |= add | rem
dt = cv2.distanceTransform(ns.astype(np.uint8), cv2.DIST_L2, 5)
wmax = np.where(PY < 312, 1.2, np.where(PX > 224, 1.4, 2.3))
gink = G & ns & (dt <= wmax)
out[gink, :3] = INK; R |= gink
out[:, :, 3] = np.where(out[:, :, 3] > 127, 255, 0)
out[(out[:, :, 3] == 0) & R, :3] = 0
o8 = np.clip(out, 0, 255).round().astype(np.uint8)
Rm = R & (o8[:, :, 3] > 0)
px = o8[Rm][:, :3].copy(); lab_px = to_lab(px); lab_pal = to_lab(ipal)
best = np.empty(len(px), int); dmin = np.empty(len(px))
for i0 in range(0, len(px), 1024):
    d = np.sqrt(((lab_px[i0:i0 + 1024, None] - lab_pal[None]) ** 2).sum(2)); best[i0:i0 + 1024] = d.argmin(1); dmin[i0:i0 + 1024] = d.min(1)
fix = dmin > 6
px[fix] = ipal[best[fix]]; tmp = o8[Rm]; tmp[:, :3] = px; o8[Rm] = tmp
# transparent pixels keep the source's hidden RGB so MAD outside masks is exactly 0
save(o8, OUTP)
cv2.imwrite(OUTP.replace('.png', '.mask.png'), (R * 255).astype(np.uint8))
d = np.abs(o8.astype(int) - src.astype(int)).max(2)
print('MAD outside mask', int(d[~R].max()), 'changed px', int((d > 0).sum()), 'mask px', int(R.sum()), 'snapped', int(fix.sum()))
print('invented share', invented_share(idle, o8, R.astype(np.uint8)))
print('alpha values', np.unique(o8[:, :, 3]))
