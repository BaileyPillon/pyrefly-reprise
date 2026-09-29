"""Sin's head option A, 2026-09-29 (FFX only): our own layout sketch, drawn in code. No image input of any kind.

Option A of round 1 (head-on, wings spread) redrawn for a layered rig: the head-on face, both wings spread to the sides
and kept in frame, the arm from behind the right wing down to the white tower's top in round 3's plate p6, and the mouth
FULLY OPEN, so the lower jaw, both rows of teeth and the throat are painted once. v2 (after LOOKING at pass 1's plush-toy
faces): rows of rock scales, crags, a scowling V brow, small slanted deep-set eyes, whale pleats down the jaw, many
short teeth. Written references only: research/ffx-sin.md 9.1 and 9.3; the FF Wiki Appearance text (whale-like, scaled,
feathery wing-like protrusions purple at the tips). The eye count is our estimate (no source gives one).

  python sketch.py head-a <round3 plate p6.base.png> <out_dir>
writes head-a.png (the RGBA creature, 1344x768), comp-a.png (pasted into the plate), mask-a.png / mask-a-full.png
(the silhouette grown 10 px, for gen.py mouth) and geometry-a.json (the rig geometry for rig_a.py, full-size pixels).
"""
import json, math, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

W, H, S = 1344, 768, 2
SW, SH = W * S, H * S
K = 2352 / 1344
GREY, GREY_D, GREY_L = (86, 82, 94), (54, 52, 62), (150, 142, 136)


def P(x, y):
    return (x * SW, y * SH)


def lerp(a, b, t):
    return tuple(int(round(a[i] + (b[i] - a[i]) * t)) for i in range(3))


def layer():
    return Image.new('RGBA', (SW, SH), (0, 0, 0, 0))


def comp(base, lay, blur=0):
    if blur:
        lay = lay.filter(ImageFilter.GaussianBlur(blur))
    base.alpha_composite(lay)


def gradient(stops):
    yf = np.linspace(0, 1, SH)
    col = np.stack([np.interp(yf, [s[0] for s in stops], [s[1][k] for s in stops]) for k in range(3)], axis=1)
    a = np.broadcast_to(col[:, None, :], (SH, SW, 3)).astype(float).copy()
    yy, xx = np.mgrid[0:SH, 0:SW]
    d = np.hypot(xx + 0.05 * SW, yy - 0.5 * SH) / (0.7 * SW)
    a += (np.clip(1 - d, 0, 1) ** 2)[..., None] * np.array((70, 52, 16), float)     # the low sun, off frame left
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).convert('RGBA')


def clouds(base, rng, y0, y1, col, n=14, alpha=110, blur=10, wr=(0.12, 0.35), hr=(0.012, 0.03)):
    lay = layer(); d = ImageDraw.Draw(lay)
    for _ in range(n):
        y = rng.uniform(y0, y1); x = rng.uniform(-0.1, 1.1)
        w = rng.uniform(*wr); h = rng.uniform(*hr)
        d.ellipse([*P(x - w, y - h), *P(x + w, y + h)], fill=col + (alpha,))
    comp(base, lay, blur)


def towers_of_cloud(base, rng, xs, top, bottom, lit, shade):
    """Towering cumulus: stacked puffs, lit on the left (the sun is off frame left)."""
    lay = layer(); d = ImageDraw.Draw(lay)
    for x0 in xs:
        for i in range(26):
            t = i / 25
            y = bottom + (top - bottom) * t * rng.uniform(0.85, 1.0)
            r = (0.07 - 0.035 * t) * rng.uniform(0.8, 1.2)
            x = x0 + rng.uniform(-0.05, 0.05) * (1 - t * 0.5)
            d.ellipse([*P(x - r, y - r * 1.6), *P(x + r, y + r * 1.6)], fill=shade + (255,))
            d.ellipse([*P(x - r * 1.02, y - r * 1.62), *P(x + r * 0.35, y + r * 0.9)], fill=lit + (255,))
    comp(base, lay, 6)


# ---- head A: head-on face, wings spread, mouth fully open (for the dusk plate BG-2) ----------------------------------
A = {'cx': 0.56, 'lip': 0.330, 'open': 0.22, 'hw': 0.18}     # face centre x, upper lip y, jaw drop, half width


def head_a():
    lay = layer(); d = ImageDraw.Draw(lay)
    cx, lip, drop, hw = A['cx'], A['lip'], A['open'], A['hw']
    # the wings, spread wide to both sides behind the head and kept in frame (after LOOKING at the first sketch: they
    # rose off the top edge): a fan from up-and-out to level, purple at the tips
    for sgn in (-1, 1):
        root = (cx + sgn * hw * 0.85, lip - 0.08)
        a0, a1 = (210, 165) if sgn < 0 else (330, 375)
        for i in range(15):
            u = i / 14
            a = math.radians(a0 + (a1 - a0) * u)
            L = 0.27 * (0.75 + 0.35 * math.sin(u * math.pi))
            ex, ey = root[0] + math.cos(a) * L, root[1] + math.sin(a) * L * 1.75
            col = lerp((60, 56, 70), (112, 104, 118), 0.3 + 0.5 * abs(math.sin(i * 1.7)))
            m0 = (root[0] + math.cos(a - 0.07) * L * 0.6, root[1] + math.sin(a - 0.07) * L * 0.6 * 1.75)
            m1 = (root[0] + math.cos(a + 0.07) * L * 0.6, root[1] + math.sin(a + 0.07) * L * 0.6 * 1.75)
            d.polygon([P(*root), P(*m0), P(ex, ey), P(*m1)], fill=col + (255,))
            t0 = (root[0] + math.cos(a - 0.035) * L * 0.8, root[1] + math.sin(a - 0.035) * L * 0.8 * 1.75)
            t1 = (root[0] + math.cos(a + 0.035) * L * 0.8, root[1] + math.sin(a + 0.035) * L * 0.8 * 1.75)
            d.polygon([P(*t0), P(ex, ey), P(*t1)], fill=(156, 72, 218, 255))
        d.ellipse([*P(root[0] - 0.03, root[1] - 0.05), *P(root[0] + 0.03, root[1] + 0.05)], fill=(60, 56, 70, 255))
    # the arm on the right, from behind the right wing's root down to the tower top (round 3's plate p6: the tower's
    # top is at 0.779, 0.473), its hooked claws over the round top
    d.polygon([P(0.715, 0.24), P(0.775, 0.235), P(0.805, 0.44), P(0.762, 0.452)], fill=GREY_D + (255,))
    d.ellipse([*P(0.752, 0.425), *P(0.808, 0.475)], fill=GREY_D + (255,))
    for k in range(4):
        fx = 0.757 + 0.013 * k
        d.polygon([P(fx - 0.004, 0.455), P(fx - 0.002, 0.49), P(fx + 0.006, 0.47)], fill=(24, 22, 28, 255))
    # the throat (drawn first; the jaw and skull go over it)
    d.polygon([P(cx - hw * 0.85, lip), P(cx + hw * 0.85, lip), P(cx + hw * 0.8, lip + drop * 0.9), P(cx, lip + drop),
               P(cx - hw * 0.8, lip + drop * 0.9)], fill=(46, 16, 34, 255))
    g = layer(); dg = ImageDraw.Draw(g)
    dg.ellipse([*P(cx - 0.06, lip + drop * 0.25), *P(cx + 0.06, lip + drop * 0.6)], fill=(180, 90, 245, 210))
    comp(lay, g, 30)
    # the lower jaw (dropped): a wide U seen from the front, lower teeth standing up on its lip
    jaw = [(cx - hw * 0.92, lip + drop * 0.55), (cx - hw * 0.8, lip + drop * 0.95), (cx - hw * 0.4, lip + drop * 1.18),
           (cx, lip + drop * 1.24), (cx + hw * 0.4, lip + drop * 1.18), (cx + hw * 0.8, lip + drop * 0.95), (cx + hw * 0.92, lip + drop * 0.55),
           (cx + hw * 0.78, lip + drop * 0.62), (cx + hw * 0.5, lip + drop * 0.9), (cx, lip + drop * 0.98), (cx - hw * 0.5, lip + drop * 0.9),
           (cx - hw * 0.78, lip + drop * 0.62)]
    d.polygon([P(*p) for p in jaw], fill=GREY + (255,))
    for i in range(12):                                                   # pleated grooves down the jaw (whale-like)
        u = (i + 0.5) / 12
        x = cx - hw * 0.8 + hw * 1.6 * u
        d.line([P(x, lip + drop * (0.66 + 0.34 * math.sin(math.pi * u))), P(x + (u - 0.5) * 0.02, lip + drop * (0.9 + 0.3 * math.sin(math.pi * u)))],
               fill=GREY_D + (255,), width=5)
    for i in range(24):                                                   # many short lower teeth
        u = (i + 0.5) / 24
        x = cx - hw * 0.74 + hw * 1.48 * u
        y = lip + drop * (0.62 + 0.36 * math.sin(math.pi * u))
        h = 0.016 * (1.1 - 0.3 * abs(u - 0.5))
        d.polygon([P(x - 0.004, y), P(x, y - h), P(x + 0.004, y)], fill=(224, 214, 198, 255))
    # the skull and upper jaw: broad and low, a heavy brow, two small amber eyes set far apart (our estimate: no source
    # gives a count; round 1's A had six)
    skull = [(cx - hw * 1.05, lip + 0.01), (cx - hw * 1.1, lip - 0.08), (cx - hw * 0.9, lip - 0.17), (cx - hw * 0.4, lip - 0.22),
             (cx, lip - 0.23), (cx + hw * 0.4, lip - 0.22), (cx + hw * 0.9, lip - 0.17), (cx + hw * 1.1, lip - 0.08), (cx + hw * 1.05, lip + 0.01),
             (cx + hw * 0.85, lip), (cx, lip + 0.012), (cx - hw * 0.85, lip)]
    d.polygon([P(*p) for p in skull], fill=GREY + (255,))
    d.polygon([P(cx - hw * 0.95, lip - 0.15), P(cx, lip - 0.10), P(cx + hw * 0.95, lip - 0.15), P(cx + hw * 0.9, lip - 0.12),
               P(cx, lip - 0.075), P(cx - hw * 0.9, lip - 0.12)], fill=GREY_L + (255,))                     # a scowling V brow
    for r in range(5):                                                    # rows of rock scales over the skull
        for c in range(14):
            x = cx - hw * 1.0 + hw * 2.0 * (c + 0.5 * (r % 2)) / 14
            y = lip - 0.20 + 0.035 * r
            d.arc([*P(x - 0.014, y - 0.012), *P(x + 0.014, y + 0.012)], 20, 160, fill=GREY_D + (220,), width=5)
    for k in range(6):                                                    # crags and cracks
        x = cx - hw * 0.9 + hw * 1.8 * k / 5
        d.line([P(x, lip - 0.19), P(x + 0.01, lip - 0.15), P(x - 0.005, lip - 0.12)], fill=(40, 38, 46, 255), width=4)
    for sgn in (-1, 1):                                                   # small deep-set eyes under the brow
        ex = cx + sgn * hw * 0.66
        d.polygon([P(ex - sgn * 0.022, lip - 0.078), P(ex, lip - 0.100 + 0.012), P(ex + sgn * 0.022, lip - 0.100), P(ex, lip - 0.066)], fill=(24, 20, 28, 255))
        d.polygon([P(ex - sgn * 0.014, lip - 0.078), P(ex, lip - 0.088), P(ex + sgn * 0.014, lip - 0.092), P(ex, lip - 0.072)], fill=(255, 196, 84, 255))
    for i in range(7):                                                    # stone spikes along the brow
        x = cx - hw * 0.8 + hw * 1.6 * i / 6
        d.polygon([P(x - 0.008, lip - 0.20 + 0.03 * abs(i - 3) / 3), P(x, lip - 0.245 + 0.03 * abs(i - 3) / 3), P(x + 0.008, lip - 0.20 + 0.03 * abs(i - 3) / 3)], fill=GREY_D + (255,))
    for i in range(28):                                                   # the upper fangs: many, short
        u = (i + 0.5) / 28
        x = cx - hw * 0.8 + hw * 1.6 * u
        y = lip + 0.004 * math.sin(math.pi * u)
        h = 0.020 * (1.1 - 0.4 * abs(u - 0.5))
        d.polygon([P(x - 0.0045, y - 0.002), P(x, y + h), P(x + 0.0045, y - 0.002)], fill=(232, 224, 208, 255))
    return lay


def a_geometry():
    """The head-A rig in full-size pixels (2352x1344): the jaw polygon, the upper lip, the drop."""
    cx, lip, drop, hw = A['cx'], A['lip'], A['open'], A['hw']
    f = lambda x, y: [round(x * 2352, 1), round(y * 1344, 1)]
    jaw_outer = [(cx - hw * 0.95, lip + drop * 0.5), (cx - hw * 0.8, lip + drop * 0.97), (cx - hw * 0.4, lip + drop * 1.2),
                 (cx, lip + drop * 1.27), (cx + hw * 0.4, lip + drop * 1.2), (cx + hw * 0.8, lip + drop * 0.97), (cx + hw * 0.95, lip + drop * 0.5)]
    lower_lip = [(cx + hw * 0.9, lip + drop * 0.52), (cx + hw * 0.5, lip + drop * 0.84), (cx, lip + drop * 0.92),
                 (cx - hw * 0.5, lip + drop * 0.84), (cx - hw * 0.9, lip + drop * 0.52)]
    upper = [(cx - hw * 0.95, lip), (cx - hw * 0.5, lip + 0.006), (cx, lip + 0.012), (cx + hw * 0.5, lip + 0.006), (cx + hw * 0.95, lip)]
    return {'jaw': [f(*p) for p in jaw_outer + lower_lip], 'lowerLip': [f(*p) for p in lower_lip], 'upperLip': [f(*p) for p in upper],
            'dropPx': round(drop * 0.86 * 1344, 1), 'faceCentreX': round(cx * 2352, 1),
            'skullBottomY': round((lip + 0.012) * 1344, 1)}


def prep_a(plate_base, out):
    """Head A painted INTO round 3's plate p6 (its deck kept): the composite and the creature mask (grown 10 px)."""
    lay = head_a().resize((W, H), Image.LANCZOS)
    lay.save(f'{out}/head-a.png')
    base = Image.open(plate_base).convert('RGBA').resize((W, H))
    base.alpha_composite(lay)
    base.convert('RGB').save(f'{out}/comp-a.png')
    a = lay.split()[3].point(lambda v: 255 if v > 16 else 0)
    m = a.filter(ImageFilter.MaxFilter(21)).filter(ImageFilter.GaussianBlur(3))
    m.save(f'{out}/mask-a.png'); m.resize((2352, 1344), Image.BILINEAR).save(f'{out}/mask-a-full.png')
    json.dump(a_geometry(), open(f'{out}/geometry-a.json', 'w'), indent=1)
    print('head A composite and mask written to', out)


if __name__ == '__main__':
    if len(sys.argv) != 4 or sys.argv[1] != 'head-a':
        raise SystemExit('usage: python sketch.py head-a <plate p6.base.png> <out_dir>')
    prep_a(sys.argv[2], sys.argv[3])
