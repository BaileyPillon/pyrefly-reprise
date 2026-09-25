# Baralai hero cast (r3 derive): the near forearm, hand and staff rotate as one rigid layer about the elbow, so the staff
# head tips toward the party. The pole hidden behind the coat is rebuilt by tiling the idle's own visible pole slice.
# The chest the forearm uncovers is pre-filled by diffusion; a masked repaint then paints it (seam + chest only).
import sys, json, numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage
ANG = float(sys.argv[1]) if len(sys.argv) > 1 else 22
src = Image.open('renders/baralai.3.png').convert('RGBA')
PL, PT, PB, PR = 260, 60, 40, 60
W, H = src.width + PL + PR, src.height + PT + PB
im = Image.new('RGBA', (W, H), (0, 0, 0, 0)); im.paste(src, (PL, PT), src)
A = np.asarray(im).astype(np.float32)
yy, xx = np.mgrid[0:H, 0:W]; X = xx - PL; Y = yy - PT
alpha = A[..., 3]
r, g, b = A[..., 0], A[..., 1], A[..., 2]
blue = (b > r + 30) & (b > g + 12)
axis = 83 + (Y - 440) * 0.035
# moving layer: staff head/grip/upper hand, the forearm polygon, the visible pole
fore = Image.new('L', (W, H), 0)
ImageDraw.Draw(fore).polygon([(x + PL, y + PT) for x, y in [(118, 300), (130, 298), (205, 340), (250, 368), (266, 392), (258, 420), (232, 428), (190, 405), (120, 362), (104, 345)]], fill=255)
foreM = np.asarray(fore) > 0
upper = (X < 118) & (Y < 445) & ~((X > 104) & (Y < 135))
pole_vis = (Y >= 445) & (np.abs(X - axis) < 16) & (b >= r) & (alpha > 0) & ((Y < 640) | (Y > 980))
M = (upper | foreM | pole_vis) & (alpha > 0)
# rebuild the pole below 445 by tiling rows 445-495 along the axis
slice_rows = []
for y in range(445, 495):
    cx = 83 + (y - 440) * 0.035
    xs = np.arange(int(cx) - 16, int(cx) + 17)
    slice_rows.append((A[y + PT, xs + PL].copy(), int(cx)))
PROFILE = np.median(np.stack([r for r, c in slice_rows]), 0)
pole = np.zeros_like(A)
bottom = 1150
for y in range(445, bottom):
    row = PROFILE
    cx = int(83 + (y - 440) * 0.035)
    xs = np.arange(cx - 16, cx + 17) + PL
    keep = (row[:, 2] > row[:, 0] + 30) & (row[:, 3] > 0)
    tgt = pole[y + PT, xs]
    tgt[keep] = row[keep]
    pole[y + PT, xs] = tgt
# rounded butt of the pole
layer = A * M[..., None]
pm = (pole[..., 3] > 0) & ~M
layer[pm] = pole[pm]
# rest: body without the moving pieces; vacated chest = forearm polygon pixels that the body continues behind
rest = A.copy(); rest[..., 3] = np.where(M | pole_vis, 0, rest[..., 3])
body = rest[..., 3] > 200
hull = ndimage.binary_fill_holes(ndimage.binary_closing(body, iterations=8))
vac = foreM & (alpha > 30) & (X >= 140)
known = body.copy(); col = rest[..., :3].copy()
for it in range(4000):
    s = ndimage.uniform_filter(col * known[..., None], size=(3, 3, 1)); k = ndimage.uniform_filter(known.astype(np.float32), size=3)
    upd = vac & ~known & (k > 0.001)
    if not upd.any(): break
    col[upd] = s[upd] / k[upd][:, None]; known |= upd
rest[..., :3] = np.where(vac[..., None], col, rest[..., :3]); rest[..., 3] = np.where(vac, 255, rest[..., 3])
E = (238 + PL, 405 + PT)
L = Image.fromarray(np.clip(layer, 0, 255).astype(np.uint8), 'RGBA').rotate(ANG, resample=Image.BICUBIC, center=E)
res = Image.alpha_composite(Image.fromarray(rest.astype(np.uint8), 'RGBA'), L)
res.save('work/bar-cast-rot.png')
vm = ndimage.binary_dilation(vac, iterations=5)
jm = Image.new('L', (W, H), 0); ImageDraw.Draw(jm).ellipse((E[0] - 36, E[1] - 36, E[0] + 36, E[1] + 36), fill=255)
Image.fromarray((((np.asarray(jm) > 0) | vm) * 255).astype(np.uint8)).save('work/bar-cast-mask.png')
bg = Image.new('RGBA', (W, H), (120, 130, 150, 255)); bg.alpha_composite(res); bg.convert('RGB').resize((W // 2, H // 2)).save('work/bar-cast-rot.jpg', quality=85)
print('size', W, H, 'vac', int(vac.sum()), 'pivot', E)
