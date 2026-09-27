"""Procedural effect helpers for the FF7 eye-candy quick mockups (numpy + Pillow only).

Every effect here is drawn from code: no retail image, effect, font or screenshot is an input.
Images are float32 arrays in 0..1 (HDR allowed above 1 until the final tone map).
"""
import math
import numpy as np
from PIL import Image, ImageDraw

F32 = np.float32


def load_rgba(path):
    return np.asarray(Image.open(path).convert('RGBA')).astype(F32) / 255.0


def save_rgb(a, path):
    Image.fromarray((np.clip(a[..., :3], 0, 1) * 255 + 0.5).astype(np.uint8)).save(path)


def resize(a, w, h, flt=Image.LANCZOS):
    if a.ndim == 2:
        return np.asarray(Image.fromarray(np.ascontiguousarray(a, F32), 'F').resize((int(w), int(h)), flt))
    return np.stack([resize(a[..., c], w, h, flt) for c in range(a.shape[2])], -1)


def _box(a, r, axis):
    if r < 1:
        return a
    n = a.shape[axis]
    pad = [(0, 0)] * a.ndim
    pad[axis] = (r + 1, r)
    c = np.cumsum(np.pad(a, pad, mode='edge'), axis=axis, dtype=np.float64)
    hi = np.take(c, np.arange(2 * r + 1, 2 * r + 1 + n), axis=axis)
    lo = np.take(c, np.arange(0, n), axis=axis)
    return ((hi - lo) / (2 * r + 1)).astype(F32)


def blur(a, s):
    """Gaussian-like blur (three box passes); large sigmas run on a downscaled copy."""
    if s < 0.6:
        return a
    h, w = a.shape[:2]
    if s > 10:
        f = max(2, int(s // 5))
        sm = resize(a, max(2, w // f), max(2, h // f), Image.BILINEAR)
        return resize(blur(sm, s / f), w, h, Image.BILINEAR)
    r = max(1, int(round((math.sqrt(4 * s * s + 1) - 1) / 2)))
    for _ in range(3):
        a = _box(_box(a, r, 0), r, 1)
    return a


def remap(img, mx, my):
    """Bilinear sample img at float coords (mx, my) (both HxW)."""
    h, w = img.shape[:2]
    mx = np.clip(mx, 0, w - 1.001)
    my = np.clip(my, 0, h - 1.001)
    x0 = mx.astype(np.int32)
    y0 = my.astype(np.int32)
    fx = (mx - x0)[..., None] if img.ndim == 3 else mx - x0
    fy = (my - y0)[..., None] if img.ndim == 3 else my - y0
    a = img[y0, x0]
    b = img[y0, x0 + 1]
    c = img[y0 + 1, x0]
    d = img[y0 + 1, x0 + 1]
    return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy


def grid(h, w):
    y, x = np.mgrid[0:h, 0:w].astype(F32)
    return x, y


def noise2(h, w, scale, seed, octaves=3):
    """Smooth value noise in 0..1 (bilinear-upscaled random grids)."""
    rng = np.random.default_rng(seed)
    out = np.zeros((h, w), F32)
    amp, tot = 1.0, 0.0
    for o in range(octaves):
        gw = max(2, int(w / scale * 2 ** o))
        gh = max(2, int(h / scale * 2 ** o))
        g = rng.random((gh, gw)).astype(F32)
        out += amp * resize(g, w, h, Image.BICUBIC)
        tot += amp
        amp *= 0.5
    return np.clip(out / tot, 0, 1)


def mask_draw(w, h, fn, ss=2):
    """Anti-aliased mask: fn(draw, k) draws in white on an L image at ss x size (k = ss)."""
    im = Image.new('L', (w * ss, h * ss), 0)
    fn(ImageDraw.Draw(im), ss)
    return np.asarray(im.resize((w, h), Image.LANCZOS)).astype(F32) / 255.0


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def lum(a):
    return a[..., 0] * 0.2126 + a[..., 1] * 0.7152 + a[..., 2] * 0.0722


def col(*c):
    return np.array(c, F32)


def add_glow(dst, mask, color, sigmas=((0, 1.0),)):
    """dst += sum(blur(mask, s) * k) * color."""
    acc = np.zeros(mask.shape, F32)
    for s, k in sigmas:
        acc += (blur(mask, s) if s else mask) * k
    dst += acc[..., None] * color
    return dst


def zoom_blur(img, cx, cy, strength=0.6, n=28, ds=2):
    """Radial (god-ray) blur: light spreads outward from (cx, cy)."""
    h, w = img.shape[:2]
    sw, sh = w // ds, h // ds
    sm = resize(img, sw, sh, Image.BILINEAR)
    cx, cy = cx / ds, cy / ds
    acc = np.zeros_like(sm)
    tot = 0.0
    for i in range(n):
        s = 1 + strength * i / (n - 1)
        wgt = 1.0 - 0.6 * i / (n - 1)
        coeff = (1 / s, 0, cx - cx / s, 0, 1 / s, cy - cy / s)
        ch = [np.asarray(Image.fromarray(np.ascontiguousarray(sm[..., c]), 'F').transform((sw, sh), Image.AFFINE, coeff, Image.BILINEAR))
              for c in range(sm.shape[2])]
        acc += np.stack(ch, -1) * wgt
        tot += wgt
    return resize(acc / tot, w, h, Image.BILINEAR)


def streak(h, w, p, ang, length, width, xg=None):
    """Analytic light streak through p at angle ang (radians): exp falloff along, gaussian across."""
    x, y = xg if xg is not None else grid(h, w)
    ux, uy = math.cos(ang), math.sin(ang)
    dx, dy = x - p[0], y - p[1]
    along = dx * ux + dy * uy
    perp = -dx * uy + dy * ux
    return np.exp(-np.abs(along) / length) * np.exp(-(perp * perp) / (2 * width * width))


def disc(h, w, p, r, soft, xg=None, ring=0.0):
    x, y = xg if xg is not None else grid(h, w)
    d = np.sqrt((x - p[0]) ** 2 + (y - p[1]) ** 2)
    m = 1 - smoothstep(r - soft, r + soft, d)
    if ring:
        m = m * (0.35 + 0.65 * smoothstep(r * (1 - ring), r, d))
    return m


def tonemap(a):
    """Per-channel soft shoulder above 0.72 so hot cores roll to white instead of clipping."""
    k = 0.72
    over = np.maximum(a - k, 0)
    return np.where(a < k, a, k + (1 - k) * (1 - np.exp(-over / (1 - k))))


def grade(a, seed=7, vignette=0.38, ca=0.5, grain=0.012, contrast=0.12):
    h, w = a.shape[:2]
    a = tonemap(a)
    l = lum(a)[..., None]
    shadows = np.clip(1 - l * 2, 0, 1)
    highs = np.clip(l * 2 - 1, 0, 1)
    a = a * (1 + shadows * col(-0.06, 0.01, 0.06) + highs * col(0.05, 0.01, -0.05))
    a = np.clip(a, 0, 1)
    a = a + contrast * (a - 0.5) * (1 - np.abs(2 * a - 1))  # gentle S-curve
    x, y = grid(h, w)
    r2 = ((x - w / 2) / (w / 2)) ** 2 + ((y - h / 2) / (h / 2)) ** 2
    a = a * (1 - vignette * np.clip(r2 * 0.55, 0, 1.2))[..., None]
    if ca:  # lateral chromatic aberration, stronger toward the corners
        sx = (x - w / 2) / (w / 2)
        sy = (y - h / 2) / (h / 2)
        r = remap(a[..., 0], x + sx * ca, y + sy * ca)
        b = remap(a[..., 2], x - sx * ca, y - sy * ca)
        a = np.stack([r, a[..., 1], b], -1)
    rng = np.random.default_rng(seed)
    a = a + rng.normal(0, grain, (h, w, 1)).astype(F32)
    return np.clip(a, 0, 1)
