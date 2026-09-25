# Close the elbow seam's gap inside the joint circle only (binary closing of the alpha), pre-fill the new pixels from
# their neighbours, and write the pre-image for one masked repaint (alpha keep).
import numpy as np
from PIL import Image
from scipy import ndimage
im = np.asarray(Image.open('work/n3-cast-rot.png')).astype(np.float32).copy()
jm = np.asarray(Image.open('work/n3-cast-mask.png')) > 0
op = im[..., 3] > 128
cl = ndimage.binary_closing(op, iterations=14) & jm
new = cl & ~op
known = op.copy(); col = im[..., :3].copy()
for it in range(300):
    s = ndimage.uniform_filter(col * known[..., None], size=(3, 3, 1)); k = ndimage.uniform_filter(known.astype(np.float32), size=3)
    upd = new & ~known & (k > 0.001)
    if not upd.any(): break
    col[upd] = s[upd] / k[upd][:, None]; known |= upd
im[..., :3] = np.where(new[..., None], col, im[..., :3]); im[new, 3] = 255
Image.fromarray(im.astype(np.uint8)).save('work/n3-cast-pre.png')
print('filled', int(new.sum()))
