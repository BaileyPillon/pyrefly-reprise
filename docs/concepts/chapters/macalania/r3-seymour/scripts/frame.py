import json, numpy as np
from PIL import Image
im = Image.open('fin-a.png').convert('RGBA'); a = np.array(im)[:, :, 3] > 0
ys, xs = np.where(a); x0, y0, x1, y1 = xs.min(), ys.min(), xs.max(), ys.max()
M = 16
out = im.crop((x0-M, y0-M, x1+1+M, y1+1+M)) if x0 >= M and y0 >= M else None
if out is None:
    out = Image.new('RGBA', (x1-x0+1+2*M, y1-y0+1+2*M), (0, 0, 0, 0)); out.paste(im.crop((x0, y0, x1+1, y1+1)), (M, M))
out.save('idle-r3.png')
print('content', x0, y0, x1, y1, 'out', out.size, 'baselineY', out.size[1]-M)
