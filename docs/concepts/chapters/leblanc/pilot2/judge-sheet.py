"""Independent judge sheet for Leblanc pilot 2 (one-off; not part of tools/gen).

Per state: row 1 = idle and the best candidate of each method, whole, scaled to
one height; row 2 = 1:1 head crops; row 3 = 1:1 waist (obi) crops; row 4 = 1:1
feet crops. Crops are native pixels, never resized. Writes judge-sheet.jpg (q85).
Run: D:/Tools/ComfyUI/python_embeded/python.exe -s docs/concepts/chapters/leblanc/pilot2/judge-sheet.py
"""
from PIL import Image, ImageDraw, ImageFont
import os

HERE = os.path.dirname(os.path.abspath(__file__))
R = os.path.join(HERE, 'renders')
IDLE = os.path.join(HERE, '..', '..', '..', '..', '..', 'public', 'art', 'characters', 'leblanc', 'idle.png')
H = 620
C = 260  # crop side, native pixels
# (label, file, head box origin, obi box origin) in native pixels, chosen by eye at 1:1
ROWS = {
    'hurt': [
        ('idle', IDLE, (230, 10), (250, 280)),
        ('F2 hurt: 4', 'f-hurt.2.png', (220, 0), (330, 250)),
        ('D stage 1, d1-hurt.2: 4', 'd1-hurt.2.png', (220, 0), (330, 250)),
        ('D final, d2-hurt.3: 3', 'd2-hurt.3.png', (150, 0), (230, 330)),
        ('E4 hurt: 4', 'e-hurt.4.png', (340, 20), (250, 230)),
    ],
    'attack': [
        ('idle', IDLE, (230, 10), (250, 280)),
        ('F4 attack: 4', 'f-attack.4.png', (110, 10), (230, 330)),
        ('D stage 1, d1-attack.4: 4', 'd1-attack.4.png', (110, 10), (230, 330)),
        ('D final, d2-attack.4: 3', 'd2-attack.4.png', (110, 10), (230, 330)),
        ('E3 attack: 2', 'e-attack.3.png', (200, 10), (220, 280)),
    ],
}


def flat(p):
    im = Image.open(p if os.path.isabs(p) else os.path.join(R, p)).convert('RGBA')
    bg = Image.new('RGB', im.size, (205, 205, 205))
    bg.paste(im, (0, 0), im)
    a = im.split()[-1]
    return bg, a


def feet(bg, a):
    w, h = bg.size
    box = a.getbbox()
    y1 = box[3]
    band = a.crop((0, max(0, y1 - 120), w, y1))
    xs = [x for x in range(w) if band.crop((x, 0, x + 1, band.height)).getbbox()]
    cx = (xs[0] + xs[-1]) // 2 if xs else w // 2
    x0, x1 = (xs[0], xs[-1] + 1) if xs else (0, w)
    return bg.crop((x0, max(0, y1 - C), x1, max(0, y1 - C) + C))


font = ImageFont.truetype('arial.ttf', 20)
blocks = []
for state, items in ROWS.items():
    whole, heads, obis, foots = [], [], [], []
    for lab, f, hb, ob in items:
        bg, a = flat(f)
        s = H / bg.height
        whole.append((lab, bg.resize((int(bg.width * s), H), Image.LANCZOS)))
        heads.append(bg.crop((hb[0], hb[1], hb[0] + C, hb[1] + C)))
        obis.append(bg.crop((ob[0], ob[1], ob[0] + C, ob[1] + C)))
        foots.append(feet(bg, a))
    colw = [max(w.width, C * 2, foots[i].width) for i, (_, w) in enumerate(whole)]
    W = sum(colw) + 12 * len(colw)
    hh = 34 + H + 8 + C + 8 + C + 12
    blk = Image.new('RGB', (W, hh), (255, 255, 255))
    d = ImageDraw.Draw(blk)
    x = 0
    for i, (lab, w) in enumerate(whole):
        d.text((x + 4, 6), f'{state}: {lab}', fill=(0, 0, 0), font=font)
        blk.paste(w, (x, 34))
        y = 34 + H + 8
        blk.paste(heads[i], (x, y))
        blk.paste(obis[i], (x + C, y))
        blk.paste(foots[i], (x, y + C + 8))
        x += colw[i] + 12
    blocks.append(blk)

W = max(b.width for b in blocks)
out = Image.new('RGB', (W, sum(b.height for b in blocks) + 20), (255, 255, 255))
y = 0
for b in blocks:
    out.paste(b, (0, y))
    y += b.height + 20
out.save(os.path.join(HERE, 'judge-sheet.jpg'), quality=85)
print(out.size)
