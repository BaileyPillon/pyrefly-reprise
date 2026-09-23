"""Leblanc battle-state skeletons (FFX-2 only, Chapter 6): OpenPose COCO-18 drawn in PIL.

One full-body skeleton per state for the xinsir OpenPose SDXL ControlNet, at the
idle's own scale (keypoints of the installed idle, public/art/characters/leblanc/idle.png,
read by eye and placed on its 832x1216 frame, cropBox origin 88,51). Facing as the idle:
the boss faces screen-left, three-quarter, so her LEFT side (the fan hand) is the near side.
Colours and limb order follow controlnet_aux draw_bodypose (as lora/logos/idle-pose.py).

    python skeletons.py      # writes skeletons/<state>.png and skeletons/overlay.jpg
"""
from __future__ import annotations

import math
import pathlib

from PIL import Image, ImageDraw

HERE = pathlib.Path(__file__).resolve().parent
REPO = HERE.parents[6]
OUT = HERE / 'skeletons'
COLORS = [(255, 0, 0), (255, 85, 0), (255, 170, 0), (255, 255, 0), (170, 255, 0),
          (85, 255, 0), (0, 255, 0), (0, 255, 85), (0, 255, 170), (0, 255, 255),
          (0, 170, 255), (0, 85, 255), (0, 0, 255), (85, 0, 255), (170, 0, 255),
          (255, 0, 255), (255, 0, 170), (255, 0, 85)]
LIMBS = [(1, 2), (1, 5), (2, 3), (3, 4), (5, 6), (6, 7), (1, 8), (8, 9), (9, 10),
         (1, 11), (11, 12), (12, 13), (1, 0), (0, 14), (14, 16), (0, 15), (15, 17)]

# The installed idle, idle-image pixels (591x1118), front-ish three-quarter.
IDLE_OX, IDLE_OY = 88, 51
IDLE = {
    0: (322, 190), 1: (312, 272), 14: (292, 160), 15: (345, 160), 16: (262, 170), 17: (378, 172),
    2: (255, 272), 3: (175, 330), 4: (62, 348),       # her right arm, holding the robe out
    5: (368, 276), 6: (432, 335), 7: (470, 225),      # her left arm, fan at the mouth
    8: (272, 505), 9: (262, 770), 10: (300, 1040),
    11: (355, 505), 12: (330, 770), 13: (352, 1045),
}


def P(o, length, deg):
    """Point `length` px from `o` at `deg` (screen angles: 0 = right, 90 = down, 180 = left, 270 = up)."""
    r = math.radians(deg)
    return (o[0] + length * math.cos(r), o[1] + length * math.sin(r))


def body(hip, torso_deg, *, s=1.0, head_deg=None, sh=46, hp=40, larm=(0, 0), rarm=(0, 0),
         lleg=(90, 90), rleg=(90, 90), up=0):
    """Forward kinematics at the idle's scale times `s`. torso_deg points from the hip
    centre to the neck (270 = upright); limb tuples are (upper, lower) screen angles."""
    T, N, UA, FA, TH, SH = 245 * s, 80 * s, 150 * s, 135 * s, 265 * s, 265 * s
    k = {}
    neck = P(hip, T, torso_deg)
    k[1] = neck
    perp = torso_deg + 90       # towards image-right when upright
    k[5] = P(neck, sh * s, perp + 180)     # her left (near) shoulder, screen-left
    k[2] = P(neck, sh * s, perp)           # her right (far) shoulder
    k[11] = P(hip, hp * s, perp + 180)
    k[8] = P(hip, hp * s, perp)
    k[6] = P(k[5], UA, larm[0]); k[7] = P(k[6], FA, larm[1])
    k[3] = P(k[2], UA, rarm[0]); k[4] = P(k[3], FA, rarm[1])
    k[12] = P(k[11], TH, lleg[0]); k[13] = P(k[12], SH, lleg[1])
    k[9] = P(k[8], TH, rleg[0]); k[10] = P(k[9], SH, rleg[1])
    hd = torso_deg if head_deg is None else head_deg
    nose = P(neck, N, hd)
    k[0] = nose
    c, sn = math.cos(math.radians(hd)), math.sin(math.radians(hd))

    def F(dx, dy):  # dx toward the face's screen-right, dy up the head axis
        return (nose[0] + dx * s * (-sn) + dy * s * c, nose[1] + dx * s * c + dy * s * sn)
    # three-quarter to screen-left: both eyes, the near (left) ear only
    k[14] = F(-10, 26 + up); k[15] = F(30, 26 + up); k[17] = F(68, 12 + up)
    return k


def lying(head, s=0.9):
    """Ko: lying on her side, head to screen-left (toward the party), knees a little bent."""
    k = {}
    k[0] = head
    k[1] = (head[0] + 85 * s, head[1] + 18 * s)
    k[14] = (head[0] - 6 * s, head[1] - 22 * s); k[15] = (head[0] + 20 * s, head[1] - 26 * s)
    k[17] = (head[0] + 50 * s, head[1] - 30 * s)
    k[5] = (k[1][0] - 10 * s, k[1][1] - 40 * s)      # upper (left) shoulder
    k[2] = (k[1][0] + 8 * s, k[1][1] + 38 * s)       # lower (right) shoulder
    hip = (k[1][0] + 245 * s, k[1][1] + 20 * s)
    k[11] = (hip[0], hip[1] - 38 * s); k[8] = (hip[0] + 6 * s, hip[1] + 36 * s)
    k[6] = (k[5][0] + 120 * s, k[5][1] + 40 * s); k[7] = (k[6][0] + 110 * s, k[6][1] + 45 * s)   # arm limp along the body
    k[3] = (k[2][0] - 110 * s, k[2][1] + 60 * s); k[4] = (k[3][0] - 90 * s, k[3][1] + 20 * s)    # lower arm out in front on the ground
    k[12] = (k[11][0] + 250 * s, k[11][1] + 40 * s); k[13] = (k[12][0] + 250 * s, k[12][1] + 30 * s)
    k[9] = (k[8][0] + 240 * s, k[8][1] + 60 * s); k[10] = (k[9][0] + 245 * s, k[9][1] + 20 * s)
    return k


def states():
    W, H = 832, 1216
    idle = {i: (x + IDLE_OX, y + IDLE_OY) for i, (x, y) in IDLE.items()}
    return {
        'idle': ((W, H), idle),
        # a fan STRIKE: deep lunge to screen-left, weight on the bent front (left) leg,
        # the fan arm driven out ahead of the body, the far arm swept back
        # v4 (redo 2026-09-23, judge: v3.3 was a mid-air leap with a folded leg): the same strike,
        # the hip moved left so the rear foot lands inside the frame (v3's was at x 824 of 832),
        # the front shin near vertical to a planted front foot, the rear leg long and straight
        # to a planted rear foot; both ankles on one ground line (y ~1100 to 1130).
        # v3's skeleton: skeletons/v3/attack.png = body((470, 760), 245, ..., lleg=(150, 95), rleg=(50, 45))
        'attack': ((W, H), body((430, 760), 245, s=0.9, head_deg=235, larm=(190, 185), rarm=(35, 55),
                                lleg=(150, 92), rleg=(42, 42))),
        # v5 (attack only; written to skeletons/v5/attack.png): v4 at OpenPose 0.8+ put the fan in the far
        # hand and swung it to screen-right, the rear foot left the frame. One extended arm only (the near,
        # fan arm, to screen-left); the far hand on the hip; the rear foot pulled in to x ~710.
        'v5/attack': ((W, H), body((420, 760), 245, s=0.9, head_deg=235, larm=(190, 185), rarm=(60, 160),
                                   lleg=(150, 92), rleg=(55, 60))),
        # v6 (attack only; skeletons/v6/attack.png): v5 still turned frontal with the fan swung to screen-right.
        # v3's frames led with the fan to screen-left at OpenPose 0.6, and v4/v5 turned frontal as the
        # strength rose, reading the skeleton's full-width shoulders and hips as a body facing the viewer.
        # So v6 draws the body near profile (shoulders and hips a third of the idle's width), the near
        # (fan) arm driven out to screen-left, the far hand at the hip, v4's planted legs.
        'v6/attack': ((W, H), body((420, 760), 245, s=0.9, head_deg=225, sh=16, hp=14, larm=(188, 182), rarm=(30, 115),
                                   lleg=(150, 92), rleg=(52, 58))),
        # v7 (attack only; skeletons/v7/attack.png, 1024x1216): v6's skeleton shifted 150 px right and 40 px up
        # on a wider canvas, so the thrust fan and the rear boot both stay inside the frame
        'v7/attack': ((1024, H), {k: (x + 150, y - 40) for k, (x, y) in
                                  body((420, 760), 245, s=0.9, head_deg=225, sh=16, hp=14, larm=(188, 182), rarm=(30, 115),
                                       lleg=(150, 92), rleg=(52, 58)).items()}),
        # cast: upright, the fan arm raised high above the head, the far hand out at the hip,
        # head tipped up toward the raised fan
        'cast': ((W, H), body((430, 700), 272, s=0.95, head_deg=258, up=6, larm=(262, 265), rarm=(62, 50),
                              lleg=(96, 92), rleg=(84, 88))),
        # hurt: recoil away from the party (screen-right), shoulders thrown back past the hips,
        # the near hand at the stomach, the fan arm flung back, a staggering back step
        # v4 (redo 2026-09-23, judge: v3.1 had one leg, the far one lost behind the robe): the far
        # leg comes down to screen-LEFT of the hip, in front of the robe, which the flung-back fan
        # arm carries off to screen-right; the near leg steps out further left. Both feet planted.
        # v3's skeleton: skeletons/v3/hurt.png = body((380, 690), 300, ..., lleg=(115, 100), rleg=(80, 88))
        'hurt': ((W, H), body((360, 620), 300, s=0.95, head_deg=320, larm=(110, 10), rarm=(5, 30),
                              lleg=(105, 100), rleg=(92, 96))),
        # ko: lying on her side, head to screen-left
        'ko': ((1216, 832), lying((150, 470), s=0.95)),
    }


def draw(size, pts, stick=8, radius=7):
    W, H = size
    over = Image.new('RGB', (W, H), (0, 0, 0))
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
    img = Image.blend(Image.new('RGB', (W, H)), over, 0.6)
    d2 = ImageDraw.Draw(img)
    for kk, (x, y) in pts.items():
        d2.ellipse((x - radius, y - radius, x + radius, y + radius), fill=COLORS[kk])
    return img


def main():
    OUT.mkdir(exist_ok=True)
    tiles = []
    for name, (size, pts) in states().items():
        im = draw(size, pts)
        (OUT / name).parent.mkdir(parents=True, exist_ok=True)
        im.save(OUT / f'{name}.png')
        tiles.append((name, im))
        oob = [k for k, (x, y) in pts.items() if not (0 <= x < size[0] and 0 <= y < size[1])]
        print(name, size, 'out of frame:', oob or 'none')
    # overlay: the idle skeleton on the installed idle (scale check), then every state
    idle_png = Image.open(REPO / 'public/art/characters/leblanc/idle.png').convert('RGBA')
    base = Image.new('RGBA', (832, 1216), (255, 255, 255, 255))
    base.alpha_composite(idle_png, (IDLE_OX, IDLE_OY))
    sk = tiles[0][1].convert('RGBA')
    mask = sk.convert('L').point(lambda v: 255 if v > 10 else 0)
    base.paste(sk, (0, 0), mask)
    sheet = Image.new('RGB', (832 * 4 + 1216, 1216), (40, 40, 40))
    sheet.paste(base.convert('RGB'), (0, 0))
    x = 832
    for name, im in [t for t in tiles[1:] if '/' not in t[0]]:
        sheet.paste(im, (x, 0 if im.size[1] == 1216 else 192))
        x += im.size[0]
    sheet.resize((sheet.width // 2, sheet.height // 2)).save(OUT / 'overlay.jpg', quality=85)


if __name__ == '__main__':
    main()
