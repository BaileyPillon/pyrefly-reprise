"""Lay the hole into a base Chamber render, as the init for an img2img pass (FFX-2 only; options only).

research/ffx2-ixion-djose.md 6.1: "a deep hole in the middle of the Chamber of the Fayth where the
fayth statue used to be" (wiki), tunnels to the Farplane (wiki), "the gaping hole where it looks like
the Fayth had been ripped out" (FFExodus). The checkpoint will not draw a hole in a floor from words,
so the hole is painted in by hand here (a jagged dark ellipse, a broken lip, pale mist rising from the
Farplane below) and the img2img pass repaints it in the house finish.

    python .../hole_init.py <base.png> <out.png> <cx> <cy> <rx> <ry> [lamp x,y,h ...]   (fractions of the image size)
Deletes nothing.
"""
from __future__ import annotations

import math
import random
import sys

from PIL import Image, ImageDraw, ImageFilter


def main() -> None:
    src, out = sys.argv[1], sys.argv[2]
    fx, fy, frx, fry = (float(v) for v in sys.argv[3:7])
    im = Image.open(src).convert("RGB")
    W, H = im.size
    cx, cy, rx, ry = fx * W, fy * H, frx * W, fry * H
    rnd = random.Random(7)

    def ragged(scale: float, jitter: float) -> list[tuple[float, float]]:
        pts = []
        for i in range(90):
            a = 2 * math.pi * i / 90
            r = scale * (1 + rnd.uniform(-jitter, jitter))
            pts.append((cx + math.cos(a) * rx * r, cy + math.sin(a) * ry * r))
        return pts

    # the broken lip: a lighter ring of cracked stone, a little larger than the hole
    lip = Image.new("L", im.size, 0)
    ImageDraw.Draw(lip).polygon(ragged(1.16, 0.07), fill=255)
    lip = lip.filter(ImageFilter.GaussianBlur(6))
    im = Image.composite(Image.blend(im, Image.new("RGB", im.size, (120, 128, 142)), 0.35), im, lip)

    # the hole: near-black at the rim, a pale cold glow deep in the middle (the Farplane below)
    mask = Image.new("L", im.size, 0)
    ImageDraw.Draw(mask).polygon(ragged(1.0, 0.09), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(3))
    inner = Image.new("RGB", im.size, (6, 7, 12))
    glow = Image.new("L", im.size, 0)
    gd = ImageDraw.Draw(glow)
    for k in range(30, 0, -1):
        t = k / 30
        gd.ellipse((cx - rx * 0.55 * t, cy + ry * 0.15 - ry * 0.45 * t, cx + rx * 0.55 * t, cy + ry * 0.15 + ry * 0.45 * t),
                   fill=int(200 * (1 - t) ** 1.4))
    glow = glow.filter(ImageFilter.GaussianBlur(18))
    inner = Image.composite(Image.new("RGB", im.size, (214, 226, 240)), inner, glow)
    im = Image.composite(inner, im, mask)

    # rubble on the lip
    d = ImageDraw.Draw(im)
    for _ in range(26):
        a = rnd.uniform(0, 2 * math.pi)
        r = rnd.uniform(1.05, 1.35)
        x, y = cx + math.cos(a) * rx * r, cy + math.sin(a) * ry * r
        s = rnd.uniform(0.012, 0.03) * W
        shade = rnd.randint(60, 110)
        d.polygon([(x - s, y), (x - s * 0.3, y - s * 0.7), (x + s * 0.8, y - s * 0.4), (x + s, y + s * 0.2), (x, y + s * 0.4)],
                  fill=(shade, shade + 4, shade + 12))

    # a plume of pale mist rising out of it
    mist = Image.new("L", im.size, 0)
    md = ImageDraw.Draw(mist)
    for i in range(14):
        t = i / 13
        mx = cx + rnd.uniform(-0.25, 0.25) * rx
        my = cy - t * ry * 3.2
        mr = rx * (0.35 + 0.35 * t)
        md.ellipse((mx - mr, my - mr * 0.5, mx + mr, my + mr * 0.5), fill=int(110 * (1 - t)))
    mist = mist.filter(ImageFilter.GaussianBlur(40))
    im = Image.composite(Image.new("RGB", im.size, (226, 232, 244)), im, mist)
    # optional: rough Machine Faction work lamps on tripods (x,y feet as fractions), for the C2 init
    lamps = [tuple(float(v) for v in a.split(",")) for a in sys.argv[7:]]
    if lamps:
        glow = Image.new("L", im.size, 0)
        gd = ImageDraw.Draw(glow)
        d = ImageDraw.Draw(im)
        for lx, ly, lh in lamps:
            x, y, h = lx * W, ly * H, lh * H
            for dx in (-0.35, 0.0, 0.35):
                d.line((x + dx * h, y, x, y - h * 0.8), fill=(28, 28, 32), width=max(3, int(W * 0.003)))
            d.rectangle((x - h * 0.12, y - h, x + h * 0.12, y - h * 0.8), fill=(255, 196, 110))
            gd.ellipse((x - h * 0.7, y - h * 1.5, x + h * 0.7, y - h * 0.3), fill=150)
        glow = glow.filter(ImageFilter.GaussianBlur(W * 0.02))
        im = Image.composite(Image.new("RGB", im.size, (255, 170, 80)), im, glow)
    im.save(out)
    print(out, im.size)


if __name__ == "__main__":
    main()
