"""Guado Guardian cast repair prep (FFX only): repaint mask = (a) the wrist bend, with a guided fillet on the inner
corner so the forearm turns into the fist over a longer curve; (b) the dark notch under the knuckles; (c) the
fragments the spear warp carried along (the green hook above the fist, the specks along the shaft): moved pixels
that a 7 px opening of the moved shaft removes, plus dark specks on the repainted robe beside the shaft.
The shaft itself (the opened moved pixels) is protected: pasted back exactly."""
import numpy as np, cv2
C = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-24-mac-r3-poses/guado-guardian/'
IDLE = 'D:/Final Fantasy/public/art/characters/guado-guardian/idle.png'
OUT = 'D:/Tools/pyrefly-scratch/ch7-casts/gua'
I = cv2.imread(IDLE, -1); im = cv2.imread(C + 'cast.png', -1); P = cv2.imread(C + 'cast.painted.png', 0) > 0
H, W = im.shape[:2]; yy, xx = np.mgrid[0:H, 0:W]
op = im[..., 3] > 127
mv = np.any(I != im, -1) & op & ~P
fistbox = (xx > 285) & (xx < 400) & (yy > 470) & (yy < 600)
c = np.array([353.5, 646.5]); d = np.array([0.5151, 0.8571]); n = np.array([-d[1], d[0]])
dist = (xx - c[0]) * n[0] + (yy - c[1]) * n[1]; along = (xx - c[0]) * d[0] + (yy - c[1]) * d[1]
zone = (np.abs(dist) < 45) & (along > -330) & (along < 230) & ~fistbox   # the shaft between the two spear heads
k7 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
shaft = cv2.morphologyEx((mv & zone).astype(np.uint8), cv2.MORPH_OPEN, k7) > 0
frag = mv & zone & ~shaft
nl, lab, st, _ = cv2.connectedComponentsWithStats(frag.astype(np.uint8), connectivity=8)
keep = np.zeros_like(frag)
touch = cv2.dilate(shaft.astype(np.uint8), np.ones((3, 3), np.uint8)) > 0   # attached to the shaft (not the old feather ring)
for i in range(1, nl):
    comp = lab == i
    if st[i, 4] >= 2 and (comp & touch).any():
        keep |= comp
# the green hook the spear warp carried above the fist (moved green pixels beside the shaft)
b_, g_, r_ = [im[..., i].astype(int) for i in range(3)]
hook = mv & (g_ > r_ + 15) & (g_ > b_ - 10) & (xx > 272) & (xx < 300) & (yy > 478) & (yy < 520)
hook = cv2.dilate(hook.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool) & mv & ~shaft
keep |= hook
# dark specks on the repainted robe within 6 px of the shaft
lum = im[..., :3].astype(np.float32).mean(-1)
med = cv2.medianBlur(im[..., :3], 7).astype(np.float32).mean(-1)
nearshaft = cv2.dilate(shaft.astype(np.uint8), np.ones((13, 13), np.uint8)) > 0
speck = P & nearshaft & ~shaft & (lum < med - 45)
frag_mask = cv2.dilate((keep | speck).astype(np.uint8), np.ones((5, 5), np.uint8)) > 0
# wrist: inner-corner fillet (quadratic Bezier from the forearm's inner edge to the fist's top edge)
def bez(p0, p1, p2, nn=40):
    t = np.linspace(0, 1, nn)[:, None]
    return (1 - t) ** 2 * np.array(p0) + 2 * (1 - t) * t * np.array(p1) + t ** 2 * np.array(p2)
b = bez((340, 480), (337.5, 513), (308, 524))
fil = np.zeros((H, W), np.uint8)
cv2.fillPoly(fil, [np.round(np.vstack([b, [(300, 540), (345, 540), (345, 480)]])).astype(np.int32)], 255)
arm_old = (im[..., 0].astype(int) > im[..., 2].astype(int) + 25) & (lum > 60)  # blue skin (BGR: B >> R)
fillet = (fil > 0) & ~arm_old & (yy < 530) & (xx > 305)
wrist = np.zeros((H, W), np.uint8); cv2.ellipse(wrist, (352, 512), (34, 26), 0, 0, 360, 255, -1)
notch = np.zeros((H, W), np.uint8); cv2.ellipse(notch, (302, 594), (8, 6), 0, 0, 360, 255, -1)
mask = ((wrist > 0) | (notch > 0) | frag_mask | cv2.dilate(fillet.astype(np.uint8), np.ones((7, 7), np.uint8)) > 0) & op & ~shaft
cv2.imwrite(OUT + '.mask.png', mask.astype(np.uint8) * 255)
cv2.imwrite(OUT + '.protect.png', shaft.astype(np.uint8) * 255)
# guided init: fillet filled with the forearm's own blue (median of the lower forearm), ink along the Bezier
init = im.copy().astype(np.float32)
skin_reg = arm_old & (yy > 470) & (yy < 500) & (xx > 345) & (xx < 375)
skin = np.median(im[skin_reg][:, :3].astype(np.float32), 0)
ink = np.median(im[arm_old.__invert__() & (lum < 45) & (np.abs(yy - 500) < 20) & (np.abs(xx - 340) < 6)][:, :3].astype(np.float32), 0)
init[fillet, :3] = skin * 0.92
SS = 4
big = np.zeros((H * SS, W * SS), np.uint8)
cv2.polylines(big, [np.round(b * SS + SS / 2).astype(np.int32)], False, 255, SS, cv2.LINE_AA)
a = cv2.resize(big, (W, H), interpolation=cv2.INTER_AREA).astype(np.float32)[..., None] / 255
init[..., :3] = init[..., :3] * (1 - a) + ink * a
# fragments: pre-fill with Telea from the surrounding robe so the sampler starts from cloth
rgb = np.clip(init[..., :3], 0, 255).astype(np.uint8)
rgb = cv2.inpaint(rgb, (cv2.dilate((keep | speck).astype(np.uint8), np.ones((3, 3), np.uint8)) * 255), 4, cv2.INPAINT_TELEA)
fm = cv2.dilate((keep | speck).astype(np.uint8), np.ones((3, 3), np.uint8)) > 0
init[fm, :3] = rgb[fm]
init[mask, 3] = 255
cv2.imwrite(OUT + '.init.png', np.clip(init, 0, 255).astype(np.uint8))
print('hookPx', int(hook.sum()), 'frag comps', int(nl - 1), 'fragPx', int(keep.sum()), 'speckPx', int(speck.sum()), 'filletPx', int(fillet.sum()),
      'maskPx', int(mask.sum()), 'shaftPx', int(shaft.sum()), 'skin', skin, 'ink', ink)
