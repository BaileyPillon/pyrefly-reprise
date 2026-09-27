"""Film set: the resample factor that puts a pose at its idle's scale, by registering the HEAD (the one part that keeps
its size and nearly its angle in every pose) onto the idle's head: a scale + shift search maximising the normalised
correlation of the blurred grey image of the head crop (the hair's top down 560 px, around the hair's median x).
Cross-check it by eye on a lineup; stature is a second check for upright poses.
Usage: python headfit.py cloud|barret <idle-cut.png> <pose-cut.png> [...]"""
import json, sys
import numpy as np
from PIL import Image
from scipy import ndimage

HS = 560


def head(sub, path):
    im = Image.open(path).convert('RGBA')
    a = np.asarray(im).astype(float) / 255
    mx, mn = a[..., :3].max(-1), a[..., :3].min(-1)
    s = (mx - mn) / np.maximum(mx, 1e-6)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    hue = np.degrees(np.arctan2(np.sqrt(3) * (g - b), 2 * r - g - b)) % 360
    m = (a[..., 3] > .5) & (((hue > 38) & (hue < 62) & (s > .45) & (mx > .55)) if sub == 'cloud' else ((mx < .16) & (s < .6)))
    ys, xs = np.nonzero(m)
    top = ys.min()
    cx = int(np.median(xs[ys < top + 500]))
    pad = HS
    big = Image.new('RGBA', (im.width + 2 * pad, im.height + 2 * pad), (0, 0, 0, 0))
    big.paste(im, (pad, pad))
    c = big.crop((cx - HS + pad, top - HS // 3 + pad, cx + HS + pad, top - HS // 3 + 2 * HS + pad))   # 2 HS square, head in the upper middle
    c = np.asarray(c).astype(float) / 255
    grey = c[..., :3].mean(-1) * c[..., 3] + 0.25 * (1 - c[..., 3])
    return ndimage.gaussian_filter(grey, 3)


def ncc(x, y):
    x, y = x - x.mean(), y - y.mean()
    return float((x * y).sum() / np.sqrt((x * x).sum() * (y * y).sum() + 1e-9))


sub, idle = sys.argv[1], sys.argv[2]
A = head(sub, idle)
q = 4
Aq = A[::q, ::q]
C = Aq.shape[0] // 2
T = (HS - HS // 3) // q                                   # the hair's top sits T rows above the centre
win = (slice(C - T - 8, C - T + 480 // q), slice(C - 300 // q, C + 300 // q))   # the head itself, hair top to chin
for p in sys.argv[3:]:
    B = head(sub, p)[::q, ::q]
    best = (-2, 1, 0, 0)
    for k in np.arange(0.78, 1.30, 0.02):
        # warp B by 1/k about the centre: a pose whose head is k x the idle's shrinks back by 1/k
        for dy in range(-24, 25, 3):
            for dx in range(-24, 25, 3):
                w = ndimage.affine_transform(B, [k, k], offset=[C - k * C + dy, C - k * C + dx], order=1, mode='constant', cval=0.25)
                v = ncc(w[win], Aq[win])
                if v > best[0]:
                    best = (v, k, dy, dx)
    v0, k0, dy0, dx0 = best
    for k in np.arange(k0 - 0.02, k0 + 0.021, 0.005):
        for dy in range(dy0 - 2, dy0 + 3, 1):
            for dx in range(dx0 - 2, dx0 + 3, 1):
                w = ndimage.affine_transform(B, [k, k], offset=[C - k * C + dy, C - k * C + dx], order=1, mode='constant', cval=0.25)
                v = ncc(w[win], Aq[win])
                if v > best[0]:
                    best = (v, k, dy, dx)
    print(json.dumps({'pose': p, 'headRatio': round(float(best[1]), 3), 'scaleToIdle': round(1 / float(best[1]), 3), 'ncc': round(best[0], 3)}))
