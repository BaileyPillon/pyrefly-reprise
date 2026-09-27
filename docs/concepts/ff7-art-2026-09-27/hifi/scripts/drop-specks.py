"""Hi-fi round: keep only the largest opaque component of a cut-out (drops floor dirt and specks the rembg cut
left near the feet). Prints what was dropped. Usage: python drop-specks.py <cut.png> <out.png>"""
import json, sys
import numpy as np
from PIL import Image
from scipy import ndimage
a = np.asarray(Image.open(sys.argv[1]).convert('RGBA')).copy()
op = a[..., 3] >= 8
lab, n = ndimage.label(op, structure=np.ones((3, 3)))
sz = ndimage.sum(op, lab, range(1, n + 1))
keep = int(np.argmax(sz)) + 1
drop = op & (lab != keep)
a[drop, 3] = 0
Image.fromarray(a).save(sys.argv[2])
print(json.dumps({'step': 'drop-specks', 'components': int(n), 'droppedPixels': int(drop.sum())}))
