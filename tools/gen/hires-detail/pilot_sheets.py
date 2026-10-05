"""pilot_sheets.py: the crop sheets of the figure-detail pilot.

  python pilot_sheets.py crops <subject/state> [--seed 1|2] [--e]     100 percent crops (face, torso, hand, weapon/detail) : Today 1x | R39 | D1 0.45 | D1 0.55 | D2
  python pilot_sheets.py fig <subject/state> [--seed 1|2] [--e]       the whole figure at the size it draws in a 4K battle frame, the same five columns
  python pilot_sheets.py edge                                         the E edge crops (without E | with E): Kimahri hair and horn, Evrae crest and jaw, Tidus hair, Seymour Flux outline
Sheets go to D:/Tools/pyrefly-art-backup/candidates/2026-10-04-detail/sheets/.  Today 1x is the approved painting magnified with a bicubic kernel (what the game shows today).
"""
import sys
sys.path.insert(0, 'D:/Tools/pyrefly-scratch/2026-10-04/r39-art/tools')
from r39lib import *
from PIL import ImageDraw, ImageFont

ART39 = 'D:/pyrefly-r39-art/public/art'
OUT = 'D:/Tools/pyrefly-art-backup/candidates/2026-10-04-detail'
S = 4
BG = (58, 60, 70)
FONT = ImageFont.truetype('arial.ttf', 16)

# 1x centres of the crops (4x window = CELL px square at 100 percent)
CROPS = {
    'tidus/idle': {'face': (405, 150), 'torso': (420, 300), 'hand': (565, 150), 'weapon': (260, 580)},
    'tidus/attack': {'face': (340, 150), 'torso': (430, 280), 'hand': (95, 105), 'weapon': (560, 560)},
    'yuna-gunner/idle': {'face': (235, 130), 'torso': (235, 330), 'hand': (65, 545), 'weapon': (45, 690)},
    'seymour-flux-body/idle': {'face': (365, 235), 'torso': (430, 430), 'hand': (130, 520), 'weapon': (560, 120)},
}
CELL = 440
FIG_H_4K = {'tidus/idle': 713, 'tidus/attack': 713, 'yuna-gunner/idle': 713, 'seymour-flux-body/idle': 864}   # px tall in a 3840x2160 battle frame (party about 0.33, boss about 0.40 of the height)


def flat(im):
    if im.mode != 'RGBA':
        return im.convert('RGB')
    bg = Image.new('RGB', im.size, BG)
    bg.paste(im, mask=im.getchannel('A'))
    return bg


def today4(item):
    sid, state = item.split('/')
    a = Image.open(f'{ART39}/characters/{sid}/{state}.png').convert('RGBA')
    return a.resize((a.width * S, a.height * S), Image.BICUBIC)


def variants(item, seed, e):
    d = f'{OUT}/masters/{item.replace("/", "-")}'
    sfx = '+E' if e else ''
    s = seed
    cols = [('Today 1x (bicubic)', today4(item))]
    for lab, fn in (('R39', 'r39'), (f'D1 0.45 s{s}', f'd1-045-s{s}'), (f'D1 0.55 s{s}', f'd1-055-s{s}'), (f'D2 Klein s{s}', f'd2-s{s}')):
        p = f'{d}/{fn}{sfx}@4x.png'
        if os.path.exists(p):
            cols.append((lab + sfx, Image.open(p)))
    return cols


def crops(item, seed=1, e=False):
    cols = variants(item, seed, e)
    cen = CROPS[item]
    rows = list(cen.items())
    W = len(cols) * CELL + (len(cols) - 1) * 6
    sheet = Image.new('RGB', (W + 110, len(rows) * (CELL + 22) + 28), (24, 24, 28))
    d = ImageDraw.Draw(sheet)
    for ci, (lab, im) in enumerate(cols):
        d.text((110 + ci * (CELL + 6) + 4, 4), lab, fill=(235, 235, 235), font=FONT)
    for ri, (name, (cx, cy)) in enumerate(rows):
        y = 28 + ri * (CELL + 22)
        d.text((6, y + CELL // 2), name, fill=(255, 220, 120), font=FONT)
        for ci, (lab, im) in enumerate(cols):
            x0, y0 = int(cx * S - CELL // 2), int(cy * S - CELL // 2)
            x0 = max(0, min(im.width - CELL, x0))
            y0 = max(0, min(im.height - CELL, y0))
            sheet.paste(flat(im.crop((x0, y0, x0 + CELL, y0 + CELL))), (110 + ci * (CELL + 6), y))
    os.makedirs(f'{OUT}/sheets', exist_ok=True)
    out = f'{OUT}/sheets/{item.replace("/", "-")}-crops-seed{seed}{"-E" if e else ""}.jpg'
    sheet.save(out, quality=88)
    say(f'{out} {sheet.size}')


def fig(item, seed=1, e=False):
    cols = variants(item, seed, e)
    H = FIG_H_4K[item]
    cells = []
    for lab, im in cols:
        r = H / im.height
        cells.append((lab, flat(im.resize((round(im.width * r), H), Image.LANCZOS))))
    W = sum(c.width for _, c in cells) + 6 * (len(cells) - 1)
    sheet = Image.new('RGB', (W, H + 28), (24, 24, 28))
    d = ImageDraw.Draw(sheet)
    x = 0
    for lab, c in cells:
        d.text((x + 4, 4), f'{lab}  ({H} px tall = a 4K battle frame)', fill=(235, 235, 235), font=FONT)
        sheet.paste(c, (x, 28))
        x += c.width + 6
    os.makedirs(f'{OUT}/sheets', exist_ok=True)
    out = f'{OUT}/sheets/{item.replace("/", "-")}-figure-4k-seed{seed}{"-E" if e else ""}.jpg'
    sheet.save(out, quality=88)
    say(f'{out} {sheet.size}')


if __name__ == '__main__':
    mode = sys.argv[1]
    a = sys.argv[2:]
    seed = 2 if '--seed' in a and a[a.index('--seed') + 1] == '2' else 1
    e = '--e' in a
    items = [x for x in a if '/' in x]
    for it in items:
        (crops if mode == 'crops' else fig)(it, seed, e)
