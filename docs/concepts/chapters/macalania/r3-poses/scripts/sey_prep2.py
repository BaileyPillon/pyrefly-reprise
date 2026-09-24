"""Seymour cast hand repair prep, round 2 (FFX only). Round 1 (a light guide at denoise 0.55) lost the thumb and gave no
nails, so this guide draws the hand's structure in the idle's own colours: the traced silhouette split into four
fingers (thin ink parting lines, lavender shade beside each), pointed fingertips (V notches between the tips, a
pink-lavender nail with an ink point on each), a thumb on the party side with its shadow side and crease, the far
side of the hand in lavender, a soft lavender cast shadow on the chest along the hand's left and lower edge, and
a clean 1 px ink contour. The old heavy outline is inpainted away first."""
import numpy as np, cv2
C = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-24-mac-r3-poses/seymour-macalania/cast.png'
IDLE = 'D:/Final Fantasy/public/art/characters/seymour-macalania/idle.png'
OUT = 'D:/Tools/pyrefly-scratch/ch7-casts/sey2'
im = cv2.imread(C, -1); idle = cv2.imread(IDLE, -1); H, W = im.shape[:2]
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
hand = np.array([(268, 252), (276, 253), (282, 260), (287, 270), (291, 283), (294, 293), (296, 302), (296, 314), (293, 324),
                 (286, 327), (279, 323), (272, 316), (265, 307), (260, 300), (259, 288), (260, 275), (262, 262)], np.int32)
thumb = np.array([(272, 317), (263, 311), (256, 303), (252, 296), (252, 291), (255, 290), (260, 296), (266, 304), (274, 311)], np.int32)
hm = np.zeros((H, W), np.uint8); cv2.fillPoly(hm, [hand], 255); hb = hm > 0
tm = np.zeros((H, W), np.uint8); cv2.fillPoly(tm, [thumb], 255); tb = tm > 0
# idle colours (BGR)
reg = idle[285:335, 330:390, :3].reshape(-1, 3).astype(np.float32); lum = reg.mean(1)
skin = np.median(reg[lum > 200], 0); shade = np.median(reg[(lum > 120) & (lum < 190)], 0); ink = np.array([40., 22., 30.])
nail = np.array([175., 130., 190.])
# hand-local frame: s along the hand (heel -> tips), t across (party side negative)
H0 = np.array([285., 322.]); T0 = np.array([272., 254.]); u = (T0 - H0) / np.linalg.norm(T0 - H0); v = np.array([-u[1], u[0]])
if v[0] < 0: v = -v
S = (xx - H0[0]) * u[0] + (yy - H0[1]) * u[1]; Tt = (xx - H0[0]) * v[0] + (yy - H0[1]) * v[1]
# old outline away (Telea), then the new drawing
init = im.copy().astype(np.float32)
bd = np.zeros((H, W), np.uint8); cv2.polylines(bd, [hand], True, 255, 1)
near = cv2.distanceTransform(255 - bd, cv2.DIST_L2, 5) <= 3.5
remove = (near | hb) & (init[..., :3].mean(-1) < 90)
init[..., :3] = cv2.inpaint(np.clip(init[..., :3], 0, 255).astype(np.uint8), remove.astype(np.uint8) * 255, 3, cv2.INPAINT_TELEA).astype(np.float32)
chest_bg = init.copy()
# cast shadow on the chest: a band left of and below the hand (outside it), lavender
sh = cv2.dilate(hm | tm, np.ones((7, 7), np.uint8)) > 0
sh &= ~(hb | tb) & (Tt < 6)
init[sh, :3] = init[sh, :3] * 0.55 + shade * 0.45
# base fill: lit skin, far side lavender (t > 7), heel lavender
fill = hb.copy()
init[fill, :3] = skin
far = fill & (Tt > 6)
init[far, :3] = skin * 0.45 + shade * 0.55
heel = fill & (S < 10)
init[heel, :3] = init[heel, :3] * 0.5 + shade * 0.5
# fingers: parting lines at t = -8, 0, 8 from s = 34 up; V notches between the tips
parts = [-8.5, 0.0, 8.0]
smax = {}
for tbv in parts:
    band = hb & (np.abs(Tt - tbv) < 0.8)
    smax[tbv] = float(S[band].max()) if band.any() else 60.0
notch = np.zeros((H, W), bool)
for tbv in parts:
    top = smax[tbv]
    depth = 8.0
    notch |= hb & (S > top - depth) & (np.abs(Tt - tbv) < (S - (top - depth)) * 0.42)
# pixels in a notch go back to the chest behind (Telea from outside the hand)
outside_fill = cv2.inpaint(np.clip(chest_bg[..., :3], 0, 255).astype(np.uint8), (hb.astype(np.uint8) * 255), 5, cv2.INPAINT_TELEA).astype(np.float32)
init[notch, :3] = outside_fill[notch]
fing = hb & ~notch
# shade beside each parting line (right side), then the ink line itself
for tbv in parts:
    sideband = fing & (Tt > tbv) & (Tt < tbv + 2.6) & (S > 30)
    init[sideband, :3] = init[sideband, :3] * 0.5 + shade * 0.5
SS = 4
def aa(img, draw, col, alpha=1.0):
    big = np.zeros((H * SS, W * SS), np.uint8); draw(big)
    a = cv2.resize(big, (W, H), interpolation=cv2.INTER_AREA).astype(np.float32)[..., None] / 255 * alpha
    img[..., :3] = img[..., :3] * (1 - a) + col * a
def P(s, t):  # local -> image, scaled for the SS canvas
    p = H0 + s * u + t * v; return (int(round((p[0] + 0.5) * SS)), int(round((p[1] + 0.5) * SS)))
for tbv in parts:
    aa(init, lambda b, tbv=tbv: cv2.line(b, P(34, tbv), P(smax[tbv] - 7.5, tbv), 255, SS, cv2.LINE_AA), ink, 0.85)
# nails: the last 5 px of each finger tip, pink-lavender, with an ink point
edges = [-17.0] + parts + [17.0]
for i in range(4):
    tl, tr = edges[i], edges[i + 1]; tc = (tl + tr) / 2
    colm = fing & (Tt > tl + 0.8) & (Tt < tr - 0.8)
    if not colm.any():
        continue
    stip = float(S[colm].max())
    nl = colm & (S > stip - 5)
    init[nl, :3] = init[nl, :3] * 0.35 + nail * 0.65
    aa(init, lambda b, tc=tc, stip=stip: cv2.line(b, P(stip - 2.5, tc), P(stip + 0.5, tc), 255, SS, cv2.LINE_AA), ink, 0.9)
# thumb: skin, shadow side (towards the palm), crease, nail
init[tb, :3] = skin
tsh = tb & (Tt > -15.5)
init[tsh, :3] = skin * 0.4 + shade * 0.6
tip = tb & ((xx - 253) ** 2 + (yy - 292) ** 2 < 14)
init[tip, :3] = init[tip, :3] * 0.4 + nail * 0.6
# contours: hand silhouette (minus the notches) and thumb, 1 px ink
sil = (fing | tb).astype(np.uint8) * 255
cnts, _ = cv2.findContours(sil, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
cnts = [cv2.approxPolyDP(c, 0.8, True) for c in cnts]
aa(init, lambda b: cv2.polylines(b, [((c.reshape(-1, 2).astype(np.float32) + 0.5) * SS).astype(np.int32) for c in cnts], True, 255, SS, cv2.LINE_AA), ink, 1.0)
aa(init, lambda b: cv2.polylines(b, [((thumb.astype(np.float32) + 0.5) * SS).astype(np.int32)], False, 255, SS, cv2.LINE_AA), ink, 0.9)
mask = cv2.dilate(hm | tm, np.ones((11, 11), np.uint8)) > 0
init[mask, 3] = 255
cv2.imwrite(OUT + '.init.png', np.clip(init, 0, 255).astype(np.uint8))
cv2.imwrite(OUT + '.mask.png', mask.astype(np.uint8) * 255)
print('maskPx', int(mask.sum()), 'smax', smax, 'u', u, 'v', v)
