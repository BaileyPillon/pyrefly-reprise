"""Pixel repair of dr-A.72304 (FFX-2 only, candidate): recolour the off-canon tan loincloth and the
bead necklace into the suit's own olive green, keeping each pixel's painted shading (luminance ratio).
No generation; alpha untouched.
    python repair_drA.py in.png out.png
"""
import sys
import numpy as np
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
im = np.asarray(Image.open(src).convert('RGBA')).astype(np.float32) / 255.0
rgb, a = im[..., :3], im[..., 3]
r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
mx = rgb.max(-1); mn = rgb.min(-1)
v = mx; s = np.where(mx > 1e-6, (mx - mn) / np.maximum(mx, 1e-6), 0)
d = np.maximum(mx - mn, 1e-6)
h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
H, W = a.shape
yy, xx = np.mgrid[0:H, 0:W]
solid = a > 0.5
green = solid & (h > 60) & (h < 120) & (s > 0.2) & (v > 0.3)
torso = green & (yy > 250) & (yy < 520)
ref = np.median(rgb[torso], axis=0); ref_l = np.median(lum[torso])

tan = solid & (h >= 20) & (h <= 60) & (s > 0.12) & (v > 0.3) & (yy > 440) & (yy < 900)
beads = solid & (s < 0.25) & (v > 0.55) & (xx > 270) & (xx < 430) & (yy > 158) & (yy < 250)

out_rgb = rgb.copy()
# loincloth: the suit's olive at the cloth's own shading, a touch darker so it sits into the suit
k = np.clip(lum[tan] / np.median(lum[tan]), 0.3, 1.4)[:, None] * 0.72
out_rgb[tan] = np.clip(ref[None, :] * k, 0, 1)


def dilate(m, n):
    for _ in range(n):
        g2 = m.copy()
        g2[1:] |= m[:-1]; g2[:-1] |= m[1:]; g2[:, 1:] |= m[:, :-1]; g2[:, :-1] |= m[:, 1:]
        m = g2
    return m


# necklace: the white beads plus the dark cord within 3 px of them; filled from the surrounding
# suit pixels by onion-peel diffusion (each masked pixel takes the mean of its known neighbours)
chain = dilate(beads, 3) & solid & ((v < 0.38) | ((s < 0.25) & (v > 0.45)))
chain = dilate(chain, 1) & solid
chain |= dilate(chain, 2) & solid & (v < 0.45) & (yy > 180)
heart_box = (xx > 250) & (xx < 332) & (yy > 232) & (yy < 320)
chain &= ~heart_box
known = ~chain
for _ in range(40):
    if known.all():
        break
    acc = np.zeros_like(out_rgb); cnt = np.zeros(known.shape, np.float32)
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            if dy == 0 and dx == 0:
                continue
            sh_k = np.roll(np.roll(known & solid, dy, 0), dx, 1)
            sh_c = np.roll(np.roll(out_rgb, dy, 0), dx, 1)
            acc += sh_c * sh_k[..., None]; cnt += sh_k
    fill = (~known) & (cnt >= 3)
    out_rgb[fill] = acc[fill] / cnt[fill][:, None]
    known = known | fill
print('chain px', int(chain.sum()))
res = np.concatenate([out_rgb, a[..., None]], -1)
Image.fromarray((res * 255 + 0.5).astype(np.uint8), 'RGBA').save(out)
print('ref', (ref * 255).round(), 'tan', int(tan.sum()), 'beads', int(beads.sum()), 'size', W, H)
