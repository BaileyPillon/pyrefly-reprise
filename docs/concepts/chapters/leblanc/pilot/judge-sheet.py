#!/usr/bin/env python3
"""Build judge-sheet.png for the Leblanc identity-consistency pilot's
independent judge pass (docs/concepts/chapters/leblanc/pilot/judge.md).

Not part of the art pipeline (tools/gen/**) -- a one-off comparison sheet
for this pilot only. Run: python judge-sheet.py (from this directory, or
anywhere -- paths below are relative to the repo root).
"""
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", ".."))
PILOT = os.path.join(ROOT, "docs", "concepts", "chapters", "leblanc", "pilot")
RENDERS = os.path.join(PILOT, "renders")
IDLE = os.path.join(ROOT, "public", "art", "characters", "leblanc", "idle.png")
OUT = os.path.join(PILOT, "judge-sheet.png")

FONT_PATH = "C:/Windows/Fonts/arial.ttf"
FONT_BOLD = "C:/Windows/Fonts/arialbd.ttf"

CELL_W, CELL_H = 300, 460
FACE_CELL = 220
PAD = 16
LABEL_H = 34

BEST = [
    ("idle (anchor)", IDLE),
    ("A attack — a035-attack.1", os.path.join(RENDERS, "a035-attack.1.png")),
    ("A cast — a035-cast.1", os.path.join(RENDERS, "a035-cast.1.png")),
    ("A hurt — a035-hurt.2", os.path.join(RENDERS, "a035-hurt.2.png")),
    ("B attack — b055-attack.1", os.path.join(RENDERS, "b055-attack.1.png")),
    ("B cast — b055-cast.1", os.path.join(RENDERS, "b055-cast.1.png")),
    ("B hurt — b055-hurt.1", os.path.join(RENDERS, "b055-hurt.1.png")),
    ("C sheet — c-sheet.1", os.path.join(RENDERS, "c-sheet.1.png")),
]


def fit(im, w, h):
    canvas = Image.new("RGBA", (w, h), (255, 255, 255, 255))
    ratio = min(w / im.width, h / im.height)
    nw, nh = max(1, int(im.width * ratio)), max(1, int(im.height * ratio))
    resized = im.convert("RGBA").resize((nw, nh), Image.LANCZOS)
    canvas.paste(resized, ((w - nw) // 2, (h - nh) // 2), resized)
    return canvas


def face_crop(im, is_sheet=False):
    """Top-of-figure crop for a face-region comparison. For the method-C
    wide sheet (multiple figures side by side) this necessarily shows more
    than one face -- noted in judge.md, same caveat as the painter's sheet."""
    im = im.convert("RGBA")
    w, h = im.size
    if is_sheet:
        # wide multi-figure sheet: take the top band across most of the width
        box = (int(w * 0.02), 0, int(w * 0.98), int(h * 0.35))
    else:
        # tall single-figure cutout: top 20% of height, centered width band
        box = (int(w * 0.05), 0, int(w * 0.95), int(h * 0.20))
    crop = im.crop(box)
    canvas = Image.new("RGBA", (FACE_CELL, FACE_CELL), (255, 255, 255, 255))
    ratio = min(FACE_CELL / crop.width, FACE_CELL / crop.height)
    nw, nh = max(1, int(crop.width * ratio)), max(1, int(crop.height * ratio))
    resized = crop.resize((nw, nh), Image.LANCZOS)
    canvas.paste(resized, ((FACE_CELL - nw) // 2, (FACE_CELL - nh) // 2), resized)
    return canvas


def load_font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()


def main():
    cols = 4
    rows_top = 2  # 8 candidates, 4 per row
    title_font = load_font(FONT_BOLD, 30)
    label_font = load_font(FONT_PATH, 18)
    section_font = load_font(FONT_BOLD, 22)

    top_w = cols * CELL_W + (cols + 1) * PAD
    top_h = rows_top * (CELL_H + LABEL_H) + (rows_top + 1) * PAD

    face_row_h = FACE_CELL + LABEL_H + PAD * 2
    n_faces = len(BEST)
    face_w = n_faces * FACE_CELL + (n_faces + 1) * PAD
    total_w = max(top_w, face_w) + PAD * 2
    header_h = 60
    section_h = 34

    total_h = header_h + top_h + section_h + face_row_h + PAD

    sheet = Image.new("RGBA", (total_w, total_h), (255, 255, 255, 255))
    draw = ImageDraw.Draw(sheet)

    draw.text((PAD, 14), "Leblanc identity-consistency pilot — independent judge sheet (2026-09-21)",
               fill=(20, 20, 20), font=title_font)

    y = header_h
    draw.text((PAD, y), "Whole-body — idle anchor + best candidate per method per pose", fill=(20, 20, 20), font=section_font)
    y += section_h

    images = []
    for label, path in BEST:
        im = Image.open(path)
        is_sheet = "c-sheet" in path
        images.append((label, im, is_sheet))

    for i, (label, im, is_sheet) in enumerate(images):
        col = i % cols
        row = i // cols
        x = PAD + col * (CELL_W + PAD)
        yy = y + PAD + row * (CELL_H + LABEL_H + PAD)
        cell = fit(im, CELL_W, CELL_H)
        sheet.paste(cell, (x, yy), cell)
        draw.rectangle([x, yy, x + CELL_W, yy + CELL_H], outline=(150, 150, 150), width=1)
        draw.text((x, yy + CELL_H + 4), label, fill=(20, 20, 20), font=label_font)

    y2 = y + PAD + rows_top * (CELL_H + LABEL_H + PAD) + 10
    draw.text((PAD, y2), "1:1 face crops (top-of-figure band; C is a multi-figure sheet, so its crop shows more than one face)",
               fill=(20, 20, 20), font=section_font)
    y2 += section_h

    for i, (label, im, is_sheet) in enumerate(images):
        x = PAD + i * (FACE_CELL + PAD)
        crop = face_crop(im, is_sheet)
        sheet.paste(crop, (x, y2 + PAD), crop)
        draw.rectangle([x, y2 + PAD, x + FACE_CELL, y2 + PAD + FACE_CELL], outline=(150, 150, 150), width=1)
        short = label.split("—")[0].strip()
        draw.text((x, y2 + PAD + FACE_CELL + 4), short, fill=(20, 20, 20), font=label_font)

    sheet = sheet.convert("RGB")
    sheet.save(OUT)
    print("wrote", OUT, sheet.size)


if __name__ == "__main__":
    main()
