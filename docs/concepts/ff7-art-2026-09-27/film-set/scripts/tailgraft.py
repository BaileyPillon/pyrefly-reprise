"""Film set: the Guard Scorpion idle (tail lowered) on the SAME machine as the tail-raised pick, so the game can swap
the two without the body changing. lowertail.py's crop edit (FLUX.2 Klein edit mode on our own raised render) draws
a good low tail but redraws the body a little larger and shifted, so its body cannot be pasted. This script keeps the
raised pick pixel for pixel and grafts ONLY the new tail onto it:
  1. fit a similarity (scale + shift) of the edit to the source on the rear hip and leg, which both pictures share;
  2. clear the old raised tail (its footprint read off the raised pick's grid: above the disc housing, and right of
     the shell's rear edge above the hip) to the source's own studio grey (its known background, blurred smooth);
  3. paste the warped edit's non-background pixels right of the shell's rear edge (the new tail, its root at the hip),
     feathered 3 px; the source's rear leg stays in front where the edit shows background.
Never mirrors; our own renders only.
Usage: python tailgraft.py <raised.full.png> <edit.full.png> <out.full.png> [x0 y0 x1 y1 of the edit crop]"""
import json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

src, edit, out = sys.argv[1:4]
x0, y0, x1, y1 = (int(t) for t in sys.argv[4:8]) if len(sys.argv) > 7 else (880, 0, 2304, 1440)
SHELL_X = int(os.environ.get('SHELL_X', 1765))       # the shell's rear edge above the hip (raised pick grid)
im = np.asarray(Image.open(src).convert('RGB')).astype(float)
H, W = im.shape[:2]
e = Image.open(edit).convert('RGB').resize((x1 - x0, y1 - y0), Image.LANCZOS)
ef = np.zeros_like(im)
ef[y0:y1, x0:x1] = np.asarray(e).astype(float)
eok = np.zeros((H, W), bool)
eok[y0:y1, x0:x1] = True
# 1. fit on the rear hip and leg (quarter resolution, then refine)
q = 4
A = ndimage.zoom(im.mean(-1), 1 / q, order=1)
B = ndimage.zoom(ef.mean(-1), 1 / q, order=1)
reg = (slice(850 // q, 1400 // q), slice(1450 // q, 1760 // q))


def warp(b, s, dy, dx, order=1):
    return ndimage.affine_transform(b, [1 / s, 1 / s], offset=[-dy / s, -dx / s], order=order, mode='nearest')


def fit(b, cands):
    best = (1e18, 1, 0, 0)
    for s, dy, dx in cands:
        w = warp(b, s, dy, dx)
        err = np.abs(w[reg] - A[reg]).mean()
        best = min(best, (err, s, dy, dx))
    return best


best = fit(B, [(s, dy, dx) for s in np.arange(0.9, 1.101, 0.01) for dy in range(-30, 31, 2) for dx in range(-30, 31, 2)])
_, s0, dy0, dx0 = best
best = fit(B, [(s, dy, dx) for s in np.arange(s0 - 0.01, s0 + 0.0101, 0.0025)
               for dy in np.arange(dy0 - 2, dy0 + 2.01, 0.5) for dx in np.arange(dx0 - 2, dx0 + 2.01, 0.5)])
err, s, dy, dx = best
wf = np.stack([warp(ef[..., c], s, dy * q, dx * q) for c in range(3)], -1)
wok = warp(eok.astype(float), s, dy * q, dx * q) > 0.99
X = np.arange(W)[None, :].repeat(H, 0)
Y = np.arange(H)[:, None].repeat(W, 1)
# 2. the source's studio grey as a smooth field
ca = im.max(-1) - im.min(-1)
med = np.median(im[ca < 12], 0)
bgk = (ca < 12) & (np.abs(im - med).max(-1) < 18)
wk = ndimage.gaussian_filter(bgk.astype(float), 60)
field = np.stack([ndimage.gaussian_filter(im[..., c] * bgk, 60) for c in range(3)], -1) / np.maximum(wk, 1e-3)[..., None]
clear = ((X >= 1060) & (X < SHELL_X) & (Y < 435)) | ((X >= SHELL_X) & (Y < 880))
res = im.copy()
res[clear] = field[clear]
# 3. the new tail: the warped edit's non-background pixels right of the shell's rear edge
cb = wf.max(-1) - wf.min(-1)
emed = np.median(wf[wok & (cb < 12)], 0)
ebg = (cb < 14) & (np.abs(wf - emed).max(-1) < 16)
dfe = np.abs(wf - emed).max(-1)
glowish = (wf[..., 1] > wf[..., 0] + 6) & (wf[..., 2] > wf[..., 0] + 6) & (dfe < 70)   # the lens glow haze, not the tail
core = wok & ~ebg & ~glowish & (X >= SHELL_X) & (Y < 1250)
# the lens glass is cyan too: it is whatever the tail's ink outline encloses
tail = ndimage.binary_fill_holes(ndimage.binary_closing(core, iterations=6)) & wok & ~ebg & (X >= SHELL_X) & (Y < 1250)
tail = ndimage.binary_opening(tail, iterations=2)
lab, n = ndimage.label(tail)
if n:
    sz = ndimage.sum(np.ones((H, W)), lab, range(1, n + 1))
    tail = np.isin(lab, [i + 1 for i, v in enumerate(sz) if v > 3000])
tail = ndimage.binary_fill_holes(tail)
# where the source's own rear leg is (not background) and outside the old-tail footprint, the source stays in front
keep_src = ~bgk & ~clear & (Y >= 880)
graft = tail & ~keep_src
# the lens glow: only around the new lens (bright cyan in the edit), the edit's excess over its own grey added onto
# the source's grey with a falloff that reaches zero 90 px out, so the glow has no edge
lens = graft & (wf[..., 1] > 150) & (wf[..., 2] > 150) & (wf[..., 0] < 140)
dist = ndimage.distance_transform_edt(~lens) if lens.any() else np.full((H, W), 1e9)
fall = np.clip(1 - dist / 90, 0, 1) ** 1.5 * (wok & ~graft & ~keep_src)
excess = np.clip(wf - emed, 0, None)
res = res + excess * fall[..., None]
wgt = ndimage.gaussian_filter(graft.astype(float), 1.5)
res = res * (1 - wgt[..., None]) + wf * wgt[..., None]
Image.fromarray(res.clip(0, 255).astype(np.uint8)).save(out)
viz = (im * 0.35).astype(np.uint8)
viz[clear] = [0, 90, 255]
viz[graft] = [255, 0, 255]
Image.fromarray(viz).resize((W // 3, H // 3)).save(out.replace('.full.png', '.graft.jpg'), quality=80)
print(json.dumps({'step': 'tailgraft', 'script': 'film-set/scripts/tailgraft.py', 'source': src, 'edit': edit,
                  'fit': {'scale': round(float(s), 4), 'dy': float(dy * q), 'dx': float(dx * q), 'meanAbsErr': round(float(err), 2)},
                  'shellX': SHELL_X, 'graftPixels': int(graft.sum()), 'clearedPixels': int(clear.sum())}))
