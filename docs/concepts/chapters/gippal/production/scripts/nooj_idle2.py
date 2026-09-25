# Nooj shade idle, repair pass (judge 2026-09-25: no hair loops, a knee-length ponytail that dominates the read).
# From the same opaque render (renders/nooj2.3.png, seed 962203), on the same canvas (471x1157, so scale and baseline
# hold):
#  1. the ponytail is cut at mid-back (tip at y 345: the shoulder is at ~200, the belt at ~430) and tapered
#     over its last 83 rows;
#  2. a hair loop is blocked in at the near temple (over the ear and the render's stray spike ornament), with a red tie
#     where it is gathered, in the bible's hair and tie colours (visual-bible 1.23.4: "two loops and a ponytail tied
#     with a red band"; #3A2616 / #6B4A28 / #9C7448, tie #B02A2A); its hole shows whatever is behind it;
# then ONE masked repaint (IP-Adapter on the picked portrait portraits/nooj.png, D-043) paints the loop and the new
# ponytail tip. Writes out/nooj2-pre.png and out/nooj2-mask.png.
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage
S = 'D:/Tools/pyrefly-scratch/ch1215/gippal'
O = 'D:/Tools/pyrefly-scratch/ch1215/gippal-repair/out'
src = Image.open(f'{S}/renders/nooj2.3.png').convert('RGBA')
A = np.asarray(src).astype(np.float32).copy()
H, W = A.shape[:2]
op = A[..., 3] > 0

# ---- 1. the ponytail: every opaque run that starts right of the body (x >= 330; x >= 310 above row 200) ----
tail = np.zeros((H, W), bool)
for y in range(140, 830):
    row = op[y]; x = 0
    while x < W:
        if row[x]:
            s0 = x
            while x < W and row[x]: x += 1
            if s0 >= (310 if y < 200 else 330): tail[y, s0:x] = True
        else:
            x += 1
TIP, T0 = 345, 262
cut = tail.copy(); cut[:TIP] = False           # everything below the tip goes
for y in range(T0, TIP):
    xs = np.nonzero(tail[y])[0]
    if not len(xs): continue
    L, R = xs.min(), xs.max()
    c = (L + R) / 2 + (y - T0) * 0.12          # the tail drifts a little outward, as the render's does
    half = (R - L) / 2 * ((TIP - y) / (TIP - T0)) ** 0.75
    keep = (np.arange(W) >= c - half) & (np.arange(W) <= c + half)
    cut[y] = tail[y] & ~keep
A[cut, 3] = 0
tipM = np.zeros((H, W), bool); tipM[T0 - 12:TIP + 4, :] = tail[T0 - 12:TIP + 4, :]

# ---- 2. the loop at the near temple ----
cx, cy, rx, ry = 286, 140, 21, 33
loop = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(loop)
def drop(grow, dx=0, dy=0):
    # a teardrop: narrow where it is gathered at the top, full at the bottom, leaning back a little
    pts = []
    for t in np.linspace(0, 2 * np.pi, 72, endpoint=False):
        k = 0.55 + 0.45 * (1 - np.cos(t)) / 2          # t=0 top (narrow), t=pi bottom (full)
        x = cx + dx + np.sin(t) * (rx + grow) * k + (1 - np.cos(t)) * 2.5
        y = cy + dy - np.cos(t) * (ry + grow)
        pts.append((x, y))
    return pts
d.polygon(drop(2), fill=(30, 18, 10, 255))                               # ink
d.polygon(drop(0), fill=(0x6B, 0x4A, 0x28, 255))                         # mid brown
d.polygon(drop(-5, 2, 4), fill=(0x3A, 0x26, 0x16, 255))                  # shade toward the back
d.polygon(drop(-9, -2, -2), fill=(0x6B, 0x4A, 0x28, 255))
for k in range(6):                                                        # strands
    d.arc((cx - rx + 3 + k * 2, cy - ry + 6 + k * 2, cx + rx - 3 - k, cy + ry - 2 - k), 190, 340, fill=(0x9C, 0x74, 0x48, 255), width=1)
hx, hy, hrx, hry = cx + 3, cy + 11, 7, 11                                 # the hole
d.ellipse((hx - hrx - 2, hy - hry - 2, hx + hrx + 2, hy + hry + 2), fill=(30, 18, 10, 255))
d.ellipse((hx - hrx, hy - hry, hx + hrx, hy + hry), fill=(0, 0, 0, 0))
# the red tie where the loop is gathered at the top of the ear
tie = [(cx - 9, cy - ry + 3), (cx + 5, cy - ry - 2), (cx + 8, cy - ry + 6), (cx - 6, cy - ry + 11)]
d.polygon(tie, fill=(0xB0, 0x2A, 0x2A, 255), outline=(60, 12, 12, 255))
LP = np.asarray(loop).astype(np.float32)
lm = LP[..., 3] > 0
holeM = np.zeros((H, W), bool)
yy, xx = np.mgrid[0:H, 0:W]
holeM = ((xx - hx) / hrx) ** 2 + ((yy - hy) / hry) ** 2 <= 1
A[lm] = LP[lm]
# the hole shows what was there before: the head/neck where opaque, else nothing
orig = np.asarray(src).astype(np.float32)
A[holeM] = orig[holeM]
loopM = lm | holeM

pre = Image.fromarray(np.clip(A, 0, 255).astype(np.uint8), 'RGBA')
pre.save(f'{O}/nooj2-pre.png')
mask = ndimage.binary_dilation(loopM, iterations=5) | ndimage.binary_dilation(tipM, iterations=4)
mask &= ~(holeM & ~op)   # never paint inside an empty hole
Image.fromarray((mask * 255).astype(np.uint8)).save(f'{O}/nooj2-mask.png')
ys, xs = np.nonzero(mask)
print('cut px', int(cut.sum()), 'loop px', int(lm.sum()), 'mask box', xs.min(), ys.min(), xs.max(), ys.max())
bg = Image.new('RGBA', (W, H), (255, 0, 255, 255)); bg.alpha_composite(pre)
bg.crop((150, 0, 471, 460)).resize((642, 920), Image.LANCZOS).convert('RGB').save(f'{O}/nooj2-pre-look.jpg', quality=90)
