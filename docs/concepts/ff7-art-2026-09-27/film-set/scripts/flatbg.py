"""Film set, repair round: flatten the background inside a patched box of a FULL render back to the render's own studio
grey, so the cut sees the same flat backdrop everywhere (LOOK: the boot repaint for Barret's aim and fire drew a
lighter grey panel and a floor shadow under the boot, and the cut then shredded the boot). Inside BOX, a pixel that is
grey (chroma < 26), within TOL (18) of the studio grey in every channel, not ink-dark (value >= VINK) and is REACHABLE from the box's outer edges or the canvas edge
without crossing the boot's dark ink outline becomes the studio grey (the median of the canvas's top corners).
Usage: python flatbg.py <full.png> <out.png> x0,y0,x1,y1 [vink=34]"""
import json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

src, out, box = sys.argv[1], sys.argv[2], sys.argv[3]
VINK = float(sys.argv[4]) if len(sys.argv) > 4 else 34
a = np.asarray(Image.open(src).convert('RGB')).astype(float)
H, W = a.shape[:2]
x0, y0, x1, y1 = (int(t) for t in box.split(','))
corners = np.concatenate([a[:60, :60].reshape(-1, 3), a[:60, -60:].reshape(-1, 3)])
grey = np.median(corners, 0)
v = a.mean(-1)
ch = a.max(-1) - a.min(-1)
area = np.zeros((H, W), bool)
area[y0:y1, x0:x1] = True
TOL = float(os.environ.get('TOL', 18))
cand = area & (ch < 26) & (v >= VINK) & (np.abs(a - grey).max(-1) < TOL)   # near the studio grey only: never the grey sole or a pale cuff
seed = np.zeros_like(area)
seed[y0:y1, x0] = seed[y0:y1, x1 - 1] = True
seed[y1 - 1, x0:x1] = True
seed &= cand
bg = ndimage.binary_propagation(seed, mask=cand)
res = a.copy()
res[bg] = grey
Image.fromarray(res.clip(0, 255).astype(np.uint8)).save(out)
step = {'step': 'flatbg', 'script': 'film-set/scripts/flatbg.py', 'box': box, 'grey': [round(float(t)) for t in grey], 'tol': TOL, 'pixels': int(bg.sum()),
        'why': 'the boot repaint drew a lighter panel and a floor shadow; flattened to the studio grey before the cut'}
sp = src[:-9] if src.endswith('.full.png') else os.path.splitext(src)[0]
op = out[:-9] if out.endswith('.full.png') else os.path.splitext(out)[0]
if os.path.exists(sp + '.prov.json'):
    pv = json.load(open(sp + '.prov.json'))
    pv['postProcess'] = pv.get('postProcess', []) + [step]
    json.dump(pv, open(op + '.prov.json', 'w'), indent=1)
print(json.dumps(step))
