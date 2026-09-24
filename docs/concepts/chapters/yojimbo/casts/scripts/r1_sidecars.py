"""Sidecars for the r1 pixel repairs (FFX only). Each is its parent candidate's sidecar plus the repair record."""
import json, hashlib
import numpy as np
from PIL import Image
from r1common import OUT

def sha(p): return hashlib.sha256(open(p, 'rb').read()).hexdigest()
def box(p):
    a = np.array(Image.open(p))[:, :, 3]; ys, xs = np.where(a > 0); return [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())]

def write(key, name, parent, extra):
    side = json.load(open(f'{OUT}/{key}/{parent}.json'))
    png = f'{OUT}/{key}/{name}.png'
    side.update(extra)
    side['parent'] = f'{key}/{parent}.png sha256 {side.pop("sha256")}'
    side['sha256'] = sha(png)
    side['scripts'] = 'docs/concepts/chapters/yojimbo/casts/scripts/ (yoj_r1.py, dg_r1.py, r1_sidecars.py)'
    b = box(png); cb = side['cutout']['contentBox']
    if b[0] < cb[0] or b[1] < cb[1]:
        side['cutout'] = dict(side['cutout'], contentBox=[min(b[0], cb[0]), min(b[1], cb[1]), max(b[2], cb[2]), max(b[3], cb[3])],
                              note='the longer blade reaches past the parent content box')
    json.dump(side, open(png.replace('.png', '.json'), 'w'), indent=1)
    print(png, side['sha256'][:12])

YREP = dict(
    status='CANDIDATE r1 (never installed; not approved)',
    repair='r1 pixel repair per JUDGE.md (commit 01dc52f9), no GPU: the blade redrawn on the same arc and the same tip '
           '(no lengthening) with ink on spine and edge at the idle line weight (2 to 3 px), a two-value steel split, '
           'a shinogi line and a pointed kissaki with its yokote; the ragged black root replaced by a gold habaki collar '
           'at the tsuba, the red fringe and loose dark pixels outside the tsuba rim peeled; the glove front edge '
           'smoothed, its pale lavender fringe peeled and inked (tapered, 1 to 2 px). Every colour is snapped to the '
           'locked idle palette (invented share 0.0 %); MAD 0 against cast.png outside provenance/r1/yojimbo-cast-r1.mask.png.')
write('yojimbo-cavern', 'cast-r1', 'cast', YREP)
write('yojimbo-cavern', 'cast-r1-option-longer', 'cast', dict(YREP,
    status='OPTION ONLY (needs Bailey\'s yes to lengthen the blade; never installed; not approved)',
    repair=YREP['repair'].replace('(no lengthening)', '(LENGTHENED: the same arc continued 40 px past the tip, about 243 to 283 px; a visual option, no sourced blade length)')
                         .replace('yojimbo-cast-r1.mask.png', 'yojimbo-cast-r1-option-longer.mask.png')))
write('daigoro', 'cast-r1', 'cast', dict(
    status='CANDIDATE r1 (never installed; not approved)',
    repair='r1 pixel touch-up per JUDGE.md (commit 01dc52f9), no GPU: the pink / magenta speckle fringe under the lower jaw '
           'inpainted from the surrounding fur (the white jaw band hidden from the solver); the angular lower lip redrawn '
           'as one smooth tapered line through the traced points (kinks at the front and back corners rounded), the '
           'uncovered pixels inpainted per side; the front fang picket thinned to his anatomy (the four teeth between '
           'the front fang and the canine removed, refilled from the dark lip and the red mouth). '
           'Colours snapped to the locked idle palette (invented share 0.0 %); MAD 0 against cast.png outside '
           'provenance/r1/daigoro-cast-r1.mask.png.'))
