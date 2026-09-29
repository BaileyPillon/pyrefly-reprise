"""Sin art options, 2026-09-29 (FFX only): the link-3 sketches (Sin's back, Genais, the Core), split out of sketch.py
for the 400-line house rule. Sources and conventions: see sketch.py's docstring (research/ffx-sin.md 9.1, 9.3; the
FF Wiki texts for "Sin (core)", "Sinspawn Genais" and "Sinspawn Geneaux": a shelled Sinspawn whose shell opens).
"""
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from sketch import P, W, H, SW, SH, layer, comp, lerp, scales, glow, claws, GREY_D, GREY_L


# ---- link 3: Sin's back ---------------------------------------------------------------------------------------------
def back_sketch():
    """Whole-mode init: on top of Sin's back at sunset, a rolling ground of huge dark scales to a spine ridge of stone
    spikes, the edge dropping to cloud far below on the left, the Fahrenheit small in the sky, open sky."""
    rng = np.random.default_rng(1400)
    yf = np.linspace(0, 1, SH)
    stops = [(0, (92, 96, 168)), (0.22, (200, 140, 150)), (0.42, (250, 170, 110)), (0.55, (255, 206, 140)), (1, (240, 190, 150))]
    col = np.stack([np.interp(yf, [s[0] for s in stops], [s[1][k] for s in stops]) for k in range(3)], axis=1)
    a = np.broadcast_to(col[:, None, :], (SH, SW, 3)).astype(float).copy()
    yy, xx = np.mgrid[0:SH, 0:SW]
    dd = np.hypot(xx - 0.12 * SW, yy - 0.50 * SH) / (0.5 * SW)
    a += (np.clip(1 - dd, 0, 1) ** 2)[..., None] * np.array((60, 40, 8), float)
    im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).convert('RGBA')
    c = layer(); d = ImageDraw.Draw(c)
    for _ in range(14):
        y = rng.uniform(0.08, 0.3); x = rng.uniform(-0.1, 1.1); w = rng.uniform(0.1, 0.3); h = rng.uniform(0.01, 0.028)
        d.ellipse([*P(x - w, y - h), *P(x + w, y + h)], fill=(240, 200, 196, 120))
    for _ in range(16):
        y = rng.uniform(0.58, 0.70); x = rng.uniform(-0.1, 0.5); w = rng.uniform(0.06, 0.18); h = w * 0.2
        d.ellipse([*P(x - w, y - h), *P(x + w, y + h)], fill=(255, 226, 196, 200))
    comp(im, c, 8)
    # the airship far off, a small dark shape in the sky at the upper left
    s = layer(); d = ImageDraw.Draw(s)
    d.polygon([P(0.14, 0.20), P(0.25, 0.185), P(0.28, 0.20), P(0.24, 0.215), P(0.15, 0.215)], fill=(60, 60, 74, 255))
    d.polygon([P(0.19, 0.19), P(0.23, 0.165), P(0.235, 0.19)], fill=(70, 70, 84, 255))
    comp(im, s, 0.6)
    # Sin's back: the ground rises from the lower left edge to a spine ridge running off to the upper right
    g = layer(); d = ImageDraw.Draw(g)
    ground = [(-0.02, 0.70), (0.20, 0.62), (0.45, 0.52), (0.70, 0.42), (0.90, 0.36), (1.02, 0.33), (1.02, 1.0), (-0.02, 1.0)]
    d.polygon([P(*p) for p in ground], fill=GREY_D + (255,))
    for r in range(9):                              # scale rows in perspective, bigger nearer
        t = r / 8
        y = 0.56 + 0.44 * t ** 1.3
        size = 0.02 + 0.07 * t
        x = -0.05 + (0.5 - y * 0.4) * 0.2
        while x < 1.05:
            yy_ = y - (1.02 - x) * 0.0 - max(0, 0.2 - x) * 0.0
            if yy_ > 0.72 - 0.38 * x:
                d.arc([*P(x - size, yy_ - size * 0.5), *P(x + size, yy_ + size * 0.5)], 200, 340, fill=lerp(GREY_D, GREY_L, 0.45) + (220,), width=6)
            x += size * 1.6
    for i in range(10):                             # the spine ridge of stone spikes
        u = i / 9
        x, y = 0.52 + 0.5 * u, 0.50 - 0.16 * u
        h = 0.10 * (1.2 - u * 0.6)
        d.polygon([P(x - 0.02 * (1.2 - u * 0.5), y + 0.02), P(x + 0.005, y - h), P(x + 0.02 * (1.2 - u * 0.5), y + 0.02)], fill=(46, 42, 54, 255))
    comp(im, g, 1.2)
    lit = layer(); d = ImageDraw.Draw(lit)            # warm light on the scale tops from the low sun at the left
    d.polygon([P(-0.02, 0.70), P(0.45, 0.52), P(0.30, 0.80), P(-0.02, 0.90)], fill=(255, 190, 130, 40))
    comp(im, lit, 60)
    out = im.convert('RGB').resize((W, H), Image.LANCZOS)
    arr = np.asarray(out, float) + np.random.default_rng(7).normal(0, 3.0, (H, W, 3))
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))


def genais(base, opt, shelled=False, k=1.35):
    """Genais in the middle of the back, the Core behind it, higher up the back and out of reach. v2: Genais drawn
    k times larger about its feet (pass 2 read as a small animal), with a dark fanged maw and red eyes."""
    G = lambda x, y: P(0.68 + (x - 0.68) * k, 0.70 + (y - 0.70) * k)
    rng = np.random.default_rng(1500 + (opt == 'b') * 5)
    lay = layer(); d = ImageDraw.Draw(lay)
    polys = []
    if opt == 'a':
        # the Core: a great round pearl set in a crater of scales on a raised hump, veins of light into the scales
        core = (0.80, 0.265)
        hump = [(0.66, 0.42), (0.72, 0.30), (0.80, 0.24), (0.89, 0.27), (0.95, 0.38)]
        d.polygon([P(*p) for p in hump], fill=GREY_D + (255,))
        d.ellipse([*P(core[0] - 0.05, core[1] - 0.06), *P(core[0] + 0.05, core[1] + 0.06)], fill=(46, 40, 56, 255))
        polys.append(hump)
        # Genais: a hunched beast under a massive ridged dome shell, open at the front, the body leaning out
        shell = [(0.52, 0.66), (0.54, 0.54), (0.60, 0.45), (0.68, 0.42), (0.76, 0.45), (0.82, 0.53), (0.84, 0.66)]
        d.polygon([G(*p) for p in shell], fill=(92, 86, 96, 255))
        for i in range(7):
            u = (i + 0.5) / 7
            x = 0.53 + 0.30 * u
            d.line([G(x, 0.66), G(0.68 + (x - 0.68) * 0.4, 0.43)], fill=(60, 56, 66, 255), width=8)
        if not shelled:
            body = [(0.55, 0.66), (0.52, 0.58), (0.54, 0.52), (0.60, 0.50), (0.64, 0.56), (0.66, 0.66)]
            d.polygon([G(*p) for p in body], fill=(118, 96, 128, 255))
            d.ellipse([*G(0.53, 0.53), *G(0.545, 0.545)], fill=(220, 40, 30, 255))
            d.ellipse([*G(0.565, 0.525), *G(0.58, 0.54)], fill=(220, 40, 30, 255))
            d.polygon([G(0.515, 0.57), G(0.60, 0.565), G(0.575, 0.62), G(0.53, 0.61)], fill=(40, 10, 24, 255))
            claws(d, [(0.56, 0.66, 170, 0.04), (0.64, 0.665, 10, 0.04)])
            polys.append(body)
        else:
            d.polygon([G(0.53, 0.66), G(0.56, 0.58), G(0.62, 0.55), G(0.66, 0.66)], fill=(86, 80, 90, 255))
        polys.append(shell)
    else:
        core = (0.84, 0.18)
        stalk = [(0.80, 0.46), (0.82, 0.30), (0.83, 0.22), (0.85, 0.22), (0.86, 0.30), (0.88, 0.46)]
        d.polygon([P(*p) for p in stalk], fill=(78, 64, 86, 255))
        d.ellipse([*P(core[0] - 0.035, core[1] - 0.05), *P(core[0] + 0.035, core[1] + 0.05)], fill=(60, 48, 72, 255))
        polys.append(stalk)
        # Genais: a great spiral shell like a conch, its wide mouth facing the party, a tentacled body leaning out
        shell = [(0.60, 0.68), (0.57, 0.56), (0.60, 0.46), (0.68, 0.40), (0.77, 0.42), (0.83, 0.50), (0.82, 0.62), (0.76, 0.68)]
        d.polygon([G(*p) for p in shell], fill=(118, 108, 112, 255))
        for j in range(4):
            r = 0.09 - 0.02 * j
            d.arc([*G(0.72 - r, 0.53 - r * 1.3), *G(0.72 + r, 0.53 + r * 1.3)], 200, 520 - 360, fill=(110, 100, 104, 255), width=6)
        if not shelled:
            body = [(0.60, 0.68), (0.54, 0.62), (0.53, 0.54), (0.57, 0.50), (0.62, 0.54), (0.64, 0.66)]
            d.polygon([G(*p) for p in body], fill=(120, 100, 132, 255))
            for i in range(6):
                a = math.radians(200 + i * 22)
                d.line([G(0.575, 0.53), G(0.575 + 0.06 * math.cos(a), 0.53 + 0.09 * math.sin(a))], fill=(128, 104, 140, 255), width=10)
            d.ellipse([*G(0.56, 0.555), *G(0.575, 0.57)], fill=(220, 40, 30, 255))
            polys.append(body)
        else:
            d.polygon([G(0.57, 0.66), G(0.56, 0.56), G(0.62, 0.52), G(0.64, 0.66)], fill=(100, 92, 96, 255))
        polys.append(shell)
    comp(base, lay, 0.8)
    glow(base, core, 0.018, strength=0.55)
    return polys, core
