import sys, os
from PIL import Image, ImageDraw, ImageFont
D = r"D:/Final Fantasy/docs/concepts/chapters/macalania/r3-seymour"
C = Image.open(r"D:/Final Fantasy/docs/concepts/chapters/macalania/renders/seymour-b.png").convert('RGBA')
I = Image.open(r"D:/Tools/pyrefly-art-backup/candidates/2026-09-23-ch7-goons/seymour-macalania/replaced/idle.png").convert('RGBA')
N = Image.open('idle-r3.png').convert('RGBA')
BG = (70, 58, 44)
try: F = ImageFont.truetype('arial.ttf', 22); FS = ImageFont.truetype('arial.ttf', 16)
except Exception: F = FS = ImageFont.load_default()
def flat(im, box=None, s=1):
    if box: im = im.crop(box)
    b = Image.new('RGBA', im.size, BG + (255,)); b.alpha_composite(im); b = b.convert('RGB')
    return b.resize((b.width * s, b.height * s), Image.NEAREST) if s != 1 else b
def fit(im, h):
    return im.resize((round(im.width * h / im.height), h), Image.LANCZOS)
COLW = 560
rows = []
H = 820
rows.append(('whole (scaled to one height)', [fit(flat(C), H), fit(flat(I), H), fit(flat(N), H)]))
crops = {
 'face 1:1 (x2)':        [(300, 30, 460, 190), (140, 40, 300, 200), (300, 30, 460, 190)],
 'ear 1:1 (x3)':         [(380, 40, 480, 120), (215, 60, 315, 140), (380, 40, 480, 120)],
 'hands 1:1 (x2)':       [(220, 270, 420, 420), (40, 290, 240, 440), (220, 270, 420, 420)],
 'sash + chain 1:1 (x2)':[(210, 400, 380, 560), (190, 560, 360, 720), (210, 400, 380, 560)],
 'hem lattice 1:1':      [(300, 800, 700, 1060), (60, 900, 460, 1160), (300, 800, 700, 1060)],
 'hem right edge 1:1 (x2)': [(640, 1000, 781, 1186), (380, 1000, 553, 1176), (640, 1000, 804, 1186)],
}
scale = {'face 1:1 (x2)': 2, 'ear 1:1 (x3)': 3, 'hands 1:1 (x2)': 2, 'sash + chain 1:1 (x2)': 2, 'hem lattice 1:1': 1, 'hem right edge 1:1 (x2)': 2}
for k, bx in crops.items():
    rows.append((k, [flat(im, b, scale[k]) for im, b in zip((C, I, N), bx)]))
ig = []
for v in ('installed', 'r3'):
    p = os.path.join(D, f'ingame-{v}-near.png')
    ig.append(Image.open(p).convert('RGB') if os.path.exists(p) else Image.new('RGB', (300, 400), (40, 40, 40)))
rows.append(('in battle, near camera (enemy rig), 1600x900', [Image.new('RGB', (10, 10), BG)] + [fit(x, 600) for x in ig]))
ig2 = []
for v in ('installed', 'r3'):
    p = os.path.join(D, f'ingame-{v}-frame.png')
    ig2.append(Image.open(p).convert('RGB') if os.path.exists(p) else Image.new('RGB', (300, 400), (40, 40, 40)))
rows.append(('in battle, the chapter opening camera, whole 1600x900 frame (scaled)', [Image.new('RGB', (10, 10), BG)] + ig2))
W = COLW * 3 + 40
total = 90 + sum(max(t.height for t in ts) + 50 for _, ts in rows)
S = Image.new('RGB', (W, total), (24, 22, 20)); d = ImageDraw.Draw(S)
d.text((20, 14), 'Seymour, Macalania (FFX only) - r3 idle derived from the approved concept B pixels. CANDIDATE, not approved.', fill=(240, 220, 170), font=F)
for i, t in enumerate(['approved concept pick B (seymour-b.png)', 'idle installed before r3 (judged 4-6; in game mirrored, faces away)', 'r3 candidate (concept pixels; ear + hem repaired)']):
    d.text((20 + i * COLW, 50), t, fill=(220, 220, 220), font=FS)
y = 80
for label, ts in rows:
    d.text((20, y), label, fill=(200, 180, 120), font=FS); y += 24
    for i, t in enumerate(ts):
        if t.width > COLW - 10: t = t.resize((COLW - 10, round(t.height * (COLW - 10) / t.width)), Image.LANCZOS)
        S.paste(t, (20 + i * COLW, y))
    y += max(t.height for t in ts) + 26
S.save(os.path.join(D, 'sheet.jpg'), quality=88)
print(S.size)
