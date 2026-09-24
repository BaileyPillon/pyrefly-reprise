# Frame a cut-out like the other enemy idles: tight to every non-zero alpha pixel plus a 16 px margin.
# baselineY = the ground-contact row (given in source coords), moved into the framed canvas.
import sys, json, hashlib, numpy as np
from PIL import Image
src, out, contact = sys.argv[1], sys.argv[2], int(sys.argv[3])
im = Image.open(src).convert('RGBA'); a = np.array(im)[:, :, 3] > 0
ys, xs = np.where(a); x0, y0, x1, y1 = xs.min(), ys.min(), xs.max(), ys.max()
M = 16
o = Image.new('RGBA', (x1 - x0 + 1 + 2 * M, y1 - y0 + 1 + 2 * M), (0, 0, 0, 0)); o.paste(im.crop((x0, y0, x1 + 1, y1 + 1)), (M, M))
o.save(out, optimize=True)
print(json.dumps({'rawContentBox': [int(x0), int(y0), int(x1), int(y1)], 'width': o.size[0], 'height': o.size[1],
                  'baselineY': int(contact - y0 + M), 'sha256': hashlib.sha256(open(out, 'rb').read()).hexdigest()}))
