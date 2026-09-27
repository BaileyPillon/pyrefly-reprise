"""Film set: resample a cut-out in place by <scale> (1 = the idle's scale for this subject) and write the
sidecar base <cut>.scaled.json: facing, mirrored false, baselineY (lowest opaque row, the feet or the legs'
contact line), anchor (the horizontal centre of the bottom 6 % of the opaque rows), size and the scale.
Usage: python scale.py <cut.png> <raw-sidecar.json> <scale> <facing> <subject>"""
import json, sys
import numpy as np
from PIL import Image

cut, side, k, facing, sub = sys.argv[1], sys.argv[2], float(sys.argv[3]), sys.argv[4], sys.argv[5]
im = Image.open(cut).convert('RGBA')
if abs(k - 1) > 1e-3:
    im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    # Lanczos rings a few faint pixels out beyond the edge: clear alpha below 8 and any piece under 64 px not joined
    # to the figure, so the strict one-component check sees the same single figure as before the resample
    from scipy import ndimage
    ra = np.asarray(im).copy()
    ra[..., 3][ra[..., 3] < 8] = 0
    lab, n = ndimage.label(ra[..., 3] >= 8, structure=np.ones((3, 3)))
    if n > 1:
        sz = ndimage.sum(np.ones(lab.shape), lab, range(1, n + 1))
        big = int(np.argmax(sz)) + 1
        ra[..., 3][(lab > 0) & (lab != big) & np.isin(lab, [i + 1 for i, v in enumerate(sz) if v < 64])] = 0
    im = Image.fromarray(ra)
    im.save(cut)
al = np.asarray(im)[..., 3] >= 8
rows = np.nonzero(al.any(1))[0]
base = int(rows.max())
foot = al[max(0, base - int(0.06 * (rows.max() - rows.min()))):base + 1]
xs = np.nonzero(foot.any(0))[0]
s = json.load(open(side))
s.update({'subject': sub, 'facing': facing, 'mirrored': False, 'scaleToIdle': k, 'width': im.width, 'height': im.height,
          'baselineY': base, 'anchorX': int((xs.min() + xs.max()) / 2),
          'scaleNote': 'resampled so this pose matches the idle cut-out of the same subject pixel for pixel; place at the same game scale as the idle'})
s.pop('cutout', None)
json.dump(s, open(cut.replace('.png', '.scaled.json'), 'w'), indent=1)
print(json.dumps({'step': 'scale', 'scale': k, 'size': [im.width, im.height], 'baselineY': base}))
