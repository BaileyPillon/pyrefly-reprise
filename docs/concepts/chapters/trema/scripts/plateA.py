# Plate A: derived from the approved Bevelle Underground pixels (no GPU): teal grade, orange lamps turned
# to cold white, our own banner design hung upside down from the vaults, pyrefly motes.
import random, numpy as np
from PIL import Image, ImageDraw, ImageFilter
src = 'D:/Final Fantasy/public/art/backdrops/bevelle-underground.png'
im = Image.open(src).convert('RGB'); W, H = im.size
hsv = np.asarray(im.convert('HSV')).astype(np.float32)
h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
orange = (h > 5) & (h < 40) & (s > 90) & (v > 90)
w = np.clip((s - 90) / 80, 0, 1) * orange
h2 = np.where(orange, 128, h); s2 = s * (1 - 0.8 * w)
lamps = Image.fromarray(np.stack([h2, s2, v], -1).astype(np.uint8), 'HSV').convert('RGB')
rgb = np.asarray(lamps).astype(np.float32) / 255
lum = (0.299 * rgb[..., 0] + 0.587 * rgb[..., 1] + 0.114 * rgb[..., 2])[..., None]
teal = np.array([0.55, 0.95, 1.0])
g = rgb * 0.55 + lum * teal * 0.5
g = np.clip(g * 1.02, 0, 1)
base = Image.fromarray((g * 255).astype(np.uint8)).convert('RGBA')
def banner(cx, top, bw, bh, dark):
    L = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(L)
    # upside down: the swallow-tail points at the top, the hanging rod at the bottom edge
    poly = [(cx - bw/2, top + bw*0.35), (cx, top), (cx + bw/2, top + bw*0.35), (cx + bw/2, top + bh), (cx - bw/2, top + bh)]
    shade = int(232 * dark); d.polygon(poly, fill=(shade, shade + 4 if shade < 251 else 255, min(255, shade + 8), 255))
    d.rectangle((cx - bw/2 - 6, top + bh - 4, cx + bw/2 + 6, top + bh + 6), fill=(60, 50, 30, 255))
    # our emblem, inverted: a ring over a downward stroke with two hooked arms (original design)
    ec, er = top + bh*0.55, bw*0.28; ink = (18, 20, 26, 255)
    d.ellipse((cx - er, ec - er, cx + er, ec + er), outline=ink, width=max(3, int(bw*0.06)))
    d.line((cx, ec - er*2.2, cx, ec + er*0.4), fill=ink, width=max(3, int(bw*0.07)))
    d.arc((cx - er*1.6, ec - er*2.4, cx + er*1.6, ec - er*0.6), 20, 160, fill=ink, width=max(3, int(bw*0.06)))
    d.polygon([(cx - bw*0.12, top + bh*0.2), (cx, top + bh*0.28), (cx + bw*0.12, top + bh*0.2), (cx, top + bh*0.12)], fill=ink)
    # cloth falloff: darker toward the top, a soft vertical fold
    a = np.asarray(L).astype(np.float32); yy = np.arange(H)[:, None]
    f = np.clip(0.45 + (yy - top) / bh * 0.55, 0.35, 1.0); xx = np.arange(W)[None, :]; fold = 0.82 + 0.18 * np.cos((xx - cx) / bw * 9.0); a[..., :3] *= (f * fold)[..., None]; a[..., 3] *= 0.9
    return Image.fromarray(a.astype(np.uint8))
for cx, top, bw, bh, dk, blur in [(520, 40, 150, 700, .62, 2), (880, 90, 100, 480, .52, 3), (1810, 90, 100, 480, .52, 3), (2170, 40, 150, 700, .62, 2)]:
    base = Image.alpha_composite(base, banner(cx, top, bw, bh, dk).filter(ImageFilter.GaussianBlur(blur)))
random.seed(5); mot = Image.new('RGBA', (W, H), (0, 0, 0, 0))
for _ in range(90):
    x, y, r = random.uniform(0, W), random.uniform(H*0.15, H*0.85), random.uniform(3, 9)
    c = random.choice([(139, 232, 176), (233, 255, 244)])
    g2 = Image.new('RGBA', (int(r*8), int(r*8)), (0, 0, 0, 0)); dd = ImageDraw.Draw(g2)
    dd.ellipse((r*1, r*1, r*7, r*7), fill=c + (90,)); g2 = g2.filter(ImageFilter.GaussianBlur(r*1.2))
    ImageDraw.Draw(g2).ellipse((r*3.4, r*3.4, r*4.6, r*4.6), fill=(240, 255, 248, 240))
    mot.alpha_composite(g2, (int(x - r*4), int(y - r*4)))
base = Image.alpha_composite(base, mot)
base.convert('RGB').save('renders/cloister-a.png'); base.convert('RGB').resize((1344, 768)).save('shots/ca.jpg', quality=85)
