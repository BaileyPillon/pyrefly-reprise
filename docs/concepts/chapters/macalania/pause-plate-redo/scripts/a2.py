"""Option A2: option A with the independent judge's two residuals answered by pixel operations only.

JUDGE.md (2026-09-25) passed A at 7 and named two residuals:
  1. the hair is saturated royal blue, while the approved Chapter VII idle, the speaker portrait and
     the Ch I plate all have pale silver-lilac hair ("fixable by a hue and lightness shift on the hair
     matte, but that would be a new option, not A");
  2. the faded veins still read as a crack on the cheek at game size ("drop the veins ... or tint them
     to skin tone").
A2 = A, with (1) the hair pulled to the anchors' measured saturation and (2) the vein lines tinted to
the surrounding skin. No render, no GPU, no model: numpy on A's own pixels. The face outside the vein
lines, the mouth and nose lines, the eyes, the collar and the background are A's pixels.

Measured anchors (hair pixels, hue 185-260, value > 0.55, median): idle s 0.41 v 0.83; speaker
portrait s 0.25 v 0.95; Ch I plate s 0.50 v 0.84. Option A: s 0.69 v 0.82. Target: s ~0.40, the idle.

Usage: python a2.py <a.png> <keepA.png> <out.png>
FFX only (Chapter VII's pause plate).
"""
import sys
import numpy as np
from PIL import Image, ImageFilter

src, keep_path, out = sys.argv[1:4]
a = np.asarray(Image.open(src).convert('RGB')).astype(np.float32) / 255
H, W = a.shape[:2]
keep = np.asarray(Image.open(keep_path).convert('L').filter(ImageFilter.GaussianBlur(2))).astype(np.float32) / 255


def rgb_to_hsv(rgb):
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    mx = rgb.max(-1); mn = rgb.min(-1); d = mx - mn
    h = np.zeros_like(mx); m = d > 1e-6
    rr = (mx == r) & m; gg = (mx == g) & m & ~rr; bb = m & ~rr & ~gg
    h[rr] = ((g - b)[rr] / d[rr]) % 6; h[gg] = ((b - r)[gg] / d[gg]) + 2; h[bb] = ((r - g)[bb] / d[bb]) + 4
    return h * 60, np.where(mx > 0, d / np.maximum(mx, 1e-6), 0), mx


def hsv_to_rgb(h, s, v):
    h6 = (h % 360) / 60; i = np.floor(h6).astype(int) % 6; f = h6 - np.floor(h6)
    p = v * (1 - s); q = v * (1 - s * f); t = v * (1 - s * (1 - f))
    choices = [(v, t, p), (q, v, p), (p, v, t), (p, q, v), (t, p, v), (v, p, q)]
    out = np.zeros(h.shape + (3,), np.float32)
    for k, (r, g, b) in enumerate(choices):
        sel = i == k
        out[sel, 0] = r[sel]; out[sel, 1] = g[sel]; out[sel, 2] = b[sel]
    return out


# (1) Hair: blue hues inside the figure matte, weighted up with brightness so the dark indigo robe
# (value under ~0.45) is left alone and the hair's own shadows move only partly.
h, s, v = rgb_to_hsv(a)
hue_w = np.clip(1 - np.abs(h - 222) / 40, 0, 1)
val_w = np.clip((v - 0.42) / 0.18, 0, 1)
sat_w = np.clip((s - 0.2) / 0.15, 0, 1)  # skin shadows are lavender but unsaturated: leave them
w = hue_w * val_w * sat_w * keep
s2 = s * 0.52
v2 = np.clip(v * 1.03 + 0.015, 0, 1)
h2 = h + (224 - h) * 0.5
hair = hsv_to_rgb(h2, s2, v2)
res = a * (1 - w[..., None]) + hair * w[..., None]

# (2) Veins: in A's cheek box (prep_a.py), the thin lines darker than the local skin median are
# tinted to that median (skin tone). The mouth and nose lines are excluded exactly as prep_a.py did.
x0, y0, x1, y1 = 585, 300, 780, 455
box = (res[y0:y1, x0:x1] * 255).astype(np.uint8)
med = np.asarray(Image.fromarray(box).filter(ImageFilter.MedianFilter(11))).astype(np.float32) / 255
bx = res[y0:y1, x0:x1]
lum = bx.mean(-1); mlum = med.mean(-1)
bh, bs, bv = rgb_to_hsv(med)
skin = (bs < 0.35) & (bv > 0.55)  # the median is skin, not hair or collar
line = np.clip((mlum - lum - 0.012) / 0.05, 0, 1) * skin
byy, bxx = np.mgrid[y0:y1, x0:x1]
line[(bxx < 690) & (byy > 392)] = 0  # the mouth and nose lines stay exactly as painted
line = np.asarray(Image.fromarray((line * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))).astype(np.float32) / 255
line = np.clip(line * 1.5, 0, 1)[..., None] * 0.95
res[y0:y1, x0:x1] = bx * (1 - line) + med * line

mouth = (slice(392, 455), slice(585, 690))
res[mouth] = a[mouth]  # the mouth and nose lines are A's pixels, byte for byte
Image.fromarray(np.clip(res * 255 + 0.5, 0, 255).astype(np.uint8)).save(out)
hh, ss, vv = rgb_to_hsv(res)
sel = (keep > 0.5) & (hh > 185) & (hh < 260) & (vv > 0.55)
print('hair px', int(sel.sum()), 'median s', round(float(np.median(ss[sel])), 3), 'v', round(float(np.median(vv[sel])), 3),
      '| vein px', int((line[..., 0] > 0.3).sum()),
      '| mouth box max diff', float(np.abs(res[mouth] - a[mouth]).max()))
