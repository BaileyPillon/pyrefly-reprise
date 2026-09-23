"""Candidate strip at native pixels scaled by nearest neighbour (never resampled smooth).
python -s cand-crops.py <out.jpg> <l,t,r,b> <scale> <label=path.png> ...
Each cutout is flattened on white; the box is in the cutout's own pixels."""
import sys
from PIL import Image, ImageDraw
out, box, k, *items = sys.argv[1:]
b = [int(v) for v in box.split(',')]
k = int(k)
tiles = []
for it in items:
    lab, p = it.split('=', 1)
    im = Image.open(p).convert('RGBA')
    bg = Image.new('RGBA', im.size, (255, 255, 255, 255)); bg.alpha_composite(im)
    c = bg.convert('RGB').crop(b)
    c = c.resize((c.width * k, c.height * k), Image.NEAREST)
    t = Image.new('RGB', (c.width, c.height + 26), (30, 30, 30)); t.paste(c, (0, 26))
    ImageDraw.Draw(t).text((6, 6), lab, fill=(255, 255, 255))
    tiles.append(t)
W = sum(t.width for t in tiles) + 8 * (len(tiles) - 1)
s = Image.new('RGB', (W, max(t.height for t in tiles)), (60, 60, 60))
x = 0
for t in tiles:
    s.paste(t, (x, 0)); x += t.width + 8
s.save(out, quality=92)
print(out, s.size)
