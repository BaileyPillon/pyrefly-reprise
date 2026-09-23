"""Independent judge sheet, Leblanc LoRA round 2 (FFX-2 only). Read-only on the art.

Row 0: idle whole, then idle 1:1 head, costume (obi, knot, tassel), boots, fan.
Rows 1-4 (attack, cast, hurt, ko): round-1 pick whole (scaled, grey border),
round-2 pick whole (scaled), then 1:1 crops of every region scored below 7,
then the in-battle crop (ingame-after-<state>.png).
Run from the repo root: python docs/concepts/chapters/leblanc/lora/leblanc/round2/judge-sheet.py
"""
from PIL import Image, ImageDraw
import os

ROOT = 'public/art/characters/leblanc/'
R1 = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-23-lora-r2/leblanc/replaced/'
HERE = os.path.dirname(os.path.abspath(__file__))
ROW_H = 420
GREY = (128, 128, 128, 255)


def flat(path):
    im = Image.open(path).convert('RGBA')
    bg = Image.new('RGBA', im.size, GREY)
    bg.alpha_composite(im)
    return bg.convert('RGB')


def scaled(im, h=ROW_H):
    if im.width / im.height > 2:
        w = int(ROW_H * 2.2)
        return im.resize((w, int(im.height * w / im.width)), Image.LANCZOS)
    return im.resize((int(im.width * h / im.height), h), Image.LANCZOS)


idle = flat(ROOT + 'idle.png')
cur = {s: flat(ROOT + s + '.png') for s in ['attack', 'cast', 'hurt', 'ko']}
old = {s: flat(R1 + s + '.png') for s in cur}

# (label, image, box) for the 1:1 crops; boxes are in the installed PNG's pixels.
rows = [
    ('idle (anchor, not scored)', None, idle, [
        ('idle head 1:1', idle, (220, 0, 520, 320)),
        ('idle obi/knot/tassel 1:1', idle, (200, 280, 500, 560)),
        ('idle boot 1:1', idle, (220, 880, 440, 1118)),
        ('idle fan 1:1', idle, (400, 150, 540, 260)),
    ]),
    ('attack r2.3: 6', old['attack'], cur['attack'], [
        ('face/hair 6: white strand across the eye', cur['attack'], (320, 0, 620, 320)),
        ('obi 6: navy band, thin crimson stripe', cur['attack'], (380, 300, 720, 600)),
        ('boots 8: open toe', cur['attack'], (250, 720, 929, 956)),
    ]),
    ('cast r2.2: 6', old['cast'], cur['cast'], [
        ('obi 6: narrow pink band, two tassels + cord', cur['cast'], (300, 440, 600, 780)),
        ('choker 6 / face 8', cur['cast'], (280, 260, 500, 480)),
        ('fan 8: red + silver (res. 10.1)', cur['cast'], (250, 0, 500, 170)),
    ]),
    ('hurt r2.2: 6', old['hurt'], cur['hurt'], [
        ('obi 6: no knot, no tassel, a clip', cur['hurt'], (200, 250, 560, 450)),
        ('face 8, pose 6: a wink at game size', cur['hurt'], (400, 10, 630, 220)),
        ('both legs, boots 8', cur['hurt'], (0, 820, 340, 1052)),
    ]),
    ('ko r2.1: 5', old['ko'], cur['ko'], [
        ('pose 6: head pillowed on the hand', cur['ko'], (40, 140, 380, 370)),
        ('obi 6: near black; skull-like bead', cur['ko'], (280, 160, 720, 418)),
        ('boots 5: indigo; toe tip cut by the edge', cur['ko'], (940, 160, 1197, 330)),
    ]),
]

ingame = {s: Image.open(os.path.join(HERE, 'ingame-after-%s.png' % s)).convert('RGB')
          for s in ['idle', 'attack', 'cast', 'hurt']}
ingame['ko'] = Image.open(os.path.join(HERE, 'ingame-after-ko-clear.png')).convert('RGB')

tiles_rows = []
for label, r1, r2, crops in rows:
    tiles = []
    if r1 is not None:
        tiles.append(('round 1 (replaced)', scaled(r1)))
    tiles.append((label, scaled(r2)))
    for cl, im, box in crops:
        tiles.append((cl, im.crop(box)))
    key = label.split()[0]
    key = 'idle' if key == 'idle' else key
    ig = ingame[key]
    tiles.append(('in battle (2x)', ig.resize((int(ig.width * 320 / ig.height), 320), Image.LANCZOS)
                  if ig.width / ig.height < 1.5 else ig))
    tiles_rows.append(tiles)

PAD, LAB = 8, 18
width = max(sum(t.width + PAD for _, t in r) for r in tiles_rows) + PAD
heights = [max(t.height for _, t in r) + LAB + PAD for r in tiles_rows]
sheet = Image.new('RGB', (width, sum(heights) + PAD), (24, 24, 24))
d = ImageDraw.Draw(sheet)
y = PAD
for r, h in zip(tiles_rows, heights):
    x = PAD
    for lab, t in r:
        d.text((x, y), lab, fill=(255, 220, 90))
        sheet.paste(t, (x, y + LAB))
        x += t.width + PAD
    y += h
out = os.path.join(HERE, 'judge-sheet.jpg')
sheet.save(out, quality=86)
print(out, sheet.size, os.path.getsize(out))
