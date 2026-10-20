"""tw3.py : the three-way still sheet of the demo-bosses lane (real-game frames, the same camera and crop): A the painting set the game draws today (rig off) | B the new rig | C where they differ (the absolute
difference of A and B, three times brighter: what the rig moved, redrew or lost against the painting set), one row a pose.

  tw3.py poses --out FILE --new <rec>/poses --off <rec>/poses-off --rows attack:70,hurt:70,ko:70 [--size 520,560] [--title TEXT]
        rows = pose:frame (a frame of the `poses` mode's 130: 0 to 19 idle, the pose from 20, settled by about 70)
  tw3.py hurtko --out FILE --newko <rec>/ko --offko <rec>/ko-off --sum ko-summary.json [--size 520,560] [--title TEXT]
        two rows (A and B recordings... as columns): hurt just before the swap and the KO a few frames after, for the painting set and the rig, with the difference column
"""
import json
import pathlib
import sys

sys.path.insert(0, 'D:/pyrefly-rig-rikkudk/tools/rig/lane')
from PIL import Image, ImageChops, ImageDraw, ImageFont

import lane_sheets as L

a = sys.argv[1:]
mode = a[0]


def opt(n, d=None):
    return a[a.index(n) + 1] if n in a else d


SIZE = tuple(int(v) for v in opt('--size', '520,560').split(','))
big = ImageFont.truetype(L.FONT, 22) if pathlib.Path(L.FONT).exists() else ImageFont.load_default()
small = ImageFont.truetype(L.FONT, 17) if pathlib.Path(L.FONT).exists() else ImageFont.load_default()


def crop_around(rect):
    cx, cy = rect['x'] + rect['w'] / 2, rect['y'] + rect['h'] / 2
    x0 = int(max(0, min(1600 - SIZE[0], cx - SIZE[0] / 2)))
    y0 = int(max(0, min(900 - SIZE[1], cy - SIZE[1] / 2)))
    return (x0, y0, x0 + SIZE[0], y0 + SIZE[1])


def diff(a_, b_):
    d = ImageChops.difference(a_.convert('RGB'), b_.convert('RGB'))
    return d.point(lambda v: min(255, v * 3))


def sheet(rows, titles, out, title):
    W = SIZE[0] * 3 + 16
    H = 46 + len(rows) * (SIZE[1] + 34)
    t = Image.new('RGB', (W, H), L.BAR)
    d = ImageDraw.Draw(t)
    d.text((10, 8), title, font=big, fill=L.GOLD)
    y = 46
    for lab, panels in rows:
        d.text((10, y + 4), lab, font=small, fill=(255, 235, 120))
        for j, p in enumerate(panels):
            t.paste(p, (j * (SIZE[0] + 8), y + 28))
        y += SIZE[1] + 34
    for j, s in enumerate(titles):
        d.text((j * (SIZE[0] + 8) + 6, 30), s, font=small, fill=(255, 235, 120))
    t.save(out)
    print('wrote', out, t.size)


T3 = ['A  the painting set the game draws today', 'B  the new rig', 'C  where they differ (A against B, x3)']
if mode == 'poses':
    off, new = pathlib.Path(opt('--off')), pathlib.Path(opt('--new'))
    rows = []
    for spec in opt('--rows').split(','):
        pose, _, fr = spec.partition(':')
        fr = int(fr or 70)
        ra = json.load(open(off / 'poses-info.json'))['poses'][pose]['rectPose']
        rb = json.load(open(new / 'poses-info.json'))['poses'][pose]['rectPose']
        A = Image.open(off / 'frames' / pose / f'f{fr:04d}.jpg').crop(crop_around(ra))
        B = Image.open(new / 'frames' / pose / f'f{fr:04d}.jpg').crop(crop_around(rb))
        rows.append((f'{pose.upper()}  (frame {fr})', [A, B, diff(A, B)]))
    sheet(rows, T3, opt('--out'), opt('--title', 'the painting set against the rig, in the real game'))
else:
    summ = json.load(open(opt('--sum')))
    offd, newd = pathlib.Path(opt('--offko')), pathlib.Path(opt('--newko'))
    rows = []
    for lab, delta in (('HURT, the frame before the pose swap', -1), ('KNOCKED OUT, 12 frames after the swap', 12)):
        panels = []
        for d_, s in ((offd, summ['off']), (newd, summ['on'])):
            f = s['swapFrame'] + delta
            p = d_ / 'frames' / f'f{f:05d}.jpg'
            if not p.exists():
                ex = sorted((d_ / 'frames').glob('f*.jpg'))
                p = ex[min(max(0, f - int(ex[0].stem[1:])), len(ex) - 1)]
            panels.append(Image.open(p).crop(crop_around(s['boxBefore'])))
        rows.append((lab, [panels[0], panels[1], diff(panels[0], panels[1])]))
    sheet(rows, T3, opt('--out'), opt('--title', 'hurt to knocked out, in the real game'))
