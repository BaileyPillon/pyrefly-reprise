#!/usr/bin/env python
"""Join-report helper for tools/gen/video-flf.mjs.

Round 3 rewrite (docs/concepts/pause-until-dawn/video-flf/judge.md SS2): the
round-2 judge rejected this script's default face box (fractional 30-70% x
15-48%, i.e. x384-896 at 1280x704) as "too wide -- about a third of that box
is pinned background, trivially easy to reproduce, which drags the reported
face MAD down and would flatter a drifting face". It also flagged that a
plain mean (MAD) "cannot catch a recoloured iris covering 0.2% of the frame".

This version:
  - uses the judge's own head-only boxes (pixel-absolute, measured at
    1280x704, the tool's native render resolution; scaled proportionally if a
    frame comes out at a different size -- e.g. the fallback 1024x576),
  - reports, per box: MAD, max-absolute-difference, and the 99.9th
    percentile of per-pixel abs-diff (catches a small saturated region a
    mean would wash out),
  - reports the SAME three numbers for the measured VAE noise floor (plate
    round-tripped through a bare VAEEncode/VAEDecode, no sampling) next to
    every frame1/frameN number, so "identical within noise" has an actual
    number to be judged against instead of being asserted.

Usage:
  python join_report.py <plate.png> <frame1.png> <frameN.png> <out.json> \\
      [--face-box '{"x0":..,"y0":..,"x1":..,"y1":..}'] [--vae-floor <floor.png>]

--face-box, if given and non-empty, REPLACES only the "face" box below (kept
for callers that pin their own face box); the rest of BOXES is unaffected.
"""
import argparse
import json

import numpy as np
from PIL import Image

# Absolute pixel boxes at the reference resolution this tool renders at
# (1280x704). Pinned by the round-2 judge by numerically locating the
# saturated irises on the plate, then verified visually (judge.md SS2).
REFERENCE_W, REFERENCE_H = 1280, 704
BOXES = {
    "face": (420, 20, 760, 400),
    "eyes": (460, 140, 635, 285),
    "greenEye": (468, 203, 546, 278),
    "blueEye": (548, 145, 626, 220),
    "mouth": (548, 252, 642, 308),
    "braid": (468, 278, 542, 402),
    "hairline": (436, 18, 724, 122),
}


def load(path, size=None):
    im = Image.open(path).convert("RGB")
    if size is not None and im.size != size:
        im = im.resize(size)
    return np.asarray(im, dtype=np.float64)


def scaled_boxes(w, h):
    sx, sy = w / REFERENCE_W, h / REFERENCE_H
    out = {}
    for name, (x0, y0, x1, y1) in BOXES.items():
        out[name] = (int(x0 * sx), int(y0 * sy), int(x1 * sx), int(y1 * sy))
    return out


def crop(arr, box):
    x0, y0, x1, y1 = box
    return arr[y0:y1, x0:x1]


def stats(a, b):
    """Per-pixel mean-abs-diff across channels, then MAD / max / p99.9 over pixels."""
    diff = np.mean(np.abs(a - b), axis=-1)  # one scalar per pixel
    return {
        "mad": float(np.mean(diff)),
        "maxAbs": float(np.max(diff)),
        "p999": float(np.percentile(diff, 99.9)),
    }


def all_box_stats(a, b, boxes):
    return {name: stats(crop(a, box), crop(b, box)) for name, box in boxes.items()}


def ratios(observed, floor):
    out = {}
    for name, o in observed.items():
        f = floor.get(name, {})
        out[name] = {
            k: (round(o[k] / f[k], 2) if f.get(k) not in (None, 0) else None)
            for k in o
        }
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("plate")
    ap.add_argument("frame1")
    ap.add_argument("frameN")
    ap.add_argument("out")
    ap.add_argument("--face-box", default="", help="JSON {x0,y0,x1,y1} overriding BOXES['face']")
    ap.add_argument("--vae-floor", default="", help="Path to a bare VAEEncode/VAEDecode round-trip of the plate")
    args = ap.parse_args()

    plate = load(args.plate)
    h, w = plate.shape[0], plate.shape[1]
    size = (w, h)
    frame1 = load(args.frame1, size)
    frameN = load(args.frameN, size)

    boxes = scaled_boxes(w, h)
    if args.face_box:
        fb = json.loads(args.face_box)
        boxes["face"] = (fb["x0"], fb["y0"], fb["x1"], fb["y1"])

    result = {
        "platePath": args.plate,
        "frame1Path": args.frame1,
        "frameNPath": args.frameN,
        "boxes": boxes,
        "frame1": all_box_stats(frame1, plate, boxes),
        "frameN": all_box_stats(frameN, plate, boxes),
    }

    if args.vae_floor:
        floor_img = load(args.vae_floor, size)
        floor = all_box_stats(floor_img, plate, boxes)
        result["floor"] = floor
        result["floorPath"] = args.vae_floor
        result["frame1XFloor"] = ratios(result["frame1"], floor)
        result["frameNXFloor"] = ratios(result["frameN"], floor)

    with open(args.out, "w") as f:
        json.dump(result, f, indent=2)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
