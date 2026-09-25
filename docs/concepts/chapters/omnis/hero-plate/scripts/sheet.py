"""Build a phone-readable one-column sheet.jpg and the per-option JPEGs for a hero-plate round.

  python sheet.py <key> "<heading>" "<a title>" "<b title>" "<c title>"

Reads D:/Tools/pyrefly-scratch/hero-plates/<key>/{options,shots}/ and writes into
docs/concepts/chapters/<key>/hero-plate/. One column, 1200 px wide: shown 390 px wide on a
phone, the 40 px words become 13 px (the chapter rounds' 12.5 px floor).
"""
import sys
from PIL import Image, ImageDraw, ImageFont

key, heading, *titles = sys.argv[1:]
S = f'D:/Tools/pyrefly-scratch/hero-plates/{key}/'
D = f'D:/Final Fantasy/docs/concepts/chapters/{key}/hero-plate/'


def font(sz, bold=True):
    for f in (('C:/Windows/Fonts/segoeuib.ttf' if bold else 'C:/Windows/Fonts/segoeui.ttf'), 'C:/Windows/Fonts/arialbd.ttf'):
        try:
            return ImageFont.truetype(f, sz)
        except OSError:
            pass
    return ImageFont.load_default()


def wrap(d, text, f, width):
    words, lines, cur = text.split(), [], ''
    for w in words:
        t = (cur + ' ' + w).strip()
        if d.textlength(t, font=f) > width and cur:
            lines.append(cur)
            cur = w
        else:
            cur = t
    lines.append(cur)
    return lines


for k in 'abc':
    Image.open(S + f'options/{k}.png').convert('RGB').save(D + f'{k}-plate.jpg', quality=90)
    for s in ('pause', 'card'):
        Image.open(S + f'shots/{k}-{s}.png').convert('RGB').save(D + f'{k}-{s}.jpg', quality=86)

CW = 1200
PH = round(CW * 768 / 1344)
SH = round(CW * 900 / 1600)
F, Fc = font(44), font(40, False)
probe = ImageDraw.Draw(Image.new('RGB', (10, 10)))
head_lines = wrap(probe, heading, F, CW - 40)
blocks = []
for k, t in zip('abc', titles):
    blocks.append((k, wrap(probe, t, F, CW - 40)))
cap_h = 58
height = 30 + len(head_lines) * 56 + 30
for k, lines in blocks:
    height += 40 + len(lines) * 56 + 10 + (PH + cap_h) + 2 * (SH + cap_h)
sh = Image.new('RGB', (CW, height + 20), (16, 16, 22))
d = ImageDraw.Draw(sh)
y = 30
for ln in head_lines:
    d.text((20, y), ln, fill=(230, 200, 120), font=F)
    y += 56
y += 30
for k, lines in blocks:
    y += 40
    for ln in lines:
        d.text((20, y), ln, fill=(245, 245, 245), font=F)
        y += 56
    y += 10
    sh.paste(Image.open(S + f'options/{k}.png').convert('RGB').resize((CW, PH), Image.LANCZOS), (0, y))
    y += PH
    d.text((20, y + 6), 'the plate, 1344x768', fill=(175, 175, 175), font=Fc)
    y += cap_h
    for s, cap in (('pause', 'on the pause CHAPTER tab, 1600x900'), ('card', 'on the party-prep chapter card, 1600x900')):
        sh.paste(Image.open(S + f'shots/{k}-{s}.png').convert('RGB').resize((CW, SH), Image.LANCZOS), (0, y))
        y += SH
        d.text((20, y + 6), cap, fill=(175, 175, 175), font=Fc)
        y += cap_h
sh.save(D + 'sheet.jpg', quality=84)
print('sheet', sh.size)
