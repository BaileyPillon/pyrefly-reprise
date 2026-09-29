"""Sin art options, 2026-09-29 (FFX only): the img2img inits for the link-4 backdrop options.

Bailey's approved Evrae plate (public/art/backdrops/evrae-airship-deck.png, our own painting, D-020) keeps its layout
(the hull on the diagonal, the rail across the bottom that the engine hides behind its own deck, the cloud to the left)
so the ship reads the same in both chapters. The init is that plate, graded towards dusk, with our code-drawn Bevelle
laid into the cloud at the lower left, where the engine shows sky past its rail: a white tiered city, blue roofs,
spires, and one tall white tower with gold bands (research/ffx-sin.md 9.1: Sin props itself on a tower in Bevelle;
the tower here is the same kind as the head plate's, not a claim about which tower).

  python bk_init.py <evrae.png> <out_dir>   -> bk-a-init.png, bk-b-init.png (1344x768)
"""
import os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

W, H, S = 1344, 768, 2


def grade(a, stops):
    yf = np.linspace(0, 1, a.shape[0])
    g = np.stack([np.interp(yf, [s[0] for s in stops], [s[1][k] for s in stops]) for k in range(3)], axis=1)[:, None, :]
    lum = a.mean(axis=2, keepdims=True)
    tinted = lum / 255 * g * 1.15 + a * 0.25
    return np.clip(tinted, 0, 255)


def city(im, rng, lit, shade, roof, haze, lights=None):
    lay = Image.new('RGBA', (W * S, H * S), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    P = lambda x, y: (x * W * S, y * H * S)
    region_top = lambda x: 0.60 + 0.10 * x          # the city's far edge, sloping with the cloud bank
    d.polygon([P(-0.01, 0.60), P(0.40, 0.64), P(0.40, 0.90), P(-0.01, 0.92)], fill=haze + (255,))
    for r in range(16):
        t = r / 15
        s = 0.3 + 1.2 * t ** 1.3
        x = -0.01
        while x < 0.40 - 0.02 * t:
            y = region_top(x) + 0.004 + 0.26 * t ** 1.5
            w = rng.uniform(0.006, 0.016) * s; h = rng.uniform(0.004, 0.011) * s
            c = tuple(int(shade[i] + (lit[i] - shade[i]) * rng.uniform(0.5, 1.0)) for i in range(3))
            d.rectangle([*P(x, y - h), *P(x + w, y + 0.003 * s)], fill=c + (255,))
            d.rectangle([*P(x + w * 0.15, y - h * 0.95), *P(x + w * 0.85, y - h * 0.35)], fill=roof + (255,))
            if lights and rng.uniform() < 0.35:
                d.rectangle([*P(x + w * 0.3, y - h * 0.3), *P(x + w * 0.45, y - h * 0.1)], fill=lights + (255,))
            if rng.uniform() < 0.08:
                sx = x + w * 0.5
                d.polygon([P(sx - 0.002 * s, y - h), P(sx, y - h - rng.uniform(0.015, 0.04) * s), P(sx + 0.002 * s, y - h)], fill=lit + (255,))
            x += w + rng.uniform(0.001, 0.004) * s
    # one tall white tower with gold bands
    x, top, bot = 0.24, 0.40, 0.80
    for i in range(24):
        t0, t1 = i / 24, (i + 1) / 24
        y0, y1 = bot + (top - bot) * t0, bot + (top - bot) * t1
        w0, w1 = 0.012 * (1.4 - 0.4 * t0), 0.012 * (1.4 - 0.4 * t1)
        d.polygon([P(x - w0, y0), P(x + w0, y0), P(x + w1, y1), P(x - w1, y1)], fill=lit + (255,))
        d.polygon([P(x + w0 * 0.3, y0), P(x + w0, y0), P(x + w1, y1), P(x + w1 * 0.3, y1)], fill=shade + (255,))
        if i % 4 == 2:
            d.rectangle([*P(x - w0 * 1.15, y0 - 0.004), *P(x + w0 * 1.15, y0)], fill=(216, 174, 72, 255))
    d.ellipse([*P(x - 0.012, top - 0.008), *P(x + 0.012, top + 0.008)], fill=(216, 174, 72, 255))
    lay = lay.filter(ImageFilter.GaussianBlur(1.2)).resize((W, H), Image.LANCZOS)
    # feather the city into the cloud: soft edges all round, fading out towards its far (upper) edge and the right
    fm = Image.new('L', (W, H), 0)
    ImageDraw.Draw(fm).polygon([(0, 0.66 * H), (0.33 * W, 0.69 * H), (0.36 * W, 0.86 * H), (0, 0.88 * H)], fill=255)
    fm = np.asarray(fm.filter(ImageFilter.GaussianBlur(28)), float) / 255
    tw = np.zeros((H, W)); tw[:, int(0.235 * W):int(0.25 * W)] = 1           # the tower keeps its full height
    tw[:int(0.39 * H)] = 0; tw[int(0.80 * H):] = 0
    tw = np.asarray(Image.fromarray((tw * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(3)), float) / 255
    a = np.asarray(lay.split()[3], float) / 255 * np.maximum(fm * 0.9, tw)
    lay.putalpha(Image.fromarray((a * 255).astype(np.uint8)))
    im.alpha_composite(lay)


def main(src, out):
    os.makedirs(out, exist_ok=True)
    base = np.asarray(Image.open(src).convert('RGB').resize((W, H), Image.LANCZOS), float)
    A = grade(base, [(0, (150, 116, 170)), (0.35, (250, 170, 130)), (0.6, (255, 196, 150)), (1, (240, 170, 140))])
    B = grade(base, [(0, (60, 62, 130)), (0.35, (150, 110, 160)), (0.6, (210, 140, 150)), (1, (150, 110, 140))]) * 0.85
    for name, arr, lit, shade, roof, haze, lights in (
            ('bk-a', A, (250, 238, 222), (176, 150, 150), (84, 104, 160), (236, 196, 170), None),
            ('bk-b', B, (206, 196, 210), (120, 108, 136), (60, 72, 120), (150, 120, 150), (255, 206, 120))):
        im = Image.fromarray(arr.astype(np.uint8)).convert('RGBA')
        city(im, np.random.default_rng(29), lit, shade, roof, haze, lights)
        im.convert('RGB').save(f'{out}/{name}-init.png')
        print('wrote', name)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
