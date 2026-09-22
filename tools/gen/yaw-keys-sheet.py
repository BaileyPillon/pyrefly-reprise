"""Contact sheets, measuring grids and plate-alignment for the yaw keys.

Companion to ``tools/gen/yaw-keys.mjs``. Run with ComfyUI's embedded python
(``D:\\Tools\\ComfyUI\\python_embeded\\python.exe -s``), which is the only
interpreter in this project that has PIL.

Three subcommands:

``sheet``  one contact sheet per key: the approved plate's head at the left,
           then the candidates, at most 1600 px wide, with 1:1 face crops in a
           second row so identity is judged at full resolution and never off a
           thumbnail (docs/ART-PIPELINE.md §6).
``grid``   a 1:1 crop with a labelled pixel grid, for reading a candidate's
           eye line and chin off the pixels by eye.
``place``  the framing match. A yaw key has to sit on the canvas exactly where
           the plate's head sits, or the rig's morph between them translates
           the whole head. Scale is set by the **eye-line-to-chin** distance
           and position by the **chin point**, because both survive a yaw turn
           — inter-pupil distance does not (it shortens as cos(yaw)) and the
           plate's hair top is cut off by the frame edge, so neither can anchor
           this.

The approved plate is read-only everywhere in here; nothing writes to
``public/art/``.
"""

from __future__ import annotations

import argparse
import json
import os
import sys

from PIL import Image, ImageDraw

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PLATE = os.path.join(REPO_ROOT, "public", "art", "portraits", "yuna-x2.png")

# Measured off the plate by eye at 1:1 with a 64 px grid (see keys.md).
# Pupils come from src/ui/common/face-crops.json; the chin was read at 2x.
PLATE_ANCHORS = {
    "canvas": [832, 1216],
    "pupils": [[338, 422], [609, 406]],
    "eye_y": 414,
    "chin": [470, 730],
    "eye_to_chin": 316,
}

SHEET_MAX_W = 1600
CHECKER = (34, 34, 38)


def load_flat(path: str, bg=(250, 250, 250)) -> Image.Image:
    im = Image.open(path).convert("RGBA")
    plate = Image.new("RGBA", im.size, bg + (255,))
    plate.alpha_composite(im)
    return plate.convert("RGB")


def label(draw: ImageDraw.ImageDraw, xy, text: str) -> None:
    x, y = xy
    draw.rectangle([x, y, x + 8 * len(text) + 8, y + 16], fill=(0, 0, 0))
    draw.text((x + 4, y + 3), text, fill=(255, 220, 120))


def face_crop(path: str, cell_w: int, cell_h: int, anchor) -> Image.Image:
    """A 1:1 window on the face — no scaling, so detail is judged honestly."""
    im = load_flat(path)
    cx, cy = anchor
    left = max(0, min(im.width - cell_w, int(cx - cell_w / 2)))
    top = max(0, min(im.height - cell_h, int(cy - cell_h * 0.45)))
    out = Image.new("RGB", (cell_w, cell_h), CHECKER)
    out.paste(im.crop((left, top, left + cell_w, top + cell_h)), (0, 0))
    return out


def cmd_sheet(args) -> None:
    entries = [("PLATE (approved)", PLATE, tuple(PLATE_ANCHORS["chin"]))]
    for p in args.cand:
        entries.append((os.path.basename(p), p, None))

    n = len(entries)
    cell_w = min(320, SHEET_MAX_W // n)
    thumbs = []
    for name, path, _ in entries:
        im = load_flat(path)
        h = max(1, int(im.height * cell_w / im.width))
        thumbs.append(im.resize((cell_w, h), Image.LANCZOS))
    row1_h = max(t.height for t in thumbs)
    row2_h = args.crop_h

    sheet = Image.new("RGB", (cell_w * n, row1_h + row2_h + 24), CHECKER)
    d = ImageDraw.Draw(sheet)
    for i, ((name, path, anchor), thumb) in enumerate(zip(entries, thumbs)):
        x = i * cell_w
        sheet.paste(thumb, (x, 0))
        # A candidate's face sits wherever the sampler put it; centring the 1:1
        # window on the image centre is close enough to judge from, and the
        # picks get their own `grid` pass anyway.
        im = Image.open(path)
        a = anchor if anchor else (im.width // 2, int(im.height * 0.36))
        sheet.paste(face_crop(path, cell_w, row2_h, a), (x, row1_h + 24))
        label(d, (x + 4, 4), name)
        label(d, (x + 4, row1_h + 28), "1:1")
    sheet.save(args.out)
    print(f"{args.out} {sheet.size[0]}x{sheet.size[1]} cells={n} cell_w={cell_w}")


def cmd_grid(args) -> None:
    im = load_flat(args.image)
    x0, y0, x1, y1 = args.box
    crop = im.crop((x0, y0, x1, y1))
    if args.zoom != 1:
        crop = crop.resize((crop.width * args.zoom, crop.height * args.zoom), Image.LANCZOS)
    d = ImageDraw.Draw(crop)
    step = args.step * args.zoom
    for x in range(0, crop.width, step):
        d.line([(x, 0), (x, crop.height)], fill=(255, 0, 0))
        d.text((x + 2, 2), str(x0 + x // args.zoom), fill=(255, 0, 0))
    for y in range(0, crop.height, step):
        d.line([(0, y), (crop.width, y)], fill=(0, 120, 255))
        d.text((2, y + 2), str(y0 + y // args.zoom), fill=(0, 90, 255))
    crop.save(args.out)
    print(f"{args.out} {crop.size[0]}x{crop.size[1]} box={args.box} zoom={args.zoom}")


def cmd_place(args) -> None:
    """Scale and translate one candidate onto the plate's own head framing."""
    im = Image.open(args.image).convert("RGBA")
    eye_y, (chin_x, chin_y) = args.eye_y, args.chin
    span = chin_y - eye_y
    if span <= 0:
        raise SystemExit("--chin y must be below --eye-y")
    scale = PLATE_ANCHORS["eye_to_chin"] / span
    w, h = int(round(im.width * scale)), int(round(im.height * scale))
    scaled = im.resize((w, h), Image.LANCZOS)

    cw, ch = PLATE_ANCHORS["canvas"]
    px, py = PLATE_ANCHORS["chin"]
    dx = int(round(px - chin_x * scale))
    dy = int(round(py - chin_y * scale))
    out = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    out.alpha_composite(scaled, (max(0, dx), max(0, dy))) if (dx >= 0 and dy >= 0) else out.alpha_composite(
        scaled.crop((max(0, -dx), max(0, -dy), scaled.width, scaled.height)),
        (max(0, dx), max(0, dy)),
    )
    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    if args.out.lower().endswith(".webp"):
        out.save(args.out, "WEBP", lossless=args.lossless, quality=args.quality, method=6)
    else:
        out.save(args.out)
    meta = {
        "source": os.path.relpath(args.image, REPO_ROOT).replace("\\", "/"),
        "measured": {"eyeY": eye_y, "chin": [chin_x, chin_y], "eyeToChin": span},
        "scale": round(scale, 5),
        "offset": [dx, dy],
        "canvas": PLATE_ANCHORS["canvas"],
        "plateAnchors": PLATE_ANCHORS,
    }
    with open(os.path.splitext(args.out)[0] + ".json", "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)
        f.write("\n")
    print(f"{args.out} scale={scale:.4f} offset=({dx},{dy}) bytes={os.path.getsize(args.out)}")


def main(argv=None) -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    sub = ap.add_subparsers(dest="cmd", required=True)

    s = sub.add_parser("sheet")
    s.add_argument("--cand", nargs="+", required=True)
    s.add_argument("--out", required=True)
    s.add_argument("--crop-h", type=int, default=380)
    s.set_defaults(fn=cmd_sheet)

    g = sub.add_parser("grid")
    g.add_argument("--image", required=True)
    g.add_argument("--box", nargs=4, type=int, required=True)
    g.add_argument("--out", required=True)
    g.add_argument("--step", type=int, default=32)
    g.add_argument("--zoom", type=int, default=1)
    g.set_defaults(fn=cmd_grid)

    p = sub.add_parser("place")
    p.add_argument("--image", required=True)
    p.add_argument("--eye-y", dest="eye_y", type=int, required=True)
    p.add_argument("--chin", nargs=2, type=int, required=True)
    p.add_argument("--out", required=True)
    p.add_argument("--lossless", action="store_true")
    p.add_argument("--quality", type=int, default=92)
    p.set_defaults(fn=cmd_place)

    args = ap.parse_args(argv)
    args.fn(args)


if __name__ == "__main__":
    main(sys.argv[1:])
