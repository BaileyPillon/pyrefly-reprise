# Torn robe (research ffx2-trema.md §6.2 "an old man in a torn Yevon priest's robe"): cut ragged tears into the
# silhouette edges of the picked O-1 A pixels. Erases alpha only (and darkens a 2 px rim on the new edge so the cut
# reads as cloth, not a scissor line); one rip in the coat panel shows the black under-robe. No GPU.
# Usage: tear.py in.png out.png
import sys, numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage
inp, out = sys.argv[1:3]
im = Image.open(inp).convert('RGBA'); A = np.asarray(im).astype(np.float32); al = A[..., 3]; H, W = al.shape
rng = np.random.default_rng(924113)
SS = 4
cut = Image.new('L', (W * SS, H * SS), 0); dc = ImageDraw.Draw(cut)
def profile(n, notches, fray=3.0):
    # tattered strips: the edge is split into strips of uneven width, each ending at its own length with a slanted,
    # frayed end; narrow deep slits between some strips; `notches` (centre, width, depth) add the big missing pieces.
    d = np.zeros(n); x = 0; maxdep = max([dep for _, _, dep in notches] + [8])
    while x < n:
        w = int(rng.integers(7, 22)); dep = rng.uniform(0.1, 0.55) * maxdep; slant = rng.uniform(-0.5, 0.5)
        seg = np.arange(min(w, n - x)); d[x:x + len(seg)] = np.clip(dep + slant * (seg - w / 2), 0, None)
        if rng.random() < 0.55 and x + w < n:  # a slit
            sw = int(rng.integers(2, 5)); sd = rng.uniform(0.7, 1.1) * maxdep
            d[x + w - sw: x + w] = np.maximum(d[x + w - sw: x + w], sd * np.hanning(sw + 2)[1:-1])
        x += w
    for c, w, dep in notches:
        t = np.arange(n); bump = dep * np.clip(1 - ((t - c) / (w / 2)) ** 2, 0, None) ** 0.6
        d = np.maximum(d, bump)
    d += fray * rng.uniform(0, 1, n) ** 3
    return ndimage.uniform_filter1d(d, 2)
def bottom_edge(x0, x1, ylo, yhi, notches, fray=3.0):
    xs = np.arange(x0, x1); ey = []
    for x in xs:
        col = np.nonzero(al[ylo:yhi, x] > 128)[0]; ey.append(ylo + col.max() if len(col) else np.nan)
    ey = np.array(ey); ok = ~np.isnan(ey)
    ey = np.interp(xs, xs[ok], ey[ok]); d = profile(len(xs), [(c - x0, w, dep) for c, w, dep in notches], fray)
    pts = [(x * SS, (y - dd) * SS) for x, y, dd in zip(xs, ey, d)]
    pts += [(x1 * SS, (ey[-1] + 30) * SS), (x0 * SS, (ey[0] + 30) * SS)]
    dc.polygon(pts, fill=255)
def right_edge(y0, y1, xlo, xhi, notches, fray=2.5):
    ys = np.arange(y0, y1); ex = []
    for y in ys:
        row = np.nonzero(al[y, xlo:xhi] > 128)[0]; ex.append(xlo + row.max() if len(row) else np.nan)
    ex = np.array(ex); ok = ~np.isnan(ex); ex = np.interp(ys, ys[ok], ex[ok])
    d = profile(len(ys), [(c - y0, w, dep) for c, w, dep in notches], fray)
    pts = [((x - dd) * SS, y * SS) for y, x, dd in zip(ys, ex, d)]
    pts += [((ex[-1] + 30) * SS, y1 * SS), ((ex[0] + 30) * SS, y0 * SS)]
    dc.polygon(pts, fill=255)
# black under-robe hem
bottom_edge(282, 525, 1040, 1167, [(300, 22, 26), (336, 16, 14), (372, 30, 38), (420, 18, 20), (455, 26, 32), (500, 20, 18)], 3.0)
# white coat train with its red lining (bottom), right half
bottom_edge(525, 812, 1060, 1167, [(560, 26, 30), (608, 18, 16), (655, 34, 44), (700, 20, 22), (742, 28, 30), (785, 18, 16)], 3.5)
# the coat's outer (right) edge, lower third
right_edge(900, 1050, 560, 700, [(930, 26, 10), (1010, 30, 12)], 1.5)
# the hanging left sleeve's bottom edge
bottom_edge(186, 236, 660, 730, [(196, 16, 16), (214, 12, 9), (228, 14, 13)], 2.0)
cm = np.asarray(cut.resize((W, H), Image.LANCZOS)).astype(np.float32) / 255
newal = al * (1 - cm)
# rim: the 2 px of cloth just inside the new edge, darkened a little (not on the black robe)
cutb = cm > 0.5
rim = ndimage.binary_dilation(cutb, iterations=2) & ~cutb & (newal > 40)
lum = A[..., :3].mean(-1)
k = np.where(rim & (lum > 70), 0.72, 1.0)
rgb = A[..., :3] * k[..., None]
# one rip in the white coat panel, showing the black under-robe (flat under-robe black, as the robe is painted)
rip = Image.new('L', (W * SS, H * SS), 0); dr = ImageDraw.Draw(rip)
# a lens-shaped rip along the cloth's fall line (from (571, 1010) to (592, 1098)), its edges frayed
t = np.linspace(0, 1, 40); cx = 571 + 21 * t; cy = 1010 + 88 * t; half = 6.5 * np.sin(np.pi * t) ** 0.8
nx, ny = 88 / 90.5, -21 / 90.5
jl = rng.uniform(-1.6, 1.6, 40); jr = rng.uniform(-1.6, 1.6, 40)
pts = [(x + nx * (h + a), y + ny * (h + a)) for x, y, h, a in zip(cx, cy, half, jl)] +       [(x - nx * (h + a), y - ny * (h + a)) for x, y, h, a in zip(cx[::-1], cy[::-1], half[::-1], jr[::-1])]
dr.polygon([(x * SS, y * SS) for x, y in pts], fill=255)
rm = np.asarray(rip.resize((W, H), Image.LANCZOS)).astype(np.float32) / 255
under = np.array([12, 11, 16], np.float32)
rgb = rgb * (1 - rm[..., None]) + under * rm[..., None]
ripr = ndimage.binary_dilation(rm > 0.5, iterations=2) & ~(rm > 0.5)
rgb = np.where(ripr[..., None], rgb * 0.8, rgb)
res = np.dstack([rgb, newal]).clip(0, 255).astype(np.uint8)
Image.fromarray(res, 'RGBA').save(out)
chg = (np.abs(res.astype(int) - A.astype(int)).max(-1) > 2)
Image.fromarray((chg * 255).astype(np.uint8)).save(out[:-4] + '-changed.png')
print(out, 'changed px', int(chg.sum()), 'alpha removed px', int(((al > 128) & (newal <= 128)).sum()))
