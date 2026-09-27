"""Sin's head, round 2 (FFX only, 2026-09-27): our own layout sketches, drawn in code, one per mouth stage.

No image input of any kind. Written references only:
- research/ffx-sin.md 9.1: link 4 is fought from the Fahrenheit's deck; Sin has risen with wings and props
  itself on a tower in Bevelle; the ship closes nose to nose with it over Bevelle.
- research/ffx-sin.md 9.3 and 5.4: the face approaches over three turns, then the mouth opens in stages until
  fully open (the wiki gallery: three open stages and "fully open"); the mouth IS the clock.
- research/ffx-evrae-airship.md 12.1 and 12.3: the Fahrenheit's steel foredeck, plating lettered, a gold dial;
  Bevelle white, tiered, spires.
- FF Wiki "Sin (Final Fantasy X)", Appearance (revid 4045228, text only): whale-like, clawed arms, scales, a
  ruined city on the back of the head, feathery wing-like protrusions purple at the tips.

Composition kept from round 1's option C: three-quarter view, the long whale-like head turned left towards the
ship, over the white city at golden hour. Added and drawn explicitly: the tower under Sin's claw, the raised
wings, the steel prow in front. The lower jaw is DRAWN at each stage's angle about its hinge (never cut out of a
painting and turned): stage 0 SHUT, 1-3 the three open stages, 4 FULLY OPEN.

The sky, city, tower, wings, skull and deck are drawn with the same random stream in every stage, so the
sketches differ only where the mouth differs (stages.py uses that difference as the repaint mask).

Helpers (clouds, city, tower, wing, prow) adapted from the round-1 repair sketcher
(head-pilot/src/r2/sketch2.py). Usage: python sketch.py <out_dir>  -> sketch-s0..s4.png (1344x768)
"""
import math, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

W, H = 1344, 768
S = 2
SW, SH = W * S, H * S
HORIZON = 0.53
STAGE_DEG = [0, 6, 12, 18, 24]         # the lower jaw's angle at each stage
HINGE = (1040, 350)                     # the jaw hinge, base pixels


def P(x, y):                            # normalised -> supersampled pixels
    return (x * SW, y * SH)


def Q(x, y):                            # base pixels -> supersampled pixels
    return (x * S, y * S)


def lerp(a, b, t):
    return tuple(int(round(a[i] + (b[i] - a[i]) * t)) for i in range(3))


def layer():
    return Image.new('RGBA', (SW, SH), (0, 0, 0, 0))


def comp(base, lay, blur=0):
    if blur:
        lay = lay.filter(ImageFilter.GaussianBlur(blur))
    base.alpha_composite(lay)


HEAD_AT, HEAD_SCALE = (1020, 385), 0.82    # where the head-space hinge lands in the picture, and the head's scale


def QT(x, y):                           # head-space pixels -> supersampled picture pixels
    return Q(HEAD_AT[0] + (x - HINGE[0]) * HEAD_SCALE, HEAD_AT[1] + (y - HINGE[1]) * HEAD_SCALE)


def rot(p, deg):
    """Turn a base-pixel point about the hinge; positive = the jaw drops (the snout end moves down)."""
    a = math.radians(deg)
    dx, dy = p[0] - HINGE[0], p[1] - HINGE[1]
    return (HINGE[0] + dx * math.cos(a) + dy * math.sin(a), HINGE[1] - dx * math.sin(a) + dy * math.cos(a))


def sky_and_city(rng):
    yf = np.linspace(0, 1, SH)
    stops = [(0, (74, 88, 150)), (0.22, (196, 146, 140)), (0.40, (248, 180, 114)), (HORIZON, (255, 216, 150)), (1, (236, 200, 160))]
    col = np.stack([np.interp(yf, [s[0] for s in stops], [s[1][k] for s in stops]) for k in range(3)], axis=1)
    a = np.broadcast_to(col[:, None, :], (SH, SW, 3)).astype(float).copy()
    yy, xx = np.mgrid[0:SH, 0:SW]
    d = np.hypot(xx - 0.04 * SW, yy - 0.40 * SH) / (0.5 * SW)
    a += (np.clip(1 - d, 0, 1) ** 2)[..., None] * np.array((60, 44, 10), float)      # the low sun, off frame left
    im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).convert('RGBA')
    clouds(im, rng, 0.06, 0.24, (232, 196, 196), 14, 110)
    clouds(im, rng, 0.38, 0.50, (255, 206, 156), 10, 110)
    city_below(im, rng, (246, 238, 226), (160, 140, 150), (70, 100, 160), (226, 188, 164))
    return im


def clouds(base, rng, y0, y1, col, n=14, alpha=110):
    lay = layer(); d = ImageDraw.Draw(lay)
    for _ in range(n):
        y = rng.uniform(y0, y1); x = rng.uniform(-0.1, 1.1)
        w = rng.uniform(0.12, 0.35); h = rng.uniform(0.012, 0.03)
        d.ellipse([*P(x - w, y - h), *P(x + w, y + h)], fill=col + (alpha,))
    comp(base, lay, 10)


def city_below(base, rng, lit, shade, roof, haze):
    """Bevelle far below the ship: white tiered blocks, blue roofs and spires in rows receding to the horizon."""
    lay = layer(); d = ImageDraw.Draw(lay)
    d.rectangle([*P(0, HORIZON), *P(1, 1)], fill=haze + (255,))
    ground = lerp(haze, shade, 0.35)
    rows = 22
    for r in range(rows):
        t = r / (rows - 1)
        y = HORIZON + 0.008 + 0.40 * t ** 1.7
        s = 0.25 + 1.3 * t ** 1.4
        x = rng.uniform(-0.03, 0.0)
        while x < 1.03:
            w = rng.uniform(0.008, 0.02) * s; h = rng.uniform(0.004, 0.012) * s
            if rng.uniform() < 0.12:
                d.rectangle([*P(x, y - h), *P(x + w, y + 0.003 * s)], fill=ground + (255,))
            else:
                c = lerp(shade, lit, rng.uniform(0.5, 1.0))
                d.rectangle([*P(x, y - h), *P(x + w, y + 0.003 * s)], fill=c + (255,))
                d.rectangle([*P(x + w * 0.15, y - h * 0.95), *P(x + w * 0.85, y - h * 0.35)], fill=roof + (255,))
                if rng.uniform() < 0.10:
                    sx = x + w * 0.5
                    d.polygon([P(sx - 0.002 * s, y - h), P(sx, y - h - rng.uniform(0.02, 0.05) * s), P(sx + 0.002 * s, y - h)], fill=lit + (255,))
            x += w + rng.uniform(0.001, 0.005) * s
    comp(base, lay, 1)
    hz = layer(); d = ImageDraw.Draw(hz)
    for i in range(30):
        t = i / 30
        d.rectangle([*P(0, HORIZON + t * 0.25), *P(1, HORIZON + (t + 1 / 30) * 0.25)], fill=haze + (int(200 * (1 - t) ** 1.3),))
    comp(base, hz, 6)
    clouds(base, rng, HORIZON + 0.06, HORIZON + 0.2, lerp(haze, (255, 255, 255), 0.4), 10, 150)


def tower(base, x, top, bottom, lit, shade, gold, w):
    """The white tower Sin props itself on: tapered, tiered, gold bands, blue windows; base pixels."""
    lay = layer(); d = ImageDraw.Draw(lay)
    for i in range(24):
        t0, t1 = i / 24, (i + 1) / 24
        y0, y1 = bottom + (top - bottom) * t0, bottom + (top - bottom) * t1
        w0, w1 = w * (1.5 - 0.5 * t0), w * (1.5 - 0.5 * t1)
        d.polygon([Q(x - w0, y0), Q(x + w0, y0), Q(x + w1, y1), Q(x - w1, y1)], fill=lit + (255,))
        d.polygon([Q(x + w0 * 0.3, y0), Q(x + w0, y0), Q(x + w1, y1), Q(x + w1 * 0.3, y1)], fill=shade + (255,))
        if i % 4 == 2:
            d.rectangle([*Q(x - w0 * 1.12, y0 - 5), *Q(x + w0 * 1.12, y0)], fill=gold + (255,))
        if i % 3 == 1:
            d.rectangle([*Q(x - w0 * 0.55, y0 - 10), *Q(x - w0 * 0.2, y0 - 3)], fill=(60, 80, 130, 255))
    # a crown of short pinnacles at the top, under the claw
    for k in (-0.8, -0.3, 0.2, 0.7):
        px = x + k * w
        d.polygon([Q(px - 5, top + 2), Q(px, top - 22), Q(px + 5, top + 2)], fill=lit + (255,))
    comp(base, lay, 0.6)


def wing(base, root, a0, a1, length, n, dark, mid, tip, rng):
    """A fan of long feathers from a root point (base pixels), dark with purple tips."""
    lay = layer(); d = ImageDraw.Draw(lay)
    rx, ry = root
    for i in range(n):
        a = math.radians(a0 + (a1 - a0) * i / max(1, n - 1))
        L = length * (0.75 + 0.25 * math.sin(i * 1.3 + 0.4))
        wd = length * 0.065
        ex, ey = rx + L * math.cos(a), ry + L * math.sin(a)
        nx, ny = -math.sin(a) * wd, math.cos(a) * wd
        mx, my = rx + L * 0.7 * math.cos(a), ry + L * 0.7 * math.sin(a)
        col = lerp(dark, mid, i / max(1, n - 1) * 0.6 + rng.uniform(0, 0.3))
        d.polygon([Q(rx, ry), Q(mx + nx, my + ny), Q(ex, ey), Q(mx - nx, my - ny)], fill=col + (255,))
        tx, ty = rx + L * 0.76 * math.cos(a), ry + L * 0.76 * math.sin(a)
        d.polygon([Q(tx + nx * 0.85, ty + ny * 0.85), Q(ex, ey), Q(tx - nx * 0.85, ty - ny * 0.85)], fill=tip + (255,))
        d.line([Q(rx, ry), Q(ex, ey)], fill=lerp(col, (0, 0, 0), 0.4) + (255,), width=3)
    comp(base, lay, 1.2)


def prow(base, deck, deck_lit, line, rail, rail_lit, dial, tip=(0.47, 0.76)):
    """The Fahrenheit's steel foredeck: the prow points at Sin; plates and rivets run to the tip, rails on both
    edges, a pale plate for the lettering and the gold dial set in the plating (the lettering itself is laid on
    the painting by dress.py, in our own type)."""
    lay = layer(); d = ImageDraw.Draw(lay)
    L0, R0 = (-0.08, 0.95), (1.08, 0.95)
    d.polygon([P(*L0), P(*tip), P(*R0), P(1.08, 1.0), P(-0.08, 1.0)], fill=deck + (255,))
    d.polygon([P(0.30, 1.0), P(tip[0] - 0.01, tip[1] + 0.01), P(tip[0] + 0.01, tip[1] + 0.01), P(0.64, 1.0)], fill=deck_lit + (255,))
    for k in range(-9, 10):
        d.line([P(*tip), P(0.47 + k * 0.12, 1.0)], fill=line + (255,), width=3)
    for i in range(1, 6):
        t = (i / 6) ** 1.6
        yl = tip[1] + (1.0 - tip[1]) * t
        xl = tip[0] + (L0[0] - tip[0]) * min(1, (yl - tip[1]) / (L0[1] - tip[1]))
        xr = tip[0] + (R0[0] - tip[0]) * min(1, (yl - tip[1]) / (R0[1] - tip[1]))
        d.line([P(xl, yl), P(xr, yl)], fill=line + (255,), width=3)
        for j in range(24):
            rx = xl + (xr - xl) * (j + 0.5) / 24
            d.ellipse([*P(rx - 0.0015, yl - 0.004), *P(rx + 0.0015, yl - 0.001)], fill=deck_lit + (255,))
    # the pale lettering plate across the keel, and a smaller plate nearer the tip
    d.polygon([P(0.40, 0.905), P(0.62, 0.905), P(0.645, 0.965), P(0.375, 0.965)], fill=lerp(deck_lit, (255, 250, 240), 0.25) + (255,))
    d.polygon([P(0.455, 0.815), P(0.535, 0.815), P(0.542, 0.842), P(0.448, 0.842)], fill=lerp(deck_lit, (255, 250, 240), 0.2) + (255,))
    d.line([P(*L0), P(*tip), P(*R0)], fill=rail_lit + (255,), width=6)
    for side in (L0, R0):
        for i in range(10):
            t = i / 9
            x = tip[0] + (side[0] - tip[0]) * t; y = tip[1] + (side[1] - tip[1]) * t
            h = 0.03 + 0.07 * t
            d.rectangle([*P(x - 0.002 - 0.003 * t, y - h), *P(x + 0.002 + 0.003 * t, y)], fill=rail + (255,))
        for f, wdt in ((1.0, 7), (0.55, 5)):
            pts = []
            for i in range(11):
                t = i / 10
                x = tip[0] + (side[0] - tip[0]) * t; y = tip[1] + (side[1] - tip[1]) * t
                pts.append(P(x, y - (0.03 + 0.07 * t) * f))
            d.line(pts, fill=rail_lit + (255,) if f == 1.0 else rail + (255,), width=wdt)
    # the gold dial, in perspective, right of the keel
    cx, cy, rx, ry = 0.735, 0.935, 0.06, 0.027
    d.ellipse([*P(cx - rx, cy - ry), *P(cx + rx, cy + ry)], fill=dial + (255,))
    d.ellipse([*P(cx - rx * 0.8, cy - ry * 0.8), *P(cx + rx * 0.8, cy + ry * 0.8)], fill=lerp(dial, (40, 30, 10), 0.55) + (255,))
    d.ellipse([*P(cx - rx * 0.64, cy - ry * 0.64), *P(cx + rx * 0.64, cy + ry * 0.64)], fill=lerp(dial, (255, 240, 200), 0.25) + (255,))
    d.ellipse([*P(cx - rx * 0.12, cy - ry * 0.12), *P(cx + rx * 0.12, cy + ry * 0.12)], fill=lerp(dial, (40, 30, 10), 0.6) + (255,))
    comp(base, lay, 0.8)


# ---- the head, base pixels ------------------------------------------------------------------------------------
UPPER_LIP = [(455, 300), (560, 312), (700, 325), (850, 334), (960, 340), (1030, 344)]
SKULL = [(455, 300), (446, 284), (450, 262), (470, 240), (530, 205), (620, 170), (730, 140), (850, 118), (970, 108), (1080, 110),
         (1180, 120), (1260, 135), (1450, 160), (1450, 340), (1250, 356), (1130, 364), (1070, 356)] + UPPER_LIP[::-1][:-1]
LOWER_LIP = [(462, 304), (560, 316), (700, 329), (850, 338), (960, 344), (1030, 348)]
JAW = LOWER_LIP + [(1075, 356), (1100, 386), (1085, 420), (1000, 440), (880, 441), (740, 422), (600, 386), (500, 346), (465, 320)]
UNDER = [(1000, 440), (880, 441), (740, 422), (600, 386)]      # the underside, for the throat skin


def mouth_and_jaw(im, deg, rng):
    """Throat skin, the mouth interior, the lower jaw at `deg`, both rows of teeth. Returns nothing."""
    k = deg / STAGE_DEG[-1]
    jaw = [rot(p, deg) for p in JAW]
    lip = [rot(p, deg) for p in LOWER_LIP]
    under = [rot(p, deg) for p in UNDER]
    lay = layer(); d = ImageDraw.Draw(lay)
    # the throat skin from the jaw's underside back to the neck (it stretches as the jaw drops)
    d.polygon([QT(*p) for p in under[::-1]] + [QT(1085, 420), QT(1180, 425), QT(1450, 425), QT(1450, 340), QT(1100, 386)], fill=(74, 62, 80, 255))
    for i in range(7):
        t = i / 6
        a = under[min(3, int(t * 3.999))]
        d.line([QT(a[0] + 30 * t, a[1] - 6), QT(1150 + 60 * t, 425 + 4 * t)], fill=(46, 36, 52, 200), width=5)
    comp(im, lay, 0.8)
    # the mouth interior between the lips: dark, violet glow deep in the throat, a tongue
    if deg > 0:
        lay = layer(); d = ImageDraw.Draw(lay)
        mouth = [QT(*p) for p in UPPER_LIP] + [QT(*p) for p in lip[::-1]]
        d.polygon(mouth, fill=(46, 16, 44, 255))
        comp(im, lay, 0.6)
        g = layer(); d = ImageDraw.Draw(g)
        cx, cy = rot((980, 352), deg * 0.5)
        r = 60 + 150 * k
        d.ellipse([*QT(cx - r * 1.3, cy - r * 0.55), *QT(cx + r * 0.6, cy + r * 0.55)], fill=(190, 90, 255, int(120 + 135 * k)))
        d.ellipse([*QT(cx - r * 0.6, cy - r * 0.25), *QT(cx + r * 0.3, cy + r * 0.25)], fill=(240, 190, 255, int(80 + 150 * k)))
        tongue = [(p[0] + (q[0] - p[0]) * 0.3, p[1] + (q[1] - p[1]) * 0.3) for p, q in zip(lip, UPPER_LIP)]
        d.line([QT(*p) for p in tongue[1:]], fill=(150, 60, 110, 200), width=int(16 + 30 * k))
        g = g.filter(ImageFilter.GaussianBlur(18))
        m = Image.new('L', (SW, SH), 0); ImageDraw.Draw(m).polygon(mouth, fill=255)
        g.putalpha(Image.fromarray(np.minimum(np.asarray(g.split()[3]), np.asarray(m))))
        im.alpha_composite(g)
    # the lower jaw: one continuous jaw from the hinge to a rounded chin, scaled, pleated underneath
    lay = layer(); d = ImageDraw.Draw(lay)
    d.polygon([QT(*p) for p in jaw], fill=(92, 82, 96, 255))
    d.polygon([QT(*rot(p, deg)) for p in [(470, 318), (600, 340), (760, 356), (900, 364), (1000, 366), (1060, 380), (1040, 420), (880, 430), (740, 410), (600, 376), (505, 340)]],
              fill=(118, 102, 110, 255))
    for i in range(10):   # pleats along the underside
        t = i / 9
        a = rot((520 + 480 * t, 345 + 60 * t + 30 * math.sin(t * 3)), deg)
        b = rot((545 + 470 * t, 380 + 55 * t + 10 * math.sin(t * 3)), deg)
        d.line([QT(*a), QT(*b)], fill=(56, 46, 62, 200), width=5)
    for i in range(8):    # scales along the jaw
        t = (i + 0.5) / 8
        c = rot((500 + 500 * t, 330 + 30 * t), deg)
        d.arc([*QT(c[0] - 16, c[1] - 12), *QT(c[0] + 16, c[1] + 12)], 20, 160, fill=(60, 50, 64, 170), width=4)
    comp(im, lay, 0.8)
    # teeth: the lower row points up from the lower lip, the upper row down from the upper lip (drawn with the skull)
    lay = layer(); d = ImageDraw.Draw(lay)
    n = 16
    for i in range(n):
        t = (i + 0.7) / n
        x, y = rot((462 + (1000 - 462) * t, 304 + 42 * t), deg)
        hgt = (6 if deg == 0 else 26) * (1 - 0.45 * t)
        a = math.radians(deg)
        up = (-math.sin(a) * hgt, -math.cos(a) * hgt)            # perpendicular to the turned lip, pointing into the mouth
        side = (math.cos(a) * 8, -math.sin(a) * 8)
        d.polygon([QT(x - side[0], y - side[1]), QT(x + side[0], y + side[1]), QT(x + up[0], y + up[1])], fill=(214, 204, 190, 255))
    comp(im, lay, 0.6)


def skull(im, deg, rng):
    lay = layer(); d = ImageDraw.Draw(lay)
    d.polygon([QT(*p) for p in SKULL], fill=(112, 100, 112, 255))
    comp(im, lay, 0.8)
    sh = layer(); d = ImageDraw.Draw(sh)
    d.ellipse([*QT(420, 130), *QT(860, 300)], fill=(236, 178, 132, 160))      # low sun on the snout and brow
    d.ellipse([*QT(1000, 90), *QT(1420, 380)], fill=(50, 42, 58, 160))
    d.ellipse([*QT(560, 270), *QT(1060, 380)], fill=(66, 56, 70, 120))
    sh = sh.filter(ImageFilter.GaussianBlur(50))
    m = Image.new('L', (SW, SH), 0); ImageDraw.Draw(m).polygon([QT(*p) for p in SKULL], fill=255)
    sh.putalpha(Image.fromarray(np.minimum(np.asarray(sh.split()[3]), np.asarray(m))))
    im.alpha_composite(sh)
    dt = layer(); d = ImageDraw.Draw(dt)
    for r in range(5):                                                       # scales over the skull
        for c in range(15):
            x = 520 + 50 * c + (r % 2) * 25
            ytop = 250 - 150 * (x - 470) / 700 if x < 1170 else 110
            y = max(ytop, 125) + 38 * r + 10
            if x > 1250 or y > 320 - 0.01 * x:
                continue
            d.arc([*QT(x - 22, y - 16), *QT(x + 22, y + 16)], 20, 160, fill=(62, 52, 66, 150), width=5)
    d.polygon([QT(620, 196), QT(760, 162), QT(790, 180), QT(650, 214)], fill=(206, 166, 134, 255))        # brow ridge
    d.ellipse([*QT(650, 206), *QT(730, 246)], fill=(26, 20, 28, 255))                                  # eye socket
    d.polygon([QT(662, 228), QT(690, 216), QT(718, 226), QT(690, 238)], fill=(255, 206, 90, 255))        # the eye
    d.ellipse([*QT(686, 222), *QT(694, 234)], fill=(40, 20, 10, 255))
    d.ellipse([*QT(488, 262), *QT(500, 270)], fill=(40, 30, 40, 255))                                  # nostril
    for i in range(9):                                                                               # ruins on the back of the head
        x = 930 + 26 * i; h = rng.uniform(24, 50); w = rng.uniform(8, 14); yb = 112 + 2 * i
        d.rectangle([*QT(x - w, yb - h), *QT(x + w, yb)], fill=(178, 168, 160, 255))
        d.polygon([QT(x - w, yb - h), QT(x, yb - h - rng.uniform(8, 22)), QT(x + w, yb - h)], fill=(178, 168, 160, 255))
        d.rectangle([*QT(x - w * 0.4, yb - h * 0.7), *QT(x + w * 0.1, yb - h * 0.5)], fill=(40, 34, 44, 255))
    # the upper teeth, down from the upper lip; short when the mouth is shut (only the tips overlap the lower lip)
    n = 17
    for i in range(n):
        t = (i + 0.3) / n
        x, y = 455 + (1010 - 455) * t, 300 + 42 * t
        hgt = (8 if deg == 0 else 30) * (1 - 0.45 * t)
        d.polygon([QT(x - 8, y - 1), QT(x + 8, y - 1), QT(x, y + hgt)], fill=(236, 228, 212, 255))
    # the lip seam when shut: a thin dark line with a faint violet thread
    if deg == 0:
        d.line([QT(*p) for p in UPPER_LIP], fill=(24, 14, 26, 255), width=5)
        d.line([QT(*p) for p in UPPER_LIP[1:]], fill=(150, 90, 220, 140), width=2)
    comp(im, dt, 1)


def sketch(deg):
    rng = np.random.default_rng(2027)
    im = sky_and_city(rng)
    wing(im, (1262, 212), 262, 330, 340, 10, (60, 52, 66), (100, 86, 100), (150, 70, 210), rng)           # far wing
    body = layer(); d = ImageDraw.Draw(body)
    d.polygon([Q(1120, 200), Q(1350, 170), Q(1350, 580), Q(1260, 540), Q(1200, 450)], fill=(80, 70, 84, 255))
    comp(im, body, 3)
    tower(im, 1170, 482, 770, (244, 240, 232), (176, 166, 180), (214, 172, 70), 30)
    wing(im, (1130, 214), 192, 282, 420, 13, (60, 52, 66), (112, 98, 112), (150, 70, 210), rng)          # near wing, raised
    mouth_and_jaw(im, deg, rng)
    arm = layer(); d = ImageDraw.Draw(arm)                                     # the arm from under the neck to the claw
    d.polygon([Q(1350, 430), Q(1290, 432), Q(1236, 462), Q(1206, 478), Q(1220, 520), Q(1290, 512), Q(1350, 530)], fill=(84, 72, 86, 255))
    d.line([Q(1345, 434), Q(1240, 466)], fill=(220, 160, 120, 200), width=8)
    for k in range(4):                                                         # talons wrapped round the tower's top
        y = 478 + k * 12
        d.polygon([Q(1215, y), Q(1140, y + 4), Q(1128, y + 16), Q(1146, y + 21), Q(1218, y + 12)], fill=(84, 72, 86, 255))
        d.polygon([Q(1140, y + 6), Q(1120, y + 20), Q(1138, y + 18)], fill=(230, 220, 206, 255))
    comp(im, arm, 1)
    skull(im, deg, rng)
    prow(im, (86, 90, 104), (136, 132, 140), (44, 46, 56), (34, 34, 42), (230, 180, 130), (214, 172, 70))
    out = im.convert('RGB').resize((W, H), Image.LANCZOS)
    a = np.asarray(out, float) + np.random.default_rng(7).normal(0, 3.0, (H, W, 3))
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


if __name__ == '__main__':
    out = sys.argv[1]
    os.makedirs(out, exist_ok=True)
    for s, deg in enumerate(STAGE_DEG):
        sketch(deg).save(os.path.join(out, f'sketch-s{s}.png'))
        print('wrote stage', s, deg, 'deg')
