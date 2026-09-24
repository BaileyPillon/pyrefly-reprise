"""Yojimbo hurt candidate (FFX only): a bake of the idle's own pixels, no GPU, nothing painted.

The upper body leans back from the hit (the party is on his left, so the top goes right): the torso
turns about the waist, ramped through the sash so nothing tears, and the hat and head turn a little
further about the neck. The hip swords are rigid: they are pasted back where the idle has them.
The warp runs on a 2x Lanczos canvas and comes down once (METHOD-CHECK step 3); the matte is
re-thresholded to the idle's binary alpha. The canvas, feet and scale are the idle's.
   python yoj_hurt.py <torso-deg> <head-extra-deg> <out.png>
"""
import sys, json
import numpy as np, cv2
from ylib import *

A_T, A_H, out = float(sys.argv[1]), float(sys.argv[2]), sys.argv[3]
idle = load(IDLE['yojimbo-cavern']).astype(np.float32)
H, W = idle.shape[:2]
# rigid hip swords: the blue-hilt katana and the red-corded sword, back where the idle has them
swords = np.maximum(rect_along(idle.shape, (156, 376), (262, 474), 30), 0)
cv2.ellipse(swords, (242, 462), (24, 30), 35, 0, 360, 255, -1)
swords = np.maximum(swords, rect_along(idle.shape, (14, 648), (256, 506), 34))
rr, gg, bb = idle[:, :, 0], idle[:, :, 1], idle[:, :, 2]
sashy = ((rr > 180) & (gg > 60) & (gg < 170) & (bb < 80))
yy1, xx1 = np.mgrid[0:H, 0:W]
keep = (swords > 0) & (idle[:, :, 3] > 127) & ~(sashy & (xx1 > 240)) & (xx1 < 262)
src = idle.copy(); src[keep] = 0
K = 2
big = cv2.resize(src, (W * K, H * K), interpolation=cv2.INTER_LANCZOS4)
al = big[:, :, 3:4] / 255.0
pre = np.concatenate([big[:, :, :3] * al, big[:, :, 3:4]], 2)

PIV = np.float32([345, 470]) * K      # waist
NECK = np.float32([330, 215]) * K     # under the hat
Y0, Y1 = 520 * K, 390 * K             # the torso ramp: 0 at Y0 (hips), full at Y1 (chest)
HY0, HY1 = 250 * K, 190 * K           # the head ramp

def smooth(t):
    t = np.clip(t, 0, 1); return t * t * (3 - 2 * t)

yy, xx = np.mgrid[0:H * K, 0:W * K].astype(np.float32)
# inverse map: for each output pixel, undo the head turn then the torso turn (small angles; the
# ramp is evaluated at the output row, which is exact enough below 10 degrees)
a_t = np.deg2rad(A_T) * smooth((Y0 - yy) / (Y0 - Y1))
a_h = np.deg2rad(A_H) * smooth((HY0 - yy) / (HY0 - HY1))
# head: rotate about the neck, which itself has moved with the torso
c, s = np.cos(np.deg2rad(A_T)), np.sin(np.deg2rad(A_T))
neck_moved = PIV + np.array([[c, -s], [s, c]]) @ (NECK - PIV)
def rot_inv(x, y, cx, cy, a):
    ca, sa = np.cos(-a), np.sin(-a)
    dx, dy = x - cx, y - cy
    return cx + ca * dx - sa * dy, cy + sa * dx + ca * dy
x1, y1 = rot_inv(xx, yy, neck_moved[0], neck_moved[1], a_h)
x2, y2 = rot_inv(x1, y1, PIV[0], PIV[1], a_t)
warped = cv2.remap(pre, x2.astype(np.float32), y2.astype(np.float32), interpolation=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
warped = np.clip(warped, 0, 255)
small = cv2.resize(warped, (W, H), interpolation=cv2.INTER_AREA)
a = small[:, :, 3:4] / 255.0
rgb = np.where(a > 1e-3, small[:, :, :3] / np.maximum(a, 1e-3), 0)
res = np.concatenate([np.clip(rgb, 0, 255), small[:, :, 3:4]], 2)

res[keep] = idle[keep]
# below the hips the warp is the identity: the idle's own pixels, exactly
res[int(Y0 / K):] = idle[int(Y0 / K):]
res[:, :, 3] = np.where(res[:, :, 3] >= 128, 255, 0)
res[res[:, :, 3] == 0] = 0
res = res.astype(np.uint8)
save(res, out)

ys, xs = np.where(res[:, :, 3] > 0)
ys0, xs0 = np.where(idle[:, :, 3] > 0)
unchanged = (np.abs(res.astype(int) - idle.astype(int)).sum(2) == 0) & (idle[:, :, 3] > 0)
print(json.dumps(dict(out=out, torsoDeg=A_T, headExtraDeg=A_H, contentBox=[int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())],
                      idleContentBox=[int(xs0.min()), int(ys0.min()), int(xs0.max()), int(ys0.max())],
                      opaqueArea=int((res[:, :, 3] > 0).sum()), idleOpaqueArea=int((idle[:, :, 3] > 0).sum()),
                      idlePixelsUntouched=round(float(unchanged.sum()) / float((idle[:, :, 3] > 0).sum()), 3),
                      invented=round(invented_share(idle.astype(np.uint8), res, np.full((H, W), 255, np.uint8))[0], 4))))
