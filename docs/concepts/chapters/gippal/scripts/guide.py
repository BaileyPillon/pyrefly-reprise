# Rough layout guides for the Den plate (1344x768): floor clearing in the lower 55 %, cave walls, a far tunnel mouth.
# One guide per light: a cold blue pyrefly glow / b crimson / c near dark with one shaft from above.
import sys, random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
W, H = 1344, 768
def guide(key, floor, wall, ceil, orb, shaft=False):
    im = Image.new('RGB', (W, H), ceil); d = ImageDraw.Draw(im)
    hz = 330
    d.polygon([(0, H), (W, H), (W, hz + 40), (980, hz), (360, hz), (0, hz + 40)], fill=floor)          # floor clearing
    d.polygon([(0, 0), (300, 0), (380, hz), (0, hz + 60)], fill=wall)                                   # left wall
    d.polygon([(W, 0), (1040, 0), (960, hz), (W, hz + 60)], fill=wall)                                  # right wall
    d.polygon([(560, hz), (600, 200), (700, 180), (760, 210), (790, hz)], fill=tuple(int(c * 0.35) for c in ceil))  # tunnel mouth
    for x in range(0, W, 90):                                                                           # stalactites
        d.polygon([(x, 0), (x + 50, 0), (x + 25, random.randint(40, 140))], fill=wall)
    arr = np.asarray(im).astype(np.float32)
    yy = np.arange(H)[:, None] * np.ones((1, W))
    arr *= (0.55 + 0.45 * np.clip((yy - hz) / (H - hz), 0, 1))[..., None] ** 0.6 if key != 'c' else 1
    im = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    if shaft:
        s = Image.new('L', (W, H), 0); ImageDraw.Draw(s).polygon([(620, 0), (720, 0), (860, 640), (560, 640)], fill=150)
        s = s.filter(ImageFilter.GaussianBlur(30)); im = Image.composite(Image.new('RGB', (W, H), (200, 205, 190)), im, s)
        e = Image.new('L', (W, H), 0); ImageDraw.Draw(e).ellipse((520, 560, 900, 680), fill=140); e = e.filter(ImageFilter.GaussianBlur(25))
        im = Image.composite(Image.new('RGB', (W, H), (170, 170, 150)), im, e)
    o = Image.new('RGBA', (W, H), (0, 0, 0, 0)); od = ImageDraw.Draw(o)
    for _ in range(60 if not shaft else 14):
        x, y, r = random.randint(0, W), random.randint(40, 600), random.randint(3, 8)
        od.ellipse((x - r * 3, y - r * 3, x + r * 3, y + r * 3), fill=orb + (70,)); od.ellipse((x - r, y - r, x + r, y + r), fill=(255, 255, 255, 230))
    im = Image.alpha_composite(im.convert('RGBA'), o.filter(ImageFilter.GaussianBlur(2))).convert('RGB')
    im = im.filter(ImageFilter.GaussianBlur(4)); im.save(f'renders/guide-{key}.png')
random.seed(3); guide('a', (60, 90, 120), (18, 30, 50), (10, 18, 34), (150, 220, 255))
random.seed(3); guide('b', (110, 45, 45), (40, 10, 14), (24, 6, 10), (255, 110, 80))
random.seed(3); guide('c', (26, 26, 30), (10, 10, 12), (4, 4, 6), (220, 230, 200), shaft=True)
print('ok')
