#!/usr/bin/env python
"""Per-frame global colour match, fit on pinned (non-moving) regions only.

judge-clip.md (commit d8770f0) found idle-blinks geometrically pinned
(phase correlation (0,0) every frame) but tonally drifting from frame 2
onward: a washed/desaturated grade, then a blown-out orange pop at f94-97.
The pinned regions it used to prove there's no motion -- body box and the
two background boxes -- are exactly the regions we can trust to carry only
grading, not motion, so we fit each frame's colour onto the plate using
only those regions, then apply the fitted transform to the whole frame.

Per channel c: fit a_c, b_c minimising sum (a_c * frame_c + b_c - plate_c)^2
over all pixels in the pinned regions (least squares / polyfit degree 1),
then corrected = clip(a_c * frame_c + b_c, 0, 255) applied to every pixel
in the frame, not just the pinned regions.
"""
import json
import numpy as np
from PIL import Image

PLATE_PATH = "D:/Tools/ComfyUI/ComfyUI/input/pyrefly-video-plate-f1efe21f6c75-1280x704.png"
BLINKS_DIR = "D:/Tools/pyrefly-video/flf/idle-blinks/1"
BREATH_DIR = "D:/Tools/pyrefly-video/flf/idle-breathing/1"
OUT_ROOT = "C:/Users/ADMINI~1/AppData/Local/Temp/claude/D--Final-Fantasy/174911c6-80de-460f-ac03-e4631f17478b/scratchpad/pingpong"

BOXES = {
    "face": (420, 20, 760, 400),
    "eyes": (460, 140, 635, 285),
    "greenEye": (468, 203, 546, 278),
    "blueEye": (548, 145, 626, 220),
    "mouth": (548, 252, 642, 308),
    "braid": (468, 278, 542, 402),
    "hairline": (436, 18, 724, 122),
    "body": (560, 400, 900, 690),
    "bgLeft": (0, 120, 330, 560),
    "bgRight": (950, 0, 1280, 500),
    "full": (0, 0, 1280, 704),
}
PINNED = ["body", "bgLeft", "bgRight"]


def load(path):
    return np.asarray(Image.open(path).convert("RGB"), dtype=np.float64)


def crop(arr, box):
    x0, y0, x1, y1 = box
    return arr[y0:y1, x0:x1]


def mad(a, b):
    return float(np.mean(np.abs(a - b)))


def saturation(a):
    mx = a.max(-1)
    mn = a.min(-1)
    return float(((mx - mn) / (mx + 1e-6)).mean())


def pinned_pixels(arr, boxes):
    return np.concatenate([crop(arr, boxes[name]).reshape(-1, 3) for name in PINNED], axis=0)


def fit_colour_match(frame, plate_pinned_px, boxes):
    """Fit per-channel (a,b) on pinned pixels; return corrected frame + params + residuals."""
    frame_pinned_px = pinned_pixels(frame, boxes)
    a = np.zeros(3)
    b = np.zeros(3)
    for c in range(3):
        x = frame_pinned_px[:, c]
        y = plate_pinned_px[:, c]
        A = np.vstack([x, np.ones_like(x)]).T
        coef, *_ = np.linalg.lstsq(A, y, rcond=None)
        a[c], b[c] = coef
    corrected = np.clip(frame * a + b, 0, 255)
    residual_before = mad(frame_pinned_px, plate_pinned_px)
    corrected_pinned_px = pinned_pixels(corrected, boxes)
    residual_after = mad(corrected_pinned_px, plate_pinned_px)
    return corrected, {"a": a.tolist(), "b": b.tolist(), "residualBefore": residual_before, "residualAfter": residual_after}


def process_clip(name, dirpath, n, plate):
    plate_pinned_px = pinned_pixels(plate, BOXES)
    frames = [load(f"{dirpath}/frame_{i:05d}.png") for i in range(1, n + 1)]
    corrected_frames = []
    params = []
    for f in frames:
        corr, p = fit_colour_match(f, plate_pinned_px, BOXES)
        corrected_frames.append(corr)
        params.append(p)

    # Save corrected PNGs
    import os
    outdir = f"{OUT_ROOT}/cm-frames/{name}"
    os.makedirs(outdir, exist_ok=True)
    for i, corr in enumerate(corrected_frames, start=1):
        Image.fromarray(corr.astype(np.uint8), "RGB").save(f"{outdir}/frame_{i:05d}.png")

    # Stats before/after per box vs plate, per frame
    stats = {"params": params, "boxMadVsPlate": {}, "saturation": {"before": [], "after": []},
             "stepFace": {"before": [], "after": []}, "stepFull": {"before": [], "after": []}}
    for boxname, box in BOXES.items():
        stats["boxMadVsPlate"][boxname] = {
            "before": [mad(crop(f, box), crop(plate, box)) for f in frames],
            "after": [mad(crop(c, box), crop(plate, box)) for c in corrected_frames],
        }
    for f, c in zip(frames, corrected_frames):
        stats["saturation"]["before"].append(saturation(f))
        stats["saturation"]["after"].append(saturation(c))
    for i in range(1, n):
        stats["stepFace"]["before"].append(mad(crop(frames[i], BOXES["face"]), crop(frames[i - 1], BOXES["face"])))
        stats["stepFace"]["after"].append(mad(crop(corrected_frames[i], BOXES["face"]), crop(corrected_frames[i - 1], BOXES["face"])))
        stats["stepFull"]["before"].append(mad(frames[i], frames[i - 1]))
        stats["stepFull"]["after"].append(mad(corrected_frames[i], corrected_frames[i - 1]))

    with open(f"{OUT_ROOT}/{name}-colour-match.json", "w") as fh:
        json.dump(stats, fh, indent=2)

    return frames, corrected_frames, stats


if __name__ == "__main__":
    plate = load(PLATE_PATH)
    print("Processing idle-blinks (97 frames)...")
    b_frames, b_corr, b_stats = process_clip("idle-blinks", BLINKS_DIR, 97, plate)
    print("Processing idle-breathing (81 frames)...")
    r_frames, r_corr, r_stats = process_clip("idle-breathing", BREATH_DIR, 81, plate)

    def summarize(name, stats, n):
        print(f"\n=== {name}: colour-match summary ===")
        resid_before = [p["residualBefore"] for p in stats["params"]]
        resid_after = [p["residualAfter"] for p in stats["params"]]
        print(f"pinned-region residual MAD: before median={np.median(resid_before):.2f} max={np.max(resid_before):.2f} | after median={np.median(resid_after):.2f} max={np.max(resid_after):.2f}")
        satb, sata = stats["saturation"]["before"], stats["saturation"]["after"]
        print(f"saturation: before f1={satb[0]:.3f} min={min(satb):.3f} max={max(satb):.3f} | after f1={sata[0]:.3f} min={min(sata):.3f} max={max(sata):.3f}")
        for k in ["face", "mouth", "full"]:
            bb, ba = stats["boxMadVsPlate"][k]["before"], stats["boxMadVsPlate"][k]["after"]
            print(f"{k} vs plate: before f1={bb[0]:.2f} fN={bb[-1]:.2f} max={max(bb):.2f} | after f1={ba[0]:.2f} fN={ba[-1]:.2f} max={max(ba):.2f}")
        sfb, sfa = stats["stepFace"]["before"], stats["stepFace"]["after"]
        sFb, sFa = stats["stepFull"]["before"], stats["stepFull"]["after"]
        print(f"stepFace: before median={np.median(sfb):.2f} max={np.max(sfb):.2f} | after median={np.median(sfa):.2f} max={np.max(sfa):.2f}")
        print(f"stepFull: before median={np.median(sFb):.2f} max={np.max(sFb):.2f} | after median={np.median(sFa):.2f} max={np.max(sFa):.2f}")

    summarize("idle-blinks", b_stats, 97)
    summarize("idle-breathing", r_stats, 81)
