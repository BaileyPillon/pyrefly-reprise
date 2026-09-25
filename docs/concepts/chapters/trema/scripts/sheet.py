# Decision sheet JPEG, sized to read on a phone: a question at the top, one row per view, options left
# to right, a large key letter on each cell, captions wrapped. Usage: sheet.py spec.json out.jpg
import json, sys
from PIL import Image, ImageDraw, ImageFont

spec = json.load(open(sys.argv[1], encoding='utf-8'))
out = sys.argv[2]
W = spec.get('width', 2000)
PAD, GAP = 40, 28
INK = (11, 10, 18); PAPER = (244, 241, 232); PINK = (247, 182, 217); DIM = (190, 184, 200)


def font(size, bold=False):
    f = ImageFont.truetype('bahnschrift.ttf', size)
    if bold:
        try: f.set_variation_by_name('Bold')
        except Exception: pass
    return f


def wrap(d, text, f, width):
    lines, cur = [], ''
    for w in text.split():
        t = (cur + ' ' + w).strip()
        if d.textlength(t, font=f) <= width: cur = t
        else: lines.append(cur); cur = w
    if cur: lines.append(cur)
    return lines


probe = ImageDraw.Draw(Image.new('RGB', (10, 10)))
FT, FS, FL, FC, FK = font(64, True), font(38), font(48, True), font(40), font(48, True)
title = wrap(probe, spec['title'], FT, W - 2 * PAD)
sub = wrap(probe, spec.get('subtitle', ''), FS, W - 2 * PAD)
head_h = PAD + len(title) * 76 + len(sub) * 48 + 30
rows = []
for row in spec['rows']:
    n = len(row['items']); cw = (W - 2 * PAD - GAP * (n - 1)) // n
    ims = []
    for it in row['items']:
        im = Image.open(it['img']).convert('RGB'); s = cw / im.width
        if row.get('cellH'): s = min(s, row['cellH'] / im.height)
        ims.append(im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS))
    ch = max(i.height for i in ims)
    caps = [wrap(probe, it['cap'], FC, cw) for it in row['items']]
    cap_h = max(len(c) for c in caps) * 48 + 18
    lab = wrap(probe, row['label'], FL, W - 2 * PAD)
    rows.append((row, ims, cw, ch, caps, cap_h, lab))
H = head_h + sum(len(lab) * 58 + 16 + ch + cap_h + GAP for *_, ch, caps, cap_h, lab in [(r[0], r[1], r[2], r[3], r[4], r[5], r[6]) for r in rows]) + PAD + 30
sheet = Image.new('RGB', (W, H), INK); d = ImageDraw.Draw(sheet)
d.rectangle((0, 0, 12, H), fill=PINK)
y = PAD
for t in title: d.text((PAD, y), t, font=FT, fill=PAPER); y += 76
for t in sub: d.text((PAD, y), t, font=FS, fill=DIM); y += 48
y += 30
for row, ims, cw, ch, caps, cap_h, lab in rows:
    for t in lab: d.text((PAD, y), t, font=FL, fill=PINK); y += 58
    y += 16
    for k, (it, im, cap) in enumerate(zip(row['items'], ims, caps)):
        x = PAD + k * (cw + GAP)
        d.rectangle((x, y, x + cw, y + ch), fill=(24, 22, 34))
        sheet.paste(im, (x + (cw - im.width) // 2, y + (ch - im.height) // 2))
        d.rectangle((x, y, x + cw, y + ch), outline=(90, 70, 90), width=2)
        if it.get('key'):
            kw = max(70, int(d.textlength(it['key'], font=FK)) + 34)
            d.rectangle((x, y, x + kw, y + 64), fill=PINK); d.text((x + 17, y + 8), it['key'], font=FK, fill=INK)
        cy = y + ch + 12
        for t in cap: d.text((x, cy), t, font=FC, fill=PAPER); cy += 48
    y += ch + cap_h + GAP
d.text((W - 250, H - 52), 'CONCEPT', font=font(36, True), fill=PINK)
sheet.save(out, quality=85)
print(out, sheet.size)
