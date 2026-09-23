"""Living-portrait v4 (FFX-2 only): head-and-shoulders OpenPose skeletons per yaw.

The OpenPose ControlNet (xinsir openpose SDXL) reads the standard COCO-18
colour-coded stick figure on black. Only the head and shoulders are drawn:
nose, neck, both shoulders, both eyes and both ears, at the approved plate's
framing (832x1216) so a key painted from one lands where the plate's head is.

The head is a sphere-ish solid turned about a vertical axis through its centre:
the plate's own landmarks (art/v3/warp/landmarks.json, frontal: pupils
339,421 / 608,406, nose tip 470,548, cheeks at x 280 / 680) give the frontal
positions; each point gets a depth from the head radius, is rotated by the yaw
and projected orthographically. The neck and shoulders stay fixed (the body is
pinned in the rig). Hidden points are left out, as OpenPose would: the far ear
past 30 degrees, the far eye past 70.

Sign: negative yaw = the face turns toward screen-LEFT (rig.json turn-l85 is
-85), which shows her LEFT (blue) eye and left ear near the camera.

    python -s tools/gen/rig-lora-pose.py draw [--out <dir>] [--yaws -85,-60,...]
"""
from __future__ import annotations

import argparse
import math
import pathlib

from PIL import Image, ImageDraw

REPO = pathlib.Path(__file__).resolve().parents[2]
OUT = REPO / 'docs/concepts/pause-until-dawn/prototype-v2/art/v4/keys/pose'
W, H = 832, 1216
CX = 473.0          # head's vertical axis (mid-pupils)
R = 215.0           # head half-width at the ears
# COCO-18 colours (controlnet_aux draw_bodypose order), RGB
COLORS = [(255, 0, 0), (255, 85, 0), (255, 170, 0), (255, 255, 0), (170, 255, 0),
          (85, 255, 0), (0, 255, 0), (0, 255, 85), (0, 255, 170), (0, 255, 255),
          (0, 170, 255), (0, 85, 255), (0, 0, 255), (85, 0, 255), (170, 0, 255),
          (255, 0, 255), (255, 0, 170), (255, 0, 85)]
# limb index -> (a, b) keypoint ids (0 nose, 1 neck, 2 r-shoulder, 5 l-shoulder,
# 14 r-eye, 15 l-eye, 16 r-ear, 17 l-ear); colour = COLORS[limb index]
LIMBS = {0: (1, 2), 1: (1, 5), 12: (1, 0), 13: (0, 14), 14: (14, 16), 15: (0, 15), 16: (15, 17)}
# her right = screen-left. (x, y, depth) at yaw 0, depth toward the camera.
HEAD = {
    0: (470.0, 548.0, R + 45.0),                                # nose tip
    14: (339.0, 421.0, math.sqrt(R * R - (339 - CX) ** 2)),     # right eye (green)
    15: (608.0, 406.0, math.sqrt(R * R - (608 - CX) ** 2)),     # left eye (blue)
    16: (CX - 222.0, 520.0, -15.0),                             # right ear
    17: (CX + 222.0, 505.0, -15.0),                             # left ear
}
BODY = {1: (452.0, 975.0), 2: (60.0, 990.0), 5: (815.0, 962.0)}


def keypoints(yaw: float) -> dict[int, tuple[float, float]]:
    t = math.radians(yaw)
    pts: dict[int, tuple[float, float]] = dict(BODY)
    for k, (x, y, z) in HEAD.items():
        dx = x - CX
        xr = dx * math.cos(t) + z * math.sin(t)
        pts[k] = (CX + xr, y)
    a = abs(yaw)
    near_left = yaw < 0            # face turns screen-left: her LEFT side is near
    far_eye, far_ear = (14, 16) if near_left else (15, 17)
    if a > 30:
        pts.pop(far_ear)
    if a > 70:
        pts.pop(far_eye)
    return pts


def draw(yaw: float, stick: int = 10, radius: int = 9) -> Image.Image:
    pts = keypoints(yaw)
    base = Image.new('RGB', (W, H), (0, 0, 0))
    over = Image.new('RGB', (W, H), (0, 0, 0))
    d = ImageDraw.Draw(over)
    for li, (a, b) in LIMBS.items():
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
            poly.append((mx + ex * math.cos(ang) - ey * math.sin(ang),
                         my + ex * math.sin(ang) + ey * math.cos(ang)))
        d.polygon(poly, fill=COLORS[li])
    img = Image.blend(base, over, 0.6)
    d2 = ImageDraw.Draw(img)
    for k, (x, y) in pts.items():
        d2.ellipse((x - radius, y - radius, x + radius, y + radius), fill=COLORS[k])
    return img


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('cmd', choices=['draw'])
    ap.add_argument('--out', default=str(OUT))
    ap.add_argument('--yaws', default='-85,-60,-40,-20,0,20,40,60,85')
    a = ap.parse_args()
    out = pathlib.Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    for s in a.yaws.split(','):
        yaw = float(s)
        name = f'yaw{int(yaw):+d}.png' if yaw else 'yaw0.png'
        draw(yaw).save(out / name)
        print(name, {k: (round(x), round(y)) for k, (x, y) in keypoints(yaw).items()})


if __name__ == '__main__':
    main()
