"""crop.py: a BEFORE | AFTER crop of one chapter's frames, labelled, for the findings.
   python crop.py --frames frames2 --chapter seymour-flux --vp 1600x900 --box 560,280,1360,700 --title "..." --out findings/x.jpg [--scale 1.0]
"""
import argparse
import os
from PIL import Image, ImageDraw, ImageFont

ap = argparse.ArgumentParser()
ap.add_argument('--frames', default='frames2')
ap.add_argument('--chapter', required=True)
ap.add_argument('--vp', required=True)
ap.add_argument('--box', required=True)
ap.add_argument('--title', default='')
ap.add_argument('--out', required=True)
ap.add_argument('--scale', type=float, default=1.0)
a = ap.parse_args()

x0, y0, x1, y1 = [int(v) for v in a.box.split(',')]
def font(size):
    for p in ('C:/Windows/Fonts/segoeui.ttf', 'C:/Windows/Fonts/arial.ttf'):
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()

crops = []
for m in ('before', 'after'):
    im = Image.open(os.path.join(a.frames, f'{a.chapter}-{a.vp}-{m}.png')).convert('RGB').crop((x0, y0, x1, y1))
    if a.scale != 1.0:
        im = im.resize((int(im.width * a.scale), int(im.height * a.scale)), Image.LANCZOS)
    crops.append(im)
w, h = crops[0].size
bar, gutter = 34, 8
sheet = Image.new('RGB', (w * 2 + gutter, h + bar), (11, 10, 18))
sheet.paste(crops[0], (0, bar))
sheet.paste(crops[1], (w + gutter, bar))
d = ImageDraw.Draw(sheet)
d.text((8, 7), 'BEFORE (?stature=off)  ' + a.title, fill=(185, 177, 154), font=font(15))
d.text((w + gutter + 8, 7), 'AFTER', fill=(240, 207, 146), font=font(15))
os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
sheet.save(a.out, 'JPEG', quality=88, optimize=True)
print(a.out, os.path.getsize(a.out) // 1024, 'KB')
