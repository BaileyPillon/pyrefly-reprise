"""Garden of Pain plate (FFX only): paste the picked steps repaint back into the O-3 C plate inside its mask only.
Every pixel outside the mask box stays the picked plate's (MAD 0)."""
import sys, json, numpy as np
from PIL import Image
SRC = 'D:/Tools/pyrefly-scratch/omnis-options/renders/garden-C.png'
W0 = 'D:/Tools/pyrefly-scratch/ch1215/omnis/work/'
pick = sys.argv[1] if len(sys.argv) > 1 else 'r1'
BOX = (1140, 560, 2164, 1136)
plate = np.array(Image.open(SRC).convert('RGB')).astype(np.float32)
rep = np.array(Image.open(W0 + f'steps.{pick}.png').convert('RGB')).astype(np.float32)
m = np.array(Image.open(W0 + 'steps.mask.png').convert('L')).astype(np.float32)[..., None] / 255
x0, y0, x1, y1 = BOX
out = plate.copy()
out[y0:y1, x0:x1] = plate[y0:y1, x0:x1] * (1 - m) + rep * m
o = np.clip(out, 0, 255).round().astype(np.uint8)
Image.fromarray(o).save(W0 + 'garden-of-pain.png')
diff = np.abs(o.astype(int) - plate.astype(int)).max(2) > 0
ys, xs = np.nonzero(diff)
print(json.dumps({'pick': pick, 'changedPx': int(diff.sum()), 'changedShare': round(float(diff.mean()), 5), 'changedBox': [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())]}))
