"""Repair sheet (FFX-2 only): the picked portrait, option 1 (attempt 5) and the best repaired pair (attempt 6), each with
idle and cast in full and at game size (1:1 crops of real 1600x900 engine frames), plus 1:1 and 2x before/after crops
of the repaired regions. Writes docs/concepts/chapters/gippal/nooj-options/repair/sheet.jpg."""
from PIL import Image, ImageDraw, ImageFont

C5 = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-25-nooj5'
C6 = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-25-nooj6'
LIVE = 'D:/Final Fantasy/public/art'
FR = 'D:/Tools/pyrefly-scratch/nooj6/frames'
OUT = 'D:/Final Fantasy/docs/concepts/chapters/gippal/nooj-options/repair/sheet.jpg'
try:
    F = ImageFont.truetype('arial.ttf', 22); FB = ImageFont.truetype('arialbd.ttf', 28); FS = ImageFont.truetype('arial.ttf', 17)
except OSError:
    F = FB = FS = ImageFont.load_default()

I5, K5 = f'{C5}/idle-lean/C-opt/cand-975102.png', f'{C5}/cast/C-lean-f/cand-975201.png'
I6, K6 = f'{C6}/idle-repair/idle-repaired.png', f'{C6}/cast/C-r1/cand-976202.png'
ROWS = [
    ('Option 1 as picked (attempt 5: idle 975102, cast 975201). Judge: 6.7 / 6.6 FAIL', I5, K5, 'opt1'),
    ('Repaired (attempt 6: idle 975102 + repaints 976101/976101/976112; cast re-derived, seed 976202). NOT JUDGED', I6, K6, 'nooj6'),
]
BG = (150, 150, 150)


def on(im, col=BG):
    im = im.convert('RGBA'); bg = Image.new('RGBA', im.size, col + (255,)); bg.alpha_composite(im); return bg.convert('RGB')


def fit(im, w, h):
    s = min(w / im.width, h / im.height); return im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)


def crop2(path, box, k=2):
    im = on(Image.open(path).crop(box)); return im.resize((im.width * k, im.height * k), Image.NEAREST)


RH, GAP, TOP = 600, 18, 64
portrait = fit(on(Image.open(f'{LIVE}/portraits/nooj.png'), (255, 255, 255)), 520, 760)
cols = [240, 520, 300, 420]
W = portrait.width + GAP * 3 + sum(cols) + GAP * len(cols)
DET_H = 330
H = TOP + len(ROWS) * (RH + 50) + DET_H + 110
sheet = Image.new('RGB', (W, H), (236, 234, 230)); d = ImageDraw.Draw(sheet)
d.text((GAP, 16), 'Nooj shade, option 1 targeted repair (FFX-2 only, Den of Woe). CANDIDATES: nothing installed, not yet judged.', font=FB, fill=(20, 20, 30))
d.text((GAP, TOP + 6), "Approved portrait (Bailey's pick)", font=F, fill=(20, 20, 30)); sheet.paste(portrait, (GAP, TOP + 36))
x0 = portrait.width + GAP * 2
heads = ['idle', 'cast', 'idle at game size (1:1)', 'cast at game size (1:1)']
for r, (label, idle, cast, fr) in enumerate(ROWS):
    y = TOP + r * (RH + 50)
    d.text((x0, y + 6), label, font=F, fill=(120, 20, 20) if r else (20, 20, 30))
    y += 40; x = x0
    tiles = [fit(on(Image.open(idle)), cols[0], RH - 30), fit(on(Image.open(cast)), cols[1], RH - 30),
             Image.open(f'{FR}/{fr}-idle.png').convert('RGB').crop((700, 110, 1000, 110 + RH - 30)),
             Image.open(f'{FR}/{fr}-cast.png').convert('RGB').crop((600, 110, 1020, 110 + RH - 30))]
    for i, t in enumerate(tiles):
        d.text((x, y), heads[i], font=FS, fill=(60, 60, 70)); sheet.paste(t, (x, y + 22)); x += cols[i] + GAP
# details: before / after at 2x (idle hands, feet) and 1:1 (cast leading shoulder)
y = TOP + len(ROWS) * (RH + 50) + 10
d.text((GAP, y), 'Repaired regions, before -> after (idle at 2x on grey; cast upper body at 1:1)', font=F, fill=(20, 20, 30)); y += 34
R5 = f'{C5}/idle-lean/C-opt/cand-975102.raw.png'; R6 = f'{C6}/idle-repair/idle-repaired.raw.png'
det = [
    ('cane hand', crop2(R5, (240, 575, 340, 700)), crop2(R6, (240, 575, 340, 700))),
    ('machina hand', crop2(R5, (495, 595, 575, 700)), crop2(R6, (495, 595, 575, 700))),
    ('feet', crop2(R5, (270, 1080, 590, 1190), 1), crop2(R6, (270, 1080, 590, 1190), 1)),
    ('cast shoulders', on(Image.open(K5).crop((430, 40, 760, 330))), on(Image.open(K6).crop((440, 60, 770, 350)))),
]
x = GAP
for name, a, b in det:
    a = fit(a, 330, 250) if a.height > 250 else a; b = fit(b, 330, 250) if b.height > 250 else b
    d.text((x, y), name, font=FS, fill=(60, 60, 70))
    sheet.paste(a, (x, y + 22)); sheet.paste(b, (x + a.width + 8, y + 22))
    d.text((x + a.width - 6, y + 22 + a.height // 2 - 12), '>', font=FB, fill=(200, 30, 30))
    x += a.width + b.width + 8 + GAP * 2
d.text((GAP, H - 40), 'Full tiles: opaque renders before the B treatment. Game size: real 1600x900 engine frames (Chapter XI staging, Den plate and the shade served '
       "in Shiva's slot at factor 0.82, B treatment applied). Look by the repairing agent, not a judge and not Bailey.", font=FS, fill=(60, 60, 70))
sheet.save(OUT, quality=86)
print(sheet.size, OUT)
