"""Repair round (2026-09-27): Barret layout sketch v3, drawn in code from written canon only.

Canon (FF Wiki "Barret Wallace" revid 4042820, Appearance, original FF7 look): heavy-set, muscular,
dark skin; his RIGHT arm replaced by the gun-arm; several bands of metal around his waist; skull
tattoo on the LEFT shoulder; hi-top fade; thick beard; two dog tags; silver hoop earring in the LEFT
ear; dirty brown vest, green pants, large brown boots; bands of metal on his remaining (left) arm.
Wikipedia: "His right hand is replaced with a prosthetic gatling gun". No image was looked at,
traced or used as input.

What the canon judge failed in round 2 idle-c.2, and what this sketch changes:
  - mohawk crest            -> a wide, flat-topped hi-top block with the sides fading short
  - glove, no arm bands     -> a bare fist; three metal bands on the left forearm
  - leather belt            -> three metal bands around the waist, no buckle
  - no dog tags visible     -> two large tags on a chain over a bare chest (no shirt drawn)
  - ribbed cannon           -> a gatling: a cluster of barrels with two clamp rings and a muzzle
                               face showing six bores
  - nearly frontal torso    -> a narrower, turned torso, the face in three-quarter profile with the
                               nose toward frame-left, both boots pointing left
  - flat posterized style   -> every part is filled with a soft light-to-shadow gradient (light from
                               the upper left) and the whole sketch is lightly blurred, so the img2img
                               starts from soft shading instead of flat fills

Staging (research/ff7-battle-staging.md sections 2, 6.3, 7): the party is on the RIGHT facing LEFT,
so Barret shows his LEFT side: the RIGHT gun-arm is the FAR arm, pointed forward at the enemy.
Never mirrored. Usage: python barret-r2b-sketch.py <out_dir> -> barret3.png (832x1216)
       HEAD_K=0.8 BARREL_X=14 SKETCH_NAME=barret4.png python barret-r2b-sketch.py <out_dir>  (v4)
"""
import math, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

W, H = 832, 1216
SKIN = ((150, 96, 66), (76, 46, 32))
SKIN_N = ((168, 110, 76), (88, 54, 36))
HAIR = ((58, 52, 50), (14, 12, 14))
VEST = ((150, 96, 54), (82, 50, 28))
GREEN = ((112, 132, 76), (50, 64, 36))
GREEN_F = ((92, 110, 62), (40, 52, 30))
BOOT = ((150, 92, 50), (70, 40, 22))
STEEL = ((208, 212, 220), (84, 88, 100))
GUN = ((176, 180, 190), (58, 60, 70))
BONE = (236, 230, 214)

canvas = Image.new('RGB', (W, H), 'white')


def fill(draw_fn, cols, ang=math.radians(60)):
    """Draw a shape into a mask, then fill it with a light-to-shadow linear gradient."""
    m = Image.new('L', (W, H), 0)
    draw_fn(ImageDraw.Draw(m))
    box = m.getbbox()
    if not box:
        return
    x0, y0, x1, y1 = box
    ys, xs = np.mgrid[0:H, 0:W]
    ca, sa = math.cos(ang), math.sin(ang)
    proj = (xs - x0) * ca + (ys - y0) * sa
    span = max(1.0, (x1 - x0) * abs(ca) + (y1 - y0) * abs(sa))
    t = np.clip(proj / span, 0, 1)[..., None]
    lo, hi = np.array(cols[0], float), np.array(cols[1], float)
    grad = Image.fromarray((lo * (1 - t) + hi * t).astype(np.uint8))
    canvas.paste(grad, (0, 0), m)


def limb(pts, w):
    def f(d):
        for a, b in zip(pts, pts[1:]):
            d.line([a, b], fill=255, width=w)
        for p in pts:
            d.ellipse([p[0] - w / 2, p[1] - w / 2, p[0] + w / 2, p[1] + w / 2], fill=255)
    return f


poly = lambda pts: (lambda d: d.polygon(pts, fill=255))
ell = lambda box: (lambda d: d.ellipse(box, fill=255))
d = ImageDraw.Draw(canvas)

# far (RIGHT) leg forward, boot toe pointing frame-left
fill(limb([(380, 660), (320, 870), (280, 1060)], 116), GREEN_F)
fill(poly([(150, 1105), (180, 1060), (330, 1045), (340, 1172), (140, 1176)]), BOOT)
# far (RIGHT) arm: upper arm forward from the far shoulder, grafted at the elbow into the gun
fill(limb([(350, 395), (262, 462)], 80), SKIN)
fill(poly([(200, 422), (270, 418), (282, 506), (206, 510)]), STEEL)                 # graft cuff
fill(poly([(120, 430), (212, 426), (214, 506), (122, 510)]), GUN)                   # breech housing
fill(ell([150, 488, 214, 540]), GUN)                                                 # ammo drum below
BX = int(os.environ.get('BARREL_X', '44'))                                             # v4: 14 = longer barrels
for y in (438, 458, 478, 498):                                                       # barrel cluster
    fill(poly([(BX, y - 8), (126, y - 9), (126, y + 9), (BX, y + 8)]), GUN, math.radians(90))
for x in ((112,) if BX < 44 else (70, 112)):                                         # clamp rings
    fill(poly([(x - 7, 424), (x + 7, 424), (x + 7, 512), (x - 7, 512)]), STEEL)
fill(ell([BX - 14, 424, BX + 14, 512]), STEEL)                                                 # muzzle face
for k in range(6):                                                                   # six bores
    a = 2 * math.pi * k / 6
    cx, cy = BX + 7 * math.cos(a), 468 + 28 * math.sin(a)
    d.ellipse([cx - 5, cy - 7, cx + 5, cy + 7], fill=(24, 24, 28))
# near (LEFT) leg back, boot toe pointing frame-left
fill(limb([(490, 660), (540, 880), (560, 1062)], 124), GREEN)
fill(poly([(430, 1110), (462, 1055), (620, 1050), (636, 1178), (420, 1180)]), BOOT)
# hips and several metal bands around the waist (no belt, no buckle)
fill(poly([(318, 600), (570, 600), (600, 730), (300, 730)]), GREEN)
for y in (596, 624, 652):
    fill(poly([(312, y), (574, y + 4), (576, y + 20), (310, y + 16)]), STEEL, math.radians(90))
# torso, turned: the dirty brown vest, open at the leading (frame-left) edge over a BARE chest
fill(poly([(318, 362), (548, 346), (596, 420), (574, 612), (318, 612), (296, 470)]), VEST)
fill(poly([(318, 372), (410, 362), (396, 604), (322, 604), (300, 470)]), SKIN)        # bare chest
d.line([(410, 362), (396, 604)], fill=(70, 42, 24), width=8)                          # vest edge
for y in (430, 500):
    d.line([(420, y), (470, y - 4)], fill=(96, 60, 34), width=5)                     # vest pockets
# two dog tags on a chain
d.line([(372, 330), (352, 468)], fill=(200, 202, 210), width=4)
d.line([(420, 334), (362, 468)], fill=(200, 202, 210), width=4)
fill(poly([(336, 466), (362, 462), (366, 506), (340, 510)]), STEEL)
fill(poly([(356, 474), (382, 470), (388, 514), (360, 518)]), STEEL)
# head: three-quarter profile toward frame-left (nose and eye on the left of the face).
# v4 (after the first pilots came back chibi, big-headed): the whole head is scaled by HEAD_K about
# the neck, so Barret reads as a heavy-set adult rather than a super-deformed figure.
HEAD_K = float(os.environ.get('HEAD_K', '1.0'))
NECK = (416, 346)
hp = lambda pts: [(NECK[0] + (x - NECK[0]) * HEAD_K, NECK[1] + (y - NECK[1]) * HEAD_K) for x, y in pts]
hb = lambda b: [v for pt in hp([(b[0], b[1]), (b[2], b[3])]) for v in pt]
fill(ell(hb([346, 160, 486, 336])), SKIN_N)
fill(poly(hp([(352, 244), (330, 268), (352, 282)])), SKIN_N)                          # nose
d.ellipse(hb([370, 232, 390, 244]), fill=(30, 22, 20))                                # eye
d.line(hp([(362, 222), (398, 218)]), fill=(20, 16, 16), width=7)                      # brow
fill(poly(hp([(346, 282), (380, 290), (440, 280), (470, 262), (476, 300), (448, 344), (392, 356), (350, 330)])), HAIR)  # thick beard
fill(ell(hb([452, 232, 480, 272])), SKIN_N)                                           # left ear (near side)
d.ellipse(hb([462, 262, 482, 290]), outline=(214, 216, 224), width=4)                 # silver hoop earring
# hi-top fade: a wide flat-topped block as wide as the crown, the sides fading short above the ears
fill(poly(hp([(356, 196), (358, 100), (478, 96), (484, 196)])), HAIR, math.radians(90))
fill(poly(hp([(436, 194), (486, 194), (484, 236), (452, 236)])), ((70, 50, 40), (40, 28, 24)))  # faded side
# near (LEFT) arm: skull tattoo on the shoulder, three metal bands on the forearm, bare fist
fill(limb([(556, 392), (620, 560), (598, 700)], 98), SKIN_N, math.radians(20))
d.ellipse([548, 398, 604, 446], fill=BONE)                                            # skull tattoo
d.rectangle([564, 440, 588, 456], fill=BONE)
d.ellipse([558, 410, 572, 424], fill=(90, 56, 38))
d.ellipse([580, 410, 594, 424], fill=(90, 56, 38))
for y in (598, 624, 650):
    fill(poly([(566, y), (640, y + 4), (638, y + 20), (564, y + 16)]), STEEL, math.radians(90))
fill(ell([556, 684, 646, 764]), SKIN_N)                                               # bare fist
for x in (574, 596, 618):
    d.line([(x, 690), (x + 4, 712)], fill=(80, 48, 32), width=4)                      # knuckles

canvas = canvas.filter(ImageFilter.GaussianBlur(1.6))
out = sys.argv[1]
os.makedirs(out, exist_ok=True)
canvas.save(os.path.join(out, os.environ.get('SKETCH_NAME', 'barret3.png')))
print('ok')
