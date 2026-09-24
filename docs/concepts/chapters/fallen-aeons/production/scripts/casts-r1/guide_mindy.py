# Mindy cast guide (FFX-2 only): idle pixels everywhere; the puffed sleeve + glove (SAM mask) rotated about the elbow;
# the vacated footprint pre-filled FROM IDLE PIXELS: the black bodice and leggings by diffusion of the idle's own dark
# pixels, the orange hem carried round the hip from the idle's own visible hem column; background right of the waist.
import sys, numpy as np
from PIL import Image
from scipy import ndimage as ndi
ANG = int(sys.argv[1]) if len(sys.argv) > 1 else -110
A = np.asarray(Image.open('work/mindy-idle-oncast.png')).astype(np.float32)
m = np.load('work/mindy-armmask.npy')
rot = np.asarray(Image.open(f'work/mindy-armrot{ANG}.png')).astype(np.float32)
H, W = m.shape
yy, xx = np.mgrid[0:H, 0:W]
lum0 = A[..., :3] @ np.array([0.3, 0.59, 0.11])
# the arm's own 1-2 px outline left behind by SAM, and the remnant of the white wrist band at the waist
ring = ndi.binary_dilation(m, iterations=2) & ~m & (xx > 140) & (xx < 262) & (yy > 430) & (yy < 610)
Ai = A.astype(np.float32); sat = Ai[..., :3].max(2) - Ai[..., :3].min(2)
wb = (xx > 128) & (xx < 180) & (yy > 512) & (yy < 540) & (lum0 > 120) & (sat < 60) & (A[..., 3] > 100)
wb = ndi.binary_dilation(wb, iterations=1) & (xx > 128) & (xx < 180) & (yy > 512) & (yy < 540)
vac = m | ring | wb
print('ring', int(ring.sum()), 'wristband remnant', int(wb.sum()))
known = ~vac & (A[..., 3] > 200)
lum = A[..., :3] @ np.array([0.3, 0.59, 0.11])
# right silhouette of the waist (x beyond it is background) for rows 440..528
pts = [(438, 220), (450, 216), (465, 214), (480, 214), (500, 216), (515, 220), (528, 227)]
edge = np.full(H, 10 ** 6, np.float32)
ys_, xs_ = zip(*pts)
for y in range(438, 529): edge[y] = np.interp(y, ys_, xs_)
bg = vac & (xx > edge[:, None])
body = vac & ~bg
out = A.copy()
sat2 = A[..., :3].max(2) - A[..., :3].min(2)
dark = known & (lum < 70) & (sat2 < 45)
col = out[..., :3].copy(); k = dark.copy()
for _ in range(3000):
    s = ndi.uniform_filter(col * k[..., None], size=(3, 3, 1)); kk = ndi.uniform_filter(k.astype(np.float32), size=3)
    upd = body & ~k & (kk > 0.001)
    if not upd.any(): break
    col[upd] = s[upd] / kk[upd][:, None]; k |= upd
wgt = (body | dark).astype(np.float32)
for _ in range(300):
    sm = ndi.uniform_filter(col * wgt[..., None], size=(3, 3, 1)); ww = ndi.uniform_filter(wgt, size=3)
    col[body] = sm[body] / np.maximum(ww[body], 1e-3)[:, None]
out[body, :3] = col[body]; out[body, 3] = 255
# the hem: the idle's own column x=160 rows 550..559, carried right at the same height (a band 10 px tall)
X0 = 160
hem = body & (yy >= 550) & (yy <= 559) & (xx > 168)
for y, x in zip(*np.nonzero(hem)):
    out[y, x] = A[y, X0]
out[bg] = 0
np.save('work/mindy-vac.npy', vac)
Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), 'RGBA').save('work/mindy-base-filled.png')
comp = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), 'RGBA'); comp.alpha_composite(Image.fromarray(rot.astype(np.uint8), 'RGBA'))
comp.save('work/mindy-guide.png'); print('vac', int(vac.sum()), 'body', int(body.sum()), 'bg', int(bg.sum()), 'hem', int(hem.sum()))
