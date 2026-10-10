"""lineup-compose.py: the seven heroes in one row, BEFORE (all equal) above AFTER (the table), labelled, from lineup/lineup-before|after.png and .json.
   python lineup-compose.py --dir lineup --out lineup-before-after.jpg [--third lineup-k1304 --third-label "Kimahri 1.304"]
"""
import argparse
import json
import os
from PIL import Image, ImageDraw, ImageFont

ap = argparse.ArgumentParser()
ap.add_argument('--dir', default='lineup')
ap.add_argument('--out', required=True)
ap.add_argument('--third', default='')
ap.add_argument('--third-label', default='OPTION')
a = ap.parse_args()


def font(size):
    for p in ('C:/Windows/Fonts/segoeui.ttf', 'C:/Windows/Fonts/arial.ttf'):
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()

def load(d, tag):
    im = Image.open(os.path.join(d, f'lineup-{tag}.png')).convert('RGB')
    rows = json.load(open(os.path.join(d, f'lineup-{tag}.json')))
    return im, rows

panels = [('BEFORE (?stature=off): the seven at the party height, all drawn alike', *load(a.dir, 'before'), False),
          ('AFTER: the table (heights next to Tidus 1.000)', *load(a.dir, 'after'), True)]
if a.third:
    panels.append((f'OPTION: {a.third_label}', *load(a.third, 'after'), True))

# one crop band for every panel, so the rows are comparable
y0 = int(min(r['y'] for _, _, rows, _ in panels for r in rows) - 50)
y1 = int(max(r['y'] + r['h'] for _, _, rows, _ in panels for r in rows) + 40)
y0 = max(0, y0)
tag_font, title_font = font(17), font(19)
W = panels[0][1].width
bar = 34
sheet = Image.new('RGB', (W, (y1 - y0 + bar) * len(panels)), (11, 10, 18))
d = ImageDraw.Draw(sheet)
for i, (title, im, rows, after) in enumerate(panels):
    oy = i * (y1 - y0 + bar)
    sheet.paste(im.crop((0, y0, W, y1)), (0, oy + bar))
    d.text((10, oy + 6), title, fill=(240, 207, 146) if after else (185, 177, 154), font=title_font)
    tidus = next(r for r in rows if r['id'] == 'tidus')
    ty = oy + bar + tidus['y'] - y0
    for x in range(0, W, 14):  # Tidus's top, dashed across the row
        d.line((x, ty, x + 7, ty), fill=(240, 207, 146), width=1)
    for r in rows:
        label = r['id'].capitalize() + (f"  {r['ratio']:.3f}" if after else '')
        tw = d.textlength(label, font=tag_font)
        cx = r['x'] + r['w'] / 2
        tx = max(4, min(W - tw - 14, cx - tw / 2 - 5))
        yy = oy + bar + r['y'] - y0 - 24
        d.rounded_rectangle((tx, yy, tx + tw + 10, yy + 20), radius=4, fill=(11, 10, 18), outline=(240, 207, 146) if after else (120, 114, 100))
        d.text((tx + 5, yy + 1), label, fill=(240, 207, 146) if after else (185, 177, 154), font=tag_font)
sheet.save(a.out, 'JPEG', quality=88, optimize=True)
print(a.out, sheet.size, os.path.getsize(a.out) // 1024, 'KB')
