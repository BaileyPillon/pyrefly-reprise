"""Sin art options, 2026-09-29 (FFX only): step 2 of a link-4 backdrop. Step 1 relit our own Evrae plate to dusk at a
low denoise so the hull, the rail and the clouds keep their places (the ship reads the same). SDXL then drops a small
far city, so step 2 paints Bevelle into the cloud at the lower left only: our code-drawn city (bk_init.city) pasted
into the relit picture, repainted by the z-image engine inside that region's feathered mask.

  python bk_city.py <relit-stem> <out_dir> <name> [night] [v2 | v3]
      reads <relit-stem>.base.png; writes <name>-comp.png, <name>-mask.png, <name>-mask-full.png

Method check before the third try (rule 15; two tries failed on the same fault, "the city stands level with the ship"):
  - v1 (pass 6, bk-*-4) painted a palace-sized city beside the hull. v2 (pass 8, bk-*-5) only shrank the MASK. It
    failed for two reasons in the method, not in the seed:
      1. the relit base (bk-*-3) already carries step 1's full-size code-drawn city (a white slab and a tall column,
         from bk_init.main's init); the column top and the slab's upper edge lie outside the v2 mask, so they survive;
      2. v2 still pasted the full-size bk_init.city into the comp, so the engine was shown the big city again.
  - v3 therefore (a) masks the WHOLE old footprint (the v1 region and tower, with a margin) minus the hull, found as
    the base's dark pixels so the ship is never repainted; (b) fills that footprint in the comp with the surrounding
    sky and cloud (a blur diffusion from the edges); (c) draws only a tiny city in a thin low band with one small
    tower, hazed towards the cloud colour, so the init already has the scale the prompt asks for.
  - If v3 fails on scale again, stop: show the best of bk-*-4 with the fault disclosed and ask Bailey.
  - v3 (pass 9, bk-*-6/7) fixed the scale but put the city where the GAME FRAME never shows it: compose_bk (the
    Chapter VIII layout) rolls the painting 11.6 degrees, crops its middle 1/1.42 and hides everything under the rail,
    so the frame sees only painting x > ~0.15 and above a line from (0.16, 0.69) to (0.44, 0.59). Checked by
    composing bk-a-6 through compose_bk: no city in the frame at all.
  - v4 draws the tiny city in FRAME coordinates (a level skyline just above the rail, frame x 0 to 0.34, one small
    tower), rotates it into the painting, and masks that band plus the old footprint. Check the frame with compose_bk
    BEFORE and after rendering; if v4 fails, stop and show bk-*-4 with its fault disclosed.
  - v4 (pass 10, bk-*-8, denoise 0.50), judged in the frame: A PASSES (a row of blue domes and one banded tower just
    above the rail, about a third of bk-a-4's tower; faults: an odd small crown on the tower, a dark haze bank behind
    the city). B FAILS (one big near dome, the tower a stubby column with its top cut off): B stopped here, bk-b-4 kept.
"""
import os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bk_init

W, H = 1344, 768
FULL = (2352, 1344)
REGION = [(0, 0.60), (0.36, 0.64), (0.40, 0.90), (0, 0.93)]          # normalised, the cloud bank left of the hull
REGION2 = [(0, 0.70), (0.30, 0.72), (0.33, 0.90), (0, 0.92)]         # v2: lower and smaller (v1 painted it level with the ship)
TOWER = (0.225, 0.26, 0.38, 0.82)                                    # x0, x1, top, bottom
TOWER2 = (0.20, 0.225, 0.56, 0.86)
FOOT = [(0, 0.56), (0.39, 0.60), (0.43, 0.93), (0, 0.96)]            # v3: the whole old footprint, with a margin
FOOT_TOWER = (0.21, 0.275, 0.34, 0.86)
BAND = (0.0, 0.25, 0.835, 0.885)                                     # v3: the tiny city, x0, x1, skyline, base


def palette(night):
    return (((206, 196, 210), (120, 108, 136), (60, 72, 120), (150, 120, 150), (255, 206, 120)) if night else
            ((250, 238, 222), (176, 150, 150), (84, 104, 160), (236, 196, 170), None))


def blur_fill(a, hole):
    """Fill the hole from its surroundings by repeated blurs, coarse to fine (a cheap diffusion)."""
    out = a.copy(); out[hole] = a[~hole].mean(0)
    for r in (48, 24, 12, 6, 3):
        for _ in range(6):
            b = np.asarray(Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r)), float)
            out[hole] = b[hole]
    return out


def tiny_city(im, rng, lit, shade, roof, haze, lights):
    """A far city in the thin BAND: rows of small blocks and one small tower, hazed towards the cloud colour."""
    S = 3
    lay = Image.new('RGBA', (W * S, H * S), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    P = lambda x, y: (x * W * S, y * H * S)
    x0, x1, top, bot = BAND
    for r in range(5):
        t = r / 4
        s = 0.5 + 0.8 * t
        x = x0
        while x < x1 - 0.01 * t:
            y = top + 0.006 + (bot - top - 0.01) * t + 0.01 * (x - x0)
            w = rng.uniform(0.002, 0.005) * s; h = rng.uniform(0.002, 0.005) * s
            c = tuple(int(shade[i] + (lit[i] - shade[i]) * rng.uniform(0.5, 1.0)) for i in range(3))
            d.rectangle([*P(x, y - h), *P(x + w, y + 0.0015 * s)], fill=c + (255,))
            d.rectangle([*P(x + w * 0.15, y - h * 0.95), *P(x + w * 0.85, y - h * 0.4)], fill=roof + (255,))
            if lights and rng.uniform() < 0.35:
                d.rectangle([*P(x + w * 0.3, y - h * 0.3), *P(x + w * 0.5, y - h * 0.1)], fill=lights + (255,))
            x += w + rng.uniform(0.0005, 0.002) * s
    tx, ttop, tbot = 0.12, top - 0.045, top + 0.02                   # one small tower, a few city rows tall
    d.rectangle([*P(tx - 0.0022, ttop), *P(tx + 0.0022, tbot)], fill=lit + (255,))
    d.rectangle([*P(tx + 0.0006, ttop), *P(tx + 0.0022, tbot)], fill=shade + (255,))
    for k in range(3):
        yb = ttop + (tbot - ttop) * (0.2 + 0.25 * k)
        d.rectangle([*P(tx - 0.0028, yb), *P(tx + 0.0028, yb + 0.0015)], fill=(216, 174, 72, 255))
    lay = lay.filter(ImageFilter.GaussianBlur(1.0)).resize((W, H), Image.LANCZOS)
    a = np.asarray(lay, float)
    a[..., :3] = a[..., :3] * 0.7 + np.array(haze, float) * 0.3      # distance haze
    fm = Image.new('L', (W, H), 0)                                   # soft edges, fading at the right into cloud
    ImageDraw.Draw(fm).rectangle([0, (top - 0.06) * H, (x1 - 0.03) * W, bot * H], fill=255)
    fm = np.asarray(fm.filter(ImageFilter.GaussianBlur(10)), float) / 255
    a[..., 3] = a[..., 3] * fm
    im.alpha_composite(Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), 'RGBA'))


def v3(base, night):
    """The v3 comp and mask: the whole old footprint minus the hull, filled with sky, and a tiny city."""
    a = np.asarray(base.convert('RGB'), float)
    foot = Image.new('L', (W, H), 0); d = ImageDraw.Draw(foot)
    d.polygon([(x * W, y * H) for x, y in FOOT], fill=255)
    d.rectangle([FOOT_TOWER[0] * W, FOOT_TOWER[2] * H, FOOT_TOWER[1] * W, FOOT_TOWER[3] * H], fill=255)
    lum = a.mean(axis=2)
    hull = Image.fromarray(((lum < (58 if night else 72)) * 255).astype(np.uint8))
    hull = hull.filter(ImageFilter.MedianFilter(7)).filter(ImageFilter.MaxFilter(9))    # the ship, a little grown
    hole = (np.asarray(foot) > 127) & (np.asarray(hull) < 128)
    filled = blur_fill(a, hole)
    im = Image.fromarray(np.clip(filled, 0, 255).astype(np.uint8)).convert('RGBA')
    tiny_city(im, np.random.default_rng(29), *palette(night))
    m = Image.fromarray((hole * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(8))
    return im, m


ROLL, ZOOM, CY = 11.6, 1.42, 0.50                                   # compose_bk's layout (Chapter VIII's scene)
CROP = ((1 - 1 / ZOOM) / 2, CY - (9 / 16) / ZOOM * (FULL[0] / FULL[1]) / 2, 1 / ZOOM, (9 / 16) / ZOOM * FULL[0] / FULL[1])
FBAND = (0.0, 0.34, 0.535, 0.64)                                     # v4, in FRAME units: x0, x1, skyline, base (rail at 0.60)
FTOWER = (0.12, 0.465)                                               # v4: the small tower's frame x and top


def frame_layer(draw_fn, S=3):
    """Draw in frame coordinates on a layer the painting's size, then roll it into the painting (compose_bk inverse)."""
    lay = Image.new('RGBA', (W * S, H * S), (0, 0, 0, 0))
    cx0, cy0, cw, ch = CROP
    P = lambda fx, fy: ((cx0 + fx * cw) * W * S, (cy0 + fy * ch) * H * S)
    draw_fn(ImageDraw.Draw(lay), P, cw * W * S)
    return lay.rotate(ROLL, resample=Image.BICUBIC, expand=False).resize((W, H), Image.LANCZOS)


def v4(base, night):
    """The v4 comp and mask: the old footprint and the frame band (minus the hull) filled with sky, a tiny level city."""
    lit, shade, roof, haze, lights = palette(night)
    rng = np.random.default_rng(29)
    a = np.asarray(base.convert('RGB'), float)
    x0, x1, top, bot = FBAND

    def band(d, P, px):
        d.polygon([P(x0 - 0.06, top - 0.10), P(x1 + 0.03, top - 0.10), P(x1 + 0.03, bot + 0.02), P(x0 - 0.06, bot + 0.02)], fill=(255,) * 4)
    foot = Image.new('L', (W, H), 0); d = ImageDraw.Draw(foot)
    d.polygon([(x * W, y * H) for x, y in FOOT], fill=255)
    d.rectangle([FOOT_TOWER[0] * W, FOOT_TOWER[2] * H, FOOT_TOWER[1] * W, FOOT_TOWER[3] * H], fill=255)
    foot = np.maximum(np.asarray(foot), np.asarray(frame_layer(band).split()[3]))
    lum = a.mean(axis=2)
    hull = Image.fromarray(((lum < (58 if night else 72)) * 255).astype(np.uint8))
    hull = hull.filter(ImageFilter.MedianFilter(7)).filter(ImageFilter.MaxFilter(9))
    hole = (foot > 127) & (np.asarray(hull) < 128)
    im = Image.fromarray(np.clip(blur_fill(a, hole), 0, 255).astype(np.uint8)).convert('RGBA')

    def city(d, P, px):
        u = 1 / px * 3                                               # about one work-res pixel, in frame units
        for r in range(5):
            t = r / 4
            s = 0.6 + 0.8 * t
            x = x0
            while x < x1 - 0.02 * (1 - t):
                y = top + 0.010 + (bot - top - 0.02) * t ** 1.2
                w = max(rng.uniform(0.004, 0.010) * s, 2 * u); h = max(rng.uniform(0.005, 0.014) * s, 2 * u)
                c = tuple(int(shade[i] + (lit[i] - shade[i]) * rng.uniform(0.5, 1.0)) for i in range(3))
                d.rectangle([*P(x, y - h), *P(x + w, y + 0.004 * s)], fill=c + (255,))
                d.rectangle([*P(x + w * 0.15, y - h * 0.95), *P(x + w * 0.85, y - h * 0.45)], fill=roof + (255,))
                if lights and rng.uniform() < 0.35:
                    d.rectangle([*P(x + w * 0.3, y - h * 0.3), *P(x + w * 0.5, y - h * 0.1)], fill=lights + (255,))
                x += w + rng.uniform(0.001, 0.004) * s
        tx, ttop = FTOWER
        for k in range(20):                                          # one small tower, tapering, gold bands
            t0, t1 = k / 20, (k + 1) / 20
            y0, y1 = top + 0.03 + (ttop - top - 0.03) * t0, top + 0.03 + (ttop - top - 0.03) * t1
            w0, w1 = 0.0035 * (1.4 - 0.4 * t0), 0.0035 * (1.4 - 0.4 * t1)
            d.polygon([P(tx - w0, y0), P(tx + w0, y0), P(tx + w1, y1), P(tx - w1, y1)], fill=lit + (255,))
            d.polygon([P(tx + w0 * 0.3, y0), P(tx + w0, y0), P(tx + w1, y1), P(tx + w1 * 0.3, y1)], fill=shade + (255,))
            if k % 5 == 2:
                d.rectangle([*P(tx - w0 * 1.2, y0 - 0.002), *P(tx + w0 * 1.2, y0)], fill=(216, 174, 72, 255))

    lay = frame_layer(city).filter(ImageFilter.GaussianBlur(0.8))
    c = np.asarray(lay, float)
    c[..., :3] = c[..., :3] * 0.72 + np.array(haze, float) * 0.28    # distance haze
    fade = np.ones((H, W)); fade = fade * (np.asarray(frame_layer(lambda d, P, px: d.rectangle(
        [*P(x0 - 0.1, top - 0.1), *P(x1 - 0.03, bot + 0.1)], fill=(255,) * 4)).split()[3].filter(ImageFilter.GaussianBlur(12)), float) / 255)
    c[..., 3] = c[..., 3] * fade                                     # the right end fades into cloud
    im.alpha_composite(Image.fromarray(np.clip(c, 0, 255).astype(np.uint8), 'RGBA'))
    m = Image.fromarray((hole * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(8))
    return im, m


def main(stem, out, name, night=False, mode='v1'):
    os.makedirs(out, exist_ok=True)
    base = Image.open(stem + '.base.png').convert('RGBA')
    if mode == 'v4':
        im, m = v4(base, night)
    elif mode == 'v3':
        im, m = v3(base, night)
    else:
        region, tower = (REGION2, TOWER2) if mode == 'v2' else (REGION, TOWER)
        im = base.copy()
        bk_init.city(im, np.random.default_rng(29), *palette(night))
        m = Image.new('L', (W, H), 0); d = ImageDraw.Draw(m)
        d.polygon([(x * W, y * H) for x, y in region], fill=255)
        d.rectangle([tower[0] * W, tower[2] * H, tower[1] * W, tower[3] * H], fill=255)
        m = m.filter(ImageFilter.GaussianBlur(10))
    im.convert('RGB').save(f'{out}/{name}-comp.png')
    m.save(f'{out}/{name}-mask.png')
    m.resize(FULL, Image.BILINEAR).save(f'{out}/{name}-mask-full.png')
    print(name, mode, 'mask px', int((np.asarray(m) > 127).sum()))


if __name__ == '__main__':
    flags = sys.argv[4:]
    main(sys.argv[1], sys.argv[2], sys.argv[3], 'night' in flags,
         next((v for v in ('v4', 'v3', 'v2') if v in flags), 'v1'))
