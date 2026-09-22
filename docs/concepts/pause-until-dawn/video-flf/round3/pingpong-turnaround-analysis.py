#!/usr/bin/env python
"""Ping-pong turnaround analysis for idle-blinks and idle-breathing.

Stage A: eye-aperture series across idle-blinks (97 frames) to find where the
last blink ends, so we can pick a turnaround frame T that is safely in the
still tail.

Stage B: collar/chest box MAD-vs-frame1 series across idle-breathing (81
frames) to find the breathing peak (turnaround candidate) by maximum
deviation from the rest pose.
"""
import json
import numpy as np
from PIL import Image

BLINKS_DIR = "D:/Tools/pyrefly-video/flf/idle-blinks/1"
BREATH_DIR = "D:/Tools/pyrefly-video/flf/idle-breathing/1"
OUT_DIR = "C:/Users/ADMINI~1/AppData/Local/Temp/claude/D--Final-Fantasy/174911c6-80de-460f-ac03-e4631f17478b/scratchpad/pingpong"

# Judge's head-only boxes (join_report.py), reference 1280x704, no scaling needed here.
EYES_BOX = (460, 140, 635, 285)
GREEN_EYE_BOX = (468, 203, 546, 278)
BLUE_EYE_BOX = (548, 145, 626, 220)
COLLAR_BOX = (540, 360, 860, 620)  # pinned this pass: collar/pendant/chest, below the face box (420,20,760,400)


def load(path):
    return np.asarray(Image.open(path).convert("RGB"), dtype=np.float64)


def crop(arr, box):
    x0, y0, x1, y1 = box
    return arr[y0:y1, x0:x1]


def luminance_mean(arr, box):
    c = crop(arr, box)
    # standard luminance
    lum = 0.2126 * c[..., 0] + 0.7152 * c[..., 1] + 0.0722 * c[..., 2]
    return float(np.mean(lum))


def mad(a, b, box):
    ca, cb = crop(a, box), crop(b, box)
    return float(np.mean(np.abs(ca - cb)))


def analyze_blinks():
    n = 97
    frames = [load(f"{BLINKS_DIR}/frame_{i:05d}.png") for i in range(1, n + 1)]
    series = {
        "eyes": [luminance_mean(f, EYES_BOX) for f in frames],
        "greenEye": [luminance_mean(f, GREEN_EYE_BOX) for f in frames],
        "blueEye": [luminance_mean(f, BLUE_EYE_BOX) for f in frames],
    }
    # MAD of each eye box against frame 1 too (captures shape change, not just brightness)
    series["eyesMadVsF1"] = [mad(f, frames[0], EYES_BOX) for f in frames]
    with open(f"{OUT_DIR}/blinks-series.json", "w") as fh:
        json.dump(series, fh, indent=2)
    return series, n


def analyze_breathing():
    n = 81
    frames = [load(f"{BREATH_DIR}/frame_{i:05d}.png") for i in range(1, n + 1)]
    series = {
        "collarMadVsF1": [mad(f, frames[0], COLLAR_BOX) for f in frames],
        "faceMadVsF1": [mad(f, frames[0], (420, 20, 760, 400)) for f in frames],
    }
    with open(f"{OUT_DIR}/breathing-series.json", "w") as fh:
        json.dump(series, fh, indent=2)
    return series, n


if __name__ == "__main__":
    bseries, bn = analyze_blinks()
    print("=== idle-blinks: eyesMadVsF1 (per frame, 1-indexed) ===")
    for i, v in enumerate(bseries["eyesMadVsF1"], start=1):
        print(f"f{i:02d}: eyesMAD={v:6.2f}  eyesLum={bseries['eyes'][i-1]:6.2f}  green={bseries['greenEye'][i-1]:6.2f}  blue={bseries['blueEye'][i-1]:6.2f}")

    print()
    rseries, rn = analyze_breathing()
    print("=== idle-breathing: collarMadVsF1 / faceMadVsF1 (per frame, 1-indexed) ===")
    for i, (c, f) in enumerate(zip(rseries["collarMadVsF1"], rseries["faceMadVsF1"]), start=1):
        print(f"f{i:02d}: collarMAD={c:6.2f}  faceMAD={f:6.2f}")
