"""Nooj shade attempt 7, idle-only repair of the repaired option-1 idle (FFX-2 only, Den of Woe).

Base: attempt 6's repaired idle raw (idle-repaired.raw.png, sha 8e1d77e9991c's source, 832x1216). Paints flat
block-ins for the faults the repair judge named (nooj-options/README.md, "Independent judge (repair)") and writes one
feathered mask per region. The three regions do not overlap, so each pass can be pasted over the previous one.

  loops : the two black "ram horn" loops -> brown hair loops (bible 1.23.4 ramp) with a red tie at each base,
          after cast 976202 and the portrait
  sleeve: the bare upper arm and the red/black/blue sleeve on the far (his right, cloth, screen-left) arm ->
          one purple sleeve (bible ramp) from under the fur to the glove
  near  : the lilac/orange fringe behind the neck on the near side removed (red suit shoulder + background), and the
          blue blade machina forearm with its fin spike -> a thin grey jointed arm with gaps (bible ramp, gold rings,
          blue power cell at the elbow); the machina hand below y 620 is not touched

Facing LEFT, three-quarter: his right (cloth, cane) side is screen-left, his left (machina) side is screen-right.
Coordinates were read off 3x gridded crops of the raw.

    python nooj7_prep.py   # writes D:/Tools/pyrefly-scratch/nooj7/prep/{loops,sleeve,near}-{guide,mask}.png + refs
"""
from __future__ import annotations

import pathlib

from PIL import Image, ImageDraw, ImageFilter

SRC = pathlib.Path('D:/Tools/pyrefly-art-backup/candidates/2026-09-25-nooj6/idle-repair/idle-repaired.raw.png')
CAST = pathlib.Path('D:/Tools/pyrefly-art-backup/candidates/2026-09-25-nooj6/cast/C-r1/cand-976202.raw.png')
OUT = pathlib.Path('D:/Tools/pyrefly-scratch/nooj7/prep')

# bible 1.23.4 ramps
HAIR_D, HAIR_M, HAIR_L = (58, 38, 22), (107, 74, 40), (156, 116, 72)
TIE, TIE_D = (176, 42, 42), (110, 22, 22)
PURP_D, PURP_M, PURP_L = (62, 26, 78), (106, 46, 128), (154, 90, 208)
RED_D, RED_M, RED_L = (110, 20, 20), (176, 42, 42), (217, 90, 78)
SUIT = (238, 74, 40)            # the render's own orange-red suit, sampled on the chest
M_D, M_M, M_L, GOLD, CELL = (74, 78, 88), (126, 132, 143), (180, 186, 196), (227, 185, 74), (110, 200, 240)
INK = (18, 14, 16)
WHITE = (255, 255, 255)


def feather(m: Image.Image, grow: int, blur: int) -> Image.Image:
    if grow:
        m = m.filter(ImageFilter.MaxFilter(grow * 2 + 1))
    return m.filter(ImageFilter.GaussianBlur(blur))


def ring(d: ImageDraw.ImageDraw, box, hole, width_col):
    d.ellipse(box, fill=width_col)
    d.ellipse(hole, fill=WHITE)


def loops(im: Image.Image):
    d = ImageDraw.Draw(im)
    m = Image.new('L', im.size, 0); dm = ImageDraw.Draw(m)
    # erase the horns (outside the skull) back to white
    dm.polygon([(334, 194), (392, 190), (400, 206), (394, 250), (386, 282), (336, 282)], fill=255)   # screen-left loop
    dm.polygon([(470, 206), (536, 208), (540, 296), (478, 296), (470, 262)], fill=255)               # screen-right loop
    d.polygon([(334, 194), (390, 192), (392, 252), (384, 280), (336, 280)], fill=WHITE)
    d.polygon([(482, 206), (536, 208), (540, 294), (482, 294)], fill=WHITE)
    # the horns' orange rims where they wrap onto the crown -> the crown's brown hair
    dm.polygon([(386, 194), (406, 196), (408, 216), (390, 220)], fill=255)
    dm.polygon([(456, 204), (484, 206), (486, 232), (460, 230)], fill=255)
    d.polygon([(390, 206), (404, 200), (410, 210), (396, 222)], fill=HAIR_M)
    d.line([(390, 206), (404, 199)], fill=INK, width=2)
    d.polygon([(458, 214), (474, 206), (484, 214), (480, 232), (462, 230)], fill=HAIR_M)
    d.line([(462, 211), (476, 205), (486, 214)], fill=INK, width=2)
    # screen-left loop: a round loop of brown hair rising from the side of the crown, red tie at the base
    d.ellipse((342, 200, 396, 262), fill=INK)
    d.ellipse((344, 202, 394, 260), fill=HAIR_M)
    d.arc((348, 206, 390, 256), 150, 330, fill=HAIR_L, width=4)            # sheen on the upper outside
    d.arc((350, 208, 388, 254), 330, 150, fill=HAIR_D, width=5)            # shadow on the lower inside
    d.ellipse((360, 216, 380, 246), fill=INK); d.ellipse((362, 218, 378, 244), fill=WHITE)   # the hole
    for a0 in (170, 200, 230, 260):                                        # strand lines
        d.arc((352, 210, 386, 252), a0, a0 + 18, fill=HAIR_D, width=1)
    d.polygon([(384, 246), (398, 238), (404, 254), (390, 262)], fill=INK)   # tie at the base, toward the skull
    d.polygon([(386, 247), (397, 241), (402, 253), (391, 259)], fill=TIE)
    d.line([(388, 250), (398, 245)], fill=RED_L, width=1)
    # screen-right loop (behind the head, near side): same, a little lower
    d.ellipse((480, 214, 532, 276), fill=INK)
    d.ellipse((482, 216, 530, 274), fill=HAIR_M)
    d.arc((486, 220, 526, 270), 210, 30, fill=HAIR_L, width=4)
    d.arc((488, 222, 524, 268), 30, 210, fill=HAIR_D, width=5)
    d.ellipse((496, 230, 516, 260), fill=INK); d.ellipse((498, 232, 514, 258), fill=WHITE)
    for a0 in (280, 310, 340, 10):
        d.arc((490, 224, 522, 266), a0, a0 + 18, fill=HAIR_D, width=1)
    d.polygon([(470, 250), (484, 244), (490, 262), (476, 268)], fill=INK)
    d.polygon([(472, 251), (483, 247), (488, 261), (477, 265)], fill=TIE)
    d.line([(474, 254), (484, 250)], fill=RED_L, width=1)
    return feather(m, 4, 4)


def sleeve(im: Image.Image):
    d = ImageDraw.Draw(im)
    m = Image.new('L', im.size, 0); dm = ImageDraw.Draw(m)
    arm = [(318, 404), (386, 404), (382, 432), (372, 470), (362, 505), (350, 545), (341, 576),
           (288, 578), (294, 540), (304, 500), (312, 452)]
    dm.polygon([(p[0] + (4 if p[0] > 330 else -5), p[1]) for p in arm], fill=255)
    # clear the gap between the arm and the torso that the skin used to fill (x > the new inner edge)
    d.polygon([(386, 404), (392, 404), (392, 440), (378, 470), (372, 470), (382, 432)], fill=RED_D)
    d.polygon(arm, fill=INK)
    inner = [(p[0] + (-3 if p[0] > 330 else 3), p[1] + (3 if p[1] < 420 else (-2 if p[1] > 570 else 0))) for p in arm]
    d.polygon(inner, fill=PURP_M)
    # the shadow band on the outer (screen-left) side and a highlight stripe down the middle
    d.polygon([(318, 407), (332, 407), (322, 460), (312, 505), (302, 545), (293, 575), (292, 540), (300, 500), (310, 452)], fill=PURP_D)
    d.line([(356, 412), (344, 470), (330, 530), (320, 572)], fill=PURP_L, width=4)
    for (x0, y0, x1, y1) in ((330, 440, 368, 452), (318, 494, 356, 504), (306, 540, 344, 548)):   # soft folds
        d.line([(x0, y0), ((x0 + x1) // 2, y0 + 6), (x1, y1)], fill=PURP_D, width=2)
    # fur edge tips hanging over the sleeve top (the fur itself is outside the mask)
    for x in range(322, 384, 9):
        d.polygon([(x, 402), (x + 8, 402), (x + 3, 416)], fill=(142, 140, 151))
    return feather(m, 4, 4)


def near(im: Image.Image):
    d = ImageDraw.Draw(im)
    m = Image.new('L', im.size, 0); dm = ImageDraw.Draw(m)
    # (a) the fringe behind the neck, near side
    fr = [(464, 312), (530, 312), (534, 392), (516, 428), (502, 424), (486, 372), (466, 334)]
    dm.polygon(fr, fill=255)
    d.polygon([(470, 312), (532, 312), (534, 400), (514, 424), (506, 420), (490, 380), (472, 340)], fill=WHITE)
    # the red suit's near shoulder: from under the hair at the neck, sloping down to the arm
    d.polygon([(462, 318), (472, 324), (488, 356), (500, 386), (510, 418), (506, 430), (470, 430), (462, 400)], fill=SUIT)
    d.line([(472, 324), (488, 356), (500, 386), (510, 418)], fill=INK, width=4)
    d.line([(476, 336), (490, 368), (500, 394)], fill=(250, 130, 90), width=2)   # rim light
    # (b) the machina arm: the blade and fin -> a thin grey jointed arm with gaps
    arm = [(500, 470), (536, 458), (562, 460), (566, 520), (566, 612), (518, 616), (506, 540)]
    dm.polygon(arm, fill=255)
    d.polygon([(506, 472), (566, 468), (568, 614), (516, 614), (510, 540)], fill=WHITE)
    # the red suit edge that the blade covered on its left keeps its line
    d.line([(506, 474), (510, 540), (516, 612)], fill=INK, width=2)
    # upper arm: one grey bar from the shoulder joint to the elbow
    d.line([(514, 474), (522, 534)], fill=INK, width=16)
    d.line([(514, 474), (522, 534)], fill=M_M, width=12)
    d.line([(510, 478), (518, 532)], fill=M_L, width=3)
    d.line([(518, 480), (526, 530)], fill=M_D, width=3)
    d.ellipse((508, 470, 522, 484), fill=GOLD)                                   # shoulder ring
    # elbow joint: dark hub, gold ring, the 2x2 blue power cell
    d.ellipse((512, 530, 536, 554), fill=INK); d.ellipse((514, 532, 534, 552), fill=M_D)
    d.ellipse((518, 536, 530, 548), outline=GOLD, width=2)
    d.rectangle((522, 540, 526, 544), fill=CELL)
    # forearm: two thin rods with a visible gap, joined by a mid bracket
    for dx, col in ((-5, M_M), (6, M_L)):
        d.line([(524 + dx, 552), (536 + dx, 610)], fill=INK, width=7)
        d.line([(524 + dx, 552), (536 + dx, 610)], fill=col, width=4)
    d.polygon([(516, 578), (538, 574), (540, 584), (518, 588)], fill=M_D)        # bracket across the rods
    d.line([(518, 580), (538, 577)], fill=GOLD, width=1)
    d.ellipse((526, 604, 548, 620), fill=INK); d.ellipse((528, 606, 546, 618), fill=M_M)   # wrist into the cuff
    return feather(m, 4, 4)


def square_pad(im: Image.Image, fill=(255, 255, 255)) -> Image.Image:
    s = max(im.size); o = Image.new('RGB', (s, s), fill); o.paste(im, ((s - im.width) // 2, (s - im.height) // 2)); return o


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    src = Image.open(SRC).convert('RGB')
    for name, fn in (('loops', loops), ('sleeve', sleeve), ('near', near)):
        g = src.copy(); m = fn(g)
        g.save(OUT / f'{name}-guide.png'); m.save(OUT / f'{name}-mask.png')
        ov = Image.composite(Image.new('RGB', g.size, (255, 0, 255)), g, m.point(lambda v: v // 4))
        ov.save(OUT / f'{name}-overlay.jpg', quality=90)
    # the loop reference: cast 976202's head (brown loops, red ties), square-padded on white
    square_pad(Image.open(CAST).convert('RGB').crop((560, 160, 780, 360))).save(OUT / 'ref-cast976202-head.png')
    print('ok', OUT)




def sleeve2():
    """Sleeve try 2 (over try 1's seed 977101). Try 1 fixed the bare skin, but at 1:1 the sleeve was a pale
    lilac-grey tube and its top met the fur in a straight grey seam. The guide recolours try 1's sleeve onto the
    bible's purple ramp by its own luminance (shading kept), hangs ragged fur tips (the fur's own lilac-grey and
    purple) over the sleeve top, and the whole sleeve plus the seam band is repainted at a lower denoise."""
    import random
    import numpy as np
    random.seed(7)
    im = Image.open('D:/Tools/pyrefly-art-backup/candidates/2026-09-25-nooj7/r1/sleeve-977101.png').convert('RGB')
    sm = np.asarray(Image.open(OUT / 'sleeve-mask.png').convert('L')).astype(np.float32) / 255.0
    a = np.asarray(im).astype(np.float32)
    lum = (a.mean(axis=2, keepdims=True) / 255.0)
    ramp_d, ramp_m, ramp_l = (np.array(c, np.float32) for c in (PURP_D, PURP_M, PURP_L))
    t = np.clip((lum - 0.25) / 0.5, 0, 1)
    purple = np.where(t < 0.5, ramp_d + (ramp_m - ramp_d) * (t * 2), ramp_m + (ramp_l - ramp_m) * ((t - 0.5) * 2))
    inside = (sm[..., None] > 0.6) & (lum < 0.85)
    a = np.where(inside, purple, a)
    im = Image.fromarray(a.astype(np.uint8))
    d = ImageDraw.Draw(im)
    m = Image.open(OUT / 'sleeve-mask.png').convert('L'); dm = ImageDraw.Draw(m)
    dm.polygon([(304, 388), (396, 388), (396, 432), (304, 440)], fill=255)
    FUR_L, FUR_M, FUR_D = (200, 194, 210), (158, 128, 176), (96, 70, 120)
    x = 310
    while x < 392:
        w = random.randint(8, 13); L = random.randint(10, 24)
        tip = (x + w // 2 + random.randint(-2, 2), 400 + L)
        d.polygon([(x - 1, 396), (x + w + 1, 396), tip], fill=INK)
        d.polygon([(x + 1, 396), (x + w - 1, 396), (tip[0], tip[1] - 3)], fill=FUR_M if (x // 10) % 2 else FUR_L)
        d.line([(x + w // 2, 398), (tip[0], tip[1] - 6)], fill=FUR_D, width=1)
        x += w - 2
    return im, m.filter(ImageFilter.GaussianBlur(4))


if __name__ == '__main__':
    if 'sleeve2' in __import__('sys').argv:   # python nooj7_prep.py sleeve2
        g, mk = sleeve2()
        g.save(OUT / 'sleeve2-guide.png'); mk.save(OUT / 'sleeve2-mask.png')
        print('ok sleeve2')
    else:
        main()
