"""mo2.py : two-panel MOTION clips (mp4, 60 fps, 1600 x 900) of the demo-bosses lane, from the recorder's real-game frames: A the painting set the game draws today (rig off) | B the new rig, each panel centred on
its own figure, the same crop size. A subject with no rig of today (a boss that was never rigged) has no middle panel.

  mo2.py poses --out DIR --label NAME --new <rec>/poses --off <rec>/poses-off --poses idle,attack,cast,hurt,telegraph [--size 796,836]
        idle, then the pose (the game's own blend), 130 frames a pose, from the recorder's `poses` mode (record it with --keep-sway so both panels breathe and sway as the game runs them)
  mo2.py ko --out DIR --label NAME --newko <rec>/ko --offko <rec>/ko-off --sum ko-summary.json [--before 70 --after 130]
        hurt-to-KO: each recording's ring of frames (f%05d) from `before` frames before ITS OWN pose swap to `after` frames after; the swap frames come from `ko-summary.mjs --json` (`on`, `off`).
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
SIZE = tuple(int(v) for v in opt('--size', '796,836').split(','))
CAP = 900 - SIZE[1]
CRF = opt('--crf', '18')
font = ImageFont.truetype(L.FONT, 22) if pathlib.Path(L.FONT).exists() else ImageFont.load_default()
small = ImageFont.truetype(L.FONT, 17) if pathlib.Path(L.FONT).exists() else ImageFont.load_default()


def crop_around(rect):
    cx, cy = rect['x'] + rect['w'] / 2, rect['y'] + rect['h'] / 2
    x0 = int(max(0, min(1600 - SIZE[0], cx - SIZE[0] / 2)))
    y0 = int(max(0, min(900 - SIZE[1], cy - SIZE[1] / 2)))
    return (x0, y0, x0 + SIZE[0], y0 + SIZE[1])


def encode(frames, titles, dest, header, marks=None):
    """frames: a list (per output frame) of lists of PIL panels; marks: optional {frame index: text} drawn on the caption bar."""
    tmp = pathlib.Path(tempfile.mkdtemp(prefix='mo2-'))
    n = len(titles)
    W = SIZE[0] * n + 8 * (n - 1)
    W += W % 2
    for i, panels in enumerate(frames):
        t = Image.new('RGB', (W, 900), L.BAR)
        d = ImageDraw.Draw(t)
        d.text((10, 8), header, font=font, fill=L.GOLD)
        for j, p in enumerate(panels):
            t.paste(p, (j * (SIZE[0] + 8), CAP))
            d.text((j * (SIZE[0] + 8) + 10, CAP + 8), titles[j], font=small, fill=(255, 235, 120))
        if marks and i in marks:
            d.text((10, 38), marks[i], font=small, fill=(255, 120, 120))
        t.save(tmp / f'a{i:04d}.png')
    subprocess.run([L.FFMPEG, '-y', '-loglevel', 'error', '-framerate', '60', '-i', str(tmp / 'a%04d.png'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', CRF, str(dest)], check=True)
    shutil.rmtree(tmp, ignore_errors=True)
    print('wrote', dest, f'{len(frames)} frames, {W}x900')


if mode == 'poses':
    recs = [('A  the painting set the game draws today (rig off)', pathlib.Path(opt('--off'))), ('B  the new rig', pathlib.Path(opt('--new')))]
    for pose in opt('--poses', 'idle,attack,cast,hurt,telegraph').split(','):
        info = {r: json.load(open(r / 'poses-info.json'))['poses'][pose]['rectPose'] for t, r in recs}
        files = {r: sorted((r / 'frames' / pose).glob('f*.jpg')) for t, r in recs}
        n = min(len(v) for v in files.values())
        frames = [[Image.open(files[r][i]).crop(crop_around(info[r])) for t, r in recs] for i in range(n)]
        what = 'idle (breathing and sway as the game runs them)' if pose == 'idle' else f'idle, then {pose.upper()} (the game\'s own blend)'
        encode(frames, [t for t, r in recs], out / f'{label}-{pose}-motion.mp4', f'{label.upper()}  {what}, 60 fps')
else:
    before, after = int(opt('--before', 70)), int(opt('--after', 130))
    summ = json.load(open(opt('--sum')))
    recs = [('A  the painting set the game draws today (rig off)', pathlib.Path(opt('--offko')), summ['off']), ('B  the new rig', pathlib.Path(opt('--newko')), summ['on'])]
    frames, marks = [], {}
    for i in range(before + after):
        row = []
        for t, r, s in recs:
            f = s['swapFrame'] - before + i
            p = r / 'frames' / f'f{f:05d}.jpg'
            if not p.exists():
                ex = sorted((r / 'frames').glob('f*.jpg'))
                p = ex[min(max(0, f - int(ex[0].stem[1:])), len(ex) - 1)]
            row.append(Image.open(p).crop(crop_around(s['boxBefore'])))
        frames.append(row)
    marks[before] = opt('--mark', 'the pose swap to KNOCKED OUT (each panel aligned on its own swap)')
    encode(frames, [t for t, r, s in recs], out / f"{label}-{opt('--name', 'hurt-to-ko')}-motion.mp4", opt('--title', f'{label.upper()}  HURT TO KNOCKED OUT: {before} frames before the swap, {after} after (60 fps)'), {before + k: marks[before] for k in range(0, 12)})
