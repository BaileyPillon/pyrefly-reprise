# margins_r1b.py (FFX-2 only): the r1 install hardcoded cutoutMarginPx 16, and gates.py measured margins at alpha > 8.
# The cut-out convention (tools/gen/comfy.mjs cutout, margin 16; METHOD-CHECK pre-judge gate) counts every
# non-zero alpha pixel. Measured at alpha > 0, Cindy's cast had a 14 px left margin (faint rotation antialiasing
# of the moved glove). Fix: pad her canvas 2 px on the left (pixels otherwise identical, MAD 0), then record the
# measured margins (alpha > 0 and alpha > 8) in both sidecars instead of a constant.
import json, os, shutil, hashlib, numpy as np
from PIL import Image
ART = 'D:/Final Fantasy/public/art/characters'
BK = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-24-chapters'
NEED = 16
def margins(a, t):
    ys, xs = np.nonzero(a > t)
    return dict(L=int(xs.min()), T=int(ys.min()), R=int(a.shape[1] - 1 - xs.max()), B=int(a.shape[0] - 1 - ys.max()))
def sha(p): return hashlib.sha256(open(p, 'rb').read()).hexdigest()
for name in ['cindy', 'mindy']:
    p = f'{ART}/{name}/cast.png'; j = f'{ART}/{name}/cast.json'
    im = np.asarray(Image.open(p).convert('RGBA'))
    m0 = margins(im[..., 3], 0)
    padL = max(0, NEED - m0['L'])
    if padL:
        keep = f'{BK}/{name}/cast-r1-before-margin-pad.png'
        if not os.path.exists(keep): shutil.copyfile(p, keep)
        new = np.zeros((im.shape[0], im.shape[1] + padL, 4), np.uint8); new[:, padL:] = im
        assert np.array_equal(new[:, padL:], im)  # MAD 0: every pixel kept, only transparent columns added
        Image.fromarray(new, 'RGBA').save(p, optimize=True)
        im = new
    side = json.load(open(j))
    a = im[..., 3]
    side['width'], side['height'] = int(im.shape[1]), int(im.shape[0])
    g = side['gates']
    g['cutoutMarginPx'] = {'alphaAbove0': margins(a, 0), 'alphaAbove8': margins(a, 8), 'required': NEED}
    assert min(g['cutoutMarginPx']['alphaAbove0'].values()) >= NEED, (name, g['cutoutMarginPx'])
    if padL:
        side['derivedFrom'] = side['derivedFrom'].replace('padded 24 px', f'padded {24 + padL} px')
        side['repairs'].append(f'r1b (2026-09-24): canvas padded {padL} px more on the left so the cut-out margin is {NEED} px '
                               'at alpha > 0 (it was 14 px: faint antialiasing of the moved glove); pixels otherwise identical')
    json.dump(side, open(j, 'w'), indent=2)
    print(name, 'pad', padL, 'size', im.shape[1], im.shape[0], 'a>0', margins(a, 0), 'a>8', margins(a, 8), 'sha', sha(p)[:16])
