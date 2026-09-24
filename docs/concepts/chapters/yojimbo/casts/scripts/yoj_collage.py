"""Yojimbo cast (FFX only), step 1: the collage from the idle's own pixels.

Zanmato is his signature, so the cast is the drawn blade. The idle's own katana (blue hilt, gold
tsuba) leaves the hip and goes into his far (right) hand; that forearm is the idle's own gauntlet
forearm, moved under the body so it comes out from behind the chest. The only new shape is the
blade, drawn in steel colours the idle already has (measured: 1.3 dE or less from idle pixels).
Writes the collage and the repaint masks to the scratch folder; nothing here is installed.
"""
import json, sys
import numpy as np, cv2
from ylib import *

idle = load(IDLE['yojimbo-cavern']).astype(np.float32)
H, W = idle.shape[:2]
S = f'{SCR}/yoj'
import os; os.makedirs(S, exist_ok=True)

# --- the idle katana hilt + tsuba (source) -------------------------------------------------------
POMMEL0, TSUBA0 = (163, 383), (243, 462)
hilt_src = rect_along(idle.shape, (156, 376), (258, 470), 30)
tsuba_src = np.zeros((H, W), np.uint8); cv2.ellipse(tsuba_src, (242, 462), (24, 30), 35, 0, 360, 255, -1)
piece_src = np.maximum(hilt_src, tsuba_src)
# the sash lies right of this line at the tsuba; pixels of the piece left of it are over empty background
sash_line = lambda y: 257 + (y - 440) * 0.05
yy, xx = np.mgrid[0:H, 0:W]
left_of_sash = xx < sash_line(yy)
erase = (piece_src > 0) & left_of_sash & (yy < 486)
refill = (piece_src > 0) & ~left_of_sash & (yy < 486)          # tsuba over the sash: repaint

# --- new geometry --------------------------------------------------------------------------------
ANG = np.deg2rad(float(sys.argv[1]) if len(sys.argv) > 1 else 50)   # blade elevation
TSUBA1 = np.float32([200, 285])
up = np.float32([-np.cos(ANG), -np.sin(ANG)])          # blade direction (up-left)
L_HILT = float(np.hypot(TSUBA0[0] - POMMEL0[0], TSUBA0[1] - POMMEL0[1]))
POMMEL1 = TSUBA1 - up * L_HILT
BLADE_LEN = 250
TIP = TSUBA1 + up * BLADE_LEN
M_hilt = affine(TSUBA0, POMMEL0, TSUBA1, POMMEL1)
# the sash's red and orange showing between tsuba and hip are not part of the sword
rr, gg, bb = idle[:, :, 0], idle[:, :, 1], idle[:, :, 2]
sashy = (rr > 90) & (rr > 1.5 * gg) & (rr > 1.4 * bb) | ((rr > 180) & (gg > 60) & (gg < 170) & (bb < 80))
clean_src = (piece_src > 0) & ~sashy & (yy < 486)
hilt_clean = warp_rgba(idle, M_hilt, idle.shape, (clean_src * 255).astype(np.uint8))
hilt_new = warp_rgba(idle, M_hilt, idle.shape, piece_src & np.where(yy < 486, 255, 0).astype(np.uint8))

# far forearm: the idle gauntlet forearm (wrist -> elbow), moved to come out from behind the chest
W0, E0 = (372, 447), (470, 386)
fore_src = rect_along(idle.shape, (360, 454), (486, 376), 46)
grip = TSUBA1 - up * (L_HILT * 0.38)                      # fist centre on the grip
W1 = grip + np.float32([12, 4])
E1 = W1 + np.float32([96, 14])
M_fore = affine(W0, E0, W1, E1)
fore_new = warp_rgba(idle, M_fore, idle.shape, fore_src)
fore_new[:, :, :3] *= 0.86                                  # the far arm sits in the body's shadow

# fist: the idle's own glove hand (purple, gold rim), turned to close over the grip
HAND0a, HAND0b = (338, 470), (392, 452)
hand_src = poly_mask(idle.shape, [(322, 452), (352, 436), (398, 438), (404, 470), (372, 488), (330, 488)])
M_hand = affine(HAND0a, HAND0b, grip + np.float32([-16, 10]), grip + np.float32([22, -2]))
hand_new = warp_rgba(idle, M_hand, idle.shape, hand_src)
hand_new[:, :, :3] *= 0.9

# blade: a curved katana blade in idle steel colours (spine dark, flat mid, edge bright)
def blade_layer():
    lay = np.zeros((H, W, 4), np.float32)
    n = np.float32([-up[1], up[0]])                         # normal; +n is the lower (cutting) side
    if n[1] < 0: n = -n
    ts = np.linspace(0, 1, 200)
    sori = 6.0                                              # curve toward the spine, px at mid-blade
    def pt(t, off):
        width = 9.0 * (1 - 0.35 * t)
        c = TSUBA1 + up * (BLADE_LEN * t) - n * (sori * 4 * t * (1 - t))
        return c + n * off * width
    spine = [pt(t, -1) for t in ts]; edge = [pt(t, 1) for t in ts]
    tip = TIP - n * 0.0
    poly = np.array(spine + [tip + up * 2] + edge[::-1], np.float32)
    m = np.zeros((H, W), np.uint8); cv2.fillPoly(m, [np.round(poly).astype(np.int32)], 255)
    band = lambda a, b: np.array([pt(t, a) for t in ts] + [pt(t, b) for t in ts[::-1]], np.float32)
    col = np.zeros((H, W, 3), np.float32); col[:] = (185, 190, 205)
    for (a, b, c) in [(-1.0, -0.45, (120, 130, 160)), (-0.45, -0.2, (150, 155, 175)), (0.35, 0.75, (210, 212, 222)), (0.75, 1.0, (250, 250, 252))]:
        mm = np.zeros((H, W), np.uint8); cv2.fillPoly(mm, [np.round(band(a, b)).astype(np.int32)], 255)
        col[mm > 0] = c
    # dark ink outline, as every painted part has
    edge_m = cv2.dilate(m, np.ones((3, 3), np.uint8)) - m
    lay[m > 0, :3] = col[m > 0]; lay[m > 0, 3] = 255
    lay[edge_m > 0] = (20, 18, 30, 255)
    # habaki: a small gold collar at the base, the tsuba's gold
    hb = rect_along(idle.shape, TSUBA1, TSUBA1 + up * 12, 16)
    lay[hb > 0] = (214, 170, 60, 255)
    return lay
blade = blade_layer()

# --- compose: far arm under the body; hilt, blade, fist over the empty space in front --------------
base = idle.copy()
base[erase] = 0
behind = over(hand_new, over(hilt_new, fore_new))           # fist over hilt over forearm
behind = over(blade, behind)
behind_under = behind.copy()
col = over(base, behind_under)                              # the body occludes the far arm
# the hilt/fist/blade are in front of the chest (x < chest edge): the body never covers them there
front = (base[:, :, 3] == 0)
col[front] = behind[front]
coll = col

# masks: A = fist, wrist, arm seam (hi denoise); B = blade + hilt edges (low); C = hip sliver
fist_m = cv2.dilate(((hand_new[:, :, 3] > 20) * 255).astype(np.uint8), np.ones((15, 15), np.uint8))
fore_vis = ((fore_new[:, :, 3] > 20) & (idle[:, :, 3] == 0)).astype(np.uint8) * 255
seam_m = cv2.dilate(fore_vis, np.ones((9, 9), np.uint8))
blade_m = cv2.dilate(((blade[:, :, 3] > 0) * 255).astype(np.uint8), np.ones((9, 9), np.uint8))
hilt_m = cv2.dilate(((hilt_new[:, :, 3] > 20) * 255).astype(np.uint8), np.ones((7, 7), np.uint8))
hip_m = cv2.dilate((refill * 255).astype(np.uint8), np.ones((9, 9), np.uint8))
A = np.maximum(fist_m, seam_m)
B = np.maximum(blade_m, hilt_m)
import os as _o
if not _o.environ.get('LAYERS_ONLY'): save(coll, f'{S}/collage.png')
save(hilt_new, f'{S}/layer-hilt.png'); save(hilt_clean, f'{S}/layer-hilt-clean.png'); save(fore_new, f'{S}/layer-fore.png')
for k, v in ({} if _o.environ.get('LAYERS_ONLY') else dict(A=A, B=B, C=hip_m, erase=(erase * 255).astype(np.uint8))).items():
    cv2.imwrite(f'{S}/mask-{k}.png', v)
json.dump(dict(angle=float(np.rad2deg(ANG)), tsuba=TSUBA1.tolist(), pommel=POMMEL1.tolist(), tip=TIP.tolist(), grip=grip.tolist(),
               W1=W1.tolist(), E1=E1.tolist()), open(f'{S}/collage.json', 'w'), indent=1)
bg = on_bg(coll.astype(np.uint8), (128, 128, 128))
cv2.imwrite(f'{S}/collage-look.jpg', cv2.cvtColor(bg, cv2.COLOR_RGB2BGR))
c = bg[40:520, 0:420]; c = cv2.resize(c, None, fx=2, fy=2, interpolation=cv2.INTER_NEAREST)
cv2.imwrite(f'{S}/collage-crop.jpg', cv2.cvtColor(c, cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 90])
print('ok', TIP, POMMEL1)
