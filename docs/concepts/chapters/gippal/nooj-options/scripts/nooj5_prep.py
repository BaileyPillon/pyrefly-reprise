"""Nooj shade attempt 5 (FFX-2 only, Den of Woe): skeletons, region masks, block-ins and the two IP-Adapter refs.

Method: docs/concepts/chapters/gippal/production/METHOD-nooj-2.md. OpenPose COCO-18 drawn in PIL with the
controlnet_aux colours and limb order (as docs/concepts/chapters/trema/poses/skeletons.py). Nooj is an ENEMY: he
faces screen-LEFT, three-quarter toward the viewer, so his LEFT (machina) side is near the camera and on screen-right,
his RIGHT (cloth, fur, cane) side is far and on screen-left; the visible ear is his left ear (bible 1.23.4 staging).

    python nooj5_prep.py     # writes D:/Tools/pyrefly-scratch/nooj5/prep/*
"""
from __future__ import annotations

import math
import pathlib

from PIL import Image, ImageDraw, ImageFilter

OUT = pathlib.Path('D:/Tools/pyrefly-scratch/nooj5/prep')
PORTRAIT = pathlib.Path('D:/Final Fantasy/public/art/portraits/nooj.png')
COLORS = [(255, 0, 0), (255, 85, 0), (255, 170, 0), (255, 255, 0), (170, 255, 0),
          (85, 255, 0), (0, 255, 0), (0, 255, 85), (0, 255, 170), (0, 255, 255),
          (0, 170, 255), (0, 85, 255), (0, 0, 255), (85, 0, 255), (170, 0, 255),
          (255, 0, 255), (255, 0, 170), (255, 0, 85)]
LIMBS = [(1, 2), (1, 5), (2, 3), (3, 4), (5, 6), (6, 7), (1, 8), (8, 9), (9, 10),
         (1, 11), (11, 12), (12, 13), (1, 0), (0, 14), (14, 16), (0, 15), (15, 17)]


def P(o, length, deg):
    r = math.radians(deg)
    return (o[0] + length * math.cos(r), o[1] + length * math.sin(r))


def fig(hip, torso=270, *, s=0.95, head=None, sh=40, hp=32, R=(110, 100), L=(82, 95), RL=(100, 95), LL=(80, 88),
        turn=16, override=None):
    """Facing LEFT. R* = his right (far, screen-left), L* = his left (machina, near, screen-right).
    Arm/leg tuples are (upper, lower) screen angles: 0 right, 90 down, 180 left, 270 up."""
    T, N, UA, FA, TH, SHN = 250 * s, 76 * s, 150 * s, 135 * s, 285 * s, 280 * s
    k = {}
    neck = P(hip, T, torso); k[1] = neck
    perp = torso + 90
    k[2] = P(neck, sh * s, perp + 180); k[5] = P(neck, sh * s, perp)
    k[8] = P(hip, hp * s, perp + 180); k[11] = P(hip, hp * s, perp)
    k[3] = P(k[2], UA, R[0]); k[4] = P(k[3], FA, R[1])
    k[6] = P(k[5], UA, L[0]); k[7] = P(k[6], FA, L[1])
    k[9] = P(k[8], TH, RL[0]); k[10] = P(k[9], SHN, RL[1])
    k[12] = P(k[11], TH, LL[0]); k[13] = P(k[12], SHN, LL[1])
    nose = P(neck, N, torso if head is None else head); nose = (nose[0] - turn * s, nose[1]); k[0] = nose
    k[15] = (nose[0] + 30 * s, nose[1] - 24 * s)   # left eye (near)
    k[14] = (nose[0] - 6 * s, nose[1] - 25 * s)    # right eye (far, at the face edge)
    k[17] = (nose[0] + 70 * s, nose[1] - 10 * s)   # left ear (near); the right ear is hidden
    for i, v in (override or {}).items():
        k[i] = v
    return k


def draw(size, k):
    im = Image.new('RGB', size, (0, 0, 0)); d = ImageDraw.Draw(im)
    for i, (a, b) in enumerate(LIMBS):
        if a in k and b in k:
            d.line([k[a], k[b]], fill=tuple(int(c * 0.6) for c in COLORS[i]), width=9)
    for i, (x, y) in k.items():
        d.ellipse((x - 5, y - 5, x + 5, y + 5), fill=COLORS[i])
    return im


def capsule(d, a, b, w, fill=255):
    d.line([a, b], fill=fill, width=int(w)); r = w / 2
    for p in (a, b):
        d.ellipse((p[0] - r, p[1] - r, p[0] + r, p[1] + r), fill=fill)


def masks(size, k, cane_tip, cast=False):
    """Region masks (white = region). fur: the far (right) shoulder, rising above the shoulder line and pushing
    the outline out on screen-left, about 190x140 px; arm: the near machina arm; shin: the near piston shin."""
    out = {}
    fur = Image.new('L', size, 0); d = ImageDraw.Draw(fur)
    sx, sy = k[2]
    if cast:   # the leading shoulder: a larger mantle rising above the shoulder line (attempt-5 cast, round 2)
        cx, cy = sx - 20, sy - 16
        d.ellipse((cx - 110, cy - 84, cx + 84, cy + 70), fill=255)
    else:
        cx, cy = sx - 42, sy + 4
        d.ellipse((cx - 92, cy - 70, cx + 70, cy + 64), fill=255)
    d.rectangle((k[1][0] - 8, 0, size[0], size[1]), fill=0)   # never over the neck, face or near side
    out['fur'] = fur.filter(ImageFilter.GaussianBlur(6))
    arm = Image.new('L', size, 0); d = ImageDraw.Draw(arm)
    capsule(d, k[5], k[6], 58); capsule(d, k[6], k[7], 50)
    out['arm'] = arm.filter(ImageFilter.GaussianBlur(5))
    shin = Image.new('L', size, 0); d = ImageDraw.Draw(shin)
    capsule(d, k[12], k[13], 60)
    out['shin'] = shin.filter(ImageFilter.GaussianBlur(5))
    return out


# bible 1.23.4 ramps (mid tones) for the flat block-in (arm C)
RED, RED_D, PURPLE, FUR, METAL, METAL_D, HAIR, SKIN, GLASS, CANE, BLACK = (
    (176, 42, 42), (110, 20, 20), (106, 46, 128), (196, 194, 204), (126, 132, 143), (74, 78, 88),
    (107, 74, 40), (232, 196, 170), (58, 111, 184), (200, 204, 214), (20, 20, 28))


def blockin(size, k, cane_top, cane_tip, fur_mask):
    im = Image.new('RGB', size, (255, 255, 255)); d = ImageDraw.Draw(im)
    s = 0.95
    # legs: far (right) leg red with a purple boot; near (left) leg: red thigh, metal piston shin, metal foot
    capsule(d, k[8], k[9], 74 * s, RED_D); capsule(d, k[9], k[10], 60 * s, RED_D)
    bx, by = k[10]; d.polygon([(bx + 20, by - 150), (bx - 26, by - 150), (bx - 30, by + 8), (bx - 70, by + 28), (bx + 24, by + 28)], fill=PURPLE)
    capsule(d, k[11], k[12], 76 * s, RED); capsule(d, k[12], k[13], 36, METAL_D)
    capsule(d, k[12], k[13], 12, METAL)
    fx, fy = k[13]; d.polygon([(fx + 20, fy - 34), (fx - 18, fy - 34), (fx - 62, fy + 26), (fx + 26, fy + 26)], fill=METAL_D)
    # torso column
    d.polygon([P2(k[2], -22, -4), P2(k[5], 22, -4), (k[11][0] + 18, k[11][1]), (k[8][0] - 18, k[8][1])], fill=RED)
    for t in (0.35, 0.55, 0.78, 0.9):   # belts
        y0 = k[1][1] + (k[8][1] - k[1][1]) * t
        d.line([(k[8][0] - 20, y0 + 8), (k[11][0] + 20, y0 - 8)], fill=BLACK if t != 0.55 else RED_D, width=9)
    # far (right) arm: purple sleeve, black glove on the cane
    capsule(d, k[2], k[3], 58, PURPLE); capsule(d, k[3], k[4], 46, RED_D)
    d.ellipse((k[4][0] - 20, k[4][1] - 18, k[4][0] + 20, k[4][1] + 22), fill=BLACK)
    # cane
    d.line([cane_top, cane_tip], fill=CANE, width=16)
    # near machina arm: thin grey segments with gaps
    capsule(d, k[5], k[6], 24, METAL_D); capsule(d, k[6], k[7], 20, METAL)
    for p in (k[5], k[6]):
        d.ellipse((p[0] - 15, p[1] - 15, p[0] + 15, p[1] + 15), fill=METAL_D)
    d.ellipse((k[7][0] - 16, k[7][1] - 12, k[7][0] + 16, k[7][1] + 22), fill=METAL_D)
    # neck, collar, head, hair loops, ponytail, glasses
    capsule(d, k[1], k[0], 34, RED)
    hx, hy = k[0][0] + 22, k[0][1] - 30
    d.ellipse((hx - 58, hy - 70, hx + 56, hy + 62), fill=HAIR)
    d.ellipse((k[0][0] - 20, k[0][1] - 40, k[0][0] + 44, k[0][1] + 40), fill=SKIN)
    d.ellipse((hx + 34, hy - 56, hx + 96, hy + 10), outline=HAIR, width=16)   # near loop
    d.ellipse((hx - 92, hy - 64, hx - 36, hy + 2), outline=HAIR, width=14)    # far loop
    d.rectangle((hx + 36, hy - 4, hx + 50, hy + 10), fill=RED); d.rectangle((hx - 44, hy - 8, hx - 32, hy + 6), fill=RED)
    capsule(d, (hx + 40, hy + 20), (hx + 70, hy + 190), 26, HAIR)
    d.rectangle((k[0][0] - 16, k[0][1] - 32, k[0][0] + 36, k[0][1] - 16), fill=GLASS)
    # fur mantle on the far shoulder (the mask's own shape, ragged)
    fm = fur_mask.point(lambda v: 255 if v > 128 else 0)
    im.paste(Image.new('RGB', size, FUR), mask=fm)
    inner = fm.filter(ImageFilter.MinFilter(31 if size[0] < 1000 else 71))
    im.paste(Image.new('RGB', size, PURPLE), mask=inner.filter(ImageFilter.GaussianBlur(3)).point(lambda v: 255 if v > 200 else 0).crop((0, 0) + size))
    return im


def P2(o, dx, dy):
    return (o[0] + dx, o[1] + dy)


def poses():
    W, H = 832, 1216
    out = {}
    # idle-lean: weight on the cane planted forward past the far foot, far wrist at hip height over it,
    # machina arm hanging a little bent toward camera, feet apart (bible staging; never square)
    k = fig((450, 610), 266, R=(118, 104), L=(66, 86), RL=(100, 93), LL=(78, 90))
    out['idle-lean'] = ((W, H), k, k[4], (k[4][0] - 50, 1150))
    # idle-upright: standing tall, cane planted upright at the far side, machina hand on the hip (elbow out)
    k = fig((440, 600), 270, R=(98, 92), L=(55, 145), RL=(97, 93), LL=(82, 89))
    out['idle-upright'] = ((W, H), k, k[4], (k[4][0] - 6, 1150))
    # idle-glasses: the portrait's gesture: the machina fingers at the glasses, cane planted at the far side
    k = fig((440, 605), 269, R=(110, 96), L=(100, 0), RL=(100, 93), LL=(80, 90))
    k[6] = P2(k[5], 34, 128); k[7] = P2(k[0], 40, 8)
    out['idle-glasses'] = ((W, H), k, k[4], (k[4][0] - 30, 1150))
    # cast: the far (right) arm extended toward the party at shoulder height, the cane levelled at them; the
    # machina arm back at the hip; a short step forward on the far leg. 1152 wide so the cane stays in frame.
    W2 = 1152
    k = fig((700, 615), 263, head=262, R=(182, 178), L=(72, 128), RL=(112, 100), LL=(72, 88))
    tip = P(k[4], 330, 168)
    out['cast'] = ((W2, H), k, P(k[4], -60, 168), tip)
    return out


def refs():
    p = Image.open(PORTRAIT).convert('RGBA'); w, h = p.size
    flat = Image.new('RGB', p.size, (255, 255, 255)); flat.paste(p, mask=p.split()[-1])
    sq = Image.new('RGB', (h, h), (255, 255, 255)); sq.paste(flat, ((h - w) // 2, 0))
    sq.save(OUT / 'ref-portrait-square.png')
    flat.crop((0, 0, w, w)).save(OUT / 'ref-portrait-head.png')


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    refs()
    tiles = []
    for name, (size, k, cane_top, cane_tip) in poses().items():
        sk = draw(size, k); sk.save(OUT / f'skel-{name}.png')
        m = masks(size, k, cane_tip, cast=name == 'cast')
        for r, im in m.items():
            im.save(OUT / f'mask-{name}-{r}.png')
        bi = blockin(size, k, cane_top, cane_tip, m['fur']); bi.save(OUT / f'blockin-{name}.png')
        ov = Image.blend(bi, sk, 0.35)
        for r, col in (('fur', (255, 0, 255)), ('arm', (0, 255, 255)), ('shin', (255, 255, 0))):
            ov.paste(Image.new('RGB', size, col), mask=m[r].point(lambda v: v // 3))
        tiles.append(ov)
    Wt = sum(t.width for t in tiles); sheet = Image.new('RGB', (Wt, 1216), 'white'); x = 0
    for t in tiles:
        sheet.paste(t, (x, 0)); x += t.width
    sheet.thumbnail((2000, 800)); sheet.save(OUT / 'overview.jpg', quality=85)
    print('ok', OUT)


if __name__ == '__main__':
    main()
