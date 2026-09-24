# Cindy cast guide (FFX-2 only): idle pixels everywhere; the forearm+cap+glove (SAM mask) rotated about the elbow;
# the vacated footprint pre-filled FROM IDLE PIXELS: belt = the idle's own visible belt columns sheared along the
# belt's slope; belly = diffusion of the idle's own skin; below the belt = the idle's own sash/tail columns carried up.
import sys, numpy as np
from PIL import Image
from scipy import ndimage as ndi
ANG = float(sys.argv[1]) if len(sys.argv) > 1 else -75
A = np.asarray(Image.open('work/cindy-idle-oncast.png')).astype(np.float32)
m = np.load('work/cindy-armmask.npy')
rot = np.asarray(Image.open(f'work/cindy-armrot{int(ANG)}.png')).astype(np.float32)
H, W = m.shape
yy, xx = np.mgrid[0:H, 0:W]
# belt model from the visible belt (x 170..220): top/bottom lines
def btop(x): return 390 + (170 - x) * 0.2
def bbot(x): return 409 + (170 - x) * 0.2
# front silhouette in the vacated rows
def front(y):
    if y <= 395: return 72
    if y <= 410: return 72 - (y - 395) * 12 / 15
    if y <= 435: return 60
    if y <= 490: return 58 + (y - 435) * (84 - 58) / 55
    return 84
fr = np.array([front(y) for y in range(H)])
vac = m.copy()
out = A.copy()
known = ~m & (A[..., 3] > 200)
# belt band: shear-copy the idle's belt column at x0 (varying 172..186 to keep texture)
belt = vac & (yy >= btop(xx) - 1) & (yy <= bbot(xx) + 2)
X0 = 178
for y, x in zip(*np.nonzero(belt)):
    yf = y - (btop(x) - btop(X0)); y0 = int(np.floor(yf)); f = yf - y0
    out[y, x] = A[y0, X0] * (1 - f) + A[y0 + 1, X0] * f
# belly: above the belt, diffusion from known skin
belly = vac & (yy < btop(xx) - 1)
below = vac & (yy > bbot(xx) + 2)
def diffuse(region, src_known, iters=4000):
    col = out[..., :3].copy(); k = src_known.copy()
    for _ in range(iters):
        s = ndi.uniform_filter(col * k[..., None], size=(3, 3, 1)); kk = ndi.uniform_filter(k.astype(np.float32), size=3)
        upd = region & ~k & (kk > 0.001)
        if not upd.any(): break
        col[upd] = s[upd] / kk[upd][:, None]; k |= upd
    # harmonic smoothing inside the region (removes the grow streaks), boundary = known pixels
    for _ in range(600):
        sm = ndi.uniform_filter(col, size=(3, 3, 1))
        col[region] = sm[region]
    return col
skin = known & (yy < btop(xx) - 2) & (A[..., 0] > 180) & (A[..., 1] > 130)
col = diffuse(belly, skin)
out[belly, :3] = col[belly]; out[belly, 3] = 255
done = np.zeros_like(vac)
# below the belt: carry the idle's own columns up from the first known row below (tails, trousers, skirt edge)
for x in range(W):
    ys = np.nonzero(below[:, x])[0]
    if not len(ys): continue
    ybot = ys.max() + 1
    while ybot < H and not known[ybot, x]: ybot += 1
    if ybot >= H: continue
    if ybot - ys.max() > 30: continue
    run = [yb for yb in range(ybot, min(H, ybot + 24)) if known[yb, x]]
    for y in ys:
        done[y, x] = True
        out[y, x] = A[run[(ybot - y) % len(run)], x]  # a short mirrored strip, not a single smeared row
rest = below & ~done
# the sash tails: carry the idle's own first body column to the right of the gap leftwards (dark blue tails)
for y in range(H):
    xs = np.nonzero(rest[y])[0]
    if not len(xs): continue
    xr = xs.max() + 1
    while xr < W and not known[y, xr]: xr += 1
    if xr >= W: continue
    for x in xs:
        out[y, x] = A[y, min(W - 1, xr + (xr - x) % 10)] if known[y, min(W - 1, xr + (xr - x) % 10)] else A[y, xr]
# alpha: body where x >= front(y), background elsewhere inside the vacated footprint
bg = vac & (xx < fr[:, None])
out[vac & ~bg, 3] = 255
out[bg] = 0
np.save('work/cindy-vac.npy', vac)
base = out.copy()
Image.fromarray(np.clip(base, 0, 255).astype(np.uint8), 'RGBA').save('work/cindy-base-filled.png')
comp = Image.fromarray(np.clip(base, 0, 255).astype(np.uint8), 'RGBA'); comp.alpha_composite(Image.fromarray(rot.astype(np.uint8), 'RGBA'))
comp.save('work/cindy-guide.png'); print('vac', int(vac.sum()), 'belt', int(belt.sum()), 'belly', int(belly.sum()), 'below', int(below.sum()), 'bg', int(bg.sum()))
