# Clean the cast's elbow area: open the alpha (remove thin shreds left under the rotated sleeve) in a box only.
import sys, numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage
inp, out, box = sys.argv[1], sys.argv[2], list(map(int, sys.argv[3].split(',')))
im = np.asarray(Image.open(inp).convert('RGBA')).copy()
x0, y0, x1, y1 = box
a = im[y0:y1, x0:x1, 3]
op = ndimage.grey_opening(a, size=(int(sys.argv[4]) if len(sys.argv) > 4 else 7,) * 2)
op = ndimage.gaussian_filter(op.astype(np.float32), 0.7)
im[y0:y1, x0:x1, 3] = np.minimum(a, op).astype(np.uint8)
# drop every alpha component not connected to the main body
lab, n = ndimage.label(im[..., 3] > 20)
sizes = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))
keep = 1 + int(np.argmax(sizes))
small = (lab > 0) & (lab != keep)
im[small, 3] = 0
Image.fromarray(im, 'RGBA').save(out)
print('components', n, 'removed px', int(small.sum()))
