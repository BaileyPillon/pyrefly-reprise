"""Nooj shade attempt 6 (FFX-2 only): the cast re-derived from the REPAIRED idle's identity.

Keeps attempt 5's own cast skeleton (nooj5_prep.poses()['cast'], COCO-18, facing left; the far (right) arm levels the
cane at the party, the machina arm is back at the hip), and paints a new flat block-in in the repaired idle's own
colours (sampled from idle-repaired.raw.png), so the cast wears the idle's costume:

- the fur ONLY on the far (right, cloth) shoulder, as a painted ragged shape in the idle's lilac-grey with purple tips,
  rising above the shoulder line and never crossing the neck; the leading cloth shoulder under it is the idle's dark
  red sleeve, not a flat grey oval (attempt 5's oval with a purple centre is what rendered as the grey patch);
- the idle's dark navy loops with orange inner edges, brown hair, blue glasses, red high collar;
- the idle's orange-red bodysuit, a black chest harness and two crossed black hip belts with silver buckles;
- the idle's dark blue machina arm with a grey jointed metal hand and a gold cuff;
- the far leg red into a purple boot with a toe; the near leg a grey disc knee, a black-to-blue shin, a grey metal foot;
- the idle's silver cane with its blue-and-red crook at the grip.

Also writes the square-padded repaired idle for the IP-Adapter, and the three region masks (fur region redrawn to the
painted fur's own shape).

    python nooj6_cast_prep.py   # writes D:/Tools/pyrefly-scratch/nooj6/prep/cast-*.png
"""
from __future__ import annotations

import pathlib
import random
import sys

from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, 'D:/Final Fantasy/docs/concepts/chapters/gippal/nooj-options/scripts')
import nooj5_prep as n5  # noqa: E402

OUT = pathlib.Path('D:/Tools/pyrefly-scratch/nooj6/prep')
IDLE = pathlib.Path('D:/Tools/pyrefly-art-backup/candidates/2026-09-25-nooj6/idle-repair/idle-repaired.png')

# colours sampled from the repaired idle (raw), rounded
SUIT, SUIT_D, SUIT_L = (228, 64, 34), (150, 28, 16), (246, 110, 70)
FUR_L, FUR_M, FUR_TIP = (208, 204, 214), (160, 150, 172), (104, 84, 128)
SLEEVE, SLEEVE_STRIPE = (70, 10, 12), (40, 40, 120)
MARM, MARM_L, MJ = (35, 45, 140), (80, 110, 190), (126, 132, 143)
MHAND, MHAND_L, GOLD = (126, 132, 143), (184, 190, 200), (214, 170, 70)
SHIN_T, SHIN_B = (13, 21, 31), (62, 90, 125)
BOOT, BOOT_L = (95, 30, 120), (140, 70, 170)
HAIR, LOOP, LOOP_IN, TIE = (95, 65, 50), (25, 30, 45), (230, 110, 60), (176, 42, 42)
SKIN, GLASS, BLACK, BUCKLE = (240, 205, 185), (80, 170, 230), (18, 16, 24), (200, 206, 214)
CANE, CANE_L, GRIP = (200, 204, 214), (240, 242, 246), (50, 90, 180)


def P(o, dx, dy):
    return (o[0] + dx, o[1] + dy)


def grad_capsule(d, a, b, w, c0, c1, steps=12):
    for i in range(steps):
        t0, t1 = i / steps, (i + 1) / steps
        p0 = (a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0)
        p1 = (a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1)
        c = tuple(int(c0[j] + (c1[j] - c0[j]) * (t0 + t1) / 2) for j in range(3))
        n5.capsule(d, p0, p1, w, c)


def fur_shape(k):
    """A ragged mantle over the far (right) shoulder: about 170x150 px like the idle's, rising above the shoulder line,
    spikes hanging over the extended upper arm; clipped so it never crosses the neck."""
    rnd = random.Random(976201)
    sx, sy = k[2]
    cx, cy = sx - 44, sy - 6
    pts = []
    import math
    for i in range(34):
        ang = math.radians(i * 360 / 34)
        rx, ry = 92, 78
        spike = 1.0 + (0.28 if i % 2 else 0.0) * (1.0 if math.sin(ang) > -0.3 else 0.4) * rnd.uniform(0.6, 1.0)
        pts.append((cx + rx * spike * math.cos(ang), cy + ry * spike * math.sin(ang)))
    m = Image.new('L', (1152, 1216), 0)
    ImageDraw.Draw(m).polygon(pts, fill=255)
    ImageDraw.Draw(m).rectangle((k[1][0] - 8, 0, 1152, 1216), fill=0)
    return m, pts, (cx, cy)


def blockin(k, cane_top, cane_tip):
    size = (1152, 1216)
    im = Image.new('RGB', size, (255, 255, 255)); d = ImageDraw.Draw(im)
    # far (right) leg: red thigh, red shin into the purple boot, toe to screen-left
    n5.capsule(d, k[8], k[9], 72, SUIT_D)
    grad_capsule(d, k[9], k[10], 58, SUIT_D, BOOT)
    bx, by = k[10]
    d.polygon([(bx - 30, by - 120), (bx + 30, by - 120), (bx + 32, by + 20), (bx - 70, by + 24), (bx - 76, by + 10), (bx - 34, by - 8)], fill=BOOT)
    d.polygon([(bx - 76, by + 10), (bx - 34, by - 8), (bx - 26, by + 8), (bx - 66, by + 18)], fill=BOOT_L)
    d.line([(bx - 78, by + 22), (bx + 32, by + 20)], fill=BLACK, width=6)
    # near (left, machina) leg: red thigh, grey disc knee, black-to-blue shin, grey metal foot to screen-left
    n5.capsule(d, k[11], k[12], 74, SUIT)
    grad_capsule(d, k[12], k[13], 40, SHIN_T, SHIN_B)
    kx, ky = k[12]
    d.ellipse((kx - 26, ky - 26, kx + 26, ky + 26), fill=MJ); d.ellipse((kx - 12, ky - 12, kx + 12, ky + 12), fill=MHAND_L)
    fx, fy = k[13]
    d.polygon([(fx - 22, fy - 20), (fx + 24, fy - 20), (fx + 26, fy + 18), (fx - 62, fy + 20), (fx - 60, fy + 6), (fx - 22, fy - 6)], fill=MHAND)
    d.line([(fx - 64, fy + 20), (fx + 26, fy + 18)], fill=MJ, width=5)
    d.ellipse((fx - 12, fy - 26, fx + 12, fy - 6), fill=MJ)
    # torso column, shaded, with the idle's harness and belts
    d.polygon([P(k[2], -20, -6), P(k[5], 20, -6), (k[11][0] + 20, k[11][1]), (k[8][0] - 20, k[8][1])], fill=SUIT)
    d.polygon([P(k[5], 20, -6), P(k[5], -10, 0), (k[11][0] - 6, k[11][1]), (k[11][0] + 20, k[11][1])], fill=SUIT_D)
    d.line([P(k[1], -8, 10), P(k[1], -4, 190)], fill=SUIT_D, width=3)                   # centre seam
    yc = k[1][1] + 70
    d.line([(k[2][0] - 10, yc - 6), (k[5][0] + 10, yc + 6)], fill=BLACK, width=12)     # chest harness
    d.line([P(k[1], 0, 6), P(k[1], -4, 72)], fill=BLACK, width=10)
    d.rectangle(P(k[1], -12, 62) + P(k[1], 8, 82), fill=BUCKLE)
    for (a, b) in (((k[8][0] - 24, k[8][1] - 40), (k[11][0] + 24, k[11][1] + 6)), ((k[8][0] - 24, k[8][1] + 4), (k[11][0] + 24, k[11][1] - 44))):
        d.line([a, b], fill=BLACK, width=12)                                            # two crossed hip belts
    d.rectangle(P(k[8], 18, -24) + P(k[8], 34, -8), fill=BUCKLE); d.rectangle(P(k[11], -30, -18) + P(k[11], -14, -2), fill=BUCKLE)
    # far (right) arm levelled at the party: the idle's dark red sleeve with a blue stripe, a black glove
    # try 2: the idle's red sleeve (try 1 used near-black, which rendered as a plated black sleeve), a black cuff
    n5.capsule(d, k[2], k[3], 50, SUIT_D); n5.capsule(d, k[3], k[4], 44, SUIT_D)
    d.line([P(k[3], 10, 6), P(k[4], 30, 6)], fill=SLEEVE_STRIPE, width=6)
    n5.capsule(d, P(k[4], 22, 0), P(k[4], 44, 2), 46, BLACK)
    d.ellipse((k[4][0] - 26, k[4][1] - 22, k[4][0] + 22, k[4][1] + 24), fill=BLACK)
    # the cane: silver shaft, the idle's blue grip with a red trim at the glove
    # try 2: the cane's butt ends inside the fist (try 1 ran it 60 px past the glove and the render carried it on
    # behind the neck), and its tip is a plain dark ferrule (try 1's bare tip rendered as a fork)
    cane_top = P(k[4], 8, -1)
    d.line([cane_top, cane_tip], fill=CANE, width=14)
    d.line([P(cane_top, 0, -3), P(cane_tip, 0, -3)], fill=CANE_L, width=3)
    d.line([cane_tip, P(cane_tip, 26, -5)], fill=BLACK, width=16)
    g0 = (k[4][0] - 30, k[4][1] + 6); g1 = (k[4][0] - 110, k[4][1] + 24)
    d.line([g0, g1], fill=GRIP, width=16); d.line([P(g0, 0, 7), P(g1, 0, 7)], fill=TIE, width=3)
    # near (left) machina arm: the idle's dark blue segments with a gap at the elbow, grey jointed hand, gold cuff
    # try 2: a bigger blue metal shoulder cap and a wider upper arm (try 1's near shoulder rendered as bare skin)
    d.ellipse(P(k[5], -26, -22) + P(k[5], 26, 30), fill=MARM); d.ellipse(P(k[5], -12, -6) + P(k[5], 12, 16), fill=MJ)
    grad_capsule(d, P(k[5], 4, 14), P(k[6], 0, -12), 32, MARM, MARM_L, 6)
    d.ellipse(P(k[6], -14, -14) + P(k[6], 14, 14), fill=MJ)
    grad_capsule(d, P(k[6], -4, 12), P(k[7], 10, -14), 22, MARM, MARM_L, 6)
    hx, hy = k[7]
    d.ellipse((hx + 2, hy - 20, hx + 22, hy - 4), fill=GOLD)
    d.polygon([(hx - 16, hy - 12), (hx + 16, hy - 12), (hx + 14, hy + 14), (hx - 14, hy + 14)], fill=MHAND)
    for i, x in enumerate((-12, -4, 4, 12)):
        d.line([(hx + x, hy + 14), (hx + x - 2, hy + 34 + (i % 2) * 4)], fill=MHAND, width=5)
        d.ellipse((hx + x - 4, hy + 22, hx + x + 3, hy + 29), fill=GOLD)
    # neck (red high collar), head, the idle's navy loops with orange inner edge, ponytail, glasses
    n5.capsule(d, k[1], P(k[0], 10, 10), 40, SUIT)
    d.polygon([P(k[1], -26, -30), P(k[1], 24, -30), P(k[1], 22, 6), P(k[1], -24, 6)], fill=SUIT_D)
    hx, hy = k[0][0] + 22, k[0][1] - 30
    d.ellipse((hx - 58, hy - 70, hx + 56, hy + 62), fill=HAIR)
    d.ellipse((k[0][0] - 20, k[0][1] - 40, k[0][0] + 44, k[0][1] + 40), fill=SKIN)
    for (x0, x1, y0, y1) in ((hx + 30, hx + 100, hy - 60, hy + 12), (hx - 98, hx - 32, hy - 66, hy + 4)):
        d.ellipse((x0, y0, x1, y1), outline=LOOP, width=18)
        d.ellipse((x0 + 14, y0 + 14, x1 - 14, y1 - 14), outline=LOOP_IN, width=3)
    d.rectangle((hx + 32, hy - 4, hx + 48, hy + 12), fill=TIE); d.rectangle((hx - 44, hy - 8, hx - 30, hy + 8), fill=TIE)
    n5.capsule(d, (hx + 40, hy + 20), (hx + 66, hy + 170), 24, HAIR)
    d.rectangle((k[0][0] - 16, k[0][1] - 32, k[0][0] + 36, k[0][1] - 16), fill=GLASS)
    d.polygon([(k[0][0] - 20, k[0][1] - 52), (hx + 40, hy - 60), (hx + 40, hy - 20), (k[0][0] - 20, k[0][1] - 36)], fill=HAIR)  # fringe
    # the fur mantle on the far shoulder only: light top, purple-grey tips, spikes
    fm, pts, (cx, cy) = fur_shape(k)
    fur = Image.new('RGB', size, FUR_L); fd = ImageDraw.Draw(fur)
    for i in range(8):
        y = cy - 10 + i * 14
        c = tuple(int(FUR_L[j] + (FUR_TIP[j] - FUR_L[j]) * min(1, i / 7)) for j in range(3))
        fd.rectangle((0, y, size[0], y + 14), fill=c)
    fd.rectangle((0, 0, size[0], cy - 10), fill=FUR_L)
    for i in range(0, len(pts), 2):                      # short darker strands into each spike (edge only)
        px, py = pts[i]
        fd.line([(cx + 0.6 * (px - cx), cy + 0.6 * (py - cy)), (px, py)], fill=FUR_M, width=4)
    im.paste(fur, mask=fm)
    return im, fm


def masks(k, fm):
    size = (1152, 1216)
    out = {'fur': fm.filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(6))}
    arm = Image.new('L', size, 0); d = ImageDraw.Draw(arm)
    n5.capsule(d, k[5], k[6], 58); n5.capsule(d, k[6], k[7], 50); d.ellipse(P(k[7], -26, -26) + P(k[7], 26, 44), fill=255)
    out['arm'] = arm.filter(ImageFilter.GaussianBlur(5))
    shin = Image.new('L', size, 0); d = ImageDraw.Draw(shin)
    n5.capsule(d, k[12], k[13], 60)
    out['shin'] = shin.filter(ImageFilter.GaussianBlur(5))
    return out


def idle_ref():
    """The repaired idle, square-padded on white (the fur and loops inside CLIP-Vision's crop)."""
    p = Image.open(IDLE).convert('RGBA'); w, h = p.size
    flat = Image.new('RGB', p.size, (255, 255, 255)); flat.paste(p, mask=p.split()[-1])
    sq = Image.new('RGB', (h, h), (255, 255, 255)); sq.paste(flat, ((h - w) // 2, 0))
    sq.save(OUT / 'ref-idle-repaired-square.png')


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    size, k, cane_top, cane_tip = n5.poses()['cast']
    n5.draw(size, k).save(OUT / 'cast-skel.png')
    bi, fm = blockin(k, cane_top, cane_tip); bi.save(OUT / 'cast-blockin.png')
    for r, m in masks(k, fm).items():
        m.save(OUT / f'cast-mask-{r}.png')
    idle_ref()
    print('ok', OUT)


if __name__ == '__main__':
    main()
