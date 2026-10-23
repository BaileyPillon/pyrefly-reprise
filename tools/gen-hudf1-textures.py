"""
Bakes the F1 "Brushed slab" finish into small raster textures (original procedural UI art; committed in the repo, not public/art):

  edge masks (alpha, white): the dry-brush end/edge of a slab, cut from the mockup's own filter recipe (blurred alpha + stretched fractal noise, thresholded)
  paper-dark (RGB multiplier): paper tooth + bristle streaks + pigment mottle for the ivory and gold slabs   (mix-blend: multiply)
  ink-light  (RGB, black ground): the same for the ink plates                                                (mix-blend: screen)

Reference recipe: D:/Tools/pyrefly-scratch/2026-10-23/hud-inkgold/src/hud.html (ragFilter, noiseURL and the --g-* textures).
usage: python -I gen_f1_textures.py <outdir>
"""
import sys, os, io
import numpy as np
from PIL import Image

OUT = sys.argv[1] if len(sys.argv) > 1 else '.'
os.makedirs(OUT, exist_ok=True)


# ---------------------------------------------------------------- noise: tileable gradient (Perlin) noise, anisotropic, fractal
def _grad(rng, nx, ny):
    a = rng.uniform(0, 2 * np.pi, (ny, nx))
    return np.cos(a), np.sin(a)


def perlin(h, w, cells_x, cells_y, rng, tile=True):
    """Gradient noise in [-1, 1] over an h x w image with cells_x x cells_y lattice cells (periodic when tile)."""
    gx, gy = _grad(rng, cells_x + 1, cells_y + 1)
    if tile:
        gx[:, -1] = gx[:, 0]; gy[:, -1] = gy[:, 0]
        gx[-1, :] = gx[0, :]; gy[-1, :] = gy[0, :]
    xs = (np.arange(w) + 0.5) / w * cells_x
    ys = (np.arange(h) + 0.5) / h * cells_y
    x0 = np.floor(xs).astype(int); y0 = np.floor(ys).astype(int)
    fx = (xs - x0)[None, :]; fy = (ys - y0)[:, None]
    x1 = x0 + 1; y1 = y0 + 1
    def dot(ix, iy, dx, dy):
        return gx[iy[:, None], ix[None, :]] * dx + gy[iy[:, None], ix[None, :]] * dy
    n00 = dot(x0, y0, fx, fy)
    n10 = dot(x1, y0, fx - 1, fy)
    n01 = dot(x0, y1, fx, fy - 1)
    n11 = dot(x1, y1, fx - 1, fy - 1)
    u = fx * fx * fx * (fx * (fx * 6 - 15) + 10)
    v = fy * fy * fy * (fy * (fy * 6 - 15) + 10)
    nx0 = n00 * (1 - u) + n10 * u
    nx1 = n01 * (1 - u) + n11 * u
    return (nx0 * (1 - v) + nx1 * v) * 1.4142


def fractal(h, w, cells_x, cells_y, octaves, rng, tile=True, spread=0.85):
    """feTurbulence 'fractalNoise' look: sum of octaves, mapped to [0, 1] around 0.5."""
    total = np.zeros((h, w)); amp = 1.0; norm = 0.0
    for o in range(octaves):
        total += amp * perlin(h, w, max(1, cells_x * 2 ** o), max(1, cells_y * 2 ** o), rng, tile)
        norm += amp; amp *= 0.5
    return np.clip(0.5 + 0.5 * total / norm * spread, 0, 1)


def gauss1d(sigma):
    r = max(1, int(sigma * 3))
    x = np.arange(-r, r + 1)
    k = np.exp(-x * x / (2 * sigma * sigma))
    return k / k.sum()


def blur(a, sx, sy):
    out = a
    if sx > 0:
        k = gauss1d(sx); out = np.apply_along_axis(lambda r: np.convolve(np.pad(r, len(k) // 2, mode='edge'), k, mode='valid'), 1, out)
    if sy > 0:
        k = gauss1d(sy); out = np.apply_along_axis(lambda c: np.convolve(np.pad(c, len(k) // 2, mode='edge'), k, mode='valid'), 0, out)
    return out


# ---------------------------------------------------------------- the dry-brush edge: the mockup's ragFilter on a plain box
def rag_mask(w, h, seed, bx=8, by=2, fx=0.0045, fy=0.2, wn=0.9, th=10, gain=2.2, pad=24):
    """alpha of a w x h box after the mockup's filter. The image is (w + 2 pad) x (h + 2 pad)."""
    W, H = w + 2 * pad, h + 2 * pad
    box = np.zeros((H, W)); box[pad:pad + h, pad:pad + w] = 1.0
    a = blur(box, bx, by)
    rng = np.random.default_rng(seed)
    # baseFrequency fx, fy in cycles per px -> lattice cells across the image (not tiled)
    n0 = fractal(H, W, max(1, int(round(fx * W))) if fx * W >= 1 else 1, max(1, int(round(fy * H))), 3, rng, tile=False, spread=1.6)
    n1 = np.clip(gain * (n0 - 0.5) + 0.5, 0, 1)
    y = a + wn * n1 - wn / 2
    return np.clip(th * y - (th * 0.5 - 0.5), 0, 1)


def save_alpha(a, path, q=90):
    """The mask as an LA PNG (white, alpha = the mask). PNG, not WebP: a lossless WebP with an alpha channel drew with its first and last rows transparent in Chromium (measured), and the build's art
    rule is that a WebP ships only where every decoder draws it the same."""
    h, w = a.shape
    la = np.zeros((h, w, 2), np.uint8)
    la[..., 0] = 255
    la[..., 1] = np.round(np.clip(a, 0, 1) * 255).astype(np.uint8)
    path = os.path.splitext(path)[0] + '.png'
    Image.fromarray(la, 'LA').save(path, 'PNG', optimize=True)
    return os.path.getsize(path)


# ---------------------------------------------------------------- the paint textures (tileable)
def layer_alpha(n, k, off, op):
    return np.clip(k * n - off, 0, 1) * op


def over(img, color, alpha):
    c = np.array(color, float)[None, None, :]
    return img * (1 - alpha[..., None]) + c * alpha[..., None]


def paper_dark(w=512, h=256, seed=5):
    rng = np.random.default_rng(seed)
    img = np.ones((h, w, 3))
    # grain: iso, fine (bf 0.9 -> a cell every ~1.1 px: use 1 px lattice)
    g = fractal(h, w, w // 2, h // 2, 2, rng)
    img = over(img, (0.35, 0.28, 0.14), layer_alpha(g, 2.0, 0.97, 0.38))
    # streaks: bf 0.004 x 0.24 -> long in x (period 250 px), fine in y (period 4 px)
    s = fractal(h, w, max(1, round(w * 0.004)), max(1, round(h * 0.24)), 3, rng)
    img = over(img, (0.42, 0.33, 0.16), layer_alpha(s, 2.0, 0.98, 0.17))
    # mottle: bf 0.0075 oct3 (pigment blotches)
    m = fractal(h, w, max(1, round(w * 0.0075)), max(1, round(h * 0.0075)), 3, rng)
    img = over(img, (0.55, 0.45, 0.25), layer_alpha(m, 2.0, 0.86, 0.32))
    return np.clip(img, 0, 1)


def ink_light(w=512, h=256, seed=9):
    rng = np.random.default_rng(seed)
    img = np.zeros((h, w, 3))
    g = fractal(h, w, w // 2, h // 2, 2, rng)
    img = over(img, (0.85, 0.90, 1.0), layer_alpha(g, 1.8, 0.92, 0.28))
    s = fractal(h, w, max(1, round(w * 0.004)), max(1, round(h * 0.24)), 3, rng)
    img = over(img, (0.62, 0.70, 1.0), layer_alpha(s, 2.0, 1.0, 0.16))
    m = fractal(h, w, max(1, round(w * 0.0075)), max(1, round(h * 0.0075)), 3, rng)
    img = over(img, (0.40, 0.50, 0.95), layer_alpha(m, 2.0, 0.92, 0.30))
    return np.clip(img, 0, 1)


def save_rgb(img, path, q):
    Image.fromarray(np.round(img * 255).astype(np.uint8), 'RGB').save(path, 'WEBP', quality=q, method=6)
    return os.path.getsize(path)


if __name__ == '__main__':
    sizes = {}
    # edge caps: 4x authored px. tall slabs (cards, ribbon, verbs: 88..112 px) and short ones (cue, prompts, tail: 60..66 px)
    CAP = 120
    for cls, hh in (('m', 100), ('s', 64)):
        full_w = 2 * CAP + 160
        for variant, seed in (('a', 11), ('b', 37)):
            if cls == 's' and variant == 'b':
                continue
            mk = rag_mask(full_w, hh, seed + (0 if cls == 'm' else 5), pad=12)
            mk = mk[12:12 + hh, :]   # the box's own rows (the pad above and below only held the blur)
            left = mk[:, :CAP + 12]
            right = mk[:, -(CAP + 12):]
            sizes[f'edge-{cls}-l{variant}.png'] = save_alpha(left, os.path.join(OUT, f'edge-{cls}-l{variant}.png'))
            sizes[f'edge-{cls}-r{variant}.png'] = save_alpha(right, os.path.join(OUT, f'edge-{cls}-r{variant}.png'))
            if variant == 'a':
                mid = mk[:, CAP + 12:CAP + 12 + 160]
                sizes[f'edge-{cls}-mid.png'] = save_alpha(mid, os.path.join(OUT, f'edge-{cls}-mid.png'))
    # the CALM variant of the same caps (HUD_F1_TUNE.edgeCalm): the same recipe with a weaker bristle term and a tighter blur, so the end of a row is eaten a few px, not a finger deep
    for cls, hh in (('m', 100), ('s', 64)):
        full_w = 2 * CAP + 160
        mk = rag_mask(full_w, hh, 91 + (0 if cls == 'm' else 5), bx=5, by=1.6, wn=0.5, th=12, pad=12)[12:12 + hh, :]
        sizes[f'edge-{cls}-lc.png'] = save_alpha(mk[:, :CAP + 12], os.path.join(OUT, f'edge-{cls}-lc.png'))
        sizes[f'edge-{cls}-rc.png'] = save_alpha(mk[:, -(CAP + 12):], os.path.join(OUT, f'edge-{cls}-rc.png'))
        if cls == 'm':
            sizes['edge-mid-c.png'] = save_alpha(mk[:, CAP + 12:CAP + 12 + 160], os.path.join(OUT, 'edge-mid-c.png'))
    # the stripe on a card (10 x 112 at 4x): the strokes run along its length
    st = rag_mask(14, 128, 71, bx=1.6, by=8, fx=0.2, fy=0.004, wn=0.85, pad=6)[6 + 8:6 + 8 + 112, 6 + 2:6 + 2 + 10]
    sizes['edge-stripe.png'] = save_alpha(st, os.path.join(OUT, 'edge-stripe.png'))
    # the painted mat round a face tile (the mockup's ragT: a square with a small ragged edge, 96 x 96 at 4x)
    mt = rag_mask(96, 96, 83, bx=2.4, by=2.4, fx=0.05, fy=0.05, wn=0.7, th=9, gain=2.0, pad=10)[10:10 + 96, 10:10 + 96]
    sizes['edge-mat.png'] = save_alpha(mt, os.path.join(OUT, 'edge-mat.png'))
    sizes['paper-dark.webp'] = save_rgb(paper_dark(), os.path.join(OUT, 'paper-dark.webp'), 72)
    sizes['ink-light.webp'] = save_rgb(ink_light(), os.path.join(OUT, 'ink-light.webp'), 72)
    tot = sum(sizes.values())
    for k, v in sorted(sizes.items()):
        print(f'{k:24s} {v:7d} B')
    print('total', tot, 'B')
