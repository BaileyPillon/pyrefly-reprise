# assemble.py name ang pivotx pivoty padL repaint.png out.png
# The cast canvas grown by padL on the left so the raised hand is not clipped; the repaint (on the old canvas) is shifted,
# the edge clean of repaste.py applied, and the idle arm rotated on the padded canvas is laid on top (exact idle pixels).
import sys, numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi
name, ang, px, py, pad, inp, out = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), float(sys.argv[4]), int(sys.argv[5]), sys.argv[6], sys.argv[7]
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
H, W = body.shape
canvas = np.zeros((H, W + pad, 4), np.float32); canvas[:, pad:] = im
# arm layer on the padded canvas
idle = np.asarray(Image.open(f'work/{name}-idle-oncast.png').convert('RGBA')).astype(np.float32)
m = np.load(f'work/{name}-armmask.npy')
soft = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))).astype(np.float32) / 255
arm = np.zeros((H, W + pad, 4), np.float32); arm[:, pad:] = idle; arm[:, pad:, 3] = idle[..., 3] * soft
pm = arm.copy(); pm[..., :3] *= pm[..., 3:4] / 255
Wp = W + pad
big = Image.fromarray(pm.astype(np.uint8), 'RGBA').resize((Wp * 2, H * 2), Image.LANCZOS).rotate(ang, resample=Image.BICUBIC, center=((px + pad) * 2, py * 2))
r = np.asarray(big.resize((Wp, H), Image.LANCZOS)).astype(np.float32)
a = r[..., 3:4]; r[..., :3] = np.where(a > 0, r[..., :3] * 255 / np.maximum(a, 1), 0)
res = Image.fromarray(np.clip(canvas, 0, 255).astype(np.uint8), 'RGBA'); res.alpha_composite(Image.fromarray(np.clip(r, 0, 255).astype(np.uint8), 'RGBA'))
res.save(out)
a = np.asarray(res)[..., 3]; ys, xs = np.nonzero(a > 8); print(out, res.size, 'bbox', xs.min(), ys.min(), xs.max(), ys.max())
