"""Side-by-side crops of the same region across looks.
  python crops.py <dir> <chapter> <x0,y0,x1,y1> <looks csv> <out.png> [zoom]
"""
import sys
from PIL import Image, ImageDraw

d, chapter, box, looks, out = sys.argv[1:6]
zoom = float(sys.argv[6]) if len(sys.argv) > 6 else 2.0
x0, y0, x1, y1 = [int(v) for v in box.split(',')]
tiles = []
for look in looks.split(','):
    im = Image.open(f'{d}/{chapter}__{look}__canvas.png').convert('RGB').crop((x0, y0, x1, y1))
    im = im.resize((int((x1 - x0) * zoom), int((y1 - y0) * zoom)), Image.LANCZOS)
    dr = ImageDraw.Draw(im)
    dr.rectangle((0, 0, 70, 16), fill=(0, 0, 0))
    dr.text((4, 2), 'OFF' if look == 'off' else f'LOOK {look}', fill=(255, 255, 255))
    tiles.append(im)
W = sum(t.size[0] for t in tiles) + 6 * (len(tiles) - 1)
sheet = Image.new('RGB', (W, tiles[0].size[1]), (0, 0, 0))
x = 0
for t in tiles:
    sheet.paste(t, (x, 0))
    x += t.size[0] + 6
sheet.save(out)
print(sheet.size)
