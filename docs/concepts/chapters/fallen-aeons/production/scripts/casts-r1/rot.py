# rot.py name angle pivotx pivoty  -> work/<name>-rot<angle>.png (arm layer rotated, base with vacated in magenta)
import sys, numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi
name, ang, px, py = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), float(sys.argv[4])
idle = Image.open(f'work/{name}-idle-oncast.png').convert('RGBA')
m = np.asarray(Image.open(f'work/{name}-arm-sam.png')) > 127
lab, n = ndi.label(m); sizes = ndi.sum(m, lab, range(1, n + 1)); m = lab == (1 + int(np.argmax(sizes)))
m = ndi.binary_fill_holes(ndi.binary_closing(m, iterations=2))
A = np.asarray(idle).astype(np.float32)
W, H = idle.size
# arm layer: idle pixels, alpha = idle alpha * soft mask
soft = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))).astype(np.float32) / 255
arm = A.copy(); arm[..., 3] = A[..., 3] * soft
# rotate on a 2x canvas (Lanczos up, bicubic rotate, Lanczos down)
armI = Image.fromarray(arm.astype(np.uint8), 'RGBA')
# premultiply to avoid dark fringes
pm = arm.copy(); pm[..., :3] *= pm[..., 3:4] / 255
big = Image.fromarray(pm.astype(np.uint8), 'RGBA').resize((W * 2, H * 2), Image.LANCZOS)
big = big.rotate(ang, resample=Image.BICUBIC, center=(px * 2, py * 2))
r = np.asarray(big.resize((W, H), Image.LANCZOS)).astype(np.float32)
a = r[..., 3:4]; r[..., :3] = np.where(a > 0, r[..., :3] * 255 / np.maximum(a, 1), 0)
rot = np.clip(r, 0, 255)
np.save(f'work/{name}-armmask.npy', m)
Image.fromarray(rot.astype(np.uint8), 'RGBA').save(f'work/{name}-armrot{int(ang)}.png')
cover = rot[..., 3] > 250
vac = m & ~cover
base = A.copy(); base[m] = [255, 0, 255, 255]
comp = Image.fromarray(base.astype(np.uint8), 'RGBA'); comp.alpha_composite(Image.fromarray(rot.astype(np.uint8), 'RGBA'))
comp.save(f'work/{name}-rot{int(ang)}-look.png')
print(name, ang, 'arm px', int(m.sum()), 'vacated', int(vac.sum()))
