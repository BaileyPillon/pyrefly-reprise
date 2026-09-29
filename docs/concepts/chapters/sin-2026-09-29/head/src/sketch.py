"""Sin art options, 2026-09-29 (FFX only): our own layout sketches, drawn in code. No image input of any kind.

Every subject is painted in two jobs, as in round 3 (docs/concepts/chapters/sin-2026-09-27/head-round3/):
  a PLATE with no creature (sky, clouds, city or Sin's back), then the CREATURE painted INTO that plate by a masked
  repaint. So the plate stays pixel-identical between NEAR and FAR, Left and Right, shell open and shut, and the
  creature is a clean layer (the painting minus the plate), as the engine would stage it.

Frame layout (the in-game Evrae deck, docs/screenshots/chapters/evrae-scene-far.jpg): the deck and rail stand in front
of the painting from 0.595 of the height down; the party stands at 0.2 to 0.4 of the width; the turn-order column is
at the right edge. So the creature sits at 0.45 to 0.85 of the width, above the rail.

  python sketch.py <out_dir>
writes, base size 1344x768:
  plate-fin.png      the fin sky: late afternoon over a sea of cloud (links 1 and 2 are fought in flight, before Sinfall)
  plate-back.png     Sin's back under the same sky (link 3)
  fin-<F1|F2>-<L|R>-<NEAR|FAR>.png   RGBA creature layers (the fin, its arm, Sin's flank)
  link3-<G1K1|G2K2>[-shut].png       RGBA Genais + Core (shut: Genais in its shell)
  head-a.png         RGBA: option A's head-on face and wings, mouth fully open (for the dusk plate BG-2)
  deckfill.png, deckmask.png         BG-2: the city continued where round 3's plate p6 has its painted prow
  geometry.json      the head-A rig geometry (full-size pixels) and the core positions (for the charge glow)
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


# ---- the fin sky (links 1 and 2) ---------------------------------------------------------------------------------
def plate_fin():
    rng = np.random.default_rng(2901)
    im = gradient([(0, (36, 62, 128)), (0.30, (82, 126, 196)), (0.52, (170, 186, 214)), (0.60, (250, 214, 160)),
                   (0.66, (236, 222, 214)), (1, (200, 206, 222))])
    towers_of_cloud(im, rng, [0.08, 0.30, 0.93], 0.18, 0.62, (255, 236, 206), (170, 170, 196))
    clouds(im, rng, 0.08, 0.40, (220, 232, 250), 14, 90, 8, (0.1, 0.3), (0.004, 0.012))     # high streaks
    # the sea of cloud below, lit gold at its tops, blue in its hollows
    lay = layer(); d = ImageDraw.Draw(lay)
    d.rectangle([*P(0, 0.62), *P(1, 1)], fill=(206, 210, 228, 255))
    for r in range(18):
        t = r / 17
        y = 0.62 + 0.40 * t ** 1.5
        for _ in range(int(10 + 8 * t)):
            x = rng.uniform(-0.05, 1.05); w = rng.uniform(0.03, 0.09) * (0.4 + 1.4 * t); h = w * 0.35
            d.ellipse([*P(x - w, y - h), *P(x + w, y + h)], fill=lerp((168, 176, 206), (255, 236, 212), rng.uniform(0.3, 1)) + (255,))
    comp(im, lay, 3)
    return im


def fin_creature(design, side, rng_):
    """The Fin: Sin's arm ("Sin's Left/Right Arm"), seen from the deck. NEAR: the arm's base with the core fills the
    upper right, the claws come down over the rail. FAR: Sin's whole flank far off, the arm on its side.
    Right = the same arm drawn mirrored about the creature's own axis; the light (from the left) is not mirrored."""
    lay = layer(); d = ImageDraw.Draw(lay)
    near = rng_ == 'NEAR'
    mir = side == 'R'
    ax = 0.70                                   # the mirror axis for the Right Fin

    def T(x, y):
        return P(2 * ax - x if mir else x, y)
    if near:
        # Sin's flank: a huge dark wall of scales at the right, its edge curving down from the top
        flank = [(0.80, -0.05), (0.76, 0.12), (0.78, 0.32), (0.86, 0.52), (0.98, 0.66), (1.10, 0.70), (1.10, -0.05)]
        body_col = GREY_D
    else:
        # far: a long whale-like body level with the ship, head out of frame, tail trailing into haze
        flank = [(0.42, 0.28), (0.52, 0.22), (0.70, 0.18), (0.90, 0.19), (1.10, 0.22), (1.10, 0.44), (0.90, 0.46),
                 (0.70, 0.44), (0.55, 0.40), (0.46, 0.36)]
        body_col = lerp(GREY_D, (150, 160, 190), 0.35)                   # aerial haze
    d.polygon([T(*p) for p in flank], fill=body_col + (255,))
    # scales on the flank
    cx0, cy0, sc = (0.9, 0.3, 0.05) if near else (0.75, 0.32, 0.018)
    for r in range(-6, 7):
        for c in range(-8, 9):
            x = cx0 + c * sc + (r % 2) * sc / 2; y = cy0 + r * sc * 0.7
            d.arc([*T(x - sc * 0.5, y - sc * 0.3), *T(x + sc * 0.5, y + sc * 0.3)] if not mir else
                  [*T(x + sc * 0.5, y - sc * 0.3), *T(x - sc * 0.5, y + sc * 0.3)], 20, 160, fill=lerp(body_col, (0, 0, 0), 0.3) + (200,), width=4)
    # the arm, from its base on the flank down towards the ship
    if near:
        base, tip = (0.80, 0.26), (0.50, 0.56)
        wid = 0.12
        core, core_r = (0.82, 0.24), 0.055
    else:
        base, tip = (0.64, 0.40), (0.56, 0.60)
        wid = 0.045
        core, core_r = (0.645, 0.39), 0.018
    bx, by = base; tx, ty = tip
    ang = math.atan2(ty - by, tx - bx); nx, ny = -math.sin(ang), math.cos(ang)
    if design == 'F1':      # a broad flat flipper, tapering, three hooked claws at the tip
        pts = []
        for i in range(21):
            u = i / 20
            w = wid * (0.55 + 0.6 * math.sin(math.pi * min(1, u * 1.25))) * (1 - 0.75 * u)
            pts.append((bx + (tx - bx) * u + nx * w, by + (ty - by) * u + ny * w))
        for i in range(20, -1, -1):
            u = i / 20
            w = wid * (0.35 + 0.3 * math.sin(math.pi * u)) * (1 - 0.8 * u)
            pts.append((bx + (tx - bx) * u - nx * w, by + (ty - by) * u - ny * w))
        d.polygon([T(*p) for p in pts], fill=lerp(body_col, GREY, 0.5) + (255,))
        for i in range(1, 9):                                              # pleats along the flipper
            u = i / 9
            a = (bx + (tx - bx) * u + nx * wid * 0.4 * (1 - u), by + (ty - by) * u + ny * wid * 0.4 * (1 - u))
            b = (bx + (tx - bx) * u - nx * wid * 0.25 * (1 - u), by + (ty - by) * u - ny * wid * 0.25 * (1 - u))
            d.line([T(*a), T(*b)], fill=lerp(body_col, (0, 0, 0), 0.35) + (230,), width=5 if near else 2)
        for k in (-1, 0, 1):                                               # three claws
            cxk, cyk = tx + nx * wid * 0.12 * k, ty + ny * wid * 0.12 * k
            ex, ey = cxk + math.cos(ang + 0.5 * k) * wid * 0.45, cyk + math.sin(ang + 0.5 * k) * wid * 0.45
            d.polygon([T(cxk - nx * wid * 0.05, cyk - ny * wid * 0.05), T(ex, ey), T(cxk + nx * wid * 0.05, cyk + ny * wid * 0.05)],
                      fill=(22, 20, 26, 255))
    else:                   # a jointed arm carrying a tall ribbed fin with a webbed membrane
        elbow = (bx + (tx - bx) * 0.5 + nx * wid * 0.6, by + (ty - by) * 0.5 + ny * wid * 0.6)
        for a0, a1, w0 in ((base, elbow, wid * 0.45), (elbow, tip, wid * 0.32)):
            d.line([T(*a0), T(*a1)], fill=lerp(body_col, GREY, 0.5) + (255,), width=int(w0 * SW))
            d.ellipse([*T(a1[0] - w0 * 0.5, a1[1] - w0 * 0.5), *T(a1[0] + w0 * 0.5, a1[1] + w0 * 0.5)] if not mir else
                      [*T(a1[0] + w0 * 0.5, a1[1] - w0 * 0.5), *T(a1[0] - w0 * 0.5, a1[1] + w0 * 0.5)], fill=lerp(body_col, GREY, 0.5) + (255,))
        spines = []
        for i in range(9):                                                 # spines fanning up from the arm
            u = 0.1 + 0.8 * i / 8
            sx = bx + (elbow[0] - bx) * u * 1.6 if u < 0.6 else elbow[0] + (tx - elbow[0]) * (u - 0.6) * 2.5
            sy = by + (elbow[1] - by) * u * 1.6 if u < 0.6 else elbow[1] + (ty - elbow[1]) * (u - 0.6) * 2.5
            L = wid * (2.6 - 1.6 * abs(u - 0.4))
            ex, ey = sx - nx * L + 0.2 * wid, sy - ny * L - 0.4 * wid
            spines.append(((sx, sy), (ex, ey)))
        memb = [s[1] for s in spines] + [s[0] for s in spines[::-1]]
        d.polygon([T(*p) for p in memb], fill=lerp(body_col, (96, 90, 108), 0.6) + (235,))
        for (s0, s1) in spines:
            d.line([T(*s0), T(*s1)], fill=lerp(body_col, (0, 0, 0), 0.3) + (255,), width=6 if near else 3)
        for k in (-1, 0, 1):
            ex, ey = tx + math.cos(ang + 0.5 * k) * wid * 0.4, ty + math.sin(ang + 0.5 * k) * wid * 0.4
            d.polygon([T(tx - nx * wid * 0.05, ty - ny * wid * 0.05), T(ex, ey), T(tx + nx * wid * 0.05, ty + ny * wid * 0.05)], fill=(22, 20, 26, 255))
    # the core at the base of the arm: a rock socket and a pale-blue glow (F1 an orb, F2 a crystal cluster)
    cx, cy = core
    d.ellipse([*T(cx - core_r * 1.35, cy - core_r * 1.35 * 1.7), *T(cx + core_r * 1.35, cy + core_r * 1.35 * 1.7)] if not mir else
              [*T(cx + core_r * 1.35, cy - core_r * 1.35 * 1.7), *T(cx - core_r * 1.35, cy + core_r * 1.35 * 1.7)], fill=(34, 32, 40, 255))
    if design == 'F1':
        d.ellipse([*T(cx - core_r, cy - core_r * 1.7), *T(cx + core_r, cy + core_r * 1.7)] if not mir else
                  [*T(cx + core_r, cy - core_r * 1.7), *T(cx - core_r, cy + core_r * 1.7)], fill=(170, 214, 240, 255))
    else:
        for j in range(6):
            a = -math.pi / 2 + (j - 2.5) * 0.4
            L = core_r * (1.6 + 0.5 * (j % 2))
            d.polygon([T(cx - core_r * 0.2, cy + core_r * 0.3), T(cx + math.cos(a) * L, cy + math.sin(a) * L * 1.7),
                       T(cx + core_r * 0.2, cy + core_r * 0.3)], fill=(176, 218, 244, 255))
    return lay, (2 * ax - cx if mir else cx, cy, core_r)


# ---- link 3: Sin's back --------------------------------------------------------------------------------------------
def back_poly():
    """The ground: Sin's back, a convex rolling plain, higher in the middle, below 0.50 of the height."""
    pts = [(-0.05, 0.62)]
    for i in range(21):
        x = -0.05 + 1.1 * i / 20
        pts.append((x, 0.50 + 0.10 * ((x - 0.55) / 0.6) ** 2))
    return pts + [(1.05, 1.02), (-0.05, 1.02)]


def plate_back():
    rng = np.random.default_rng(2903)
    im = plate_fin()
    lay = layer(); d = ImageDraw.Draw(lay)
    d.polygon([P(*p) for p in back_poly()], fill=GREY + (255,))
    for r in range(16):                                                  # rows of scale plates to the horizon
        t = r / 15
        y = 0.52 + 0.50 * t ** 1.7
        s = 0.02 + 0.10 * t ** 1.3
        x = rng.uniform(-0.05, 0)
        while x < 1.05:
            w = s * rng.uniform(0.8, 1.3)
            d.arc([*P(x, y - s * 0.3), *P(x + w, y + s * 0.3)], 190, 350, fill=GREY_D + (255,), width=max(2, int(6 * t)))
            x += w * 0.9
    for (x0, x1, y) in ((0.62, 0.95, 0.46), (0.05, 0.22, 0.52)):         # stone ridges
        d.polygon([P(x0, y + 0.05), P((x0 + x1) / 2, y - 0.03), P(x1, y + 0.05)], fill=GREY_D + (255,))
    comp(im, lay, 1.5)
    sh = layer(); d = ImageDraw.Draw(sh)
    d.ellipse([*P(-0.3, 0.45), *P(0.6, 1.2)], fill=(230, 190, 140, 90))                   # warm low light on the left
    comp(im, sh, 60)
    return im


def link3_creature(g, k, shut):
    lay = layer(); d = ImageDraw.Draw(lay)
    # the Core: far back on the ridge at the right, out of reach
    cx, cy, cr = 0.76, 0.30, 0.07
    if k == 'K1':
        for j in range(7):                                               # the cradle of curved ribs
            a = math.pi * (0.15 + 0.7 * j / 6)
            x0, y0 = cx + math.cos(a) * cr * 1.6, 0.47
            x1, y1 = cx + math.cos(a) * cr * 1.25, cy - cr * 1.3 * 1.7
            d.line([P(x0, y0), P((x0 + x1) / 2 + math.cos(a) * 0.02, (y0 + y1) / 2), P(x1, y1)], fill=GREY_D + (255,), width=26)
        d.ellipse([*P(cx - cr, cy - cr * 1.7), *P(cx + cr, cy + cr * 1.7)], fill=(190, 222, 246, 255))
    else:
        for j in range(9):                                               # a tall crystal cluster
            a = -math.pi / 2 + (j - 4) * 0.22
            L = cr * (2.4 + 0.8 * ((j * 7) % 3) / 2)
            bx = cx + (j - 4) * 0.012
            d.polygon([P(bx - 0.018, 0.47), P(bx + math.cos(a) * L * 0.4, 0.47 + math.sin(a) * L * 1.7), P(bx + 0.018, 0.47)],
                      fill=lerp((170, 214, 242), (236, 246, 255), (j % 3) / 2) + (255,))
        for j in range(5):                                               # glowing veins into the rock
            d.line([P(cx, 0.47), P(cx - 0.18 + 0.09 * j, 0.52 + 0.02 * (j % 2))], fill=(150, 200, 236, 220), width=5)
    # Genais: a huge shelled plant-like creature, the ground 0.74 at its foot, left of the Core, right of the party
    gx, gy = 0.55, 0.74
    teal, bone = (52, 92, 98), (214, 206, 186)
    if g == 'G1':                                                        # a spiral conch
        d.ellipse([*P(gx - 0.02, gy - 0.40), *P(gx + 0.13, gy)], fill=teal + (255,))
        for i in range(5):
            r = 0.06 - 0.011 * i
            d.arc([*P(gx + 0.055 - r, gy - 0.22 - r * 1.7), *P(gx + 0.055 + r, gy - 0.22 + r * 1.7)], 200, 520, fill=bone + (255,), width=12)
        for i in range(7):                                               # knobs on the whorl
            a = math.pi * (0.9 + 0.12 * i)
            d.ellipse([*P(gx + 0.055 + math.cos(a) * 0.075 - 0.008, gy - 0.22 + math.sin(a) * 0.128 - 0.014),
                       *P(gx + 0.055 + math.cos(a) * 0.075 + 0.008, gy - 0.22 + math.sin(a) * 0.128 + 0.014)], fill=bone + (255,))
        mouth = (gx - 0.01, gy - 0.12)
        d.ellipse([*P(mouth[0] - 0.035, mouth[1] - 0.10), *P(mouth[0] + 0.035, mouth[1] + 0.10)], fill=(26, 30, 34, 255))
    else:                                                                # a low domed limpet shell, lifted at the front
        d.chord([*P(gx - 0.12, gy - 0.36), *P(gx + 0.14, gy + 0.06)], 180, 360, fill=teal + (255,))
        for i in range(8):
            a = math.pi * (1.05 + 0.9 * i / 7)
            d.line([P(gx + 0.01, gy - 0.30), P(gx + 0.01 + math.cos(a) * 0.13, gy - 0.12 + math.sin(a) * 0.02)], fill=bone + (255,), width=10)
        for i in range(10):
            d.ellipse([*P(gx - 0.10 + 0.022 * i, gy - 0.16 - 0.03 * math.sin(i)), *P(gx - 0.09 + 0.022 * i, gy - 0.14 - 0.03 * math.sin(i))], fill=bone + (255,))
        mouth = (gx - 0.06, gy - 0.07)
        if not shut:
            d.chord([*P(gx - 0.12, gy - 0.10), *P(gx + 0.10, gy + 0.02)], 180, 360, fill=(26, 30, 34, 255))
    if not shut:                                                         # the tentacles and fronds, reaching left
        rng = np.random.default_rng(29 if g == 'G1' else 31)
        for i in range(11):
            a0 = math.pi * (0.75 + 0.5 * rng.uniform())
            L = rng.uniform(0.10, 0.20)
            pts = []
            x, y = mouth
            for j in range(12):
                u = j / 11
                a = a0 + 1.2 * math.sin(u * 3 + i) * u
                x += math.cos(a) * L / 11; y += math.sin(a) * L / 11 * 1.2
                pts.append(P(x, y))
            wdt = int(30 * (1.0 if g == 'G1' else 0.8))
            for j in range(len(pts) - 1):
                d.line([pts[j], pts[j + 1]], fill=lerp((96, 120, 100), (180, 196, 170), j / 11) + (255,), width=max(4, int(wdt * (1 - j / 12))))
            if g == 'G1':                                                # leafy fronds on the plant-like body
                fx, fy = pts[-3]
                d.ellipse([fx - 22, fy - 12, fx + 22, fy + 12], fill=(118, 146, 104, 255))
    return lay, (cx, cy, cr)


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


def deckfill(plate_base):
    """BG-2: the city continued over round 3's painted prow (a sketch of more rooftops, closer), and its mask."""
    rng = np.random.default_rng(2905)
    im = Image.open(plate_base).convert('RGBA').resize((SW, SH))
    lay = layer(); d = ImageDraw.Draw(lay)
    top = 0.72
    d.rectangle([*P(0, top - 0.02), *P(1, 1)], fill=(214, 196, 188, 255))
    for r in range(14):
        t = r / 13
        y = top + 0.30 * t ** 1.2
        s = 1.0 + 1.6 * t
        x = rng.uniform(-0.03, 0.0)
        while x < 1.03:
            w = rng.uniform(0.012, 0.028) * s; h = rng.uniform(0.008, 0.02) * s
            c = lerp((176, 158, 168), (248, 240, 230), rng.uniform(0.5, 1.0))
            d.rectangle([*P(x, y - h), *P(x + w, y + 0.004 * s)], fill=c + (255,))
            d.rectangle([*P(x + w * 0.12, y - h * 0.98), *P(x + w * 0.88, y - h * 0.4)], fill=(78, 104, 160, 255))
            x += w + rng.uniform(0.002, 0.006) * s
    comp(im, lay, 1)
    m = Image.new('L', (SW, SH), 0)
    ImageDraw.Draw(m).polygon([P(-0.02, 0.73), P(0.30, 0.765), P(0.47, 0.74), P(0.64, 0.765), P(1.02, 0.80), P(1.02, 1.02), P(-0.02, 1.02)], fill=255)
    m = m.filter(ImageFilter.MaxFilter(41)).filter(ImageFilter.GaussianBlur(8))
    return im.convert('RGB').resize((W, H), Image.LANCZOS), m.resize((W, H), Image.LANCZOS)


def save_rgba(lay, path):
    lay.resize((W, H), Image.LANCZOS).save(path)


def finish(im):
    out = im.convert('RGB').resize((W, H), Image.LANCZOS)
    a = np.asarray(out, float) + np.random.default_rng(7).normal(0, 3.0, (H, W, 3))
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


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
    if sys.argv[1] == 'head-a':
        prep_a(sys.argv[2], sys.argv[3]); sys.exit(0)
    out = sys.argv[1]
    os.makedirs(out, exist_ok=True)
    finish(plate_fin()).save(f'{out}/plate-fin.png')
    finish(plate_back()).save(f'{out}/plate-back.png')
    geo = {'game': 'FFX only', 'size': [2352, 1344], 'cores': {}}
    for dsg in ('F1', 'F2'):
        for sd in ('L', 'R'):
            for rg in ('NEAR', 'FAR'):
                lay, core = fin_creature(dsg, sd, rg)
                save_rgba(lay, f'{out}/fin-{dsg}-{sd}-{rg}.png')
                geo['cores'][f'fin-{dsg}-{sd}-{rg}'] = [round(core[0] * 2352, 1), round(core[1] * 1344, 1), round(core[2] * 2352, 1)]
    for g, k in (('G1', 'K1'), ('G2', 'K2')):
        for shut in (False, True):
            lay, core = link3_creature(g, k, shut)
            save_rgba(lay, f'{out}/link3-{g}{k}{"-shut" if shut else ""}.png')
        geo['cores'][f'link3-{g}{k}'] = [round(core[0] * 2352, 1), round(core[1] * 1344, 1), round(core[2] * 2352, 1)]
    save_rgba(head_a(), f'{out}/head-a.png')
    geo['headA'] = a_geometry()
    if len(sys.argv) > 2:                                                  # round 3's plate p6 base, for BG-2
        fill, m = deckfill(sys.argv[2])
        fill.save(f'{out}/deckfill.png'); m.save(f'{out}/deckmask.png')
    json.dump(geo, open(f'{out}/geometry.json', 'w'), indent=1)
    print('wrote sketches to', out)
