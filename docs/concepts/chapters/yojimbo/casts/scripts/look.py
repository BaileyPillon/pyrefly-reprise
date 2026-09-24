"""Side-by-side look sheet of repaint outputs (JPEG, scratch only).
   python look.py <out.jpg> <x0> <y0> <x1> <y1> <scale> <img1> <img2> ...   (coords in the images' own pixels)"""
import sys
import numpy as np, cv2
from PIL import Image, ImageDraw
out = sys.argv[1]; x0, y0, x1, y1 = map(int, sys.argv[2:6]); sc = float(sys.argv[6]); paths = sys.argv[7:]
tiles = []
for p in paths:
    im = Image.open(p).convert('RGBA'); bg = Image.new('RGBA', im.size, (128, 128, 128, 255)); bg.alpha_composite(im)
    c = bg.crop((x0, y0, x1, y1)).convert('RGB')
    c = c.resize((int(c.width * sc), int(c.height * sc)), Image.LANCZOS if sc < 1 else Image.NEAREST)
    d = ImageDraw.Draw(c); d.rectangle([0, 0, 200, 14], fill=(0, 0, 0)); d.text((3, 2), p.replace('\\', '/').split('/')[-1], fill=(255, 255, 0))
    tiles.append(np.array(c))
h = max(t.shape[0] for t in tiles)
row = np.concatenate([np.pad(t, ((0, h - t.shape[0]), (0, 4), (0, 0)), constant_values=40) for t in tiles], 1)
Image.fromarray(row).save(out, quality=90)
print(row.shape)
