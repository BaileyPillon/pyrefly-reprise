# Build a decision sheet JPEG: a title, then one row per question, options left to right.
# Usage: sheet.py spec.json out.jpg
import json, sys
from PIL import Image, ImageDraw, ImageFont

spec = json.load(open(sys.argv[1], encoding='utf-8'))
out = sys.argv[2]
W = spec.get('width', 2400)
PAD = 36; GAP = 24; LABEL_H = 64; CAP_H = 58
INK = (11, 10, 18); PAPER = (244, 241, 232); GOLD = (227, 185, 74); DIM = (170, 164, 180)

def font(size, bold=False):
    for name in (['bahnschrift.ttf'] if not bold else ['bahnschrift.ttf']):
        try:
            f = ImageFont.truetype(name, size)
            if bold:
                try: f.set_variation_by_name('Bold')
                except Exception: pass
            return f
        except Exception:
            pass
    return ImageFont.load_default()

rows = []
for row in spec['rows']:
    n = len(row['items']); cw = (W - 2 * PAD - GAP * (n - 1)) // n
    ims = []
    for it in row['items']:
        im = Image.open(it['img']).convert('RGB')
        if it.get('bg'):
            pass
        s = cw / im.width
        h = row.get('cellH')
        if h:
            s = min(s, h / im.height)
        im = im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)
        ims.append(im)
    ch = max(i.height for i in ims)
    rows.append((row, ims, cw, ch))

H = PAD + 90 + sum(LABEL_H + ch + CAP_H + GAP for _, _, _, ch in rows) + PAD
sheet = Image.new('RGB', (W, H), INK); d = ImageDraw.Draw(sheet)
d.rectangle((0, 0, 10, H), fill=GOLD)
d.text((PAD, PAD), spec['title'], font=font(44, True), fill=PAPER)
d.text((PAD, PAD + 54), spec.get('subtitle', ''), font=font(22), fill=DIM)
y = PAD + 100
for row, ims, cw, ch in rows:
    d.text((PAD, y + 12), row['label'], font=font(30, True), fill=GOLD)
    y += LABEL_H
    for k, (it, im) in enumerate(zip(row['items'], ims)):
        x = PAD + k * (cw + GAP)
        bgc = tuple(it.get('cellBg', (24, 22, 34)))
        d.rectangle((x, y, x + cw, y + ch), fill=bgc)
        sheet.paste(im, (x + (cw - im.width) // 2, y + (ch - im.height) // 2))
        d.rectangle((x, y, x + cw, y + ch), outline=(80, 70, 50), width=2)
        if it.get('key'):
            d.rectangle((x, y, x + 54, y + 44), fill=GOLD)
            d.text((x + 16, y + 6), it['key'], font=font(28, True), fill=INK)
        d.text((x, y + ch + 10), it['cap'], font=font(22), fill=PAPER)
    y += ch + CAP_H + GAP
d.text((W - 190, H - 40), 'CONCEPT', font=font(22, True), fill=GOLD)
sheet.save(out, quality=86)
print(out, sheet.size)
