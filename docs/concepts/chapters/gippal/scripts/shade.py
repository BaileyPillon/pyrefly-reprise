# O-1 B and C treatments from Gippal's own pixels (no GPU). Usage: shade.py in.png outPrefix
# B "translucent, lit from within": desaturate, cool, an inner glow that brightens toward the core, alpha 0.78, pale motes inside.
# C "anger-red pyrefly body": luminance mapped onto a crimson-to-ember ramp, rim of red motes, the feet dissolving upward.
import sys, random
import numpy as np
from PIL import Image, ImageFilter, ImageDraw
src, pre = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGBA'); PAD = 70
W, H = im.size[0] + 2 * PAD, im.size[1] + 2 * PAD
base = Image.new('RGBA', (W, H), (0, 0, 0, 0)); base.paste(im, (PAD, PAD), im)
arr = np.asarray(base).astype(np.float32) / 255
rgb, A = arr[..., :3], arr[..., 3]
lum = 0.299 * rgb[..., 0] + 0.587 * rgb[..., 1] + 0.114 * rgb[..., 2]
alpha_img = base.getchannel('A')
ys, xs = np.nonzero(A > 0.5); top, bot = ys.min(), ys.max()
vy = ((np.arange(H)[:, None] - top) / max(1, bot - top)).clip(0, 1) * np.ones((1, W))

def motes(n, region, colors, rmin, rmax, seed, a=80):
    random.seed(seed); layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    yy, xx = np.nonzero(region)
    for _ in range(n):
        i = random.randrange(len(xx)); x, y = xx[i], yy[i]; r = random.uniform(rmin, rmax); c = random.choice(colors)
        g = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(g)
        d.ellipse((x - r * 3, y - r * 3, x + r * 3, y + r * 3), fill=c + (a,)); g = g.filter(ImageFilter.GaussianBlur(r * 1.6))
        layer = Image.alpha_composite(layer, g)
        ImageDraw.Draw(layer).ellipse((x - r * 0.6, y - r * 0.6, x + r * 0.6, y + r * 0.6), fill=(255, 255, 255, 235))
    return layer

# ---------- B: translucent, lit from within ----------
gray = lum[..., None]
cool = np.array([0.62, 0.80, 1.00], np.float32)
b_rgb = gray * cool * 0.9 + rgb * 0.18
core = np.asarray(alpha_img.filter(ImageFilter.MinFilter(21)).filter(ImageFilter.GaussianBlur(28))).astype(np.float32) / 255
b_rgb = np.clip(b_rgb + core[..., None] * np.array([0.30, 0.42, 0.50]) * 0.9, 0, 1)
b_a = A * (0.80 - 0.30 * vy ** 3)          # thins toward the feet
b = Image.fromarray(np.concatenate([b_rgb * 255, b_a[..., None] * 255], -1).astype(np.uint8), 'RGBA')
halo = np.asarray(alpha_img.filter(ImageFilter.MaxFilter(25)).filter(ImageFilter.GaussianBlur(20))).astype(np.float32) / 255
hl = np.zeros((H, W, 4), np.float32); hl[..., :3] = [150, 210, 255]; hl[..., 3] = np.clip(halo * 0.45, 0, 1) * 255
b = Image.alpha_composite(Image.fromarray(hl.astype(np.uint8), 'RGBA'), b)
inside = (A > 0.6) & (np.asarray(alpha_img.filter(ImageFilter.MinFilter(15))) > 128)
b = Image.alpha_composite(b, motes(70, inside, [(200, 235, 255), (170, 220, 255), (220, 255, 240)], 1.5, 3.5, 11, 60))
b.save(pre + '-b-translucent.png')

# ---------- C: anger-red pyrefly body ----------
ramp_x = np.array([0.0, 0.25, 0.55, 0.8, 1.0]); ramp = np.array([[20, 2, 6], [90, 8, 16], [190, 30, 24], [250, 110, 40], [255, 225, 170]], np.float32) / 255
l2 = np.clip(lum * 1.1, 0, 1)
c_rgb = np.stack([np.interp(l2, ramp_x, ramp[:, k]) for k in range(3)], -1)
c_a = A.copy()
# dissolve the lower legs into motes: noise threshold rising with height from the feet
rng = np.random.default_rng(5); noise = np.asarray(Image.fromarray((rng.random((H // 4, W // 4)) * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC).filter(ImageFilter.GaussianBlur(3))).astype(np.float32) / 255
cut = np.clip((vy - 0.78) / 0.22, 0, 1)
c_a = c_a * np.clip((noise - cut * 0.9) * 4 + 0.2, 0, 1) ** 0.8
c = Image.fromarray(np.concatenate([c_rgb * 255, c_a[..., None] * 255], -1).astype(np.uint8), 'RGBA')
ai = Image.fromarray((c_a * 255).astype(np.uint8))
halo = np.asarray(ai.filter(ImageFilter.MaxFilter(31)).filter(ImageFilter.GaussianBlur(24))).astype(np.float32) / 255
hl = np.zeros((H, W, 4), np.float32); hl[..., :3] = [200, 30, 20]; hl[..., 3] = np.clip(halo * 0.55, 0, 1) * 255
c = Image.alpha_composite(Image.fromarray(hl.astype(np.uint8), 'RGBA'), c)
dil = np.asarray(alpha_img.filter(ImageFilter.MaxFilter(51))).astype(np.float32) / 255
ring = (dil > 0.5) & (A < 0.5)
ring2 = ring & (vy > 0.55)
c = Image.alpha_composite(c, motes(110, ring, [(255, 90, 60), (255, 150, 80), (255, 60, 60)], 2.0, 4.5, 21))
c = Image.alpha_composite(c, motes(60, ring2, [(255, 120, 70), (255, 200, 120)], 1.5, 3.5, 22))
c.save(pre + '-c-anger.png')
print('ok', W, H)
