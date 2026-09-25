# The link (O-2b, picked): Trema destroys Paragon, staged as three 1600x900 stills over the real engine frame with the
# enemy hidden and the HUD off (a cutscene moment). Uses the INSTALLED candidates. The dissolve and the motes are
# stand-ins for the engine's pyrefly particles (ko.py of the options round, same colours: --pyre-green #8BE8B0,
# --pyre-white #E9FFF4). Ground points and heights come from the engine projection of the boss spot.
# Usage: link.py clean.png outprefix  (boss spot and sizes below)
import sys, random, numpy as np
from PIL import Image, ImageFilter, ImageDraw, ImageEnhance
plate, pre = sys.argv[1:3]
ART = 'D:/Final Fantasy/public/art/characters/'
PG, PW = (139, 232, 176), (233, 255, 244)
bg0 = Image.open(plate).convert('RGBA')
BX, BY, PH = 884, 538, 419          # engine: boss base and projected height at world height 4.1 (Paragon)
TH = round(PH * 0.72)               # Trema at 0.72 of that (the options round's 300 px, ours)
def feetbox(im):
    a = np.asarray(im.getchannel('A')) >= 90; rows = np.nonzero(a.sum(1) >= 3)[0]; cols = np.nonzero(a.any(0))[0]
    return int(rows.min()), int(rows.max()), int(cols.min()), int(cols.max())
def fit(path, h, idle=None):
    im = Image.open(path).convert('RGBA'); ref = Image.open(idle).convert('RGBA') if idle else im
    t, b, _, _ = feetbox(ref); k = h / (b - t)
    return im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS), k
def put(bg, im, x, y, feet_row):
    a = np.asarray(im.getchannel('A')) >= 90; cols = np.nonzero(a[max(0, feet_row - 30):feet_row + 1].any(0))[0]
    cx = (cols.min() + cols.max()) / 2 if len(cols) else im.width / 2
    sh = Image.new('RGBA', bg.size, (0, 0, 0, 0)); d = ImageDraw.Draw(sh); rw = (cols.max() - cols.min()) / 2 + 10 if len(cols) else 60
    d.ellipse((x - rw, y - 8, x + rw, y + 8), fill=(10, 0, 20, 110)); bg = Image.alpha_composite(bg, sh.filter(ImageFilter.GaussianBlur(6)))
    L = Image.new('RGBA', bg.size, (0, 0, 0, 0)); L.paste(im, (round(x - cx), round(y - feet_row)), im); return Image.alpha_composite(bg, L)
def motes(bg, box, n, seed, alpha=1.0):
    random.seed(seed); L = Image.new('RGBA', bg.size, (0, 0, 0, 0))
    for _ in range(n):
        x, y, r = random.uniform(box[0], box[2]), random.uniform(box[1], box[3]), random.uniform(2, 6)
        g = Image.new('RGBA', (int(r * 8), int(r * 8)), (0, 0, 0, 0)); d = ImageDraw.Draw(g)
        d.ellipse((r, r, r * 7, r * 7), fill=random.choice([PG, PW]) + (int(110 * alpha),)); g = g.filter(ImageFilter.GaussianBlur(r * 1.3))
        ImageDraw.Draw(g).ellipse((r * 3.4, r * 3.4, r * 4.6, r * 4.6), fill=PW + (int(245 * alpha),)); L.alpha_composite(g, (int(x - r * 4), int(y - r * 4)))
    return Image.alpha_composite(bg, L)
def dim(im, k):
    a = im.getchannel('A'); im = ImageEnhance.Brightness(ImageEnhance.Color(im.convert('RGB')).enhance(0.55)).enhance(k).convert('RGBA'); im.putalpha(a); return im
def dissolve(im, frac, seed):
    rng = np.random.default_rng(seed); n = np.asarray(Image.fromarray((rng.random((im.height // 6 + 1, im.width // 6 + 1)) * 255).astype(np.uint8)).resize(im.size, Image.BILINEAR)).astype(np.float32) / 255
    a = np.asarray(im.getchannel('A')).astype(np.float32); a = np.where(n < frac, 0, a); out = im.copy(); out.putalpha(Image.fromarray(a.astype(np.uint8))); return out
P, kp = fit(ART + 'paragon/idle.png', PH); pf = round(feetbox(Image.open(ART + 'paragon/idle.png'))[1] * kp)
TI, kt = fit(ART + 'trema/idle.png', TH); tf = round(feetbox(Image.open(ART + 'trema/idle.png'))[1] * kt)
TC, _ = fit(ART + 'trema/cast.png', TH, ART + 'trema/idle.png'); tcf = tf
# 1: Paragon beaten, still standing, dimmed (the last blow landed)
f1 = put(bg0, dim(P, 0.62), BX, BY, pf)
# 2: the old man appears at the far right and breaks it into pyreflies (his hand raised: the cast painting)
f2 = put(bg0, dissolve(dim(P, 0.8), 0.5, 1), BX, BY, pf)
f2 = motes(f2, (BX - 260, BY - PH, BX + 260, BY), 150, 2)
TX, TY = 1330, 505
f2 = put(f2, TC, TX, TY, tcf)
glow = Image.new('RGBA', bg0.size, (0, 0, 0, 0)); hx = TX - 0.30 * TC.width; hy = TY - 0.80 * TH
ImageDraw.Draw(glow).ellipse((hx - 55, hy - 55, hx + 55, hy + 55), fill=PG + (150,)); f2 = Image.alpha_composite(f2, glow.filter(ImageFilter.GaussianBlur(28)))
# 3: Paragon is pyreflies rising; Trema takes the floor at the boss spot
f3 = motes(bg0, (BX - 220, 90, BX + 220, BY - 40), 80, 3, 0.9)
f3 = put(f3, TI, BX, BY, tf)
for i, f in enumerate([f1, f2, f3], 1):
    f.convert('RGB').save(f'{pre}-{i}.jpg', quality=88)
print('ok', PH, TH)
