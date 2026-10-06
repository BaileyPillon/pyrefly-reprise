"""Amplified difference of look N vs off over a region.  python diff.py <dir> <chapter> <x0,y0,x1,y1> <looks csv> <out.png> [zoom] [gain]"""
import sys, numpy as np
from PIL import Image
d, ch, box, looks, out = sys.argv[1:6]
zoom = float(sys.argv[6]) if len(sys.argv) > 6 else 2.0
gain = float(sys.argv[7]) if len(sys.argv) > 7 else 4.0
x0, y0, x1, y1 = [int(v) for v in box.split(',')]
base = np.asarray(Image.open(f'{d}/{ch}__off__canvas.png').convert('RGB').crop((x0, y0, x1, y1))).astype(float)
tiles = []
for look in looks.split(','):
    on = np.asarray(Image.open(f'{d}/{ch}__{look}__canvas.png').convert('RGB').crop((x0, y0, x1, y1))).astype(float)
    df = np.clip(128 + (on - base) * gain, 0, 255).astype(np.uint8)
    tiles.append(Image.fromarray(df).resize((int((x1 - x0) * zoom), int((y1 - y0) * zoom)), Image.NEAREST))
W = sum(t.size[0] for t in tiles) + 6 * (len(tiles) - 1)
s = Image.new('RGB', (W, tiles[0].size[1])); x = 0
for t in tiles: s.paste(t, (x, 0)); x += t.size[0] + 6
s.save(out); print(s.size)
