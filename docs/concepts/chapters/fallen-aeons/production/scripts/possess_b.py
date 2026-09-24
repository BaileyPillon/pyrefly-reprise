# O-2 possessed treatments derived from an approved idle's own pixels (no GPU, no repaint).
# Usage: possess.py idle.png outPrefix eyeX,eyeY[;eyeX,eyeY...] eyeRadius
# Writes <outPrefix>-a-none.png (padded copy), -b-violet.png (Chapter IV violet), -c-pyrefly.png (pyrefly edge),
# and <outPrefix>-mask-changed.png (where B differs from the idle, for the provenance note).
import sys, random
import numpy as np
from PIL import Image, ImageFilter, ImageDraw

src, pre, eyes_s, eye_r = sys.argv[1], sys.argv[2], sys.argv[3], float(sys.argv[4])
eyes = [tuple(float(v) for v in e.split(',')) for e in eyes_s.split(';') if e]
im = Image.open(src).convert('RGBA')
PAD = 70
AURA_CAP = 0.33  # below the engine's 0.35 alpha-measure threshold: the aura never moves the feet or the content box
W, H = im.size[0] + 2 * PAD, im.size[1] + 2 * PAD
base = Image.new('RGBA', (W, H), (0, 0, 0, 0)); base.paste(im, (PAD, PAD), im)
eyes = [(x + PAD, y + PAD) for x, y in eyes]
base.save(pre + '-a-none.png')
A = np.asarray(base.getchannel('A')).astype(np.float32) / 255
alpha_img = base.getchannel('A')

def srgb_to_lin(c): return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
def lin_to_srgb(c): return np.where(c <= 0.0031308, c * 12.92, 1.055 * np.clip(c, 0, None) ** (1 / 2.4) - 0.055)

# ---------------- B: Chapter IV violet ----------------
rgb = np.asarray(base).astype(np.float32)[..., :3] / 255
lum = (0.299 * rgb[..., 0] + 0.587 * rgb[..., 1] + 0.114 * rgb[..., 2])[..., None]
violet = np.array([0.46, 0.22, 0.78], np.float32)
# shadows and midtones lean violet, highlights keep their own colour (a grade, not a repaint)
w = np.clip(1.0 - lum * 1.15, 0, 1) * 0.42
graded = rgb * (1 - w) + (lum * 1.6 * violet) * w
graded = np.clip(graded * 0.93, 0, 1)
out = np.concatenate([graded * 255, np.asarray(base)[..., 3:4].astype(np.float32)], -1)
b = Image.fromarray(out.astype(np.uint8), 'RGBA')
# inner rim light along the silhouette
ero = alpha_img.filter(ImageFilter.MinFilter(13))
rim = np.clip(A - np.asarray(ero).astype(np.float32) / 255, 0, 1)
rim = np.asarray(Image.fromarray((rim * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(3))).astype(np.float32) / 255 * A
arr = np.asarray(b).astype(np.float32)
arr[..., :3] = np.clip(arr[..., :3] + rim[..., None] * np.array([120, 60, 200]) * 0.75, 0, 255)
b = Image.fromarray(arr.astype(np.uint8), 'RGBA')
# glowing violet eyes (additive glow + a bright core)
glow = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(glow)
for x, y in eyes:
    r = eye_r * 3.2
    d.ellipse((x - r, y - r * 0.7, x + r, y + r * 0.7), fill=(190, 110, 255, 230))
glow = glow.filter(ImageFilter.GaussianBlur(eye_r * 1.1)); glow = Image.alpha_composite(glow, glow)
core = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(core)
for x, y in eyes:
    d.ellipse((x - eye_r * 1.25, y - eye_r * 0.7, x + eye_r * 1.25, y + eye_r * 0.7), fill=(250, 238, 255, 255))
core = core.filter(ImageFilter.GaussianBlur(max(1, eye_r * 0.35)))
b = Image.alpha_composite(b, glow); b = Image.alpha_composite(b, core)
# dark violet aura behind the figure
dil1 = np.asarray(alpha_img.filter(ImageFilter.MaxFilter(31)).filter(ImageFilter.GaussianBlur(18))).astype(np.float32) / 255
dil2 = np.asarray(alpha_img.filter(ImageFilter.MaxFilter(61)).filter(ImageFilter.GaussianBlur(34))).astype(np.float32) / 255
aura = np.zeros((H, W, 4), np.float32)
aura[..., :3] = np.array([92, 34, 150])
aura[..., 3] = np.clip(dil2 * 0.55 + dil1 * 0.35, 0, AURA_CAP) * 255
aura_img = Image.fromarray(aura.astype(np.uint8), 'RGBA')
b = Image.alpha_composite(aura_img, b)
b.save(pre + '-b-violet.png')
diff = np.abs(np.asarray(b).astype(np.int16) - np.asarray(base).astype(np.int16)).max(-1) > 6
Image.fromarray((diff * 255).astype(np.uint8)).save(pre + '-mask-changed.png')

print('ok', W, H, 'changedB', round(diff.mean(), 3))
