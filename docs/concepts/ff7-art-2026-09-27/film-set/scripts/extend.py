"""Film set, repair round: give a render whose canvas clipped the feet (the judge: Barret's aim and fire, the near boot's
sole sliced flat on the last row) more floor-free canvas below: N rows of the render's own studio grey (the median of its
bottom 30 rows away from the figure's columns) are added under it; patch2.py then paints the rest of the boot into them.
Writes <out> and a prov (the source's prov plus this step).
Usage: python extend.py <full.png> <out.png> <rows>"""
import json, os, sys
import numpy as np
from PIL import Image

src, out, n = sys.argv[1], sys.argv[2], int(sys.argv[3])
im = Image.open(src).convert('RGB')
a = np.asarray(im).astype(float)
bot = a[-30:]
cols = np.r_[0:60, a.shape[1] - 60:a.shape[1]]
grey = np.median(bot[:, cols].reshape(-1, 3), 0)
res = Image.new('RGB', (im.width, im.height + n), tuple(int(v) for v in grey))
res.paste(im, (0, 0))
res.save(out)
step = {'step': 'extend', 'script': 'film-set/scripts/extend.py', 'rowsAdded': n, 'grey': [round(float(v)) for v in grey],
        'why': 'the canvas clipped the near boot; the boot is completed by the next patch2 step'}
sp = src[:-9] if src.endswith('.full.png') else os.path.splitext(src)[0]
op = out[:-9] if out.endswith('.full.png') else os.path.splitext(out)[0]
if os.path.exists(sp + '.prov.json'):
    pv = json.load(open(sp + '.prov.json'))
    pv['postProcess'] = pv.get('postProcess', []) + [step]
    json.dump(pv, open(op + '.prov.json', 'w'), indent=1)
print(json.dumps(step))
