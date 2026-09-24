# Daigoro (FFX only): the picked concept pixels (daigoro-b, seed 903202) with the baked blue floor shadow erased.
# Pixel-only repair: nothing repainted. Every kept RGB value is the concept's own.
import numpy as np, json
from PIL import Image
from scipy import ndimage as ndi
im = np.array(Image.open('daigoro-b.png')).astype(int)
r, g, b, al = im[..., 0], im[..., 1], im[..., 2], im[..., 3]
H, W = al.shape
yy = np.arange(H)[:, None] * np.ones((1, W), int)
low = yy >= 815
blue = low & (al > 0) & (((b - r) > 60) & (g > r)) 
lightblue = low & (al > 0) & ((b - r) > 45) & ((b - g) > 18) & (r < 200)
m = blue | lightblue
# grow into anti-aliased blue-tinted neighbours (still bluish, not the cream tail or the dark paws)
tint = low & (al > 0) & ((b - r) > 25) & (b > g)
for _ in range(3):
    m |= ndi.binary_dilation(m) & tint
a = al > 0
a &= ~m
# specks left behind
lab, n = ndi.label(a, structure=np.ones((3, 3))); sz = ndi.sum(a, lab, range(1, n + 1))
small = np.isin(lab, [i + 1 for i, s in enumerate(sz) if s < 40]); a &= ~small
out = im.copy().astype(np.uint8); out[..., 3] = np.where(a, 255, 0); out[~a, :3] = 0
Image.fromarray(out).save('daigoro-fixed.png')
print(json.dumps({'erased': int(m.sum()), 'specks': int(small.sum()), 'components': int(n)}))
