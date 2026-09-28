# Re-crop a cleaned cut-out to its content + 16 px, optional mirror, and write a sidecar that carries
# the render's provenance (seed, prompt, negative) from the candidate's own json.
# usage: finalize.py in.png candidate.json out.png [--flip]
import json, sys
import numpy as np
from PIL import Image

src, cand, out = sys.argv[1:4]
flip = '--flip' in sys.argv
im = Image.open(src).convert('RGBA')
if flip:
    im = im.transpose(Image.FLIP_LEFT_RIGHT)
a = np.asarray(im)[..., 3] >= 8
ys, xs = np.where(a)
m = 16
box = (max(0, xs.min() - m), max(0, ys.min() - m), xs.max() + 1 + m, ys.max() + 1 + m)
box = tuple(int(v) for v in box)
W, H = box[2] - box[0], box[3] - box[1]
canvas = Image.new('RGBA', (W, H), (0, 0, 0, 0))
canvas.paste(im.crop((box[0], box[1], min(box[2], im.width), min(box[3], im.height))), (0, 0))
canvas.save(out, optimize=True)
c = json.load(open(cand))
side = {k: c[k] for k in ('seed', 'prompt', 'negative', 'model', 'steps', 'cfg', 'sampler', 'scheduler', 'source', 'emphasis') if k in c}
side.update({'width': W, 'height': H, 'baselineY': int(ys.max() - box[1]), 'facing': 'left', 'flipped': flip,
             'candidateFile': cand.replace('\\', '/').replace('.json', '.png'),
             'cleanup': 'clean.py (near-white slivers / floor shadow connected to the outside) + defringe.py 6 passes' + (' + mirrored' if flip else '')})
json.dump(side, open(out.replace('.png', '.json'), 'w'), indent=2)
print(out, W, H, side['baselineY'])
