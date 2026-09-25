"""Seymour Omnis hero cast (FFX only), step 1: idle-pixel warp (method r3 step 2, as a smooth field, no cut lines).
Both raised arms turn upward about the shoulders, so the claws lift for a spell. The rotation is full on the arms and
hands and fades to zero down the hanging strips (they bend with the arm instead of being cut), and to zero before the
hair, face and chest (protected: weight 0). Every output pixel is an idle pixel moved (bicubic at 2x, down once).
usage: cast_warp.py [angle_deg]  -> work/cast-warp.png, work/cast-weight.png"""
import json, sys, math, numpy as np
from PIL import Image
from scipy import ndimage as ndi
W0 = 'D:/Tools/pyrefly-scratch/ch1215/omnis/work/'
ANG = float(sys.argv[1]) if len(sys.argv) > 1 else 12.0
PAD = 90
PX = 50
idle = Image.open(W0 + 'omnis-idle.png').convert('RGBA')
Wd0, Hd = idle.size
Wd = Wd0 + 2 * PX
Hc = Hd + PAD
S = 2
cv = Image.new('RGBA', (Wd, Hc), (0, 0, 0, 0)); cv.alpha_composite(idle, (PX, PAD))
big = np.array(cv.resize((Wd * S, Hc * S), Image.LANCZOS)).astype(np.float32)
a = big[..., 3:4] / 255.0
prem = np.concatenate([big[..., :3] * a, a * 255], -1)   # premultiplied, so edges never pull in black


def ss(e0, e1, v):
    t = np.clip((v - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


yy, xx = np.mgrid[0:Hc * S, 0:Wd * S].astype(np.float32) / S   # canvas coords (1x)
ARMS = [  # pivot (canvas coords = idle + PAD in y), screen rotation sign (+ = counter-clockwise on screen)
    dict(c=(282.0 + PX, 172.0 + PAD), sgn=-1, wx=lambda x: ss(330 + PX, 215 + PX, x), wy=lambda y: ss(480 + PAD, 225 + PAD, y)),
    dict(c=(548.0 + PX, 124.0 + PAD), sgn=+1, wx=lambda x: ss(512 + PX, 625 + PX, x), wy=lambda y: ss(430 + PAD, 185 + PAD, y)),
]


def disp(x, y):
    dx = np.zeros_like(x); dy = np.zeros_like(y); wsum = np.zeros_like(x)
    for A in ARMS:
        cx, cy = A['c']; th = math.radians(A['sgn'] * ANG)
        # screen rotation with y down: counter-clockwise on screen = (x, y) -> (cx + c*(x-cx) + s*(y-cy), cy - s*(x-cx) + c*(y-cy))
        rx = cx + math.cos(th) * (x - cx) + math.sin(th) * (y - cy)
        ry = cy - math.sin(th) * (x - cx) + math.cos(th) * (y - cy)
        w = A['wx'](x) * A['wy'](y)
        dx += w * (rx - x); dy += w * (ry - y); wsum += w
    return dx, dy, wsum


# inverse map by fixed-point iteration: find s with s + D(s) = p
sx, sy = xx.copy(), yy.copy()
for _ in range(12):
    dx, dy, _w = disp(sx, sy)
    sx, sy = xx - dx, yy - dy
_, _, wmap = disp(sx, sy)
coords = [sy * S, sx * S]
out = np.zeros_like(prem)
for ch in range(4):
    out[..., ch] = ndi.map_coordinates(prem[..., ch], coords, order=3, mode='constant', cval=0)
out = np.clip(out, 0, 255)
res = Image.fromarray(out.astype(np.uint8), 'RGBA').resize((Wd, Hc), Image.LANCZOS)
r = np.array(res).astype(np.float32)
al = r[..., 3:4] / 255.0
rgb = np.where(al > 0.02, r[..., :3] / np.maximum(al, 1e-3), 0)
alpha = np.where(r[..., 3] >= 128, 255, 0)
o = np.concatenate([np.clip(rgb, 0, 255), alpha[..., None]], -1).astype(np.uint8)
o[alpha == 0, :3] = 0
# where the field does not move a pixel (weight 0: hair, face, chest, skirt, lower strips) keep the idle's exact pixels
y1, x1 = np.mgrid[0:Hc, 0:Wd].astype(np.float32)
ddx, ddy, _ = disp(x1, y1)
still = np.hypot(ddx, ddy) < 0.02
still = ndi.binary_erosion(still, iterations=2)
cvn = np.array(cv)
o[still] = cvn[still]
Image.fromarray(o).save(W0 + 'cast-warp.png')
wm = Image.fromarray((np.clip(wmap, 0, 1) * 255).astype(np.uint8)).resize((Wd, Hc))
wm.save(W0 + 'cast-weight.png')
ys, xs = np.nonzero(alpha)
print(json.dumps({'angle': ANG, 'size': [Wd, Hc], 'top': int(ys.min()), 'left': int(xs.min()), 'right': int(xs.max()), 'bottom': int(ys.max())}))
