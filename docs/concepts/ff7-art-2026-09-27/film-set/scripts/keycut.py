"""Film set, repair round: re-cut one region of a figure by COLOUR KEY where both rembg models failed (LOOK: Barret's
completed near boot, aim and fire: the models dropped the dark sole and heel and left streaks). The region's background
was first flattened to the exact studio grey (flatbg.py), so inside BOX (full-render pixels) the alpha is the key
alpha, clip((max channel distance from the studio grey - 3) / 8), with enclosed holes filled, and outside BOX the rembg alpha is kept. The raw
canvas grows to cover BOX. Writes a new raw cut-out and its sidecar (cropBox updated, keyBox recorded).
POLY='x,y;x,y;...' (full-render pixels): the box's alpha is that traced outline instead of the colour key.
Usage: python keycut.py <full.png> <raw-cut.png> <raw.json> <x0,y0,x1,y1> <out-raw.png>"""
import json, sys
import numpy as np
from PIL import Image

full, raw, rawj, box, out = sys.argv[1:6]
F = np.asarray(Image.open(full).convert('RGB')).astype(float)
R = np.asarray(Image.open(raw).convert('RGBA'))
d = json.load(open(rawj))
cx0, cy0 = d['cropBox'][:2]
bx0, by0, bx1, by1 = (int(t) for t in box.split(','))
corners = np.concatenate([F[:60, :60].reshape(-1, 3), F[:60, -60:].reshape(-1, 3)])
grey = np.median(corners, 0)
# the new canvas: the union of the old crop and the box
nx0, ny0 = min(cx0, bx0), min(cy0, by0)
nx1, ny1 = max(cx0 + R.shape[1], bx1), max(cy0 + R.shape[0], by1)
C = np.zeros((ny1 - ny0, nx1 - nx0, 4), np.uint8)
C[cy0 - ny0:cy0 - ny0 + R.shape[0], cx0 - nx0:cx0 - nx0 + R.shape[1]] = R
sub = F[by0:by1, bx0:bx1]
from scipy import ndimage
key = np.clip((np.abs(sub - grey).max(-1) - 3) / 8, 0, 1)
key = np.maximum(key, ndimage.binary_fill_holes(key > 0.5).astype(float)) * 255   # a near-grey patch inside the boot stays solid
import os
if os.environ.get('POLY'):
    # a hand-traced outline in full-render pixels (a grey blade on the grey studio: neither rembg nor a colour key can
    # separate it), drawn 4x supersampled for a soft edge, united with the rembg alpha already there
    from PIL import ImageDraw
    pts = [tuple(float(v) for v in p.split(',')) for p in os.environ['POLY'].split(';')]
    S = 4
    m = Image.new('L', ((bx1 - bx0) * S, (by1 - by0) * S), 0)
    ImageDraw.Draw(m).polygon([((x - bx0) * S, (y - by0) * S) for x, y in pts], fill=255)
    key = np.asarray(m.resize((bx1 - bx0, by1 - by0), Image.LANCZOS)).astype(float)
    old = C[by0 - ny0:by1 - ny0, bx0 - nx0:bx1 - nx0, 3].astype(float)
    key = np.maximum(key, old)
C[by0 - ny0:by1 - ny0, bx0 - nx0:bx1 - nx0, :3] = sub.astype(np.uint8)
C[by0 - ny0:by1 - ny0, bx0 - nx0:bx1 - nx0, 3] = key.astype(np.uint8)
Image.fromarray(C).save(out)
d2 = dict(d)
d2['cropBox'] = [int(nx0), int(ny0), int(nx1), int(ny1)]
d2['width'], d2['height'] = int(C.shape[1]), int(C.shape[0])
d2['keyCut'] = {'script': 'film-set/scripts/keycut.py', 'box': box, 'polygon': os.environ.get('POLY'), 'grey': [round(float(t)) for t in grey],
                'why': 'both rembg models dropped the completed boot sole; the flattened region is cut by colour key'}
json.dump(d2, open(out.replace('.png', '.json'), 'w'), indent=1)
print(json.dumps(d2['keyCut']))
