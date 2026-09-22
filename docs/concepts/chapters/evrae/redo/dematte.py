"""Remove the white halo a luminance key leaves on a cutout (FFX only, Evrae redo).
whitekey.py keeps the raw RGB under a partial alpha, so an edge pixel is still the
white-blended colour: raw = a*F + (1-a)*255. Solve for F (un-matte against white),
and drop the faintest alpha (< 24) that only ever carried haze.
usage: dematte.py in.png out.png"""
import sys
import numpy as np
from PIL import Image
im = np.array(Image.open(sys.argv[1]).convert("RGBA")).astype(np.float32)
a = im[..., 3:4] / 255.0
rgb = im[..., :3]
safe = np.clip(a, 1 / 255, 1)
F = (rgb - (1 - a) * 255.0) / safe
F = np.clip(F, 0, 255)
out = im.copy()
edge = (a[..., 0] > 0) & (a[..., 0] < 0.999)
out[..., :3][edge] = F[edge]
out[..., 3][im[..., 3] < 24] = 0
Image.fromarray(out.astype(np.uint8), "RGBA").save(sys.argv[2])
print("edge px", int(edge.sum()))
