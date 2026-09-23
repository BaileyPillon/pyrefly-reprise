#!/usr/bin/env python
"""Hard cut of an arm's colour-matched ping-pong onto itself, measured on the ENCODED file.

The ping-pong build is concatenated three times with `ffmpeg -f concat -c copy` (no
re-encode, two cuts), decoded with `-fps_mode passthrough`, and every frame-to-frame step
is measured in the head boxes. Reports the step at each cut against the decoded clip's
own median step and against the VAE floor, plus the decoded frame 1 vs the plate.

Usage: python judge-cutstats.py <decodedDir> <framesPerLoop> <plate> <floor> <out.json>
"""
import sys, glob, json, os
import numpy as np
from PIL import Image

BOXES = {"face": (420, 20, 760, 400), "eyes": (460, 140, 635, 285), "mouth": (548, 252, 642, 308),
         "braid": (468, 278, 542, 402), "hairline": (436, 18, 724, 122), "body": (560, 400, 900, 690),
         "full": (0, 0, 1280, 704)}


def load(p):
    return np.asarray(Image.open(p).convert("RGB"), dtype=np.float32)


def mad(a, b, box):
    x0, y0, x1, y1 = box
    return float(np.mean(np.abs(a[y0:y1, x0:x1] - b[y0:y1, x0:x1])))


def main():
    d, n, plate_p, floor_p, out = sys.argv[1:6]
    n = int(n)
    files = sorted(glob.glob(os.path.join(d, "f_*.png")))
    plate = load(plate_p); floor = load(floor_p)
    fl = {b: mad(floor, plate, BOXES[b]) for b in BOXES}
    prev = None; steps = {b: [] for b in BOXES}
    first = None
    for i, f in enumerate(files):
        cur = load(f)
        if i == 0:
            first = cur
        if prev is not None:
            for b in BOXES:
                steps[b].append(mad(cur, prev, BOXES[b]))
        prev = cur
    res = {"frames": len(files), "perLoop": n, "floor": fl, "cuts": {}, "median": {}, "max": {}}
    for b in BOXES:
        s = np.array(steps[b]); res["median"][b] = float(np.median(s)); res["max"][b] = float(s.max())
    for k in range(1, len(files) // n):
        idx = k * n - 1  # step from frame k*n (last of loop k) to frame k*n+1 (first of loop k+1)
        res["cuts"][f"cut{k}"] = {b: {"mad": round(steps[b][idx], 3),
                                      "xMedian": round(steps[b][idx] / res["median"][b], 2),
                                      "xFloor": round(steps[b][idx] / fl[b], 3)} for b in BOXES}
    res["decodedF1VsPlate"] = {b: {"mad": round(mad(first, plate, BOXES[b]), 3),
                                   "xFloor": round(mad(first, plate, BOXES[b]) / fl[b], 3)} for b in BOXES}
    json.dump(res, open(out, "w"), indent=1)
    print(json.dumps({"cuts": res["cuts"], "median": res["median"], "max": res["max"],
                      "decodedF1VsPlate": res["decodedF1VsPlate"]}, indent=0)[:3000])


if __name__ == "__main__":
    main()
