"""FFX-2 party battle-pose skeletons (FFX-2 only; art5, GPU batch 5): a copy of the Chapter XIII
set (docs/concepts/chapters/trema/poses/skeletons.py), sword and flask unchanged, plus a `dual`
kind (two pistols, two daggers). OpenPose COCO-18 drawn in PIL.

One skeleton per pose for the xinsir OpenPose SDXL ControlNet. Party figures face screen-RIGHT,
three-quarter, toward the viewer (ART-PIPELINE.md section 2a), so her RIGHT shoulder, hip and ear
sit on screen-left and the left ear is hidden. Scale 1.0 = the shipped idles (nose about y 265,
hip about y 590, ankles about y 1110 on the 832x1216 canvas). Colours and limb order follow
controlnet_aux draw_bodypose, as docs/concepts/chapters/leblanc/lora/leblanc/poses/skeletons.py.

    python skeletons.py      # writes skeletons/<set>/<pose>.png and skeletons/overview.jpg
"""
from __future__ import annotations

import math
import pathlib

from PIL import Image, ImageDraw

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE / 'skeletons'
COLORS = [(255, 0, 0), (255, 85, 0), (255, 170, 0), (255, 255, 0), (170, 255, 0),
          (85, 255, 0), (0, 255, 0), (0, 255, 85), (0, 255, 170), (0, 255, 255),
          (0, 170, 255), (0, 85, 255), (0, 0, 255), (85, 0, 255), (170, 0, 255),
          (255, 0, 255), (255, 0, 170), (255, 0, 85)]
LIMBS = [(1, 2), (1, 5), (2, 3), (3, 4), (5, 6), (6, 7), (1, 8), (8, 9), (9, 10),
         (1, 11), (11, 12), (12, 13), (1, 0), (0, 14), (14, 16), (0, 15), (15, 17)]
SWAP = {2: 5, 3: 6, 4: 7, 8: 11, 9: 12, 10: 13, 14: 15, 16: 17}
SWAP.update({v: k for k, v in list(SWAP.items())})


def P(o, length, deg):
    """Point `length` px from `o` at screen angle `deg` (0 right, 90 down, 180 left, 270 up)."""
    r = math.radians(deg)
    return (o[0] + length * math.cos(r), o[1] + length * math.sin(r))


def body(hip, torso_deg=270, *, s=1.0, head_deg=None, sh=46, hp=36, rarm=(100, 95), larm=(80, 85),
         rleg=(95, 92), lleg=(85, 88), turn=16):
    """Forward kinematics. rarm/larm/rleg/lleg = (upper, lower) screen angles; her right side
    is screen-left. `sh`/`hp` are the half-widths at shoulder and hip (narrow = three-quarter)."""
    T, N, UA, FA, TH, SH = 250 * s, 78 * s, 150 * s, 135 * s, 265 * s, 255 * s
    k = {}
    neck = P(hip, T, torso_deg)
    k[1] = neck
    perp = torso_deg + 90                     # screen-right when upright
    k[2] = P(neck, sh * s, perp + 180)        # right shoulder, screen-left
    k[5] = P(neck, sh * s, perp)              # left shoulder, screen-right
    k[8] = P(hip, hp * s, perp + 180)
    k[11] = P(hip, hp * s, perp)
    k[3] = P(k[2], UA, rarm[0]); k[4] = P(k[3], FA, rarm[1])
    k[6] = P(k[5], UA, larm[0]); k[7] = P(k[6], FA, larm[1])
    k[9] = P(k[8], TH, rleg[0]); k[10] = P(k[9], SH, rleg[1])
    k[12] = P(k[11], TH, lleg[0]); k[13] = P(k[12], SH, lleg[1])
    hd = torso_deg if head_deg is None else head_deg
    nose = P(neck, N, hd)
    nose = (nose[0] + turn * s, nose[1])      # face turned toward screen-right
    k[0] = nose
    c, sn = math.cos(math.radians(hd + 90)), math.sin(math.radians(hd + 90))
    # offsets in the head's frame: a = along screen-right of the face, b = up the head axis

    def F(a, b):
        ux, uy = c, sn                        # face's "right" direction
        vx, vy = math.cos(math.radians(hd)), math.sin(math.radians(hd))
        return (nose[0] + (a * ux + b * vx) * s, nose[1] + (a * uy + b * vy) * s)
    k[14] = F(-34, 26)                        # right eye (screen-left, the far eye)
    k[15] = F(6, 28)                          # left eye
    k[16] = F(-78, 10)                        # right ear; the left ear is hidden
    return k


def mirror(k, W):
    """Mirror a skeleton horizontally AND swap left/right labels, so anatomy stays right."""
    return {SWAP.get(i, i): (W - x, y) for i, (x, y) in k.items()}


def lying_head_left(head, s=0.95):
    """Prone, head at screen-left (Leblanc's round-2 ko); mirrored below to head-right."""
    k = {0: head}
    k[1] = (head[0] + 88 * s, head[1] + 8 * s)
    k[14] = (head[0] - 4 * s, head[1] - 24 * s); k[15] = (head[0] + 22 * s, head[1] - 26 * s)
    k[17] = (head[0] + 52 * s, head[1] - 28 * s)
    k[5] = (k[1][0] - 6 * s, k[1][1] - 40 * s)
    k[2] = (k[1][0] + 6 * s, k[1][1] + 38 * s)
    hip = (k[1][0] + 250 * s, k[1][1] + 12 * s)
    k[11] = (hip[0], hip[1] - 38 * s); k[8] = (hip[0] + 6 * s, hip[1] + 36 * s)
    k[6] = (k[5][0] - 125 * s, k[5][1] - 20 * s); k[7] = (k[6][0] - 120 * s, k[6][1] + 55 * s)
    k[3] = (k[2][0] + 45 * s, k[2][1] + 70 * s); k[4] = (k[3][0] + 115 * s, k[3][1] + 10 * s)
    k[12] = (k[11][0] + 235 * s, k[11][1] + 55 * s); k[13] = (k[12][0] + 240 * s, k[12][1] - 5 * s)
    k[9] = (k[8][0] + 255 * s, k[8][1] + 25 * s); k[10] = (k[9][0] + 250 * s, k[9][1] + 8 * s)
    return k


def shift(k, dx=0, dy=0):
    return {i: (x + dx, y + dy) for i, (x, y) in k.items()}


def ground_scale(size, k, f, gy=1170):
    """Pilot 1 and 2 drew heads about 1.3x the idle's pixel scale on idle-scale skeletons, and the
    cape filled the frame: every skeleton is shrunk by `f` about a point on the ground line."""
    cx = size[0] / 2
    return {i: (cx + (x - cx) * f, gy + (y - gy) * f) for i, (x, y) in k.items()}


SCALE = 0.8          # standing poses, set after pilot 2 (METHOD.md section 4)
KO_SCALE = 0.85


def poses():
    out = {}
    for name, (size, k) in poses_raw().items():
        if name.endswith('idle-check'):
            out[name] = (size, k)
        elif name.endswith('/ko'):
            out[name] = (size, ground_scale(size, k, KO_SCALE, gy=600))
        else:
            out[name] = (size, ground_scale(size, k, SCALE))
    return out


def poses_raw():
    W, H = 832, 1216
    ko = mirror(lying_head_left((300, 520)), 1216)
    return {
        # ---- greatsword (Yuna and Paine as Dark Knights) ----
        'sword/idle-check': ((W, H), body((410, 590))),
        # attack: a forward lunge toward screen-right, both hands on the hilt, arms driven out
        # ahead of the chest (the blade follows the hands); front (left) knee bent over the
        # foot, rear (right) leg long; 1024 wide so the blade stays in frame.
        'sword/attack': ((1024, H), body((400, 690), 288, s=0.98, head_deg=292, rarm=(20, 350), larm=(30, 355),
                                         rleg=(128, 118), lleg=(52, 92))),
        # cast: upright, the sword held point-down in the right hand at her side, the left arm
        # raised high and forward, open hand, head tipped up toward it.
        'sword/cast': ((W, H), body((380, 610), 270, s=0.95, head_deg=285, rarm=(98, 92), larm=(312, 298),
                                    rleg=(100, 94), lleg=(80, 88))),
        # item: upright, sword point-down in the right hand, the left hand held out forward at
        # chest height (a bottle in it).
        'sword/item': ((W, H), body((380, 600), 270, s=0.95, head_deg=280, rarm=(98, 92), larm=(40, 345),
                                    rleg=(100, 94), lleg=(82, 88))),
        # hurt: thrown back toward screen-left, shoulders past the hips, head tilted back, the
        # left hand clutching the chest, the sword arm dropped low behind; a back step.
        'sword/hurt': ((W, H), body((430, 640), 250, s=0.95, head_deg=235, rarm=(150, 120), larm=(120, 215),
                                    rleg=(118, 100), lleg=(78, 96))),
        # victory: the sword resting on the right shoulder, the left hand on the hip.
        'sword/victory': ((W, H), body((400, 590), 270, s=0.98, head_deg=275, rarm=(75, 250), larm=(45, 150),
                                       rleg=(98, 92), lleg=(80, 90))),
        'sword/ko': ((1216, 832), ko),
        # ---- flask (Rikku as Alchemist) ----
        # attack: an overhand throw toward screen-right: the left (near) arm thrown out
        # forward and up, the right arm swept back, a lunge on the left leg.
        'flask/attack': ((W, H), body((360, 660), 285, s=0.95, head_deg=290, rarm=(150, 170), larm=(345, 335),
                                      rleg=(125, 110), lleg=(55, 92))),
        # cast (Stash, Mix): a flask held up high in the left hand, the right hand on the hip,
        # looking up at it.
        'flask/cast': ((W, H), body((400, 640), 270, s=0.93, head_deg=285, rarm=(125, 30), larm=(290, 275),
                                    rleg=(100, 94), lleg=(80, 88))),
        # item: a flask held out forward at chest height in the left hand, right hand on hip.
        'flask/item': ((W, H), body((390, 600), 270, s=0.95, head_deg=280, rarm=(125, 30), larm=(35, 340),
                                    rleg=(100, 94), lleg=(80, 88))),
        # hurt: as the sword hurt, both hands up by the chest, no weapon arm.
        'flask/hurt': ((W, H), body((430, 640), 250, s=0.95, head_deg=235, rarm=(160, 90), larm=(120, 215),
                                    rleg=(118, 100), lleg=(78, 96))),
        # victory: both fists thrown up, feet apart, jumping for joy is out (feet stay down).
        'flask/victory': ((W, H), body((400, 660), 270, s=0.93, head_deg=268, rarm=(235, 265), larm=(305, 275),
                                       rleg=(102, 94), lleg=(78, 86))),
        'flask/ko': ((1216, 832), ko),
        # ---- dual (added in art5): two pistols (Yuna Gunner) or two daggers (Rikku Thief) ----
        # The idles hold one weapon in each hand, arms low at the sides (the Gunner's pistols
        # point down, the Thief's daggers reverse-grip at the hips). Both hands always carry
        # a weapon, so no pose puts a hand on the hip or the chest.
        # attack: a forward step toward screen-right, BOTH arms driven out ahead at shoulder
        # height (both pistols aimed / both daggers thrust); the far (right) arm crosses in
        # front of the chest, slightly below the near one.
        'dual/attack': ((W, H), body((370, 660), 280, s=0.96, head_deg=285, rarm=(12, 358), larm=(352, 350),
                                    rleg=(120, 108), lleg=(62, 92))),
        # cast: upright, the near (left) arm raised high holding its weapon point-up, the far
        # arm down at the side with its weapon; head tipped up.
        'dual/cast': ((W, H), body((390, 620), 270, s=0.95, head_deg=285, rarm=(100, 88), larm=(305, 285),
                                  rleg=(100, 94), lleg=(80, 88))),
        # item: the near hand held out forward at chest height (a bottle in it, the weapon
        # tucked in the same fist), the far arm down with its weapon.
        'dual/item': ((W, H), body((380, 600), 270, s=0.95, head_deg=280, rarm=(100, 88), larm=(40, 345),
                                  rleg=(100, 94), lleg=(82, 88))),
        # hurt: thrown back toward screen-left, head back, both arms flung down and out
        # (weapons still in the hands), a back step.
        'dual/hurt': ((W, H), body((430, 640), 250, s=0.95, head_deg=235, rarm=(150, 125), larm=(95, 55),
                                  rleg=(118, 100), lleg=(78, 96))),
        # victory: the near arm raised high, weapon pointing up; the far arm low and out at
        # the side with its weapon; feet planted apart.
        'dual/victory': ((W, H), body((400, 620), 270, s=0.95, head_deg=275, rarm=(115, 100), larm=(300, 280),
                                     rleg=(100, 92), lleg=(78, 88))),
        'dual/ko': ((1216, 832), ko),
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
    tiles = []
    for name, (size, pts) in poses().items():
        im = draw(size, pts)
        p = OUT / f'{name}.png'
        p.parent.mkdir(parents=True, exist_ok=True)
        im.save(p)
        oob = [k for k, (x, y) in pts.items() if not (0 <= x < size[0] and 0 <= y < size[1])]
        print(name, size, 'out of frame:', oob or 'none')
        tiles.append(im)
    h = 400
    row = [t.resize((int(t.width * h / t.height), h)) for t in tiles]
    sheet = Image.new('RGB', (sum(r.width for r in row) + 6 * len(row), h), (60, 60, 60))
    x = 0
    for r in row:
        sheet.paste(r, (x, 0)); x += r.width + 6
    sheet.save(OUT / 'overview.jpg', quality=85)


if __name__ == '__main__':
    main()
