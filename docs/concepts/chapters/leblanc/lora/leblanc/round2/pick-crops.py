"""Leblanc round 2 (FFX-2 only): the step pick at 1:1. Columns: the installed idle (on its own 832x1216
frame, cropBox origin 88,51), then the step-test renders of one pose and seed per LoRA, at native pixels.
Rows: head, costume (heart, obi, knot, tassel, dress, robe), feet.
    python pick-crops.py <cand-dir> <out.jpg> <pose> <seed> <tag1,tag2,...>"""
import pathlib, sys
from PIL import Image, ImageDraw
REPO = pathlib.Path(__file__).resolve().parents[7]
def flat(p, frame=None):
    im = Image.open(p).convert('RGBA')
    W, H = frame or im.size
    bg = Image.new('RGBA', (W, H), (255, 255, 255, 255))
    bg.alpha_composite(im, (88, 51) if frame else (0, 0))
    return bg.convert('RGB')
cand, out, pose, seed, tags = pathlib.Path(sys.argv[1]), sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5].split(',')
cols = [('installed idle', flat(REPO / 'public/art/characters/leblanc/idle.png', (832, 1216)))]
cols += [(t, flat(cand / f'{pose}.{t}.{seed}.png')) for t in tags]
BOXES = {'head': (200, 20, 560, 340), 'costume': (180, 250, 600, 700), 'feet': (180, 950, 600, 1216)}
if len(sys.argv) > 6:
    BOXES = {k: tuple(map(int, v.split(','))) for k, v in (a.split('=') for a in sys.argv[6:])}
rows = []
for name, b in BOXES.items():
    w, h = b[2] - b[0], b[3] - b[1]
    r = Image.new('RGB', ((w + 6) * len(cols), h + 18), (60, 60, 60))
    d = ImageDraw.Draw(r)
    for i, (lab, im) in enumerate(cols):
        r.paste(im.crop(b), (i * (w + 6), 18))
        d.text((i * (w + 6) + 4, 3), f'{name}: {lab}', fill=(255, 255, 255))
    rows.append(r)
S = Image.new('RGB', (max(r.width for r in rows), sum(r.height for r in rows)), (60, 60, 60))
y = 0
for r in rows:
    S.paste(r, (0, y)); y += r.height
S.save(out, quality=90)
print(out, S.size)
