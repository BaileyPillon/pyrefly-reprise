# FF7 art cleanup round (2026-09-27): the compact before/after sheet (12-cleanup-before-after.jpg).
# One band per subject: the old cut-out and the new one on a mid-grey card, then close-ups of every
# fixed spot, BEFORE left and AFTER right, taken from the full frames (same coordinates).
# Usage: sheet-cleanup.py <candidates-root> <out.jpg>
import os
import sys
from PIL import Image, ImageDraw, ImageFont

root, out = sys.argv[1], sys.argv[2]
R = lambda p: os.path.join(root, p)
try:
    F = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 15)
    FB = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 19)
except Exception:
    F = FB = ImageFont.load_default()

BANDS = [
    ('Barret  barret/round2-repair/idle-r2.1  ->  barret/cleanup/idle-c.1',
     'barret/round2-repair/idle-r2.1.png', 'barret/cleanup/idle-c.1.png',
     'barret/round2-repair/hair2.1.full.png', 'barret/cleanup/idle-c.1.full.png',
     [('hi-top: texture, soft edge', (340, 90, 500, 230)), ('armholes: fleece removed', (262, 280, 662, 440)),
      ('waist: metal bands', (300, 490, 600, 800)), ('boots matte / far arm', (120, 350, 680, 1190))]),
    ('Cloud  cloud/round2/turn-a.2  ->  cloud/cleanup/idle-c.1',
     'cloud/round2/turn-a.2.png', 'cloud/cleanup/idle-c.1.png',
     'cloud/round2/turn-a.2.raw.png', 'cloud/cleanup/idle-c.1.full.png',
     [('band now on RIGHT wrist (far)', (280, 480, 540, 640)), ('hair edge fringe (cut-out)', (300, 40, 580, 240))]),
    ('Guard Scorpion idle  idle-a.2  ->  guard-scorpion/cleanup/idle-c.1',
     'guard-scorpion/round2/idle-a.2.png', 'guard-scorpion/cleanup/idle-c.1.png',
     'guard-scorpion/round2/idle-a.2.raw.png', 'guard-scorpion/cleanup/idle-clean.full.png',
     [('back box: glyphs removed', (640, 236, 740, 300)), ('plate by the eye', (930, 555, 1045, 612))]),
    ('Guard Scorpion raised  cut-raised-r.a.2  ->  guard-scorpion/cleanup/raised-c.1',
     'guard-scorpion/round2-repair/cut-raised-r.a.2.png', 'guard-scorpion/cleanup/raised-c.1.png',
     'guard-scorpion/round2-repair/raised-r.a.2.full.png', 'guard-scorpion/cleanup/raised-clean.full.png',
     [('tail segments', (150, 95, 440, 450)), ('back box', (640, 236, 740, 300))]),
]

BH, FW, CH = 340, 210, 150  # figure card height, figure card width, close-up height
CW = 2 * 470  # width of the close-up area
W = 12 + 2 * (FW + 8) + 12 + CW + 12


def card(path, w, h):
    c = Image.new('RGB', (w, h), (128, 126, 132))
    im = Image.open(path).convert('RGBA')
    s = min(w / im.width, h / im.height)
    im = im.resize((max(1, int(im.width * s)), max(1, int(im.height * s))), Image.LANCZOS)
    c.paste(im, ((w - im.width) // 2, (h - im.height) // 2), im)
    return c


def crop(path, box, h):
    im = Image.open(path).convert('RGB').crop(box)
    s = h / im.height
    return im.resize((max(1, int(im.width * s)), h), Image.LANCZOS)


def band(title, bcut, acut, bfull, afull, closeups):
    img = Image.new('RGB', (W, 2000), (38, 36, 44))
    d = ImageDraw.Draw(img)
    d.text((12, 4), title, fill=(220, 220, 225), font=FB)
    top = 32
    img.paste(card(R(bcut), FW, BH), (12, top))
    img.paste(card(R(acut), FW, BH), (12 + FW + 8, top))
    d.text((16, top + 2), 'before', fill=(20, 20, 24), font=F)
    d.text((16 + FW + 8, top + 2), 'after', fill=(20, 20, 24), font=F)
    x0 = 12 + 2 * (FW + 8) + 12
    cx, cy, bottom = x0, top, top + BH
    for label, box in closeups:
        b, a = crop(R(bfull), box, CH), crop(R(afull), box, CH)
        if b.width * 2 + 4 > CW:
            k = (CW - 4) / (b.width * 2)
            b = b.resize((int(b.width * k), int(b.height * k)))
            a = a.resize((int(a.width * k), int(a.height * k)))
        if cx + b.width * 2 + 4 > x0 + CW:
            cx, cy = x0, bottom_row + 4
        img.paste(b, (cx, cy))
        img.paste(a, (cx + b.width + 4, cy))
        d.text((cx + 2, cy + b.height + 1), label, fill=(236, 214, 150), font=F)
        bottom_row = cy + b.height + 20
        bottom = max(bottom, bottom_row)
        cx += b.width * 2 + 16
    return img.crop((0, 0, W, bottom + 10))


parts = [band(*b) for b in BANDS]
H = 40 + sum(p.height for p in parts)
sheet = Image.new('RGB', (W, H), (38, 36, 44))
ImageDraw.Draw(sheet).text((12, 10), 'FF7 art cleanup, 2026-09-27: BEFORE (left of each pair) and AFTER (right). '
                           'FF7 only. Not installed.', fill=(236, 214, 150), font=FB)
y = 40
for p in parts:
    sheet.paste(p, (0, y))
    y += p.height
q = 88
while True:
    sheet.save(out, 'JPEG', quality=q, optimize=True)
    if os.path.getsize(out) < 1_000_000 or q <= 50:
        break
    q -= 6
print(out, sheet.size, os.path.getsize(out))
