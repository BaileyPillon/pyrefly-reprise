# The Recharge glow for Ixion's FFX-2 look B (D-268, FFX-2 only). No GPU, no repaint.
# Input: a possess_b.py "-b-violet" output (70 px pad) and the source's horn polygon in SOURCE pixels.
# Adds, over the violet grade: the horn lit pale violet-white from base to tip (inside the figure, alpha
# untouched), a brighter inner rim on the whole silhouette (the charge running through him), and a soft
# halo round the horn plus a gathering glow at its tip OUTSIDE the figure, whose alpha is capped with the
# aura at 0.33 (under the engine's 0.35 alpha-measure threshold: the feet and the content box never move).
# Usage: recharge_glow.py in-b-violet.png out.png "x,y;x,y;..." (horn polygon, source px) tipX,tipY
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

PAD = 70
CAP = 0.33
src, out, poly_s, tip_s = sys.argv[1:5]
poly = [tuple(float(v) + PAD for v in p.split(',')) for p in poly_s.split(';') if p]
tip = tuple(float(v) + PAD for v in tip_s.split(','))
im = Image.open(src).convert('RGBA')
W, H = im.size
arr = np.asarray(im).astype(np.float32)
A = arr[..., 3] / 255
body = (A >= 0.35).astype(np.float32)  # the painted figure, not the aura
body_img = Image.fromarray((body * 255).astype(np.uint8))

# 1. the horn, lit: figure pixels inside the polygon, pushed toward pale violet-white (a screen blend)
pm = Image.new('L', (W, H), 0); ImageDraw.Draw(pm).polygon(poly, fill=255)
horn = (np.asarray(pm).astype(np.float32) / 255) * body
horn_soft = np.asarray(Image.fromarray((horn * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2))).astype(np.float32) / 255 * body
lit = np.array([236, 222, 255], np.float32)
rgb = arr[..., :3]
k = horn_soft[..., None] * 0.85
rgb = 255 - (255 - rgb) * (1 - k * lit / 255)

# 2. the charge in the body: a brighter, paler inner rim than the grade's
ero = body_img.filter(ImageFilter.MinFilter(9))
rim = np.clip(body - np.asarray(ero).astype(np.float32) / 255, 0, 1)
rim = np.asarray(Image.fromarray((rim * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2.5))).astype(np.float32) / 255 * body
rgb = np.clip(rgb + rim[..., None] * np.array([150, 120, 230], np.float32) * 0.55, 0, 255)

# 3. outside the figure: a halo round the horn and a gathering glow at the tip, alpha capped with the aura
halo = np.asarray(Image.fromarray((horn * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(15)).filter(ImageFilter.GaussianBlur(20))).astype(np.float32) / 255
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
d = np.hypot(xx - tip[0], yy - tip[1])
orb = np.clip(1 - d / 56, 0, 1) ** 1.2
glow = np.clip(halo * 2.4 + orb * 1.2, 0, 1)
outside = 1 - body
new_a = np.maximum(A, np.minimum(glow * CAP, CAP)) * outside + A * body
# colour the glow over the aura too (blend by the glow's own strength; the alpha stays capped)
gcol = np.array([200, 150, 255], np.float32)
share = np.clip(glow, 0, 1) * outside
rgb = rgb * (1 - share[..., None]) + gcol * share[..., None]
# the orb also brightens the figure pixels it touches (the tip itself)
rgb = 255 - (255 - rgb) * (1 - (orb * body * 0.9)[..., None] * lit / 255)

res = np.concatenate([np.clip(rgb, 0, 255), (np.clip(new_a, 0, 1) * 255)[..., None]], -1).astype(np.uint8)
Image.fromarray(res, 'RGBA').save(out)
outA = res[..., 3].astype(np.float32) / 255
moved = int(((outA >= 0.35) != (A >= 0.35)).sum())
print('ok', W, H, 'opaque-mask pixels changed', moved)
