"""Independent judge sheet for the Ormi LoRA poses (FFX-2 only, Chapter 6). One-off, not tools/gen.

Row 1: installed idle + the four LoRA picks, whole, at ONE pixel scale (the engine sizes every pose by idle's px/unit).
Row 2: the round-3 files they replaced (from the backup), same scale, for the before/after.
Row 3: heads at native 1:1.   Row 4: shields at 1:1.   Row 5: costume/hem at 1:1.
Row 6: the recommended hurt base (p5 960242, not installed), whole at row-1 scale and head 1:1.
    python judge-sheet.py      # from anywhere; writes judge-sheet.jpg next to this file
"""
from __future__ import annotations
import pathlib
from PIL import Image, ImageDraw, ImageFont

HERE = pathlib.Path(__file__).resolve().parent
REPO = HERE.parents[5]
ART = REPO / 'public/art/characters/ormi'
BAK = pathlib.Path('D:/Tools/pyrefly-art-backup/candidates/2026-09-23-leblanc-lora/ormi/replaced')
ALT = pathlib.Path('D:/Tools/pyrefly-lora/ormi/poses/hurt/hurt.p5.960242.png')
STATES = ['idle', 'attack', 'cast', 'hurt', 'ko']
SCORES = {'attack': 'judge 5 (costume)', 'cast': 'judge 7 (at bar)', 'hurt': 'judge 4 (several)', 'ko': 'judge 4 (style)'}
R3 = {'attack': 'round 3: 5', 'cast': 'round 3: 4', 'hurt': 'round 3: 5', 'ko': 'round 3: 4'}
HEAD = {'idle': (150, 0, 489, 330), 'attack': (380, 0, 720, 300), 'cast': (230, 20, 560, 320), 'hurt': (140, 0, 470, 270), 'ko': (880, 360, 1196, 640)}
SHIELD = {'idle': (0, 160, 230, 810), 'attack': (590, 120, 789, 630), 'cast': (0, 400, 330, 910), 'hurt': (120, 110, 320, 520), 'ko': (260, 120, 700, 470)}
COST = {'idle': (80, 780, 420, 1189), 'attack': (0, 500, 660, 900), 'cast': (80, 780, 611, 1214), 'hurt': (0, 220, 625, 1039), 'ko': (560, 380, 1100, 709)}
K = 0.45
GREY = (205, 205, 210, 255)
PAD, LAB = 12, 24


def font(n):
    for f in ('arial.ttf', 'DejaVuSans.ttf'):
        try:
            return ImageFont.truetype(f, n)
        except OSError:
            pass
    return ImageFont.load_default()


def flat(im):
    im = im.convert('RGBA')
    bg = Image.new('RGBA', im.size, GREY)
    bg.alpha_composite(im)
    return bg.convert('RGB')


def scaled(im):
    return im.resize((round(im.width * K), round(im.height * K)), Image.LANCZOS)


full = {s: flat(Image.open(ART / f'{s}.png')) for s in STATES}
old = {s: flat(Image.open(BAK / f'{s}.png')) for s in STATES[1:]}
rows = [
    ('1. Installed LoRA picks, whole, one pixel scale (0.45x native)', [(s + ('' if s == 'idle' else ': ' + SCORES[s]), scaled(full[s])) for s in STATES], True),
    ('2. Round-3 files they replaced (backup), same scale', [('idle (anchor)', scaled(full['idle']))] + [(f'{s}: {R3[s]}', scaled(old[s])) for s in STATES[1:]], True),
    ('3. Heads, native 1:1', [(s, full[s].crop(HEAD[s])) for s in STATES], False),
    ('4. Shields, native 1:1', [(s, full[s].crop(SHIELD[s])) for s in STATES], False),
    ('5. Costume and hem, native 1:1', [(s, full[s].crop(COST[s])) for s in STATES], False),
]
alt = flat(Image.open(ALT))
rows.append(('6. Recommended hurt base (p5 960242, NOT installed): whole at row-1 scale, head 1:1', [('hurt p5 960242', scaled(alt)), ('head 1:1', alt.crop((120, 60, 450, 330)))], True))
f, fs = font(22), font(17)
W = max(sum(im.width for _, im in t) + PAD * (len(t) + 1) for _, t, _ in rows)
H = sum(max(im.height for _, im in t) + LAB * 2 + PAD for _, t, _ in rows) + PAD
sheet = Image.new('RGB', (W, H), 'white')
d = ImageDraw.Draw(sheet)
y = PAD
for title, tiles, bottom in rows:
    h = max(im.height for _, im in tiles)
    d.text((PAD, y), title, fill=(0, 0, 0), font=f)
    x = PAD
    for label, im in tiles:
        d.text((x, y + LAB), label, fill=(70, 70, 70), font=fs)
        sheet.paste(im, (x, y + LAB * 2 + (h - im.height if bottom else 0)))
        x += im.width + PAD
    y += h + LAB * 2 + PAD
out = HERE / 'judge-sheet.jpg'
sheet.save(out, quality=84)
print(out, sheet.size, out.stat().st_size)
