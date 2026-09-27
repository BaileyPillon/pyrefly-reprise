"""Repair round (2026-09-27): Guard Scorpion's tail-raised form, seeded from idle-a.2's OWN render.

The canon judge failed round 2 `raised-a.1` because it read as a different robot from the idle pick
`idle-a.2` (rounded capsule shell, red disc, pillar legs with cone feet, cyan eye). So this pass does
not draw a new robot: it takes `idle-a.2.raw.png` (our own render), erases the lowered tail, paints a
rough raised tail in idle-a.2's own colours (red armour blocks on black joints, the same red housing
with a cyan lens at the tip), and writes a mask that covers only the old and new tail. The masked
inpaint (tools/gen/inpaint.mjs --latent) then repaints only the tail; the shell, the black box on the
back, the legs, the red feet, the yellow-green eye and the twin rifles stay pixel-identical.

Canon (FF Wiki, Guard Scorpion (Final Fantasy VII), cited in ../README.md): two forms, tail lowered
and tail raised; Tail Laser is its counter while the tail is up. The tail tip is therefore a laser
EMITTER (a barrel housing with a lens and a muzzle shroud), never a blade or stinger. The shape of
the emitter is our design [unsourced: design choice]. Facing: head at frame-right, toward the party
(research/ff7-battle-staging.md section 7). Nothing is mirrored.

Usage: python gs-raised-paintover.py <idle-a.2.raw.png> <out_dir>  -> gs2r-paint.png, gs2r-mask.png
"""
import math, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage

src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGB')
W, H = im.size
a = np.asarray(im).astype(np.int32)

# 1. The old (lowered) tail: every non-white pixel left of the shell's rear edge and above the
#    rear leg. Measured on idle-a.2.raw: the shell starts at x ~250, the rear leg below y ~565.
nonwhite = (a.min(axis=2) < 235)
old = np.zeros_like(nonwhite)
old[:566, :252] = nonwhite[:566, :252]
old = ndimage.binary_dilation(old, iterations=6)
a[old] = 255

RED, RED_D, RED_L = (192, 10, 6), (74, 6, 6), (236, 60, 40)
BLACK, BLACK_L = (34, 30, 30), (70, 64, 60)
LENS, LENS_D, LENS_L = (16, 214, 248), (8, 110, 138), (200, 250, 255)
STEEL, STEEL_D = (86, 88, 96), (44, 44, 50)

paint = Image.fromarray(a.clip(0, 255).astype(np.uint8))
d = ImageDraw.Draw(paint)
mask = Image.new('L', (W, H), 0)
md = ImageDraw.Draw(mask)


def quad(cx, cy, ang, length, half):
    ca, sa = math.cos(ang), math.sin(ang)
    px, py = -sa, ca
    return [(cx - ca * length / 2 + px * half, cy - sa * length / 2 + py * half),
            (cx + ca * length / 2 + px * half, cy + sa * length / 2 + py * half),
            (cx + ca * length / 2 - px * half, cy + sa * length / 2 - py * half),
            (cx - ca * length / 2 - px * half, cy - sa * length / 2 - py * half)]


def ellipse_poly(cx, cy, rx, ry, ang, n=40):
    ca, sa = math.cos(ang), math.sin(ang)
    return [(cx + rx * math.cos(t) * ca - ry * math.sin(t) * sa,
             cy + rx * math.cos(t) * sa + ry * math.sin(t) * ca)
            for t in (2 * math.pi * k / n for k in range(n))]


# 2. The raised tail: it leaves the rear of the shell, climbs up and back, then arches forward over
#    the back (clear of the black box, whose top is at y ~250), so the tip hangs over the body.
pts = [(262, 505), (218, 450), (196, 380), (200, 305), (232, 235), (285, 178), (352, 140), (425, 124), (492, 130)]
for i in range(len(pts) - 1):
    (x0, y0), (x1, y1) = pts[i], pts[i + 1]
    ang = math.atan2(y1 - y0, x1 - x0)
    seg = math.hypot(x1 - x0, y1 - y0)
    half = 38 - i * 2.2
    d.line([(x0, y0), (x1, y1)], fill=BLACK, width=int(half * 1.1))           # joint core
    d.ellipse([x0 - half * 0.55, y0 - half * 0.55, x0 + half * 0.55, y0 + half * 0.55], fill=BLACK_L)
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    d.polygon(quad(cx, cy, ang, seg * 0.62, half), fill=RED)                   # armour block
    d.polygon(quad(cx - math.sin(ang) * half * 0.45, cy + math.cos(ang) * half * 0.45, ang, seg * 0.62, half * 0.45), fill=RED_D)
    d.polygon(quad(cx + math.sin(ang) * half * 0.6, cy - math.cos(ang) * half * 0.6, ang, seg * 0.5, half * 0.22), fill=RED_L)

# 3. The emitter at the tip, aimed forward and down at the party (frame-right, ~35 degrees down):
#    the same red housing and cyan lens as idle-a.2's tail tip, plus a dark muzzle shroud and
#    cooling fins so it reads as a gun, not a lamp.
x, y = pts[-1]
ang = math.radians(35)
ca, sa = math.cos(ang), math.sin(ang)
d.polygon(quad(x + ca * 10, y + sa * 10, ang, 40, 34), fill=BLACK)                 # collar
d.polygon(quad(x + ca * 60, y + sa * 60, ang, 76, 50), fill=RED)                    # housing
d.polygon(quad(x + ca * 60 - sa * 26, y + sa * 60 + ca * 26, ang, 76, 24), fill=RED_D)
for t in (38, 58, 78):                                                               # fins
    d.polygon(quad(x + ca * t, y + sa * t, ang, 7, 56), fill=STEEL_D)
fx, fy = x + ca * 104, y + sa * 104
d.polygon(quad(fx, fy, ang, 30, 40), fill=STEEL)                                    # muzzle shroud
lx, ly = fx + ca * 16, fy + sa * 16
d.polygon(ellipse_poly(lx, ly, 17, 40, ang), fill=STEEL_D)                          # lens face, foreshortened
d.polygon(ellipse_poly(lx + ca * 2, ly + sa * 2, 12, 30, ang), fill=LENS_D)
d.polygon(ellipse_poly(lx + ca * 4, ly + sa * 4, 8, 20, ang), fill=LENS)
d.polygon(ellipse_poly(lx + ca * 5 - sa * 6, ly + sa * 5 + ca * -6, 3, 7, ang), fill=LENS_L)

# 4. The mask: the new tail (everything painted that differs from the erased frame) and the erased
#    old tail, grown a little and feathered. The shell is outside it except at the tail root.
p = np.asarray(paint).astype(np.int32)
drawn = np.abs(p - a).sum(axis=2) > 0
m = ndimage.binary_dilation(drawn, iterations=22) | ndimage.binary_dilation(old, iterations=10)
mask = Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(6))

os.makedirs(out, exist_ok=True)
paint.save(os.path.join(out, 'gs2r-paint.png'))
mask.save(os.path.join(out, 'gs2r-mask.png'))
prev = paint.copy()
prev.paste((0, 160, 255), mask=mask.point(lambda v: v // 3))
prev.convert('RGB').save(os.path.join(out, '_gs2r-preview.jpg'), quality=85)
print('ok', W, H, int(m.sum()))
