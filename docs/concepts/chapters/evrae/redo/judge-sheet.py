"""Independent judge sheet for the Evrae redo (c152aff). Read-only on the installs.
Rows: picked concept B | the installed state whole on mid-grey | two native 1:1 crops | verdict.
Chapter card row: the 1344 card | three 1:1 crops of the 2x master.
Run: python judge-sheet.py  (from the repo root) -> docs/concepts/chapters/evrae/redo/judge-sheet.jpg"""
from PIL import Image, ImageDraw, ImageFont
P = 'public/art/characters/evrae/'
OUT = 'docs/concepts/chapters/evrae/redo/judge-sheet.jpg'
GREY = (128, 128, 128)
try:
    F = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 22); FS = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 17)
except OSError:
    F = FS = ImageFont.load_default()

def grey(f):
    im = Image.open(f).convert('RGBA'); b = Image.new('RGBA', im.size, GREY + (255,)); b.alpha_composite(im); return b.convert('RGB')

def fit(im, w, h):
    s = min(w / im.width, h / im.height); return im.resize((int(im.width * s), int(im.height * s)), Image.LANCZOS)

concept = grey('docs/concepts/chapters/evrae/renders/evrae-b.png')
ROWS = [  # state, score, crops (x0,y0,size) at native pixels, caption lines
    ('idle-near', 8, [(200, 40, 260), (560, 300, 260)], ['8  worst: silhouette (concept framing,', 'head not the NEAR "upper third")', 'colour 202/0.22 = anchor; cut clean']),
    ('idle-far', 7, [(0, 0, 260), (440, 200, 130)], ['7  worst: colour (spines dominate,', 'warm 0.37; belly reads grey-pink)', 'streak reads; faint belly rim']),
    ('breath-charge', 6, [(250, 90, 260), (700, 250, 140)], ['6  worst: style (flat vector disc,', 'no scale/plate paint; jaw open);', '1-px white fringe on serrations']),
    ('hurt', 6, [(210, 0, 260), (60, 250, 260)], ['6  worst: silhouette (idle coil, only', 'head lifts) + lavender ghost coil;', 'white fringe 5.1% of edge; 0.67x']),
    ('ko', 5, [(370, 320, 130), (40, 440, 260)], ['5  worst: cut-out: cleanup fill left a', 'hard red/brown BLOCK at 419-465,386-432', '+ white oval hole @429,338; eye open']),
]
W, TH = 2400, 300
rows = []
for name, score, crops, cap in ROWS:
    r = Image.new('RGB', (W, TH), (24, 24, 24)); d = ImageDraw.Draw(r)
    r.paste(fit(concept, 360, TH - 30), (0, 30)); d.text((4, 4), 'concept B (anchor)', font=FS, fill=(230, 230, 230))
    st = grey(P + name + '.png'); r.paste(fit(st, 620, TH - 30), (370, 30)); d.text((374, 4), f'{name} installed ({st.width}x{st.height})', font=FS, fill=(230, 230, 230))
    x = 1000
    for (cx, cy, s) in crops:
        c = st.crop((cx, cy, cx + s, cy + s))
        if s < 260: c = c.resize((s * 2, s * 2), Image.NEAREST)
        c = c.crop((0, 0, 260, 260)); r.paste(c, (x, 30)); d.text((x + 2, 4), f'1:1 @{cx},{cy}' + (' (2x)' if s < 260 else ''), font=FS, fill=(230, 230, 230)); x += 270
    col = (90, 220, 110) if score >= 7 else (240, 90, 80)
    d.text((1560, 40), f'{name}: {score}/10', font=F, fill=col)
    for i, line in enumerate(cap): d.text((1560, 80 + 28 * i), line, font=FS, fill=(235, 235, 235))
    rows.append(r)
# chapter card row
card = Image.open('public/art/pause/evrae-chapter-card.png').convert('RGB'); m = Image.open('public/art/pause/evrae-chapter-card.2x.webp').convert('RGB')
r = Image.new('RGB', (W, 420), (24, 24, 24)); d = ImageDraw.Draw(r)
r.paste(fit(card, 660, 390), (0, 30)); d.text((4, 4), 'chapter card 1344x768', font=FS, fill=(230, 230, 230))
x = 670
for lab, box in [('2x master 1:1 wyrm head', (1080, 200, 1470, 590)), ('2x master 1:1 deck', (100, 1140, 490, 1530)), ('2x master 1:1 prow', (300, 660, 690, 1050))]:
    r.paste(m.crop(box), (x, 30)); d.text((x + 2, 4), lab, font=FS, fill=(230, 230, 230)); x += 400
d.text((1880, 40), 'card: 6/10', font=F, fill=(240, 90, 80))
for i, line in enumerate(['worst: legibility at 1:1 of', 'the ship: deck = plain grey with', 'random coloured dashes, prow =', 'a featureless blade with a hard', 'orange seam. Wyrm reads; spines', 'orange not crimson; rail reads.']):
    d.text((1880, 80 + 28 * i), line, font=FS, fill=(235, 235, 235))
rows.append(r)
hdr = Image.new('RGB', (W, 50), (10, 10, 10)); ImageDraw.Draw(hdr).text((10, 12), 'Evrae redo c152aff - independent judge 2026-09-22 - every file CANDIDATE - pass at 7 (worst criterion = score) - FFX only', font=F, fill=(255, 220, 120))
sheet = Image.new('RGB', (W, 50 + sum(x.height + 8 for x in rows)), (10, 10, 10)); sheet.paste(hdr, (0, 0)); y = 50
for x in rows: sheet.paste(x, (0, y)); y += x.height + 8
sheet.save(OUT, quality=88); print(OUT, sheet.size)
