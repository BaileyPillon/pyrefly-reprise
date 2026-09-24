"""1:1 crops around a key's largest repainted regions: warp only | each candidate (pilot look aid)."""
import importlib.util, json, sys, pathlib
import cv2, numpy as np
from PIL import Image
spec = importlib.util.spec_from_file_location("rc", pathlib.Path(__file__).with_name("rig-chain.py")); rc = importlib.util.module_from_spec(spec); spec.loader.exec_module(rc)
work, key, sg = sys.argv[1], sys.argv[2], sys.argv[3]; cands = sys.argv[4:]
sigma = float(sg.rstrip("m")); rc.GUIDE["magOnly"] = sg.endswith("m")
rc.WORK = pathlib.Path(work); rc.GUIDE["sigma"] = sigma
rig = json.loads(rc.RIG.read_text(encoding="utf-8"))
d = rc.keydir(key); g = rc.grown_mask(d).astype(np.uint8)
n, lab, st, _ = cv2.connectedComponentsWithStats(g)
order = np.argsort(-st[1:, cv2.CC_STAT_AREA])[:3] + 1
side, deg = key[3], int(key[4:])
imgs = []
for c in [None] + cands:
    hb, fr = rc.merged(rig, key, c)
    imgs.append(rc.white(rc.composite(rig, hb, fr, rc.tassel_dx(side, deg))))
rows = []
for i in order:
    x, y, w, h = st[i, :4]; cx, cy = x + w // 2, y + h // 2
    x0, y0 = int(np.clip(cx - 90, 0, rc.W - 180)), int(np.clip(cy - 90, 0, rc.H - 180))
    rows.append(np.hstack([im[y0:y0 + 180, x0:x0 + 180] for im in imgs]))
out = d / ("holecrops-mag.png" if rc.GUIDE["magOnly"] else "holecrops.png")
Image.fromarray(np.clip(np.vstack(rows), 0, 255).astype(np.uint8)).save(out)
print(out, [int(st[i, 4]) for i in order])
