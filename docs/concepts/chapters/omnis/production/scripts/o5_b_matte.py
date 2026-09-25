"""O-5 B alternative (FFX only, 2026-09-25 repair pass): portrait_matte.py run on round-2 render b1 (seed 925211), with b1's own
face box and no row limit on the enclosed white pockets (its lower hair gaps are white ground). Then o5_b_fringe.py."""
import json, numpy as np
from PIL import Image
from scipy import ndimage as ndi
W0 = 'D:/Tools/pyrefly-scratch/ch1215/omnis/work/'
raw = np.array(Image.open(W0 + 'portrait.b1.png').convert('RGB')).astype(np.int32)
H, W = raw.shape[:2]
mn, mx = raw.min(2), raw.max(2)
white = (mn >= 236) & ((mx - mn) <= 16)
lab, n = ndi.label(white, structure=np.ones((3, 3)))
border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
sizes = ndi.sum(white, lab, range(1, n + 1))
face = np.zeros((H, W), bool); face[180:680, 160:620] = True  # b1's own face box (read off its render)
enclosed = [i + 1 for i, s in enumerate(sizes) if s >= 60 and (i + 1) not in border]
enc = np.isin(lab, enclosed) & ~face  # b1: no row limit (its lower hair gaps are white ground)
bg = np.isin(lab, list(border)) | enc
bg = bg | (ndi.binary_dilation(bg, iterations=1) & (mn >= 205) & ((mx - mn) <= 36))
a = ~bg
peeled = 0
for it in range(3):
    edge = a & ~ndi.binary_erosion(a, structure=np.ones((3, 3)), border_value=0)
    edge[0, :] = False; edge[-1, :] = False; edge[:, 0] = False; edge[:, -1] = False
    kill = edge & (mn >= 212) & ((mx - mn) <= 30)
    k = int(kill.sum()); peeled += k
    if not k: break
    a &= ~kill
lab2, n2 = ndi.label(a, structure=np.ones((3, 3)))
s2 = ndi.sum(a, lab2, range(1, n2 + 1))
small = np.isin(lab2, [i + 1 for i, s in enumerate(s2) if s < 40]); a &= ~small
out = np.zeros((H, W, 4), np.uint8); out[..., :3] = np.where(a[..., None], raw, 0); out[..., 3] = np.where(a, 255, 0)
Image.fromarray(out).save('D:/Tools/pyrefly-scratch/ch1215/omnis-repair/art/o5-b1.matte.png')
print(json.dumps({'peeled': peeled, 'enclosedPockets': int(enc.sum()), 'specks': int(small.sum()), 'components': int((np.array(s2) >= 40).sum()), 'opaque': round(float(a.mean()), 4)}))
