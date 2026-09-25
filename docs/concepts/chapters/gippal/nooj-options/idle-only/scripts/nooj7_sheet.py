"""Idle-only repair sheet (FFX-2 only): the picked portrait, attempt 6's repaired idle and attempt 7's idle, each in
full on grey and at game size (1:1 crops of real 1600x900 engine frames), plus 2x before/after crops of the four
repaired regions. Writes docs/concepts/chapters/gippal/nooj-options/idle-only/sheet.jpg and the frames as JPEG."""
import os
from PIL import Image, ImageDraw, ImageFont

C6 = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-25-nooj6/idle-repair/idle-repaired'
C7 = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-25-nooj7/merge/idle-m2'
FR = 'D:/Tools/pyrefly-scratch/nooj7/frames'
DOC = 'D:/Final Fantasy/docs/concepts/chapters/gippal/nooj-options/idle-only'
try:
    F = ImageFont.truetype('arial.ttf', 22); FB = ImageFont.truetype('arialbd.ttf', 28); FS = ImageFont.truetype('arial.ttf', 17)
except OSError:
    F = FB = FS = ImageFont.load_default()
BG = (150, 150, 150)


def on(im, col=BG):
    im = im.convert('RGBA'); bg = Image.new('RGBA', im.size, col + (255,)); bg.alpha_composite(im); return bg.convert('RGB')


def fit(im, w, h):
    s = min(w / im.width, h / im.height); return im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)


os.makedirs(f'{DOC}/frames', exist_ok=True)
for n in ('nooj6-idle', 'nooj7-idle'):
    Image.open(f'{FR}/{n}.png').convert('RGB').save(f'{DOC}/frames/{n}.jpg', quality=90)

portrait = fit(on(Image.open('D:/Final Fantasy/public/art/portraits/nooj.png'), (255, 255, 255)), 520, 760)
i6, i7 = on(Image.open(C6 + '.png')), on(Image.open(C7 + '.png'))
f6 = Image.open(f'{FR}/nooj6-idle.png').convert('RGB').crop((700, 100, 1000, 580))
f7 = Image.open(f'{FR}/nooj7-idle.png').convert('RGB').crop((700, 100, 1000, 580))
# 2x before/after on the raw (white ground) for each region
R6, R7 = Image.open(C6 + '.raw.png').convert('RGB'), Image.open(C7 + '.raw.png').convert('RGB')
REG = [('loops', (330, 185, 545, 300)), ('sleeve', (270, 380, 410, 600)), ('neck fringe', (440, 290, 560, 440)),
       ('machina arm', (480, 420, 590, 630))]

GAP, TOP = 18, 64
colw = [i6.width, i7.width, 300, 300]
W = portrait.width + GAP * 2 + sum(colw) + GAP * 5
det = [(n, R6.crop(b).resize(((b[2] - b[0]) * 2, (b[3] - b[1]) * 2), Image.NEAREST),
        R7.crop(b).resize(((b[2] - b[0]) * 2, (b[3] - b[1]) * 2), Image.NEAREST)) for n, b in REG]
DET_H = max(a.height for _, a, _ in det) + 40
H = TOP + 40 + max(i6.height, 760) + 30 + DET_H + 60
W = max(W, sum(a.width * 2 + 30 for _, a, _ in det) + GAP * 2)
sheet = Image.new('RGB', (W, H), (236, 234, 230)); d = ImageDraw.Draw(sheet)
d.text((GAP, 16), 'Nooj shade, idle-only repair (FFX-2 only, Den of Woe). CANDIDATE: nothing installed, not judged.',
       font=FB, fill=(20, 20, 30))
d.text((GAP, TOP + 6), "Approved portrait (Bailey's pick)", font=F, fill=(20, 20, 30)); sheet.paste(portrait, (GAP, TOP + 36))
x = portrait.width + GAP * 2
heads = ['before: attempt 6 idle (8e1d77e9991c), judge 6.9', 'after: attempt 7 idle', 'before, 1:1 in the frame',
         'after, 1:1 in the frame']
for i, t in enumerate((i6, i7, f6, f7)):
    d.text((x, TOP + 6), heads[i], font=FS, fill=(120, 20, 20) if i % 2 else (60, 60, 70))
    sheet.paste(t, (x, TOP + 36)); x += colw[i] + GAP
y = TOP + 40 + max(i6.height, 760) + 30
d.text((GAP, y), 'Repaired regions at 2x on the raw, before | after', font=F, fill=(20, 20, 30)); y += 34
x = GAP
for n, a, b in det:
    d.text((x, y), n, font=FS, fill=(60, 60, 70))
    sheet.paste(a, (x, y + 22)); sheet.paste(b, (x + a.width + 6, y + 22)); x += a.width * 2 + 30
sheet.save(f'{DOC}/sheet.jpg', quality=88)
print('sheet', sheet.size)
