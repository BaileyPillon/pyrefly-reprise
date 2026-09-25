"""Build sheet.jpg (phone-readable), the per-option JPEGs and crops-1to1.jpg for one chapter's
hero-plate round, and write each option's 2x master (lanczos, disclosed) for the captures.

  python sheet.py <cfg.json> master     -> <src>/<k>.2x.webp from <src>/<k>.png
  python sheet.py <cfg.json> sheet      -> the docs folder's sheet.jpg and friends
The cfg is scripts/cfg.json plus: "docs", "title", "names" {a,b,c}, "orig" (host label),
"crops" [[k, x0, y0, x1, y1, label], ...].
"""
import json
import sys

from PIL import Image, ImageDraw, ImageFont

cfg = json.load(open(sys.argv[1], encoding='utf8'))
S, SH, D = cfg['src'], cfg['out'], cfg['docs']


def font(sz):
    for f in ('C:/Windows/Fonts/segoeuib.ttf', 'C:/Windows/Fonts/arialbd.ttf'):
        try:
            return ImageFont.truetype(f, sz)
        except OSError:
            pass
    return ImageFont.load_default()


if sys.argv[2] == 'master':
    for k in 'abc':
        im = Image.open(S + f'{k}.png').convert('RGB')
        im.resize((im.width * 2, im.height * 2), Image.LANCZOS).save(S + f'{k}.2x.webp', quality=88)
    print('masters ok')
    sys.exit(0)

for k in 'abc':
    Image.open(S + f'{k}.png').convert('RGB').save(D + f'{k}-plate.jpg', quality=90)
    for s in ('pause', 'card'):
        Image.open(SH + f'{k}-{s}.png').convert('RGB').save(D + f'{k}-{s}.jpg', quality=88)
Image.open(SH + 'orig-pause.png').convert('RGB').save(D + 'ref-host-pause.jpg', quality=85)

# Phone-readable: one column, each option = its plate then its two captures side by side,
# 1200 px wide, 44 px headings, 30 px captions (about 13 CSS px on a 390 px phone).
Wd = 1200
F, Fm, Fs = font(46), font(38), font(30)
blocks = []
for k in 'abc':
    ph = int(Wd * 768 / 1344)
    cw = (Wd - 20) // 2
    chh = int(cw * 900 / 1600)
    b = Image.new('RGB', (Wd, 70 + ph + 50 + chh + 60), (16, 16, 22))
    d = ImageDraw.Draw(b)
    d.text((10, 10), cfg['names'][k], fill=(240, 240, 240), font=Fm)
    b.paste(Image.open(S + f'{k}.png').convert('RGB').resize((Wd, ph), Image.LANCZOS), (0, 70))
    d.text((10, 70 + ph + 6), 'the plate, 1344x768', fill=(170, 170, 170), font=Fs)
    y = 70 + ph + 50
    b.paste(Image.open(SH + f'{k}-pause.png').convert('RGB').resize((cw, chh), Image.LANCZOS), (0, y))
    b.paste(Image.open(SH + f'{k}-card.png').convert('RGB').resize((cw, chh), Image.LANCZOS), (cw + 20, y))
    d.text((10, y + chh + 10), 'pause CHAPTER tab', fill=(170, 170, 170), font=Fs)
    d.text((cw + 30, y + chh + 10), 'chapter card (party prep)', fill=(170, 170, 170), font=Fs)
    blocks.append(b)
head = Image.new('RGB', (Wd, 130), (16, 16, 22))
dh = ImageDraw.Draw(head)
dh.text((10, 10), cfg['title'], fill=(230, 200, 120), font=F)
dh.text((10, 72), 'CONCEPT, nothing installed. Captures 1600x900, real GPU.', fill=(200, 200, 200), font=Fs)
tot = head.height + sum(b.height for b in blocks)
sheet = Image.new('RGB', (Wd, tot), (16, 16, 22))
y = 0
for b in [head] + blocks:
    sheet.paste(b, (0, y))
    y += b.height
sheet.save(D + 'sheet.jpg', quality=84)

crops = cfg.get('crops', [])
if crops:
    ims = []
    for k, x0, y0, x1, y1, lab in crops:
        ims.append((Image.open(S + f'{k}.png').convert('RGB').crop((x0, y0, x1, y1)), lab))
    wtot = sum(i.width for i, _ in ims) + 15 * (len(ims) + 1)
    htot = max(i.height for i, _ in ims) + 50
    r = Image.new('RGB', (wtot, htot), (16, 16, 22))
    dd = ImageDraw.Draw(r)
    x = 15
    for im, lab in ims:
        r.paste(im, (x, 42))
        dd.text((x, 8), lab, fill=(230, 230, 230), font=font(24))
        x += im.width + 15
    r.save(D + 'crops-1to1.jpg', quality=90)
print('sheet ok', sheet.size)
