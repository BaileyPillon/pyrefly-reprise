"""triple.py: BEFORE | AFTER (as built) | OPTION side by side for one chapter and viewport, labelled.
   python triple.py --a frames2 --b frames-k1304 --chapter seymour-flux --vp 1600x900 --label "Kimahri 1.304" --out findings/x.jpg [--box x0,y0,x1,y1]
"""
import argparse
import os
from PIL import Image, ImageDraw, ImageFont

ap = argparse.ArgumentParser()
ap.add_argument('--a', default='frames2')
ap.add_argument('--b', default='frames-k1304')
ap.add_argument('--chapter', required=True)
ap.add_argument('--vp', required=True)
ap.add_argument('--label', default='OPTION')
ap.add_argument('--mid-label', default='AS BUILT: Kimahri 1.211 of Tidus')
ap.add_argument('--first-label', default='BEFORE (?stature=off): all equal')
ap.add_argument('--box', default='')
ap.add_argument('--out', required=True)
ap.add_argument('--scale', type=float, default=1.0)
a = ap.parse_args()

def font(size):
    for p in ('C:/Windows/Fonts/segoeui.ttf', 'C:/Windows/Fonts/arial.ttf'):
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()

paths = [
    (os.path.join(a.a, f'{a.chapter}-{a.vp}-before.png'), a.first_label),
    (os.path.join(a.a, f'{a.chapter}-{a.vp}-after.png'), a.mid_label),
    (os.path.join(a.b, f'{a.chapter}-{a.vp}-after.png'), 'OPTION: ' + a.label),
]
ims = []
for p, _ in paths:
    im = Image.open(p).convert('RGB')
    if a.box:
        x0, y0, x1, y1 = [int(v) for v in a.box.split(',')]
        im = im.crop((x0, y0, x1, y1))
    if a.scale != 1.0:
        im = im.resize((int(im.width * a.scale), int(im.height * a.scale)), Image.LANCZOS)
    ims.append(im)
w, h = ims[0].size
bar, gutter = 30, 8
sheet = Image.new('RGB', (w * 3 + gutter * 2, h + bar), (11, 10, 18))
d = ImageDraw.Draw(sheet)
for i, (im, (_, label)) in enumerate(zip(ims, paths)):
    x = i * (w + gutter)
    sheet.paste(im, (x, bar))
    d.text((x + 8, 6), label, fill=(240, 207, 146) if i else (185, 177, 154), font=font(15))
os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
sheet.save(a.out, 'JPEG', quality=86, optimize=True)
print(a.out, os.path.getsize(a.out) // 1024, 'KB')
