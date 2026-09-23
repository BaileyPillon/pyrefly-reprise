"""The installed Logos idle as an OpenPose (COCO-18) skeleton, for the LoRA step pick.

Keypoints were read by eye off public/art/characters/logos/idle.png (604 x 1160,
facing left, profile: the near side is his LEFT) and placed on the 832 x 1216
canvas it was cut from (idle.json cropBox origin 164, 42). Colours and limb
order follow controlnet_aux draw_bodypose, as tools/gen/rig-lora-pose.py does.

    python idle-pose.py            # writes idle-pose.png and idle-pose-overlay.jpg here
"""
from __future__ import annotations

import math
import pathlib

from PIL import Image, ImageDraw

HERE = pathlib.Path(__file__).resolve().parent
REPO = HERE.parents[5]
W, H = 832, 1216
OX, OY = 164, 42
COLORS = [(255, 0, 0), (255, 85, 0), (255, 170, 0), (255, 255, 0), (170, 255, 0),
          (85, 255, 0), (0, 255, 0), (0, 255, 85), (0, 255, 170), (0, 255, 255),
          (0, 170, 255), (0, 85, 255), (0, 0, 255), (85, 0, 255), (170, 0, 255),
          (255, 0, 255), (255, 0, 170), (255, 0, 85)]
# controlnet_aux limbSeq (1-based there), 0-based here; limb i is drawn in COLORS[i]
LIMBS = [(1, 2), (1, 5), (2, 3), (3, 4), (5, 6), (6, 7), (1, 8), (8, 9), (9, 10),
         (1, 11), (11, 12), (12, 13), (1, 0), (0, 14), (14, 16), (0, 15), (15, 17)]
# idle-image pixels; profile facing left, so the right eye and right ear are hidden
IDLE = {
    0: (238, 128), 1: (298, 178), 15: (258, 108), 17: (296, 120),
    2: (262, 222), 3: (205, 400), 4: (148, 482),      # far (right) arm, blued revolver
    5: (322, 238), 6: (262, 420), 7: (225, 565),      # near (left) arm, silver revolver
    8: (255, 470), 9: (355, 880), 10: (375, 1035),     # far (right) leg, back foot
    11: (292, 480), 12: (240, 895), 13: (245, 1065),   # near (left) leg, front foot
}


def draw(stick: int = 8, radius: int = 7) -> Image.Image:
    pts = {k: (x + OX, y + OY) for k, (x, y) in IDLE.items()}
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
    for k, (x, y) in pts.items():
        d2.ellipse((x - radius, y - radius, x + radius, y + radius), fill=COLORS[k])
    return img


def main() -> None:
    sk = draw()
    sk.save(HERE / 'idle-pose.png')
    idle = Image.open(REPO / 'public/art/characters/logos/idle.png').convert('RGBA')
    canvas = Image.new('RGBA', (W, H), (255, 255, 255, 255))
    canvas.alpha_composite(idle, (OX, OY))
    mask = sk.convert('L').point(lambda v: 255 if v > 10 else 0)
    canvas.paste(sk, (0, 0), mask)
    canvas.convert('RGB').save(HERE / 'idle-pose-overlay.jpg', quality=85)


if __name__ == '__main__':
    main()
