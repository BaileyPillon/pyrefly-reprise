"""Macalania r3 pose sheet (FFX only): idle | cast | hurt | none per subject (whole, 1:1 crops) and the
in-game 1600x900 captures (frames at half size plus 1:1 actor crops). usage: sheet.py <canddir> <ingamedir> <out.jpg>"""
import sys, json, numpy as np
from PIL import Image, ImageDraw, ImageFont
cand, ing, out = sys.argv[1:4]
ART = 'D:/Final Fantasy/public/art/characters'
BG = (46, 48, 58); FG = (235, 230, 215); DIM = (170, 170, 180)
try:
    F = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 22); FS = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 16)
except Exception:
    F = FS = ImageFont.load_default()
W = 2440
def on(img, g=(108, 108, 112)):
    b = Image.new('RGBA', img.size, g + (255,)); b.alpha_composite(img.convert('RGBA')); return b.convert('RGB')
def label(im, t):
    d = ImageDraw.Draw(im); d.rectangle([0, 0, im.width, 24], fill=(0, 0, 0)); d.text((6, 2), t, fill=(255, 220, 90), font=FS); return im
blocks = []
def text_block(lines, h=None):
    h = h or 12 + 30 * len(lines); b = Image.new('RGB', (W, h), BG); d = ImageDraw.Draw(b)
    for i, (t, big) in enumerate(lines): d.text((16, 8 + 30 * i), t, fill=FG if big else DIM, font=F if big else FS)
    return b
def row(tiles, gap=12):
    h = max(t.height for t in tiles); b = Image.new('RGB', (W, h + gap), BG); x = 16
    for t in tiles: b.paste(t, (x, 0)); x += t.width + gap
    return b
blocks.append(text_block([('Macalania r3 poses: Seymour and the Guado Guardian (FFX only, Chapter VII). CANDIDATES, not installed, not approved.', True),
                          ('Derived from each r3 idle\'s own pixels (docs/plans/art-method-r3/METHOD-CHECK.md). "none" = no hurt file: the engine shows the idle under its flinch (tint, knock-back).', False),
                          ('Magenta tint in the 1:1 crops marks the only generated pixels (masked repaint of the revealed holes); everything else is the idle, unchanged or moved by a warp.', False)]))
SUBJ = [('seymour-macalania', 'Seymour (Macalania)', (150, 0, 650, 640)), ('guado-guardian', 'Guado Guardian', (10, 280, 800, 1120))]
ij = json.load(open(f'{ing}/ingame.json'))
for subj, name, box in SUBJ:
    idle = Image.open(f'{ART}/{subj}/idle.png'); c = Image.open(f'{cand}/{subj}/cast.png'); h = Image.open(f'{cand}/{subj}/hurt.png')
    g = {p: json.load(open(f'{cand}/{subj}/{p}.gates.json')) for p in ('cast', 'hurt')}
    blocks.append(text_block([(f'{name}: whole, at 0.5', True)] + [(f'{p}: idle pixels {g[p]["idlePixelShare"]*100:.1f} % (unchanged {g[p]["shares"]["idleUnchanged"]*100:.1f} %, moved {g[p]["shares"]["idleMoved"]*100:.1f} %), painted {g[p]["shares"]["painted"]*100:.2f} %, invented colours in the painted region {g[p]["inventedColourShareOfPainted"]*100:.1f} %, canvas and baseline = idle\'s', False) for p in ('cast', 'hurt')]))
    s = 0.5
    tiles = [label(on(im).resize((int(im.width * s), int(im.height * s)), Image.LANCZOS), t) for im, t in ((idle, 'idle (r3, anchor)'), (c, 'cast (candidate)'), (h, 'hurt (candidate)'), (idle, 'none (= idle + engine flinch)'))]
    blocks.append(row(tiles))
    x0, y0, x1, y1 = box
    def crop(im, paint=None):
        t = on(im).crop(box)
        if paint:
            m = Image.open(paint).convert('L').crop(box); tint = Image.new('RGB', t.size, (255, 0, 255))
            t = Image.composite(Image.blend(t, tint, 0.45), t, m)
        return t
    import os
    pc = f'{cand}/{subj}/cast.painted.png'; pc = pc if os.path.exists(pc) else None
    ph = f'{cand}/{subj}/hurt.painted.png'; ph = ph if os.path.exists(ph) else None
    blocks.append(text_block([(f'{name}: 1:1 crops (x {x0}..{x1}, y {y0}..{y1})', True)], 44))
    tiles = [label(crop(idle), 'idle 1:1'), label(crop(c), 'cast 1:1'), label(crop(c, pc), 'cast, painted px tinted')]
    if subj == 'seymour-macalania':
        tiles.append(label(crop(h), 'hurt 1:1'))
    blocks.append(row(tiles))
    if subj != 'seymour-macalania':
        blocks.append(row([label(crop(h), 'hurt 1:1'), label(crop(h, ph), 'hurt, painted px tinted')]))
# in-game
blocks.append(text_block([('In battle at 1600x900 (seed 1, rig "%s", PYREFLY_BROWSER=gpu, %s). Hurt and none are captured mid-flinch, the same frame count after recoil().' % (ij.get('rig'), ij.get('renderer', '')[:60]), True)], 44))
frames = [('cand', 'idle', 'idle'), ('cand', 'cast', 'cast (all three)'), ('cand', 'hurt-seymour', 'Seymour hurt (candidate)'), ('none', 'hurt-seymour', 'Seymour none (idle + flinch)'),
          ('cand', 'hurt-guardian', 'Guardians hurt (candidate)'), ('none', 'hurt-guardian', 'Guardians none (idle + flinch)')]
fr = [label(Image.open(f'{ing}/{s}-{n}-frame.png').convert('RGB').resize((800, 450), Image.LANCZOS), t) for s, n, t in frames]
blocks.append(row(fr[0:3])); blocks.append(row(fr[3:6]))
blocks.append(text_block([('In battle, 1:1 actor crops from the 1600x900 frames', True)], 44))
for idx, name, sets in [(0, 'Seymour', [('cand', 'idle'), ('cand', 'cast'), ('cand', 'hurt-seymour'), ('none', 'hurt-seymour')]),
                        (1, 'Guardian A', [('cand', 'idle'), ('cand', 'cast'), ('cand', 'hurt-guardian'), ('none', 'hurt-guardian')])]:
    tiles = []
    for s, n in sets:
        r = ij['sets'][s]['shots'][n][idx]['rect']
        im = Image.open(f'{ing}/{s}-{n}-frame.png').convert('RGB')
        bx = (max(0, int(r['x'] - 60)), max(0, int(r['y'] - 40)), min(1600, int(r['x'] + r['w'] + 60)), min(900, int(r['y'] + r['h'] + 30)))
        tiles.append(label(im.crop(bx), f'{name} {n if s == "cand" else "none"}'))
    blocks.append(row(tiles))
H = sum(b.height for b in blocks); sheet = Image.new('RGB', (W, H), BG); y = 0
for b in blocks: sheet.paste(b, (0, y)); y += b.height
sheet.save(out, quality=84); print(out, sheet.size)
