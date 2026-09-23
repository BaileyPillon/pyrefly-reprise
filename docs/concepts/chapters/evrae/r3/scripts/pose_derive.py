"""hurt and cast candidates from idle-near (FFX only): the head and neck rotate about a pivot
at the top of the neck arch, blended into the fixed body by a smooth weight (a neck bend of
idle's own pixels). Optional jaw open: the lower jaw rotates about the jaw hinge.
usage: pose_derive.py <out.png> <angle_deg> [pivot_x pivot_y] [x_full x_zero] [jaw_deg]"""
import sys, os, json, numpy as np, cv2
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from r3lib import *
out = sys.argv[1]; ang = float(sys.argv[2])
px, py = (float(sys.argv[3]), float(sys.argv[4])) if len(sys.argv) > 4 else (470.0, 95.0)
xf, xz = (float(sys.argv[5]), float(sys.argv[6])) if len(sys.argv) > 6 else (400.0, 560.0)
jaw = float(sys.argv[7]) if len(sys.argv) > 7 else 0.0
im0 = load()
PAD = int(os.environ.get('PADTOP', 0)); SHX = float(os.environ.get('SHIFTX', 0)); SHY = float(os.environ.get('SHIFTY', 0))
im = np.concatenate([np.zeros((PAD, im0.shape[1], 4), np.float32), im0], 0) if PAD else im0
py += PAD
h, w = im.shape[:2]; xs, ys = grid(h, w)
ys_ = ys - PAD  # idle coordinates for the hand-placed regions
# the head-and-neck LAYER: idle's opaque pixels above the lower coils (y < 330) and left of the
# right-hand loop (x < 600). Only this layer moves; the body layer never moves, so a partly
# weighted pixel can never sample a copy of the head.
layer = np.zeros((h, w), np.float32)
layer[PAD:PAD + 330, :600] = 1.0
layer *= (im[..., 3] > 0.0)
# weight along the neck: 1 on the head and upper neck, 0 where the arch comes down into the coil
wx = smooth((xz - xs) / (xz - xf))
wy = smooth((PAD + 330 - ys) / 60)
wgt = (wx * wy).astype(np.float32)
sx, sy = rot_field(xs - SHX * wgt, ys - SHY * wgt, px, py, ang, wgt)
if jaw:
    # lower jaw (idle-near, measured at 3x): hinge (318, 203); the mouth's gap runs from the hinge
    # to about (245, 225); the lower jaw is the wedge below that line, left of the hinge.
    hx, hy = 318.0, 203.0 + PAD
    below = (ys - hy) - (xs - hx) * ((225 + PAD - hy) / (245 - hx))
    wj = smooth(below / 5) * smooth((hx + 8 - xs) / 16) * smooth((275 - ys_) / 16) * smooth((xs - 200) / 10)
    jx, jy = rot_field(xs, ys, hx, hy, jaw, wj)
    # compose inverse maps: output -> (neck undo) -> (jaw undo) -> idle
    sx, sy = (cv2.remap(jx.astype(np.float32), sx.astype(np.float32), sy.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE),
              cv2.remap(jy.astype(np.float32), sx.astype(np.float32), sy.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE))
A = im.copy(); A[..., 3] *= layer
B = im.copy(); B[..., 3] *= (1 - layer)
Aw = remap(A, sx, sy)
# source-layer check: a sample is from the layer only where the layer mask is set at the source
lm = cv2.remap(layer, sx.astype(np.float32), sy.astype(np.float32), cv2.INTER_LINEAR, borderValue=0)
Aw[..., 3] *= np.clip(lm * 1.0, 0, 1) ** 0.5
# composite: the moved head/neck over the fixed body (premultiplied over)
aA = Aw[..., 3:4]; aB = B[..., 3:4]
outa = aA + aB * (1 - aA)
outc = (Aw[..., :3] * aA + B[..., :3] * aB * (1 - aA)) / np.maximum(outa, 1e-6)
res = np.concatenate([outc, outa], -1)
moved = ((np.hypot(sx - xs, sy - ys) > 0.05) | (layer > 0)).astype(np.uint8)
region = cv2.dilate(moved, np.ones((5, 5), np.uint8)) > 0
res[~region] = im[~region]
P_out = dict(padTop=PAD, shift=[SHX, SHY])
# jacobian check (folds)
gx1 = np.gradient(sx, axis=1); gy1 = np.gradient(sx, axis=0); gx2 = np.gradient(sy, axis=1); gy2 = np.gradient(sy, axis=0)
det = gx1 * gy2 - gy1 * gx2
save(out, res)
bad = (det < 0.25) & region & (res[..., 3] > 0.05)
fy_, fx_ = np.where(bad)
def fwd(x, y):
    dd = (sx - x) ** 2 + (sy - (y + PAD)) ** 2
    i = np.unravel_index(np.argmin(dd), dd.shape); return [float(i[1]), float(i[0] - PAD)], float(np.sqrt(dd[i]))
(sn, e1), (ey, e2) = fwd(221.7, 210.0), fwd(281.7, 175.0)
P_out['snout'] = sn; P_out['eye'] = ey; P_out['headPx'] = float(np.hypot(sn[0] - ey[0], sn[1] - ey[1])); P_out['headPxIdle'] = 69.5
P_out['opaqueRatio'] = float((res[..., 3] > 0.5).sum() / (im[..., 3] > 0.5).sum())
meta = dict(**P_out, foldPx=int(bad.sum()), foldBox=[int(fx_.min()), int(fy_.min()), int(fx_.max()), int(fy_.max())] if len(fx_) else None, angle=ang, pivot=[px, py], ramp=[xf, xz], jaw=jaw, minJacobian=float(det[region].min()),
            regionShare=float(region.sum() / (im[..., 3] > 0).sum()))
json.dump(meta, open(out.replace('.png', '.json'), 'w'), indent=1); print(meta)
