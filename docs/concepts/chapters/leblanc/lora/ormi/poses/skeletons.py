"""Ormi pose skeletons (FFX-2 only, Chapter 6): OpenPose COCO-18 control images
for the ormiX2 LoRA pose renders (render.mjs).

Drawn by hand in PIL, one per state, facing as the installed idle: screen-RIGHT
(idle.json facing "right"), so the near side is his RIGHT (keypoints 2-4, 8-10,
14, 16). Colours and limb order follow controlnet_aux draw_bodypose, as
docs/concepts/chapters/leblanc/lora/logos/idle-pose.py and tools/gen/rig-lora-pose.py do.

  idle   : the installed idle read by eye (scale check only, not rendered)
  attack : shield bash, a lunge to the right, both arms driving forward (shield leads)
  cast   : Supercollider wind-up, feet planted wide, far fist raised high
  hurt   : recoil, torso and head thrown back to the left, far arm flung out,
           near hand to the belly, front foot kicked up
  attack2: a deeper lunge (about 35 degrees of lean), both hands together at chest height
  hurt2  : a harder recoil, head thrown back, far arm flung up, front foot off the ground
  hurt3  : knocked back, hips forward and torso back about 30 degrees, far arm flung
           forward-low (not up: an arm up read as reaching), near hand to the belly
  ko     : lying on his back, head to the right (toward the party), 1216x832

    python skeletons.py      # writes skel-<state>.png and skel-overlay.jpg here
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

# canvas pixels. 0 nose 1 neck 2-4 R arm 5-7 L arm 8-10 R leg 11-13 L leg 14/15 eyes 16/17 ears
POSES = {
    'idle': ((832, 1216), {
        0: (476, 192), 1: (421, 262), 14: (462, 160), 15: (492, 163), 16: (400, 165),
        2: (361, 300), 3: (380, 440), 4: (520, 410), 5: (531, 312), 6: (560, 430), 7: (430, 400),
        8: (391, 575), 9: (350, 850), 10: (301, 1130), 11: (471, 575), 12: (465, 850), 13: (461, 1112),
    }),
    'attack': ((832, 1216), {
        0: (585, 318), 1: (495, 378), 14: (572, 290), 15: (608, 296), 16: (515, 296),
        2: (440, 405), 3: (548, 488), 4: (660, 452), 5: (560, 392), 6: (645, 452), 7: (722, 405),
        8: (365, 700), 9: (262, 905), 10: (150, 1130), 11: (445, 690), 12: (575, 890), 13: (615, 1135),
    }),
    'cast': ((832, 1216), {
        0: (478, 222), 1: (420, 298), 14: (465, 192), 15: (500, 198), 16: (402, 200),
        2: (362, 330), 3: (352, 480), 4: (395, 595), 5: (478, 318), 6: (560, 215), 7: (585, 88),
        8: (372, 640), 9: (318, 880), 10: (282, 1132), 11: (448, 640), 12: (512, 880), 13: (552, 1132),
    }),
    'hurt': ((832, 1216), {
        0: (395, 238), 1: (345, 330), 14: (378, 212), 15: (412, 222), 16: (318, 245),
        2: (300, 362), 3: (318, 492), 4: (430, 545), 5: (398, 345), 6: (505, 360), 7: (608, 300),
        8: (400, 660), 9: (352, 890), 10: (300, 1132), 11: (470, 660), 12: (585, 820), 13: (672, 945),
    }),
    'attack2': ((832, 1216), {
        0: (618, 368), 1: (520, 420), 14: (606, 340), 15: (640, 348), 16: (545, 345),
        2: (470, 440), 3: (585, 505), 4: (700, 470), 5: (580, 425), 6: (660, 470), 7: (725, 440),
        8: (385, 725), 9: (275, 925), 10: (160, 1135), 11: (455, 715), 12: (605, 900), 13: (645, 1135),
    }),
    'hurt2': ((832, 1216), {
        0: (368, 282), 1: (330, 368), 14: (348, 256), 15: (388, 262), 16: (295, 300),
        2: (285, 395), 3: (318, 525), 4: (448, 565), 5: (380, 380), 6: (455, 305), 7: (548, 228),
        8: (445, 690), 9: (400, 905), 10: (330, 1135), 11: (515, 690), 12: (625, 860), 13: (705, 985),
    }),
    'hurt3': ((832, 1216), {
        0: (372, 300), 1: (330, 380), 14: (352, 275), 15: (392, 282), 16: (300, 318),
        2: (290, 410), 3: (300, 540), 4: (400, 590), 5: (385, 395), 6: (470, 440), 7: (560, 420),
        8: (470, 690), 9: (420, 900), 10: (350, 1135), 11: (540, 690), 12: (640, 880), 13: (700, 1060),
    }),
    'ko': ((1216, 832), {
        0: (1068, 492), 1: (960, 555), 14: (1058, 468), 15: (1090, 478), 16: (1010, 470),
        2: (950, 505), 3: (820, 470), 4: (690, 505), 5: (955, 615), 6: (840, 675), 7: (720, 690),
        8: (625, 520), 9: (405, 505), 10: (170, 545), 11: (625, 610), 12: (405, 625), 13: (160, 665),
    }),
}


def draw(size, pts, stick: int = 10, radius: int = 8) -> Image.Image:
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


# Scaled variants (s85): the first renders filled the frame (the LoRA's heavy body is
# wider than a stick figure; the cut-out guard rejected them for coverage) and drew
# heads larger than idle's, so the figure is shrunk to 85 percent about the feet
# (standing) or the frame centre (ko).
SCALE = 0.85
PIVOT = {'ko': (608, 600)}


def scaled(name, pts):
    px, py = PIVOT.get(name, (416, 1135))
    return {k: (round(px + (x - px) * SCALE), round(py + (y - py) * SCALE)) for k, (x, y) in pts.items()}


def main() -> None:
    tiles = []
    for name, (size, pts) in list(POSES.items()):
        if name == 'idle':
            continue
        draw(size, scaled(name, pts)).save(HERE / f'skel-{name}-s85.png')
    for name, (size, pts) in POSES.items():
        sk = draw(size, pts)
        if name != 'idle':
            sk.save(HERE / f'skel-{name}.png')
        bg = Image.new('RGBA', size, (255, 255, 255, 255))
        if name == 'idle':  # scale check: the idle on its own 832x1216 canvas (idle.json cropBox origin 131,10)
            idle = Image.open(REPO / 'public/art/characters/ormi/idle.png').convert('RGBA')
            bg.alpha_composite(idle, (131, 10))
        mask = sk.convert('L').point(lambda v: 255 if v > 10 else 0)
        bg.paste(sk, (0, 0), mask)
        tiles.append(bg.convert('RGB'))
    hh = 600
    row = [t.resize((round(t.width * hh / t.height), hh)) for t in tiles]
    sheet = Image.new('RGB', (sum(t.width for t in row) + 10 * len(row), hh), (255, 255, 255))
    x = 0
    for t in row:
        sheet.paste(t, (x, 0))
        x += t.width + 10
    sheet.save(HERE / 'skel-overlay.jpg', quality=85)


if __name__ == '__main__':
    main()
