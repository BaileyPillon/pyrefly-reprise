"""Film set: scale proxies, so every pose can be resampled to its idle's scale.
  boots  - sqrt of the brown-boot area in the lowest 22 % of the opaque rows (hue 10-40 deg, saturation 0.3-0.85,
           value 0.12-0.65): both party members wear the same boots in every pose and the boots stay whole and on
           the floor whether the body stands, lunges, crouches or flinches. The primary proxy for the party.
  stature- baseline minus the top of the hair (blond for Cloud, near-black for Barret), for upright poses: a
           cross-check of the boot proxy.
  grid   - a 100 px grid overlay (labels in source px) to read a measurement by eye (Guard Scorpion: shell length).
Usage: python measure.py boots|stature <cut.png> [cloud|barret]   |   python measure.py grid <img> <out.jpg>"""
import json, sys
import numpy as np
from PIL import Image, ImageDraw

mode, src = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGBA')


def hsv(a):
    mx, mn = a[..., :3].max(-1), a[..., :3].min(-1)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    s = (mx - mn) / np.maximum(mx, 1e-6)
    hue = np.degrees(np.arctan2(np.sqrt(3) * (g - b), 2 * r - g - b)) % 360
    return hue, s, mx


if mode in ('boots', 'stature'):
    a = np.asarray(im).astype(float) / 255
    op = a[..., 3] > 0.5
    rows = np.nonzero(op.any(1))[0]
    top, base = rows.min(), rows.max()
    hue, s, v = hsv(a)
    if mode == 'boots':
        low = np.zeros_like(op)
        low[int(base - 0.22 * (base - top)):] = True
        boot = op & low & (hue > 10) & (hue < 40) & (s > 0.3) & (s < 0.85) & (v > 0.12) & (v < 0.65)
        print(json.dumps({'boots': round(float(np.sqrt(boot.sum())), 1)}))
    else:
        sub = sys.argv[3]
        hair = op & (((hue > 38) & (hue < 62) & (s > 0.45) & (v > 0.55)) if sub == 'cloud' else ((v < 0.16) & (s < 0.6)))
        hr = np.nonzero(hair.any(1))[0]
        print(json.dumps({'stature': int(base - hr.min()), 'baseline': int(base), 'hairTop': int(hr.min())}))
else:
    out = sys.argv[3]
    k = 900 / im.height
    bg = Image.new('RGBA', im.size, (70, 74, 80, 255))
    bg.alpha_composite(im)
    bg = bg.convert('RGB').resize((int(im.width * k), 900), Image.LANCZOS)
    d = ImageDraw.Draw(bg)
    for y in range(0, im.height, 100):
        d.line([(0, y * k), (bg.width, y * k)], fill=(255, 0, 255) if y % 500 == 0 else (0, 200, 255), width=1)
        d.text((2, y * k + 1), str(y), fill=(255, 255, 0))
    for x in range(0, im.width, 100):
        d.line([(x * k, 0), (x * k, 900)], fill=(255, 0, 255) if x % 500 == 0 else (0, 200, 255), width=1)
    bg.save(out, quality=85)
    print(out, bg.size)
