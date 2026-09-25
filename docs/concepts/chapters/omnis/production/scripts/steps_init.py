"""Garden of Pain plate (FFX only), steps pilot: the one sourced Garden fact is 'steps up to a platform' (research
section 7). The picked O-3 C plate has none. This drafts a short broad flight of steps rising from the terrace's far
edge to a raised dais under Omnis (PIL blocks in the terrace's own sampled colours), for a masked img2img to paint in.
Writes work/steps.init.png, work/steps.mask.png (a 1024x576 crop), and the crop box."""
import json, numpy as np
from PIL import Image, ImageDraw, ImageFilter
SRC = 'D:/Tools/pyrefly-scratch/omnis-options/renders/garden-C.png'
W0 = 'D:/Tools/pyrefly-scratch/ch1215/omnis/work/'
plate = Image.open(SRC).convert('RGB')
BOX = (1140, 560, 2164, 1136)   # 1024x576 crop around the terrace's far edge, centre right (under Omnis)
crop = plate.crop(BOX)
a = np.array(crop).astype(np.float32)
# sample the terrace colours: lit tread (pink) and shadow (dark plum) from the near paving
pav = np.array(plate.crop((1100, 1000, 2200, 1200))).reshape(-1, 3).astype(np.float32)
L = pav.mean(1)
lit = pav[L > np.percentile(L, 85)].mean(0)
dark = pav[L < np.percentile(L, 25)].mean(0)
mid = pav[(L > np.percentile(L, 45)) & (L < np.percentile(L, 60))].mean(0)
edge_y = 960 - BOX[1]           # the terrace's far edge, crop coords
d = Image.fromarray(a.astype(np.uint8)); dr = ImageDraw.Draw(d)
cx = 1660 - BOX[0]
n = 5; tread = 9; riser = 13
w0, w1 = 560, 470               # bottom and top widths (perspective)
y = edge_y + 6
for i in range(n):
    w = w0 - (w0 - w1) * i / (n - 1)
    dr.rectangle((cx - w / 2, y - riser, cx + w / 2, y), fill=tuple(int(v) for v in dark * 0.9 + mid * 0.1))
    y -= riser
    dr.rectangle((cx - w / 2, y - tread, cx + w / 2, y), fill=tuple(int(v) for v in lit * 0.8 + mid * 0.2))
    y -= tread
top = y
dr.rectangle((cx - w1 / 2 - 10, top - 40, cx + w1 / 2 + 10, top), fill=tuple(int(v) for v in mid))    # the platform top
dr.rectangle((cx - w1 / 2 - 10, top - 44, cx + w1 / 2 + 10, top - 38), fill=tuple(int(v) for v in lit))
d.save(W0 + 'steps.init.png')
m = Image.new('L', crop.size, 0)
ImageDraw.Draw(m).rectangle((cx - w0 / 2 - 30, top - 70, cx + w0 / 2 + 30, edge_y + 26), fill=255)
m.filter(ImageFilter.GaussianBlur(6)).convert('RGB').save(W0 + 'steps.mask.png')
print(json.dumps({'box': BOX, 'edge_y': edge_y, 'top': top, 'lit': lit.round().tolist(), 'dark': dark.round().tolist()}))
