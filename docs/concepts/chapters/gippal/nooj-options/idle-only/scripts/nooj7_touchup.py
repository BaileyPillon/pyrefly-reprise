"""Nooj shade attempt 7 (FFX-2 only): the same alpha-only touch-up attempt 6 disclosed. rembg keeps part of the
render's ground shadow as a pale blue-white streak left of the metal toe, which reads as a blade. Pale pixels
(every channel > 120) in that box are set transparent; no colour is painted.

    python nooj7_touchup.py <cutout.png>   # in place; prints the count and the box
"""
import sys
import numpy as np
from PIL import Image

p = sys.argv[1]
im = Image.open(p).convert('RGBA'); a = np.array(im)
x0, x1, y0, y1 = 176, 254, 953, 1000
sub = a[y0:y1, x0:x1]
pale = (sub[..., 3] > 0) & (sub[..., :3].min(axis=2) > 120)
sub[..., 3][pale] = 0
a[y0:y1, x0:x1] = sub
Image.fromarray(a).save(p)
print('touch-up', int(pale.sum()), 'px, box', (x0, y0, x1, y1))
