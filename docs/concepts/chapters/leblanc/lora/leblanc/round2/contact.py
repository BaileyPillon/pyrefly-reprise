"""Leblanc round 2: every candidate of one state on grey at one scale, idle first (a LOOK aid).
    python contact.py <state> <out.jpg> [scale=0.5] [tags=a,b]"""
import sys, pathlib
from PIL import Image, ImageDraw
REPO = pathlib.Path(__file__).resolve().parents[7]
P = pathlib.Path('D:/Tools/pyrefly-lora/leblanc/poses')
state, out = sys.argv[1], sys.argv[2]
k = float(sys.argv[3]) if len(sys.argv) > 3 else 0.5
tags = sys.argv[4].split(',') if len(sys.argv) > 4 else [f'{state}.r2.{n}' for n in range(1, 7)]
items = [('idle', REPO / 'public/art/characters/leblanc/idle.png')] + [(t, P / f'{t}.png') for t in tags]
ims = []
for lab, p in items:
    im = Image.open(p).convert('RGBA')
    im = im.resize((int(im.width * k), int(im.height * k)), Image.LANCZOS)
    bg = Image.new('RGBA', im.size, (128, 128, 128, 255)); bg.alpha_composite(im)
    ims.append((lab, bg.convert('RGB')))
H = max(i.height for _, i in ims) + 20
W = sum(i.width for _, i in ims) + 10 * len(ims)
s = Image.new('RGB', (W, H), (40, 40, 40)); d = ImageDraw.Draw(s); x = 0
for lab, i in ims:
    s.paste(i, (x, H - i.height)); d.text((x + 4, 4), lab, fill=(255, 255, 0)); x += i.width + 10
s.save(out, quality=88); print(out, s.size)
