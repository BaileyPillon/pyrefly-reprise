#!/usr/bin/env python
"""Per-frame tone series for the round-4 end-anchor A/B (method-check.md SS3).

Computes, for every frame in a clip directory, the two series ab.md compares
side by side between arm A and arm B: per-frame saturation and per-frame
body-box MAD against frame 1 (the pinned, no-motion box every prior judge
pass in this track has used -- judge-clip.md's own `body` box, 560,400 to
900,690 at the tool's 1280x704 reference resolution, scaled proportionally
for any other render size). Also reports each frame's face/mouth MAD against
the plate, and the VAE floor for the same boxes when a floor image is given,
so the two arms' numbers sit next to the floor the same way every previous
round's join report did.

This does not colour-match or build any video; it exists only to answer
"which arm's tone is calmer, and where does it move" side by side. The
colour-match + ping-pong step itself is tools/gen/video-post.mjs (whichever
arm turns out usable gets that applied separately).

Usage:
  python tone-series.py <clipDir> <plate.png> <outJson> [--vae-floor <floor.png>]
"""
import argparse
import glob
import json
import os

import numpy as np
from PIL import Image

REFERENCE_W, REFERENCE_H = 1280, 704
BOXES = {
    "face": (420, 20, 760, 400),
    "mouth": (548, 252, 642, 308),
    "body": (560, 400, 900, 690),
    "bgLeft": (0, 120, 330, 560),
    "bgRight": (950, 0, 1280, 500),
    "full": (0, 0, 1280, 704),
}


def load(path, size=None):
    im = Image.open(path).convert("RGB")
    if size is not None and im.size != size:
        im = im.resize(size)
    return np.asarray(im, dtype=np.float64)


def scaled_boxes(w, h):
    sx, sy = w / REFERENCE_W, h / REFERENCE_H
    return {name: (int(x0 * sx), int(y0 * sy), int(x1 * sx), int(y1 * sy)) for name, (x0, y0, x1, y1) in BOXES.items()}


def crop(arr, box):
    x0, y0, x1, y1 = box
    return arr[y0:y1, x0:x1]


def mad(a, b):
    return float(np.mean(np.abs(a - b)))


def saturation(a):
    mx = a.max(-1)
    mn = a.min(-1)
    return float(((mx - mn) / (mx + 1e-6)).mean())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("clip_dir")
    ap.add_argument("plate")
    ap.add_argument("out")
    ap.add_argument("--vae-floor", default="")
    args = ap.parse_args()

    names = sorted(f for f in os.listdir(args.clip_dir) if f.startswith("frame_") and f.endswith(".png"))
    if not names:
        raise SystemExit(f"No frame_NNNNN.png in {args.clip_dir}")

    plate = load(args.plate)
    h, w = plate.shape[0], plate.shape[1]
    size = (w, h)
    boxes = scaled_boxes(w, h)
    frames = [load(os.path.join(args.clip_dir, n), size) for n in names]
    f1 = frames[0]

    floor_mad = {}
    if args.vae_floor and os.path.exists(args.vae_floor):
        floor = load(args.vae_floor, size)
        floor_mad = {name: mad(crop(floor, box), crop(plate, box)) for name, box in boxes.items()}

    result = {
        "clipDir": args.clip_dir,
        "plate": args.plate,
        "frameCount": len(frames),
        "floorMad": floor_mad,
        "saturation": [saturation(f) for f in frames],
        "bodyMadVsFrame1": [mad(crop(f, boxes["body"]), crop(f1, boxes["body"])) for f in frames],
        "faceMadVsPlate": [mad(crop(f, boxes["face"]), crop(plate, boxes["face"])) for f in frames],
        "mouthMadVsPlate": [mad(crop(f, boxes["mouth"]), crop(plate, boxes["mouth"])) for f in frames],
        "faceStep": [mad(crop(frames[i], boxes["face"]), crop(frames[i - 1], boxes["face"])) for i in range(1, len(frames))],
    }
    with open(args.out, "w") as fh:
        json.dump(result, fh, indent=2)
    print(json.dumps({"frameCount": len(frames), "out": args.out}))


if __name__ == "__main__":
    main()
