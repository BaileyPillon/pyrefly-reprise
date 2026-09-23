"""Logos pose run: the review sheet (sheet.jpg).

    D:/Tools/ComfyUI/python_embeded/python.exe -s build-sheet.py

One row per state (idle first): the idle whole, the installed file whole (both scaled to
one height), then NATIVE 1:1 crops (no resampling) of the face/helmet and of the costume
(shoulder emblem, strap, sash) from the installed file. Crop boxes, in the installed
PNG's own pixels, are in crops.json. The idle row shows the idle's own crops, the target.
"""
import json
import pathlib

from PIL import Image, ImageDraw

HERE = pathlib.Path(__file__).resolve().parent
REPO = HERE.parents[6]
ART = REPO / 'public/art/characters/logos'
CROPS = json.loads((HERE / 'crops.json').read_text(encoding='utf-8'))
H = 520
BG = (236, 236, 236)
LABEL = 26


def flat(im):
    bg = Image.new('RGB', im.size, BG)
    bg.paste(im, mask=im.split()[-1])
    return bg


def fit(im, h):
    return im.resize((max(1, round(im.width * h / im.height)), h), Image.LANCZOS)


rows = []
idle = Image.open(ART / 'idle.png').convert('RGBA')
for state in ['idle', 'attack', 'cast', 'hurt', 'ko']:
    im = Image.open(ART / f'{state}.png').convert('RGBA')
    side = json.loads((ART / f'{state}.json').read_text(encoding='utf-8'))
    c = CROPS[state]
    whole_h = H if state != 'ko' else im.height  # ko at native size (it is 1159 px long)
    tiles = [('idle (anchor)', fit(flat(idle), H)),
             (f"{state} installed, seed {side.get('seed')}, {str(side.get('method', ''))[:24]}", fit(flat(im), whole_h)),
             ('1:1 face / helmet', flat(im.crop(tuple(c['face'])))),
             ('1:1 costume', flat(im.crop(tuple(c['costume']))))]
    rh = max(t.height for _, t in tiles) + LABEL
    rw = sum(t.width for _, t in tiles) + 16 * len(tiles)
    row = Image.new('RGB', (rw, rh), (70, 70, 70))
    d = ImageDraw.Draw(row)
    x = 0
    for name, t in tiles:
        row.paste(t, (x, LABEL))
        d.text((x + 4, 6), name, fill=(255, 255, 255))
        x += t.width + 16
    rows.append(row)

W = max(r.width for r in rows)
sheet = Image.new('RGB', (W, sum(r.height for r in rows) + 10 * len(rows) + 30), (40, 40, 40))
ImageDraw.Draw(sheet).text((8, 8), 'Logos (FFX-2, Chapter 6): LoRA logos-x2 step 2000 + OpenPose poses. ALL CANDIDATES, none approved. Crops are native 1:1.', fill=(255, 255, 255))
y = 30
for r in rows:
    sheet.paste(r, (0, y))
    y += r.height + 10
sheet.save(HERE / 'sheet.jpg', quality=86)
print('sheet.jpg', sheet.size)
