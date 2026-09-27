"""Hi-fi round, house Guard Scorpion p1: paint out the stray horizontal pink beam the model drew right across the
frame (rows ~766-795). In every column where the rows just above and below the beam are both flat background
(grey, low saturation, alike), the band is refilled by interpolating between them; where the body covers the
beam nothing changes. Our own render only; nothing mirrored. Usage: python house-gs-fix.py <in> <out>"""
import sys
import numpy as np
from PIL import Image
src, out = sys.argv[1:3]
a = np.asarray(Image.open(src).convert('RGB')).astype(float)
Y0, Y1 = 742, 820
top, bot = a[Y0], a[Y1]
sat = lambda p: p.max(-1) - p.min(-1)
ok = (sat(top) < 22) & (sat(bot) < 22) & (np.abs(top - bot).max(-1) < 30)
t = np.linspace(0, 1, Y1 - Y0 + 1)[:, None, None]
band = top[None] * (1 - t) + bot[None] * t
a[Y0:Y1 + 1][:, ok] = band[:, ok]
# the stubs right against the body (where one of the guide rows is body): beam-coloured pixels only
# (pink: blue above green, or the near-white core), repainted with the background just above the band
bgc = np.median(a[700:740, 0:200].reshape(-1, 3), 0)
for x0, x1 in ((300, 460), (1540, 1820)):
    blk = a[755:806, x0:x1]
    r, g, b = blk[..., 0], blk[..., 1], blk[..., 2]
    beam = (r > 90) & (g > 55) & (r - g > 30) & (b > 0.8 * g) | ((r > 200) & (g > 150) & (b > 150) & (b >= g - 5))
    blk[beam] = bgc
    print('stub px', int(beam.sum()))
Image.fromarray(a.clip(0, 255).astype(np.uint8)).save(out)
print('columns refilled', int(ok.sum()), 'of', a.shape[1])
