"""Seymour (Macalania) r3 poses from the r3 idle's own pixels (FFX only).
cast: the upper (visible) hand turns up about its root under the lapel (fingers raised before the chest),
      and the long back locks lift outward from the scalp (a bend that grows toward the tips).
hurt: the upper body leans back about the hips, a smooth bend in the waist band; the robe below stays.
usage: sey_derive.py <cast|hurt> <out.png> <angle_deg> <maskdir> [hair_deg]"""
import sys, os, json, numpy as np, cv2
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rig import *
IDLE = 'D:/Final Fantasy/public/art/characters/seymour-macalania/idle.png'
mode, out, ang, md = sys.argv[1], sys.argv[2], float(sys.argv[3]), sys.argv[4]
hang = float(sys.argv[5]) if len(sys.argv) > 5 else 0.0
im = load(IDLE); h, w = im.shape[:2]; xs, ys = grid(h, w); op = im[..., 3] > 0.5
meta = dict(mode=mode, angle=ang)
if mode == 'cast':
    hand = mask(f'{md}/hand.m1.png')
    hand = cv2.dilate(hand.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool) & op & (xs >= 322)
    HP = (330.0, 338.0)
    layers = []; removed = hand.copy()
    base = im.copy(); base[hand] = 0
    if hang:
        hair = mask(f'{md}/hair.m1.png') & (xs >= 452) & (ys >= 60) & op
        HR = (452.0, 92.0)
        d = np.hypot(xs - HR[0], ys - HR[1])
        wh = smooth((d - 20) / 260.0)
        hsx, hsy = rot_inv(xs, ys, HR[0], HR[1], hang, wh)
        base[hair] = 0; removed |= hair
        layers.append(warp(im, hair.astype(np.float32), hsx, hsy))
        meta.update(hairPivot=HR, hairAngle=hang)
    SH = [float(v) for v in os.environ.get('HANDSHIFT', '0,0').split(',')]
    sx, sy = rot_inv(xs - SH[0], ys - SH[1], HP[0], HP[1], ang)
    res = base
    for L in layers: res = over(L, res)
    HW = warp(im, hand.astype(np.float32), sx, sy)
    res = over(HW, res)
    prot = HW[..., 3] > 0.5
    meta.update(handPivot=HP, handShift=SH)
    lean = float(os.environ.get('LEAN', 0))
    if lean:
        base_op = (base[..., 3] > 0.5).astype(np.uint8)
        inside = cv2.morphologyEx(base_op, cv2.MORPH_CLOSE, np.ones((15, 15), np.uint8)) > 0
        hole0 = (hand | (removed & inside)) & (res[..., 3] < 0.5)
        res = prefill(res, hole0)
        H = (340.0, 600.0); wy = smooth((H[1] + 20 - ys) / 190.0)
        lsx, lsy = rot_inv(xs, ys, H[0], H[1], lean, wy)
        opn = res[..., 3] > 0.5
        res = warp(res, opn.astype(np.float32), lsx, lsy)
        prot = cv2.remap(prot.astype(np.float32), lsx, lsy, cv2.INTER_LINEAR) > 0.99
        removed = cv2.remap(hole0.astype(np.float32), lsx, lsy, cv2.INTER_LINEAR) > 0.3
        meta.update(lean=lean, leanPivot=H)
else:
    H = (340.0, 600.0)
    wy = smooth((H[1] + 20 - ys) / 190.0)          # 1 above y 430, 0 below y 620
    sx, sy = rot_inv(xs, ys, H[0], H[1], ang, wy)
    res = warp(im, op.astype(np.float32), sx, sy)
    removed = np.zeros_like(op); prot = np.zeros_like(op)
    meta.update(pivot=H, band=[H[1] - 170, H[1] + 20])
res, specks = despeck(res)
hole = removed & (res[..., 3] > 0.5) if (mode == 'cast' and meta.get('lean')) else holes(res, im, removed)
res = prefill(res, hole)
save(out, res)
cv2.imwrite(out.replace('.png', '.hole.png'), hole.astype(np.uint8) * 255)
cv2.imwrite(out.replace('.png', '.protect.png'), prot.astype(np.uint8) * 255)
same = (np.abs(res - im).max(-1) == 0) & op
meta.update(specksDropped=specks, holePx=int(hole.sum()), opaque=int((res[..., 3] > 0.5).sum()), opaqueIdle=int(op.sum()),
            idleUnchangedShare=float(same.sum() / op.sum()))
json.dump(meta, open(out.replace('.png', '.json'), 'w'), indent=1); print(meta)
