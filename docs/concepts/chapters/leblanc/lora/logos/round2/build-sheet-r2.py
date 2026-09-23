"""Logos round 2 review sheet (FFX-2 only): round2/sheet.jpg.

    D:/Tools/ComfyUI/python_embeded/python.exe -s build-sheet-r2.py

One row per state (idle first). Each row: the idle whole (the anchor), the installed file whole
(both scaled to the row height, on flat grey), then NATIVE 1:1 crops (no resampling) of the
face/helmet, the costume (emblem, strap, sash), the feet and the weapon, from the boxes in
crops-r2.json (cutout pixels). Labels carry the file's sha256 prefix and sidecar scale.
"""
import hashlib
import json
import pathlib

from PIL import Image, ImageDraw

HERE = pathlib.Path(__file__).resolve().parent
REPO = HERE.parents[6]
ART = REPO / 'public/art/characters/logos'
ROW = 420
GAP = 8
BG = (132, 132, 132)


def flat(p):
    im = Image.open(p).convert('RGBA')
    bg = Image.new('RGBA', im.size, BG + (255,))
    bg.alpha_composite(im)
    return bg.convert('RGB')


def fit(im, h):
    k = min(h / im.height, 1.0 if im.width > im.height * 2 else 10)
    if im.width * (h / im.height) > 900:
        k = 900 / im.width
    else:
        k = h / im.height
    return im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)


def label(tile, text):
    t = Image.new('RGB', (tile.width, tile.height + 22), (24, 24, 24))
    t.paste(tile, (0, 22))
    ImageDraw.Draw(t).text((4, 5), text, fill=(255, 255, 255))
    return t


def main():
    crops = json.loads((HERE / 'crops-r2.json').read_text(encoding='utf-8'))
    idle = flat(ART / 'idle.png')
    rows = []
    for state in ['idle', 'attack', 'cast', 'hurt', 'ko']:
        p = ART / f'{state}.png'
        side = json.loads((ART / f'{state}.json').read_text(encoding='utf-8'))
        h8 = hashlib.sha256(p.read_bytes()).hexdigest()[:8]
        im = flat(p)
        tiles = [label(fit(idle, ROW), 'idle (anchor)'),
                 label(fit(im, ROW), f"{state} {h8} {side.get('renderTag', '')} scale {side.get('scale', 1)}")]
        for name, box in crops.get(state, {}).items():
            c = im.crop(tuple(box))
            if c.height > ROW:
                c = c.crop((0, 0, c.width, ROW))
            tiles.append(label(c, f'{name} 1:1'))
        w = sum(t.width for t in tiles) + GAP * (len(tiles) - 1)
        h = max(t.height for t in tiles)
        row = Image.new('RGB', (w, h), (48, 48, 48))
        x = 0
        for t in tiles:
            row.paste(t, (x, 0))
            x += t.width + GAP
        rows.append(row)
    W = max(r.width for r in rows)
    sheet = Image.new('RGB', (W, sum(r.height for r in rows) + GAP * (len(rows) - 1)), (48, 48, 48))
    y = 0
    for r in rows:
        sheet.paste(r, (0, y))
        y += r.height + GAP
    sheet.save(HERE / 'sheet.jpg', quality=90)
    print('sheet', sheet.size)


if __name__ == '__main__':
    main()
