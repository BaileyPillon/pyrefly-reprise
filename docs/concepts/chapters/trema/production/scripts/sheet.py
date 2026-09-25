# Production sheet for Chapter XIII (Trema, FFX-2 only): the installed candidates at source pixels, the repairs at 1:1
# before/after, the real engine frames and the staged link. 2000 px wide, 40 px captions, JPEG.
import sys
from PIL import Image, ImageDraw, ImageFont
A = 'D:/Final Fantasy/public/art/'
R = 'D:/Tools/pyrefly-scratch/trema-options/renders/'
S = 'D:/Tools/pyrefly-scratch/ch1215/trema/shots/'
OUT = 'D:/Final Fantasy/docs/concepts/chapters/trema/production/'
W = 2000; BG = (18, 22, 30); FG = (235, 230, 220); CAP = 40
try:
    F = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 26); FB = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 34)
except Exception:
    F = FB = ImageFont.load_default()
def flat(p, bg=(58, 72, 84)):
    im = Image.open(p).convert('RGBA'); b = Image.new('RGBA', im.size, bg + (255,)); b.alpha_composite(im); return b.convert('RGB')
def fit(im, w=None, h=None):
    k = min((w or 1e9) / im.width, (h or 1e9) / im.height); return im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
rows = []
def row(title, items, h):
    # items: (image, caption); scaled to height h, laid left to right, wrapped to W
    tiles = [(fit(im, h=h), cap) for im, cap in items]
    tot = sum(t.width for t, _ in tiles) + 20 * (len(tiles) - 1)
    if tot > W - 40:
        k = (W - 40 - 20 * (len(tiles) - 1)) / sum(t.width for t, _ in tiles); tiles = [(fit(t, h=round(t.height * k)), c) for t, c in tiles]
    hh = max(t.height for t, _ in tiles)
    r = Image.new('RGB', (W, 50 + hh + CAP + 10), BG); d = ImageDraw.Draw(r); d.text((20, 8), title, font=FB, fill=FG)
    x = 20
    for t, c in tiles:
        r.paste(t, (x, 50)); d.text((x, 50 + hh + 6), c, font=F, fill=(190, 200, 210)); x += t.width + 20
    rows.append(r)
head = Image.new('RGB', (W, 120), BG); d = ImageDraw.Draw(head)
d.text((20, 10), 'Chapter XIII Trema (FFX-2 only): production CANDIDATES, installed 2026-09-25 (not approved, not wired)', font=FB, fill=FG)
d.text((20, 62), "Bailey: \"I'll go with all your recommendations\". O-1 A priest + torn robe, O-2 A gold beast + the link staged, O-3 B repaint. Method r3.", font=F, fill=(190, 200, 210))
rows.append(head)
row('1. Installed files at source pixels', [
    (flat(A + 'characters/trema/idle.png'), 'trema/idle 816x1167'), (flat(A + 'characters/trema/cast.png'), 'trema/cast (derived)'),
    (flat(A + 'characters/paragon/idle.png'), 'paragon/idle 1150x815'), (flat(A + 'characters/paragon/cast.png'), 'paragon/cast (rears 12 deg, derived)')], 520)
row('   backdrops/via-infinito.png 2688x1536 (O-3 B, installed unchanged)', [(Image.open(A + 'backdrops/via-infinito.png').convert('RGB'), 'Cloister 100 plate')], 560)
pick = flat(R + 'trema-A.png'); idle = flat(A + 'characters/trema/idle.png')
row('2. Trema repairs at 1:1: the torn robe (sourced), face grade, round red crest', [
    (pick.crop((180, 900, 816, 1167)), 'pick: hem'), (idle.crop((180, 900, 816, 1167)), 'installed: torn hem, rip'),
    (pick.crop((330, 90, 480, 520)), 'pick'), (idle.crop((330, 90, 480, 520)), 'fixed')], 330)
cast = flat(A + 'characters/trema/cast.png')
row('   Trema cast: hand lifted 95 px, sleeve follows; only the joint repainted (seed 951102, 0.45); 88 % of pixels are the idle\'s', [
    (idle.crop((140, 120, 420, 720)), 'idle'), (cast.crop((140, 120, 420, 720)), 'cast')], 460)
pp = flat(R + 'paragon-a.2.png'); pi = flat(A + 'characters/paragon/idle.png')
row('3. Paragon repairs at 1:1: loose blade erased, white pockets opened (alpha only; kept pixels unchanged)', [
    (pp.crop((0, 340, 620, 815)), 'pick'), (pi.crop((0, 340, 620, 815)), 'installed')], 420)
row('4. Real engine frames 1600x900 (Chapter IV staging; plate and paintings served by request interception)', [
    (Image.open(S + 'paragon-idle-full.png').convert('RGB'), 'link 1: Paragon idle, HUD'), (Image.open(S + 'paragon-cast-clean.png').convert('RGB'), 'Paragon cast, HUD off')], 540)
row('', [(Image.open(S + 'trema-idle-clean.png').convert('RGB'), 'link 2: Trema idle (0.72 of the boss height)'), (Image.open(S + 'trema-cast-clean.png').convert('RGB'), 'Trema cast')], 540)
row('5. The link, staged (O-2b): Paragon beaten -> the old man breaks it into pyreflies -> he takes the floor', [
    (Image.open(S + 'link-%d.jpg' % i).convert('RGB'), 'link %d' % i) for i in (1, 2, 3)], 360)
H = sum(r.height for r in rows); sheet = Image.new('RGB', (W, H), BG); y = 0
for r in rows: sheet.paste(r, (0, y)); y += r.height
sheet.save(OUT + 'sheet.jpg', quality=84); print('sheet', sheet.size)
import os; os.makedirs(OUT + 'frames', exist_ok=True)
for n in ['paragon-idle-full', 'paragon-idle-clean', 'paragon-cast-clean', 'paragon-cast-full', 'trema-idle-clean', 'trema-idle-full', 'trema-cast-clean', 'trema-cast-full']:
    Image.open(S + n + '.png').convert('RGB').save(OUT + 'frames/' + n + '.jpg', quality=86)
for i in (1, 2, 3):
    Image.open(S + 'link-%d.jpg' % i).save(OUT + 'frames/link-%d.jpg' % i, quality=86)
print('frames written')
