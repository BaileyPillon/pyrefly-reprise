"""Logos round 2 (copy of ../poses/cand-sheet.py, reading round2/renders): every candidate of one state side by side.

    D:/Tools/ComfyUI/python_embeded/python.exe -s cand-sheet.py <state> [tag-suffix]

Writes renders/cands-<state>.jpg: the installed idle at the left, then each rembg cutout
on light grey (so a white hole in the cutout shows), labelled with its seed and the
cut-out guard's verdict. Whole figures at a common height; judge the 1:1 crops on sheet.jpg.
"""
import json
import pathlib
import sys

from PIL import Image, ImageDraw

HERE = pathlib.Path(__file__).resolve().parent
REPO = HERE.parents[6]
state = sys.argv[1]
suffix = sys.argv[2] if len(sys.argv) > 2 else ''
H = 760
BG = (222, 222, 222)


def flat(p):
    im = Image.open(p).convert('RGBA')
    bg = Image.new('RGB', im.size, BG)
    bg.paste(im, mask=im.split()[-1])
    return bg


tiles = [('idle', flat(REPO / 'public/art/characters/logos/idle.png'))]
for j in sorted((HERE / 'renders').glob(f'{state}.*.json')):
    stem = j.name[:-5]
    parts = stem.split('.')
    if (suffix and parts[-1] != suffix) or (not suffix and len(parts) != 2):
        continue
    meta = json.loads(j.read_text(encoding='utf-8'))
    png = HERE / 'renders' / f'{stem}.png'
    if not png.exists():
        continue
    g = meta.get('cutoutGuard') or {}
    tiles.append((f"{meta['seed']}{'' if g.get('ok', True) else ' GUARD'}", flat(png)))

h = H if state != 'ko' else 480
scaled = [(n, t.resize((round(t.width * h / t.height), h), Image.LANCZOS)) for n, t in tiles]
W = sum(t.width for _, t in scaled) + 12 * len(scaled)
sheet = Image.new('RGB', (W, h + 30), (50, 50, 50))
d = ImageDraw.Draw(sheet)
x = 0
for n, t in scaled:
    sheet.paste(t, (x, 30))
    d.text((x + 6, 8), n, fill=(255, 255, 255))
    x += t.width + 12
out = HERE / 'renders' / f"cands-{state}{'-' + suffix if suffix else ''}.jpg"
sheet.save(out, quality=88)
print(out)
