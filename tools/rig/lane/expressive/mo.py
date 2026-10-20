"""mo.py : MOTION clips of the expressive lane (mp4, 60 fps, real-game frames): the painting set the game draws today | today's rig | the new rig, side by side, same crop size, each panel centred on its own figure.

  mo.py poses --out DIR --label NAME --old <rec>/poses --new <rec>/poses [--off <rec>/poses-off] --size 480,540 --poses attack,hurt [--ybias N] [--crf 20]
  mo.py ko    --out DIR --label NAME --oldko <rec>/ko --newko <rec>/ko [--offko <rec>/ko-off] --oldsum ko-summary-today.json --newsum ko-summary-x.json --size 600,540 [--before 40 --after 110]
        hurt-to-KO: each recording's ring of frames (f%05d) from `before` frames before ITS OWN pose swap to `after` frames after; the KO frames come from the ko-summary json (swapFrame, boxBefore).
"""
import json
import pathlib
import shutil
import subprocess
import sys
import tempfile

sys.path.insert(0, 'D:/pyrefly-rig-rikkudk/tools/rig/lane')
from PIL import Image, ImageDraw, ImageFont

import lane_sheets as L

a = sys.argv[1:]
mode = a[0]


def opt(n, d=None):
    return a[a.index(n) + 1] if n in a else d


out = pathlib.Path(opt('--out'))
out.mkdir(parents=True, exist_ok=True)
label = opt('--label', 'subject')
SIZE = tuple(int(v) for v in opt('--size', '480,540').split(','))
YB = float(opt('--ybias', 0))
CRF = opt('--crf', '20')
font = ImageFont.truetype(L.FONT, 20) if pathlib.Path(L.FONT).exists() else ImageFont.load_default()
small = ImageFont.load_default()


def crop_around(rect):
    cx, cy = rect['x'] + rect['w'] / 2, rect['y'] + rect['h'] / 2 + YB
    x0 = int(max(0, min(1600 - SIZE[0], cx - SIZE[0] / 2)))
    y0 = int(max(0, min(900 - SIZE[1], cy - SIZE[1] / 2)))
    return (x0, y0, x0 + SIZE[0], y0 + SIZE[1])


def encode(frames, titles, dest, header):
    """frames: list (per output frame) of lists of PIL panels."""
    tmp = pathlib.Path(tempfile.mkdtemp(prefix='mo-'))
    n = len(titles)
    W = SIZE[0] * n + 8 * (n - 1)
    for i, panels in enumerate(frames):
        t = Image.new('RGB', (W, SIZE[1] + L.CAP), L.BAR)
        d = ImageDraw.Draw(t)
        d.text((10, 6), header, font=font, fill=L.GOLD)
        for j, p in enumerate(panels):
            t.paste(p, (j * (SIZE[0] + 8), L.CAP))
            d.text((j * (SIZE[0] + 8) + 8, L.CAP + 6), titles[j], font=small, fill=(255, 235, 120))
        t.save(tmp / f'a{i:04d}.png')
    subprocess.run([L.FFMPEG, '-y', '-loglevel', 'error', '-framerate', '60', '-i', str(tmp / 'a%04d.png'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', CRF, str(dest)], check=True)
    shutil.rmtree(tmp, ignore_errors=True)
    print('wrote', dest, f'{len(frames)} frames, {W}x{SIZE[1] + L.CAP}')


if mode == 'poses':
    recs = [('A  the painting set the game draws today (rig off)', opt('--off')), ("B  today's rig", opt('--old')), ('C  the expressive rig', opt('--new'))]
    recs = [(t, pathlib.Path(p)) for t, p in recs if p]
    for pose in opt('--poses', 'attack,hurt').split(','):
        info = {}
        for t, r in recs:
            info[r] = json.load(open(r / 'poses-info.json'))['poses'][pose]['rectPose']
        files = {r: sorted((r / 'frames' / pose).glob('f*.jpg')) for t, r in recs}
        n = min(len(v) for v in files.values())
        frames = []
        for i in range(n):
            frames.append([Image.open(files[r][i]).crop(crop_around(info[r])) for t, r in recs])
        encode(frames, [t for t, r in recs], out / f'{label}-{pose}-motion.mp4', f'{label.upper()}  {pose.upper()}  idle, then the pose (the game\'s own blend), 60 fps')
else:
    before, after = int(opt('--before', 40)), int(opt('--after', 110))
    oldsum, newsum = json.load(open(opt('--oldsum'))), json.load(open(opt('--newsum')))
    recs = []
    if opt('--offko') and newsum.get('off'):
        recs.append(('A  the painting set (rig off): a standing painting replaced by the KO painting', pathlib.Path(opt('--offko')), newsum['off']))
    recs.append(("B  today's rig", pathlib.Path(opt('--oldko')), oldsum['on']))
    recs.append(('C  the expressive rig', pathlib.Path(opt('--newko')), newsum['on']))
    frames = []
    for i in range(before + after):
        row = []
        for t, r, s in recs:
            f = s['swapFrame'] - before + i
            p = r / 'frames' / f'f{f:05d}.jpg'
            if not p.exists():
                ex = sorted((r / 'frames').glob('f*.jpg'))
                p = ex[min(max(0, f - int(ex[0].stem[1:])), len(ex) - 1)] if ex else None
            row.append(Image.open(p).crop(crop_around(s['boxBefore'])))
        frames.append(row)
    encode(frames, [t for t, r, s in recs], out / f'{label}-hurt-to-ko-motion.mp4', f'{label.upper()}  HURT TO KNOCKED OUT: {before} frames before the pose swap, {after} after (60 fps, each aligned on its own swap)')
