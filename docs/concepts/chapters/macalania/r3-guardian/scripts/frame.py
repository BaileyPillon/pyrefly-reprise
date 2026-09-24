import sys, json, hashlib, numpy as np
from PIL import Image
src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGBA'); a = np.array(im)[:, :, 3] > 0
ys, xs = np.where(a); x0, y0, x1, y1 = xs.min(), ys.min(), xs.max(), ys.max()
M = 16
o = Image.new('RGBA', (x1 - x0 + 1 + 2 * M, y1 - y0 + 1 + 2 * M), (0, 0, 0, 0)); o.paste(im.crop((x0, y0, x1 + 1, y1 + 1)), (M, M))
o.save(out)
print(json.dumps({'rawContent': [int(x0), int(y0), int(x1), int(y1)], 'size': o.size, 'baselineY': o.size[1] - M, 'sha256': hashlib.sha256(open(out, 'rb').read()).hexdigest()}))
