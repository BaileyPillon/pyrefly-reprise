# Trema idle, after tear.py: (1) the face skin moved toward the hands' grey-green (Lab a*/b* of the hands' median,
# lightness kept but 6 % darker), (2) the stole crest's round core turned red inside its gold ring (the options
# README's "round red crest" to-fix), (3) detached specks under 40 px removed. Usage: idlefix.py in.png out.png cx cy rx ry (crest disc)
import sys, numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi
from skimage import color
inp, out = sys.argv[1:3]
A = np.asarray(Image.open(inp).convert('RGBA')).astype(np.float64); rgb = A[..., :3] / 255; al = A[..., 3]
H, W = al.shape
def skinmask(x0, y0, x1, y1):
    m = np.zeros((H, W), bool); a = A[y0:y1, x0:x1]; r, g, b = a[..., 0], a[..., 1], a[..., 2]
    m[y0:y1, x0:x1] = (a[..., 3] > 200) & (g > r - 5) & (g > b) & (g > 60) & (g < 225) & (np.abs(r - b) < 45) & ((g - b) > 5)
    return m
face = skinmask(360, 95, 475, 215)
face = ndi.binary_opening(face, iterations=1)
lab = color.rgb2lab(rgb)
hands = skinmask(180, 270, 245, 390) | skinmask(395, 590, 470, 700)
ha, hb = np.median(lab[hands][:, 1]), np.median(lab[hands][:, 2])
fa, fb = np.median(lab[face][:, 1]), np.median(lab[face][:, 2])
soft = np.asarray(Image.fromarray((face * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))).astype(np.float64) / 255
lab2 = lab.copy(); lab2[..., 1] += (ha - fa); lab2[..., 2] += (hb - fb); lab2[..., 0] *= 0.94
new = color.lab2rgb(lab2)
rgb = rgb * (1 - soft[..., None]) + new * soft[..., None]
# crest core: the oval inside the gold ring at about (368, 457); only its red-brown pixels are recoloured
yy, xx = np.mgrid[0:H, 0:W]
CX, CY, RX, RY = float(sys.argv[3]), float(sys.argv[4]), float(sys.argv[5]), float(sys.argv[6])
ov = ((xx - CX) / RX) ** 2 + ((yy - CY) / RY) ** 2 <= 1
cm = ov
L = color.rgb2lab(rgb)[..., 0]
target = color.rgb2lab(np.array([[[200, 28, 36]]]) / 255)[0, 0]
lab3 = color.rgb2lab(rgb); lab3[cm, 1] = target[1]; lab3[cm, 2] = target[2]; lab3[cm, 0] = np.clip(38 + 0.25 * (L[cm] - L[cm].mean()) - 10 * (((xx[cm] - CX) / RX) ** 2 + ((yy[cm] - CY) / RY) ** 2), 20, 60)
rgb = np.where(cm[..., None], color.lab2rgb(lab3), rgb)
ring = ndi.binary_dilation(cm, iterations=1) & ~cm
rgb = np.where(ring[..., None], rgb * 0.55 + np.array([0.35, 0.22, 0.05]) * 0.45, rgb)
# specks
lab_, n = ndi.label(al > 20); sizes = ndi.sum(np.ones_like(al), lab_, range(1, n + 1))
small = np.isin(lab_, [i + 1 for i, s in enumerate(sizes) if s < 40])
al = np.where(small, 0, al)
res = np.dstack([np.clip(rgb * 255, 0, 255), al]).round().astype(np.uint8)
Image.fromarray(res, 'RGBA').save(out)
print(out, 'face px', int(face.sum()), 'face ab', round(fa, 1), round(fb, 1), '-> hands', round(ha, 1), round(hb, 1), 'crest px', int(cm.sum()), 'specks px', int(small.sum()))
