"""tw.py : the three-way sheets of the expressive lane (real-game frames, same camera and crop).

  tw.py poses  --out FILE --crop x0,y0,x1,y1 --rows attack:70:70,hurt:70:70 --old <rec>/poses --new <rec>/poses --off <rec>/poses-off [--crop-<pose> x0,y0,x1,y1] --title "text"
        one row per pose, three panels: A the painting the game draws today (rig off) | B today's rig | C the expressive rig. rows = pose:rigFrame:paintingFrame
  tw.py hurtko --out FILE --crop x0,y0,x1,y1 --old <rec>/poses --new <rec>/poses --off <rec>/poses-off --hurt 70:70 --ko 70:36 --foot "line || line"
        the pilot's layout: three bands A/B/C, each hurt | knocked out.
"""
import json
import pathlib
import sys

sys.path.insert(0, 'D:/pyrefly-rig-valefor/tools/rig/lane')
sys.path.insert(0, 'D:/pyrefly-rig-valefor/tools/rig')
from PIL import Image, ImageDraw, ImageFont

import lane_sheets as L

a = sys.argv[1:]
mode = a[0]


def opt(name, default=None):
    return a[a.index(name) + 1] if name in a else default


def crop_of(s):
    return tuple(int(v) for v in s.split(','))


out = opt('--out')
old, new, off = (pathlib.Path(opt(k)) for k in ('--old', '--new', '--off'))
crop = crop_of(opt('--crop')) if opt('--crop') else (0, 0, *(crop_of(opt('--size'))))
big = ImageFont.truetype(L.FONT, 22) if pathlib.Path(L.FONT).exists() else ImageFont.load_default()
small = ImageFont.load_default()


SIZE = crop_of(opt('--size')) if opt('--size') else None  # w,h: each panel's crop is centred on that recording's own projected rect of the pose (the cameras of two recordings differ a little)
_info = {}


def centre_crop(rec, pose, cr):
    if SIZE is None:
        return cr
    if rec not in _info:
        pi = rec / 'poses-info.json'
        _info[rec] = json.load(open(pi))['poses'] if pi.exists() else {}
    r = (_info[rec].get(pose) or {}).get('rectPose')
    if not r:
        return cr
    cx, cy = r['x'] + r['w'] / 2, r['y'] + r['h'] / 2 + float(opt('--ybias', 0))
    x0 = int(max(0, min(1600 - SIZE[0], cx - SIZE[0] / 2)))
    y0 = int(max(0, min(900 - SIZE[1], cy - SIZE[1] / 2)))
    return (x0, y0, x0 + SIZE[0], y0 + SIZE[1])


def frame(rec, pose, n, cr):
    p = rec / 'frames' / pose / f'f{n:04d}.jpg'
    return Image.open(p).crop(centre_crop(rec, pose, cr))


if mode == 'poses':
    pw = 560
    rows = []
    for spec in opt('--rows').split(','):
        pose, rf, pf = spec.split(':')
        cr = crop_of(opt('--crop-' + pose)) if opt('--crop-' + pose) else crop
        ph = int(pw * (cr[3] - cr[1]) / (cr[2] - cr[0]))
        titles = ['A  the painting the game draws today (rig off)', "B  today's rig", 'C  the expressive rig']
        ims = [frame(off, pose, int(pf), cr), frame(old, pose, int(rf), cr), frame(new, pose, int(rf), cr)]
        width = pw * 3 + 24
        bar = Image.new('RGB', (width, L.CAP), L.BAR)
        d = ImageDraw.Draw(bar)
        d.text((14, 10), pose.upper() + '      ' + '      '.join(titles), font=small, fill=L.GOLD)
        row = Image.new('RGB', (width, ph + L.CAP), L.BAR)
        row.paste(bar, (0, 0))
        for i, im in enumerate(ims):
            row.paste(im.resize((pw, ph), Image.LANCZOS), (i * (pw + 12), L.CAP))
        rows.append(row)
    if opt('--foot'):
        foot = Image.new('RGB', (rows[0].width, L.CAP * 3), L.BAR)
        d = ImageDraw.Draw(foot)
        for i, line in enumerate(opt('--foot').split(' || ')):
            d.text((14, 6 + i * 14), line, font=small, fill=L.GOLD)
        rows.append(foot)
    L._stack(rows).save(out)
    print(out)
else:
    foot = opt('--foot', '')
    hf = tuple(int(v) for v in opt('--hurt', '70:70').split(':'))
    kf = tuple(int(v) for v in opt('--ko', '70:36').split(':'))
    bands = [
        ('A  the painting set the game draws today (rig off)', off, (hf[1], kf[1]), True),
        ("B  today's rig", old, (hf[0], kf[0]), False),
        (opt('--title-c', 'C  the expressive rig'), new, (hf[0], kf[0]), False),
    ]
    pw = 640
    ph = int(pw * (crop[3] - crop[1]) / (crop[2] - crop[0]))
    width = pw * 2 + 12
    parts = []
    for title, rec, (h, k), is_off in bands:
        b = Image.new('RGB', (width, L.CAP), L.BAR)
        ImageDraw.Draw(b).text((14, 8), title, font=big, fill=L.GOLD)
        parts.append(b)
        row = Image.new('RGB', (width, ph + L.CAP), L.BAR)
        for i, (pose, fr) in enumerate((('hurt', h), ('ko', k))):
            row.paste(frame(rec, pose, fr, crop).resize((pw, ph), Image.LANCZOS), (i * (pw + 12), L.CAP))
        d = ImageDraw.Draw(row)
        d.text((14, 8), 'HURT (painting)' if is_off else 'HURT', font=small, fill=L.GOLD)
        d.text((pw + 26, 8), f'KNOCKED OUT (painting dissolve, frame {kf[1]})' if is_off else 'KNOCKED OUT', font=small, fill=L.GOLD)
        parts.append(row)
    if foot:
        b = Image.new('RGB', (width, L.CAP * 3), L.BAR)
        d = ImageDraw.Draw(b)
        for i, line in enumerate(foot.split(' || ')):
            d.text((14, 6 + i * 14), line, font=small, fill=L.GOLD)
        parts.append(b)
    L._stack(parts).save(out)
    print(out)
