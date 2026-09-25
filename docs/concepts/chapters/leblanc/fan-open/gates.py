"""PR-0096 gates (FFX-2 only): the candidate differs from the installed idle only inside the new fan
(plus the cut-out matte it replaces), keeps the canvas, and clears the cut-out margin.

  python gates.py <candidate.png> <fan-mask.png> [<fringe.png>] > gates.json
"""
import hashlib
import json
import pathlib
import sys

import numpy as np
from PIL import Image

REPO = pathlib.Path(__file__).resolve().parents[5]
IDLE = REPO / "public/art/characters/leblanc/idle.png"


def sha(p):
    return hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()


cand_p, fan_p = sys.argv[1], sys.argv[2]
idle = np.asarray(Image.open(IDLE).convert("RGBA")).astype(int)
cand = np.asarray(Image.open(cand_p).convert("RGBA")).astype(int)
fan = np.asarray(Image.open(fan_p).convert("L")) > 127
if len(sys.argv) > 3:
    fan |= np.asarray(Image.open(sys.argv[3]).convert("L")) > 127
H, W = idle.shape[:2]
diff = np.abs(cand - idle).max(-1)
changed = diff > 0
outside = ~fan
ys, xs = np.where(changed)
margin = int(min(xs.min(), ys.min(), W - 1 - xs.max(), H - 1 - ys.max())) if len(xs) else None
alpha_new = (cand[..., 3] > 0) & (idle[..., 3] == 0)
res = {
    "candidate": str(cand_p), "candidateSha256": sha(cand_p),
    "installedIdle": str(IDLE.relative_to(REPO)).replace("\\", "/"), "installedIdleSha256": sha(IDLE),
    "sameCanvas": cand.shape == idle.shape, "canvas": [W, H],
    "changedPx": int(changed.sum()), "changedOutsideFanPx": int((changed & outside).sum()),
    "madOutsideFan": float(np.abs(cand - idle)[outside].mean()),
    "newlyOpaquePx": int(alpha_new.sum()),
    "changedBBox": [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())] if len(xs) else None,
    "changedMarginToCanvasPx": margin, "marginAtLeast16": margin is not None and margin >= 16,
}
res["pass"] = res["sameCanvas"] and res["changedOutsideFanPx"] == 0 and res["marginAtLeast16"]
print(json.dumps(res, indent=1))
