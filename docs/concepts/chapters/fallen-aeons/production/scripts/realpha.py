# Re-derive alpha only inside an edit region: flatten on white, rembg (isnet-anime, local weights), and take rembg's
# alpha inside the region, the input's own alpha outside it. Usage: realpha.py in.png region_mask.png out.png
import os, sys, io
os.environ.setdefault("U2NET_HOME", r"D:\Tools\ComfyUI\rembg-models")
import numpy as np
from PIL import Image, ImageFilter
from rembg import new_session, remove
inp, reg, out = sys.argv[1:4]
im = Image.open(inp).convert('RGBA')
flat = Image.new('RGBA', im.size, (255, 255, 255, 255)); flat.alpha_composite(im)
sess = new_session('isnet-anime')
cut = remove(flat.convert('RGB'), session=sess)
ra = np.asarray(cut.getchannel('A')).astype(np.float32)
oa = np.asarray(im.getchannel('A')).astype(np.float32)
rm = np.asarray(Image.open(reg).convert('L').filter(ImageFilter.GaussianBlur(3))).astype(np.float32) / 255
# inside the region: rembg alpha, but never opaque where the input was fully transparent AND white (background)
a = oa * (1 - rm) + np.minimum(ra, np.maximum(oa, ra * 0 + 255)) * rm
arr = np.asarray(im).copy(); arr[..., 3] = np.clip(a, 0, 255).astype(np.uint8)
Image.fromarray(arr, 'RGBA').save(out); print('ok', out)
