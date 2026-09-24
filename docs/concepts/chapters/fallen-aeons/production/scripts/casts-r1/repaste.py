# repaste.py name ang in.png out.png
# 1) edge clean on the NEW silhouette only (inside the repaint mask): colours within 2 px of the new edge taken from
#    3 px inside (no white fringe from the flatten), alpha antialiased by a 0.8 px blur there;
# 2) the rotated idle arm (exact idle pixels) laid back on top.
import sys, numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi
name, ang, inp, out = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
im = np.asarray(Image.open(inp).convert('RGBA')).astype(np.float32)
rm = np.asarray(Image.open(f'work/{name}-rmask.png')) > 0
body = im[..., 3] > 127
inner = ndi.binary_erosion(body, iterations=3)
_, (iy, ix) = ndi.distance_transform_edt(~inner, return_indices=True)
edge = body & ~ndi.binary_erosion(body, iterations=2) & rm
im[edge, :3] = im[iy[edge], ix[edge], :3]
ab = np.asarray(Image.fromarray(im[..., 3].astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))).astype(np.float32)
band = rm & (ndi.binary_dilation(body, iterations=2) & ~ndi.binary_erosion(body, iterations=2))
im[band, 3] = ab[band]
res = Image.fromarray(np.clip(im, 0, 255).astype(np.uint8), 'RGBA')
res.alpha_composite(Image.open(f'work/{name}-armrot{ang}.png').convert('RGBA')); res.save(out)
