"""Living portrait v5 pilot (game case: both): the identity gate as the method review corrected it (commit 55050554).

Gate against the ORIGINAL PLATE, not the v4 keys: each propagated key vs the plate warped through the same flow in ONE
step (no intermediate key, no repaint). Measured in the key's own face box (from its landmarks) and 1:1 crops:
  faceMAD     mean |key - plate warped| over the face box (0 = the key is the plate turned, texel for texel)
  iris        mean colour in a 14 px disc at each pupil: her right (screen-left) must stay green, her left blue
  tips        pink/orange hair-tip pixels in the head, as a fraction of the plate-warped count
The tassel is the plate's own layer at every yaw (drawn apart), so it is present by construction; the crops show it.

    python identity.py <work> <sigma> <key> [<key> ...]   -> <work>/identity.json, <work>/identity-<key>.png
"""
import importlib.util
import json
import pathlib
import sys

import cv2
import numpy as np
from PIL import Image

spec = importlib.util.spec_from_file_location("rc", pathlib.Path(__file__).with_name("rig-chain.py"))
rc = importlib.util.module_from_spec(spec)
spec.loader.exec_module(rc)


def hue_class(rgb):
    hsv = cv2.cvtColor(np.ascontiguousarray(np.clip(rgb, 0, 255).astype(np.uint8)), cv2.COLOR_RGB2HSV).astype(np.float32)
    return hsv


def main():
    work, sigma, keys = pathlib.Path(sys.argv[1]), float(sys.argv[2]), sys.argv[3:]
    rc.WORK = work
    rc.GUIDE["sigma"] = sigma
    rig = json.loads(rc.RIG.read_text(encoding="utf-8"))
    order = rig["artMeta"]["commonLandmarkOrder"]
    fr_key = next(k for k in rig["keys"] if k["id"] == "frontal")
    out = {}
    for k in keys:
        side, deg = k[3], int(k[4:])
        _, _, g_plate, gs = rc.CHAINS[side]
        g = gs[deg]
        iris = (1 if side == "r" else -1) * rc.IRIS_TRAVEL_X * 10 / 85.0
        phb, pfr = rc.plate_layers(rig, iris)
        bmap, _, _ = rc.step_map(side, g_plate, g)
        ref = rc.composite(rig, rc.remap(phb, bmap[..., :2]), rc.remap(pfr, bmap[..., :2]), rc.tassel_dx(side, deg))
        d = rc.keydir(k)
        key = rc.composite(rig, rc.rgba(d / "hairback.png"), rc.rgba(d / "front.png"), rc.tassel_dx(side, deg))
        lm = np.array(rc.points_map(side, g_plate, g, fr_key["landmarks"]))
        x0, y0 = int(lm[:18, 0].min() - 30), int(lm[:18, 1].min() - 60)
        x1, y1 = int(lm[:18, 0].max() + 30), int(lm[:18, 1].max() + 20)
        a, b = rc.white(key), rc.white(ref)
        face = np.abs(a[y0:y1, x0:x1] - b[y0:y1, x0:x1]).mean()
        res = {"faceBox": [x0, y0, x1 - x0, y1 - y0], "faceMAD": round(float(face), 3)}
        for name in ("pupil_R", "pupil_L"):
            px, py = lm[order.index(name)]
            m = np.zeros((rc.H, rc.W), np.uint8)
            cv2.circle(m, (int(px), int(py)), 14, 1, -1)
            ck, cr = a[m > 0].mean(0), b[m > 0].mean(0)
            res[name] = {"key": [round(float(v)) for v in ck], "plateWarped": [round(float(v)) for v in cr],
                         "reads": "green" if ck[1] > ck[2] else "blue"}
        head = (key[..., 3] > 127)
        hk, hr = hue_class(a), hue_class(b)
        tip = lambda h: head & (h[..., 1] > 90) & (h[..., 2] > 120) & ((h[..., 0] > 150) | (h[..., 0] < 12))
        res["tipsRatio"] = round(float(tip(hk).sum()) / max(1, float(tip(hr).sum())), 3)
        out[k] = res
        tiles = [np.hstack([b[y0:y1, x0:x1], a[y0:y1, x0:x1], np.clip(np.abs(a - b)[y0:y1, x0:x1] * 4, 0, 255)])]
        Image.fromarray(np.clip(tiles[0], 0, 255).astype(np.uint8)).save(work / f"identity-{k}.png")
        print(k, json.dumps(res))
    (work / "identity.json").write_text(json.dumps(out, indent=1), encoding="utf-8")


if __name__ == "__main__":
    main()
