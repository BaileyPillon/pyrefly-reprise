"""Hi-fi round, house Cloud p1: paint out the extra sword hilt the model drew behind his head (canon: he
carries the one Buster Sword, in his hands). Pixels inside a band along the hilt that are not blond hair
become the flat background grey, so the cut-out drops them. Our own render only; nothing mirrored.
Usage: python house-cloud-fix.py <p1.full.png> <out.png>"""
import sys
import numpy as np
from scipy import ndimage
from PIL import Image, ImageDraw
src, out = sys.argv[1:3]
im = Image.open(src).convert('RGB')
a = np.asarray(im).astype(int)
bg = np.median(a[40:200, 40:200].reshape(-1, 3), 0)
m = Image.new('L', im.size, 0)
ImageDraw.Draw(m).line([(362, 78), (566, 414)], fill=255, width=96)
band = np.asarray(m) > 0
r, g, b = a[..., 0], a[..., 1], a[..., 2]
hair = (r > 150) & (g > 0.8 * r) & (r - b > 45)
# hair outline: dark pixels with hair within 5 px on the head side (x > the hilt line)
lab, n = ndimage.label(hair)
sz = ndimage.sum(hair, lab, range(1, n + 1))
hair = np.isin(lab, [i + 1 for i in range(n) if sz[i] > 3000])   # the hair mass, not stray highlights
near_hair = ndimage.binary_dilation(hair, iterations=5)
kill = band & ~hair & ~(near_hair & (np.arange(a.shape[1])[None, :] > 505))
a[kill] = bg
a[160:220, 345:405] = bg   # the pommel's lower lip, just outside the band
Image.fromarray(a.astype(np.uint8)).save(out)
print('painted', int(kill.sum()), 'px, bg', bg.tolist())
