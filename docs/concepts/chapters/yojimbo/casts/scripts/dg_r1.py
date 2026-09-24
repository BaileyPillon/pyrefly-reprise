"""Daigoro cast r1 (30 deg): pixel touch-up of the bite (FFX only). No GPU; every new pixel is copied from a
neighbouring pixel of the same candidate or is the lip-line ink sampled from it."""
from r1common import *
import sys
OUTP = sys.argv[1] if len(sys.argv) > 1 else OUT + '/daigoro/cast-r1.png'
src = load(OUT + '/daigoro/cast.png'); idle = load(IDLE['daigoro'])
H, W = src.shape[:2]
out = src.copy()
R = np.zeros((H, W), bool)
PY, PX = np.mgrid[0:H, 0:W]
rgb = src[:, :, :3].astype(int)
mx, mn = rgb.max(2), rgb.min(2)
hsv = cv2.cvtColor(src[:, :, :3], cv2.COLOR_RGB2HSV)

ipal = np.unique(idle[idle[:, :, 3] > 127][:, :3], axis=0); lab_pal = to_lab(ipal)
def snap(mask):
    px = out[mask][:, :3]; lp = to_lab(px); res = px.copy()
    for i0 in range(0, len(px), 1024):
        d = np.sqrt(((lp[i0:i0 + 1024, None] - lab_pal[None]) ** 2).sum(2)); far = d.min(1) > 4
        blk = res[i0:i0 + 1024]; blk[far] = ipal[d.argmin(1)[far]]; res[i0:i0 + 1024] = blk
    t_ = out[mask]; t_[:, :3] = res; out[mask] = t_
def inpaint(fill, unknown_extra=None, r=3):
    """Telea inpaint of `fill`; `unknown_extra` pixels are hidden from the solver but not written."""
    m = fill.copy()
    if unknown_extra is not None: m |= unknown_extra
    bgr = cv2.cvtColor(out[:, :, :3], cv2.COLOR_RGB2BGR)
    res = cv2.inpaint(bgr, m.astype(np.uint8) * 255, r, cv2.INPAINT_TELEA)
    out[fill, :3] = cv2.cvtColor(res, cv2.COLOR_BGR2RGB)[fill]
def nn_fill(mask, known):
    """Fill `mask` pixels with the colour of the nearest `known` pixel (pure copy, no new colours)."""
    src_ = (~known).astype(np.uint8)
    _, labels = cv2.distanceTransformWithLabels(src_, cv2.DIST_L2, 5, labelType=cv2.DIST_LABEL_PIXEL)
    ky, kx = np.where(known)
    idx = np.zeros(labels.max() + 1, int); idx[labels[known]] = np.arange(len(ky))
    my, mx_ = np.where(mask); j = idx[labels[my, mx_]]
    out[my, mx_] = out[ky[j], kx[j]]

# ---------- 1. thin the front fang row: remove the small picket between the front fang and the canine
white = (mn > 150) & (mx > 190)
tooth = np.zeros((H, W), bool)
for (a0, a1, b0, b1) in [(75, 84, 277, 293), (82, 86, 277, 285), (86, 91, 276, 285), (91, 97, 278, 285)]:
    z = np.zeros((H, W), bool); z[b0:b1, a0:a1] = True; tooth |= z & white
tooth = cv2.dilate(tooth.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool)
tbox = np.zeros((H, W), bool); tbox[275:295, 74:98] = True
red_ = (rgb[:, :, 0] > 120) & (rgb[:, :, 1] < 90)
pale = (mx > 110) & ~red_          # white, lavender or pink-white: tooth or its anti-alias rim
tz = np.zeros((H, W), bool); tz[279:295, 74:97] = True
greyish = (mn > 50) & ~red_ & tz & ((rgb[:, :, 2] - mn) < 60)
tooth = (cv2.dilate(tooth.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool) & tbox & pale & (PY >= 278)) | greyish
win = np.zeros((H, W), bool); win[262:305, 58:115] = True
nn_fill(tooth, win & ~tooth & ((mx < 60) | red_))
mb = cv2.medianBlur(np.ascontiguousarray(out[:, :, :3]), 3)
out[tooth, :3] = mb[tooth]
snap(tooth)
R |= tooth

# ---------- 2. soften the lower lip: redraw it as one smooth, tapered brush line
ctrl = np.array([(95, 305.6), (96, 306.0), (108, 308.9), (118, 309.4), (126, 305.2), (132, 299.2), (139, 293.4), (147, 288.2), (148, 287.6)], float)
pts = []
for k in range(1, len(ctrl) - 2):
    p0, p1, p2, p3 = ctrl[k - 1], ctrl[k], ctrl[k + 1], ctrl[k + 2]
    for u in np.linspace(0, 1, 12, endpoint=False):
        pts.append(0.5 * ((2 * p1) + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (-p0 + 3 * p1 - 3 * p2 + p3) * u ** 3))
pts.append(ctrl[-2]); pts = np.array(pts)
seg = np.diff(pts, axis=0); sl = np.linalg.norm(seg, axis=1); cum = np.concatenate([[0], np.cumsum(sl)]); L = cum[-1]
box = np.zeros((H, W), bool); box[282:316, 92:150] = True
by, bx = np.where(box)
P = np.stack([bx, by], 1).astype(float)
best_d = np.full(len(P), 1e9); best_s = np.zeros(len(P)); best_c = np.zeros(len(P))
for k in range(len(seg)):
    a = pts[k]; d = seg[k]; tt = np.clip(((P - a) @ d) / (d @ d), 0, 1)
    c = a + tt[:, None] * d; v = P - c; dist = np.linalg.norm(v, axis=1)
    cr = d[0] * v[:, 1] - d[1] * v[:, 0]
    upd = dist < best_d
    best_d[upd] = dist[upd]; best_s[upd] = (cum[k] + tt[upd] * sl[k]) / L; best_c[upd] = cr[upd]
wdt = 1.5 + 1.0 * np.clip(best_s, 0, 1) ** 0.7           # tapered brush half-width x2
online = best_d <= wdt / 2 + 0.35
jaw = best_c > 0
dark = mx < 70
oldline = box & dark & (PX < 147)
ol = np.zeros((H, W), bool); ol[by, bx] = online
near_new = np.zeros((H, W), bool); near_new[by, bx] = best_d <= 3.5
M = (cv2.dilate(oldline.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool) | near_new) & box
M &= ~((PX >= 146) & (PY <= 292))             # leave the dark back corner of the mouth alone
ink = np.median(src[oldline][:, :3], 0).round().astype(np.uint8)
ink = idle[idle[:, :, 3] > 127][:, :3][np.abs(idle[idle[:, :, 3] > 127][:, :3].astype(int) - ink.astype(int)).sum(1).argmin()]
side = np.zeros((H, W), np.int8); side[by, bx] = np.where(jaw, 1, -1)
for sg in (1, -1):
    want = M & (side == sg) & ~ol
    other = box & (side == -sg)
    if want.any():
        inpaint(want, (other | (box & dark & ~want)) & ~want, r=3)
hj = cv2.cvtColor(out[:, :, :3], cv2.COLOR_RGB2HSV)
pj = box & (side == 1) & ~ol & (PX > 124) & (PY > 296) & (PY < 313) & (hj[:, :, 0] >= 125) & (hj[:, :, 1] > 45) & (hj[:, :, 2] > 90)
if pj.any():
    inpaint(pj, (box & (side == -1)) | (box & (mx < 70) & ~pj), r=3); M |= pj
snap(M & ~ol)
out[ol & M, :3] = ink
out[ol & box & ~M & (side != 0), :3] = ink
R |= M | (ol & box)

# ---------- 3. peel the pink / magenta speckle fringe under the lower jaw
fz = np.zeros((H, W), bool); fz[311:324, 84:136] = True
mag = fz & (hsv[:, :, 0] >= 135) & (hsv[:, :, 0] <= 175) & (hsv[:, :, 1] > 70) & (hsv[:, :, 2] > 80)
mag = cv2.dilate(mag.astype(np.uint8), np.ones((2, 2), np.uint8)).astype(bool) & fz & (mx > 60) & ~R
kz = np.zeros((H, W), bool); kz[300:334, 76:146] = True
hsv_o = cv2.cvtColor(out[:, :, :3], cv2.COLOR_RGB2HSV)
magall = (hsv_o[:, :, 0] >= 135) & (hsv_o[:, :, 0] <= 175) & (hsv_o[:, :, 1] > 70) & (hsv_o[:, :, 2] > 80)
hide = (kz & magall & ~mag) | (kz & (PY <= 312) & (out[:, :, :3].astype(int).min(2) > 120))
inpaint(mag, hide & ~mag, r=3)
snap(mag)
R |= mag

save(out, OUTP)
cv2.imwrite(OUTP.replace('.png', '.mask.png'), (R * 255).astype(np.uint8))
d = np.abs(out.astype(int) - src.astype(int)).max(2)
print('MAD outside mask', int(d[~R].max()), 'changed px', int((d > 0).sum()), 'mask px', int(R.sum()),
      'teeth', int(tooth.sum()), 'lip', int(M.sum()), 'fringe', int(mag.sum()), 'ink', ink.tolist())
print('invented share', invented_share(idle, out, R.astype(np.uint8)))
print('alpha', np.unique(out[:, :, 3]))
