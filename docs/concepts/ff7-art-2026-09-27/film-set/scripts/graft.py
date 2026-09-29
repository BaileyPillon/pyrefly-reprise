"""Film set, repair round: Cloud's pauldron from OUR OWN fixed idle (cloud/idle/cut-p4x.png) grafted onto a pose render.
The judge: several poses redrew the pauldron (a round disc with four spikes, a smooth dome, a plain round plate), so it
"pops" when idle and pose alternate. A local repaint with the idle's pauldron as a reference kept the pose's own shape
(LOOKED at: back and hurt stayed discs), so the idle's plate itself is cut out along a hand-traced outline (below, in the
idle cut-out's pixels: the rolled rim, the riveted lower plate and the three spikes), scaled by 1/scaleToIdle (so it
is the idle's size once the pose is resampled to the idle's scale), turned ANGLE degrees, and pasted with its centre at
(CX, CY) in the pose's full render. Never mirrored (the idle already faces screen-right and the pauldron is on the same
far shoulder). A patch2.py blend pass afterwards cleans the old plate's leftovers round it.
Usage: python graft.py <pose-full.png> <out.png> <cx> <cy> <scale> <angle-deg>"""
import json, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

IDLE = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ff7-film/cloud/idle/cut-p4x.png'
OX, OY = 430, 480
POLY = [(70, 60), (100, 55), (140, 75), (150, 82), (165, 80), (215, 108), (212, 125), (190, 140), (200, 185), (215, 190),
        (212, 210), (195, 215), (192, 250), (195, 265), (150, 275), (125, 265), (110, 250), (60, 240), (55, 175), (75, 165),
        (68, 120), (62, 80)]
src, out = sys.argv[1], sys.argv[2]
cx, cy, k, ang = float(sys.argv[3]), float(sys.argv[4]), float(sys.argv[5]), float(sys.argv[6])
idle = Image.open(IDLE).convert('RGBA')
xs, ys = [p[0] for p in POLY], [p[1] for p in POLY]
box = (OX + min(xs) - 6, OY + min(ys) - 6, OX + max(xs) + 6, OY + max(ys) + 6)
piece = idle.crop(box)
m = Image.new('L', piece.size, 0)
ImageDraw.Draw(m).polygon([(OX + x - box[0], OY + y - box[1]) for x, y in POLY], fill=255)
m = m.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(1.2))
pa = np.asarray(piece).copy()
pa[..., 3] = (pa[..., 3].astype(float) * np.asarray(m) / 255).astype(np.uint8)
piece = Image.fromarray(pa)
piece = piece.resize((round(piece.width * k), round(piece.height * k)), Image.LANCZOS).rotate(ang, resample=Image.BICUBIC, expand=True)
im = Image.open(src).convert('RGBA')
im.alpha_composite(piece, (round(cx - piece.width / 2), round(cy - piece.height / 2)))
if Image.open(src).mode == 'RGB':
    im = im.convert('RGB')
im.save(out)
bx = [round(cx - piece.width / 2), round(cy - piece.height / 2), round(cx + piece.width / 2), round(cy + piece.height / 2)]
print(json.dumps({'step': 'graft', 'script': 'film-set/scripts/graft.py', 'what': "the idle's pauldron (our own cut-p4x) grafted in place of the redrawn one",
                  'from': IDLE, 'fromBox': list(box), 'centre': [cx, cy], 'scale': k, 'angleDeg': ang, 'pasteBox': bx, 'mirrored': False}))
