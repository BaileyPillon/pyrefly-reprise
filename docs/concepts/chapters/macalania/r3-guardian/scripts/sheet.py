# Guado Guardian r3 sheet (FFX only): approved concept A | idle installed before r3 | r3 candidate,
# then 1:1 crops, the running battle (both Guardians, 1600x900) and the Seymour hurt facing check.
# Run: D:/Tools/sd-scripts/.venv/Scripts/python.exe scripts/sheet.py   (cwd = r3-guardian)
import os
from PIL import Image, ImageDraw, ImageFont
D = r"D:/Final Fantasy/docs/concepts/chapters/macalania/r3-guardian"
L = r"D:/Tools/pyrefly-lora/guardian/r3"
C = Image.open(r"D:/Final Fantasy/docs/concepts/chapters/macalania/renders/guardian-a.png").convert('RGBA')
I = Image.open(r"D:/Tools/pyrefly-art-backup/candidates/2026-09-23-ch7-r2/guado-guardian/replaced/idle.png").convert('RGBA')
N = Image.open(r"D:/Final Fantasy/public/art/characters/guado-guardian/idle.png").convert('RGBA')
BG = (70, 58, 44)
try: F = ImageFont.truetype('arial.ttf', 22); FS = ImageFont.truetype('arial.ttf', 16)
except Exception: F = FS = ImageFont.load_default()
def flat(im, box=None, s=1):
    if box: im = im.crop(box)
    b = Image.new('RGBA', im.size, BG + (255,)); b.alpha_composite(im); b = b.convert('RGB')
    return b.resize((b.width * s, b.height * s), Image.NEAREST) if s != 1 else b
def fit(im, h):
    return im.resize((round(im.width * h / im.height), h), Image.LANCZOS)
def shot(name, box):
    p = os.path.join(D, name.replace('.png', '.jpg'))
    return Image.open(p).convert('RGB').crop(box) if os.path.exists(p) else Image.new('RGB', (300, 200), (40, 40, 40))
BLANK = Image.new('RGB', (10, 10), BG)
COLW = 560
rows = [('whole figure (each scaled to one height)', [fit(flat(C), 820), fit(flat(I), 820), fit(flat(N), 820)])]
# concept (x, y) = r3 (x, y + 3): r3 = raw - (2, 20), raw = concept + (2, 23)
crops = {
    'head 1:1':                [(190, 0, 500, 327), (190, 20, 450, 300), (190, 0, 500, 330)],
    'hand on the spear 1:1':   [(220, 437, 480, 637), (90, 420, 350, 640), (220, 440, 480, 640)],
    'spear head 1:1':          [(560, 677, 823, 857), (0, 660, 230, 1110), (560, 680, 826, 860)],
    'hem and feet 1:1':        [(180, 997, 560, 1150), (200, 1020, 580, 1179), (180, 1000, 560, 1153)],
}
for k, bx in crops.items():
    rows.append((k, [flat(im, b) for im, b in zip((C, I, N), bx)]))
pair = (590, 320, 1340, 740)
rows.append(('in battle, both Guardians, 1:1 crop of the 1600x900 frame: idle installed before r3 (seed 1, same camera)', [shot('ingame-installed-frame.png', pair)]))
rows.append(('in battle, both Guardians, 1:1 crop of the 1600x900 frame: r3 candidate', [shot('ingame-r3-frame.png', pair)]))
rows.append(('in battle, whole 1600x900 frame (scaled)',
             [BLANK, shot('ingame-installed-frame.png', (0, 0, 1600, 900)), shot('ingame-r3-frame.png', (0, 0, 1600, 900))]))
rows.append(('Seymour hurt.png facing: the painting (faces left) | in battle with the 2026-09-22 sidecar "right" (mirrored, faces away) | sidecar fixed to "left"',
             [fit(flat(Image.open(r"D:/Final Fantasy/public/art/characters/seymour-macalania/hurt.png").convert('RGBA')), 460),
              shot('ingame-hurt-before-fix-frame.png', (700, 200, 1100, 700)), shot('ingame-hurt-installed-frame.png', (700, 300, 1100, 760))]))
PB = (270, 440, 526, 696)
raw = Image.open(os.path.join(L, 'raw.png')).convert('RGB').crop(PB)
opt = [Image.open(os.path.join(L, f)).convert('RGB').resize((256, 256), Image.LANCZOS) if os.path.exists(os.path.join(L, f)) else BLANK
       for f in ('pouch1.n102.png', 'pouch1.n111.png')]
rows.append(('OPTION for Bailey, NOT installed: research 9.3 belt pouch as a masked inpaint on the concept pixels (1 prompt, 32.8 s). x2. concept | seed 9101 (denoise 0.62) | seed 9104 (0.7)',
             [x.resize((512, 512), Image.NEAREST) if x is not BLANK else x for x in [raw] + opt]))
W = COLW * 3 + 40
total = 90 + sum(max(t.height for t in ts) + 50 for _, ts in rows)
S = Image.new('RGB', (W, total), (24, 22, 20)); d = ImageDraw.Draw(S)
d.text((20, 14), 'Guado Guardian, Macalania (FFX only) - r3 idle = the approved concept A pixels, cut out and framed. CANDIDATE, not approved.', fill=(240, 220, 170), font=F)
for i, t in enumerate(['approved concept pick A (guardian-a.png)', 'idle installed before r3 (seed 520002, judged 6)', 'r3 candidate, installed (concept pixels, no repaint)']):
    d.text((20 + i * COLW, 50), t, fill=(220, 220, 220), font=FS)
y = 80
for label, ts in rows:
    d.text((20, y), label, fill=(200, 180, 120), font=FS); y += 24
    hs = []
    for i, t in enumerate(ts):
        if len(ts) > 1 and t.width > COLW - 10: t = t.resize((COLW - 10, round(t.height * (COLW - 10) / t.width)), Image.LANCZOS)
        S.paste(t, (20 + i * COLW, y)); hs.append(t.height)
    y += max(hs) + 26
S = S.crop((0, 0, W, y + 10))
S.save(os.path.join(D, 'sheet.jpg'), quality=88)
print(S.size)
