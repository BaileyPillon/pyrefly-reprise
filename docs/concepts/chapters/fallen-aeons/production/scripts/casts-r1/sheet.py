# casts-r1 sheet (FFX-2 only): 1600x900 battle frames (failed cast r0 vs repaired r1), the sisters at 2x game size,
# every painting at 1:1 on mid grey, and the repaired areas at 2x.
import numpy as np
from PIL import Image, ImageDraw, ImageFont
A = 'D:/Final Fantasy/public/art/characters'; BK = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-24-chapters'
fnt = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 30); fs = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 22)
def grey(p, crop=None, s=1.0):
    im = Image.open(p).convert('RGBA')
    if crop: im = im.crop(crop)
    bg = Image.new('RGBA', im.size, (128, 128, 128, 255)); bg.alpha_composite(im); bg = bg.convert('RGB')
    return bg if s == 1 else bg.resize((int(bg.width * s), int(bg.height * s)), Image.NEAREST)
def pad_left(p, n):
    im = Image.open(p).convert('RGBA'); o = Image.new('RGBA', (im.width + n, im.height)); o.paste(im, (n, 0)); return o
rows = []
def row(tiles, labels, gap=20, lh=44):
    W = sum(t.width for t in tiles) + gap * (len(tiles) - 1); H = max(t.height for t in tiles) + lh
    r = Image.new('RGB', (W, H), (24, 22, 30)); d = ImageDraw.Draw(r); x = 0
    for t, l in zip(tiles, labels):
        r.paste(t, (x, lh)); d.text((x + 6, 8), l, font=fs, fill=(235, 225, 245)); x += t.width + gap
    rows.append(r)
fo, fn, fi = [Image.open(f'look/frame-{k}.jpg').convert('RGB') for k in ['old', 'new', 'idle']]
row([fo, fn], ['1600x900 game size: casts r0 (judge FAIL, backed up)', '1600x900 game size: casts r1 (repaired, installed as CANDIDATE)'])
box = (780, 370, 1230, 720)
row([f.crop(box).resize((900, 700), Image.LANCZOS) for f in (fi, fo, fn)], ['2x of the frame: idles', '2x: casts r0 (FAIL)', '2x: casts r1'])
row([grey(f'{A}/cindy/idle.png'), grey(f'{BK}/cindy/cast.png'), grey(f'{A}/cindy/cast.png'), grey(f'{A}/mindy/idle.png'), grey(f'{BK}/mindy/cast.png'), grey(f'{A}/mindy/cast.png')],
    ['cindy idle 1:1', 'cindy cast r0', 'cindy cast r1', 'mindy idle 1:1', 'mindy cast r0', 'mindy cast r1'])
# 2x close-ups of the repaired regions (same body coordinates: r0 canvas = idle + 39 / +15; r1 cindy = r0 + 24)
ci = pad_left(f'{A}/cindy/idle.png', 39 + 24); co = pad_left(f'{BK}/cindy/cast.png', 24); cn = Image.open(f'{A}/cindy/cast.png')
mi = pad_left(f'{A}/mindy/idle.png', 15); mo = Image.open(f'{BK}/mindy/cast.png'); mn = Image.open(f'{A}/mindy/cast.png')
def g2(im, c):
    im = im.crop(c); bg = Image.new('RGBA', im.size, (128, 128, 128, 255)); bg.alpha_composite(im); return bg.convert('RGB').resize((im.width * 2, im.height * 2), Image.LANCZOS)
cb = (14, 190, 284, 540); mb = (10, 320, 300, 640)
row([g2(ci, cb), g2(co, cb), g2(cn, cb), g2(mi, mb), g2(mo, mb), g2(mn, mb)],
    ['cindy idle 2x', 'cindy r0 2x', 'cindy r1 2x', 'mindy idle 2x', 'mindy r0 2x', 'mindy r1 2x'])
W = max(r.width for r in rows) + 40; H = sum(r.height for r in rows) + 30 * len(rows) + 110
sheet = Image.new('RGB', (W, H), (16, 14, 22)); d = ImageDraw.Draw(sheet)
d.text((20, 20), 'Chapter XI Fallen Aeons, Sister casts r1 (FFX-2 only): Cindy and Mindy repaired by method r3 (idle pixels + one masked repaint). CANDIDATES, not approved.', font=fnt, fill=(245, 235, 255))
d.text((20, 62), 'MAD 0 vs the idle outside the repaint mask and the moved arm; invented colour 0 %; 16 px cut-out margin. Seeds 941101 (Cindy, denoise 0.5) and 943101 (Mindy, 0.45).', font=fs, fill=(200, 190, 215))
y = 110
for r in rows: sheet.paste(r, (20, y)); y += r.height + 30
sheet.save('D:/Final Fantasy/docs/concepts/chapters/fallen-aeons/production/casts-r1.jpg', quality=86); print(sheet.size)
