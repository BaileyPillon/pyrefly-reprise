"""Cut a crop of a collage + mask, upscale to a 1024 short side on white, write <job>.init/.mask.png.

   python prep.py <collage.png> <mask.png>[,<mask2.png>] <x0> <y0> <x1> <y1> <job> [feather]
   python prep.py refs <x0> <y0> <x1> <y1> <outdir>   (idle square-padded + detail crop)
"""
import sys, json, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np, cv2
from nlib import *

if sys.argv[1] == 'refs':
    x0, y0, x1, y1 = map(int, sys.argv[2:6]); out = sys.argv[6]
    idle = load(IDLE); H, W = idle.shape[:2]; s = max(H, W)
    sq = np.full((s, s, 3), 255, np.uint8); sq[(s - H) // 2:(s - H) // 2 + H, (s - W) // 2:(s - W) // 2 + W] = on_bg(idle)
    save(sq, f'{out}/ref-idle-square.png'); save(on_bg(idle)[y0:y1, x0:x1], f'{out}/ref-idle-detail.png')
    print('refs ok'); sys.exit(0)

coll = load(sys.argv[1]); masks = [cv2.imread(p, 0) for p in sys.argv[2].split(',')]
m = np.max(np.stack(masks), 0)
x0, y0, x1, y1 = map(int, sys.argv[3:7]); job = sys.argv[7]; fe = float(sys.argv[8]) if len(sys.argv) > 8 else 3
s = 1024 / min(x1 - x0, y1 - y0)
w, h = round((x1 - x0) * s / 8) * 8, round((y1 - y0) * s / 8) * 8
rgb = on_bg(coll[y0:y1, x0:x1], (255, 255, 255))
init = cv2.resize(rgb, (w, h), interpolation=cv2.INTER_LANCZOS4)
mk = cv2.resize(m[y0:y1, x0:x1], (w, h), interpolation=cv2.INTER_LINEAR)
if fe > 0: mk = cv2.GaussianBlur(mk, (0, 0), fe)
save(init, f'{job}.init.png'); cv2.imwrite(f'{job}.mask.png', cv2.merge([mk, mk, mk]))
json.dump(dict(box=[x0, y0, x1, y1], size=[w, h]), open(f'{job}.box.json', 'w'))
print(w, h)
