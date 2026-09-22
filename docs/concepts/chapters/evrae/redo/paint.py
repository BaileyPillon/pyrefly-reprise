"""Rough composition sketches for the Evrae redo (FFX only), painted in PIL.
They carry layout and colour only; img2img at denoise 0.6-0.7 repaints them.
  sketches/idle-far.png       1216x832  a thin diagonal streak, small head at the
                                        upper-left end, body tapering to the tail
                                        fin, lots of empty field around it
  sketches/breath-charge.png  1216x832  the picked concept's coil (one head) with a
                                        swollen, lit orange-yellow throat under the jaw
  sketches/chapter-card.png   1344x768  deck rail in the foreground, the ship's prow
                                        at frame-left, open warm-to-cold sky, the wyrm
                                        a teal diagonal alongside on the right
Colours are sampled by eye from docs/concepts/chapters/evrae/renders/evrae-b.png."""
import math, random
from PIL import Image, ImageDraw, ImageFilter

TEAL = (38, 118, 128); TEAL_HI = (86, 170, 172); NAVY = (18, 40, 62)
TAN = (214, 168, 118); RED = (200, 52, 40); ORANGE = (240, 130, 50); YEL = (255, 214, 110)
OUT = "docs/concepts/chapters/evrae/redo/sketches/"

def bez(p, t):
    (x0, y0), (x1, y1), (x2, y2), (x3, y3) = p
    u = 1 - t
    return (u**3*x0 + 3*u*u*t*x1 + 3*u*t*t*x2 + t**3*x3, u**3*y0 + 3*u*u*t*y1 + 3*u*t*t*y2 + t**3*y3)

def serpent(d, ctrl, r0, r1, n=400, spines=True, head=True, scale=1.0):
    pts = [bez(ctrl, i / n) for i in range(n + 1)]
    rad = [r0 + (r1 - r0) * (i / n) ** 0.8 for i in range(n + 1)]
    for layer, col, dr, off in ((0, NAVY, 2.5, 0), (1, TAN, 0, 0.45), (2, TEAL, 0, -0.18), (3, TEAL_HI, -0.62, -0.5)):
        for i, (x, y) in enumerate(pts):
            if i == 0: continue
            px, py = pts[i - 1]; tx, ty = x - px, y - py; L = math.hypot(tx, ty) or 1
            nx, ny = -ty / L, tx / L          # normal
            if ny < 0: nx, ny = -nx, -ny      # point "down" (belly side)
            r = rad[i] * (1 + (dr if dr < 0 else 0)) + (dr if dr > 0 else 0) * scale
            if layer == 1: r = rad[i] * 0.72
            if layer == 2: r = rad[i] * 0.86
            cx, cy = x + nx * off * rad[i], y + ny * off * rad[i]
            d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=col)
    if spines:
        for i in range(8, n, 9):
            x, y = pts[i]; px, py = pts[i - 1]; tx, ty = x - px, y - py; L = math.hypot(tx, ty) or 1
            nx, ny = -ty / L, tx / L
            if ny > 0: nx, ny = -nx, -ny      # back side (up)
            r = rad[i]; h = r * 1.3 + 3 * scale
            bx, by = x + nx * r * 0.8, y + ny * r * 0.8
            tip = (bx + nx * h - tx / L * h * 0.5, by + ny * h - ty / L * h * 0.5)
            d.polygon([(bx - tx / L * r * 0.5, by - ty / L * r * 0.5), (bx + tx / L * r * 0.5, by + ty / L * r * 0.5), tip],
                      fill=RED if (i // 9) % 2 else ORANGE)
    # tail fin
    x, y = pts[-1]; r = rad[-1]
    d.polygon([(x - r, y - r), (x + 9 * r, y - 4 * r), (x + 7 * r, y + 3 * r)], fill=ORANGE)
    if head:
        x, y = pts[0]; px, py = pts[6]; ang = math.atan2(y - py, x - px)
        L = r0 * 3.4; W = r0 * 1.2
        def rot(a, b): return (x + a * math.cos(ang) - b * math.sin(ang), y + a * math.sin(ang) + b * math.cos(ang))
        d.polygon([rot(-r0 * 0.3, -W), rot(L, -W * 0.25), rot(L * 1.05, W * 0.2), rot(L * 0.3, W * 0.9), rot(-r0 * 0.3, W)], fill=NAVY)
        d.polygon([rot(0, -W * 0.8), rot(L * 0.95, -W * 0.15), rot(L * 0.95, W * 0.12), rot(L * 0.3, W * 0.65), rot(0, W * 0.8)], fill=TEAL)
        for k in range(3):
            d.polygon([rot(r0 * (0.2 + 0.5 * k), -W * 0.7), rot(r0 * (0.6 + 0.5 * k), -W * 0.7), rot(-r0 * (1.2 - 0.3 * k), -W * (2.4 - 0.3 * k))], fill=RED)
        ex, ey = rot(L * 0.45, -W * 0.3); e = max(2, r0 * 0.22)
        d.ellipse([ex - e, ey - e, ex + e, ey + e], fill=ORANGE)
    return pts

def idle_far():
    im = Image.new("RGB", (1216, 832), (255, 255, 255)); d = ImageDraw.Draw(im)
    # head small at upper left, the body a long slender diagonal to the lower right
    serpent(d, [(230, 250), (560, 200), (620, 560), (1010, 600)], 22, 7, scale=0.8)
    return im.filter(ImageFilter.GaussianBlur(0.8))

def breath_charge():
    im = Image.open("docs/concepts/chapters/evrae/redo/refs/evrae-b-init.png").convert("RGB")
    # swollen throat under the jaw: a bulge, hot centre, orange rim, teal lip on top
    glow = Image.new("RGBA", im.size, (0, 0, 0, 0)); g = ImageDraw.Draw(glow)
    cx, cy = 360, 238
    for k in range(22, 0, -1):
        t = k / 22
        col = tuple(int(YEL[j] * (1 - t) + ORANGE[j] * t) for j in range(3))
        g.ellipse([cx - 62 * t - 8, cy - 40 * t - 6, cx + 62 * t + 8, cy + 44 * t + 6], fill=col + (255,))
    glow = glow.filter(ImageFilter.GaussianBlur(3))
    im.paste(glow, (0, 0), glow)
    d = ImageDraw.Draw(im)
    d.arc([cx - 72, cy - 52, cx + 72, cy + 54], 200, 340, fill=NAVY, width=4)
    return im

def chapter_card():
    W, H = 1344, 768
    im = Image.new("RGB", (W, H)); d = ImageDraw.Draw(im)
    for y in range(H):  # cold zenith into a warm low band
        t = y / H
        top, low = (70, 120, 190), (250, 200, 160)
        d.line([(0, y), (W, y)], fill=tuple(int(top[j] * (1 - t**1.6) + low[j] * t**1.6) for j in range(3)))
    rnd = random.Random(7)
    cl = Image.new("RGBA", (W, H), (0, 0, 0, 0)); c = ImageDraw.Draw(cl)
    for _ in range(40):  # cloud banks, far and mid
        x, y = rnd.randint(-100, W), rnd.randint(380, 640); w, h = rnd.randint(120, 320), rnd.randint(30, 70)
        c.ellipse([x, y, x + w, y + h], fill=(255, 246, 236, 200))
    mask = cl.split()[3].filter(ImageFilter.GaussianBlur(10))
    im.paste(Image.new("RGB", (W, H), (255, 246, 236)), (0, 0), mask)
    d = ImageDraw.Draw(im)
    # the wyrm alongside: a teal diagonal on the right, head toward the ship (left)
    # the wyrm: the picked FAR cutout itself (idle-far candidate r2/2, de-matted), so the
    # card's creature is already on-model before img2img touches it
    wy = Image.open("docs/concepts/chapters/evrae/redo/refs/idle-far-pick-dematted.png").convert("RGBA")
    wy = wy.resize((780, int(wy.height * 780 / wy.width)), Image.LANCZOS)
    im.paste(wy, (560, 120), wy)
    d = ImageDraw.Draw(im)
    # the ship's prow at frame-left, dark hull
    d.polygon([(0, 330), (260, 400), (420, 470), (360, 520), (0, 560)], fill=(52, 50, 58))
    d.polygon([(0, 330), (260, 400), (420, 470), (300, 452), (0, 380)], fill=(92, 86, 90))
    # foredeck plating across the bottom, rivet lines to a vanishing point
    d.polygon([(0, 600), (W, 640), (W, H), (0, H)], fill=(128, 134, 142))
    for k in range(0, W + 400, 110):
        d.line([(k - 200, H), (k * 0.6 + 200, 600 + k * 0.03)], fill=(84, 88, 96), width=3)
        for t in range(1, 6):  # rivets along each seam
            x = (k - 200) + ((k * 0.6 + 200) - (k - 200)) * t / 6; y = H + ((600 + k * 0.03) - H) * t / 6
            d.ellipse([x - 3, y - 2, x + 3, y + 2], fill=(180, 184, 190))
    # the guard rail: top rail, posts, a mid rail
    d.line([(0, 560), (W, 600)], fill=(44, 42, 48), width=12)
    d.line([(0, 588), (W, 624)], fill=(58, 56, 62), width=6)
    for x in range(20, W, 120):
        y0 = 560 + x * 40 / W
        d.line([(x, y0), (x, y0 + 60)], fill=(40, 38, 44), width=10)
    return im.filter(ImageFilter.GaussianBlur(1.2))

def breath_charge_v2():
    """Method check (hard rule 15) after two rounds at 0.6/0.7: a flat bright disc beside the
    jaw is, in this checkpoint's prior, fire coming out of the mouth, so it came back as a flame
    puff. v2 makes the swelling part of the neck's own silhouette: the tan underbelly bulges out
    under the jaw, belly-plate rows run across it, and the heat sits INSIDE a scaled rim."""
    im = Image.open("docs/concepts/chapters/evrae/redo/refs/evrae-b-init.png").convert("RGB")
    W, H = im.size
    # bulge outline: from under the jaw (285,258) along the neck's underside to (470,205),
    # sagging to y~300 at its deepest
    pts = []
    for i in range(41):
        t = i / 40
        x = 290 + (485 - 290) * t
        base = 262 + (160 - 262) * t
        sag = 70 * math.sin(math.pi * t) ** 0.9
        pts.append((x, base + sag))
    top = [(485, 140), (430, 158), (370, 190), (320, 222), (288, 250)]
    poly = pts + top
    m = Image.new("L", (W, H), 0); ImageDraw.Draw(m).polygon(poly, fill=255)
    # gradient: hot yellow core near (370,245), orange, then tan at the rim
    g = Image.new("RGB", (W, H), TAN); gd = ImageDraw.Draw(g)
    for k in range(40, 0, -1):
        t = k / 40
        col = tuple(int(YEL[j] * (1 - t) + ORANGE[j] * t * 0.85 + TAN[j] * t * 0.15) for j in range(3))
        gd.ellipse([385 - 110 * t, 235 - 60 * t, 385 + 110 * t, 235 + 60 * t], fill=col)
    im.paste(g, (0, 0), m.filter(ImageFilter.GaussianBlur(1)))
    d = ImageDraw.Draw(im)
    # belly-plate rows across the swelling (the throat is scaled skin, not a flame)
    for k in range(4, 38, 5):  # short plate seams across the bulge, normal to its contour
        (x0, y0), (x1, y1) = pts[k], pts[k + 1]
        tx, ty = x1 - x0, y1 - y0; L = math.hypot(tx, ty) or 1
        nx, ny = ty / L, -tx / L
        d.line([(x0 + nx * 6, y0 + ny * 6), (x0 + nx * 40, y0 + ny * 40)], fill=(190, 120, 70), width=3)
    # dark rim so it reads as a contour of the body
    d.line(pts, fill=NAVY, width=4)
    return im

def ko_puppet():
    """Method E puppet for KO: the picked idle-near cutout itself, turned ~105 degrees
    counter-clockwise so the head points down at the lower left and the coils trail
    upward, i.e. the wyrm tumbling out of the sky (research §12.5 beat 8)."""
    src = Image.open("docs/concepts/chapters/evrae/redo/refs/idle-near-pick.png").convert("RGBA")
    r = src.rotate(105, resample=Image.BICUBIC, expand=True)
    s_ = min(1180 / r.width, 800 / r.height)
    r = r.resize((int(r.width * s_), int(r.height * s_)), Image.LANCZOS)
    im = Image.new("RGBA", (1216, 832), (255, 255, 255, 255))
    im.alpha_composite(r, ((1216 - r.width) // 2, (832 - r.height) // 2))
    return im.convert("RGB")

def hurt_puppet():
    """Method E puppet for hurt: the picked idle-near cutout tipped ~18 degrees clockwise,
    so the head and neck are flung up and back, with the head itself re-cut and turned a
    further 35 degrees up (jaw toward the sky) — a recoil, not the idle stance."""
    src = Image.open("docs/concepts/chapters/evrae/redo/refs/idle-near-pick.png").convert("RGBA")
    # head box in the pick's own pixels (head faces left at the upper left)
    hb = (40, 20, 250, 190)
    head = src.crop(hb)
    body = src.copy(); ImageDraw.Draw(body).rectangle(hb, fill=(0, 0, 0, 0))
    head_r = head.rotate(-35, resample=Image.BICUBIC, expand=True)
    body.alpha_composite(head_r, (hb[0] - 10, max(0, hb[1] - 30)))
    r = body.rotate(-18, resample=Image.BICUBIC, expand=True)
    s_ = min(1180 / r.width, 800 / r.height)
    r = r.resize((int(r.width * s_), int(r.height * s_)), Image.LANCZOS)
    im = Image.new("RGBA", (1216, 832), (255, 255, 255, 255))
    im.alpha_composite(r, ((1216 - r.width) // 2, (832 - r.height) // 2))
    return im.convert("RGB")

import os
os.makedirs(OUT, exist_ok=True)
if os.path.exists("docs/concepts/chapters/evrae/redo/refs/idle-near-pick.png"):
    hurt_puppet().save(OUT + "hurt-puppet.png")
if os.path.exists("docs/concepts/chapters/evrae/redo/refs/idle-near-pick.png"):
    ko_puppet().save(OUT + "ko-puppet.png")
breath_charge_v2().save(OUT + "breath-charge-v2.png")
idle_far().save(OUT + "idle-far.png")
breath_charge().save(OUT + "breath-charge.png")
chapter_card().save(OUT + "chapter-card.png")
print("ok")
