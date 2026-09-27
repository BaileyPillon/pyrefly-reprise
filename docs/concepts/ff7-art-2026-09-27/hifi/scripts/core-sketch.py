"""Hi-fi round (2026-09-27): a layout sketch for the reactor-core backdrop, drawn in code (no image input).
Why a new backdrop: round 1 core.1 is an eye-level view whose floor is only the bottom 15 % of the
picture, so at FF7's battle framing (the HUD band covers the bottom 29 %) the fighters had no floor
to stand on. This sketch raises the camera: a wide grated platform fills the lower half, the mako
column glows in the centre background between the two sides, with catwalks and pipes on the walls.
Written reference only: research/ff7-guard-scorpion.md (the No. 1 Reactor core, a mako reactor).
Usage: python core-sketch.py <out_dir> -> core-sketch.png (1344x768)"""
import math, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

W, H = 1344, 768
ys, xs = np.mgrid[0:H, 0:W]
# walls: dark steel with a warm amber falloff near the top (dome lamps) and green near the core
base = np.zeros((H, W, 3), float)
base[...] = (22, 24, 26)
d_core = np.hypot((xs - W / 2) / 420, (ys - H * 0.42) / 300)
base += np.clip(1 - d_core, 0, 1)[..., None] * np.array((20, 110, 70))
base += np.clip(1 - ys / (H * 0.35), 0, 1)[..., None] * np.array((70, 48, 22))
im = Image.fromarray(np.clip(base, 0, 255).astype(np.uint8))
d = ImageDraw.Draw(im)
# wall structure: vertical pipes and two tiers of catwalks
for x in (60, 150, 250, 1094, 1194, 1284):
    d.rectangle([x - 18, 0, x + 18, 420], fill=(46, 50, 54))
    d.rectangle([x - 6, 0, x + 2, 420], fill=(92, 98, 104))
for y in (150, 280):
    d.rectangle([0, y, 470, y + 16], fill=(58, 60, 62)); d.rectangle([874, y, W, y + 16], fill=(58, 60, 62))
    for x in range(10, 470, 36):
        d.line([(x, y - 30), (x, y)], fill=(70, 72, 74), width=3)
    for x in range(884, W, 36):
        d.line([(x, y - 30), (x, y)], fill=(70, 72, 74), width=3)
for x, y in ((120, 120), (340, 250), (1000, 120), (1220, 250), (200, 330), (1150, 330)):
    d.ellipse([x - 9, y - 9, x + 9, y + 9], fill=(255, 190, 90))      # amber lamps
# the dome ring at the top
d.ellipse([280, -260, 1064, 120], outline=(120, 96, 60), width=14)
# the mako column: rings above, a glowing green shaft, a heavy base collar
d.rectangle([592, 0, 752, 400], fill=(40, 170, 110))
d.rectangle([640, 0, 704, 400], fill=(170, 255, 210))
for y in (40, 110, 180):
    d.rectangle([560, y, 784, y + 26], fill=(60, 66, 70))
d.ellipse([520, 360, 824, 440], fill=(50, 56, 60))
d.ellipse([560, 372, 784, 420], fill=(120, 255, 190))
# the platform: a wide grated deck seen from a raised camera, filling the lower half
deck = [(-200, H), (W + 200, H), (1180, 420), (164, 420)]
d.polygon(deck, fill=(64, 70, 72))
for i in range(1, 14):
    t = i / 14
    y = 420 + (H - 420) * t ** 1.3
    x0 = 164 + (-200 - 164) * (y - 420) / (H - 420); x1 = 1180 + (W + 200 - 1180) * (y - 420) / (H - 420)
    d.line([(x0, y), (x1, y)], fill=(40, 44, 46), width=3)
for k in range(-8, 9):
    d.line([(W / 2 + k * 64, 420), (W / 2 + k * 190, H)], fill=(40, 44, 46), width=3)
d.polygon([(560, H), (784, H), (720, 470), (624, 470)], fill=(60, 150, 110))   # glowing floor grate strip
# railings at the platform edge
d.line([(164, 420), (-200, H)], fill=(130, 136, 140), width=8); d.line([(1180, 420), (W + 200, H)], fill=(130, 136, 140), width=8)
d.line([(150, 380), (-220, 700)], fill=(110, 116, 120), width=5); d.line([(1194, 380), (W + 220, 700)], fill=(110, 116, 120), width=5)
im = im.filter(ImageFilter.GaussianBlur(2.2))
out = sys.argv[1]
os.makedirs(out, exist_ok=True)
im.save(os.path.join(out, 'core-sketch.png'))
print('ok')
