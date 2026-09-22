#!/usr/bin/env python
"""Vertical-shift (phase-correlation-style) estimate for the idle-breathing
collar/chest box: for each frame, find the vertical pixel offset dy (searched
in a small range) that best aligns its collar crop to frame 1's collar crop
(minimum MAD). A real breath should show dy rising then falling smoothly
(chest edge moves up on inhale, back down on exhale) rather than the noisy,
near-monotonic rise the raw same-position MAD showed.
"""
import json
import numpy as np
from PIL import Image

BREATH_DIR = "D:/Tools/pyrefly-video/flf/idle-breathing/1"
OUT_DIR = "C:/Users/ADMINI~1/AppData/Local/Temp/claude/D--Final-Fantasy/174911c6-80de-460f-ac03-e4631f17478b/scratchpad/pingpong"
COLLAR_BOX = (540, 360, 860, 620)
MOUTH_BOX = (548, 252, 642, 308)
EYES_BOX = (460, 140, 635, 285)


def load(path):
    return np.asarray(Image.open(path).convert("RGB"), dtype=np.float64)


def crop(arr, box):
    x0, y0, x1, y1 = box
    return arr[y0:y1, x0:x1]


def best_vertical_shift(ref, cur, box, max_shift=6):
    x0, y0, x1, y1 = box
    ref_c = ref[y0:y1, x0:x1]
    best_dy, best_mad = 0, None
    for dy in range(-max_shift, max_shift + 1):
        yy0, yy1 = y0 + dy, y1 + dy
        if yy0 < 0 or yy1 > cur.shape[0]:
            continue
        cur_c = cur[yy0:yy1, x0:x1]
        m = float(np.mean(np.abs(cur_c - ref_c)))
        if best_mad is None or m < best_mad:
            best_mad, best_dy = m, dy
    return best_dy, best_mad


def frame_to_frame_mad(frames, box, i):
    """MAD between frame i and i+1 (0-indexed), same-position (velocity proxy)."""
    return float(np.mean(np.abs(crop(frames[i], box) - crop(frames[i + 1], box))))


if __name__ == "__main__":
    n = 81
    frames = [load(f"{BREATH_DIR}/frame_{i:05d}.png") for i in range(1, n + 1)]
    ref = frames[0]

    dys, mads = [], []
    for i, f in enumerate(frames):
        dy, m = best_vertical_shift(ref, f, COLLAR_BOX)
        dys.append(dy)
        mads.append(m)

    print("=== idle-breathing: best-fit vertical shift dy (collar box) vs frame1, aligned MAD ===")
    for i in range(n):
        print(f"f{i+1:3d}: dy={dys[i]:+3d}  alignedMAD={mads[i]:6.2f}")

    # velocity proxy: frame-to-frame MAD (no vs-frame1) for collar, mouth, eyes
    vel = {
        "collar": [frame_to_frame_mad(frames, COLLAR_BOX, i) for i in range(n - 1)],
        "mouth": [frame_to_frame_mad(frames, MOUTH_BOX, i) for i in range(n - 1)],
        "eyes": [frame_to_frame_mad(frames, EYES_BOX, i) for i in range(n - 1)],
    }
    print()
    print("=== idle-breathing: frame-to-frame (velocity) MAD, frames 65-81 ===")
    print("f->f+1 | collar | mouth | eyes")
    for i in range(64, n - 1):
        print(f"{i+1:3d}->{i+2:3d} | {vel['collar'][i]:6.2f} | {vel['mouth'][i]:6.2f} | {vel['eyes'][i]:6.2f}")

    with open(f"{OUT_DIR}/breathing-shift.json", "w") as fh:
        json.dump({"dy": dys, "alignedMad": mads, "velocity": vel}, fh, indent=2)
