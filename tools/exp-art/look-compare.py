"""The approved target, the room as it was and the room as it is, side by side at 1600x900 (the experimental Leblanc room's look, branch `exp-leblanc`; FFX-2 only).

Run with any python that has PIL:

    python tools/exp-art/look-compare.py --target B.png --before BEFORE.png --after AFTER.png --out OUT.jpg [--labels "target;before;after"] [--height 900]

Each picture is shown whole at the same height (default 900: a 1600x900 frame stays 1600x900, so the three panels are 4800 pixels wide), the target first, each under a
one-line label; nothing is cropped or recoloured. With two pictures (`--target` left out) it is a before and after, which is what the HUD version is.
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
    ap.add_argument("--target")
    ap.add_argument("--before", required=True)
    ap.add_argument("--after", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--labels", default="TARGET: Moonlit Blue Hall (approved mockup B);BEFORE: the committed look (a3b31533);AFTER: the room's new grade")
    ap.add_argument("--height", type=int, default=900)
    ap.add_argument("--quality", type=int, default=88)
    args = ap.parse_args()

    paths = [p for p in (args.target, args.before, args.after) if p]
    labels = args.labels.split(";")
    if len(labels) > len(paths):  # the default has three labels; without a target the first one (the target's) is dropped
        labels = labels[len(labels) - len(paths) :]
    if len(labels) != len(paths):
        raise SystemExit(f"{len(paths)} pictures but {len(labels)} labels (separate them with ';')")
    tiles = []
    for path in paths:
        im = Image.open(path).convert("RGB")
        w = round(im.width * args.height / im.height)
        tiles.append(im if im.height == args.height else im.resize((w, args.height), Image.LANCZOS))
    gap, bar = 10, 44
    width = sum(t.width for t in tiles) + gap * (len(tiles) - 1)
    sheet = Image.new("RGB", (width, args.height + bar), (16, 14, 24))
    d = ImageDraw.Draw(sheet)
    f = font(24)
    x = 0
    for tile, label in zip(tiles, labels):
        sheet.paste(tile, (x, bar))
        d.text((x + 14, 9), label, fill=(236, 228, 255), font=f)
        x += tile.width + gap
    sheet.save(args.out, quality=args.quality)
    print(args.out, sheet.size)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
