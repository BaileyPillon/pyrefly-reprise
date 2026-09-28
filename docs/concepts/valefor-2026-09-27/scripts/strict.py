# Strict cut-out check (house rule from docs/concepts/ff7-art-2026-09-27/round2 README "The cut-out
# check, tightened"): alpha >= 8, 8-connected; any piece other than the largest with >= 24 px fails.
# Halo: the same predicate defringe.py uses (an edge pixel clearly LIGHTER than the figure just
# inside it, lum > 150, and not more colourful) - the count left after cleanup must be 0.
# Frame touch: opaque pixels on the outer row/column of the cut-out (= the subject hit the render's
# frame edge, since the cutter keeps a 16 px margin).
import json, sys
import numpy as np
from PIL import Image
from scipy import ndimage


def lum(a):
    return a[..., 0] * 0.299 + a[..., 1] * 0.587 + a[..., 2] * 0.114


def chroma(a):
    return a.max(-1) - a.min(-1)


def inner_ref(rgb, alpha, depth=3):
    core = ndimage.binary_erosion(alpha, iterations=depth)
    if not core.any():
        core = alpha
    _, (iy, ix) = ndimage.distance_transform_edt(~core, return_indices=True)
    ref = rgb[iy, ix]
    return np.stack([ndimage.uniform_filter(ref[..., c], 3) for c in range(3)], -1)


for f in sys.argv[1:]:
    im = np.asarray(Image.open(f).convert('RGBA')).astype(np.float32)
    rgb, a = im[..., :3], im[..., 3]
    alpha = a >= 8
    lab, n = ndimage.label(alpha, structure=np.ones((3, 3)))
    sizes = ndimage.sum(alpha, lab, range(1, n + 1)) if n else []
    order = sorted(range(n), key=lambda i: -sizes[i])
    extra = [int(sizes[i]) for i in order[1:] if sizes[i] >= 24]
    edge = alpha & ndimage.binary_dilation(~alpha)
    ref = inner_ref(rgb, alpha)
    fringe = edge & (lum(rgb) > lum(ref) + 22) & (lum(rgb) > 150) & (chroma(rgb) < chroma(ref) + 12)
    semi = int(((a > 0) & (a < 255)).sum())
    h, w = alpha.shape
    touch = int(alpha[0, :].sum() + alpha[-1, :].sum() + alpha[:, 0].sum() + alpha[:, -1].sum())
    ok = (not extra) and fringe.sum() < 0.005 * max(1, edge.sum())
    print(json.dumps({'file': f.replace('\\', '/').split('/')[-2] + '/' + f.replace('\\', '/').split('/')[-1],
                      'size': f'{w}x{h}', 'components': int(n), 'detachedPieces': extra,
                      'haloPx': int(fringe.sum()), 'edgePx': int(edge.sum()), 'semiAlphaPx': semi,
                      'frameTouchPx': touch, 'strict': 'PASS' if ok else 'FAIL'}))
