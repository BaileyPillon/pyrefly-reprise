# O-3 plates: one painted Den (den-a3) under three lights, so the light is the only thing that changes.
# The floating pyreflies are drawn here as a stand-in for the engine's live particles.
import random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
src = Image.open('renders/den-a3.png').convert('RGB'); W, H = src.size
rgb = np.asarray(src).astype(np.float32) / 255
lum = (0.299 * rgb[..., 0] + 0.587 * rgb[..., 1] + 0.114 * rgb[..., 2])[..., None]
yy = (np.arange(H)[:, None] / H) * np.ones((1, W))
def motes(im, n, cols, seed, ymin=0.08, ymax=0.8, rmin=3, rmax=11, a=70):
    random.seed(seed); o = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(o)
    for _ in range(n):
        x, y = random.uniform(0, W), random.uniform(ymin * H, ymax * H); r = random.uniform(rmin, rmax); c = random.choice(cols)
        d.ellipse((x - r * 4, y - r * 4, x + r * 4, y + r * 4), fill=c + (a,))
    o = o.filter(ImageFilter.GaussianBlur(10)); c2 = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d2 = ImageDraw.Draw(c2)
    random.seed(seed)
    for _ in range(n):
        x, y = random.uniform(0, W), random.uniform(ymin * H, ymax * H); r = random.uniform(rmin, rmax); random.choice(cols)
        d2.ellipse((x - r * 0.7, y - r * 0.7, x + r * 0.7, y + r * 0.7), fill=(255, 255, 255, 230))
    return Image.alpha_composite(Image.alpha_composite(im.convert('RGBA'), o), c2.filter(ImageFilter.GaussianBlur(1.2))).convert('RGB')
def glowpool(im, cx, cy, rx, ry, col, a):
    m = Image.new('L', (W, H), 0); ImageDraw.Draw(m).ellipse((cx - rx, cy - ry, cx + rx, cy + ry), fill=a)
    return Image.composite(Image.new('RGB', (W, H), col), im, m.filter(ImageFilter.GaussianBlur(rx * 0.35)))
# A: cold blue pyreflies (the painting as rendered, lifted a little, blue motes)
a = Image.fromarray(np.clip(rgb * 1.12 * 255, 0, 255).astype(np.uint8))
a = glowpool(a, W * 0.5, H * 0.72, W * 0.42, H * 0.16, (90, 170, 210), 70)
a = motes(a, 90, [(150, 220, 255), (170, 255, 230), (200, 235, 255)], 1)
a.save('renders/plate-a.png')
# B: crimson (the same painting graded to a red ramp, red orb light)
ramp = np.array([[8, 2, 4], [70, 10, 16], [150, 24, 30], [230, 90, 70]], np.float32) / 255
l = np.clip(lum[..., 0] * 1.9, 0, 1); xs = np.array([0, 0.3, 0.65, 1])
b = np.stack([np.interp(l, xs, ramp[:, k]) for k in range(3)], -1) * 0.8 + rgb * 0.2
bi = Image.fromarray(np.clip(b * 255, 0, 255).astype(np.uint8))
bi = glowpool(bi, W * 0.5, H * 0.72, W * 0.42, H * 0.16, (190, 40, 36), 80)
bi = motes(bi, 90, [(255, 90, 60), (255, 140, 90), (255, 60, 70)], 1)
bi.save('renders/plate-b.png')
# C: near dark, one shaft from the ravine above onto the centre of the clearing
c = rgb * 0.38 * np.array([0.85, 0.9, 1.0])
ci = Image.fromarray(np.clip(c * 255, 0, 255).astype(np.uint8))
sh = Image.new('L', (W, H), 0); ImageDraw.Draw(sh).polygon([(W * 0.47, 0), (W * 0.53, 0), (W * 0.62, H * 0.78), (W * 0.40, H * 0.78)], fill=120)
ci = Image.composite(Image.new('RGB', (W, H), (215, 220, 200)), ci, sh.filter(ImageFilter.GaussianBlur(60)))
ci = glowpool(ci, W * 0.51, H * 0.76, W * 0.17, H * 0.06, (200, 205, 185), 150)
ci = motes(ci, 22, [(220, 230, 200), (200, 220, 255)], 2, 0.1, 0.75, 3, 8, 55)
ci.save('renders/plate-c.png')
for k in 'abc': Image.open(f'renders/plate-{k}.png').resize((1344, 768), Image.LANCZOS).save(f'tmp/plate-{k}.jpg', quality=85)
print('ok')
