"""Nooj shade attempt 6, targeted repair of option 1's idle (FFX-2 only, Den of Woe).

Paints flat block-ins over option 1's idle raw (idle-lean C-opt seed 975102, 832x1216) for the three regions the
independent judge named (nooj-options/README.md, "Independent judge"), and writes one feathered mask per region:

  hand  : the cane hand, a black-gloved human fist around the cane top (no silver fingers, no spur)
  mhand : the machina hand, a jointed grey metal hand with segmented fingers and gaps (bible 1.23.4 ramp)
  feet  : one purple boot with a toe, and one grey metal foot (a flat foot plate, no peg, no hoof)

Facing LEFT, three-quarter toward the viewer: his right (cloth, cane) side is screen-left, his left (machina) side is
screen-right and near. Toes point screen-left. Coordinates were read off 1:1 gridded crops of the raw.

    python nooj6_idle_prep.py [--round N]   # writes D:/Tools/pyrefly-scratch/nooj6/prep/idle-*.png
"""
from __future__ import annotations

import pathlib
import sys

from PIL import Image, ImageDraw, ImageFilter

SRC = pathlib.Path('D:/Tools/pyrefly-art-backup/candidates/2026-09-25-nooj5/idle-lean/C-opt/cand-975102.raw.png')
OUT = pathlib.Path('D:/Tools/pyrefly-scratch/nooj6/prep')

# bible 1.23.4 ramps
GLOVE, GLOVE_HI, GLOVE_LINE = (22, 22, 30), (70, 72, 86), (8, 8, 12)
M_D, M_M, M_L, GOLD = (74, 78, 88), (126, 132, 143), (180, 186, 196), (227, 185, 74)
PURP_D, PURP_M, PURP_L = (62, 26, 78), (106, 46, 128), (154, 90, 208)
LEG_RED = (150, 24, 20)
WHITE = (255, 255, 255)


def feather(m: Image.Image, grow: int, blur: int) -> Image.Image:
    if grow:
        m = m.filter(ImageFilter.MaxFilter(grow * 2 + 1))
    return m.filter(ImageFilter.GaussianBlur(blur))


def cane_hand(im: Image.Image):
    d = ImageDraw.Draw(im)
    m = Image.new('L', im.size, 0); dm = ImageDraw.Draw(m)
    # erase the silver fingers and the fingerless glove back to white, then the cane top again
    fist = [(282, 586), (318, 584), (334, 612), (330, 650), (318, 676), (290, 684), (262, 676), (250, 652), (256, 620)]
    dm.polygon([(p[0] + (4 if p[0] > 290 else -8), p[1] + (-2 if p[1] < 600 else 6)) for p in fist], fill=255)
    d.polygon([(248, 610), (336, 600), (340, 690), (246, 692)], fill=WHITE)
    d.line([(304, 640), (300, 700)], fill=(200, 204, 214), width=14)          # cane top under the fist
    # the black glove: back of the hand toward the viewer, fingers curled around the cane top
    d.polygon(fist, fill=GLOVE)
    for y0 in (628, 642, 656, 668):                                           # finger folds (knuckle creases)
        d.line([(258, y0 + 4), (300, y0 - 2), (318, y0 + 2)], fill=GLOVE_LINE, width=3)
    d.line([(262, 626), (300, 616), (318, 624)], fill=GLOVE_HI, width=4)      # knuckle highlight
    d.polygon([(318, 612), (336, 624), (332, 648), (320, 640)], fill=GLOVE)  # thumb over the far side
    d.line([(320, 616), (332, 630)], fill=GLOVE_HI, width=2)
    return feather(m, 6, 5)


def machina_hand(im: Image.Image):
    d = ImageDraw.Draw(im)
    m = Image.new('L', im.size, 0); dm = ImageDraw.Draw(m)
    dm.polygon([(508, 604), (560, 604), (566, 640), (560, 704), (500, 704), (506, 650)], fill=255)
    # erase the fin: red leg left of its edge line, white to the right of it
    d.polygon([(506, 616), (566, 616), (566, 700), (504, 700)], fill=WHITE)
    d.polygon([(504, 616), (522, 616), (536, 700), (504, 700)], fill=LEG_RED)
    # wrist joint, palm plate, four jointed fingers with gaps, a thumb forward (screen-left)
    d.ellipse((524, 610, 548, 628), fill=M_D); d.ellipse((530, 614, 542, 624), fill=GOLD)
    d.polygon([(522, 624), (552, 624), (554, 650), (522, 652)], fill=M_M)
    d.line([(526, 628), (548, 628)], fill=M_L, width=3)
    for i, x in enumerate((524, 532, 540, 548)):
        L1, L2 = 16 + (i % 2) * 3, 13
        d.line([(x, 652), (x - 1, 652 + L1)], fill=M_M, width=5)
        d.ellipse((x - 4, 652 + L1 - 3, x + 3, 652 + L1 + 4), fill=GOLD)
        d.line([(x - 1, 652 + L1 + 2), (x - 4, 652 + L1 + L2)], fill=M_M, width=4)
        d.line([(x + 1, 654), (x + 1, 652 + L1 - 2)], fill=M_L, width=1)
    d.line([(522, 638), (512, 654)], fill=M_M, width=5)                     # thumb
    d.ellipse((509, 652, 516, 659), fill=GOLD)
    d.line([(512, 657), (510, 668)], fill=M_M, width=4)
    return feather(m, 4, 4)


def feet(im: Image.Image):
    d = ImageDraw.Draw(im)
    m = Image.new('L', im.size, 0); dm = ImageDraw.Draw(m)
    # purple boot (his right, far): ankle 318..395 at y~1110, toe screen-left to x~282, sole at y~1172
    dm.polygon([(270, 1100), (404, 1100), (408, 1186), (262, 1188)], fill=255)
    d.polygon([(262, 1128), (316, 1128), (316, 1180), (262, 1180)], fill=WHITE)
    boot = [(322, 1104), (394, 1104), (398, 1150), (400, 1170), (292, 1174), (282, 1166), (286, 1152), (318, 1138)]
    d.polygon(boot, fill=PURP_M)
    d.polygon([(286, 1152), (318, 1140), (330, 1150), (300, 1162)], fill=PURP_L)   # toe cap highlight
    d.line([(282, 1170), (400, 1170)], fill=PURP_D, width=6)                        # sole
    d.line([(330, 1120), (392, 1116)], fill=PURP_D, width=4)                        # ankle strap
    # metal foot (his left, near): ankle 504..566, flat foot plate with a toe plate to x~468, sole y~1164
    dm.polygon([(456, 1096), (576, 1096), (580, 1180), (452, 1180)], fill=255)
    d.polygon([(456, 1128), (504, 1128), (504, 1178), (456, 1178)], fill=WHITE)
    d.ellipse((512, 1110, 556, 1134), fill=M_D); d.ellipse((528, 1116, 540, 1128), fill=GOLD)   # ankle joint
    d.polygon([(508, 1128), (566, 1128), (568, 1162), (508, 1164)], fill=M_M)                  # heel/instep plate
    d.polygon([(508, 1138), (476, 1150), (468, 1164), (510, 1166)], fill=M_M)                  # toe plate
    d.line([(508, 1140), (508, 1164)], fill=M_D, width=3)                                     # toe hinge
    d.line([(472, 1150), (506, 1140)], fill=M_L, width=3)
    d.line([(466, 1166), (570, 1164)], fill=M_D, width=5)                                     # sole
    return feather(m, 4, 5)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    src = Image.open(SRC).convert('RGB')
    for name, fn in (('hand', cane_hand), ('mhand', machina_hand), ('feet', feet)):
        g = src.copy(); m = fn(g)
        g.save(OUT / f'idle-{name}-guide.png'); m.save(OUT / f'idle-{name}-mask.png')
        ov = Image.composite(Image.new('RGB', g.size, (255, 0, 255)), g, m.point(lambda v: v // 4))
        ov.save(OUT / f'idle-{name}-overlay.jpg', quality=90)
    print('ok', OUT)


if __name__ == '__main__':
    main()
