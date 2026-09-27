"""The shared stage: backdrop, figures with rim light and colour-matched shadows, wet floor,
god rays, mako motes, bloom. FF7 only. Party on the LEFT facing right, Guard Scorpion on the
RIGHT facing left (the installed painting flipped: the machine is bilaterally symmetric)."""
import math
import numpy as np
from PIL import Image
from fxlib import (F32, load_rgba, resize, blur, remap, grid, noise2, smoothstep, lum, col,
                   zoom_blur, disc)

ART = 'D:/Tools/pyrefly-art-backup/candidates'
REPO = 'D:/Final Fantasy'
CORE_BG = f'{ART}/2026-09-27-ff7/reactor-core/core.1.png'
GS_IDLE = f'{REPO}/public/art/characters/ff7-guard-scorpion/idle.png'
GS_UP = f'{REPO}/public/art/characters/ff7-guard-scorpion-tail-up/idle.png'
MAKO = col(0.35, 1.0, 0.62)
AMBER = col(1.0, 0.72, 0.38)


def backdrop(W, H, s, ox, oy):
    src = load_rgba(CORE_BG)[..., :3]
    sw, sh = int(src.shape[1] * s), int(src.shape[0] * s)
    big = resize(src, sw, sh)
    out = np.zeros((H, W, 3), F32)
    ys = np.arange(H) - oy
    ys = np.where(ys >= sh, 2 * (sh - 1) - ys, ys)  # mirror-fill below the painting
    xs = np.clip(np.arange(W) - ox, 0, sw - 1)
    out[:] = big[np.clip(ys, 0, sh - 1)][:, xs]
    return out


def heat_shimmer(img, cx, cy, rx, ry, amp, seed):
    h, w = img.shape[:2]
    x, y = grid(h, w)
    m = np.exp(-(((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2))
    n = noise2(h, w, 40, seed, 2)
    dx = amp * m * np.sin(y / 5.5 + n * 9.0)
    dy = amp * 0.5 * m * np.cos(x / 7.0 + n * 7.0)
    return remap(img, x + dx, y + dy)


def depth_of_field(img, y_f, strength=2.4):
    far = blur(img, strength)
    h, w = img.shape[:2]
    y = np.arange(h, dtype=F32)[:, None]
    m = np.clip((y_f - 40 - y) / 260, 0, 1) * 0.85
    return img * (1 - m[..., None]) + far * m[..., None]


def wet_floor(img, y_f, seed, strength=0.55):
    """Reflect everything above y_f onto the floor below it, rippled and faded, in puddles."""
    h, w = img.shape[:2]
    x, y = grid(h, w)
    d = np.maximum(y - y_f, 0)
    ripple = 2.2 * np.sin(y * 0.9 + noise2(h, w, 30, seed, 2) * 6) * (d > 0)
    src_y = y_f - d * 1.05
    refl = remap(img, x + ripple, src_y)
    refl = blur(refl, 1.6)
    puddle = smoothstep(0.38, 0.62, noise2(h, w, 160, seed + 1, 3))
    k = strength * np.exp(-d / 150) * (0.35 + 0.65 * puddle) * (y > y_f)
    return img * (1 - 0.35 * k[..., None]) + refl * k[..., None]


class Fig:
    """A cut-out figure, premultiplied RGBA, anchored at its feet (bottom-centre)."""

    def __init__(self, rgba, height=None, width=None, flip=False, rotate=0.0):
        a = rgba
        ys, xs = np.nonzero(a[..., 3] > 0.04)
        a = a[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
        if flip:
            a = a[:, ::-1]
        pm = np.concatenate([a[..., :3] * a[..., 3:4], a[..., 3:4]], -1)
        k = height / pm.shape[0] if height else width / pm.shape[1]
        pm = resize(pm, pm.shape[1] * k, pm.shape[0] * k)
        if rotate:
            ch = [np.asarray(Image.fromarray(np.ascontiguousarray(pm[..., c]), 'F').rotate(rotate, Image.BICUBIC, expand=True))
                  for c in range(4)]
            pm = np.stack(ch, -1)
        self.pm = np.clip(pm, 0, None)
        self.scale = k

    @property
    def h(self):
        return self.pm.shape[0]

    @property
    def w(self):
        return self.pm.shape[1]

    def light(self, light_x, rim=MAKO, rim_k=1.25, top=AMBER, top_k=0.35, dark=0.62, facing=+1, rim_px=5):
        """Colour-matched shading: darker, teal-tinted on the side away from the core; rim on the side
        toward it (facing=+1 means the light is to the figure's screen-right)."""
        pm = self.pm
        a = pm[..., 3]
        h, w = a.shape
        xs = np.linspace(0, 1, w, dtype=F32)[None, :]
        side = xs if facing > 0 else 1 - xs
        shade = dark + (1 - dark) * smoothstep(0.0, 1.0, side)
        tint = col(0.78, 0.93, 1.0)
        l = lum(pm[..., :3] / np.maximum(a[..., None], 1e-4))
        mix = np.clip(l * 1.4, 0, 1)[..., None]
        rgb = pm[..., :3] * shade[..., None] * (tint * (1 - mix) + mix * col(1.0, 0.98, 0.95))
        sx = rim_px * facing
        shifted = np.zeros_like(a)
        if sx > 0:
            shifted[:, :-sx] = a[:, sx:]
        else:
            shifted[:, -sx:] = a[:, :sx]
        edge = np.clip(a - shifted, 0, 1)
        edge = blur(edge, 1.4) * a
        rgb = rgb + edge[..., None] * rim * rim_k
        up = np.zeros_like(a)
        up[4:] = a[:-4]
        tedge = blur(np.clip(a - up, 0, 1), 1.2) * a
        rgb = rgb + tedge[..., None] * top * top_k
        self.pm = np.concatenate([rgb, a[..., None]], -1)
        return self

    def tint_add(self, color, k):
        self.pm[..., :3] += self.pm[..., 3:4] * color * k
        return self


def layer_of(fig, W, H, fx, fy):
    """Place fig with its feet at (fx, fy) on a full-frame premultiplied layer."""
    out = np.zeros((H, W, 4), F32)
    x0, y0 = int(round(fx - fig.w / 2)), int(round(fy - fig.h))
    sx0, sy0 = max(0, -x0), max(0, -y0)
    dx0, dy0 = max(0, x0), max(0, y0)
    dx1, dy1 = min(W, x0 + fig.w), min(H, y0 + fig.h)
    if dx1 > dx0 and dy1 > dy0:
        out[dy0:dy1, dx0:dx1] = fig.pm[sy0:sy0 + dy1 - dy0, sx0:sx0 + dx1 - dx0]
    return out


def over(dst, lay, k=1.0):
    return dst * (1 - lay[..., 3:4] * k) + lay[..., :3] * k


def shadows(img, lay, fx, fy, fw, away, tint=col(0.02, 0.06, 0.07), k=0.75):
    """Contact shadow (soft ellipse at the feet) + a long cast shadow away from the core."""
    h, w = img.shape[:2]
    x, y = grid(h, w)
    contact = np.exp(-(((x - fx) / (fw * 0.55)) ** 2 + ((y - fy - 2) / 9) ** 2))
    a = lay[..., 3]
    ys = np.nonzero(a.max(1) > 0.05)[0]
    top = ys.min() if len(ys) else fy - 100
    # squash the silhouette onto the floor and shear it away from the light
    sq = 0.16
    d = y - fy
    src_y = fy - d / sq
    src_x = x - away * d * 2.2
    cast = remap(a, src_x, src_y) * (d >= -2) * (src_y >= top)
    cast = blur(cast, 3.5) * 0.55
    m = np.clip(np.maximum(contact * 0.85, cast), 0, 1) * k
    return img * (1 - m[..., None]) + tint * m[..., None]


def reflection(img, lay, fy, k=0.32, seed=3):
    """Mirror a figure layer about its feet line into the wet floor."""
    h, w = img.shape[:2]
    x, y = grid(h, w)
    d = y - fy
    rip = 1.8 * np.sin(y * 1.1 + noise2(h, w, 25, seed, 1) * 5)
    src = remap(lay, x + rip, fy - d)
    fade = np.exp(-np.maximum(d, 0) / 70) * (d > 0) * k
    src = blur(src, 1.3)
    return img * (1 - src[..., 3:4] * fade[..., None]) + src[..., :3] * fade[..., None]


def god_rays(img, occ, cx, cy, thr=0.5, k=0.9, strength=0.75, tint=col(0.8, 1.0, 0.85)):
    l = lum(img)
    bright = img * np.clip((l - thr) / (1 - thr), 0, 1)[..., None]
    bright = bright * (1 - np.clip(occ, 0, 1))[..., None]
    rays = zoom_blur(bright, cx, cy, strength=strength, n=30, ds=2)
    return img + rays * k * tint


def motes(h, w, cx, cy, seed, n_small=320, n_bokeh=16, color=MAKO, k=1.0, spread=(420, 260), ybounds=(60, 640)):
    rng = np.random.default_rng(seed)
    lay = np.zeros((h, w), F32)
    xs = rng.normal(cx, spread[0], n_small)
    ys = rng.uniform(ybounds[0], ybounds[1], n_small)
    vals = rng.uniform(0.3, 1.0, n_small) ** 2 * 9
    ok = (xs >= 0) & (xs < w) & (ys >= 0) & (ys < h)
    np.add.at(lay, (ys[ok].astype(int), xs[ok].astype(int)), vals[ok])
    small = blur(lay, 1.1) + blur(lay, 4.5) * 0.35
    xg = grid(h, w)
    bok = np.zeros((h, w), F32)
    for i in range(n_bokeh):
        px, py = rng.uniform(0, w), rng.uniform(ybounds[0], ybounds[1] + 60)
        r = rng.uniform(7, 26)
        bok += disc(h, w, (px, py), r, 1.6, xg, ring=0.25) * rng.uniform(0.08, 0.22)
    out = (small * k)[..., None] * color + (bok * k)[..., None] * (color * 0.7 + 0.3)
    return out


def ray_fan(h, w, cx, cy, occ, seed, k=0.2, color=MAKO, r0=90, R=650, n=46):
    """Volumetric shafts from the core: narrow angular lobes, shadowed by every figure."""
    rng = np.random.default_rng(seed)
    x, y = grid(h, w)
    th = np.arctan2(y - cy, x - cx)
    r = np.hypot(x - cx, y - cy)
    pat = np.zeros((h, w), F32)
    for _ in range(n):
        t0, wd, a = rng.uniform(-math.pi, math.pi), rng.uniform(0.012, 0.06), rng.uniform(0.3, 1.0)
        d = np.angle(np.exp(1j * (th - t0))).astype(F32)
        pat += a * np.exp(-(d / wd) ** 2)
    rad = smoothstep(r0, r0 + 120, r) * np.exp(-r / R)
    shadow = zoom_blur(np.clip(occ, 0, 1)[..., None], cx, cy, strength=1.6, n=26, ds=2)[..., 0]
    m = pat * rad * (1 - 0.85 * np.clip(shadow * 2.2, 0, 1))
    return (blur(m, 1.5) * k)[..., None] * color


def bloom(img, thr=0.62, k=(0.55, 0.45, 0.35)):
    b = np.maximum(img - thr, 0)
    return img + blur(b, 5) * k[0] + blur(b, 16) * k[1] + blur(b, 48) * k[2]


def core_glow(h, w, cx, cy0, cy1, width, k=0.5, color=MAKO):
    """Extra volumetric haze hugging the mako column."""
    x, y = grid(h, w)
    inside = smoothstep(cy0 - 60, cy0 + 40, y) * (1 - smoothstep(cy1 - 10, cy1 + 70, y))
    m = np.exp(-((x - cx) / width) ** 2) * inside
    return (blur(m, 18) * k)[..., None] * color
