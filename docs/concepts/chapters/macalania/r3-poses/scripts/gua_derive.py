"""Guado Guardian r3 poses from the r3 idle's own pixels (FFX only).
cast: the fist and the whole spear turn as one rigid part about the wrist (front finial up at the party,
      crescent down behind); the forearm and the body stay the idle's pixels.
hurt: the upper body leans back about the hips (smooth bend in the waist band); forearm, fist and spear
      follow rigidly with the bend at the wrist.
usage: gua_derive.py <cast|hurt> <out.png> <angle_deg> <maskdir>
writes <out>.png (holes pre-filled by Telea), <out>.hole.png (the repaint mask), <out>.json"""
import sys, os, json, numpy as np, cv2
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rig import *
IDLE = 'D:/Final Fantasy/public/art/characters/guado-guardian/idle.png'
mode, out, ang, md = sys.argv[1], sys.argv[2], float(sys.argv[3]), sys.argv[4]
im = load(IDLE); h, w = im.shape[:2]; xs, ys = grid(h, w)
spear = mask(f'{md}/spear.full.png'); arm = mask(f'{md}/arm.m1.png')
W = (338.0, 527.0)
meta = dict(mode=mode, angle=ang)
if mode == 'cast':
    fist = arm & (ys >= W[1])
    fore = arm & ~fist
    R = spear | fist
    sx, sy = rot_inv(xs, ys, W[0], W[1], ang)
    moved = warp(im, R.astype(np.float32), sx, sy)
    wb = smooth((ys - (W[1] - 45)) / 45.0)          # the wrist bends over the last 45 px of the forearm
    bx, by = rot_inv(xs, ys, W[0], W[1], ang, wb)
    bent = warp(im, fore.astype(np.float32), bx, by)
    base = im.copy(); base[R | fore] = 0
    res = over(moved, over(bent, base))
    removed = R | fore
    prot = (moved[..., 3] > 0.5) | (bent[..., 3] > 0.5)
    meta['pivot'] = W
else:
    H = (390.0, 640.0)
    wy = smooth((H[1] + 30 - ys) / 180.0)          # 1 above y 490, 0 below y 670
    R = spear | arm
    body = ~R & (im[..., 3] > 0.5)
    bsx, bsy = rot_inv(xs, ys, H[0], H[1], ang, wy)
    B = warp(im, body.astype(np.float32), bsx, bsy)
    wr = float(smooth((H[1] + 30 - 470) / 180.0))  # the arm follows the body at the elbow's weight
    rsx, rsy = rot_inv(xs, ys, H[0], H[1], ang * wr)
    Rm = warp(im, R.astype(np.float32), rsx, rsy)
    res = over(Rm, B)
    prot = Rm[..., 3] > 0.5
    removed = cv2.remap(R.astype(np.float32), bsx, bsy, cv2.INTER_LINEAR) > 0.01  # R's old place, as the body warp carries it
    meta.update(pivot=H, band=[H[1] - 150, H[1] + 30], armWeight=wr)
res, specks = despeck(res)
hole = holes(res, im, removed)
# the dent the shaft leaves in the robe's outline: removed pixels inside a wider closing AND within 11 px of the figure
fig = (res[..., 3] > 0.5).astype(np.uint8)
near = cv2.distanceTransform(1 - fig, cv2.DIST_L2, 5) <= 11
wide = cv2.morphologyEx(fig, cv2.MORPH_CLOSE, np.ones((31, 31), np.uint8)) > 0
hole |= removed & wide & near & (res[..., 3] < 0.5) & (im[..., 3] > 0.5)
res = prefill(res, hole)
save(out, res)
cv2.imwrite(out.replace('.png', '.hole.png'), hole.astype(np.uint8) * 255)
cv2.imwrite(out.replace('.png', '.protect.png'), prot.astype(np.uint8) * 255)
same = (np.abs(res - im).max(-1) == 0) & (im[..., 3] > 0.5)
meta.update(specksDropped=specks, holePx=int(hole.sum()), opaque=int((res[..., 3] > 0.5).sum()), opaqueIdle=int((im[..., 3] > 0.5).sum()),
            idleUnchangedShare=float(same.sum() / (im[..., 3] > 0.5).sum()))
json.dump(meta, open(out.replace('.png', '.json'), 'w'), indent=1); print(meta)
