"""Hi-fi round (2026-09-27): layout sketches for Cloud and Barret FACING SCREEN-RIGHT, drawn in code
from written canon only (FF Wiki "Barret Wallace" revid 4042820 and "Cloud Strife" revid 4045701,
Appearance; no image was looked at, traced or used as input).

Bailey, 2026-09-27: the party moves to the LEFT of the screen and faces screen-right; never mirror.
A figure facing screen-right in three-quarter view shows its RIGHT side to the camera:
  - Barret: the gun-arm is his RIGHT arm = the NEAR arm. It is drawn IN FRONT of the torso, grafted
    below the elbow (no right hand), aimed forward at the enemy (frame-right). His LEFT arm is the far
    arm: bare fist, metal bands on the forearm. The skull tattoo (left shoulder) and the hoop earring
    (left ear) are on the far side and are not drawn; the three scars on the RIGHT cheek are near-side.
  - Cloud: the single pauldron is on his LEFT shoulder = the FAR shoulder (it peeks past the chest at
    frame-right); his near (RIGHT) shoulder is bare, and the SOLDIER band is on his RIGHT (near) wrist.
    The gear-like armlet is on the LEFT (far) forearm.
Every part is filled with a soft light-to-shadow gradient and the background is a neutral dark grey,
so the cut-out edge carries no white fringe onto the dark reactor scene.
The chiral content is assigned for a right-facing figure; nothing is a mirrored painting.
Usage: python party-right-sketch.py <out_dir> -> barret-r.png, cloud-r.png (832x1216)
"""
import math, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

W, H = 832, 1216
BG = (70, 73, 80)
SKIN = ((150, 96, 66), (76, 46, 32))
SKIN_N = ((168, 110, 76), (88, 54, 36))
HAIR = ((58, 52, 50), (14, 12, 14))
VEST = ((150, 96, 54), (82, 50, 28))
GREEN = ((112, 132, 76), (50, 64, 36))
GREEN_F = ((92, 110, 62), (40, 52, 30))
BOOT = ((150, 92, 50), (70, 40, 22))
STEEL = ((208, 212, 220), (84, 88, 100))
GUN = ((176, 180, 190), (58, 60, 70))
SKIN_C = ((252, 222, 196), (206, 160, 128))
INDIGO = ((78, 84, 150), (34, 36, 74))
INDIGO_F = ((62, 66, 124), (28, 30, 62))
BLOND = ((252, 228, 130), (196, 160, 60))
BLADE = ((226, 230, 238), (110, 116, 130))
LEATHER = ((140, 96, 58), (70, 46, 26))
X = lambda x: W - x          # layout helper: forward = frame-right


class Sketch:
    def __init__(self):
        self.im = Image.new('RGB', (W, H), BG)
        self.d = ImageDraw.Draw(self.im)

    def fill(self, draw_fn, cols, ang=math.radians(120)):
        m = Image.new('L', (W, H), 0)
        draw_fn(ImageDraw.Draw(m))
        box = m.getbbox()
        if not box:
            return
        x0, y0, x1, y1 = box
        ys, xs = np.mgrid[0:H, 0:W]
        ca, sa = math.cos(ang), math.sin(ang)
        # light from the upper RIGHT (the enemy side / reactor core): gradient runs right-to-left, top-down
        proj = (x1 - xs) * abs(ca) + (ys - y0) * sa
        span = max(1.0, (x1 - x0) * abs(ca) + (y1 - y0) * abs(sa))
        t = np.clip(proj / span, 0, 1)[..., None]
        lo, hi = np.array(cols[0], float), np.array(cols[1], float)
        self.im.paste(Image.fromarray((lo * (1 - t) + hi * t).astype(np.uint8)), (0, 0), m)

    def done(self):
        return self.im.filter(ImageFilter.GaussianBlur(1.6))


def limb(pts, w):
    def f(d):
        for a, b in zip(pts, pts[1:]):
            d.line([a, b], fill=255, width=w)
        for p in pts:
            d.ellipse([p[0] - w / 2, p[1] - w / 2, p[0] + w / 2, p[1] + w / 2], fill=255)
    return f


poly = lambda pts: (lambda d: d.polygon(pts, fill=255))
ell = lambda box: (lambda d: d.ellipse(box, fill=255))


def barret():
    s = Sketch(); f = s.fill; d = s.d
    # far (LEFT) leg forward, toe to frame-right; near (RIGHT) leg back
    f(limb([(X(380), 660), (X(320), 870), (X(280), 1060)], 116), GREEN_F)
    f(poly([(X(150), 1105), (X(180), 1060), (X(330), 1045), (X(340), 1172), (X(140), 1176)]), BOOT)
    # far (LEFT) arm behind the torso's leading edge: bare fist forward at hip height, metal bands
    f(limb([(X(356), 400), (X(318), 540), (X(270), 640)], 88), SKIN)
    for y in (560, 586, 612):
        f(poly([(X(300) - 40, y), (X(300) + 44, y - 6), (X(300) + 46, y + 12), (X(300) - 38, y + 18)]), STEEL)
    f(ell([X(300) - 20, 626, X(300) + 66, 704]), SKIN)                                 # far fist
    f(limb([(X(490), 660), (X(540), 880), (X(560), 1062)], 124), GREEN)
    f(poly([(X(430), 1110), (X(462), 1055), (X(620), 1050), (X(636), 1178), (X(420), 1180)]), BOOT)
    # hips and several metal bands around the waist
    f(poly([(X(318), 600), (X(570), 600), (X(600), 730), (X(300), 730)]), GREEN)
    for y in (596, 624, 652):
        f(poly([(X(312), y), (X(574), y + 4), (X(576), y + 20), (X(310), y + 16)]), STEEL)
    # torso: dirty brown vest open at the leading (frame-right) edge over a bare chest
    f(poly([(X(318), 362), (X(548), 346), (X(596), 420), (X(574), 612), (X(318), 612), (X(296), 470)]), VEST)
    f(poly([(X(318), 372), (X(410), 362), (X(396), 604), (X(322), 604), (X(300), 470)]), SKIN)
    d.line([(X(410), 362), (X(396), 604)], fill=(70, 42, 24), width=8)
    for y in (430, 500):
        d.line([(X(420), y), (X(470), y - 4)], fill=(96, 60, 34), width=5)
    d.line([(X(372), 330), (X(352), 468)], fill=(200, 202, 210), width=4)             # dog tag chain
    d.line([(X(420), 334), (X(362), 468)], fill=(200, 202, 210), width=4)
    f(poly([(X(336), 466), (X(362), 462), (X(366), 506), (X(340), 510)]), STEEL)
    f(poly([(X(356), 474), (X(382), 470), (X(388), 514), (X(360), 518)]), STEEL)
    # head at 0.8 about the neck, three-quarter profile toward frame-right
    K, N = 0.8, (X(416), 346)
    hp = lambda pts: [(N[0] + (X(x) - N[0]) * K, N[1] + (y - N[1]) * K) for x, y in pts]
    hb = lambda b: (lambda p: [min(p[0][0], p[1][0]), p[0][1], max(p[0][0], p[1][0]), p[1][1]])(hp([(b[0], b[1]), (b[2], b[3])]))
    f(ell(hb([346, 160, 486, 336])), SKIN_N)
    f(poly(hp([(352, 244), (330, 268), (352, 282)])), SKIN_N)                          # nose
    d.ellipse(hb([370, 232, 390, 244]), fill=(30, 22, 20))                             # eye
    d.line(hp([(362, 222), (398, 218)]), fill=(20, 16, 16), width=7)                   # brow
    for k in range(3):                                                                 # scars, RIGHT cheek (near)
        d.line(hp([(418 + 8 * k, 244), (430 + 8 * k, 272)]), fill=(64, 36, 26), width=3)
    f(poly(hp([(346, 282), (380, 290), (440, 280), (470, 262), (476, 300), (448, 344), (392, 356), (350, 330)])), HAIR)
    f(ell(hb([452, 232, 480, 272])), SKIN_N)                                           # right ear, no earring
    f(poly(hp([(356, 196), (358, 100), (478, 96), (484, 196)])), HAIR)                 # hi-top fade
    f(poly(hp([(436, 194), (486, 194), (484, 236), (452, 236)])), ((70, 50, 40), (40, 28, 24)))
    # NEAR (RIGHT) arm, in front of the torso: shoulder at the back edge, upper arm forward and down,
    # grafted below the elbow into the gatling, which points forward at frame-right
    SH, EL = (X(560), 400), (X(470), 500)
    f(limb([SH, EL], 96), SKIN_N)
    f(poly([(EL[0] - 30, 462), (EL[0] + 44, 458), (EL[0] + 50, 546), (EL[0] - 26, 552)]), STEEL)     # graft cuff
    bx0 = EL[0] + 44
    f(poly([(bx0, 452), (bx0 + 110, 448), (bx0 + 112, 552), (bx0, 556)]), GUN)                        # breech
    f(ell([bx0 + 20, 530, bx0 + 96, 596]), GUN)                                                        # ammo drum
    tip = bx0 + 300
    for y in (466, 488, 510, 532):
        f(poly([(bx0 + 108, y - 9), (tip, y - 8), (tip, y + 8), (bx0 + 108, y + 9)]), GUN, math.radians(90))
    f(poly([(bx0 + 170, 448), (bx0 + 184, 448), (bx0 + 184, 552), (bx0 + 170, 552)]), STEEL)          # clamp ring
    f(ell([tip - 14, 450, tip + 14, 548]), STEEL)                                                      # muzzle face
    for k in range(6):
        a = 2 * math.pi * k / 6
        cx, cy = tip + 7 * math.cos(a), 499 + 30 * math.sin(a)
        d.ellipse([cx - 5, cy - 7, cx + 5, cy + 7], fill=(24, 24, 28))
    return s.done()


def cloud():
    s = Sketch(); f = s.fill; d = s.d
    f(limb([(X(390), 650), (X(310), 880), (X(250), 1070)], 92), INDIGO_F)             # far (left) leg forward
    f(poly([(X(150), 1060), (X(290), 1045), (X(300), 1170), (X(120), 1175), (X(110), 1120)]), BOOT)
    # FAR (LEFT) shoulder: the single pauldron peeks past the chest at frame-right, behind the torso
    f(ell([X(360) - 70, 330, X(360) + 64, 432]), STEEL)
    # far (LEFT) arm to the grip, with the gear-like armlet on its forearm
    f(limb([(X(360), 400), (X(330), 520), (X(370), 600)], 54), SKIN_C)
    d.ellipse([X(340) - 30, 500, X(340) + 30, 560], fill=(84, 88, 100))
    d.ellipse([X(340) - 16, 514, X(340) + 16, 546], fill=(200, 204, 214))
    f(limb([(X(460), 650), (X(520), 880), (X(560), 1070)], 100), INDIGO)              # near (right) leg back
    f(poly([(X(470), 1055), (X(610), 1050), (X(620), 1175), (X(420), 1178), (X(430), 1110)]), BOOT)
    # Buster Sword held low in front, tip toward frame-right near the ground: a wide heavy blade
    f(poly([(X(290), 640), (X(348), 694), (X(80), 1070), (X(20), 1016)]), BLADE, math.radians(60))
    d.line([(X(268), 668), (X(350), 606)], fill=(52, 54, 62), width=24)                # guard
    d.line([(X(325), 628), (X(372), 584)], fill=(52, 54, 62), width=18)                # grip
    # torso: sleeveless dark indigo shirt, two leather belts crossing at the waist
    f(poly([(X(350), 360), (X(500), 352), (X(515), 470), (X(490), 640), (X(370), 640), (X(345), 500)]), INDIGO)
    f(limb([(X(360), 600), (X(500), 650)], 16), LEATHER)
    f(limb([(X(360), 650), (X(500), 600)], 16), LEATHER)
    # head in profile toward frame-right
    f(ell([X(480), 190, X(370), 330]), SKIN_C)
    f(poly([(X(372), 250), (X(350), 272), (X(376), 280)]), SKIN_C)
    d.ellipse([X(406), 240, X(388), 256], fill=(60, 140, 220))
    spikes = [(360, 240), (320, 180), (380, 170), (370, 100), (430, 145), (460, 70), (480, 150), (550, 120), (510, 190), (560, 220), (490, 250), (470, 310), (450, 225), (400, 215)]
    f(poly([(X(x), y) for x, y in spikes]), BLOND, math.radians(90))
    # NEAR (RIGHT) arm: BARE shoulder (no pauldron on this side), down to the grip, SOLDIER band on the wrist
    f(limb([(X(490), 390), (X(500), 520), (X(380), 600)], 60), SKIN_C)
    f(limb([(X(420), 574), (X(404), 590)], 26), ((244, 244, 246), (190, 192, 198)))  # white wristband
    f(ell([X(400), 570, X(350), 625]), LEATHER)                                        # gloved hands on the grip
    return s.done()


out = sys.argv[1]
os.makedirs(out, exist_ok=True)
barret().save(os.path.join(out, 'barret-r.png'))
cloud().save(os.path.join(out, 'cloud-r.png'))
print('ok')
