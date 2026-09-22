#!/usr/bin/env python
"""Join-report helper for tools/gen/video-flf.mjs.

Computes numpy mean-absolute-difference (MAD, 0-255 per-channel-average)
between the staged plate and a clip's first and last rendered frames, both
full-frame and over a fixed face box, and writes the numbers to JSON.

Usage:
  python join_report.py <plate.png> <frame1.png> <frameN.png> <out.json> [faceBoxJson]

faceBoxJson (optional): {"x":0.30,"y":0.15,"w":0.40,"h":0.33} as fractions of
the frame -- both eyes plus brow, independent of resolution. Defaults to that
box if not given.
"""
import json
import sys

import numpy as np
from PIL import Image

DEFAULT_FACE_BOX = {"x": 0.30, "y": 0.15, "w": 0.40, "h": 0.33}


def load(path):
    return np.asarray(Image.open(path).convert("RGB"), dtype=np.float64)


def mad(a, b):
    return float(np.mean(np.abs(a - b)))


def face_crop(arr, box):
    h, w = arr.shape[0], arr.shape[1]
    x0 = int(box["x"] * w)
    y0 = int(box["y"] * h)
    x1 = x0 + int(box["w"] * w)
    y1 = y0 + int(box["h"] * h)
    return arr[y0:y1, x0:x1]


def main():
    plate_path, frame1_path, frameN_path, out_path = sys.argv[1:5]
    face_box = json.loads(sys.argv[5]) if len(sys.argv) > 5 else DEFAULT_FACE_BOX

    plate = load(plate_path)
    frame1 = load(frame1_path)
    frameN = load(frameN_path)

    # Frames may come out at a slightly different size than the staged plate
    # if a fallback resolution was used mid-run; guard rather than crash.
    if frame1.shape != plate.shape:
        frame1 = np.asarray(
            Image.open(frame1_path).convert("RGB").resize((plate.shape[1], plate.shape[0])),
            dtype=np.float64,
        )
    if frameN.shape != plate.shape:
        frameN = np.asarray(
            Image.open(frameN_path).convert("RGB").resize((plate.shape[1], plate.shape[0])),
            dtype=np.float64,
        )

    plate_face = face_crop(plate, face_box)
    frame1_face = face_crop(frame1, face_box)
    frameN_face = face_crop(frameN, face_box)

    result = {
        "platePath": plate_path,
        "frame1Path": frame1_path,
        "frameNPath": frameN_path,
        "faceBox": face_box,
        "frame1": {
            "fullMAD": mad(frame1, plate),
            "faceMAD": mad(frame1_face, plate_face),
        },
        "frameN": {
            "fullMAD": mad(frameN, plate),
            "faceMAD": mad(frameN_face, plate_face),
        },
    }
    with open(out_path, "w") as f:
        json.dump(result, f, indent=2)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
