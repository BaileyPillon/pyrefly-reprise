# Second try: an irregular, natural cave opening (noise-perturbed, lopsided), not an arch.
import math, numpy as np
from PIL import Image, ImageDraw, ImageFilter
src = Image.open('D:/Tools/pyrefly-scratch/gippal-options/renders/den-a3.png').convert('RGB'); W, H = src.size
rng = np.random.default_rng(7)
CX, CY, RX, RY = 1245, 470, 190, 270
def blob(scale, rough):
    pts = []; n = 72; ph = rng.random(4) * 6.28
    for i in range(n):
        a = 2 * math.pi * i / n
        r = 1 + rough * (0.08 * math.sin(3 * a + ph[0]) + 0.05 * math.sin(7 * a + ph[1]) + 0.03 * math.sin(13 * a + ph[2]))
        x = CX + RX * scale * r * math.cos(a) * (0.8 if math.sin(a) < 0 else 1.0)
        y = CY + RY * scale * r * math.sin(a)
        pts.append((x, min(y, 668)))
    return pts
core = Image.new('L', (W, H), 0); ImageDraw.Draw(core).polygon(blob(1.0, 1.4), fill=255)
rim = Image.new('L', (W, H), 0); ImageDraw.Draw(rim).polygon(blob(1.18, 1.8), fill=255)
blk = Image.composite(Image.new('RGB', (W, H), (30, 46, 62)), src, rim.filter(ImageFilter.GaussianBlur(18)))
blk = Image.composite(Image.new('RGB', (W, H), (3, 6, 11)), blk, core.filter(ImageFilter.GaussianBlur(8)))
blk.save('work/den-blockin2.png')
m = Image.new('L', (W, H), 0); ImageDraw.Draw(m).polygon(blob(1.45, 1.0), fill=255)
m = m.filter(ImageFilter.GaussianBlur(28)); m.save('work/den-tunnel-mask2.png'); print(m.getbbox())
