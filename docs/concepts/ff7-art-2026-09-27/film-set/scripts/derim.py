"""Film set: take the green/cyan rim light off the BACK edge of a party cut-out (the judge's one fault with the
Film pick). The party faces screen-right and the mako core is on their right, so a rim belongs only on the
edges that face the right; on edges that face the LEFT (left, up-left, down-left) it reads as a baked halo.
For every opaque pixel within BAND px of transparency whose nearest transparent pixel lies to its left, a
green-to-cyan excess (green well above red and not below blue: the rim's hue, never the olive trousers, skin,
blond hair or indigo) is replaced by the colour found further inside along the same inward direction,
darkened to a shadowed edge. Alpha is untouched. Pose renders are asked for no back rim in the prompt; this
is the safety net and the fix for the approved idle picks.
Usage: python derim.py <cut.png> <out.png> [band=22]"""
import json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

src, dst = sys.argv[1], sys.argv[2]
B = int(sys.argv[3]) if len(sys.argv) > 3 else 22
a = np.asarray(Image.open(src).convert('RGBA')).astype(float)
H, W = a.shape[:2]
op = a[..., 3] > 128
dist, (iy, ix) = ndimage.distance_transform_edt(op, return_indices=True)
yy, xx = np.mgrid[0:H, 0:W]
vx, vy = xx - ix, yy - iy                       # inward vector (from the nearest transparent pixel)
n = np.maximum(dist, 1e-6)
ux, uy = vx / n, vy / n
facing_left = ux > 0.35                          # the nearest outside lies to the left
band = op & (dist <= B) & facing_left
r, g, b = a[..., 0], a[..., 1], a[..., 2]
w = np.clip((g - np.maximum(r, 0.9 * b) - 12) / 36, 0, 1) * (g >= b - 12) * band
# the teal/cyan end of the rim (green and blue both well above red): never skin, olive, brown, indigo or blond
w = np.maximum(w, np.clip((np.minimum(g, b) - r - 18) / 36, 0, 1) * band)
w = ndimage.gaussian_filter(w, 1.0) * band
step = np.clip(B + 6 - dist, 0, None)
sx = np.clip(np.round(xx + ux * step), 0, W - 1).astype(int)
sy = np.clip(np.round(yy + uy * step), 0, H - 1).astype(int)
ref = a[sy, sx, :3].copy()
ref_ok = op[sy, sx]
ref[~ref_ok] = a[..., :3][~ref_ok]
rr, rg, rb = ref[..., 0], ref[..., 1], ref[..., 2]
rim_ref = rg > np.maximum(rr, 0.9 * rb) + 12      # the reference is rim too: pull its green down
ref[..., 1] = np.where(rim_ref, np.maximum(rr, rb), rg)
cy_ref = np.minimum(rg, rb) > rr + 18              # a teal reference: pull green and blue down to red's level
ref[..., 1] = np.where(cy_ref, rr, ref[..., 1])
ref[..., 2] = np.where(cy_ref, rr, rb)
tgt = ref * 0.72
out = a.copy()
out[..., :3] = a[..., :3] * (1 - w[..., None]) + tgt * w[..., None]
# PALE=1 (Barret, after LOOKING): the Film Barret's back rim is a pale grey-green (green only a few levels above red),
# which the hue test above misses. On the left-facing edges (30 px band), a pixel that is greenish-grey (green not
# below red, low chroma) and clearly LIGHTER than the colour further inside along the same inward line is a baked
# rim: it goes to that inner colour, darkened to a shadowed edge. Self-limiting: steel whose inside is as light stays.
pale_n = 0
if os.environ.get('PALE') == '1':
    P = 30
    bandp = op & (dist <= P) & facing_left
    stp = np.clip(P + 8 - dist, 0, None)
    px = np.clip(np.round(xx + ux * stp), 0, W - 1).astype(int)
    py = np.clip(np.round(yy + uy * stp), 0, H - 1).astype(int)
    refp = out[py, px, :3].copy()
    okp = op[py, px]
    cur = out[..., :3]
    mx, mn = cur.max(-1), cur.min(-1)
    lum, lref = cur.mean(-1), refp.mean(-1)
    greenish = (cur[..., 1] >= cur[..., 0] - 2) & (cur[..., 1] >= cur[..., 2] - 6) & ((mx - mn) < 34) & (mx > 55)
    wp = np.clip((lum - lref - 8) / 30, 0, 1) * (bandp & greenish & okp)
    wp = ndimage.gaussian_filter(wp, 0.8) * bandp
    out[..., :3] = cur * (1 - wp[..., None]) + refp * 0.72 * wp[..., None]
    pale_n = int((wp > 0.5).sum())
Image.fromarray(out.clip(0, 255).astype(np.uint8)).save(dst)
print(json.dumps({'step': 'derim', 'band': B, 'pixels': int((w > 0.05).sum()), 'strong': int((w > 0.5).sum()), 'pale': pale_n}))
