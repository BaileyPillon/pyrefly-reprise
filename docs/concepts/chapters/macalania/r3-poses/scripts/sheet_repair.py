"""Append the judge-3 repair rows to the r3 pose sheet (FFX only): per subject, the r3 cast, the repaired cast and the
repaired cast with the repair mask tinted, at 1:1, then 3x zooms of the repaired regions (r3 | repaired).
usage: sheet_repair.py <base_sheet.jpg (the sheet as committed in 1b97cb55)> <old_canddir> <new_canddir> <out.jpg>"""
import sys
from PIL import Image, ImageDraw, ImageFont
base, old, new, out = sys.argv[1:5]
BG = (46, 48, 58); FG = (235, 230, 215); DIM = (170, 170, 180)
try:
    F = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 22); FS = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 16)
except Exception:
    F = FS = ImageFont.load_default()
sheet = Image.open(base).convert('RGB'); W = sheet.width
def on(img, g=(108, 108, 112)):
    b = Image.new('RGBA', img.size, g + (255,)); b.alpha_composite(img.convert('RGBA')); return b.convert('RGB')
def label(im, t):
    d = ImageDraw.Draw(im); d.rectangle([0, 0, im.width, 24], fill=(0, 0, 0)); d.text((6, 2), t, fill=(255, 220, 90), font=FS); return im
def text_block(lines):
    b = Image.new('RGB', (W, 12 + 30 * len(lines)), BG); d = ImageDraw.Draw(b)
    for i, (t, big) in enumerate(lines): d.text((16, 8 + 30 * i), t, fill=FG if big else DIM, font=F if big else FS)
    return b
def row(tiles, gap=12):
    h = max(t.height for t in tiles); b = Image.new('RGB', (W, h + gap), BG); x = 16
    for t in tiles: b.paste(t, (x, 0)); x += t.width + gap
    return b
def tint(im, maskp, box):
    t = on(im).crop(box); m = Image.open(maskp).convert('L').crop(box)
    return Image.composite(Image.blend(t, Image.new('RGB', t.size, (255, 0, 255)), 0.45), t, m)
blocks = [text_block([('REPAIRED casts after judge 3 (D-045, 2026-09-24). CANDIDATES, not installed, not approved.', True),
                      ('Masked repaints only; every pixel outside the repair mask is byte-identical to the r3 candidate (MAD 0). Magenta = the repair mask.', False),
                      ('Seymour: the raised hand only (thumb, four fingers, pointed nails, thin ink, lavender far side); hair and lean kept. Seed 8112, denoise 0.55.', False),
                      ('Guardian: the wrist bend smoothed, the green hook and the shaft specks removed, the shaft pasted back exactly; rotation kept. Seed 8201, denoise 0.5, then ink/Telea cleanup.', False)])]
SUBJ = [('seymour-macalania', 'Seymour (Macalania)', (150, 0, 650, 640), (240, 235, 310, 345)),
        ('guado-guardian', 'Guado Guardian', (10, 280, 800, 1120), (270, 460, 420, 640))]
for subj, name, box, zb in SUBJ:
    o = Image.open(f'{old}/{subj}/cast.png'); n = Image.open(f'{new}/{subj}/cast.png'); mp = f'{new}/{subj}/cast.repair-mask.png'
    blocks.append(text_block([(f'{name}: cast, 1:1 (x {box[0]}..{box[2]}, y {box[1]}..{box[3]})', True)]))
    blocks.append(row([label(on(o).crop(box), 'r3 cast (judged)'), label(on(n).crop(box), 'REPAIRED cast'), label(tint(n, mp, box), 'repaired, repair mask tinted')]))
    s = 3; zw, zh = (zb[2] - zb[0]) * s, (zb[3] - zb[1]) * s
    z = lambda im: on(im).crop(zb).resize((zw, zh), Image.NEAREST)
    blocks.append(row([label(z(o), f'r3 cast, 3x (x {zb[0]}..{zb[2]}, y {zb[1]}..{zb[3]})'), label(z(n), 'REPAIRED, 3x')]))
H = sheet.height + sum(b.height for b in blocks); outim = Image.new('RGB', (W, H), BG); outim.paste(sheet, (0, 0)); y = sheet.height
for b in blocks: outim.paste(b, (0, y)); y += b.height
outim.save(out, quality=84); print(out, outim.size)
