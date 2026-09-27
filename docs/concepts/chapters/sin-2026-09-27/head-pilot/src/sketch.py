"""Sin head pilot (FFX only, 2026-09-27): our own flat-colour layout sketches, drawn in code.

No image input of any kind. The only references are written ones:
- research/ffx-sin.md section 9.1 and 9.3: link 4 is fought from the Fahrenheit's deck over Bevelle
  at evenfall; Sin has risen with wings and props itself on a tower; the head approaches, then the
  mouth opens in stages until fully open (the mouth is the clock); Gaze is a look from the face.
- FF Wiki "Sin (Final Fantasy X)" section Appearance (revid 4045228, read 2026-09-27 through the
  MediaWiki API, text only): a whale-like body, clawed arms, scales, part of a ruined city carried on
  its body close to the back of the head, and in its final form feathery wing-like protrusions that
  are purple at the tips.

Four options (layout and light, not detail; the painting pass supplies the detail):
  A  dusk leviathan: head-on, front-lit by the low sun, wings spread, propped on a white tower
  B  the maw fills the sky: an extreme close-up; the face runs off three edges, the mouth is a band
  C  three-quarter on the tower: head and neck turned towards the ship, a clawed arm on the tower
  D  backlit silhouette: the sun sets directly behind the head; only the mouth and eyes carry colour

Usage: python sketch.py <out_dir> [A|B|C|D|all] [stage]
  stage = mouth stage 0 (shut) .. 4 (fully open); default 2. Writes sketch-<opt>-m<stage>.png, 1344x768.
"""
import math, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

W, H = 1344, 768
ys, xs = np.mgrid[0:H, 0:W].astype(float)


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def sky(stops):
    """stops: list of (y_frac, rgb). Vertical gradient."""
    img = np.zeros((H, W, 3), float)
    yf = ys / H
    for i in range(len(stops) - 1):
        y0, c0 = stops[i]; y1, c1 = stops[i + 1]
        m = (yf >= y0) & (yf <= y1)
        t = ((yf - y0) / max(1e-6, y1 - y0))[m]
        for k in range(3):
            img[..., k][m] = c0[k] + (c1[k] - c0[k]) * t
    return img


def glow(img, cx, cy, r, col, amt=1.0):
    d = np.hypot(xs - cx, ys - cy) / r
    f = np.clip(1 - d, 0, 1) ** 2 * amt
    img += f[..., None] * np.array(col, float)
    return img


def to_im(a):
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


def deck(d, tone=(52, 54, 62), line=(34, 36, 42), rail=(28, 28, 34), lit=(120, 96, 80)):
    """The Fahrenheit's deck: plating from y=0.72 H down, a guard rail across at 0.62 to 0.70 H."""
    top = int(H * 0.72)
    d.polygon([(0, top + 10), (W, top - 6), (W, H), (0, H)], fill=tone)
    for i in range(1, 9):
        t = i / 9
        y = top + (H - top) * t ** 1.4
        d.line([(0, y + 10 * (1 - t)), (W, y - 6 * (1 - t))], fill=line, width=3)
    for k in range(-10, 12):
        d.line([(W * 0.45 + k * 70, top), (W * 0.45 + k * 210, H)], fill=line, width=2)
    d.line([(0, top + 8), (W, top - 8)], fill=lit, width=4)            # the lit deck edge
    # rail: two bars and posts
    for yy, wdt in ((int(H * 0.615), 9), (int(H * 0.665), 6)):
        d.line([(0, yy + 6), (W, yy - 6)], fill=rail, width=wdt)
    for i in range(8):
        x = 30 + i * 190
        d.rectangle([x, int(H * 0.61) - 6 * (x / W), x + 9, top + 6], fill=rail)


def teeth(d, x0, x1, y, n, h, col, up=False):
    step = (x1 - x0) / n
    for i in range(n):
        a = x0 + i * step
        tip = y - h if up else y + h
        d.polygon([(a + step * 0.12, y), (a + step * 0.88, y), (a + step * 0.5, tip)], fill=col)


def mouth(d, im_arr, cx, cy, half_w, stage, glow_col=(150, 80, 255), inner=(22, 10, 36), tooth=(226, 218, 200)):
    """A wide mouth band centred on (cx, cy). stage 0..4 sets the gape. Returns nothing; draws in place."""
    gape = [6, 30, 62, 100, 150][stage]
    top = cy - gape * 0.35
    bot = cy + gape * 0.65
    pts_top = [(cx - half_w, cy)] + [(cx - half_w + 2 * half_w * t, top - 10 * math.sin(math.pi * t)) for t in np.linspace(0.05, 0.95, 12)] + [(cx + half_w, cy)]
    pts_bot = [(cx + half_w, cy)] + [(cx + half_w - 2 * half_w * t, bot + 16 * math.sin(math.pi * t)) for t in np.linspace(0.05, 0.95, 12)] + [(cx - half_w, cy)]
    d.polygon(pts_top + pts_bot, fill=inner, outline=(12, 8, 14))
    if stage > 0:   # the gravity light inside, brighter as the mouth opens
        my = (top + bot) / 2
        for i in range(10):
            t = i / 10
            rw, rh = half_w * 0.7 * (1 - t), gape * 0.42 * (1 - t)
            c = lerp(inner, glow_col, t * (0.5 + 0.125 * stage))
            d.ellipse([cx - rw, my - rh, cx + rw, my + rh], fill=c)
        c = lerp(glow_col, (250, 240, 255), 0.2 * stage)
        d.ellipse([cx - half_w * 0.08, my - gape * 0.06, cx + half_w * 0.08, my + gape * 0.06], fill=c)
        inset = half_w * 0.08
        teeth(d, cx - half_w + inset, cx + half_w - inset, top + 2, 13, min(26, gape * 0.3), tooth)
        teeth(d, cx - half_w + inset * 1.5, cx + half_w - inset * 1.5, bot - 2, 11, min(22, gape * 0.26), tooth, up=True)


def wing(d, root, ang0, ang1, length, n, base, tip):
    """A feathery fan: n long feathers from root, between angles ang0..ang1 (degrees, screen space)."""
    rx, ry = root
    for i in range(n):
        a = math.radians(ang0 + (ang1 - ang0) * i / max(1, n - 1))
        L = length * (0.75 + 0.25 * math.sin(i * 1.7))
        wdt = length * 0.075
        ex, ey = rx + L * math.cos(a), ry + L * math.sin(a)
        nx, ny = -math.sin(a) * wdt, math.cos(a) * wdt
        mx, my = rx + L * 0.72 * math.cos(a), ry + L * 0.72 * math.sin(a)
        d.polygon([(rx, ry), (mx + nx, my + ny), (ex, ey), (mx - nx, my - ny)], fill=base)
        # purple tips
        tx, ty = rx + L * 0.8 * math.cos(a), ry + L * 0.8 * math.sin(a)
        d.polygon([(tx + nx * 0.8, ty + ny * 0.8), (ex, ey), (tx - nx * 0.8, ty - ny * 0.8)], fill=tip)


def scales(d, cx, top, bottom, half_w_at, col, rows=7):
    for r in range(rows):
        y = top + (bottom - top) * (r + 0.5) / rows
        hw = half_w_at(y)
        n = max(3, int(hw / 42))
        for i in range(-n, n + 1):
            x = cx + i * hw / (n + 0.5)
            d.arc([x - 34, y - 16, x + 34, y + 18], 200, 340, fill=col, width=4)


def spires(d, cx, y, span, col, n=9, seed=3):
    rng = np.random.default_rng(seed)
    for i in range(n):
        x = cx - span / 2 + span * i / (n - 1) + rng.uniform(-10, 10)
        h = rng.uniform(26, 70)
        w = rng.uniform(8, 16)
        d.rectangle([x - w / 2, y - h, x + w / 2, y], fill=col)
        d.polygon([(x - w / 2, y - h), (x, y - h - rng.uniform(4, 16)), (x + w / 2, y - h)], fill=col)


def city(d, y, col, banner, seed=5, x0=0, x1=W):
    """Bevelle on the horizon: pale towers with blue banners."""
    rng = np.random.default_rng(seed)
    x = x0
    while x < x1:
        w = rng.uniform(14, 34); h = rng.uniform(14, 58)
        d.rectangle([x, y - h, x + w, y + 40], fill=col)
        d.polygon([(x, y - h), (x + w / 2, y - h - rng.uniform(10, 40)), (x + w, y - h)], fill=col)
        if rng.uniform() < 0.4:
            d.rectangle([x + w * 0.3, y - h + 10, x + w * 0.7, y - h + 34], fill=banner)
        x += w + rng.uniform(2, 16)


def head_outline(cx, top, chin, half_w):
    """A broad whale-like head seen from the front: a heavy dome brow narrowing to a wide jaw."""
    pts = []
    for t in np.linspace(0, 1, 40):
        a = math.pi * t
        x = cx - half_w * math.cos(a)
        y = top + (chin - top) * 0.30 * (1 - math.sin(a)) ** 0.55
        pts.append((x, y))
    # the right cheek and jaw down to the chin, then back up the left
    right = [(cx + half_w * (1 - 0.18 * s), top + (chin - top) * (0.28 + 0.72 * s)) for s in np.linspace(0, 1, 16)]
    left = [(cx - half_w * (1 - 0.18 * s), top + (chin - top) * (0.28 + 0.72 * s)) for s in np.linspace(1, 0, 16)]
    return pts + right + left


def option_A(stage):
    a = sky([(0, (58, 30, 84)), (0.35, (150, 70, 110)), (0.58, (236, 130, 80)), (0.72, (250, 196, 120)), (1, (120, 80, 70))])
    a = glow(a, W * 0.18, H * 0.62, 420, (90, 60, 20))                  # the sun low on the left, lighting the face
    im = to_im(a); d = ImageDraw.Draw(im)
    city(d, int(H * 0.66), (214, 200, 206), (50, 76, 150))
    cx, top, chin, hw = W * 0.63, H * 0.07, H * 0.60, W * 0.25
    wing(d, (cx - hw * 0.8, top + 200), 150, 228, 440, 11, (64, 56, 78), (150, 70, 200))
    wing(d, (cx + hw * 0.8, top + 200), -48, 30, 440, 11, (64, 56, 78), (150, 70, 200))
    d.rectangle([cx - 46, chin - 20, cx + 46, H * 0.75], fill=(226, 214, 214))          # the tower under the chin
    d.polygon([(cx - 60, chin - 10), (cx, chin - 70), (cx + 60, chin - 10)], fill=(226, 214, 214))
    d.polygon(head_outline(cx, top, chin, hw), fill=(92, 80, 88))
    scales(d, cx, top + 30, chin - 40, lambda y: hw * 0.85, (128, 112, 116))
    spires(d, cx, top + 26, hw * 1.1, (170, 150, 150))                                    # the ruined city on its crown
    d.polygon([(cx - hw * 0.8, top + 120), (cx, top + 150), (cx + hw * 0.8, top + 120), (cx + hw * 0.7, top + 150), (cx, top + 180), (cx - hw * 0.7, top + 150)], fill=(62, 52, 60))  # brow ridge
    for s in (-1, 1):
        d.ellipse([cx + s * hw * 0.42 - 26, top + 168, cx + s * hw * 0.42 + 26, top + 186], fill=(250, 214, 110))
    mouth(d, a, cx, H * 0.43, hw * 0.78, stage)
    deck(d, lit=(200, 130, 90))
    return im, 'A'


def option_B(stage):
    a = sky([(0, (18, 20, 48)), (0.4, (60, 52, 110)), (0.62, (150, 110, 170)), (1, (60, 50, 80))])
    im = to_im(a); d = ImageDraw.Draw(im)
    city(d, int(H * 0.70), (150, 150, 180), (40, 60, 130), seed=9)
    cx = W * 0.5
    # the face: wider than the frame, off the top, left and right edges
    d.polygon([(-80, -20), (W + 80, -20), (W + 80, H * 0.60), (W * 0.82, H * 0.66), (W * 0.18, H * 0.66), (-80, H * 0.60)], fill=(70, 66, 86))
    scales(d, cx, 0, H * 0.24, lambda y: W * 0.62, (104, 98, 124), rows=3)
    d.polygon([(-80, H * 0.12), (cx, H * 0.18), (W + 80, H * 0.12), (W + 80, H * 0.2), (cx, H * 0.25), (-80, H * 0.2)], fill=(44, 40, 58))
    for s in (-1, 1):
        d.ellipse([cx + s * W * 0.34 - 38, H * 0.105, cx + s * W * 0.34 + 38, H * 0.14], fill=(255, 220, 120))
    mouth(d, a, cx, H * 0.40, W * 0.47, stage)
    scales(d, cx, H * 0.52, H * 0.64, lambda y: W * 0.34, (96, 90, 116), rows=2)
    deck(d, tone=(44, 46, 58), lit=(150, 120, 200))
    return im, 'B'


def option_C(stage):
    a = sky([(0, (90, 70, 120)), (0.3, (220, 150, 110)), (0.55, (255, 200, 130)), (0.7, (250, 220, 170)), (1, (150, 110, 90))])
    a = glow(a, W * 0.05, H * 0.35, 520, (80, 50, 10))
    im = to_im(a); d = ImageDraw.Draw(im)
    city(d, int(H * 0.68), (224, 214, 210), (50, 76, 150), seed=11)
    # wings raised behind, top right
    wing(d, (W * 0.78, H * 0.30), -150, -60, 520, 11, (84, 70, 88), (160, 80, 210))
    # neck from the lower right up to the head
    d.polygon([(W * 1.05, H * 0.35), (W * 1.05, H * 0.80), (W * 0.78, H * 0.72), (W * 0.62, H * 0.52), (W * 0.70, H * 0.30)], fill=(96, 82, 86))
    # the tower and the clawed arm gripping it
    d.rectangle([W * 0.56, H * 0.50, W * 0.63, H * 0.75], fill=(232, 222, 222))
    d.polygon([(W * 0.55, H * 0.5), (W * 0.595, H * 0.40), (W * 0.64, H * 0.5)], fill=(232, 222, 222))
    d.polygon([(W * 0.78, H * 0.62), (W * 0.64, H * 0.53), (W * 0.60, H * 0.56), (W * 0.62, H * 0.60), (W * 0.66, H * 0.64)], fill=(80, 68, 74))
    for k in range(3):
        d.polygon([(W * 0.60 - k * 4, H * (0.53 + k * 0.03)), (W * 0.55 - k * 4, H * (0.55 + k * 0.03)), (W * 0.60 - k * 4, H * (0.56 + k * 0.03))], fill=(30, 26, 30))
    # the head, three-quarter, turned left towards the ship: long upper jaw, heavy brow
    hx, hy = W * 0.56, H * 0.28
    head = [(W * 0.74, H * 0.08), (W * 0.60, H * 0.06), (W * 0.44, H * 0.14), (W * 0.33, H * 0.26), (W * 0.32, H * 0.34),
            (W * 0.42, H * 0.44), (W * 0.58, H * 0.50), (W * 0.72, H * 0.46), (W * 0.80, H * 0.30)]
    d.polygon(head, fill=(104, 88, 92))
    scales(d, W * 0.62, H * 0.1, H * 0.3, lambda y: W * 0.1, (136, 118, 116), rows=4)
    spires(d, W * 0.66, H * 0.09, W * 0.14, (180, 160, 150), n=7, seed=4)
    d.ellipse([W * 0.47 - 18, H * 0.20 - 9, W * 0.47 + 18, H * 0.20 + 9], fill=(255, 216, 110))
    d.polygon([(W * 0.38, H * 0.19), (W * 0.52, H * 0.16), (W * 0.60, H * 0.19), (W * 0.50, H * 0.21)], fill=(70, 58, 64))
    # the mouth in profile: a long jaw line opening by stage
    g = [4, 22, 44, 70, 100][stage]
    jaw = [(W * 0.34, H * 0.31), (W * 0.62, H * 0.33), (W * 0.64, H * 0.35), (W * 0.62, H * 0.33 + g * 0.8), (W * 0.38, H * 0.31 + g)]
    d.polygon(jaw, fill=(24, 12, 36))
    if stage:
        teeth(d, W * 0.36, W * 0.60, H * 0.31 + 2, 10, min(18, g * 0.35), (230, 220, 200))
    deck(d, lit=(220, 160, 100))
    return im, 'C'


def option_D(stage):
    a = sky([(0, (40, 22, 60)), (0.3, (120, 50, 90)), (0.5, (240, 120, 70)), (0.62, (255, 210, 140)), (0.75, (200, 110, 80)), (1, (60, 36, 46))])
    cx, top, chin, hw = W * 0.60, H * 0.06, H * 0.62, W * 0.26
    a = glow(a, cx, H * 0.40, 560, (120, 80, 30), 1.2)                   # the sun directly behind the head
    im = to_im(a); d = ImageDraw.Draw(im)
    city(d, int(H * 0.68), (70, 44, 56), (40, 26, 50), seed=13)
    wing(d, (cx - hw * 0.8, top + 210), 150, 228, 480, 11, (40, 24, 40), (190, 90, 255))
    wing(d, (cx + hw * 0.8, top + 210), -48, 30, 480, 11, (40, 24, 40), (190, 90, 255))
    d.rectangle([cx - 40, chin - 20, cx + 40, H * 0.75], fill=(46, 30, 40))
    outline = head_outline(cx, top, chin, hw)
    d.polygon(outline, fill=(255, 196, 120))                                                   # rim
    d.polygon(head_outline(cx, top + 8, chin - 6, hw - 8), fill=(34, 24, 34))
    spires(d, cx, top + 30, hw * 1.1, (34, 24, 34))
    for s in (-1, 1):
        d.ellipse([cx + s * hw * 0.42 - 24, top + 170, cx + s * hw * 0.42 + 24, top + 186], fill=(255, 230, 150))
    mouth(d, a, cx, H * 0.45, hw * 0.78, stage, glow_col=(190, 90, 255), inner=(90, 30, 150), tooth=(120, 100, 110))
    deck(d, tone=(30, 24, 32), line=(20, 16, 22), rail=(12, 10, 14), lit=(255, 170, 110))
    return im, 'D'


def main():
    out = sys.argv[1]
    which = (sys.argv[2] if len(sys.argv) > 2 else 'all').upper()
    stage = int(sys.argv[3]) if len(sys.argv) > 3 else 2
    os.makedirs(out, exist_ok=True)
    fns = {'A': option_A, 'B': option_B, 'C': option_C, 'D': option_D}
    for k in (fns if which == 'ALL' else [which]):
        im, name = fns[k](stage)
        im = im.filter(ImageFilter.GaussianBlur(2.0))
        p = os.path.join(out, f'sketch-{name}-m{stage}.png')
        im.save(p)
        print(p)


main()
