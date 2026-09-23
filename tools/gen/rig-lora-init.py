"""Living-portrait v4 keys, second attempt (FFX-2 only): the plate turned in
2.5D as the starting paint for every yaw key.

Why: the first v4 keys were painted from noise, so each one invented its own
tassel, outfit, crop and scale, and the turn at 20 and 40 came out at half
the target (docs/concepts/pause-until-dawn/prototype-v2/art/v4/keys/judge-r1.md).
Here every key starts from the approved plate's OWN pixels, turned:

- The plate's v3 layers (art/rig.json -> artMeta.v3.frontal.layers: hairBack,
  headCore, irises, eye apertures, hairFront, strands, earring, with the
  hidden fills behind them) get a depth each: the face an ellipsoid on the
  skeleton's head (half-width 215 px, the same numbers as rig-lora-pose.py)
  plus a nose ridge; the hair a wider, flatter shell behind it; the fringe
  just in front of the face.
- Each head pixel is rotated about the head's vertical axis (x = 473) by the
  yaw and splatted with a z-buffer (every source column covers the span its
  two edges project to, so a stretched side leaves no cracks).
- The body layer (with its hidden fill) is pinned: it is drawn first and
  never moves. The tassel earring moves rigidly with her right ear; when that
  ear turns away (negative yaw) it is drawn under everything, when it turns
  toward the camera it is drawn on top.
- What the turn uncovers inside the old or new head gets the nearest head
  colour (up to 200 px), blurred (sigma 14) so the sampler paints it fresh
  instead of copying streaks, then white; `--fill flat` puts the plate's
  median hair brown there instead (used from round w3 on at 60 and 85).

Outputs per yaw in <out>/: yaw<N>.init.png (RGB, the img2img start),
yaw<N>.mask.png (L: 255 = repaint; the new and old head grown 16 px and
feathered; the pinned body outside it is the plate to the pixel) and
yaw<N>.json (the eye and nose positions the turn put them at).

    python -s tools/gen/rig-lora-init.py build [--yaws=-85,-60,...] [--out <dir>] [--fill blur|flat] [--keep-tassel] [--ahead 25]
"""
from __future__ import annotations

import argparse
import json
import math
import pathlib

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

REPO = pathlib.Path(__file__).resolve().parents[2]
ART = REPO / 'docs/concepts/pause-until-dawn/prototype-v2/art'
OUT = pathlib.Path('D:/Tools/pyrefly-lora/yuna-x2/init')
W, H = 832, 1216
CX, CY = 473.0, 470.0          # head axis (mid-pupils) and face centre height
FACE_A, FACE_B, FACE_C = 230.0, 330.0, 215.0
HAIR_A, HAIR_B, HAIR_C, HAIR_CY, HAIR_OFF = 420.0, 560.0, 170.0, 430.0, 70.0
EAR = (CX - 222.0, 520.0, 20.0)   # her right ear (screen-left), the tassel's anchor
FLAT_HAIR = None                  # set by --fill flat (the hairBack median)
AHEAD_PX = 0                      # --ahead: nearest colour this far ahead of the face, then white
HEAD_LAYERS = ['hairBack', 'headCore', 'irisR', 'irisL', 'eyeApertureR', 'eyeApertureL',
               'hairFront', 'strand1', 'strand2']


def layers() -> dict[str, tuple[np.ndarray, int, int]]:
    r = json.loads((ART / 'rig.json').read_text(encoding='utf-8'))
    out = {}
    for l in r['artMeta']['v3']['frontal']['layers']:
        im = np.asarray(Image.open(ART / l['file']).convert('RGBA')).astype(np.float32)
        out[l['name']] = (im, int(l['box'][0]), int(l['box'][1]))
    return out


def face_z(x, y):
    dx, dy = x - CX, y - CY
    z = FACE_C * np.sqrt(np.clip(1 - (dx / FACE_A) ** 2 - (dy / FACE_B) ** 2, 0, None))
    nose = 45.0 * np.exp(-((dx + 3) ** 2) / (2 * 18.0 ** 2)) * np.exp(-((y - 525.0) ** 2) / (2 * 40.0 ** 2))
    return z + nose


def hair_z(x, y):
    dx, dy = x - CX, y - HAIR_CY
    return HAIR_C * np.sqrt(np.clip(1 - (dx / HAIR_A) ** 2 - (dy / HAIR_B) ** 2, 0, None)) - HAIR_OFF


def depth(name: str, x, y):
    if name == 'headCore':
        return face_z(x, y)
    if name.startswith(('iris', 'eyeAperture')):
        return face_z(x, y) + 3
    if name == 'hairFront':
        return np.maximum(face_z(x, y), hair_z(x, y)) + 12
    if name == 'hairBack':
        return hair_z(x, y) - 25
    return hair_z(x, y)                      # strands


def rot(x, z, t):
    """(x', z') of a point at canvas x and depth z turned by t radians."""
    dx = x - CX
    return CX + dx * math.cos(t) + z * math.sin(t), -dx * math.sin(t) + z * math.cos(t)


def splat(canvas, zbuf, cov, img, ox, oy, name, t):
    a = img[..., 3]
    ys, xs = np.nonzero(a > 8)
    X = xs + ox
    Y = ys + oy
    keep = (Y >= 0) & (Y < H)
    xs, ys, X, Y = xs[keep], ys[keep], X[keep], Y[keep]
    Xf = X.astype(np.float64)
    Yf = Y.astype(np.float64)
    z = depth(name, Xf, Yf)
    xl, _ = rot(Xf - 0.5, depth(name, Xf - 0.5, Yf), t)
    xr, _ = rot(Xf + 0.5, depth(name, Xf + 0.5, Yf), t)
    _, zp = rot(Xf, z, t)
    lo = np.ceil(np.minimum(xl, xr) - 0.5).astype(int)
    # a span wider than 4 px is the steep rim of a shell smeared sideways:
    # cap it and let the smooth hole fill below cover the rest
    hi = np.minimum(np.maximum(np.floor(np.maximum(xl, xr) - 0.5).astype(int), lo), lo + 3)
    col = img[ys, xs]
    for k in range(int((hi - lo).max()) + 1):
        c = lo + k
        m = (c <= hi) & (c >= 0) & (c < W)
        cc, yy, zz, px = c[m], Y[m], zp[m], col[m]
        # painter's order within a layer is resolved by the z-buffer; a layer's
        # soft edge only blends over what is already there
        front = zz > zbuf[yy, cc]
        cc, yy, zz, px = cc[front], yy[front], zz[front], px[front]
        al = px[:, 3:4] / 255.0
        canvas[yy, cc] = canvas[yy, cc] * (1 - al) + px[:, :3] * al
        solid = px[:, 3] > 200
        zbuf[yy[solid], cc[solid]] = zz[solid]
        cov[yy, cc] = np.maximum(cov[yy, cc], px[:, 3] / 255.0)


def paste(canvas, img, ox, oy, dx=0):
    h, w = img.shape[:2]
    x0, y0 = ox + dx, oy
    sx0, sy0 = max(0, -x0), max(0, -y0)
    ex, ey = min(w, W - x0), min(h, H - y0)
    if ex <= sx0 or ey <= sy0:
        return np.zeros((H, W), np.float32)
    part = img[sy0:ey, sx0:ex]
    al = part[..., 3:4] / 255.0
    reg = canvas[y0 + sy0:y0 + ey, x0 + sx0:x0 + ex]
    canvas[y0 + sy0:y0 + ey, x0 + sx0:x0 + ex] = reg * (1 - al) + part[..., :3] * al
    m = np.zeros((H, W), np.float32)
    m[y0 + sy0:y0 + ey, x0 + sx0:x0 + ex] = part[..., 3] / 255.0
    return m


def head_alpha(L) -> np.ndarray:
    m = np.zeros((H, W), np.float32)
    for n in HEAD_LAYERS + ['earring']:
        img, ox, oy = L[n]
        tmp = np.zeros((H, W, 3), np.float32)
        m = np.maximum(m, paste(tmp, img, ox, oy))
    return m


def build(yaw: float, L, plate_head: np.ndarray, keep_tassel: bool = False):
    t = math.radians(yaw)
    # --keep-tassel: from -25 up the tassel is still in view as the plate
    # shows it; it is drawn on top and cut out of the repaint mask, so the key
    # carries the plate's own tassel pixels (only moved with the ear)
    top = yaw >= 0 or (keep_tassel and yaw >= -25)
    canvas = np.full((H, W, 3), 255.0, np.float32)
    zbuf = np.full((H, W), -1e9, np.float32)
    cov = np.zeros((H, W), np.float32)
    ear_x, _ = rot(EAR[0], EAR[2], t)
    shift = int(round(ear_x - EAR[0]))
    er, ex, ey = L['earring']
    ear_mask = np.zeros((H, W), np.float32)
    if not top:                                  # far ear: under everything
        ear_mask = paste(canvas, er, ex, ey, shift)
    body, bx, by = L['body']
    paste(canvas, body, bx, by)
    head = np.zeros((H, W, 3), np.float32)
    head[:] = canvas
    for n in HEAD_LAYERS:
        img, ox, oy = L[n]
        splat(head, zbuf, cov, img, ox, oy, n, t)
    canvas = head
    if top:                                      # near ear: on top
        ear_mask = paste(canvas, er, ex, ey, shift)
    new_head = np.maximum(cov, ear_mask if top else 0) > 0.5
    # what the turn uncovered: inside the old or the new head, not covered now
    old = plate_head > 0.5
    body_a = paste(np.zeros((H, W, 3), np.float32), body, bx, by) > 0.5
    holes = (old | ndi.binary_closing(new_head, iterations=6)) & ~new_head & ~body_a
    if holes.any():
        dist, (iy, ix) = ndi.distance_transform_edt(~new_head, return_indices=True)
        fill = holes & (dist <= 200)
        near = canvas[iy, ix]
        near[~fill] = 255.0
        if FLAT_HAIR is not None:
            # round 2b: one flat hair brown (the plate's hairBack median), its
            # edge softened into the neighbours; a blur of mixed neighbours
            # left rainbow glows the sampler kept at denoise 0.6
            near[fill] = FLAT_HAIR
            # in front of the face (past its front contour on the side the
            # nose points to) a hole is background, not hair
            ys_, xs_ = np.mgrid[0:H, 0:W]
            col = np.full(H, CX)
            fz = np.maximum(face_z(col, np.arange(H, dtype=np.float64)), hair_z(col, np.arange(H, dtype=np.float64)) + 40)
            front = CX + fz * math.sin(t)
            ahead = (xs_ - front[:, None]) * np.sign(t) > 0
            # just ahead of the painted face the nearest colour runs on for
            # AHEAD_PX (room for the nose, lips and chin the capped splat
            # squeezed), white after that
            skin = canvas[iy, ix]
            near[fill & ahead] = np.where((dist[fill & ahead] <= AHEAD_PX)[:, None], skin[fill & ahead], 255.0)
            soft = ndi.gaussian_filter(holes.astype(np.float32), 5.0)[..., None]
            filled = canvas * (1 - soft) + near * soft
            canvas[holes] = filled[holes]
        else:
            # smooth, not streaked: the nearest colour smeared along the turn reads
            # as hair texture to the sampler, a blur reads as unpainted volume
            for c in range(3):
                near[..., c] = ndi.gaussian_filter(near[..., c], 14.0)
            canvas[holes] = near[holes]
    mask = ndi.binary_dilation(new_head | old, iterations=16)
    soft = ndi.gaussian_filter(mask.astype(np.float32), 4.0)
    if keep_tassel and top:
        keep = ndi.binary_erosion(ear_mask > 0.5, iterations=3)
        soft = soft * (1 - ndi.gaussian_filter(keep.astype(np.float32), 1.5))
    pts = {}
    for name, (x, y, z) in {'pupil_R': (339.0, 421.0, None), 'pupil_L': (608.0, 406.0, None),
                             'noseTip': (470.0, 548.0, None)}.items():
        xp, zp = rot(x, float(face_z(np.float64(x), np.float64(y))), t)
        pts[name] = [round(xp, 1), y, round(zp, 1)]
    return canvas, soft, pts


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('cmd', choices=['build'])
    ap.add_argument('--yaws', default='-85,-60,-40,-20,0,20,40,60,85')
    ap.add_argument('--out', default=str(OUT))
    ap.add_argument('--fill', choices=['blur', 'flat'], default='blur')
    ap.add_argument('--keep-tassel', action='store_true')
    ap.add_argument('--ahead', type=int, default=0)
    a = ap.parse_args()
    out = pathlib.Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    L = layers()
    ph = head_alpha(L)
    global AHEAD_PX
    AHEAD_PX = a.ahead
    if a.fill == 'flat':
        global FLAT_HAIR
        hb = L['hairBack'][0]
        FLAT_HAIR = np.median(hb[hb[..., 3] > 250][:, :3], axis=0)
        print('flat hair', FLAT_HAIR)
    for s in a.yaws.split(','):
        yaw = float(s)
        name = f'yaw{int(yaw):+d}' if yaw else 'yaw0'
        img, mask, pts = build(yaw, L, ph, a.keep_tassel)
        Image.fromarray(np.clip(img, 0, 255).astype(np.uint8), 'RGB').save(out / f'{name}.init.png')
        Image.fromarray(np.clip(mask * 255, 0, 255).astype(np.uint8), 'L').save(out / f'{name}.mask.png')
        (out / f'{name}.json').write_text(json.dumps({'yaw': yaw, 'points': pts}, indent=1), encoding='utf-8')
        print(name, pts)


if __name__ == '__main__':
    main()
