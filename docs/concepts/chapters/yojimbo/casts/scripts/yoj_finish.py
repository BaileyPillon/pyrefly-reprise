"""Yojimbo cast (FFX only), last step: re-paste the moved idle parts, clean the empty hip, gate.

1. The hilt and tsuba are the idle's own pixels, moved: their interior is re-pasted from the moved
   layer wherever the fist does not cover them, so the repaint owns only their seam.
2. The hip where the katana used to hang: the tsuba's last gold sliver and the black shadow it cast
   are erased back to the sash edge (pixel erase only, nothing painted), leaving a thin dark
   scabbard mouth that runs behind the sash to the other sword's collar.
Writes <out>.png (730x1093, same canvas and feet as the idle) and prints the gates.
   python yoj_finish.py <stage.png> <out.png>
"""
import sys, json
import numpy as np, cv2
from ylib import *

S = f'{SCR}/yoj'
st = load(sys.argv[1]).astype(np.float32); out = sys.argv[2]
idle = load(IDLE['yojimbo-cavern'])
hilt = load(f'{S}/layer-hilt.png').astype(np.float32)
A = cv2.imread(f'{S}/mask-A.png', 0); B = cv2.imread(f'{S}/mask-B.png', 0); E = cv2.imread(f'{S}/mask-erase.png', 0)

# 1. re-paste the hilt/tsuba interior (idle pixels) outside the fist zone
core = cv2.erode((hilt[:, :, 3] > 200).astype(np.uint8), np.ones((5, 5), np.uint8)) > 0
fist = cv2.dilate(A, np.ones((5, 5), np.uint8)) > 0
# the fist zone is where pass A painted the glove; keep the model's glove there
rp = core & ~fist
st[rp, :3] = hilt[rp, :3]; st[rp, 3] = 255

# 1b. the repaint put a red rim on the tsuba the idle's tsuba does not have: take the collage's pixels back there
geo = json.load(open(f'{S}/collage.json'))
coll = load(f'{S}/collage.png').astype(np.float32)
H0, W0 = st.shape[:2]
yy0, xx0 = np.mgrid[0:H0, 0:W0]
T = np.float32(geo['tsuba']); up = (np.float32(geo['tip']) - T); up /= np.linalg.norm(up)
near_t = (xx0 - T[0]) ** 2 + (yy0 - T[1]) ** 2 < 34 ** 2
red = (st[:, :, 0] > 90) & (st[:, :, 0] > 1.6 * st[:, :, 1]) & (st[:, :, 0] > 1.4 * st[:, :, 2])
hc = load(f'{S}/layer-hilt-clean.png').astype(np.float32)
fixr = near_t & red & (hc[:, :, 3] > 127)
st[fixr, :3] = hc[fixr, :3]
st[near_t & red & (hc[:, :, 3] <= 127)] = 0

# 2. the empty hip
H, W = st.shape[:2]
yy, xx = np.mgrid[0:H, 0:W]
band = (yy >= 433) & (yy <= 502) & (xx >= 225) & (xx <= 268)
r, g, b = st[:, :, 0], st[:, :, 1], st[:, :, 2]
gold = ((r > 120) & (g > 85) & (b < 150) & (r - b > 45)) & (xx < 264)
line_x = np.where(yy <= 486, 259 - (yy - 440) * 0.045, 257 - (yy - 486) * (7 / 16))
speck = (yy >= 437) & (yy <= 470) & (xx < 262) & (st[:, :, :3].max(2) > 80)
hip_erase = band & (gold | speck | (xx < line_x)) & ~((yy > 480) & (xx > 262))
st[hip_erase] = 0
st[:, :, 3] = np.where(st[:, :, 3] >= 128, 255, 0); st[st[:, :, 3] == 0] = 0

# 3. peel the white-ground fringe the repaint left on the new silhouette (not on the blade's bright edge)
along = (xx0 - T[0]) * up[0] + (yy0 - T[1]) * up[1]
peel_zone = (cv2.dilate(np.maximum(A, B), np.ones((5, 5), np.uint8)) > 0) & (along < 10) & (idle[:, :, 3] == 0)
for _ in range(3):
    opaque = st[:, :, 3] > 0
    border = opaque & (cv2.dilate((~opaque).astype(np.uint8), np.ones((3, 3), np.uint8)) > 0)
    mx = st[:, :, :3].max(2); mn = st[:, :, :3].min(2)
    pale = (mn > 150) & (mx - mn < 60)
    kill = border & pale & peel_zone
    st[kill] = 0
res = st.astype(np.uint8)
save(res, out)

# gates
changed = cv2.dilate(np.maximum.reduce([A, B, E, (hip_erase * 255).astype(np.uint8)]), np.ones((3, 3), np.uint8))
mad, n = mad_outside(res, idle, changed)
diff = (np.abs(res.astype(int) - idle.astype(int)).sum(2) > 0)
region = (changed > 0)
inv, npx = invented_share(idle, res, region & (res[:, :, 3] > 0))
paint = region & diff & (res[:, :, 3] > 0)
print(json.dumps(dict(out=out, madOutsideMasks=mad, pixelsChangedOutsideMasks=n, pixelsChanged=int(diff.sum()),
                      opaqueChangedShare=round(float(paint.sum()) / float((res[:, :, 3] > 0).sum()), 4),
                      inventedColourShareInMasks=round(inv, 4), maskOpaquePixels=npx, size=[W, H]), indent=1))
