"""Pixel repaint of the KO shield face toward idle's (FFX-2 only, Chapter 6).

The independent judge (../judge.md): ko's shield is 'a halo-like shield that is not
idle's sunburst' (gold rim, blue band, red studded band, blue centre with orange
ornaments). Idle's shield is a gold studded rim, a red band and a purple sunburst face.
A diffusion repaint of the face (redo.md, ko-shield) kept the red and orange base and
came out salmon, so this edits the pixels directly, keeping the heart:
  1. blue pixels of the outer band -> idle's red band (a red ramp keyed to luminance);
  2. the centre disc's blue and orange pixels (outside the heart) -> a purple ramp;
  3. radiating darker purple lines over the recoloured centre (idle's sunburst).
A light diffusion pass (repaint.mjs at 0.3) may follow to blend it.

    python shieldfix.py <in.raw.png> <out.raw.png> cx cy r_centre
"""
import json
import math
import sys

import numpy as np
from PIL import Image, ImageDraw

RED_D, RED_L = np.array([90, 12, 18], np.float32), np.array([205, 45, 40], np.float32)      # idle's band
PUR_D, PUR_L = np.array([60, 30, 110], np.float32), np.array([170, 120, 225], np.float32)   # idle's sunburst face
LINE = np.array([70, 36, 120], np.float32)
YMAX = 445


def main(src, dst, cx, cy, rc):
    a = np.asarray(Image.open(src).convert('RGB')).astype(np.float32)
    H, W = a.shape[:2]
    yy, xx = np.mgrid[0:H, 0:W]
    r = np.hypot(xx - cx, yy - cy)
    R, G, B = a[..., 0], a[..., 1], a[..., 2]
    lum = a @ np.array([0.299, 0.587, 0.114], np.float32)
    mx, mn = a.max(axis=2), a.min(axis=2)
    hue = np.degrees(np.arctan2(np.sqrt(3) * (G - B), 2 * R - G - B)) % 360
    # blue band and centre: hue 200 to 252; his robe is purple (hue above 255) and is left alone
    blue = (hue > 200) & (hue < 252) & (mx - mn > 40)
    # the figure lies over the bottom of the shield: stop above his belly (purple, lit) by using only blue/orange pixels
    heart = ((xx - cx) / 60.0) ** 2 + ((yy - (cy + 12)) / 52.0) ** 2 <= 1
    orange = (R > B + 60) & (G > B + 20) & (R > 150) & (hue < 42)
    # y limit: his robe's blue-violet shadows lie below the shield's visible part (y 445 on this frame)
    cand = blue & (r > rc + 4) & (r < rc + 150)
    # keep only the blue band pixels connected to the part above YMAX (flood fill), so the
    # band's lower-left end is caught but the robe (split from it by its outline) is not
    lab = Image.fromarray((cand * 255).astype(np.uint8)).copy()  # copy: floodfill cannot write to an array-backed image
    ys, xs = np.nonzero(cand & (yy < YMAX))
    for y, x in list(zip(ys, xs))[::16]:
        if lab.getpixel((int(x), int(y))) == 255:
            ImageDraw.floodfill(lab, (int(x), int(y)), 128)
    band = np.asarray(lab) == 128
    t = np.clip((lum - 30) / 120, 0, 1)[..., None]
    out = a.copy()
    red = RED_D * (1 - t) + RED_L * t
    out[band] = red[band]
    fl = Image.fromarray(((blue & (r <= rc + 4)) * 255).astype(np.uint8)).copy()
    ys, xs = np.nonzero(blue & (r <= rc + 4) & (yy < YMAX))
    for y, x in list(zip(ys, xs))[::16]:
        if fl.getpixel((int(x), int(y))) == 255:
            ImageDraw.floodfill(fl, (int(x), int(y)), 128)
    face = (r <= rc + 4) & ((np.asarray(fl) == 128) | (orange & ~heart & (yy < cy + rc * 0.75)))
    tp = np.clip((lum - 30) / 180, 0, 1)[..., None]
    pur = PUR_D * (1 - tp) + PUR_L * tp
    # orange ornaments flatten into the face (idle's face has none): a fixed mid purple
    tb = float(np.median(tp[..., 0][(r <= rc) & blue]))
    pur = np.where(orange[..., None], PUR_D * (1 - tb) + PUR_L * tb, pur)
    out[face] = pur[face]
    # sunburst lines, drawn at 4x and only kept on the recoloured face
    S = 4
    L = Image.new('L', (W * S, H * S), 0)
    d = ImageDraw.Draw(L)
    for k in range(0, 360, 7):
        ang = math.radians(k)
        d.line([((cx + 62 * math.cos(ang)) * S, (cy + 56 * math.sin(ang)) * S), ((cx + rc * math.cos(ang)) * S, (cy + rc * math.sin(ang)) * S)], fill=160, width=S * 2)
    L = np.asarray(L.resize((W, H), Image.LANCZOS)).astype(np.float32)[..., None] / 255.0
    lines = np.where(face[..., None], L, 0)
    out = out * (1 - lines) + LINE * lines
    Image.fromarray(out.clip(0, 255).astype(np.uint8)).save(dst)
    return {'centre': [cx, cy], 'rCentre': rc, 'bandPx': int(band.sum()), 'facePx': int(face.sum())}


if __name__ == '__main__':
    print(json.dumps(main(sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4]), float(sys.argv[5]))))
