# Combine the picked shoulder repaints (R 972101, L 972203) onto the opaque idle, then two deterministic touch-ups on
# the right shoulder only: the sleeve's lilac is mapped back onto the bible's purple ramp keeping the repaint's shading,
# and the fur crest's thin spike tips are opened (1 px) and anti-aliased, their dark tip specks recoloured to the fur ramp.
import numpy as np, math, random
from PIL import Image, ImageDraw
from scipy import ndimage
exec(open('blockin.py').read().split('# ---- (1)')[0])       # src, W, H, xx, yy, poly
base = np.asarray(Image.open('work/nooj3-idle-opaque.png').convert('RGBA')).astype(np.float32)
R = np.asarray(Image.open('work/fxR-972101.png').convert('RGBA')).astype(np.float32)
Lr = np.asarray(Image.open('work/fxL-972203.png').convert('RGBA')).astype(np.float32)
mR = np.asarray(Image.open('work/fx-maskR.png')).astype(np.float32)[..., None] / 255
mL = np.asarray(Image.open('work/fx-maskL.png')).astype(np.float32)[..., None] / 255
pre = np.asarray(Image.open('work/fx-pre.png').convert('RGBA')).astype(np.float32)
out = pre.copy()
out = np.where(mR > 0, R, out); out = np.where(mL > 0, Lr, out)
# sleeve region (from the block-in) minus the crest
sl = poly([(262, 203), (286, 211), (276, 240), (262, 262), (250, 288), (200, 288), (231, 250), (247, 218)]) & (src[..., 3] > 128)
F = Image.new('L', (W, H), 0); d = ImageDraw.Draw(F)
path = [(281, 205), (268, 206), (254, 214), (242, 226), (232, 241), (223, 256), (216, 268)]
for i in range(len(path) - 1):
    (x0, y0), (x1, y1) = path[i], path[i + 1]
    for k in range(6):
        f = k / 6; x = x0 + (x1 - x0) * f; y = y0 + (y1 - y0) * f; r = 11 + 3 * math.sin(i * 1.7 + k)
        d.ellipse((x - r, y - r, x + r, y + r), fill=255)
core = (np.asarray(F) > 0) & (xx <= 283)
rgb = out[..., :3]; lum = rgb.mean(-1); sat = rgb.max(-1) - rgb.min(-1)
lilac = sl & ~ndimage.binary_dilation(core, iterations=2) & (lum > 60) & (rgb[..., 2] >= rgb[..., 1] - 5)
c0, c1, c2 = [np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], np.float32) for h in ('#3E1A4E', '#6A2E80', '#9A5AD0')]
t = ((lum - 120) / 135).clip(0, 1)[..., None]
pur = np.where(t < 0.5, c0 + (c1 - c0) * t * 2, c1 + (c2 - c1) * (t - 0.5) * 2)
out[lilac, :3] = pur[lilac]
# crest alpha: a smooth contour (blur 1.1 then a soft ramp) so spikes of 3 px or more survive as tapered locks and the
# 1 px fragments go; edge colours pulled from the crest's own interior (no dark or orange tip specks)
outside = ~ndimage.binary_erosion(src[..., 3] > 128, iterations=2) & (xx < 300) & (yy < 300) & (yy > 150)
a0 = out[..., 3] / 255
a_s = ndimage.gaussian_filter(a0, 1.1)
ramp = ((a_s - 0.35) / 0.35).clip(0, 1)
out[..., 3] = np.where(outside, ramp * 255, out[..., 3])
inner = (out[..., 3] > 250) & ~outside
known = inner | ~outside; col = out[..., :3].copy()
for it in range(12):
    s3 = ndimage.uniform_filter(col * known[..., None], size=(3, 3, 1)); k3 = ndimage.uniform_filter(known.astype(np.float32), size=3)
    upd = outside & ~known & (k3 > 0.001) & (out[..., 3] > 0)
    col[upd] = s3[upd] / k3[upd][:, None]; known |= upd
edgeC = outside & (out[..., 3] > 0) & ((out[..., :3].mean(-1) < 120) | (out[..., 0] > out[..., 2] + 30))
out[edgeC, :3] = col[edgeC]
fleck = sl & ~core & (out[..., 0] > out[..., 2] + 40) & (out[..., 0] > 140)
out[fleck, :3] = c1
tips = edgeC
lab, n = ndimage.label(out[..., 3] > 20); sz = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))
out[(lab > 0) & (lab != 1 + int(np.argmax(sz))), 3] = 0
print('lilac->purple px', int(lilac.sum()), 'tips', int(tips.sum()), 'components', n)
Image.fromarray(out.clip(0, 255).astype(np.uint8), 'RGBA').save('work/fx-idle-opaque.png')
bg = Image.new('RGBA', (W, H), (128, 128, 128, 255)); bg.alpha_composite(Image.fromarray(out.clip(0, 255).astype(np.uint8), 'RGBA'))
bg.crop((150, 100, 560, 360)).resize((820, 520), Image.LANCZOS).convert('RGB').save('look/fx-fin.jpg', quality=92)
bg.convert('RGB').resize((W * 4 // 5, H * 4 // 5), Image.LANCZOS).save('look/fx-fin-full.jpg', quality=90)
