"""Recolour a tan fan guard to idle's black in a frame (FFX-2 only, Chapter 6). No diffusion.

The ko frame painted the closed fan's guard and its end in pale tan wood (lora/leblanc/judge.md, ko:
fan 6); idle's fan is black. Three masked repaints (repaint.mjs `fan`, seeds 72011..72013) did not
turn it black, so this recolours it: inside a polygon around the fan that stops short of the hand,
every tan pixel (hue 5..50 deg, saturation 0.04..0.7, value >= 0.3) becomes charcoal with its
shading kept (value x --k), so the ribs' blue highlights and the black line art stay as painted.

    python guard.py <src-tag> <out-name> x,y x,y x,y ... [--k 0.2]   (polygon in raw pixels)
      reads D:/Tools/pyrefly-lora/leblanc/poses/<src-tag>.raw.png, writes <src-tag>.<out-name>.raw.png
"""
import colorsys
import pathlib
import sys

from PIL import Image, ImageDraw

D = pathlib.Path('D:/Tools/pyrefly-lora/leblanc/poses')


def main():
    a = sys.argv[1:]
    k = 0.2
    if '--k' in a:
        i = a.index('--k'); k = float(a[i + 1]); del a[i:i + 2]
    src, name, pts = a[0], a[1], [tuple(map(int, p.split(','))) for p in a[2:]]
    im = Image.open(D / f'{src}.raw.png').convert('RGB')
    poly = Image.new('L', im.size, 0)
    ImageDraw.Draw(poly).polygon(pts, fill=255)
    pm, px = poly.load(), im.load()
    n = 0
    x0, y0 = min(p[0] for p in pts), min(p[1] for p in pts)
    x1, y1 = max(p[0] for p in pts), max(p[1] for p in pts)
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            if not pm[x, y]:
                continue
            h, s, v = colorsys.rgb_to_hsv(*(c / 255 for c in px[x, y]))
            if 5 / 360 <= h <= 50 / 360 and 0.04 <= s <= 0.7 and v >= 0.3:
                px[x, y] = tuple(round(c * 255) for c in colorsys.hsv_to_rgb(250 / 360, 0.12, v * k))
                n += 1
    im.save(D / f'{src}.{name}.raw.png')
    print(f'{src}.{name}', 'pixels recoloured:', n)


if __name__ == '__main__':
    main()
