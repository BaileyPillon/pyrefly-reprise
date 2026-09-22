"""PIL helpers for tools/gen/inpaint.mjs: masks, tight crops, contact sheets.

Run with ComfyUI's embedded python (the only interpreter in this project with
PIL): ``D:\\Tools\\ComfyUI\\python_embeded\\python.exe -s``.

Three subcommands:

``mask``  a feathered box mask (grayscale PNG, white = inpaint, black = keep)
          at the given canvas size, for ``VAEEncodeForInpaint``'s ``mask``
          input via ComfyUI's ``LoadImageMask`` node.
``crop``  a tight, unscaled 1:1 crop of a box (with an optional pad margin)
          out of one image — used both to pull the final patch out of a
          full-frame inpainted render and to pull the matching source region
          for comparison.
``sheet`` a contact sheet: the source crop first, then each candidate crop,
          all at native resolution (optionally zoomed) so identity is judged
          at 1:1 pixels, never off a thumbnail (docs/ART-PIPELINE.md §6).
"""

from __future__ import annotations

import argparse
import json
import os
import sys

from PIL import Image, ImageDraw, ImageFilter

CHECKER = (34, 34, 38)


def cmd_mask(args) -> None:
    w, h = args.size
    x, y, bw, bh = args.box
    base = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(base)
    d.rectangle([x, y, x + bw, y + bh], fill=255)
    if args.feather > 0:
        base = base.filter(ImageFilter.GaussianBlur(radius=args.feather))
    os.makedirs(os.path.dirname(os.path.abspath(args.out)) or ".", exist_ok=True)
    base.save(args.out)
    print(f"{args.out} {w}x{h} box={args.box} feather={args.feather}")


def _load_rgb(path: str) -> Image.Image:
    im = Image.open(path).convert("RGBA")
    plate = Image.new("RGBA", im.size, (250, 250, 250, 255))
    plate.alpha_composite(im)
    return plate.convert("RGB")


def cmd_dims(args) -> None:
    im = Image.open(args.image)
    print(json.dumps({"width": im.width, "height": im.height}))


def cmd_crop(args) -> None:
    im = _load_rgb(args.image)
    x, y, w, h = args.box
    pad = args.pad
    x0, y0 = max(0, x - pad), max(0, y - pad)
    x1, y1 = min(im.width, x + w + pad), min(im.height, y + h + pad)
    out = im.crop((x0, y0, x1, y1))
    if args.zoom != 1:
        out = out.resize((out.width * args.zoom, out.height * args.zoom), Image.NEAREST)
    os.makedirs(os.path.dirname(os.path.abspath(args.out)) or ".", exist_ok=True)
    out.save(args.out)
    print(f"{args.out} {out.size[0]}x{out.size[1]} box=({x0},{y0},{x1},{y1})")


def _label(draw, xy, text):
    x, y = xy
    draw.rectangle([x, y, x + 7 * len(text) + 8, y + 16], fill=(0, 0, 0))
    draw.text((x + 4, y + 3), text, fill=(255, 220, 120))


def cmd_sheet(args) -> None:
    names = args.names or [os.path.basename(p) for p in args.images]
    ims = [Image.open(p).convert("RGB") for p in args.images]
    cell_w = max(im.width for im in ims)
    cell_h = max(im.height for im in ims)
    n = len(ims)
    cols = args.cols or n
    rows = (n + cols - 1) // cols
    sheet = Image.new("RGB", (cell_w * cols, (cell_h + 20) * rows), CHECKER)
    d = ImageDraw.Draw(sheet)
    for i, (im, name) in enumerate(zip(ims, names)):
        r, c = divmod(i, cols)
        x, y = c * cell_w, r * (cell_h + 20)
        sheet.paste(im, (x, y + 20))
        _label(d, (x + 2, y + 2), name)
    os.makedirs(os.path.dirname(os.path.abspath(args.out)) or ".", exist_ok=True)
    sheet.save(args.out)
    print(f"{args.out} {sheet.size[0]}x{sheet.size[1]} n={n}")


def main(argv=None) -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    sub = ap.add_subparsers(dest="cmd", required=True)

    m = sub.add_parser("mask")
    m.add_argument("--size", nargs=2, type=int, required=True, metavar=("W", "H"))
    m.add_argument("--box", nargs=4, type=int, required=True, metavar=("X", "Y", "W", "H"))
    m.add_argument("--feather", type=int, default=8)
    m.add_argument("--out", required=True)
    m.set_defaults(fn=cmd_mask)

    dm = sub.add_parser("dims")
    dm.add_argument("--image", required=True)
    dm.set_defaults(fn=cmd_dims)

    c = sub.add_parser("crop")
    c.add_argument("--image", required=True)
    c.add_argument("--box", nargs=4, type=int, required=True, metavar=("X", "Y", "W", "H"))
    c.add_argument("--pad", type=int, default=0)
    c.add_argument("--zoom", type=int, default=1)
    c.add_argument("--out", required=True)
    c.set_defaults(fn=cmd_crop)

    s = sub.add_parser("sheet")
    s.add_argument("--images", nargs="+", required=True)
    s.add_argument("--names", nargs="+", default=None)
    s.add_argument("--cols", type=int, default=0)
    s.add_argument("--out", required=True)
    s.set_defaults(fn=cmd_sheet)

    args = ap.parse_args(argv)
    args.fn(args)


if __name__ == "__main__":
    main(sys.argv[1:])
