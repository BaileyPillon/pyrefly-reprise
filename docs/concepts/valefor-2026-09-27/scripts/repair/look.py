# Contact strip of cut-outs on a mid grey (and a dark cavern blue), for looking.
# usage: look.py <out.jpg> <cutout.png> [...]
import sys
from PIL import Image, ImageDraw

out, files = sys.argv[1], sys.argv[2:]
cells = []
for f in files:
    im = Image.open(f).convert('RGBA')
    im.thumbnail((640, 400))
    cell = Image.new('RGBA', (1300, 430), (0, 0, 0, 255))
    for i, col in enumerate([(92, 92, 92, 255), (22, 30, 44, 255)]):
        g = Image.new('RGBA', (650, 430), col)
        g.alpha_composite(im, ((650 - im.width) // 2, 24 + (400 - im.height) // 2))
        cell.paste(g, (i * 650, 0))
    ImageDraw.Draw(cell).text((6, 4), f.replace('\\', '/').split('/')[-1], fill=(255, 255, 0, 255))
    cells.append(cell)
sheet = Image.new('RGB', (1300, 430 * len(cells)))
for i, c in enumerate(cells):
    sheet.paste(c.convert('RGB'), (0, i * 430))
sheet.save(out, quality=86)
print(out)
