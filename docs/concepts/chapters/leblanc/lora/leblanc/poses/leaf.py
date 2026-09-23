"""Recolour the open fan's leaf in a cast frame (FFX-2 only, Chapter 6). No diffusion: a pixel
recolour inside the fan's sector, so the line art, ribs and every other pixel stay as rendered.

The LoRA painted the open leaf lavender, which nothing sources (lora/leblanc/judge.md, cast).
Idle only shows the fan closed, black; research/ffx2-leblanc-syndicate.md section 10.1 says a
"red-and-silver fan". The leaf colour is Bailey's call (hard rule 6), so this writes one variant
per option and installs none by itself:

  red    the research's red and silver: the leaf's darker stripes crimson, the lighter ones silver
  black  idle's black: the leaf dark charcoal, its two stripe tones kept apart

    python leaf.py <src-tag> <pivot x,y> <r0> <r1> <a0> <a1>   -> <src-tag>.leafred / .leafblack (.raw.png)

Angles are screen degrees from the pivot (0 = right, -90 = up); r0..r1 is the leaf's radial band.
Only pixels in that sector whose hue is lavender (200..290 deg, saturation >= 0.1) change.
"""
import colorsys
import math
import pathlib
import sys

from PIL import Image, ImageFilter

D = pathlib.Path('D:/Tools/pyrefly-lora/leblanc/poses')


def recolour(src, pivot, r0, r1, a0, a1, mode):
    im = Image.open(D / f'{src}.raw.png').convert('RGB')
    px = im.load()
    # stripe class read from a 5x5 median, so anti-aliased pixels at a stripe edge do not speckle
    med = im.filter(ImageFilter.MedianFilter(5)).load()
    n = 0
    for y in range(im.height):
        for x in range(im.width):
            dx, dy = x - pivot[0], y - pivot[1]
            r = math.hypot(dx, dy)
            if not (r0 <= r <= r1):
                continue
            a = math.degrees(math.atan2(dy, dx))
            if not (a0 <= a <= a1):
                continue
            R, G, B = px[x, y]
            h, s, v = colorsys.rgb_to_hsv(R / 255, G / 255, B / 255)
            if not (200 / 360 <= h <= 290 / 360 and s >= 0.1):
                continue
            mh, ms, mv = colorsys.rgb_to_hsv(*(c / 255 for c in med[x, y]))
            dark = ms >= 0.42       # the leaf's two stripe tones: darker (s ~0.6) and lighter (s ~0.3)
            if mode == 'red':
                out = colorsys.hsv_to_rgb(352 / 360, min(1, s * 1.35), v * 0.85) if dark else \
                    colorsys.hsv_to_rgb(215 / 360, 0.06, v * 0.88)
            else:
                out = colorsys.hsv_to_rgb(250 / 360, 0.12, v * (0.16 if dark else 0.28))
            px[x, y] = tuple(round(c * 255) for c in out)
            n += 1
    name = f'{src}.leaf{mode}'
    im.save(D / f'{name}.raw.png')
    print(name, 'pixels recoloured:', n)
    return name


if __name__ == '__main__':
    src = sys.argv[1]
    pivot = tuple(map(float, sys.argv[2].split(',')))
    r0, r1, a0, a1 = map(float, sys.argv[3:7])
    for mode in ('red', 'black'):
        recolour(src, pivot, r0, r1, a0, a1, mode)
