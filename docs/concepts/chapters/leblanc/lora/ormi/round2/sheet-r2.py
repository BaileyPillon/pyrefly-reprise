"""Ormi round-2 sheet (FFX-2 only, Chapter 6): round2/sheet.jpg.

One row per state, the installed idle first:
  whole, at idle's pixel scale times the sidecar `scale` (how the engine sizes it) |
  face 1:1 | costume 1:1 | feet 1:1 | weapon 1:1 (native pixels)
Boxes are in raw-frame pixels in picks-r2.json (the installed cropBox is subtracted).

    python sheet-r2.py        # reads public/art/characters/ormi/*.png + .json, writes sheet.jpg here
"""
from __future__ import annotations

import json
import pathlib

from PIL import Image, ImageDraw, ImageFont

HERE = pathlib.Path(__file__).resolve().parent
REPO = HERE.parents[6]
ART = REPO / 'public/art/characters/ormi'
IDLE_BOXES = {'face': (170, 0, 450, 300), 'costume': (60, 250, 489, 760), 'feet': (0, 900, 489, 1189), 'weapon': (0, 250, 200, 900)}
SCALE = 0.5
PAD, LABEL = 12, 24
COLS = ['face', 'costume', 'feet', 'weapon']


def flat(im):
    im = im.convert('RGBA')
    bg = Image.new('RGBA', im.size, (236, 236, 240, 255))
    bg.alpha_composite(im)
    return bg.convert('RGB')


def font(size):
    for n in ('arial.ttf', 'DejaVuSans.ttf'):
        try:
            return ImageFont.truetype(n, size)
        except OSError:
            pass
    return ImageFont.load_default()


def clamp(b, im):
    return (max(0, b[0]), max(0, b[1]), min(im.width, b[2]), min(im.height, b[3]))


def row(state, boxes, note, scale=1.0):
    im = flat(Image.open(ART / f'{state}.png'))
    s = SCALE * scale
    tiles = [(f'{state}: whole ({SCALE}x idle scale' + (f' x sidecar scale {scale}' if scale != 1 else '') + ')',
              im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS))]
    for k in COLS:
        if k in boxes:
            tiles.append((f'{state}: {k} 1:1', im.crop(clamp(boxes[k], im))))
        else:
            tiles.append((f'{state}: {k} (none: erased, round2.md)', Image.new('RGB', (160, 60), (255, 255, 255))))
    return tiles, note


def main():
    picks = json.loads((HERE / 'picks-r2.json').read_text(encoding='utf8'))
    rows = [row('idle', IDLE_BOXES, 'installed idle (the anchor, unchanged)')]
    for state, p in picks['states'].items():
        side = json.loads((ART / f'{state}.json').read_text(encoding='utf8'))
        cb = side['cropBox']
        boxes = {k: (b[0] - cb[0], b[1] - cb[1], b[2] - cb[0], b[3] - cb[1]) for k, b in p['boxes'].items()}
        j = p.get('judge') or {}
        score = f"self-judged {j['score']}/10, worst: {j['worst'].split(':')[0]}" if j else 'not yet judged'
        flag = '  BEST AVAILABLE, BELOW BAR' if j and j['score'] < 7 else ''
        rows.append(row(state, boxes, f"{state}: {p['tag']} (LoRA r2 step {p['step']}, seed {p['seed']}, scale {side.get('scale', 1)})  ({score}){flag}", side.get('scale', 1)))
    f, fs = font(20), font(15)
    ncol = 1 + len(COLS)
    widths = [max(t[i][1].width for t, _ in rows) for i in range(ncol)]
    heights = [max(im.height for _, im in t) for t, _ in rows]
    W = sum(widths) + PAD * (ncol + 1)
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
    sheet.save(HERE / 'sheet.jpg', quality=84)
    print('sheet', sheet.size)


if __name__ == '__main__':
    main()
