"""Sin production art (FFX only, 2026-09-29): shared paths, light states, crops and staging maths for produce.py and
plates.py. No pixel is painted here: every output is a cut, a crop, a resize or a light state over the picked paintings.
"""
import hashlib
import json
import math
import os

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi

W, H = 2352, 1344
CAND = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-29-sin'
R3 = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-27-sin/round3'
SCRATCH = 'D:/Tools/pyrefly-scratch/overnight-0929/sin-install'
CUT = f'{SCRATCH}/cut'
STAGE = f'{SCRATCH}/stage'            # mirrors public/art/
HERE = os.path.dirname(os.path.abspath(__file__))
STATUS = ("DRIVER PICK (D-279: Bailey delegated tonight's Sin picks to the driver, 2026-09-29, 'Your picks "
          "(Recommended)'). An agent's pick, NOT Bailey's approval; installed so the listing step can wire it")
GAME = 'FFX only (rule 14: links I to IV are fought from the Fahrenheit and on Sin\'s back; research/ffx-sin.md 0.3)'
ORIGIN = ('Original art only (rule 8): our code-drawn sketches and our own paintings as the only image inputs, written '
          'sources only, no retail image as input, reference or IP-Adapter; no creature, game or franchise name in any prompt')

# Chapter VIII's rigs and spots (src/scenes/evrae-airship-range.ts RANGE_STAGING, EVRAE_WORLD_HEIGHT), for the
# staging numbers in every sidecar: the world height that draws a sprite at the size it has in its picked painting,
# if that painting's frame were the camera's frame at Evrae's own spot. Derived by the pinhole maths, not measured
# in the engine.
EVRAE = {
    'near': {'cam': (-0.5, 1.45, 9.4), 'look': (0.9, 1.75, -3.0), 'fov': 34, 'spot': (2.3, -0.9, -4.7)},
    'far': {'cam': (0.1, 2.45, 13.2), 'look': (0.5, 2.0, -6.0), 'fov': 36, 'spot': (6.4, 3.3, -30.0)},
}
EVRAE_WORLD_HEIGHT = 4.1


def visible_height(rng):
    e = EVRAE[rng]
    c, l, s = (np.array(e[k], float) for k in ('cam', 'look', 'spot'))
    d = (l - c) / np.linalg.norm(l - c)
    depth = float(np.dot(s - c, d))
    return 2 * depth * math.tan(math.radians(e['fov'] / 2)), depth


def staging(baseline_y, rng):
    """World height (the PaintedActor contract: worldHeight maps idle's baselineY) that reproduces the painting."""
    vis, depth = visible_height(rng)
    wh = baseline_y * vis / H
    return {'range': rng, 'evraeSpot': list(EVRAE[rng]['spot']), 'depthAlongView': round(depth, 2),
            'frameHeightWorld': round(vis, 3), 'worldHeightAsPainted': round(wh, 2),
            'vsEvraeWorldHeight': round(wh / EVRAE_WORLD_HEIGHT, 2)}


def load(p):
    return np.asarray(Image.open(p).convert('RGBA'), float)


def find_core(rgb, x, y, r=0.07):
    """compose.py's: the brightest violet spot within r (normalised) of (x, y)."""
    h, w = rgb.shape[:2]
    x0, x1 = int(max(0, (x - r) * w)), int(min(w, (x + r) * w)); y0, y1 = int(max(0, (y - r * 1.6) * h)), int(min(h, (y + r * 1.6) * h))
    win = rgb[y0:y1, x0:x1, :3].astype(float)
    score = win[..., 0] * 0.5 + win[..., 2] - win[..., 1] * 0.8
    score = ndi.gaussian_filter(np.clip(score, 0, 255), 6)
    iy, ix = np.unravel_index(np.argmax(score), score.shape)
    return (x0 + ix) / w, (y0 + iy) / h


def dim(rgba, c, r):
    """At rest: the painted core darkened to a low violet ember (compose.py's dim), inside the sprite only."""
    h, w = rgba.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    d = np.clip(np.hypot(xx - c[0] * w, yy - c[1] * h) / r, 0, 1)[..., None]
    out = rgba.copy()
    ember = rgba[..., :3] * np.array((0.42, 0.34, 0.52))
    out[..., :3] = rgba[..., :3] * d + ember * (1 - d)
    return out


def glow(rgba, c, r, strength=0.95, halo=0.85):
    """'Core gathers energy.': compose.py's violet glow, added over the core; outside the silhouette the glow becomes
    the sprite's own soft halo (alpha from its brightness, capped), so it still reads over any backdrop."""
    h, w = rgba.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    d = np.hypot((xx - c[0] * w) / r, (yy - c[1] * h) / r)
    g = np.exp(-d ** 2 * 2.2)[..., None] * np.array((190, 120, 255), float) * strength
    g += np.exp(-d ** 2 * 18)[..., None] * np.array((255, 240, 255), float) * strength
    out = rgba.copy()
    a = rgba[..., 3:] / 255
    lit = np.clip(rgba[..., :3] + g, 0, 255)
    ga = np.clip(g.max(axis=2, keepdims=True) / 255, 0, halo)
    na = np.maximum(a, ga)
    # outside the body the colour is the glow's own
    glow_col = np.clip(g / np.maximum(g.max(axis=2, keepdims=True), 1e-3) * 255, 0, 255)
    out[..., :3] = np.where(a > 0.02, lit, glow_col)
    out[..., 3:] = na * 255
    return out


def bbox(a, thr=8):
    ys, xs = np.nonzero(a > thr)
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def union(*boxes):
    return min(b[0] for b in boxes), min(b[1] for b in boxes), max(b[2] for b in boxes), max(b[3] for b in boxes)


def pad(box, m=16):
    return max(0, box[0] - m), max(0, box[1] - m), min(W, box[2] + m), min(H, box[3] + m)


def bleeds(box, m=2):
    e = []
    if box[0] <= m: e.append('left')
    if box[1] <= m: e.append('top')
    if box[2] >= W - m: e.append('right')
    if box[3] >= H - m: e.append('bottom')
    return e


def save_rgba(arr, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), 'RGBA').save(path, optimize=True)


def sha(path):
    return hashlib.sha256(open(path, 'rb').read()).hexdigest()


def prov(stem):
    p = f'{stem}.prov.json' if ':' in stem else f'{CAND}/{stem}.prov.json'
    return json.load(open(p)) if os.path.exists(p) else {}


def write_json(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    json.dump(obj, open(path, 'w', encoding='utf-8'), indent=2, ensure_ascii=False)
    open(path, 'a', encoding='utf-8').write('\n')


def jpeg_check(arr_rgba, path, maxw=1200):
    im = Image.fromarray(np.clip(arr_rgba, 0, 255).astype(np.uint8), 'RGBA')
    bg = Image.new('RGBA', im.size, (255, 0, 255, 255)); bg.alpha_composite(im)
    bg = bg.convert('RGB'); bg.thumbnail((maxw, maxw))
    bg.save(path, quality=85)


def blur_img(im, r):
    return im.filter(ImageFilter.GaussianBlur(r))
