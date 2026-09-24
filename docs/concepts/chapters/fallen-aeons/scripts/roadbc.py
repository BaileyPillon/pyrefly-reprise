# O-3 B and C, derived from plate A's own pixels (no new render).
# B: two smaller copies of A's floating island placed toward the spire, lower halves sunk into mist.
# C: A graded to a dimmed Farplane (shadows toward indigo, the spire's light pulled down).
import numpy as np
from PIL import Image, ImageFilter, ImageDraw
A = Image.open('o3/road-a3.png').convert('RGB'); W, H = A.size
arr = np.asarray(A).astype(np.float32)
lum = arr.mean(-1)
yy = np.arange(H)[:, None] * np.ones((1, W))
isl = (lum < 150) & (yy > 0.74 * H)
m = Image.fromarray((isl * 255).astype(np.uint8)).filter(ImageFilter.MedianFilter(9)).filter(ImageFilter.GaussianBlur(2))
bbox = m.getbbox(); print('island bbox', bbox)
isl_rgba = A.convert('RGBA'); isl_rgba.putalpha(m); isl_rgba = isl_rgba.crop(bbox)
# fade the cut-off bottom of the copy into mist
ia = np.asarray(isl_rgba).astype(np.float32); h = ia.shape[0]
fade = np.clip((1 - (np.arange(h) / h - 0.35) / 0.5), 0, 1)[:, None]
ia[..., 3] *= fade
isl_rgba = Image.fromarray(ia.astype(np.uint8), 'RGBA')
B = A.convert('RGBA')
mist = np.array([236, 200, 242], np.float32)
for (cx, cy, sc, haze) in [(0.52, 0.667, 0.12, 0.6), (0.54, 0.717, 0.24, 0.42)]:
    c = isl_rgba.resize((int(isl_rgba.width * sc), int(isl_rgba.height * sc)), Image.LANCZOS)
    ca = np.asarray(c).astype(np.float32); ca[..., :3] = ca[..., :3] * (1 - haze) + mist * haze
    c = Image.fromarray(ca.astype(np.uint8), 'RGBA')
    B.alpha_composite(c, (int(cx * W - c.width / 2), int(cy * H - c.height * 0.25)))
# a thin mist band over the far copies so they sit in the void
B = B.convert('RGB'); B.save('o3/road-b3.png'); B.resize((1344, 768), Image.LANCZOS).save('o3/road-b3-look.jpg', quality=88)
# C: dimmed
rgb = arr / 255
l = rgb.mean(-1, keepdims=True)
ind = np.array([0.22, 0.16, 0.42])
C = rgb * 0.62 + (l * ind * 1.4) * 0.38
C = C * (0.72 + 0.1 * (yy[..., None] / H))
C = np.clip(C ** 1.12, 0, 1)
Image.fromarray((C * 255).astype(np.uint8)).save('o3/road-c.png')
Image.fromarray((C * 255).astype(np.uint8)).resize((1344, 768), Image.LANCZOS).save('o3/road-c-look.jpg', quality=88)
