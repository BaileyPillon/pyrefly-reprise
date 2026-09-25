# Production sheet for Chapter XV (Den of Woe): one column, 1200 px wide, captions >= 26 px so it reads on a phone.
import os, shutil
from PIL import Image, ImageDraw, ImageFont
S = 'D:/Tools/pyrefly-scratch/ch1215/gippal'
OUT = 'D:/Final Fantasy/docs/concepts/chapters/gippal/production'
ART = 'D:/Final Fantasy/public/art'
os.makedirs(f'{OUT}/frames', exist_ok=True)
F = lambda s, b=False: ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf' if b else 'C:/Windows/Fonts/segoeui.ttf', s)
W = 1200
BG = (14, 18, 26)
blocks = []


def text_block(lines, size=28, bold=False, pad=18, color=(230, 232, 240)):
    f = F(size, bold)
    h = pad * 2 + len(lines) * int(size * 1.35)
    im = Image.new('RGB', (W, h), BG); d = ImageDraw.Draw(im)
    for i, t in enumerate(lines):
        d.text((24, pad + i * int(size * 1.35)), t, font=f, fill=color)
    blocks.append(im)


def on_bg(im, col=(22, 38, 52)):
    bg = Image.new('RGBA', im.size, col + (255,)); bg.alpha_composite(im.convert('RGBA')); return bg.convert('RGB')


def row(ims, h):
    tiles = [i.resize((max(1, int(i.width * h / i.height)), h), Image.LANCZOS) for i in ims]
    tot = sum(t.width for t in tiles); gap = max(0, (W - tot) // (len(tiles) + 1))
    r = Image.new('RGB', (W, h), BG); x = gap
    for t in tiles:
        r.paste(t, (x, 0)); x += t.width + gap
    blocks.append(r)


def frame(path, name):
    im = Image.open(path).convert('RGB')
    im.save(f'{OUT}/frames/{name}.jpg', quality=86)
    blocks.append(im.resize((W, int(W * 900 / 1600)), Image.LANCZOS))


text_block(['CANDIDATE  -  Chapter XV, the Den of Woe  -  FFX-2 only'], 40, True, color=(255, 190, 220))
text_block(['Production art from Bailey\'s picks (2026-09-25): O-1 B for all three',
            'shades, O-3 A cold blue. Nothing is wired into the game yet.'], 28)
text_block(['1. The three shades, idle (the installed files)'], 30, True)
subs = ['gippal-shade', 'baralai-shade', 'nooj-shade']
row([on_bg(Image.open(f'{ART}/characters/{s}/idle.png')) for s in subs], 620)
text_block(['Gippal  -  Baralai  -  Nooj. One treatment for all three: translucent,',
            'cold, lit from within, with pale motes inside.'], 26)
text_block(['2. The hero cast (one per shade; plays on every action)'], 30, True)
row([on_bg(Image.open(f'{ART}/characters/{s}/cast.png')) for s in subs], 470)
text_block(['Derived from each idle: the weapon arm turns as one rigid piece of the',
            'idle\'s own pixels; only the elbow seam is repainted. Gippal swings the',
            'mortar up, Baralai tips his staff, Nooj levels his cane.'], 26)
text_block(['3. The opaque paintings under the treatment'], 30, True)
row([on_bg(Image.open(f'{S}/work/gip-idle-clean.png'), (120, 130, 150)),
     on_bg(Image.open(f'{S}/renders/baralai.3.png'), (120, 130, 150)),
     on_bg(Image.open(f'{S}/renders/nooj2.3.png'), (120, 130, 150))], 560)
text_block(['Gippal: the options pilot with its ring clamp repainted as the sourced',
            'saw blade. Baralai: a fresh render (no painting of him existed). Nooj: a',
            'fresh render with his picked portrait as the identity reference.'], 26)
text_block(['4. Gippal\'s saw blade, before and after (1:1 crop)'], 30, True)
a = on_bg(Image.open('D:/Tools/pyrefly-scratch/gippal-options/renders/gippal-a2.png').crop((60, 110, 360, 380)), (60, 70, 90))
b = on_bg(Image.open(f'{S}/work/gip-idle-clean.png').crop((60, 110, 360, 380)), (60, 70, 90))
row([a, b], 405)
text_block(['5. Real 1600x900 engine frames'], 30, True)
text_block(['Chapter XI\'s first link, with the Den plate and each shade served in place',
            'of Shiva by request interception. The shade stands where Shiva stands; its',
            'size (about 1.2x Rikku, as in the options) is ours. Casts are shown in the',
            'idle slot. The pink motes come from the Farplane scene still in use.'], 26)
for s, nm in [('gippal', 'Gippal'), ('baralai', 'Baralai'), ('nooj', 'Nooj')]:
    for p in ['idle', 'cast']:
        text_block([f'{nm}, {p}'], 28, True, pad=10)
        frame(f'{S}/frames/{s}-{p}.png', f'{s}-{p}')
text_block(['6. The Den plate (O-3 A), engine frame, HUD off, no enemy'], 30, True)
frame(f'{S}/frames/den-plate.png', 'den-plate')
text_block(['Installed exactly as picked. The tunnel mouth was not added: two masked',
            'repaint tries read as a doorway or a cut-out hole (below), so both were',
            'withdrawn after the second failure (rule 15).'], 26)
tries = [Image.open(f'{S}/work/den-{k}.png').convert('RGB').crop((850, 0, 1700, 760)) for k in
         ['t967101', 't967102', 'u967201', 'u967203']]
row(tries, 250)
text_block(['Withdrawn: arch tries 967101, 967102; irregular tries 967201, 967203.'], 24)
H = sum(b.height for b in blocks)
sheet = Image.new('RGB', (W, H), BG); y = 0
for b in blocks:
    sheet.paste(b, (0, y)); y += b.height
sheet.save(f'{OUT}/sheet.jpg', quality=82)
print('sheet', sheet.size, os.path.getsize(f'{OUT}/sheet.jpg'))
