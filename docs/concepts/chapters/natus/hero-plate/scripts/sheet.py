"""Build sheet.jpg (phone-readable), the per-option JPEGs and crops-1to1.jpg for a hero-plate round.

    python sheet.py natus|fa

Reads D:/Tools/pyrefly-scratch/hero-plates/<dir>/{options,shots}/ and writes into
docs/concepts/chapters/<dir>/hero-plate/. Labels come from labels-<ch>.json next to this file.
"""
import json
import sys
from PIL import Image, ImageDraw, ImageFont

CH = sys.argv[1]
DIR = {'natus': 'natus', 'fa': 'fallen-aeons'}[CH]
S = f'D:/Tools/pyrefly-scratch/hero-plates/{DIR}/'
D = f'D:/Final Fantasy/docs/concepts/chapters/{DIR}/hero-plate/'
L = json.load(open(f'D:/Final Fantasy/docs/concepts/chapters/natus/hero-plate/scripts/labels-{CH}.json', encoding='utf8'))


def font(sz):
    for f in ('C:/Windows/Fonts/segoeuib.ttf', 'C:/Windows/Fonts/arialbd.ttf'):
        try:
            return ImageFont.truetype(f, sz)
        except OSError:
            pass
    return ImageFont.load_default()


for k in 'abc':
    Image.open(S + f'options/{k}.png').convert('RGB').save(D + f'{k}-plate.jpg', quality=90)
    for s in ('pause', 'card'):
        Image.open(S + f'shots/{k}-{s}.png').convert('RGB').save(D + f'{k}-{s}.jpg', quality=88)

# Phone-readable: one option per row, the plate large on top and the two surfaces under it,
# 1200 px wide so a phone shows it at full width without zooming into tiny text.
PW = 1200
ph = round(PW * 768 / 1344)
sw = (PW - 20) // 2
sh_ = round(sw * 900 / 1600)
title_h, lab_h = 110, 56
row_h = lab_h + ph + 12 + sh_ + 44
sheet = Image.new('RGB', (PW + 40, title_h + row_h * 3 + 20), (16, 16, 22))
d = ImageDraw.Draw(sheet)
d.text((20, 16), L['title'], fill=(230, 200, 120), font=font(34))
d.text((20, 62), L['subtitle'], fill=(200, 200, 200), font=font(22))
for i, k in enumerate('abc'):
    y = title_h + i * row_h
    d.text((20, y + 8), L[k], fill=(255, 225, 150) if L.get('rec') == k else (240, 240, 240), font=font(30))
    sheet.paste(Image.open(S + f'options/{k}.png').convert('RGB').resize((PW, ph), Image.LANCZOS), (20, y + lab_h))
    yy = y + lab_h + ph + 12
    for j, s in enumerate(('pause', 'card')):
        sheet.paste(Image.open(S + f'shots/{k}-{s}.png').convert('RGB').resize((sw, sh_), Image.LANCZOS), (20 + j * (sw + 20), yy))
    d.text((20, yy + sh_ + 6), 'pause CHAPTER tab, 1600x900', fill=(170, 170, 170), font=font(20))
    d.text((20 + sw + 20, yy + sh_ + 6), 'party-prep chapter card, 1600x900', fill=(170, 170, 170), font=font(20))
sheet.save(D + 'sheet.jpg', quality=85)

# 1:1 crops named in labels (the faces and the composite joins), for the look at full size.
crops = L.get('crops', [])
if crops:
    ims = []
    for c in crops:
        im = Image.open(S + c['src']).convert('RGB').crop(tuple(c['box']))
        ims.append((im, c['label']))
    W = sum(im.width for im, _ in ims) + 15 * (len(ims) + 1)
    H = max(im.height for im, _ in ims) + 40
    r = Image.new('RGB', (W, H), (16, 16, 22))
    dd = ImageDraw.Draw(r)
    x = 15
    for im, lab in ims:
        r.paste(im, (x, 34))
        dd.text((x, 6), lab, fill=(230, 230, 230), font=font(18))
        x += im.width + 15
    r.save(D + 'crops-1to1.jpg', quality=90)
print('sheet', D + 'sheet.jpg')
