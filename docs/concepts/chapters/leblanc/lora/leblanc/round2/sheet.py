"""Leblanc round 2 (FFX-2 only, Chapter 6): the review sheet, round2/sheet.jpg.

One row per state: the installed idle whole and the round-2 pick whole (both scaled to the row height, on
grey), then 1:1 crops, each idle region first and the pick's same region beside it: face, costume (heart,
choker, obi, knot, tassel, dress, robe), feet (boots), weapon (the fan). Boxes are in each installed
cut-out's own pixels (read on half-scale gridded views). A last row shows the round-1 picks this round
replaced, whole, from the backup.
    D:/Tools/ComfyUI/python_embeded/python.exe -s sheet.py
"""
import pathlib

from PIL import Image, ImageDraw

HERE = pathlib.Path(__file__).resolve().parent
REPO = HERE.parents[6]
ART = REPO / 'public/art/characters/leblanc'
BK = pathlib.Path('D:/Tools/pyrefly-art-backup/candidates/2026-09-23-lora-r2/leblanc/replaced')
ROW = 400
GAP = 8

BOX = {
    'idle': {'face': (200, 0, 470, 260), 'costume': (230, 180, 500, 560), 'feet': [(250, 880, 480, 1110)], 'fan': (360, 120, 540, 260)},
    'attack': {'face': (320, 0, 560, 240), 'costume': (360, 190, 640, 580), 'feet': [(250, 720, 420, 900), (780, 760, 929, 956)], 'fan': (0, 200, 260, 310)},
    'cast': {'face': (240, 250, 500, 480), 'costume': (320, 420, 600, 760), 'feet': [(320, 1000, 620, 1203)], 'fan': (270, 0, 520, 160)},
    'hurt': {'face': (380, 0, 700, 230), 'costume': (320, 160, 640, 440), 'feet': [(0, 820, 460, 1052)], 'fan': (560, 350, 740, 480)},
    'ko': {'face': (20, 130, 300, 360), 'costume': (280, 110, 780, 390), 'feet': [(950, 160, 1197, 310)], 'fan': (20, 280, 320, 370)},
}


def flat(im):
    bg = Image.new('RGBA', im.size, (128, 128, 128, 255))
    bg.alpha_composite(im.convert('RGBA'))
    return bg.convert('RGB')


def fit(im, h):
    s = min(1.0, h / im.height)
    return im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)


def row(label, tiles):
    W = sum(t.width + GAP for _, t in tiles)
    r = Image.new('RGB', (W, ROW + 22), (28, 28, 28))
    d = ImageDraw.Draw(r)
    x = 0
    for name, t in tiles:
        r.paste(t, (x, 22 + (ROW - t.height)))
        d.text((x + 3, 5), name, fill=(255, 230, 90))
        x += t.width + GAP
    d.text((W - 200, 5), label, fill=(255, 255, 255))
    return r


def main():
    idle = flat(Image.open(ART / 'idle.png'))
    rows = []
    for st in ('attack', 'cast', 'hurt', 'ko'):
        pick = flat(Image.open(ART / f'{st}.png'))
        b, bi = BOX[st], BOX['idle']
        tiles = [('idle (scaled)', fit(idle, ROW)), (f'{st} r2 (scaled)', fit(pick, ROW))]
        for key in ('face', 'costume'):
            tiles += [(f'idle {key} 1:1', fit(idle.crop(bi[key]), ROW)), (f'{st} {key} 1:1', fit(pick.crop(b[key]), ROW))]
        tiles.append(('idle feet 1:1', fit(idle.crop(bi['feet'][0]), ROW)))
        for n, f in enumerate(b['feet']):
            tiles.append((f'{st} feet {n + 1} 1:1', fit(pick.crop(f), ROW)))
        tiles += [('idle fan 1:1', fit(idle.crop(bi['fan']), ROW)), (f'{st} fan 1:1', fit(pick.crop(b['fan']), ROW))]
        rows.append(row(f'{st}: LoRA r2 step 1000 + OpenPose', tiles))
    old = [('idle', fit(idle, ROW))]
    for st in ('attack', 'cast', 'hurt', 'ko'):
        p = BK / f'{st}.png'
        if p.exists():
            old.append((f'{st} round 1 (replaced)', fit(flat(Image.open(p)), ROW)))
    for st in ('attack', 'cast', 'hurt', 'ko'):
        old.append((f'{st} round 2', fit(flat(Image.open(ART / f'{st}.png')), ROW)))
    rows.append(row('round 1 picks vs round 2 picks', old))
    W = max(r.width for r in rows)
    S = Image.new('RGB', (W, sum(r.height + GAP for r in rows)), (28, 28, 28))
    y = 0
    for r in rows:
        S.paste(r, (0, y))
        y += r.height + GAP
    S.save(HERE / 'sheet.jpg', quality=86)
    print(HERE / 'sheet.jpg', S.size)


if __name__ == '__main__':
    main()
