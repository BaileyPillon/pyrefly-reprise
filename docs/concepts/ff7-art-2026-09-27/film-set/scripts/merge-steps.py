"""Film set, repair round: build a cut-out's base sidecar from an earlier sidecar plus the repair steps (each a JSON
file holding one step line), re-measure size, baselineY and anchorX on the new file, and write <cut>.base.json for
../../hifi/scripts/recheck.mjs (which re-runs BOTH cut-out checks and writes <cut>.json).
Usage: python merge-steps.py <cut.png> <earlier-sidecar.json> [step.json ...]   env NOTE="what this repair fixed" """
import json, os, sys
import numpy as np
from PIL import Image

cut, side = sys.argv[1], sys.argv[2]
s = json.load(open(side))
for k in ('recheck', 'cutoutOk'):
    s.pop(k, None)
s['postProcess'] = s.get('postProcess', []) + [json.loads(open(p).read().strip().splitlines()[-1]) for p in sys.argv[3:]]
im = Image.open(cut).convert('RGBA')
al = np.asarray(im)[..., 3] >= 8
rows = np.nonzero(al.any(1))[0]
base = int(rows.max())
foot = al[max(0, base - int(0.06 * (rows.max() - rows.min()))):base + 1]
xs = np.nonzero(foot.any(0))[0]
s.update({'width': im.width, 'height': im.height, 'baselineY': base, 'anchorX': int((xs.min() + xs.max()) / 2), 'mirrored': False})
if os.environ.get('NOTE'):
    s['repairRound'] = os.environ['NOTE']
json.dump(s, open(cut.replace('.png', '.base.json'), 'w'), indent=1)
print(json.dumps({'base': cut.replace('.png', '.base.json'), 'steps': len(s['postProcess']), 'baselineY': base}))
