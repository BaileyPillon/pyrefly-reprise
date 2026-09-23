"""Pixel repaint of attack's washed-out hakama hem (FFX-2 only, Chapter 6).

The independent judge (../judge.md, redo 2): both hem bands of attack are a washed-out
white band with beige flame shapes, not idle's gold diamond hem. Two diffusion passes
failed (redo.md: a 0.75 masked repaint kept the white band's pale value; an inpaint
from scratch drew skin and odd cloth). This edits the pixels directly:
  1. inside each band polygon, every washed pixel (grey, white or beige: blue barely above green) is re-coloured
     on a purple ramp keyed to its own luminance, so the pleat lines survive;
  2. a row of pale-gold diamonds (cast's hem: colour and size measured on
     cast.960106.raw.png, rows 1050 to 1120) is drawn along each column's hem bottom,
     shaded by the same luminance, with a dark 1 px outline.
A light diffusion pass (repaint.mjs at 0.3 to 0.4) may follow to blend it.

    python hemfix.py <in.raw.png> <out.raw.png>
"""
import json
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

POLYS = [
    [40, 960, 45, 915, 130, 860, 260, 870, 330, 930, 330, 1050, 250, 1080, 135, 1078, 75, 1010],
    [470, 985, 470, 915, 530, 860, 580, 860, 668, 935, 672, 1010, 600, 1015, 520, 1010],
]
DARK = np.array([44, 30, 82], np.float32)      # attack's own hakama shadow (sampled above the band)
LIGHT = np.array([158, 116, 206], np.float32)  # attack's lit hakama front
GOLD = np.array([232, 206, 138], np.float32)   # cast's hem diamonds (median of the gold pixels)
OUTLINE = np.array([36, 22, 52], np.float32)
HW, HH, STEP = 16, 30, 32                      # diamond half-width, half-height, spacing (cast: about 33 px apart)


def main(src: str, dst: str) -> dict:
    im = Image.open(src).convert('RGB')
    a = np.asarray(im).astype(np.float32)
    H, W = a.shape[:2]
    out = a.copy()
    lum = a @ np.array([0.299, 0.587, 0.114], np.float32)
    skin = (a[..., 0] > a[..., 1] + 25) & (a[..., 1] > a[..., 2]) & (lum < 170)
    white = a.min(axis=2) > 246
    info = []
    for p in POLYS:
        m = Image.new('L', (W, H), 0)
        ImageDraw.Draw(m).polygon([(p[i], p[i + 1]) for i in range(0, len(p), 2)], fill=255)
        poly = np.asarray(m) > 127
        washed = poly & ~white & ~skin & ((a[..., 2] - a[..., 1]) < 38)  # grey, white and beige all lack the purple's blue excess
        # grow a little so anti-aliased flame edges go too
        washed = (np.asarray(Image.fromarray((washed * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3))) > 127) & poly & ~white & ~skin
        t = np.clip((lum - 90) / (250 - 90), 0, 1)[..., None]
        ramp = DARK * (1 - t) + LIGHT * t
        out[washed] = ramp[washed]
        # the flame shapes' own outlines survive the ramp as dark lines: smooth them away inside the band
        sm = np.asarray(Image.fromarray(out.clip(0, 255).astype(np.uint8)).filter(ImageFilter.MedianFilter(7))).astype(np.float32)
        out[washed] = sm[washed]
        # hem bottom per column: last cloth row inside the polygon
        cloth = poly & ~white & ~skin
        xs = np.nonzero(cloth.any(axis=0))[0]
        bottom = {int(x): int(np.nonzero(cloth[:, x])[0].max()) for x in xs}
        gold = np.zeros((H, W), bool)
        x0 = xs.min()
        for x in xs:
            yb = bottom[int(x)]
            yc = yb - HH + 2
            k = round((x - x0) / STEP)
            cx = x0 + k * STEP
            for y in range(yc - HH, yb + 1):
                if abs(x - cx) / HW + abs(y - yc) / HH <= 1 and cloth[y, x]:
                    gold[y, x] = True
        shade = np.clip(0.55 + 0.6 * np.clip((lum - 40) / 200, 0, 1), 0.55, 1.1)[..., None]
        g = np.clip(GOLD * shade, 0, 255)
        out[gold] = g[gold]
        ring = (np.asarray(Image.fromarray((gold * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3))) > 127) & ~gold & cloth
        out[ring] = out[ring] * 0.4 + OUTLINE * 0.6
        info.append({'polygon': p, 'washedPx': int(washed.sum()), 'goldPx': int(gold.sum()), 'columns': int(len(xs))})
    Image.fromarray(out.clip(0, 255).astype(np.uint8)).save(dst)
    return {'bands': info, 'dark': DARK.tolist(), 'light': LIGHT.tolist(), 'gold': GOLD.tolist(), 'diamond': [HW, HH, STEP]}


if __name__ == '__main__':
    print(json.dumps(main(sys.argv[1], sys.argv[2])))
