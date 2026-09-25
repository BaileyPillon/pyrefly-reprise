# B "unsent pallor": derived from Trema A's own pixels (no GPU). Ashen cool grade, hem fading into pyreflies,
# a pale pyrefly rim and motes (the motes and fade would be live particles/shader in the engine, not paint).
# Also: threads.py mode for C (pale threads from the fingertips + motes).
import sys, random, numpy as np
from PIL import Image, ImageFilter, ImageDraw
mode, src, out = sys.argv[1], sys.argv[2], sys.argv[3]
PG, PW = (139, 232, 176), (233, 255, 244)
im = Image.open(src).convert('RGBA'); PAD = 80
W, H = im.width + 2 * PAD, im.height + 2 * PAD
base = Image.new('RGBA', (W, H), (0, 0, 0, 0)); base.paste(im, (PAD, PAD), im)
alpha = base.getchannel('A'); A = np.asarray(alpha).astype(np.float32) / 255
random.seed(11)
def mote_layer(n, pts, rmin, rmax, cols):
    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    for _ in range(n):
        x, y = random.choice(pts); r = random.uniform(rmin, rmax); c = random.choice(cols)
        g = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(g)
        d.ellipse((x - r * 3, y - r * 3, x + r * 3, y + r * 3), fill=c + (90,))
        layer = Image.alpha_composite(layer, g.filter(ImageFilter.GaussianBlur(r * 1.6)))
        ImageDraw.Draw(layer).ellipse((x - r * .6, y - r * .6, x + r * .6, y + r * .6), fill=PW + (240,))
    return layer
dil = np.asarray(alpha.filter(ImageFilter.MaxFilter(45))).astype(np.float32) / 255
ring = np.argwhere((dil > .5) & (A < .5)); ring = [(int(x), int(y)) for y, x in ring]
ys = np.nonzero(A.max(1) > 0)[0]; top, bot = ys.min(), ys.max()
if mode == 'unsent':
    rgb = np.asarray(base).astype(np.float32)[..., :3] / 255
    lum = (0.299 * rgb[..., 0] + 0.587 * rgb[..., 1] + 0.114 * rgb[..., 2])[..., None]
    ash = lum * np.array([0.86, 0.97, 1.0]) * 1.05 + 0.04
    g = np.clip(rgb * 0.35 + ash * 0.65, 0, 1)
    # hem dissolves: alpha ramps from 1 at 72% of the figure's height to 0.15 at the floor, with a noisy edge
    yy = np.arange(H)[:, None].astype(np.float32); t = np.clip((yy - (top + (bot - top) * .72)) / ((bot - top) * .28), 0, 1)
    noise = np.asarray(Image.effect_noise((W, H), 90).filter(ImageFilter.GaussianBlur(6))).astype(np.float32) / 255
    fade = np.clip(1 - t * (0.85 + (noise - .5) * .8), 0.12, 1)
    a2 = A * fade
    arr = np.concatenate([g * 255, (a2 * 255)[..., None]], -1)
    b = Image.fromarray(arr.astype(np.uint8), 'RGBA')
    ero = np.asarray(alpha.filter(ImageFilter.MinFilter(11))).astype(np.float32) / 255
    rim = np.asarray(Image.fromarray((np.clip(A - ero, 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(3))).astype(np.float32) / 255 * a2
    arr = np.asarray(b).astype(np.float32); arr[..., :3] = np.clip(arr[..., :3] + rim[..., None] * np.array(PG) * .6, 0, 255)
    b = Image.fromarray(arr.astype(np.uint8), 'RGBA')
    glow = Image.new('RGBA', (W, H), PG + (0,)); glow.putalpha(Image.fromarray((np.clip(dil - A, 0, 1) * 70).astype(np.uint8)).filter(ImageFilter.GaussianBlur(12)))
    b = Image.alpha_composite(glow, b)
    low = [p for p in ring if p[1] > top + (bot - top) * .55] + [(int(x), int(y)) for y, x in np.argwhere((A > .3) & (np.arange(H)[:, None] > top + (bot - top) * .8))[::40]]
    b = Image.alpha_composite(b, mote_layer(70, ring, 1.5, 4, [PG, PW]))
    b = Image.alpha_composite(b, mote_layer(90, low, 2, 5, [PG, PW]))
else:  # threads: pale pyrefly threads hang from the raised hand(s) down to the floor, plus motes
    b = base.copy(); hands = [tuple(int(v) + PAD for v in h.split(',')) for h in sys.argv[4:]]
    th = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(th)
    for hx, hy in hands:
        for k in range(5):
            x0 = hx + (k - 2) * 9; x1 = x0 - 60 + k * 24 + random.uniform(-20, 20); y1 = H - 20
            pts = [(x0 + (x1 - x0) * s / 20 + 6 * np.sin(s * .9 + k), hy + (y1 - hy) * s / 20) for s in range(21)]
            d.line(pts, fill=PG + (200,), width=2)
    glow = th.filter(ImageFilter.GaussianBlur(4)); b = Image.alpha_composite(b, glow); b = Image.alpha_composite(b, glow); b = Image.alpha_composite(b, th)
    tp = [(hx, int(hy + (H - hy) * s)) for hx, hy in hands for s in np.linspace(0, 1, 40)]
    b = Image.alpha_composite(b, mote_layer(60, ring + tp, 1.5, 4, [PG, PW]))
b.save(out); print(out, b.size)
