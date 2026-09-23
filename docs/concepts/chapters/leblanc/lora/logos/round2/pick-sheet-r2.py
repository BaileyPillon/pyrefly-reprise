"""Logos round 2 step-pick sheet (FFX-2 only): round2/pick-sheet.jpg.

    D:/Tools/ComfyUI/python_embeded/python.exe -s pick-sheet-r2.py

Rows: the repaired idle (anchor: whole + its own head, hand and feet at 1:1), then the round-1
LoRA (r1, control) and each r2 step. Per row, for each of the 2 seeds of the IDLE pose: the frame
scaled, then NATIVE 1:1 crops (no resampling) of the head/helmet, the near hand + revolver, the
feet; then for each of the 2 seeds of the UNSEEN pose (hurt, recoil skeleton): the frame scaled and
a 1:1 head crop. Crop boxes are fixed per skeleton, in the 832x1216 raw frame.
"""
import pathlib

from PIL import Image, ImageDraw

HERE = pathlib.Path(__file__).resolve().parent
REPO = HERE.parents[6]
PICK = pathlib.Path('D:/Tools/pyrefly-lora/logos/pick-r2')
SEEDS = {'idle': [99001, 99002], 'hurt': [99301, 99302]}
BOX = {
    'idle': {'head': (290, 20, 540, 250), 'hand': (320, 540, 520, 780), 'feet': (320, 1000, 640, 1200)},
    'hurt': {'head': (500, 60, 760, 300)},
}
ROWS = ['r1', 's500', 's1000', 's1500', 's2000']
TH = 260


def tile(im, text, scale=True):
    if scale:
        im = im.resize((round(im.width * TH / im.height), TH), Image.LANCZOS)
    t = Image.new('RGB', (im.width, im.height + 18), (24, 24, 24))
    t.paste(im, (0, 18))
    ImageDraw.Draw(t).text((3, 3), text, fill=(255, 255, 255))
    return t


def row(tiles):
    w = sum(t.width for t in tiles) + 6 * (len(tiles) - 1)
    h = max(t.height for t in tiles)
    r = Image.new('RGB', (w, h), (48, 48, 48))
    x = 0
    for t in tiles:
        r.paste(t, (x, 0))
        x += t.width + 6
    return r


def main():
    rows = []
    idle = Image.open(REPO / 'public/art/characters/logos/idle.png').convert('RGBA')
    bg = Image.new('RGBA', idle.size, (255, 255, 255, 255))
    bg.alpha_composite(idle)
    idle = bg.convert('RGB')
    # the idle cutout sits in the 832x1216 frame at its cropBox 164,42
    frame = Image.new('RGB', (832, 1216), (255, 255, 255))
    frame.paste(idle, (164, 42))
    t = [tile(frame, 'ANCHOR idle (repaired)')]
    for k, b in BOX['idle'].items():
        t.append(tile(frame.crop(b), f'{k} 1:1', scale=False))
    rows.append(row(t))
    for r in ROWS:
        t = []
        for st in ['idle', 'hurt']:
            for s in SEEDS[st]:
                p = PICK / f'{st}.{s}.{r}.raw.png'
                if not p.exists():
                    continue
                im = Image.open(p).convert('RGB')
                t.append(tile(im, f'{r} {st} {s}'))
                for k, b in BOX[st].items():
                    t.append(tile(im.crop(b), f'{k} 1:1', scale=False))
        if t:
            rows.append(row(t))
    W = max(r.width for r in rows)
    sheet = Image.new('RGB', (W, sum(r.height for r in rows) + 8 * len(rows)), (48, 48, 48))
    y = 0
    for r in rows:
        sheet.paste(r, (0, y))
        y += r.height + 8
    sheet.save(HERE / 'pick-sheet.jpg', quality=88)
    print('pick sheet', sheet.size)


if __name__ == '__main__':
    main()
