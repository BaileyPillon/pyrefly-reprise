"""Round 2 layout sketch for Guard Scorpion (original, drawn in code from the FF Wiki text:
"a heavily armed guard robot that resembles a scorpion ... six legs and a long tail", Tail
Laser; not traced from any image). Changes from round 1 (Bailey 2026-09-27, recommendation 3):
  - a bulkier, boss-sized chassis: taller and longer shell, bigger head, shorter and thicker legs;
  - the tail tip is a LASER EMITTER (a squat barrel housing with a big round lens), never a blade;
  - identity carried over from idle-a.3 / raised-a.2: red shell, grey steel legs with red feet,
    twin rifles under the head, one round sensor eye, a grey disc on the back.
FF7 staging (research/ff7-battle-staging.md section 7): the boss stands on the LEFT and faces
RIGHT. The design is bilaterally symmetric (twin rifles, a centred eye, a centred tail), so the
sketch is drawn head-left and then the flat sketch itself is flipped; no painting is mirrored.
Usage: python gs-r2-sketch.py <out_dir>   -> gs2-low.png, gs2-raised.png (1216x832, head at right)
"""
import math, sys, os
from PIL import Image, ImageDraw, ImageOps

W, H = 1216, 832
RED, RED_D, RED_L = (206, 30, 22), (132, 20, 18), (236, 88, 70)
STEEL, STEEL_D, STEEL_L = (66, 68, 80), (36, 38, 46), (140, 144, 154)
EYE = (255, 196, 60)
LENS, LENS_L = (90, 200, 255), (220, 246, 255)


def leg(d, hip, knee, foot, w, col):
    d.line([hip, knee], fill=col, width=w)
    d.line([knee, foot], fill=col, width=int(w * 0.85))
    for p, r in ((hip, w * 0.75), (knee, w * 0.65)):
        d.ellipse([p[0] - r, p[1] - r, p[0] + r, p[1] + r], fill=STEEL_L)
    d.polygon([(foot[0] - w * 1.1, foot[1]), (foot[0] + w * 1.1, foot[1]), (foot[0], foot[1] - w * 1.4)], fill=RED)


def emitter(d, x, y, ang):
    """A squat cylindrical barrel housing with a large lens on its front face, aimed along ang."""
    ca, sa = math.cos(ang), math.sin(ang)
    L, R = 92, 50  # housing length and half-width
    px, py = -sa, ca
    back = [(x + px * R, y + py * R), (x - px * R, y - py * R)]
    fx, fy = x + ca * L, y + sa * L
    front = [(fx - px * R, fy - py * R), (fx + px * R, fy + py * R)]
    d.polygon(back + front, fill=STEEL)
    # cooling fins across the housing
    for t in (0.3, 0.55):
        cx, cy = x + ca * L * t, y + sa * L * t
        d.line([(cx + px * (R + 10), cy + py * (R + 10)), (cx - px * (R + 10), cy - py * (R + 10))], fill=STEEL_D, width=12)
    # the lens: concentric rings on the front face
    for r, c in ((R + 4, STEEL_D), (R - 6, STEEL_L), (R - 16, LENS), (R - 32, LENS_L)):
        d.ellipse([fx - r, fy - r, fx + r, fy + r], fill=c)


def tail(d, pts):
    for i in range(len(pts) - 1):
        (x0, y0), (x1, y1) = pts[i], pts[i + 1]
        r = 50 - i * 2.8
        d.line([(x0, y0), (x1, y1)], fill=STEEL_D, width=int(r * 1.1))
        d.ellipse([x0 - r, y0 - r, x0 + r, y0 + r], fill=RED if i % 2 == 0 else RED_D, outline=STEEL_D, width=5)
    x, y = pts[-1]
    a = math.atan2(y - pts[-2][1], x - pts[-2][0])
    emitter(d, x, y, a)


def draw(raised):
    im = Image.new('RGB', (W, H), 'white')
    d = ImageDraw.Draw(im)
    g = 800
    # far legs: lighter, higher, shorter
    for hip, knee, foot in (((430, 520), (390, 450), (360, g - 90)), ((600, 510), (620, 440), (640, g - 85)), ((770, 520), (850, 455), (900, g - 80))):
        leg(d, hip, knee, foot, 30, STEEL_L)
    # bulky shell: tall domed armour, head end at frame-left
    shell = [(250, 520), (300, 400), (420, 330), (600, 305), (780, 320), (900, 380), (930, 480), (890, 590), (760, 650), (420, 660), (290, 620)]
    d.polygon(shell, fill=RED)
    d.polygon([(320, 405), (430, 345), (600, 322), (770, 335), (880, 390), (770, 420), (600, 410), (420, 425)], fill=RED_L)
    for x in (430, 560, 690, 810):
        d.line([(x, 340), (x - 20, 650)], fill=RED_D, width=9)
    d.line([(280, 560), (910, 540)], fill=RED_D, width=8)
    # grey disc on the back (identity from idle-a.3)
    d.rectangle([540, 270, 640, 310], fill=STEEL_D)
    d.ellipse([500, 245, 680, 290], fill=STEEL)
    # head: big armoured wedge with one sensor eye
    d.polygon([(120, 540), (170, 440), (320, 405), (380, 500), (350, 620), (190, 640)], fill=RED)
    d.polygon([(175, 445), (315, 412), (340, 455), (190, 480)], fill=RED_L)
    d.ellipse([175, 490, 265, 580], fill=STEEL_D)
    d.ellipse([197, 512, 243, 558], fill=EYE)
    # twin rifles under the head, thick, pointing forward
    for y, x0 in ((610, 10), (655, 30)):
        d.rectangle([x0, y - 17, 260, y + 17], fill=STEEL_D)
        d.rectangle([x0 - 8, y - 22, x0 + 30, y + 22], fill=STEEL)
        d.rectangle([x0 + 90, y - 20, x0 + 110, y + 20], fill=RED_D)
    # near legs: heavy, darker, planted wide
    for hip, knee, foot in (((380, 640), (280, 580), (230, g)), ((590, 655), (540, 590), (520, g)), ((800, 640), (890, 575), (950, g - 5))):
        leg(d, hip, knee, foot, 46, STEEL)
    if raised:
        pts = [(900, 470), (990, 390), (1040, 290), (1040, 190), (1000, 105), (925, 55), (840, 50), (770, 80), (700, 118)]
    else:
        pts = [(910, 500), (1000, 520), (1080, 500), (1135, 450), (1160, 385), (1145, 320), (1105, 285)]
    tail(d, pts)
    return ImageOps.mirror(im)  # head to frame-RIGHT: the boss faces the party (see docstring)


out = sys.argv[1]
os.makedirs(out, exist_ok=True)
draw(False).save(os.path.join(out, 'gs2-low.png'))
draw(True).save(os.path.join(out, 'gs2-raised.png'))
print('ok')
