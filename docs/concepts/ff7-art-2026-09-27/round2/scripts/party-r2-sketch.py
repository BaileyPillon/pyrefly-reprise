"""Round 2 layout sketches for Barret and Cloud (original, drawn in code from written canon only:
FF Wiki "Barret Wallace" revid 4042820 and "Cloud Strife" revid 4045701, Appearance sections;
no image was looked at, traced or used as input).

FF7 staging (research/ff7-battle-staging.md sections 2, 6.3, 7): the party stands on the RIGHT
and faces LEFT, so each figure is drawn in three-quarter view facing frame-left and shows its
LEFT side to the camera:
  - Barret: the gun-arm is his RIGHT arm, the FAR arm. It is drawn pointed forward (toward the
    left edge, at the enemy) from the leading shoulder so it clears the body. Grafted: no right
    hand; the gun starts below the elbow. His LEFT (near) arm has the fist, the metal bands and,
    on the shoulder, the skull tattoo.
  - Cloud: the single pauldron is on his LEFT shoulder, the NEAR shoulder (screen-right side of
    the torso). Gear-like armlet on the left forearm; SOLDIER band on the right wrist.
Never mirrored. Usage: python party-r2-sketch.py <out_dir> -> barret2.png, cloud2.png (832x1216)
"""
import sys, os
from PIL import Image, ImageDraw

W, H = 832, 1216
SKIN_D, SKIN_DL = (92, 58, 40), (122, 80, 56)
SKIN_C, SKIN_CL = (238, 198, 164), (250, 220, 190)
BLACK = (24, 22, 24)
VEST, VEST_D = (126, 78, 42), (92, 56, 30)
GREEN, GREEN_D = (86, 104, 58), (62, 78, 42)
BOOT, BOOT_D = (112, 66, 36), (80, 46, 26)
STEEL, STEEL_D, STEEL_L = (96, 100, 112), (52, 54, 62), (170, 174, 184)
BONE = (236, 230, 214)
INDIGO, INDIGO_D = (54, 58, 108), (38, 40, 78)
BLOND, BLOND_D = (240, 214, 110), (206, 172, 70)
GLOVE = (104, 66, 40)
BELT = (122, 84, 50)


def limb(d, pts, w, col):
    for a, b in zip(pts, pts[1:]):
        d.line([a, b], fill=col, width=w)
    for p in pts:
        r = w // 2
        d.ellipse([p[0] - r, p[1] - r, p[0] + r, p[1] + r], fill=col)


def barret():
    im = Image.new('RGB', (W, H), 'white')
    d = ImageDraw.Draw(im)
    # far (right) leg, forward and to frame-left
    limb(d, [(360, 660), (280, 880), (230, 1080)], 120, GREEN_D)
    d.polygon([(150, 1060), (300, 1050), (310, 1170), (110, 1175), (110, 1120)], fill=BOOT_D)
    # far (RIGHT) arm: upper arm forward, then the GUN-ARM grafted from below the elbow, aimed left
    limb(d, [(320, 390), (230, 470)], 78, SKIN_D)
    d.rectangle([150, 430, 250, 520], fill=STEEL_L)          # graft cuff over the elbow
    d.rectangle([60, 440, 170, 510], fill=STEEL)             # gun body
    for y in (448, 468, 488, 505):                           # gatling barrels
        d.rectangle([8, y - 7, 90, y + 7], fill=STEEL_D)
    d.rectangle([40, 432, 60, 518], fill=STEEL_D)            # muzzle ring
    # near (left) leg, back and to frame-right
    limb(d, [(470, 660), (540, 880), (560, 1080)], 130, GREEN)
    d.polygon([(470, 1050), (640, 1050), (660, 1175), (440, 1180), (440, 1110)], fill=BOOT)
    # hips with several metal bands around the waist
    d.polygon([(300, 600), (560, 600), (590, 720), (280, 720)], fill=GREEN)
    for y in (600, 625, 650):
        d.rectangle([295, y, 565, y + 14], fill=STEEL)
    # torso: dirty brown vest, open at the front (the leading, frame-left edge)
    d.polygon([(290, 360), (540, 340), (600, 420), (570, 610), (300, 610), (270, 470)], fill=VEST)
    d.polygon([(290, 370), (360, 360), (350, 600), (300, 600), (275, 470)], fill=SKIN_D)   # bare chest
    d.line([(360, 360), (350, 600)], fill=VEST_D, width=10)
    # two dog tags on a chain
    d.line([(330, 330), (325, 470)], fill=STEEL_L, width=4)
    d.rectangle([312, 470, 336, 500], fill=STEEL_L)
    d.rectangle([330, 478, 352, 506], fill=STEEL_L)
    # head in three-quarter view facing left: hi-top fade, thick beard
    d.ellipse([320, 160, 470, 330], fill=SKIN_D)
    d.rectangle([338, 110, 460, 190], fill=BLACK)             # hi-top fade
    d.polygon([(320, 250), (370, 250), (420, 300), (440, 340), (350, 345), (315, 300)], fill=BLACK)  # beard
    d.rectangle([340, 222, 370, 232], fill=BLACK)             # brow
    d.ellipse([455, 238, 471, 256], fill=STEEL_L)             # silver hoop earring, left ear
    # near (LEFT) arm: shoulder with the skull tattoo, metal bands on the forearm, clenched fist
    limb(d, [(560, 390), (620, 560), (590, 700)], 96, SKIN_DL)
    d.ellipse([540, 380, 610, 440], fill=BONE)                # skull tattoo (left shoulder)
    d.rectangle([558, 432, 592, 452], fill=BONE)
    d.ellipse([553, 398, 571, 414], fill=SKIN_D)
    d.ellipse([579, 398, 597, 414], fill=SKIN_D)
    for y in (600, 628, 656):
        d.line([(566, y), (628, y + 6)], fill=STEEL, width=14)
    d.ellipse([550, 680, 640, 760], fill=SKIN_D)              # fist
    return im


def cloud():
    im = Image.new('RGB', (W, H), 'white')
    d = ImageDraw.Draw(im)
    # far (right) leg forward, near (left) leg back
    limb(d, [(370, 650), (300, 880), (260, 1070)], 96, INDIGO_D)
    d.polygon([(190, 1050), (310, 1040), (320, 1170), (150, 1175), (150, 1120)], fill=BOOT)
    limb(d, [(460, 650), (520, 880), (540, 1070)], 104, INDIGO)
    d.polygon([(470, 1050), (610, 1050), (630, 1175), (450, 1178), (450, 1110)], fill=BOOT)
    # the broadsword: huge, wide blade held two-handed in front, tip down toward frame-left
    d.polygon([(300, 612), (348, 660), (70, 1080), (40, 1030)], fill=STEEL_L)
    d.polygon([(300, 612), (325, 636), (58, 1058), (40, 1030)], fill=STEEL)
    d.line([(280, 640), (360, 580)], fill=STEEL_D, width=22)  # guard
    d.line([(335, 600), (380, 555)], fill=STEEL_D, width=16)  # grip
    # far (RIGHT) arm to the grip, SOLDIER band at the wrist
    limb(d, [(330, 380), (270, 500), (340, 580)], 56, SKIN_C)
    d.ellipse([318, 560, 366, 604], fill=GLOVE)
    d.line([(300, 548), (325, 575)], fill=STEEL_D, width=14)
    # torso: sleeveless indigo top, two brown belts
    d.polygon([(320, 360), (520, 350), (540, 470), (500, 640), (350, 640), (320, 500)], fill=INDIGO)
    d.line([(330, 600), (510, 650)], fill=BELT, width=16)
    d.line([(330, 650), (510, 600)], fill=BELT, width=16)
    # head in three-quarter view facing left, spiky blond hair
    d.ellipse([350, 190, 470, 330], fill=SKIN_C)
    spikes = [(330, 250), (290, 190), (350, 180), (330, 110), (400, 150), (420, 70), (450, 150), (520, 110), (490, 190), (540, 210), (480, 240), (470, 300), (440, 220), (380, 215), (350, 260)]
    d.polygon(spikes, fill=BLOND)
    d.polygon([(420, 70), (450, 150), (430, 160), (410, 110)], fill=BLOND_D)
    # near (LEFT) arm: pauldron on the shoulder, gear armlet on the forearm, across to the grip
    limb(d, [(510, 390), (540, 520), (390, 575)], 60, SKIN_CL)
    d.ellipse([450, 330, 580, 440], fill=STEEL)               # the single pauldron, LEFT shoulder
    d.ellipse([470, 345, 560, 420], fill=STEEL_L)
    for bx in (482, 540):
        d.ellipse([bx - 7, 395 - 7, bx + 7, 395 + 7], fill=STEEL_D)   # bolts
    d.ellipse([460, 510, 520, 570], fill=STEEL_D)             # gear-like armlet, left forearm
    d.ellipse([474, 524, 506, 556], fill=STEEL_L)
    d.ellipse([360, 545, 410, 600], fill=GLOVE)
    return im


def cloud_turned():
    """Second pass: the first Cloud batch came back nearly frontal. Narrower torso, face in
    profile toward frame-left, boots pointing left, the LEFT pauldron still on the near shoulder."""
    im = Image.new('RGB', (W, H), 'white')
    d = ImageDraw.Draw(im)
    limb(d, [(390, 650), (310, 880), (250, 1070)], 92, INDIGO_D)            # far (right) leg forward
    d.polygon([(150, 1060), (290, 1045), (300, 1170), (120, 1175), (110, 1120)], fill=BOOT)
    limb(d, [(460, 650), (520, 880), (560, 1070)], 100, INDIGO)             # near (left) leg back
    d.polygon([(470, 1055), (610, 1050), (620, 1175), (420, 1178), (430, 1110)], fill=BOOT)
    # sword held low in front, tip toward frame-left, near the ground
    d.polygon([(290, 640), (332, 684), (70, 1060), (36, 1020)], fill=STEEL_L)
    d.polygon([(290, 640), (312, 662), (54, 1042), (36, 1020)], fill=STEEL)
    d.line([(268, 668), (350, 606)], fill=STEEL_D, width=22)
    d.line([(325, 628), (372, 584)], fill=STEEL_D, width=16)
    limb(d, [(360, 390), (320, 520), (330, 610)], 54, SKIN_C)               # far (right) arm
    d.line([(312, 570), (340, 596)], fill=STEEL_D, width=14)                # SOLDIER band, right wrist
    d.polygon([(350, 360), (500, 352), (515, 470), (490, 640), (370, 640), (345, 500)], fill=INDIGO)
    d.line([(360, 600), (500, 650)], fill=BELT, width=16)
    d.line([(360, 650), (500, 600)], fill=BELT, width=16)
    # head in profile toward frame-left: nose and eye on the left side of the face
    d.ellipse([370, 190, 480, 330], fill=SKIN_C)
    d.polygon([(372, 250), (350, 272), (376, 280)], fill=SKIN_C)            # nose
    d.ellipse([388, 240, 406, 256], fill=(60, 140, 220))                    # eye
    spikes = [(360, 240), (320, 180), (380, 170), (370, 100), (430, 145), (460, 70), (480, 150), (550, 120), (510, 190), (560, 220), (490, 250), (470, 310), (450, 225), (400, 215)]
    d.polygon(spikes, fill=BLOND)
    limb(d, [(490, 390), (500, 520), (380, 600)], 58, SKIN_CL)              # near (left) arm to the grip
    d.ellipse([430, 330, 560, 440], fill=STEEL)                             # the single pauldron, LEFT shoulder
    d.ellipse([450, 345, 540, 420], fill=STEEL_L)
    for bx in (462, 520):
        d.ellipse([bx - 7, 388, bx + 7, 402], fill=STEEL_D)
    d.ellipse([440, 520, 500, 580], fill=STEEL_D)                           # gear-like armlet, left forearm
    d.ellipse([454, 534, 486, 566], fill=STEEL_L)
    d.ellipse([350, 570, 400, 625], fill=GLOVE)
    return im


out = sys.argv[1]
os.makedirs(out, exist_ok=True)
barret().save(os.path.join(out, 'barret2.png'))
cloud().save(os.path.join(out, 'cloud2.png'))
cloud_turned().save(os.path.join(out, 'cloud2t.png'))
print('ok')
