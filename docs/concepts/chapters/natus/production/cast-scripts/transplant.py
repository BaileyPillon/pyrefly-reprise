"""Natus hero cast, step 1 (FFX only): idle-pixel transplant. Both blade-wings (hilt, hand and
tail with them) turn outward about the grip; the body, the head and both forearms stay the idle's.
No GPU. Writes <OUT>/t1.png (on a canvas widened to hold the wings), the moved-piece masks and
the seam masks the repaint may touch.  python transplant.py [deg]"""
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from nlib import *
DEG = float(sys.argv[1]) if len(sys.argv) > 1 else 18.0
os.makedirs(OUT, exist_ok=True)
idle = load(IDLE); H, W = idle.shape[:2]
PADL, PADR = 70, 110                       # canvas grows sideways only; same pixel scale, same baseline
cv = np.zeros((H, W + PADL + PADR, 4), np.float32); cv[:, PADL:PADL + W] = idle
S = cv.shape
sh = lambda pts: [(x + PADL, y) for x, y in pts]
# moving pieces (idle coordinates), each with its grip pivot
PL = sh([(0, 0), (272, 0), (252, 130), (205, 262), (192, 300), (190, 438), (168, 440), (236, 500),
         (274, 527), (274, 596), (190, 628), (0, 640)])
PR = sh([(482, 0), (693, 0), (693, 630), (548, 630), (474, 542), (478, 519), (522, 479), (521, 442),
         (507, 405), (497, 205)])
pieces = [('left', PL, (205 + PADL, 515), -DEG), ('right', PR, (505 + PADL, 500), DEG)]
base = cv.copy(); moved = np.zeros(S[:2], np.float32); holes = np.zeros(S[:2], bool)
for name, poly, piv, deg in pieces:
    m = poly_mask(S, poly)
    holes |= (m > 0) & (cv[:, :, 3] > 0)
    base[m > 0] = 0                        # lift the piece off the idle
out = base.copy(); info = {}
for name, poly, piv, deg in pieces:
    m = poly_mask(S, poly)
    M = cv2.getRotationMatrix2D(piv, -deg, 1.0)   # cv2 angle is CCW-positive on screen
    w = warp_rgba(cv, M, S, m)
    out = over(w, out)                     # wings in front of the body (as in the idle at the grips)
    moved = np.maximum(moved, w[:, :, 3])
    info[name] = {'pivot': [piv[0] - PADL, piv[1]], 'deg': deg, 'poly': [[x - PADL, y] for x, y in poly]}
# binarise alpha like the idle (the idle is hard-edged)
out[:, :, 3] = np.where(out[:, :, 3] > 127, 255, 0); out[out[:, :, 3] == 0, :3] = 0
o8 = np.clip(out, 0, 255).round().astype(np.uint8)
save(o8, f'{OUT}/t1.png')
# seam masks: where the lifted piece left holes in stayed pixels near the grips, plus a band round each cut
cuts = {'left': sh([(168, 440), (236, 500), (274, 527)]),
        'right': sh([(497, 380), (507, 405), (521, 442), (522, 479), (478, 519), (474, 542)])}
seam = np.zeros(S[:2], np.uint8)
for k, pts in cuts.items():
    for a, b in zip(pts[:-1], pts[1:]):
        seam |= rect_along(S, a, b, 44)
# the idle's white matte pocket in the right hand (it rides along with the hand): repaint it too
hsv = cv2.cvtColor(o8[:, :, :3], cv2.COLOR_RGB2HSV)
pocket = (o8[:, :, 3] > 0) & (hsv[:, :, 2] > 215) & (hsv[:, :, 1] < 40) & (moved > 0)
win = np.zeros(S[:2], bool); win[515:580, 590:635] = True; pocket &= win   # the one blob, not the tail's pale tips
seam |= (cv2.dilate(pocket.astype(np.uint8), np.ones((9, 9), np.uint8)) * 255)
print('pocket px', int(pocket.sum()))
pk = cv2.dilate(pocket.astype(np.uint8), np.ones((5, 5), np.uint8))
fill = cv2.inpaint(np.ascontiguousarray(o8[:, :, :3]), pk, 6, cv2.INPAINT_TELEA)   # Telea pre-fill from the hand's own colours
o8[pk > 0, :3] = fill[pk > 0]; o8[pk > 0, 3] = 255
save(o8, f'{OUT}/t1.png')
near = cv2.dilate((o8[:, :, 3] > 0).astype(np.uint8), np.ones((13, 13), np.uint8)) > 0
seam = np.where(near, seam, 0).astype(np.uint8)   # never paint far into the empty ground
save(np.dstack([seam] * 3 + [np.full_like(seam, 255)]), f'{OUT}/t1.seam.png')
json.dump({'deg': DEG, 'pad': [PADL, PADR], 'pieces': info}, open(f'{OUT}/t1.json', 'w'), indent=1)
d = np.abs(o8.astype(int) - np.clip(cv, 0, 255).astype(int)).max(2)
allm = np.zeros(S[:2], bool)
for _, poly, _, _ in pieces: allm |= poly_mask(S, poly) > 0
allm |= moved > 0
print('canvas', S[1], 'x', S[0], 'MAD outside piece+moved', int(d[~allm].max()), 'changed', int((d > 0).sum()))
