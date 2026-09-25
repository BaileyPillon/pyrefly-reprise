# Remove near-white specks the flattened repaint left on the silhouette edge, inside the repaint mask only.
import sys, numpy as np
from PIL import Image
from scipy import ndimage
inp, maskp, out = sys.argv[1:4]
im = np.asarray(Image.open(inp).convert('RGBA')).copy()
m = np.asarray(Image.open(maskp).convert('L')) > 0
m = ndimage.binary_dilation(m, iterations=6)
a = im[..., 3] > 0
edge = a & ~ndimage.binary_erosion(a, iterations=4)
lum = im[..., :3].astype(np.float32).mean(-1)
sat = im[..., :3].max(-1).astype(np.float32) - im[..., :3].min(-1)
bad = m & edge & (lum > 200) & (sat < 45)
im[bad, 3] = 0
# isolated alpha specks
lab, n = ndimage.label(im[..., 3] > 20)
if n > 1:
    sizes = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1)); keep = 1 + int(np.argmax(sizes))
    im[(lab > 0) & (lab != keep) & (np.isin(lab, 1 + np.nonzero(sizes < 400)[0])), 3] = 0
Image.fromarray(im, 'RGBA').save(out); print('removed', int(bad.sum()), 'components', n)
