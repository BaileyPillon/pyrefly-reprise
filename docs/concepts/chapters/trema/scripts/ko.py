# The link beat as three stills (no HUD; a cutscene moment): 1 Paragon falls, 2 Trema appears and breaks it,
# 3 Paragon is pyreflies and Trema takes the floor. Stand-in effects in PIL; the engine would use particles.
import sys, random, numpy as np
from PIL import Image, ImageFilter, ImageDraw, ImageEnhance
plate, para, trema, pre = sys.argv[1:5]
PG, PW = (139, 232, 176), (233, 255, 244)
bg0 = Image.open(plate).convert('RGBA')
def fit(path, h):
    im = Image.open(path).convert('RGBA'); im = im.crop(im.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox())
    s = h / im.height; return im.resize((round(im.width * s), round(h)), Image.LANCZOS)
P = fit(para, 320); T = fit(trema, 300)
def put(bg, im, x, y): L = Image.new('RGBA', bg.size, (0, 0, 0, 0)); L.paste(im, (round(x - im.width / 2), round(y - im.height)), im); return Image.alpha_composite(bg, L)
def motes(bg, box, n, seed):
    random.seed(seed); L = Image.new('RGBA', bg.size, (0, 0, 0, 0))
    for _ in range(n):
        x, y, r = random.uniform(box[0], box[2]), random.uniform(box[1], box[3]), random.uniform(2, 6)
        g = Image.new('RGBA', (int(r * 8), int(r * 8)), (0, 0, 0, 0)); d = ImageDraw.Draw(g)
        d.ellipse((r, r, r * 7, r * 7), fill=random.choice([PG, PW]) + (110,)); g = g.filter(ImageFilter.GaussianBlur(r * 1.3))
        ImageDraw.Draw(g).ellipse((r * 3.4, r * 3.4, r * 4.6, r * 4.6), fill=PW + (245,)); L.alpha_composite(g, (int(x - r * 4), int(y - r * 4)))
    return Image.alpha_composite(bg, L)
def dim(im, k): a = im.getchannel('A'); im = ImageEnhance.Brightness(ImageEnhance.Color(im.convert('RGB')).enhance(0.5)).enhance(k).convert('RGBA'); im.putalpha(a); return im
def dissolve(im, frac, seed):
    rng = np.random.default_rng(seed); n = np.asarray(Image.fromarray((rng.random((im.height // 6 + 1, im.width // 6 + 1)) * 255).astype(np.uint8)).resize(im.size, Image.BILINEAR)).astype(np.float32) / 255
    a = np.asarray(im.getchannel('A')).astype(np.float32); a = np.where(n < frac, 0, a); out = im.copy(); out.putalpha(Image.fromarray(a.astype(np.uint8))); return out
x0, y0 = 975, 560
f1 = put(bg0, dim(P, 0.7), x0, y0 + 20)
f2 = put(bg0, dissolve(dim(P, 0.8), 0.45, 1), x0, y0 + 20); f2 = motes(f2, (x0 - 230, y0 - 300, x0 + 230, y0), 120, 2); f2 = put(f2, T, 1230, 520)
glow = Image.new('RGBA', bg0.size, (0, 0, 0, 0)); ImageDraw.Draw(glow).ellipse((1150, 330, 1250, 430), fill=PG + (150,)); f2 = Image.alpha_composite(f2, glow.filter(ImageFilter.GaussianBlur(30)))
f3 = motes(bg0, (x0 - 200, 120, x0 + 200, y0), 70, 3); f3 = put(f3, T, 905, 548)
for i, f in enumerate([f1, f2, f3], 1):
    d = ImageDraw.Draw(f); f.convert('RGB').save(f'{pre}-{i}.jpg', quality=88)
print('ok')
