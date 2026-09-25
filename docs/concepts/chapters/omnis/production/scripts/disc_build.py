"""Mortiphasm disc (FFX only), O-2 B 'painted discs': the picked disc render (seed 912301, centre circle 469,497 r318)
at its own pixel scale, each quarter tinted with its sourced colour (research 4.1: orange Fire, purple Ice, blue Water,
yellow Thunder), exactly as the options' omnis_build.painted_disc() did, with three repairs of PIL artefacts only:
the rim's four red diamonds keep their own paint (the options tint bled into them), the circle edge and the quarter
dividers are anti-aliased (the options had a stepped edge), and the disc is un-lit (the lit quarter is its own layer).
RING ORDER = OUR ESTIMATE (plan B8): clockwise on screen from the quarter at 0 deg (screen right): Fire, Water, Ice,
Thunder. The ring order lives in ORDER below; a different order is a re-run of this script, no GPU.
usage: disc_build.py [order]   order = comma list clockwise from 0 deg, default fire,water,ice,thunder
Writes work/mortiphasm[-<tag>].png and work/mortiphasm-facing.png (668x668, disc centre 334,334, radius 318)."""
import sys, json, math, numpy as np
from PIL import Image
SRC = 'D:/Tools/pyrefly-scratch/omnis-options/renders/disc-a.png'
W0 = 'D:/Tools/pyrefly-scratch/ch1215/omnis/work/'
ORDER = (sys.argv[1] if len(sys.argv) > 1 else 'fire,water,ice,thunder').split(',')
TAG = sys.argv[2] if len(sys.argv) > 2 else ''
COL = {'fire': (240, 118, 30), 'water': (40, 120, 235), 'ice': (160, 100, 235), 'thunder': (245, 212, 50)}
INK = np.array((11, 10, 18), np.float32) / 255
GOLD = np.array((227, 185, 74), np.float32) / 255
R = 318; M = 16; S = 2 * R; C = S + 2 * M
cx, cy = 469, 497
src = Image.open(SRC).convert('RGBA').crop((cx - R, cy - R, cx + R, cy + R))
t = np.asarray(src).astype(np.float32) / 255
y, x = np.mgrid[0:S, 0:S].astype(np.float32)
c0 = (S - 1) / 2
dx, dy = x - c0, y - c0
ang = np.degrees(np.arctan2(dy, dx)) % 360          # clockwise on screen from +x
dist = np.hypot(dx, dy)
rad = dist / c0
sec = (np.floor(((ang + 45) % 360) / 90) % 4).astype(int)   # quarter k centred on k*90 deg
L = 0.3 * t[..., 0] + 0.59 * t[..., 1] + 0.11 * t[..., 2]
col = np.zeros((S, S, 3), np.float32)
for i, e in enumerate(ORDER):
    col[sec == i] = np.array(COL[e]) / 255
tint = col * (0.22 + 1.0 * L[..., None])
rgb = tint * 0.88 + t[..., :3] * 0.12
# the rim stays the render's own paint, and so do the four red diamonds (at 0/90/180/270 deg, reaching in to r 0.80)
axis = np.minimum.reduce([np.abs((ang - k + 180) % 360 - 180) for k in (0, 90, 180, 270)])
redd = (t[..., 0] > t[..., 1] + 0.12) & (t[..., 0] > t[..., 2] + 0.05)
keep = (rad > 0.86) | ((rad > 0.78) & (axis < 9) & redd)
rgb = np.where(keep[..., None], t[..., :3] * 0.85, rgb)
# quarter dividers at 45/135/225/315 deg, anti-aliased: distance (px) to the nearest divider ray
rel = ((ang - 45) % 90)
angd = np.minimum(rel, 90 - rel)
dpx = dist * np.sin(np.radians(angd))
half = 7.0 * rad.clip(0.3, 1)     # half-width in px: 7 at the rim, tapering toward the hub
cov = np.clip(half - dpx + 0.5, 0, 1) * ((rad > 0.18) & (rad < 0.9))
rgb = rgb * (1 - cov[..., None]) + INK * cov[..., None]
alpha = np.clip(c0 + 0.5 - dist, 0, 1) * t[..., 3]
out = np.zeros((C, C, 4), np.float32)
out[M:M + S, M:M + S, :3] = rgb; out[M:M + S, M:M + S, 3] = alpha
img = Image.fromarray((np.clip(out, 0, 1) * 255).round().astype(np.uint8), 'RGBA')
name = 'mortiphasm' + (('-' + TAG) if TAG else '')
img.save(W0 + name + '.png')
# the facing layer: lit quarter at 0 deg (screen right), the other three dimmed, a gold arc on the rim (+-44 deg)
f = np.zeros((C, C, 4), np.float32)
Y, X = np.mgrid[0:C, 0:C].astype(np.float32)
DX, DY = X - (C - 1) / 2, Y - (C - 1) / 2
D = np.hypot(DX, DY); A = np.degrees(np.arctan2(DY, DX)) % 360
inside = np.clip(R + 0.5 - D, 0, 1)
fa = np.abs((A + 180) % 360 - 180)                  # angle from the facing direction
on = np.clip(45.5 - fa, 0, 1)
f[..., :3] = np.where(on[..., None] > 0.5, 1.0, 0.0)
f[..., 3] = inside * (on * 0.12 + (1 - on) * 0.40)
# gold rim arc: a ring band at r 0.90-0.99, +-44 deg, with a soft glow and a bright core
rr = D / R
band = np.clip(1 - np.abs(rr - 0.945) / 0.05, 0, 1) * np.clip(44.5 - fa, 0, 1)
glow = np.clip(1 - np.abs(rr - 0.945) / 0.11, 0, 1) ** 2 * np.clip((50 - fa) / 8, 0, 1)
core = np.clip(1 - np.abs(rr - 0.945) / 0.018, 0, 1) * np.clip(43.5 - fa, 0, 1)
def over(dst, rgb, a):   # straight-alpha "over": layer (rgb, a) on top of dst
    a = a[..., None]; da = dst[..., 3:4]
    oa = a + da * (1 - a)
    orgb = (rgb * a + dst[..., :3] * da * (1 - a)) / np.maximum(oa, 1e-6)
    dst[..., :3] = orgb; dst[..., 3:4] = oa


for k, colr in ((glow * 0.55, GOLD), (band, GOLD), (core, np.array((1.0, 0.94, 0.78), np.float32))):
    over(f, np.broadcast_to(colr, f[..., :3].shape), k)
Image.fromarray((np.clip(f, 0, 1) * 255).round().astype(np.uint8), 'RGBA').save(W0 + 'mortiphasm-facing.png')
print(json.dumps({'order_clockwise_from_0deg': ORDER, 'size': [C, C], 'centre': [(C - 1) / 2, (C - 1) / 2], 'radius': R, 'out': name}))
