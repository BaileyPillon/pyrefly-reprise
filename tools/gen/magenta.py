"""Composite cutouts onto magenta so retained background shows up.

The §2.3 defect (docs/handoff/art3-bosses-a.md): the checkpoint paints the
style block's "white background" as an actual opaque *shape*, rembg mattes it
as subject, and the sprite looks perfect in every viewer that shows it on
white. `qc.py` calls it ok. It only appears once the sprite is composited over
a battle backdrop -- as a white slab.

Magenta (255, 0, 255) is the traditional key colour for this because nothing in
this cast is magenta, so every pixel that is not the subject is unmistakable.
This has been the deciding check for two fix rounds; it is a tool rather than
an ad-hoc snippet so the next round runs the same check.

    python_embeded\\python.exe -s tools/gen/magenta.py \\
        public/art/characters/yunalesca-2/idle.png --out check.png

Several inputs are laid out in a row, scaled to a shared height, each labelled
with its filename and its opaque-pixel percentage:

    ... tools/gen/magenta.py "public/art/characters/mortiorchis/*.png" \\
        --out docs/screenshots/art/_check.png --height 420

Reads nothing but the PNGs and writes only the output image -- it never
modifies a sprite or a sidecar.
"""
import argparse
import glob
import os
import sys

from PIL import Image, ImageDraw, ImageFont

KEY = (255, 0, 255)
BG = (18, 20, 28)
TEXT = (240, 240, 245)
PAD = 12


def load_font(size):
    for path in (r"C:\Windows\Fonts\segoeui.ttf", r"C:\Windows\Fonts\arial.ttf"):
        try:
            return ImageFont.truetype(path, size)
        except Exception:
            continue
    return ImageFont.load_default()


def opaque_pct(img):
    a = img.getchannel("A")
    n = img.width * img.height
    opaque = sum(v for c, v in enumerate(a.histogram()) if c > 200)
    return round(100.0 * opaque / n, 1)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("inputs", nargs="+", help="PNG paths or globs")
    ap.add_argument("--out", required=True)
    ap.add_argument("--height", type=int, default=460)
    args = ap.parse_args()

    files = []
    for pattern in args.inputs:
        hits = sorted(glob.glob(pattern))
        files.extend(hits if hits else ([pattern] if os.path.exists(pattern) else []))
    files = [f for f in files if not f.endswith(".raw.png")]
    if not files:
        raise SystemExit("[magenta] no input files matched")

    font = load_font(15)
    cells = []
    for path in files:
        img = Image.open(path).convert("RGBA")
        pct = opaque_pct(img)
        scale = args.height / img.height
        w = max(1, int(img.width * scale))
        small = img.resize((w, args.height), Image.LANCZOS)
        plate = Image.new("RGB", small.size, KEY)
        plate.paste(small, mask=small.getchannel("A"))
        cells.append((plate, f"{os.path.basename(path)}  op{pct}%"))

    total_w = PAD + sum(c[0].width + PAD for c in cells)
    sheet = Image.new("RGB", (total_w, args.height + 34 + PAD), BG)
    d = ImageDraw.Draw(sheet)
    x = PAD
    for plate, label in cells:
        sheet.paste(plate, (x, PAD))
        d.text((x, PAD + args.height + 6), label, font=font, fill=TEXT)
        x += plate.width + PAD

    os.makedirs(os.path.dirname(os.path.abspath(args.out)) or ".", exist_ok=True)
    sheet.save(args.out, "PNG", optimize=True)
    print(f'{{"ok": true, "out": "{args.out}", "count": {len(cells)}}}')
    return 0


if __name__ == "__main__":
    sys.exit(main())
