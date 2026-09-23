"""Logos pose run: one full-body OpenPose (COCO-18) skeleton per state, drawn in PIL.

    D:/Tools/ComfyUI/python_embeded/python.exe -s draw-poses.py

Colours and limb order are controlnet_aux draw_bodypose (the same drawing as
../idle-pose.py, which the step pick used). Every skeleton faces LEFT like the idle
(profile, so the near side is his LEFT: keypoints 5-7 and 11-13 are the near arm and
leg; the right eye 14 and right ear 16 are hidden). Bone lengths follow the idle's
skeleton (../idle-pose.py, placed at the idle's cropBox 164,42) so the head comes out
the idle's size and no scale override is needed.

  attack : Double Shot. A lunge toward the party: near leg bent forward, far leg
           straight back, torso forward, BOTH arms straight out at shoulder height,
           the far arm a little higher so both revolvers read.
  cast   : Russian Roulette. The idle's stance; the near arm raised, elbow forward at
           shoulder height and the forearm up, so the revolver stands barrel-up in
           front of the face; the far arm stays low with the other revolver.
  hurt   : a recoil away from the party: torso and head thrown back to the right,
           weight on the braced back leg, near arm flung forward-low and far arm flung
           back, so both revolvers stay visible.
  ko     : lying on his back on a 1216x832 prone canvas (the pipeline's prone
           composition; a lying figure does not fit 832 wide at the idle's scale),
           head toward the party (left), knees slightly up, arms slack along the floor.

Writes <state>-pose.png (the ControlNet input) and poses-preview.jpg (all four next to
the idle's own skeleton over the idle).
"""
from __future__ import annotations

import math
import pathlib

from PIL import Image, ImageDraw

HERE = pathlib.Path(__file__).resolve().parent
REPO = HERE.parents[6]
COLORS = [(255, 0, 0), (255, 85, 0), (255, 170, 0), (255, 255, 0), (170, 255, 0),
          (85, 255, 0), (0, 255, 0), (0, 255, 85), (0, 255, 170), (0, 255, 255),
          (0, 170, 255), (0, 85, 255), (0, 0, 255), (85, 0, 255), (170, 0, 255),
          (255, 0, 255), (255, 0, 170), (255, 0, 85)]
LIMBS = [(1, 2), (1, 5), (2, 3), (3, 4), (5, 6), (6, 7), (1, 8), (8, 9), (9, 10),
         (1, 11), (11, 12), (12, 13), (1, 0), (0, 14), (14, 16), (0, 15), (15, 17)]

# Canvas pixels. For reference the idle on 832x1216: nose 402,170  neck 462,220
# R sh 426,264 el 369,442 wr 312,524 | L sh 486,280 el 426,462 wr 389,607
# R hip 419,512 kn 519,922 an 539,1077 | L hip 456,522 kn 404,937 an 409,1107
POSES = {
    'attack': ((832, 1216), {
        0: (318, 262), 15: (338, 244), 17: (376, 252), 1: (398, 318),
        2: (380, 338), 3: (262, 322), 4: (148, 310),          # far arm, out and a little high
        5: (420, 356), 6: (302, 362), 7: (186, 366),          # near arm, out at shoulder height
        8: (452, 628), 9: (590, 842), 10: (706, 1080),        # far leg straight back
        11: (430, 640), 12: (292, 822), 13: (262, 1108),      # near leg bent forward
    }),
    'cast': ((832, 1216), {
        0: (402, 190), 15: (422, 170), 17: (460, 182), 1: (462, 240),
        2: (426, 284), 3: (372, 462), 4: (318, 548),          # far arm low, like idle
        5: (486, 300), 6: (330, 318), 7: (318, 150),          # near arm: elbow forward, forearm up
        8: (419, 532), 9: (515, 930), 10: (539, 1092),
        11: (456, 542), 12: (404, 945), 13: (409, 1117),
    }),
    'hurt': ((832, 1216), {
        0: (524, 186), 15: (546, 180), 17: (584, 210), 1: (578, 268),
        2: (556, 300), 3: (650, 440), 4: (736, 530),          # far arm flung back
        5: (600, 318), 6: (520, 470), 7: (430, 560),          # near arm flung forward-low
        8: (476, 572), 9: (600, 830), 10: (664, 1090),        # braced back leg
        11: (506, 584), 12: (420, 830), 13: (392, 1068),      # near leg, weight off it
    }),
    # Round 2 of hurt: round 1 ('hurt', OpenPose 0.6) came back upright and walking (the
    # LoRA saw one standing painting). A deeper recoil: hips dropped, torso about 30 degrees
    # back, head thrown back (face turned up), weight on the bent back leg, the front foot
    # off the floor, the near arm trailing forward-low, the far arm flung back and up.
    'hurt2': ((832, 1216), {
        0: (588, 262), 15: (600, 272), 17: (646, 300), 1: (628, 346),
        2: (612, 372), 3: (690, 300), 4: (770, 236),          # far arm flung back and up
        5: (640, 388), 6: (560, 500), 7: (470, 572),          # near arm trailing forward-low
        8: (470, 604), 9: (590, 812), 10: (640, 1084),        # bent back leg, weight on it
        11: (500, 614), 12: (392, 822), 13: (300, 1000),      # front leg forward, foot off the floor
    }),
    'ko': ((1216, 832), {
        0: (196, 560), 15: (214, 566), 17: (252, 590), 1: (304, 622),
        2: (300, 604), 3: (420, 648), 4: (536, 690),          # far arm slack along the floor
        5: (312, 644), 6: (432, 690), 7: (556, 728),          # near arm slack along the floor
        8: (612, 616), 9: (820, 574), 10: (1006, 640),        # far leg, knee a little up
        11: (618, 646), 12: (826, 612), 13: (1016, 690),      # near leg
    }),
}


def draw(size, pts, stick=8, radius=7):
    w, h = size
    over = Image.new('RGB', (w, h), (0, 0, 0))
    d = ImageDraw.Draw(over)
    for li, (a, b) in enumerate(LIMBS):
        if a not in pts or b not in pts:
            continue
        (x1, y1), (x2, y2) = pts[a], pts[b]
        length = math.hypot(x2 - x1, y2 - y1)
        ang = math.atan2(y2 - y1, x2 - x1)
        mx, my = (x1 + x2) / 2, (y1 + y2) / 2
        poly = []
        for i in range(36):
            th = 2 * math.pi * i / 36
            ex, ey = length / 2 * math.cos(th), stick * math.sin(th)
            poly.append((mx + ex * math.cos(ang) - ey * math.sin(ang), my + ex * math.sin(ang) + ey * math.cos(ang)))
        d.polygon(poly, fill=COLORS[li])
    img = Image.blend(Image.new('RGB', (w, h)), over, 0.6)
    d2 = ImageDraw.Draw(img)
    for k, (x, y) in pts.items():
        d2.ellipse((x - radius, y - radius, x + radius, y + radius), fill=COLORS[k])
    return img


def main():
    tiles = [Image.open(HERE.parent / 'idle-pose-overlay.jpg').convert('RGB')]
    for state, (size, pts) in POSES.items():
        sk = draw(size, pts)
        sk.save(HERE / f'{state}-pose.png')
        tiles.append(sk)
    th = 600
    scaled = [t.resize((round(t.width * th / t.height), th)) for t in tiles]
    sheet = Image.new('RGB', (sum(t.width for t in scaled) + 10 * len(scaled), th), (40, 40, 40))
    x = 0
    for t in scaled:
        sheet.paste(t, (x, 0))
        x += t.width + 10
    sheet.save(HERE / 'poses-preview.jpg', quality=85)
    print('poses written:', ', '.join(POSES))


if __name__ == '__main__':
    main()
