# Paint-over init for the Garden plates: sky/sea/waterfalls from one render, a stone terrace
# floor from another, then a colour grade per light option. img2img repaints it as one picture.
import sys
import numpy as np
from PIL import Image, ImageFilter
R = 'D:/Tools/pyrefly-scratch/omnis-options/renders/'
W, H = 1344, 768
top = Image.open(R + 'garden-a6-912407.png').convert('RGB').resize((W, H), Image.LANCZOS)
flo = Image.open(R + 'garden-a3.png').convert('RGB').resize((W, H), Image.LANCZOS)
seam = 0.60
band = flo.crop((0, int(H * 0.74), W, H)).resize((W, H - int(H * seam)), Image.LANCZOS)
base = np.asarray(top).astype(np.float32)
f = np.zeros_like(base); f[int(H * seam):] = np.asarray(band).astype(np.float32)
m = np.zeros((H, 1), np.float32); ys = np.arange(H)[:, None]
m = np.clip((ys - H * seam) / (H * 0.05), 0, 1)
img = base * (1 - m[..., None]) + f * m[..., None]
grades = {
    'a': ((1.25, 0.55, 0.55), (1.1, 0.6, 0.85)),   # dusk: red sea, red-violet sky
    'b': ((1.3, 0.78, 0.78), (1.08, 1.02, 1.0)),    # pale noon: rose sea, pale sky
    'c': ((0.75, 0.35, 0.65), (0.5, 0.35, 0.8)),    # deep violet
}
g = grades[sys.argv[1]]
yy = ys / H
sea = (yy > 0.33).astype(np.float32)
mul = np.where(sea[..., None] > 0, np.array(g[0]), np.array(g[1]))
img = np.clip(img * mul, 0, 255)
Image.fromarray(img.astype(np.uint8)).save(R + 'init-garden-%s.png' % sys.argv[1])
