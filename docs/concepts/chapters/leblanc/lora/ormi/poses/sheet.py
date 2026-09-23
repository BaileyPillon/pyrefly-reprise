"""Ormi LoRA pose sheet (FFX-2 only, Chapter 6): poses/sheet.jpg.

One row per state, the installed idle first:
  idle whole | installed whole at the SAME pixel scale as idle (how the engine sizes it) |
  face at 1:1 native pixels | costume at 1:1 native pixels
Boxes are in cut-out pixels, from picks.json (idle's in IDLE_BOXES).

    python sheet.py          # reads public/art/characters/ormi/*.png, writes sheet.jpg here
"""
from __future__ import annotations

import json
import pathlib

from PIL import Image, ImageDraw, ImageFont

HERE = pathlib.Path(__file__).resolve().parent
REPO = HERE.parents[6]
ART = REPO / 'public/art/characters/ormi'
IDLE_BOXES = {'face': (190, 20, 450, 300), 'costume': (160, 250, 489, 760)}
SCALE = 0.5          # whole figures: 0.5 of native, idle and pose alike
PAD = 12
LABEL = 26


def flat(im: Image.Image) -> Image.Image:
    im = im.convert('RGBA')
    bg = Image.new('RGBA', im.size, (236, 236, 240, 255))
    bg.alpha_composite(im)
    return bg.convert('RGB')


def font(size: int):
    for name in ('arial.ttf', 'DejaVuSans.ttf'):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def row(state: str, boxes: dict, note: str) -> list[tuple[str, Image.Image]]:
    im = flat(Image.open(ART / f'{state}.png'))
    whole = im.resize((round(im.width * SCALE), round(im.height * SCALE)), Image.LANCZOS)
    return [
        (f'{state}: whole (0.5x, idle scale)', whole),
        (f'{state}: face 1:1', im.crop(boxes['face'])),
        (f'{state}: costume 1:1', im.crop(boxes['costume'])),
    ], note


def main() -> None:
    picks = json.loads((HERE / 'picks.json').read_text(encoding='utf8'))
    rows = [row('idle', IDLE_BOXES, 'installed idle (anchor, unchanged)')]
    for state, p in picks['states'].items():
        crop = json.loads((ART / f'{state}.json').read_text(encoding='utf8'))['cropBox']
        boxes = {k: (b[0] - crop[0], b[1] - crop[1], b[2] - crop[0], b[3] - crop[1]) for k, b in p['boxes'].items()}
        worst = p['judge']['worst'].split(':')[0]
        rows.append(row(state, boxes, f"{state}: {p['tag']}  (self-judged {p['judge']['score']}/10, worst: {worst})"))
    f, fs = font(20), font(16)
    widths = [max(t[i][1].width for t, _ in rows) for i in range(3)]
    heights = [max(im.height for _, im in t) for t, _ in rows]
    W = sum(widths) + PAD * 4
    H = sum(h + LABEL * 2 + PAD for h in heights) + PAD
    sheet = Image.new('RGB', (W, H), (255, 255, 255))
    d = ImageDraw.Draw(sheet)
    y = PAD
    for (tiles, note), h in zip(rows, heights):
        d.text((PAD, y), note, fill=(0, 0, 0), font=f)
        x = PAD
        for (label, im), w in zip(tiles, widths):
            d.text((x, y + LABEL), label, fill=(90, 90, 90), font=fs)
            sheet.paste(im, (x, y + LABEL * 2))
            x += w + PAD
        y += h + LABEL * 2 + PAD
    sheet.save(HERE / 'sheet.jpg', quality=86)
    print('sheet', sheet.size)


if __name__ == '__main__':
    main()
