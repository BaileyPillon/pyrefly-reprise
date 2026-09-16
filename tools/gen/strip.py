"""Lay a state's variants side by side on a checker ground so a batch can be
judged in one look instead of one image at a time.

    python_embeded/python.exe -s tools/gen/strip.py --out x.png --height 900 a.png b.png c.png
"""
import argparse, os
from PIL import Image, ImageDraw

BG = (24, 26, 34)
ALT = (38, 41, 52)
TEXT = (235, 237, 243)

def checker(size, step=24):
    im = Image.new("RGB", size, BG)
    d = ImageDraw.Draw(im)
    for y in range(0, size[1], step):
        for x in range(0, size[0], step):
            if (x // step + y // step) % 2:
                d.rectangle([x, y, x + step - 1, y + step - 1], fill=ALT)
    return im

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True)
    ap.add_argument("--height", type=int, default=900)
    ap.add_argument("files", nargs="+")
    a = ap.parse_args()
    H = a.height
    cells = []
    for f in a.files:
        im = Image.open(f).convert("RGBA")
        s = H / im.height
        im = im.resize((max(1, int(im.width * s)), H), Image.LANCZOS)
        cells.append((os.path.basename(f), im))
    pad, lab = 12, 26
    W = sum(c[1].width for c in cells) + pad * (len(cells) + 1)
    out = checker((W, H + lab + pad * 2))
    d = ImageDraw.Draw(out)
    x = pad
    for name, im in cells:
        out.paste(im, (x, lab + pad), im)
        d.text((x + 4, 6), name, fill=TEXT)
        x += im.width + pad
    out.save(a.out)
    print(f"{a.out} {out.width}x{out.height} ({len(cells)} cells)")

main()
