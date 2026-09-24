"""Put one repaint output back into the full-size canvas, inside its mask only.

   python merge.py <base.png> <job> <pick.png> <mask.png>[,<mask2>] <out.png> [alpha-mode]

alpha-mode: 'keep' = the base's alpha (the shape was drawn in the collage);
            'paint' = inside the mask, opaque wherever the repaint is not the white ground (holes filled),
            OR-ed with the base's alpha. Outside the (hard) mask every pixel is the base's (MAD 0).
"""
import sys, json, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np, cv2
from nlib import *

base = load(sys.argv[1]).astype(np.float32); job = sys.argv[2]; pick = sys.argv[3]
m = np.max(np.stack([cv2.imread(p, 0) for p in sys.argv[4].split(',')]), 0)
out = sys.argv[5]; mode = sys.argv[6] if len(sys.argv) > 6 else 'paint'
box = json.load(open(f'{job}.box.json'))['box']; x0, y0, x1, y1 = box
rep = np.array(Image.open(pick).convert('RGB')).astype(np.float32)
small = cv2.resize(rep, (x1 - x0, y1 - y0), interpolation=cv2.INTER_AREA)
hard = np.zeros(m.shape, np.float32); hard[y0:y1, x0:x1] = (m[y0:y1, x0:x1] > 127)
res = base.copy()
sub = res[y0:y1, x0:x1]; hm = hard[y0:y1, x0:x1] > 0
white = np.sqrt(((small - 255) ** 2).sum(2)) < 38
if mode == 'paint':
    solid = ~white
    solid = cv2.morphologyEx(solid.astype(np.uint8) * 255, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    ff = np.pad(solid, 1); msk = np.zeros((ff.shape[0] + 2, ff.shape[1] + 2), np.uint8)
    cv2.floodFill(ff, msk, (0, 0), 128); solid = (ff[1:-1, 1:-1] != 128)
    al = np.where(hm, np.maximum(solid * 255.0, sub[:, :, 3]), sub[:, :, 3])
elif mode == 'reshape':
    # the repaint owns the silhouette inside the mask; the base shape eroded 2 px keeps bright edges
    solid = cv2.morphologyEx((~white).astype(np.uint8) * 255, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8)) > 0
    core = cv2.erode((sub[:, :, 3] > 127).astype(np.uint8), np.ones((5, 5), np.uint8)) > 0
    al = np.where(hm, (solid | core) * 255.0, sub[:, :, 3])
else:
    al = sub[:, :, 3]
sub[hm, :3] = small[hm]
sub[:, :, 3] = al
res[y0:y1, x0:x1] = sub
res[res[:, :, 3] < 128] = 0
res[:, :, 3] = np.where(res[:, :, 3] >= 128, 255, 0)
save(res, out)
print('merged', out)
