"""The approved target beside the build, for the experimental Leblanc chapter (branch `exp-leblanc`; FFX-2 only).

Run with ComfyUI's embedded python (PIL; nothing is downloaded):

    D:/Tools/ComfyUI/python_embeded/python.exe -s tools/exp-art/compare.py --target TARGET.png --build FRAME.jpg --out OUT.jpg [--height 720]

The two pictures stand side by side at one height (the target on the left, the build on the right), each under a one-line label, so a review reads the
distance from the approved target first (`docs/handoff/exp-leblanc.md` section 2). Both are shown whole: neither is cropped or recoloured.
"""

from __future__ import annotations

import argparse

from PIL import Image, ImageDraw, ImageFont


def font(size: int) -> ImageFont.ImageFont:
    for name in ("C:/Windows/Fonts/segoeui.ttf", "C:/Windows/Fonts/arial.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--target", required=True)
    ap.add_argument("--build", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--height", type=int, default=720)
    ap.add_argument("--left-label", default="TARGET: Moonlit Blue Hall (approved mockup B)")
    ap.add_argument("--right-label", default="BUILD: Experimental Leblanc, Act III first menu")
    args = ap.parse_args()

    tiles = []
    for path in (args.target, args.build):
        im = Image.open(path).convert("RGB")
        w = round(im.width * args.height / im.height)
        tiles.append(im.resize((w, args.height), Image.LANCZOS))
    gap, bar = 8, 44
    sheet = Image.new("RGB", (tiles[0].width + gap + tiles[1].width, args.height + bar), (16, 14, 24))
    d = ImageDraw.Draw(sheet)
    f = font(22)
    x = 0
    for tile, label in zip(tiles, (args.left_label, args.right_label)):
        sheet.paste(tile, (x, bar))
        d.text((x + 14, 9), label, fill=(236, 228, 255), font=f)
        x += tile.width + gap
    sheet.save(args.out, quality=92)
    print(args.out, sheet.size)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
