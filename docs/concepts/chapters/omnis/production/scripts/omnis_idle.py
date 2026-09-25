"""Seymour Omnis idle (FFX only): the picked O-1 A render (seed 912102), its own pixels, repaired only where it must change.
The options cut-out (quarantined by the pipeline guard) left two defects: a white background pocket enclosed between the
raised left arm, the hair and the shoulder strip (it bloomed in the engine), and breaks in the pale light-blue strips where
the matte ate near-white paint. Here the alpha is rebuilt from the raw render against its own flat white ground:
background = white connected to the border OR an enclosed white pocket of 40 px or more; the RGB is the raw render exactly.
Binary alpha kept (house convention); a near-white fringe is peeled from the edge."""
import json, numpy as np
from PIL import Image
from scipy import ndimage as ndi
R = 'D:/Tools/pyrefly-scratch/omnis-options/renders/'
OUT = 'D:/Tools/pyrefly-scratch/ch1215/omnis/work/omnis-idle.png'
raw = np.array(Image.open(R + 'omnis-a.raw.png').convert('RGB')).astype(np.int32)
old = np.array(Image.open(R + 'omnis-a.png'))[..., 3] > 0          # rows 1..1215 of raw
H, W = raw.shape[:2]
mn, mx = raw.min(2), raw.max(2)
white = (mn >= 238) & ((mx - mn) <= 14)
lab, n = ndi.label(white, structure=np.ones((3, 3)))
border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
sizes = ndi.sum(white, lab, range(1, n + 1))
bgids = [i for i in border] + [i + 1 for i, s in enumerate(sizes) if s >= 40]
bg = np.isin(lab, bgids)
bg = ndi.binary_dilation(bg, iterations=1) & (mn >= 200) & ((mx - mn) <= 40) | bg   # soak the anti-aliased white edge
a = ~bg
peeled = 0
for it in range(3):
    edge = a & ~ndi.binary_erosion(a, structure=np.ones((3, 3)), border_value=0)
    kill = edge & (mn >= 215) & ((mx - mn) <= 30)
    k = int(kill.sum()); peeled += k
    if not k: break
    a &= ~kill
# specks under 30 px, and holes inside the figure that are not white (keep painted interior)
lab2, n2 = ndi.label(a, structure=np.ones((3, 3)))
s2 = ndi.sum(a, lab2, range(1, n2 + 1))
small = np.isin(lab2, [i + 1 for i, s in enumerate(s2) if s < 30]); a &= ~small
comp = int((np.array(s2) >= 30).sum())
oldfull = np.zeros_like(a); oldfull[1:] = old
gained = int((a & ~oldfull).sum()); lost = int((~a & oldfull).sum())
out = np.zeros((H, W, 4), np.uint8); out[..., :3] = raw; out[..., 3] = np.where(a, 255, 0); out[~a, :3] = 0
ys, xs = np.nonzero(a); t, b, l, r = ys.min(), ys.max(), xs.min(), xs.max()
m = 16
c = Image.new('RGBA', (r - l + 1 + 2 * m, b - t + 1 + 2 * m), (0, 0, 0, 0))
c.paste(Image.fromarray(out).crop((l, t, r + 1, b + 1)), (m, m))
c.save(OUT)
print(json.dumps({'peeled': peeled, 'specks': int(small.sum()), 'components': comp, 'gainedVsOptionsCut': gained, 'lostVsOptionsCut': lost,
                  'size': c.size, 'srcOffset': [int(l - m), int(t - m)], 'baselineY': int(b - t + m), 'bbox': [int(l), int(t), int(r), int(b)]}))
