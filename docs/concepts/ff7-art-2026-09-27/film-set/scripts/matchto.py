"""Film set, repair round: match one MATERIAL of a pose to the same material in its idle (LOOK: the spin, an edit of
the fist pump, came out with a brighter magenta knit and trousers than the idle's indigo). Pixels in a hue range
(degrees, wrapping allowed), with saturation above SMIN and value above VMIN, move per channel from their mean and
spread to those of the same pixels in the reference cut-out. Alpha untouched.
Usage: python matchto.py <cut.png> <ref-cut.png> <out.png> <hue_lo> <hue_hi> [smin=0.2] [vmin=0.08] ["what"] [ref_lo ref_hi] [box]"""
import json, sys
import numpy as np
from PIL import Image
from scipy import ndimage

src, ref, dst = sys.argv[1:4]
lo, hi = float(sys.argv[4]), float(sys.argv[5])
smin = float(sys.argv[6]) if len(sys.argv) > 6 else 0.2
vmin = float(sys.argv[7]) if len(sys.argv) > 7 else 0.08
what = sys.argv[8] if len(sys.argv) > 8 else ''
# optional: the reference's own hue range (a pink-red forearm matched to the idle's skin, 2..38 degrees) and a box
rlo = float(sys.argv[9]) if len(sys.argv) > 9 else lo
rhi = float(sys.argv[10]) if len(sys.argv) > 10 else hi
BOX = sys.argv[11] if len(sys.argv) > 11 else ''


def mask(a, lo, hi):
    rgb = a[..., :3] / 255
    mx, mn = rgb.max(-1), rgb.min(-1)
    s = (mx - mn) / np.maximum(mx, 1e-6)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    h = np.degrees(np.arctan2(np.sqrt(3) * (g - b), 2 * r - g - b)) % 360
    inh = (h >= lo) & (h <= hi) if lo <= hi else (h >= lo) | (h <= hi)
    return (a[..., 3] > 128) & inh & (s > smin) & (mx > vmin)


A = np.asarray(Image.open(src).convert('RGBA')).astype(float)
R = np.asarray(Image.open(ref).convert('RGBA')).astype(float)
ma, mr = mask(A, lo, hi), mask(R, rlo, rhi)
if BOX:
    x0, y0, x1, y1 = (int(t) for t in BOX.split(','))
    bm = np.zeros(ma.shape, bool)
    bm[y0:y1, x0:x1] = True
    ma &= bm
w = ndimage.gaussian_filter(ma.astype(float), 1.0)
out = A.copy()
st = {}
for c in range(3):
    pa, pr = A[..., c][ma], R[..., c][mr]
    st['rgb'[c]] = [round(float(pa.mean())), round(float(pr.mean()))]
    out[..., c] = A[..., c] * (1 - w) + ((A[..., c] - pa.mean()) / max(pa.std(), 1) * pr.std() + pr.mean()) * w
Image.fromarray(out.clip(0, 255).astype(np.uint8)).save(dst)
print(json.dumps({'step': 'matchto', 'script': 'film-set/scripts/matchto.py', 'ref': ref.replace(chr(92), '/'), 'hue': [lo, hi], 'refHue': [rlo, rhi], 'box': BOX,
                  'meanPoseToRef': st, 'pixels': int(ma.sum()), 'what': what}))
