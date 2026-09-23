"""Head-length helper (read by eye, at 1:1): a crop of a cutout on grey with a 10 px grid
(labels every 50 px in the cutout's own coordinates), scaled 2x nearest.
python -s head-grid.py <cutout.png> <l,t,r,b> <out.png>"""
import sys
from PIL import Image, ImageDraw
src, box, out = sys.argv[1:]
l, t, r, b = [int(v) for v in box.split(',')]
im = Image.open(src).convert('RGBA')
bg = Image.new('RGBA', im.size, (150, 150, 150, 255)); bg.alpha_composite(im)
c = bg.convert('RGB').crop((l, t, r, b))
k = 2
c = c.resize((c.width * k, c.height * k), Image.NEAREST)
d = ImageDraw.Draw(c)
for x in range((l // 10 + 1) * 10, r, 10):
    col = (255, 0, 0) if x % 50 == 0 else (255, 180, 180)
    d.line([((x - l) * k, 0), ((x - l) * k, c.height)], fill=col, width=1)
    if x % 50 == 0: d.text(((x - l) * k + 2, 2), str(x), fill=(255, 255, 0))
for y in range((t // 10 + 1) * 10, b, 10):
    col = (0, 0, 255) if y % 50 == 0 else (180, 180, 255)
    d.line([(0, (y - t) * k), (c.width, (y - t) * k)], fill=col, width=1)
    if y % 50 == 0: d.text((2, (y - t) * k + 2), str(y), fill=(255, 255, 0))
c.save(out)
