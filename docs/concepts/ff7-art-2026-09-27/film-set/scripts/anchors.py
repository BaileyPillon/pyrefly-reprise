"""Measure where each installed Film party pose stands, so the stage can register every pose on the idle's stance.

FF7 only. The installer (install.py) centred each plane on its candidate's `anchorX`, which for some poses is the
rear foot (Barret's aim and fire) and for the idle is the middle of the stance, so a swap from idle to aim jumped the
body about 120 px across the screen (the judge's repair item 1). This script finds, in each installed PNG, the stance
centre: the mean of the two boots' sole centres (boot-coloured connected blobs in the bottom sixth of the
figure; the grey blade and the trousers' purple are not boot-coloured), and prints the shift in the pose's own pixels that
puts that stance centre where the idle's is. The shift is applied at run time (src/data/ff7/filmPoseAnchors.ts); the
locked PNGs are not touched. It also measures Barret's gun muzzle (the rightmost opaque column in the upper half)
as a fraction of the pose's opaque box. Usage: python anchors.py <art root> [--sheet out.jpg]
"""
import json, sys
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

ROOT = sys.argv[1]
SUBJECTS = {'ff7-film-cloud': ['idle', 'windup', 'attack', 'follow', 'victory', 'spin', 'back', 'hurt'],
            'ff7-film-barret': ['idle', 'aim', 'attack', 'victory', 'punch', 'hurt']}


def alpha(key, pose):
    im = Image.open(f'{ROOT}/characters/{key}/{pose}.png').convert('RGBA')
    return im, np.asarray(im)


def stance(rgba):
    """The stance centre: the mean of the two boots' sole centres (boot-coloured blobs, not the grey blade)."""
    a = rgba[..., 3] >= 128
    ys, xs = np.nonzero(a)
    top, bot = ys.min(), ys.max()
    h = bot - top
    r, g, b = (rgba[..., i].astype(int) for i in range(3))
    booty = a & ((r - b) > 18) & ((np.maximum(np.maximum(r, g), b) - np.minimum(np.minimum(r, g), b)) > 18)
    band = np.zeros_like(a)
    y0 = bot - int(h * 0.16)
    band[y0:bot + 1] = booty[y0:bot + 1]
    lab, n = ndimage.label(band)
    blobs = []
    for i in range(1, n + 1):
        yy, xx = np.nonzero(lab == i)
        if len(xx) < 300:
            continue
        sole = yy >= yy.max() - 24
        blobs.append((len(xx), float(xx[sole].mean()), int(xx.min()), int(xx.max())))
    blobs.sort(key=lambda q: -q[0])
    feet = sorted(blobs[:2], key=lambda q: q[1])
    c = rgba.shape[1] / 2
    mid = sum(q[1] for q in feet) / len(feet)
    return mid - c, feet[0][1] - c, feet[-1][1] - c, len(feet)


def muzzle(rgba):
    a = rgba[..., 3] >= 128
    ys, xs = np.nonzero(a)
    top, bot, left, right = ys.min(), ys.max(), xs.min(), xs.max()
    upper = a[top: top + int((bot - top) * 0.5)]
    cols = np.nonzero(upper.any(0))[0]
    rx = cols.max()
    ry = top + np.nonzero(upper[:, rx - 3:rx + 1].any(1))[0].mean()
    return (rx - left) / (right - left), (ry - top) / (bot - top)


# A key painted as an edit of another (Barret's fire of his aim) registers on that key by the best overlap of the
# legs, so the swap between the two does not step: (key, pose, registered on).
EDITS = {('ff7-film-barret', 'attack'): 'aim'}


def leg_overlap(a, b):
    """The shift of b (px) that best overlaps its lower half with a's, both centred."""
    A, B = a[..., 3] >= 128, b[..., 3] >= 128
    h = min(A.shape[0], B.shape[0])
    A, B = A[-h:][h // 2:], B[-h:][h // 2:]
    W = max(A.shape[1], B.shape[1]) + 400
    ca = np.zeros((A.shape[0], W), bool)
    ca[:, W // 2 - A.shape[1] // 2: W // 2 - A.shape[1] // 2 + A.shape[1]] = A
    best = (-1, 0)
    for dx in range(-120, 121):
        cb = np.zeros_like(ca)
        o = W // 2 - B.shape[1] // 2 + dx
        cb[:, o:o + B.shape[1]] = B
        iou = (ca & cb).sum() / max(1, (ca | cb).sum())
        best = max(best, (iou, dx))
    return best[1]


out = {}
for key, poses in SUBJECTS.items():
    _, ia = alpha(key, 'idle')
    base = stance(ia)[0]
    out[key] = {}
    for p in poses:
        im, a = alpha(key, p)
        meta = json.load(open(f'{ROOT}/characters/{key}/{p}.json'))
        k = meta.get('scale', 1) if p != 'idle' else 1
        s, lo, hi, n = stance(a)
        # The shift in this pose's own pixels (the stage multiplies it by the plane's units per pixel, which carry
        # the pose's `scale`), so the stance centre lands on the idle's.
        shift = round(base / k - s)
        if (key, p) in EDITS:
            ref = EDITS[(key, p)]
            _, ra = alpha(key, ref)
            shift = out[key][ref]['shiftPx'] + leg_overlap(ra, a)
        out[key][p] = {'shiftPx': shift, 'stance': [round(lo), round(hi)], 'feet': n, 'width': int(a.shape[1]), 'scale': k}
        if key == 'ff7-film-barret' and p in ('aim', 'attack'):
            mx, my = muzzle(a)
            out[key][p]['muzzle'] = [round(mx, 3), round(my, 3)]
print(json.dumps(out, indent=1))

if '--sheet' in sys.argv:
    dst = sys.argv[sys.argv.index('--sheet') + 1]
    tiles = []
    for key, poses in SUBJECTS.items():
        idle, _ = alpha(key, 'idle')
        for p in poses:
            im, _ = alpha(key, p)
            W = 1400
            c = Image.new('RGBA', (W, 1200), (70, 70, 78, 255))
            ghost = idle.copy()
            g = np.asarray(ghost).copy()
            g[..., 0] = 255; g[..., 1] = 60; g[..., 2] = 60
            g[..., 3] = (g[..., 3] * 0.45).astype(np.uint8)
            c.alpha_composite(Image.fromarray(g), (W // 2 - idle.width // 2, 1200 - idle.height - 20))
            sh = out[key][p]['shiftPx']
            c.alpha_composite(im, (W // 2 - im.width // 2 + sh, 1200 - im.height - 20))
            d = ImageDraw.Draw(c)
            d.line([(W // 2, 0), (W // 2, 1200)], fill=(255, 255, 0, 255), width=2)
            d.text((10, 10), f'{key} {p} shift {sh}', fill=(255, 255, 255, 255))
            tiles.append(c.resize((W // 4, 300)))
    cols = 5
    rows = (len(tiles) + cols - 1) // cols
    sheet = Image.new('RGB', (cols * 350, rows * 300), (20, 20, 20))
    for i, t in enumerate(tiles):
        sheet.paste(t.convert('RGB'), ((i % cols) * 350, (i // cols) * 300))
    sheet.save(dst, quality=85)
