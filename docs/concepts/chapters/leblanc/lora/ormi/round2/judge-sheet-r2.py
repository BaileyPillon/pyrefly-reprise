"""Ormi round 2, independent judge sheet (FFX-2 only). Reads only; renders nothing.

Rows: (1) idle + the four installed round-2 candidates, whole, at idle's pixel scale
times each sidecar 'scale' (how PaintedActor sizes them); (2) the round-1 redo files
they replaced (backup), same rule; (3) the painter's in-game crops from a running
battle (ingame-r2-*.png); (4..) native 1:1 crops: heads, shields, costume defects.
Usage: python judge-sheet-r2.py; writes
round2/judge-sheet.jpg (round 1's ../judge-sheet.jpg is not touched)
"""
import json, os
from PIL import Image, ImageDraw, ImageFont

ROOT = 'D:/Final Fantasy'
ART = ROOT + '/public/art/characters/ormi'
R1 = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-23-lora-r2/ormi/replaced'
R2DIR = ROOT + '/docs/concepts/chapters/leblanc/lora/ormi/round2'
OUT = R2DIR + '/judge-sheet.jpg'
W = 2400
BG = (238, 238, 238)
TILE = (200, 200, 200)
try:
    FONT = ImageFont.truetype('arial.ttf', 22)
    BIG = ImageFont.truetype('arialbd.ttf', 28)
except OSError:
    FONT = BIG = ImageFont.load_default()


def load(p):
    im = Image.open(p).convert('RGBA')
    c = Image.new('RGB', im.size, TILE)
    c.paste(im, (0, 0), im)
    return im, c


def scale_of(p):
    j = json.load(open(p[:-4] + '.json'))
    return j.get('scale') or 1.0


def whole_row(paths, labels, factor):
    tiles = []
    for p, lab in zip(paths, labels):
        im, _ = load(p)
        f = scale_of(p) * factor
        t = im.resize((round(im.width * f), round(im.height * f)), Image.LANCZOS)
        tiles.append((t, lab))
    h = max(t.height for t, _ in tiles) + 34
    row = Image.new('RGB', (W, h), BG)
    x = 10
    d = ImageDraw.Draw(row)
    for t, lab in tiles:
        row.paste(t, (x, h - t.height), t)
        d.text((x, 4), lab, fill=(0, 0, 0), font=FONT)
        x += t.width + 30
    return row


def crop_row(title, items):
    """items: (image path, box, label); pasted at native 1:1, wrapped at W."""
    lines, cur, cx = [], [], 10
    for p, box, lab in items:
        _, c = load(p)
        t = c.crop(box)
        if cx + t.width > W - 10 and cur:
            lines.append(cur); cur, cx = [], 10
        cur.append((t, lab, cx)); cx += t.width + 16
    if cur:
        lines.append(cur)
    parts = []
    for ln in lines:
        h = max(t.height for t, _, _ in ln) + 30
        r = Image.new('RGB', (W, h), BG)
        d = ImageDraw.Draw(r)
        for t, lab, x in ln:
            r.paste(t, (x, 30))
            d.text((x, 4), lab, fill=(0, 0, 0), font=FONT)
        parts.append(r)
    head = Image.new('RGB', (W, 40), (40, 40, 40))
    ImageDraw.Draw(head).text((10, 6), title, fill=(255, 255, 255), font=BIG)
    return [head] + parts


def banner(t):
    b = Image.new('RGB', (W, 40), (40, 40, 40))
    ImageDraw.Draw(b).text((10, 6), t, fill=(255, 255, 255), font=BIG)
    return b


states = ['attack', 'cast', 'hurt', 'ko']
idle = ART + '/idle.png'
rows = []
rows.append(banner('1. Round 2 installed CANDIDATES at engine scale (idle px x sidecar scale), x0.55'))
rows.append(whole_row([idle] + [f'{ART}/{s}.png' for s in states],
                      ['idle (anchor)', 'attack 6', 'cast 5', 'hurt 5', 'ko 4'], 0.55))
rows.append(banner('2. Round 1 files they replaced (backup .../2026-09-23-lora-r2/ormi/replaced), same rule, x0.55'))
rows.append(whole_row([idle] + [f'{R1}/{s}.png' for s in states],
                      ['idle', 'r1 attack (painter 6)', 'r1 cast 960106 (judge 7)', 'r1 hurt (painter 6)', 'r1 ko (painter 5)'], 0.55))
rows.append(banner('3. In a running battle (painter capture, GPU ANGLE, dsf 2): idle, attack, cast, hurt, ko, x0.6'))
ig = [Image.open(f'{R2DIR}/ingame-r2-{s}.png').convert('RGB') for s in ['idle'] + states]
ig = [i.resize((round(i.width * 0.6), round(i.height * 0.6)), Image.LANCZOS) for i in ig]
h = max(i.height for i in ig)
r = Image.new('RGB', (W, h), BG)
x = 10
for i in ig:
    r.paste(i, (x, h - i.height)); x += i.width + 12
rows.append(r)
A, C, H, K = (f'{ART}/{s}.png' for s in states)
rows += crop_row('4. Heads, native 1:1 (idle: striped tassel, temple and cheek marks)', [
    (idle, (170, 0, 370, 230), 'idle'), (A, (440, 20, 640, 250), 'attack'), (C, (320, 100, 490, 300), 'cast'),
    (H, (160, 0, 370, 190), 'hurt'), (K, (900, 0, 1144, 210), 'ko (tassel regrown)')])
rows += crop_row('5. Shields, native 1:1 (idle: purple sunburst in a red gold-studded band; heart = research 10.1)', [
    (idle, (10, 160, 200, 640), 'idle'), (A, (640, 10, 949, 490), 'attack'), (C, (0, 300, 310, 870), 'cast'),
    (H, (80, 80, 260, 360), 'hurt: back of the shield only'), ])
rows += crop_row('6. Costume and edit defects, native 1:1', [
    (idle, (60, 930, 440, 1120), 'idle hem: gold diamonds on a dark band'),
    (A, (0, 680, 760, 991), 'attack: two-tone hakama, hem on one leg only'),
    (C, (150, 830, 614, 1067), 'cast: pale lavender, hem floats'),
    (H, (290, 290, 648, 520), 'hurt: lemon bow, dark gold-dot panel'),
    (K, (740, 140, 1144, 310), 'ko: collar smear, red knot, straight cut'),
    (K, (0, 280, 520, 582), 'ko: gold squares, one foot, no shield')])
tot = sum(r.height for r in rows)
sheet = Image.new('RGB', (W, tot), BG)
y = 0
for r in rows:
    sheet.paste(r, (0, y)); y += r.height
os.makedirs(os.path.dirname(OUT), exist_ok=True)
q = 88
while True:
    sheet.save(OUT, quality=q, optimize=True)
    if os.path.getsize(OUT) < 3_000_000 or q < 50:
        break
    q -= 6
print(OUT, sheet.size, os.path.getsize(OUT), 'q', q)
