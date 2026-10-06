"""Gridded sheet of poses: python grid.py out.jpg H art/pose art/pose ..."""
import sys
from PIL import Image, ImageDraw
out, H = sys.argv[1], int(sys.argv[2]); names = sys.argv[3:]
A = 'D:/pyrefly-r39-color/public/art/characters/'
tiles = []
for n in names:
    im = Image.open(A + n + '.png').convert('RGBA')
    bg = Image.new('RGBA', im.size, (60, 60, 84, 255)); bg.alpha_composite(im)
    w = int(im.size[0] * H / im.size[1]); t = bg.convert('RGB').resize((w, H), Image.LANCZOS)
    d = ImageDraw.Draw(t)
    for i in range(1, 10):
        x = int(w * i / 10); y = int(H * i / 10)
        d.line([(x, 0), (x, H)], fill=(255, 255, 0), width=1); d.line([(0, y), (w, y)], fill=(255, 255, 0), width=1)
        d.text((x + 2, 2), str(i / 10)[1:], fill=(255, 255, 0)); d.text((2, y + 2), str(round(1 - i / 10, 1))[1:], fill=(0, 255, 255))
    d.text((4, H - 14), n, fill=(255, 255, 255)); tiles.append(t)
W = sum(t.size[0] for t in tiles) + 10 * len(tiles)
s = Image.new('RGB', (W, H), (0, 0, 0)); x = 0
for t in tiles: s.paste(t, (x, 0)); x += t.size[0] + 10
s.save(out, quality=88); print(s.size, [t.size[0] for t in tiles])
