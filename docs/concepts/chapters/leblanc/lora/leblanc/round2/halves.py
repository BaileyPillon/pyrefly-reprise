"""Leblanc round 2 LOOK aid: candidates side by side at native pixels (1:1), one horizontal band.
    python halves.py <out.jpg> <y0frac> <y1frac> <tag> [<tag> ...]"""
import sys, pathlib
from PIL import Image, ImageDraw
P = pathlib.Path('D:/Tools/pyrefly-lora/leblanc/poses')
REPO = pathlib.Path(__file__).resolve().parents[7]
out, a, b, tags = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), sys.argv[4:]
ims = []
for t in tags:
    p = REPO / 'public/art/characters/leblanc/idle.png' if t == 'idle' else P / f'{t}.png'
    im = Image.open(p).convert('RGBA')
    bg = Image.new('RGBA', im.size, (128, 128, 128, 255)); bg.alpha_composite(im)
    ims.append((t, bg.convert('RGB').crop((0, int(a * im.height), im.width, int(b * im.height)))))
H = max(i.height for _, i in ims) + 16
s = Image.new('RGB', (sum(i.width + 8 for _, i in ims), H), (30, 30, 30)); d = ImageDraw.Draw(s); x = 0
for t, i in ims:
    s.paste(i, (x, 16)); d.text((x + 3, 2), t, fill=(255, 255, 0)); x += i.width + 8
s.save(out, quality=92); print(out, s.size)
