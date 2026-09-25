# Finish the picked loop repaint (seed 971102): anti-alias the loop's outer alpha edge inside the repaint mask only,
# remove small detached alpha specks, then write work/nooj3-idle-opaque.png.
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage
im = np.asarray(Image.open('work/n94-rep-971102.png').convert('RGBA')).astype(np.float32).copy()
m = np.asarray(Image.open('work/n94-mask.png').convert('L')) > 20
a = im[..., 3]
ab = ndimage.gaussian_filter(a, 0.9)
edge = m & (ndimage.binary_dilation(a > 128, iterations=2) & ~ndimage.binary_erosion(a > 128, iterations=2))
im[..., 3] = np.where(edge, np.minimum(a, ab) * 0.5 + ab * 0.5, a)
lab, n = ndimage.label(im[..., 3] > 20)
sizes = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1)); keep = 1 + int(np.argmax(sizes))
small = (lab > 0) & (lab != keep); im[small, 3] = 0
print('components', n, 'removed', int(small.sum()))
Image.fromarray(im.clip(0, 255).astype(np.uint8), 'RGBA').save('work/nooj3-idle-opaque.png')
