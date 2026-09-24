"""Daigoro cast (FFX only), step 1: the bite, from the idle's own pixels.

Daigoro's one action is his bite (research/ffx-yojimbo.md section 3.1, row 4:177). The cast keeps the
seated idle and opens the jaw: the idle's own lower jaw and chin turn down about the jaw hinge, the gap
becomes the mouth (the idle's own lip black and fur-shadow pink), and four fangs in the idle's own
white. Nothing else moves. Writes the collage and the repaint mask to the scratch folder.
   python dg_collage.py [jaw-degrees]
"""
import sys, os, json
import numpy as np, cv2
from ylib import *

idle = load(IDLE['daigoro']).astype(np.float32)
H, W = idle.shape[:2]
S = f'{SCR}/dg'; os.makedirs(S, exist_ok=True)
DEG = float(sys.argv[1]) if len(sys.argv) > 1 else 20.0

HINGE = np.float32([150, 238])
# the mouth line (upper lip) from the front corner to the hinge, read off the idle at 3x
LIP = [(56, 268), (66, 273), (80, 280), (95, 284), (110, 281), (124, 272), (135, 259), (142, 247), (148, 238)]
CHIN = [(154, 252), (150, 270), (136, 290), (112, 302), (86, 305), (62, 299), (48, 286)]
jaw_src = poly_mask(idle.shape, LIP + CHIN)

th = np.deg2rad(-DEG)  # negative: the front of the jaw swings down
c, s = np.cos(th), np.sin(th)
R = np.array([[c, -s], [s, c]])
M = np.hstack([R, (HINGE - R @ HINGE)[:, None]])
jaw = warp_rgba(idle, M, idle.shape, jaw_src)
rot = lambda p: tuple((R @ (np.float32(p) - HINGE) + HINGE).tolist())
LIP_ROT = [rot(p) for p in LIP]

base = idle.copy()
base[jaw_src > 0] = 0            # the jaw leaves its old place ...
mouth = poly_mask(idle.shape, LIP + LIP_ROT[::-1])
# ... what it uncovers under the old chin is the dark neck ruff the idle already has there
ruff = poly_mask(idle.shape, CHIN + [LIP[0]])
dark = np.float32([34, 24, 52, 255])
lay = np.zeros_like(idle)
lay[(ruff > 0) & (jaw_src > 0)] = dark
lay[mouth > 0] = np.float32([46, 16, 38, 255])                   # mouth interior (the idle's lip shadow)
# tongue along the lower jaw, the idle's own mauve fur shadow
tongue = poly_mask(idle.shape, [rot((70, 282)), rot((95, 290)), rot((122, 278)), rot((138, 258)), (130, 262), (100, 280), (74, 280)])
lay[(tongue > 0) & (mouth > 0)] = np.float32([196, 120, 150, 255])
# fangs: two upper, two lower, the idle's white
white = np.float32([250, 247, 242, 255])
for (x, y) in [(66, 273), (104, 283)]:
    f = poly_mask(idle.shape, [(x - 4, y - 1), (x + 4, y - 1), (x + 1, y + 11)]); lay[f > 0] = white
for p in [(78, 281), (116, 277)]:
    q = rot(p); x, y = q
    f = poly_mask(idle.shape, [(x - 4, y + 1), (x + 4, y + 1), (x, y - 10)]); lay[f > 0] = white

coll = over(jaw, over(lay, base))
# any pixel that was opaque in the idle stays opaque (the jaw only moves inside the head's silhouette)
save(coll, f'{S}/collage.png')
region = cv2.dilate(np.maximum.reduce([jaw_src, mouth, (jaw[:, :, 3] > 20).astype(np.uint8) * 255]), np.ones((13, 13), np.uint8))
cv2.imwrite(f'{S}/mask-M.png', region)
json.dump(dict(deg=DEG, hinge=HINGE.tolist()), open(f'{S}/collage.json', 'w'))
bg = on_bg(coll.astype(np.uint8), (128, 128, 128))
crop = cv2.resize(bg[150:360, 0:230], None, fx=3, fy=3, interpolation=cv2.INTER_NEAREST)
cv2.imwrite(f'{S}/collage-crop.jpg', cv2.cvtColor(crop, cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 90])
print('ok')
