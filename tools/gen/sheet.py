"""Build the art-direction contact sheet (and single-image thumbnails).

Runs in ComfyUI's embedded python, which has Pillow:

    python_embeded\\python.exe -s tools/gen/sheet.py build --spec sheet.json
    python_embeded\\python.exe -s tools/gen/sheet.py thumb --in a.png --out b.png --width 1600

The sheet spec is JSON:

    {
      "out": "docs/screenshots/04-art-poc-sheet.png",
      "title": "...",
      "subtitle": "...",
      "rows": [
        {"label": "Tidus", "kind": "character", "cellHeight": 420,
         "items": [{"path": "public/art/characters/tidus/idle.png",
                     "caption": "idle", "baselineY": 1180}]}
      ]
    }

Character cells are bottom-aligned on a shared ground line using each sprite's
`baselineY` from its sidecar, so the sheet doubles as a check that the cast
actually stands on the same floor.
"""

import argparse
import json
import os
import sys

from PIL import Image, ImageDraw, ImageFont

BG = (18, 20, 28)
PANEL = (28, 31, 42)
GRID_A = (44, 48, 62)
GRID_B = (34, 37, 49)
TEXT = (232, 234, 240)
MUTED = (150, 156, 172)
ACCENT = (126, 196, 255)
GROUND = (86, 96, 122)

PAD = 28
GUTTER = 18


def load_font(size, bold=False):
    candidates = [
        r"C:\Windows\Fonts\segoeuib.ttf" if bold else r"C:\Windows\Fonts\segoeui.ttf",
        r"C:\Windows\Fonts\arialbd.ttf" if bold else r"C:\Windows\Fonts\arial.ttf",
        "DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf",
    ]
    for path in candidates:
        try:
            return ImageFont.truetype(path, size)
        except Exception:
            continue
    return ImageFont.load_default()


def checker(w, h, cell=12):
    """Transparency checkerboard so cutouts read as cutouts."""
    img = Image.new("RGB", (w, h), GRID_A)
    d = ImageDraw.Draw(img)
    for y in range(0, h, cell):
        for x in range(0, w, cell):
            if ((x // cell) + (y // cell)) % 2:
                d.rectangle([x, y, x + cell - 1, y + cell - 1], fill=GRID_B)
    return img


def fit(img, max_w, max_h):
    scale = min(max_w / img.width, max_h / img.height)
    if scale >= 1:
        return img
    return img.resize((max(1, int(img.width * scale)), max(1, int(img.height * scale))), Image.LANCZOS)


def resolve(root, path):
    return path if os.path.isabs(path) else os.path.join(root, path)


def sidecar_baseline(path):
    side = os.path.splitext(path)[0] + ".json"
    if os.path.exists(side):
        try:
            with open(side, "r", encoding="utf-8") as fh:
                return json.load(fh).get("baselineY")
        except Exception:
            return None
    return None


def build(spec, root):
    title_font = load_font(34, bold=True)
    sub_font = load_font(17)
    row_font = load_font(20, bold=True)
    cap_font = load_font(16)

    rows = spec["rows"]

    # ---- measure -------------------------------------------------------
    laid_rows = []
    max_width = 0
    for row in rows:
        cell_h = int(row.get("cellHeight", 380))
        cell_w = int(row.get("cellWidth", 0)) or None
        cells = []
        for item in row["items"]:
            path = resolve(root, item["path"])
            if not os.path.exists(path):
                print(f"[sheet] missing, skipping: {path}", file=sys.stderr)
                continue
            img = Image.open(path).convert("RGBA")
            target_w = cell_w or int(cell_h * img.width / img.height)
            if row.get("kind") == "character":
                target_w = int(row.get("cellWidth", 300))
            scaled = fit(img, target_w, cell_h)
            baseline = item.get("baselineY", sidecar_baseline(path))
            cells.append(
                {
                    "img": scaled,
                    "caption": item.get("caption", ""),
                    "note": item.get("note", ""),
                    "boxW": target_w,
                    "baseline": (baseline / img.height * scaled.height) if baseline else None,
                }
            )
        if not cells:
            continue
        width = PAD * 2 + sum(c["boxW"] for c in cells) + GUTTER * (len(cells) - 1)
        max_width = max(max_width, width)
        laid_rows.append({"row": row, "cells": cells, "cellH": cell_h})

    if not laid_rows:
        raise SystemExit("[sheet] no rows had any existing images")

    header_h = PAD + 44 + 26 + 14
    # 34 for the row label, then the cells, then two caption lines.
    row_heights = [34 + r["cellH"] + 50 for r in laid_rows]
    total_h = header_h + sum(row_heights) + PAD

    sheet = Image.new("RGB", (max_width, total_h), BG)
    d = ImageDraw.Draw(sheet)

    d.text((PAD, PAD), spec.get("title", "Contact sheet"), font=title_font, fill=TEXT)
    if spec.get("subtitle"):
        d.text((PAD, PAD + 44), spec["subtitle"], font=sub_font, fill=MUTED)

    y = header_h
    for laid in laid_rows:
        row, cells, cell_h = laid["row"], laid["cells"], laid["cellH"]
        d.text((PAD, y), row.get("label", ""), font=row_font, fill=ACCENT)
        y += 34

        x = PAD
        # Shared ground line for character rows.
        ground_y = y + cell_h - 6
        is_char = row.get("kind") == "character"
        if is_char:
            d.line([(PAD, ground_y), (max_width - PAD, ground_y)], fill=GROUND, width=1)

        for cell in cells:
            img = cell["img"]
            box_w = cell["boxW"]
            if is_char:
                sheet.paste(checker(box_w, cell_h), (x, y))
                d.rectangle([x, y, x + box_w - 1, y + cell_h - 1], outline=PANEL)
                # Plant the feet on the shared ground line.
                offset_y = (
                    int(ground_y - y - cell["baseline"]) if cell["baseline"] else cell_h - img.height
                )
                offset_y = max(0, min(offset_y, cell_h - img.height))
                sheet.paste(img, (x + (box_w - img.width) // 2, y + offset_y), img)
            else:
                sheet.paste(img.convert("RGB"), (x + (box_w - img.width) // 2, y + (cell_h - img.height) // 2))

            if cell["caption"]:
                d.text((x + 2, y + cell_h + 6), cell["caption"], font=cap_font, fill=TEXT)
            if cell["note"]:
                # Second line, under the caption — not on top of it.
                d.text((x + 2, y + cell_h + 6 + (19 if cell["caption"] else 0)),
                       cell["note"], font=cap_font, fill=MUTED)
            x += box_w + GUTTER

        y += cell_h + 50

    out = resolve(root, spec["out"])
    os.makedirs(os.path.dirname(out) or ".", exist_ok=True)
    sheet.save(out, "PNG", optimize=True)
    print(json.dumps({"out": out, "width": sheet.width, "height": sheet.height}))


def thumb(src, dst, width):
    img = Image.open(src)
    if img.mode == "RGBA":
        bg = Image.new("RGB", img.size, (12, 13, 18))
        bg.paste(img, mask=img.getchannel("A"))
        img = bg
    else:
        img = img.convert("RGB")
    if img.width > width:
        img = img.resize((width, max(1, round(img.height * width / img.width))), Image.LANCZOS)
    os.makedirs(os.path.dirname(os.path.abspath(dst)) or ".", exist_ok=True)
    img.save(dst, "PNG", optimize=True)
    print(json.dumps({"out": dst, "width": img.width, "height": img.height}))


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)

    b = sub.add_parser("build")
    b.add_argument("--spec", required=True)
    b.add_argument("--root", default=os.getcwd())

    t = sub.add_parser("thumb")
    t.add_argument("--in", dest="src", required=True)
    t.add_argument("--out", dest="dst", required=True)
    t.add_argument("--width", type=int, default=1600)

    args = ap.parse_args()
    if args.cmd == "build":
        with open(args.spec, "r", encoding="utf-8") as fh:
            build(json.load(fh), args.root)
    else:
        thumb(args.src, args.dst, args.width)


if __name__ == "__main__":
    main()
