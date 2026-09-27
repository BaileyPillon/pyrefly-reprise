"""Sin's head, round 3 (FFX only, 2026-09-27): our own layout sketches for the LAYERED RIG, drawn in code.

No image input of any kind. Written references only:
- research/ffx-sin.md 9.1: link 4 is fought from the Fahrenheit's deck. Sin has risen with wings and props itself
  on a tower in Bevelle, and the ship closes nose to nose with it.
- research/ffx-sin.md 9.3: the mouth opens in stages until fully open; the mouth IS the clock.
- research/ffx-evrae-airship.md 12.1 and 12.3: the steel foredeck, lettered plating, a gold dial; Bevelle white and
  tiered, with spires.

Round 3 changes from round 2's sketch (see ../METHOD-CHECK.md and the judge's round-2 findings):
- no buildings on Sin
- a tall slender white tower, its whole height in the frame, with a flat round top under the claw
- two opaque wings, each growing from a scaled shoulder joint, with sky between them
- a dark organic throat and a tongue, with no ribs or folds
- a snout the same grey as the head

Outputs (base 1344x768) into <out_dir>:
  sketch-plate.png   sky, city, tower, deck: NO creature (the plate job paints this)
  sketch-sin.png     the plate sketch with the creature drawn in, mouth FULLY OPEN (OPEN_DEG)
  sketch-shut.png    the same creature drawn with the jaw shut, only to check the rig against (never rendered)
  rig.json           the rig geometry in full-size painting pixels (2352x1344): hinge, open angle, polygons
The sky, city, tower and deck come from round 2's helpers (read only), with the same random stream, so the plate
and the creature sketch are identical outside the creature.
Usage: python sketch.py <out_dir>
"""
import json, math, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'head-round2', 'src'))
import sketch as r2  # sky_and_city, clouds, prow, layer, comp, lerp (read only)

W, H, S = 1344, 768, 2
SW, SH = W * S, H * S
K = 2352 / 1344                      # base -> full painting pixels
OPEN_DEG = 24
HINGE = (960, 250)

# ---- geometry, base pixels, jaw SHUT ----------------------------------------------------------------------------
UPPER_LIP = [(548, 214), (620, 224), (720, 234), (820, 242), (900, 247), (960, 250)]
LOWER_LIP = [(552, 218), (620, 228), (720, 238), (820, 246), (900, 251), (960, 254)]
JAW_UNDER = [(1000, 300), (985, 306), (950, 312), (880, 318), (780, 312), (680, 296), (610, 272), (568, 250), (552, 232)]
SKULL_TOP = [(548, 214), (537, 203), (535, 188), (545, 172), (575, 156), (630, 138), (700, 120), (780, 104), (860, 92),
             (940, 86), (1010, 88), (1070, 98)]
HEAD_BACK = [(1070, 98), (1096, 140), (1084, 220), (1040, 296), (1010, 314), (990, 300), (972, 266)]
BODY = [(1040, 104), (1140, 118), (1210, 106), (1290, 100), (1400, 106), (1480, 112), (1480, 290), (1400, 286), (1220, 290), (1100, 300), (1030, 306)]
TOOTH = 16                            # tooth height, base px
CLAW_X, CLAW_Y, TOWER_BOTTOM = 1110, 340, 640         # the claw in Sin space; the tower's top is placed under it


def Q(x, y):
    return (x * S, y * S)


SIN_ANCHOR, SIN_SCALE, SIN_SHIFT = (540, 300), 0.86, (20, 12)    # Sin space -> picture (base px): smaller and lower, so both wings fit; v2 puts the claw on the painted tower top of plate p6


def T(p):
    return (SIN_ANCHOR[0] + (p[0] - SIN_ANCHOR[0]) * SIN_SCALE + SIN_SHIFT[0], SIN_ANCHOR[1] + (p[1] - SIN_ANCHOR[1]) * SIN_SCALE + SIN_SHIFT[1])


def QS(x, y):
    return Q(*T((x, y)))


def rot(p, deg):
    """Turn a point about the hinge; positive = the jaw drops (the chin moves down)."""
    a = math.radians(deg)
    dx, dy = p[0] - HINGE[0], p[1] - HINGE[1]
    return (HINGE[0] + dx * math.cos(a) + dy * math.sin(a), HINGE[1] - dx * math.sin(a) + dy * math.cos(a))


def jaw_poly(deg):
    return [rot(p, deg) for p in LOWER_LIP + JAW_UNDER]


def mouth_poly(deg):
    return UPPER_LIP + [rot(p, deg) for p in LOWER_LIP[::-1]]


def skull_poly():
    """The head (skull, upper jaw, the cheek that covers the hinge): the layer on top of the jaw."""
    return SKULL_TOP + HEAD_BACK + UPPER_LIP[::-1][:-1]


# ---- drawing -----------------------------------------------------------------------------------------------------
def tower(base):
    """The tall white tower Sin props itself on: slender, gold bands, blue windows, a flat round top (base px)."""
    lay = r2.layer(); d = ImageDraw.Draw(lay)
    lit, shade, gold = (246, 242, 234), (182, 172, 186), (216, 174, 72)
    (x, top), bot = T((CLAW_X, CLAW_Y)), TOWER_BOTTOM
    n = 30
    for i in range(n):
        y0 = bot + (top - bot) * i / n; y1 = bot + (top - bot) * (i + 1) / n
        w0 = 30 - 12 * i / n; w1 = 30 - 12 * (i + 1) / n
        d.polygon([Q(x - w0, y0), Q(x + w0, y0), Q(x + w1, y1), Q(x - w1, y1)], fill=lit + (255,))
        d.polygon([Q(x + w0 * 0.35, y0), Q(x + w0, y0), Q(x + w1, y1), Q(x + w1 * 0.35, y1)], fill=shade + (255,))
        if i % 5 == 3:
            d.rectangle([*Q(x - w0 * 1.15, y0 - 5), *Q(x + w0 * 1.15, y0)], fill=gold + (255,))
        if i % 3 == 1:
            d.rectangle([*Q(x - w0 * 0.5, y0 - 9), *Q(x - w0 * 0.15, y0 - 2)], fill=(64, 86, 138, 255))
    # the flat round top: a gold ring and a pale drum, where the claw closes
    d.ellipse([*Q(x - 24, top - 8), *Q(x + 24, top + 8)], fill=gold + (255,))
    d.ellipse([*Q(x - 20, top - 6), *Q(x + 20, top + 4)], fill=lit + (255,))
    r2.comp(base, lay, 0.6)


def wing(base, root, a0, a1, length, n, dark, mid, tip):
    """An opaque feathered wing: a fan of long overlapping feathers from a scaled shoulder joint at `root` (base px),
    over a solid dark vane so no sky shows through, tips purple. Angles in degrees, screen space (270 = straight up)."""
    lay = r2.layer(); d = ImageDraw.Draw(lay)
    rx, ry = root
    vane = [QS(rx, ry)]
    for i in range(24):
        a = math.radians(a0 + (a1 - a0) * i / 23)
        vane.append(QS(rx + length * 0.8 * math.cos(a), ry + length * 0.8 * math.sin(a)))
    d.polygon(vane, fill=dark + (255,))
    for i in range(n):
        u = i / (n - 1)
        a = math.radians(a0 + (a1 - a0) * u)
        L = length * (0.86 + 0.14 * math.sin(u * math.pi))
        wd = length * 0.10
        ex, ey = rx + L * math.cos(a), ry + L * math.sin(a)
        nx, ny = -math.sin(a) * wd, math.cos(a) * wd
        mx, my = rx + L * 0.62 * math.cos(a), ry + L * 0.62 * math.sin(a)
        col = r2.lerp(dark, mid, 0.25 + 0.6 * abs(math.sin(i * 1.7)))
        d.polygon([QS(rx, ry), QS(mx + nx, my + ny), QS(ex, ey), QS(mx - nx, my - ny)], fill=col + (255,))
        tx, ty = rx + L * 0.76 * math.cos(a), ry + L * 0.76 * math.sin(a)
        d.polygon([QS(tx + nx * 0.8, ty + ny * 0.8), QS(ex, ey), QS(tx - nx * 0.8, ty - ny * 0.8)], fill=tip + (255,))
        d.line([QS(rx, ry), QS(ex, ey)], fill=r2.lerp(col, (0, 0, 0), 0.45) + (255,), width=3)
    d.ellipse([*QS(rx - 36, ry - 30), *QS(rx + 36, ry + 30)], fill=dark + (255,))        # the shoulder joint
    d.arc([*QS(rx - 36, ry - 30), *QS(rx + 36, ry + 30)], 180, 300, fill=r2.lerp(dark, (170, 150, 125), 0.5) + (255,), width=6)
    r2.comp(base, lay, 1.0)


GREY, GREY_D, GREY_L = (86, 82, 94), (58, 54, 66), (150, 138, 128)


def body_and_arm(base):
    lay = r2.layer(); d = ImageDraw.Draw(lay)
    d.polygon([QS(*p) for p in BODY], fill=GREY_D + (255,))
    # the arm from under the neck down to the claw on the tower's flat top
    x, t = CLAW_X, CLAW_Y
    d.polygon([QS(1270, 280), QS(1200, 288), QS(1160, 320), QS(x + 20, t - 16), QS(x + 30, t + 6), QS(1190, 350), QS(1250, 300)], fill=GREY_D + (255,))
    d.line([QS(1262, 284), QS(x + 26, t - 12)], fill=GREY_L + (200,), width=6)
    for k, (fx, fy) in enumerate([(x - 30, t - 4), (x - 26, t + 12), (x - 12, t + 22), (x + 16, t + 24)]):   # four talons
        d.polygon([QS(x + 16, t - 12 + 5 * k), QS(fx, fy), QS(fx + 4, fy + 10), QS(x + 26, t + 2 + 4 * k)], fill=GREY_D + (255,))
        d.polygon([QS(fx + 2, fy), QS(fx - 5, fy + 13), QS(fx + 6, fy + 9)], fill=(26, 22, 28, 255))
    r2.comp(base, lay, 0.8)


def throat(base, deg):
    """The mouth interior between the upper lip and the lower lip at `deg`: dark wet flesh, a tongue lying in the
    lower jaw, a violet glow deep in the throat. Smooth: no ribs, bars or folds."""
    if deg <= 0:
        return
    k = deg / OPEN_DEG
    mouth = [QS(*p) for p in mouth_poly(deg)]
    lay = r2.layer(); d = ImageDraw.Draw(lay)
    d.polygon(mouth, fill=(44, 16, 34, 255))
    g = r2.layer(); dg = ImageDraw.Draw(g)
    cx, cy = rot((930, 258), deg * 0.5)
    dg.ellipse([*QS(cx - 160, cy - 60), *QS(cx + 50, cy + 60)], fill=(170, 80, 240, 200))
    dg.ellipse([*QS(cx - 80, cy - 26), *QS(cx + 20, cy + 26)], fill=(236, 190, 255, 220))
    g = g.filter(ImageFilter.GaussianBlur(26))
    lay.alpha_composite(g)
    tg = r2.layer(); dt = ImageDraw.Draw(tg)
    tongue = [rot(p, deg * 0.92) for p in [(600, 238), (700, 236), (820, 238), (900, 244), (900, 254), (820, 252), (700, 250), (610, 246)]]
    tongue = [(p[0], p[1] - 14 * k) for p in tongue]
    dt.polygon([QS(*p) for p in tongue], fill=(120, 44, 66, 255))
    tg = tg.filter(ImageFilter.GaussianBlur(6))
    lay.alpha_composite(tg)
    m = Image.new('L', (SW, SH), 0); ImageDraw.Draw(m).polygon(mouth, fill=255)
    lay.putalpha(Image.fromarray(np.minimum(np.asarray(lay.split()[3]), np.asarray(m))))
    base.alpha_composite(lay)
    # the upper teeth hang from the upper lip (they stay with the skull; the rig keeps them in the static throat layer)
    t = r2.layer(); d = ImageDraw.Draw(t)
    for i in range(15):
        u = (i + 0.4) / 15
        x, y = UPPER_LIP[0][0] + (955 - UPPER_LIP[0][0]) * u, UPPER_LIP[0][1] + (250 - UPPER_LIP[0][1]) * u
        h = TOOTH * (1.15 - 0.5 * u)
        d.polygon([QS(x - 7, y - 1), QS(x + 7, y - 1), QS(x, y + h)], fill=(232, 224, 208, 255))
    r2.comp(base, t, 0.6)


def jaw(base, deg):
    lay = r2.layer(); d = ImageDraw.Draw(lay)
    d.polygon([QS(*p) for p in jaw_poly(deg)], fill=GREY + (255,))
    # a lit band along the jaw's outer face and pleated grooves along the underside
    band = [(560, 226), (680, 240), (820, 250), (930, 258), (960, 280), (880, 296), (760, 290), (640, 270), (570, 244)]
    d.polygon([QS(*rot(p, deg)) for p in band], fill=r2.lerp(GREY, GREY_L, 0.45) + (255,))
    for i in range(12):
        u = i / 11
        a = rot((590 + 360 * u, 262 + 34 * u - 14 * u * u), deg)
        b = rot((600 + 370 * u, 282 + 30 * u - 10 * u * u), deg)
        d.line([QS(*a), QS(*b)], fill=GREY_D + (230,), width=5)
    for i in range(8):                                        # rock plates on the jaw
        u = (i + 0.5) / 8
        c = rot((580 + 360 * u, 246 + 22 * u), deg)
        d.arc([*QS(c[0] - 18, c[1] - 11), *QS(c[0] + 18, c[1] + 11)], 20, 160, fill=GREY_D + (190,), width=4)
    # the lower teeth stand up from the lower lip
    for i in range(14):
        u = (i + 0.6) / 14
        x, y = rot((LOWER_LIP[0][0] + (950 - LOWER_LIP[0][0]) * u, LOWER_LIP[0][1] + (254 - LOWER_LIP[0][1]) * u), deg)
        h = TOOTH * (1.05 - 0.45 * u)
        a = math.radians(deg)
        up = (-math.sin(a) * h, -math.cos(a) * h)
        side = (math.cos(a) * 7, -math.sin(a) * 7)
        d.polygon([QS(x - side[0], y - side[1]), QS(x + side[0], y + side[1]), QS(x + up[0], y + up[1])], fill=(222, 212, 196, 255))
    r2.comp(base, lay, 0.8)


def skull(base):
    poly = [QS(*p) for p in skull_poly()]
    lay = r2.layer(); d = ImageDraw.Draw(lay)
    d.polygon(poly, fill=GREY + (255,))
    r2.comp(base, lay, 0.8)
    sh = r2.layer(); d = ImageDraw.Draw(sh)
    d.ellipse([*QS(520, 120), *QS(860, 250)], fill=GREY_L + (170,))          # low sun on the snout and brow (grey, not pink)
    d.ellipse([*QS(1000, 80), *QS(1400, 360)], fill=GREY_D + (170,))
    sh = sh.filter(ImageFilter.GaussianBlur(40))
    m = Image.new('L', (SW, SH), 0); ImageDraw.Draw(m).polygon(poly, fill=255)
    sh.putalpha(Image.fromarray(np.minimum(np.asarray(sh.split()[3]), np.asarray(m))))
    base.alpha_composite(sh)
    dt = r2.layer(); d = ImageDraw.Draw(dt)
    for r in range(4):                                         # rock scales over the skull
        for c in range(13):
            x = 600 + 46 * c + (r % 2) * 23
            ytop = 150 - 56 * (x - 600) / 460 if x < 1060 else 96
            y = max(ytop, 92) + 32 * r + 16
            if y > 232 - 0.01 * (x - 548) * 0 or x > 1300:
                continue
            d.arc([*QS(x - 20, y - 13), *QS(x + 20, y + 13)], 20, 160, fill=GREY_D + (160,), width=4)
    for i in range(9):                                         # a ridge of short stone spikes on the snout and brow
        x = 560 + 56 * i
        y = 162 - 72 * (x - 560) / 460 if x < 1020 else 90
        d.polygon([QS(x - 9, y + 4), QS(x + 2, y - 16), QS(x + 10, y + 4)], fill=GREY_D + (255,))
    d.polygon([QS(700, 158), QS(820, 132), QS(850, 146), QS(726, 176)], fill=GREY_L + (255,))          # brow ridge
    d.ellipse([*QS(736, 170), *QS(808, 206)], fill=(24, 20, 28, 255))                              # eye socket
    d.polygon([QS(748, 190), QS(772, 179), QS(798, 188), QS(772, 199)], fill=(255, 196, 84, 255))      # the amber eye
    d.ellipse([*QS(768, 184), *QS(776, 195)], fill=(40, 20, 10, 255))
    d.ellipse([*QS(566, 184), *QS(578, 192)], fill=(34, 30, 38, 255))                              # nostril
    d.line([QS(*p) for p in UPPER_LIP], fill=GREY_D + (255,), width=5)                            # the lip line
    r2.comp(base, dt, 1)


def draw(with_sin, deg=OPEN_DEG):
    rng = np.random.default_rng(2027)
    im = r2.sky_and_city(rng)
    tower(im)
    if with_sin:
        wing(im, (1300, 108), 258, 336, 240, 11, (74, 68, 82), (108, 100, 114), (150, 70, 210))          # far wing (right)
        body_and_arm(im)
        wing(im, (1150, 124), 196, 282, 270, 13, (60, 56, 70), (112, 104, 118), (156, 72, 218))         # near wing (left)
        throat(im, deg)
        jaw(im, deg)
        skull(im)
    r2.prow(im, (86, 90, 104), (136, 132, 140), (44, 46, 56), (34, 34, 42), (230, 180, 130), (214, 172, 70))
    out = im.convert('RGB').resize((W, H), Image.LANCZOS)
    a = np.asarray(out, float) + np.random.default_rng(7).normal(0, 3.0, (H, W, 3))
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


def deck_poly():
    """The deck and its railings, as round 2's prow() draws them (normalised tip (0.47, 0.76), rail posts 0.03 + 0.07 t
    tall): everything below the rail tops, in base px, with a small margin above."""
    tip, L0, R0 = (0.47, 0.76), (-0.08, 0.95), (1.08, 0.95)
    pts = []
    for side, rng_ in ((L0, range(10, -1, -1)), (R0, range(0, 11))):
        for i in rng_:
            t = i / 10
            x = tip[0] + (side[0] - tip[0]) * t; y = tip[1] + (side[1] - tip[1]) * t - (0.03 + 0.07 * t) - 0.008
            pts.append((x * W, y * H))
    return pts + [(1.08 * W, 1.0 * H), (-0.08 * W, 1.0 * H)]


def rig_json():
    f = lambda pts: [[round(T(p)[0] * K, 1), round(T(p)[1] * K, 1)] for p in pts]
    tx, tt = T((CLAW_X, CLAW_Y))
    return {'game': 'FFX only', 'size': [2352, 1344], 'hinge': f([HINGE])[0], 'openDeg': OPEN_DEG,
            'stageDeg': [0, 6, 12, 18, 24], 'tooth': TOOTH * SIN_SCALE * K,
            'jawOpen': f(jaw_poly(OPEN_DEG)), 'mouthOpen': f(mouth_poly(OPEN_DEG)), 'head': f(skull_poly()),
            'upperLip': f(UPPER_LIP), 'lowerLipOpen': f([rot(p, OPEN_DEG) for p in LOWER_LIP]),
            'tower': {'x': tx * K, 'top': tt * K, 'bottom': TOWER_BOTTOM * K},
            'deck': [[round(x * K, 1), round(y * K, 1)] for x, y in deck_poly()]}


if __name__ == '__main__':
    out = sys.argv[1]
    os.makedirs(out, exist_ok=True)
    draw(False).save(os.path.join(out, 'sketch-plate.png'))
    draw(True).save(os.path.join(out, 'sketch-sin.png'))
    draw(True, 0).save(os.path.join(out, 'sketch-shut.png'))
    json.dump(rig_json(), open(os.path.join(out, 'rig.json'), 'w'), indent=1)
    print('wrote sketches and rig.json to', out)
